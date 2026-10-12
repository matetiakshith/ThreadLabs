import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { imageGenerationRouter } from './imageGeneration.js';
function request(router, {origin='http://127.0.0.1:5173',ip='qa',body={prompt:'white linen shirt'},method='POST',url='/generate-image'}={}) {
  return new Promise((resolve,reject)=>{
    const req=Object.assign(new EventEmitter(),{method,url,headers:{origin},ip,body});
    const res=Object.assign(new EventEmitter(),{statusCode:200,writableEnded:false,headers:{},set(name,value){this.headers[name]=value;return this;},status(value){this.statusCode=value;return this;},json(value){this.writableEnded=true;resolve({status:this.statusCode,body:value,headers:this.headers});}});
    router.handle(req,res,error=>error?reject(error):reject(new Error('Route did not respond')));
  });
}

test('actual image route returns actionable no-token error and capabilities without credentials',async()=>{
  const router=imageGenerationRouter({env:{}});
  const response=await request(router);assert.equal(response.status,503);assert.equal(response.body.code,'GENERATION_NOT_CONFIGURED');assert.equal(response.headers['Cache-Control'],'no-store');
  const config=await request(router,{method:'GET',url:'/image-capabilities'});assert.equal(config.body.model,'Qwen/Qwen-Image');assert.equal(config.body.configured,false);assert.ok(!('HF_TOKEN' in config.body));
});

test('foreign origins never reach generation',async()=>{
  const router=imageGenerationRouter({generate:()=>assert.fail('Generation must not run')});
  assert.equal((await request(router,{origin:'https://unrelated.example'})).status,403);
});

test('successful route passes the request abort signal and enforces request limits',async()=>{
  let count=0;
  const router=imageGenerationRouter({generate:async(body,{signal})=>{assert.ok(signal instanceof AbortSignal);assert.equal(body.prompt,'white linen shirt');count++;return {testFixtureOnly:true};}});
  for(let i=0;i<5;i++) assert.equal((await request(router)).status,200);
  const limited=await request(router);assert.equal(limited.status,429);assert.equal(limited.headers['Retry-After'],'60');assert.equal(count,5);
});
