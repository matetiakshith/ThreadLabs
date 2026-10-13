import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { AccountStore } from '../services/accountStore.js';
import { accountRoutes, commissionRoutes, hashPassword, verifyPassword } from './accounts.js';
import { validMeasurementPayload } from '../services/measurementValidation.js';
import { configureDeployment } from '../deployment.js';

test('real PostgreSQL schema and HTTP account/commission authorization', async t => {
  const db = new PGlite();
  const store = new AccountStore(null, {pool:{
    query: async (sql, values) => values ? db.query(sql,values) : (await db.exec(sql)).at(-1),
    end: ()=>db.close(),
  }});
  await store.initialize();
  const app = express();
  const origin = 'https://test.onrender.com';
  configureDeployment(app, {NODE_ENV:'production',RENDER_EXTERNAL_URL:origin});
  app.use(express.json());
  const auth = accountRoutes({store,env:{NODE_ENV:'production'}});
  app.use('/api/auth',auth.router);
  app.use('/api/commissions',commissionRoutes({store,requireUser:auth.requireUser,artisanIds:new Set(['art-001','art-002']),artisanProfiles:new Map([['art-001',{name:'Test Workshop',state:'Test State',location:'Test Location',phone:'+910000000000',rating:4}]]),validateMeasurements:validMeasurementPayload}));
  app.use((error,_req,res,_next)=>res.status(500).json({error:'Internal test failure',code:error.code}));
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.on('listening',resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const password = 'test-only-long-password';
  const call = async (url,{method='GET',body,cookie,omitOrigin=false}={}) => {
    const response = await fetch(base+url,{method,headers:{...(omitOrigin?{}:{Origin:origin}),...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')};
  };
  let customer,other,artisan,wrongArtisan,commission;
  try {
    await t.test('customers register securely; public artisan claims and originless writes fail',async()=>{
      assert.equal((await call('/auth/register',{method:'POST',body:{identity:'bad',password,role:'artisan'}})).status,400);
      assert.equal((await call('/auth/register',{method:'POST',body:{identity:'first',password,role:'customer'},omitOrigin:true})).status,403);
      customer=await call('/auth/register',{method:'POST',body:{identity:'first',password,role:'customer'}});
      other=await call('/auth/register',{method:'POST',body:{identity:'second',password,role:'customer'}});
      assert.equal(customer.status,200); assert.match(customer.cookie,/HttpOnly/); assert.match(customer.cookie,/Secure/); assert.match(customer.cookie,/SameSite=Lax/);
      assert.ok(!JSON.stringify(customer.body).includes('password'));
      const stored=await store.findAccount('first'); assert.notEqual(stored.password_hash,password); assert.equal(await verifyPassword(password,stored.password_hash),true);
      assert.equal((await call('/auth/login',{method:'POST',body:{identity:'first',password:'wrong',role:'customer'}})).status,401);
      assert.equal((await call('/auth/login',{method:'POST',body:{identity:'first',password,role:'artisan'}})).status,401);
      assert.equal((await call('/auth/me',{cookie:customer.cookie})).body.user.id,stored.id);
    });
    await t.test('operator provisioned artisan identity is server-owned',async()=>{
      for (const [identity,id] of [['maker','art-001'],['other-maker','art-002']]) {
        await store.createAccount({id:randomUUID(),identity,role:'artisan',artisan_id:id,password_hash:await hashPassword(password)});
      }
      artisan=await call('/auth/login',{method:'POST',body:{identity:'maker',password,role:'artisan',artisanId:'art-002'}});
      wrongArtisan=await call('/auth/login',{method:'POST',body:{identity:'other-maker',password,role:'artisan'}});
      assert.equal(artisan.body.user.artisanId,'art-001');
    });
    await t.test('customer measurements and commissions are private, validated and durable',async()=>{
      const payload={artisanId:'art-001',garments:[{name:'Linen shirt',fabric:'Linen',color:'White'}],deliveryMode:'pickup',measurements:{schemaVersion:1,unit:'cm',displayUnit:'cm',values:{chest:100},weight:null,desiredFit:'Regular',tailoringNotes:null},customerName:'spoofed',currentStageIndex:7};
      assert.equal((await call('/commissions',{method:'POST',body:payload})).status,401);
      assert.equal((await call('/commissions',{method:'POST',body:{...payload,measurements:{...payload.measurements,values:{chest:-100}}},cookie:customer.cookie})).status,400);
      commission=await call('/commissions',{method:'POST',body:payload,cookie:customer.cookie});
      assert.equal(commission.status,201);assert.equal(commission.body.customerName,'first');assert.equal(commission.body.currentStageIndex,0);
      assert.equal(commission.body.artisanName,'Test Workshop');assert.equal(commission.body.artisanPhone,'+910000000000');
      assert.equal((await call('/commissions',{cookie:other.cookie})).body.length,0);
      assert.equal((await call('/commissions',{cookie:wrongArtisan.cookie})).body.length,0);
      assert.equal((await call('/commissions',{cookie:artisan.cookie})).body[0].measurements.values.chest,100);
      await store.initialize();assert.equal((await store.listCommissions((await store.findAccount('first')))).length,1);
    });
    await t.test('only the assigned artisan can advance sequentially; decline is terminal',async()=>{
      const url=`/commissions/${commission.body.orderId}/status`;
      assert.equal((await call(url,{method:'PATCH',cookie:customer.cookie,body:{stageIndex:1,status:'Artisan Accepted'}})).status,403);
      assert.equal((await call(url,{method:'PATCH',cookie:wrongArtisan.cookie,body:{stageIndex:1,status:'Artisan Accepted'}})).status,409);
      assert.equal((await call(url,{method:'PATCH',cookie:artisan.cookie,body:{stageIndex:4,status:'Cutting'}})).status,409);
      assert.equal((await call(url,{method:'PATCH',cookie:artisan.cookie,body:{stageIndex:1,status:'Artisan Accepted'}})).status,200);
      assert.equal((await call(url,{method:'PATCH',cookie:artisan.cookie,body:{stageIndex:1,status:'Artisan Accepted'}})).status,409);
      for (const [stageIndex,status] of [[2,'Measurements Confirmed'],[3,'Fabric Ready'],[4,'Cutting'],[5,'Stitching & Assembly'],[6,'Quality & Steam Press'],[7,'Ready for Pickup']]) assert.equal((await call(url,{method:'PATCH',cookie:artisan.cookie,body:{stageIndex,status}})).status,200);
      assert.equal((await call(url,{method:'PATCH',cookie:artisan.cookie,body:{stageIndex:8,status:'Delivered'}})).status,409);
      const declined=await call('/commissions',{method:'POST',cookie:customer.cookie,body:{artisanId:'art-001',garments:[{name:'Shirt'}],deliveryMode:'delivery',measurements:null}});
      const declineUrl=`/commissions/${declined.body.orderId}/status`;
      assert.equal((await call(declineUrl,{method:'PATCH',cookie:artisan.cookie,body:{stageIndex:0,status:'Declined'}})).status,200);
      assert.equal((await call(declineUrl,{method:'PATCH',cookie:artisan.cookie,body:{stageIndex:1,status:'Artisan Accepted'}})).status,409);
    });
    await t.test('logout revokes persisted sessions',async()=>{
      assert.equal((await call('/auth/logout',{method:'POST',cookie:customer.cookie})).status,200);
      assert.equal((await call('/auth/me',{cookie:customer.cookie})).status,401);
    });
    await t.test('legacy JSON catalog persistence never reseeds existing PostgreSQL data',async()=>{
      await store.seedLegacy('artisans.json',[{id:'art-001',catalog:[]}]);
      await store.writeLegacy('artisans.json',[{id:'art-001',catalog:[{id:'test-catalog-piece'}]}]);
      await store.seedLegacy('artisans.json',[]);
      await store.initialize();
      assert.equal((await store.readLegacy('artisans.json'))[0].catalog[0].id,'test-catalog-piece');
    });
  } finally { await new Promise(resolve=>server.close(resolve)); await store.close(); }
});
