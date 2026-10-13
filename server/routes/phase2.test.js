import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import sharp from 'sharp';
import { AccountStore } from '../services/accountStore.js';
import { Phase2Store, migratePhase2, phase2Ready, recoverySnapshotReady } from '../services/phase2Store.js';
import { PrivateStorage } from '../services/privateStorage.js';
import { accountRoutes,commissionRoutes } from './accounts.js';
import { profileRoutes,mediaRoutes } from './phase2.js';
import { designRoutes } from './designs.js';
import { beatleRoutes } from './beatle.js';
import { publishedArtisans,artisanDirectoryRoutes } from './artisanDirectory.js';
import { assistantReply,sanitizeAssistantOutput } from '../services/beatleService.js';
import { configureDeployment } from '../deployment.js';

test('Phase 2 PostgreSQL and HTTP integration, provider fixtures explicitly injected',async t=>{
 const db=new PGlite();const accountsStore=new AccountStore(null,{pool:{query:async(sql,values)=>values?db.query(sql,values):(await db.exec(sql)).at(-1),end:()=>db.close()}});
 await accountsStore.initialize();assert.equal(await phase2Ready(accountsStore),false);await migratePhase2(accountsStore);assert.equal(await phase2Ready(accountsStore),true);await migratePhase2(accountsStore);
 const store=new Phase2Store(accountsStore),app=express(),origin='https://qa.example';
 const objects=new Map();const env={NODE_ENV:'production',RENDER_EXTERNAL_URL:origin,HF_TOKEN:'fixture-only',OBJECT_STORAGE_URL:'https://fixture.supabase.co',OBJECT_STORAGE_KEY:'fixture-only',OBJECT_STORAGE_BUCKET:'private'};
 const storage=new PrivateStorage(env,async(url,options)=>{
   assert.equal(options.headers.Authorization,'Bearer fixture-only');const key=new URL(url).pathname;if(key.includes('/bucket/'))return Response.json({public:false});
   if(options.method==='POST'){objects.set(key,options.body);return new Response('{}',{status:200})}
   if(options.method==='DELETE'){objects.delete(key);return new Response('{}',{status:200})}
   return new Response(objects.get(key),{status:objects.has(key)?200:404,headers:{'Content-Type':'image/png'}});
 });
 configureDeployment(app,env);app.use(express.json({limit:'10mb'}));const auth=accountRoutes({store:accountsStore,phase2:store,env});app.use('/auth',auth.router);
 app.use('/profile',profileRoutes({store,storage,requireUser:auth.requireUser,env}));app.use('/media',mediaRoutes({store,storage,accountStore:accountsStore,requireUser:auth.requireUser}));app.use('/directory',artisanDirectoryRoutes({store}));
 const png=`data:image/png;base64,${(await sharp({create:{width:16,height:16,channels:3,background:'#eee'}}).png().toBuffer()).toString('base64')}`;
 const generation=[];let failGeneration=false;
 app.use('/designs',designRoutes({store,storage,requireUser:auth.requireUser,env,generate:async(body)=>{generation.push(body);if(failGeneration)throw Object.assign(new Error('Fixture provider unavailable'),{status:502});return {imageDataUrl:png,model:'fixture-model',provider:'test-fixture'}}}));
 const assistantRequests=[];
 app.use('/beatle',beatleRoutes({store,accountStore:accountsStore,requireUser:auth.requireUser,env,reply:async request=>{assistantRequests.push(request);return {reply:'Test fixture only',actions:request.role==='artisan'?['profile']:['needs']}}}));
 app.use('/commissions',commissionRoutes({store:accountsStore,requireUser:auth.requireUser,artisanIds:new Set(),designStore:store,resolveArtisan:async id=>(await publishedArtisans(store)).find(a=>a.id===id),validateMeasurements:()=>true}));
 app.use((err,_req,res,_next)=>res.status(err.status||500).json({error:err.message}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.on('listening',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(url,{method='GET',body,cookie}={})=>{const r=await fetch(base+url,{method,headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:r.headers.get('content-type')?.includes('json')?await r.json():await r.arrayBuffer(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const password='test-only-secure-password';let artisan,customer,other,design,piece,commission;
 try{
 await t.test('registration uses existing password/session system and cannot claim another artisan ID',async()=>{
   artisan=await call('/auth/register',{method:'POST',body:{identity:'maker@example.com',password,role:'artisan',artisanId:'art-001',profile:{studioName:'QA Studio',fullName:'QA Maker',published:true}}});assert.equal(artisan.status,200);assert.notEqual(artisan.body.user.artisanId,'art-001');assert.match(artisan.cookie,/threadlabs_session=/);
   assert.equal((await call('/directory')).body.length,0);
   customer=await call('/auth/register',{method:'POST',body:{identity:'buyer@example.com',password,role:'customer'}});other=await call('/auth/register',{method:'POST',body:{identity:'other@example.com',password,role:'customer'}});assert.equal(customer.status,200);
   assert.equal((await call('/profile/me')).status,401);assert.equal((await call('/auth/login',{method:'POST',body:{identity:'maker@example.com',password,role:'customer'}})).status,401);
 });
 await t.test('production rollout snapshot preserves existing accounts and remains immutable',async()=>{
   assert.equal(await recoverySnapshotReady(accountsStore),false);
   await migratePhase2(accountsStore,{backup:true});
   assert.equal(await recoverySnapshotReady(accountsStore),true);
   const first=(await accountsStore.pool.query("SELECT payload FROM threadlabs_rollout_backups WHERE name='phase2-baseline'")).rows[0].payload;
   assert.equal(first.accounts.length,3);assert.ok(first.accounts.some(a=>a.identity==='maker@example.com'));assert.equal(first.sessions.length,3);
   await migratePhase2(accountsStore,{backup:true});
   const second=(await accountsStore.pool.query("SELECT payload FROM threadlabs_rollout_backups WHERE name='phase2-baseline'")).rows[0].payload;
   assert.deepEqual(second,first);assert.equal((await accountsStore.findAccount('buyer@example.com')).id,customer.body.user.id);
 });
 await t.test('profiles persist; publishing exposes only reviewed studio fields',async()=>{
   const profile={city:'Bengaluru',state:'Karnataka',bio:'QA garment studio',contact:'private phone',specializations:['Linen'],materials:['Cotton'],experienceYears:4};
   assert.equal((await call('/profile/me',{method:'PATCH',cookie:artisan.cookie,body:profile})).status,200);
   assert.equal((await call('/profile/me',{method:'PATCH',cookie:artisan.cookie,body:{experienceYears:-1}})).status,400);
   assert.equal((await call('/profile/me',{method:'PATCH',cookie:artisan.cookie,body:{published:true}})).status,200);
   const listed=(await call('/directory')).body[0];assert.equal(listed.name,'QA Studio');assert.equal(listed.verified,false);assert.ok(!JSON.stringify(listed).includes('private phone'));assert.ok(!JSON.stringify(listed).includes('maker@example.com'));
   await migratePhase2(accountsStore);assert.equal((await call('/profile/me',{cookie:artisan.cookie})).body.profile.bio,profile.bio);
 });
 await t.test('public buckets are rejected before uploading photos',async()=>{
   let writes=0;const unsafe=new PrivateStorage(env,async(_url,options)=>{if(options.method==='POST')writes++;return Response.json({public:true});});
   await assert.rejects(unsafe.put(artisan.body.user,png,store),{status:503});assert.equal(writes,0);
 });
 await t.test('portfolio photos are decoded, persist privately, and cannot cross account boundaries',async()=>{
   assert.equal((await call('/profile/portfolio',{method:'POST',cookie:customer.cookie,body:{title:'No',imageDataUrl:png}})).status,403);
   piece=await call('/profile/portfolio',{method:'POST',cookie:artisan.cookie,body:{title:'Linen kurta',category:'Kurta',description:'Test photograph',imageDataUrl:png}});assert.equal(piece.status,201);
   assert.equal((await call(`/media/${piece.body.mediaId}`,{cookie:other.cookie})).status,404);
   assert.equal((await call(`/media/${piece.body.mediaId}`,{cookie:artisan.cookie})).status,200);
   assert.equal((await call(`/profile/portfolio/${piece.body.id}`,{method:'PATCH',cookie:artisan.cookie,body:{title:'Updated title',description:'Updated',category:'Kurta'}})).status,200);
   const freshStore=new Phase2Store(accountsStore);assert.equal((await freshStore.portfolio(artisan.body.user))[0].title,'Updated title');
 });
 await t.test('new published artisans receive commissions with server-owned details and no fake prices',async()=>{
   commission=await call('/commissions',{method:'POST',cookie:customer.cookie,body:{artisanId:artisan.body.user.artisanId,garments:[{name:'Linen kurta'}],deliveryMode:'pickup',measurements:null,userPrompt:'Ivory linen kurta',baseCost:100,artisanName:'spoofed'}});
   assert.equal(commission.status,201);assert.equal(commission.body.artisanName,'QA Studio');assert.ok(!('baseCost' in commission.body));assert.equal((await call('/commissions',{cookie:artisan.cookie})).body.length,1);
 });
 await t.test('collection generates master first, conditions later views, persists and retries safely',async()=>{
   assert.equal((await call('/designs',{method:'POST',cookie:artisan.cookie,body:{prompt:'shirt'}})).status,403);
   design=await call('/designs',{method:'POST',cookie:customer.cookie,body:{prompt:'Ivory linen kurta, embroidery on the back',count:3,measurements:{chest:100},seed:42}});assert.equal(design.status,201);assert.ok(!JSON.stringify(design.body).includes('chest'));
   const url=`/designs/${design.body.id}/views/`;
   assert.equal((await call(url+'back',{method:'POST',cookie:customer.cookie,body:{}})).status,409);
   assert.equal((await call(url+'hero',{method:'POST',cookie:customer.cookie,body:{}})).status,200);
   assert.equal((await call(url+'front',{method:'POST',cookie:customer.cookie,body:{}})).status,200);
   assert.equal(generation[0].imageDataUrl,undefined);assert.match(generation[1].imageDataUrl,/^data:image\/png/);assert.equal(generation[1].seed,42);assert.equal(generation[1].prompt,design.body.prompt);assert.equal(generation[1].presentation,'front');
   failGeneration=true;assert.equal((await call(url+'back',{method:'POST',cookie:customer.cookie,body:{}})).status,502);assert.equal((await call(`/designs/${design.body.id}`,{cookie:customer.cookie})).body.views[2].status,'failed');
   failGeneration=false;assert.equal((await call(url+'back',{method:'POST',cookie:customer.cookie,body:{}})).status,200);
   failGeneration=true;assert.equal((await call(url+'front',{method:'POST',cookie:customer.cookie,body:{}})).status,502);const saved=(await call(`/designs/${design.body.id}`,{cookie:customer.cookie})).body;assert.equal(saved.views[1].status,'ready');assert.ok(saved.views[1].mediaId);
   assert.equal((await call(url+'hero',{method:'POST',cookie:customer.cookie,body:{}})).status,409);assert.equal((await call(`/designs/${design.body.id}`,{cookie:other.cookie})).status,404);
   await migratePhase2(accountsStore);assert.equal((await store.design(customer.body.user,design.body.id)).views[2].status,'ready');
 });
 await t.test('generated views share only with the customer and explicitly assigned artisan',async()=>{
   const shared=await call('/commissions',{method:'POST',cookie:customer.cookie,body:{artisanId:artisan.body.user.artisanId,garments:[{name:'Kurta'}],deliveryMode:'pickup',designId:design.body.id}});
   assert.equal(shared.status,201);
   const assigned=await call(`/commissions/${shared.body.orderId}/design`,{cookie:artisan.cookie});assert.equal(assigned.status,200);assert.ok(!('referenceMediaId' in assigned.body.specification));
   assert.equal((await call(`/commissions/${shared.body.orderId}/design`,{cookie:other.cookie})).status,404);
   assert.equal((await call(`/media/${assigned.body.views[0].mediaId}`,{cookie:artisan.cookie})).status,200);
   assert.equal((await call(`/media/${assigned.body.views[0].mediaId}`,{cookie:other.cookie})).status,404);
   assert.equal((await call('/commissions',{method:'POST',cookie:other.cookie,body:{artisanId:artisan.body.user.artisanId,garments:[{name:'Kurta'}],deliveryMode:'pickup',designId:design.body.id}})).status,400);
 });
 await t.test('assistant uses authenticated role, requires context consent and excludes sensitive fields',async()=>{
   const body={message:'Help with construction',role:'customer',prompt:'private garment',measurements:{chest:100},commissionId:commission.body.orderId,language:'te'};
   assert.equal((await call('/beatle/reply',{method:'POST',body})).status,401);
   assert.equal((await call('/beatle/reply',{method:'POST',cookie:artisan.cookie,body})).status,200);assert.equal(assistantRequests.at(-1).role,'artisan');assert.ok(!('profile' in assistantRequests.at(-1).context));
   assert.equal((await call('/beatle/reply',{method:'POST',cookie:artisan.cookie,body:{...body,shareContext:true,save:true}})).status,200);
   const context=assistantRequests.at(-1).context;assert.equal(context.assignedDesign.userPrompt,'Ivory linen kurta');assert.ok(!JSON.stringify(context).includes('private phone'));assert.ok(!JSON.stringify(context).includes('chest'));assert.equal(assistantRequests.at(-1).language,'te');
   assert.equal((await call('/beatle/conversation',{cookie:artisan.cookie})).body.messages.length,2);assert.equal((await call('/beatle/conversation',{cookie:other.cookie})).body.messages.length,0);
   assert.equal((await call('/beatle/conversation',{method:'DELETE',cookie:artisan.cookie})).status,200);assert.equal((await call('/beatle/conversation',{cookie:artisan.cookie})).body.messages.length,0);
   assert.deepEqual(sanitizeAssistantOutput({reply:'Safe',actions:['orders','profile','executeJavaScript'],draftPrompt:'garment',draftBio:'bio'},'artisan'),{reply:'Safe',actions:['profile'],draftBio:'bio'});
   await assert.rejects(assistantReply({message:'Hello',role:'customer'},{env:{}}),{status:503});
 });
 await t.test('verified reset tokens expire, are one-use, change the password and revoke sessions',async()=>{
   const token='a'.repeat(64),expired='b'.repeat(64),hash=value=>createHash('sha256').update(value).digest('hex');
   await accountsStore.pool.query('INSERT INTO threadlabs_password_resets(token_hash,account_id,expires_at) VALUES($1,$2,$3)',[hash(expired),other.body.user.id,new Date(Date.now()-1000)]);
   assert.equal((await call('/auth/reset-password',{method:'POST',body:{token:expired,password:'new-test-only-password'}})).status,400);
   await accountsStore.pool.query('INSERT INTO threadlabs_password_resets(token_hash,account_id,expires_at) VALUES($1,$2,$3)',[hash(token),other.body.user.id,new Date(Date.now()+60000)]);
   assert.equal((await call('/auth/reset-password',{method:'POST',body:{token,password:'new-test-only-password'}})).status,200);
   assert.equal((await call('/auth/reset-password',{method:'POST',body:{token,password:'new-test-only-password'}})).status,400);
   assert.equal((await call('/auth/me',{cookie:other.cookie})).status,401);
   assert.equal((await call('/auth/login',{method:'POST',body:{identity:'other@example.com',password:'new-test-only-password',role:'customer'}})).status,200);
 });
 await t.test('portfolio removal and signout revoke access; missing email configuration is honest',async()=>{
   assert.equal((await call(`/profile/portfolio/${piece.body.id}`,{method:'DELETE',cookie:artisan.cookie})).status,200);assert.equal((await store.portfolio(artisan.body.user)).length,0);
   assert.equal((await call('/auth/forgot-password',{method:'POST',body:{identity:'maker@example.com'}})).status,503);
   assert.equal((await call('/auth/logout',{method:'POST',cookie:artisan.cookie})).status,200);assert.equal((await call('/profile/me',{cookie:artisan.cookie})).status,401);
 });
 }finally{await new Promise(resolve=>server.close(resolve));await accountsStore.close();}
});
