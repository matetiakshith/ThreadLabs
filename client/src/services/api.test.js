import test from 'node:test';import assert from 'node:assert/strict';
import { signIn,fetchSession,fetchCommissions,WorkspaceRequestError } from './api.js';

test('workspace API preserves credentials and exposes truthful transport, auth and server failures',async t=>{
 const original=globalThis.fetch;
 try{
  await t.test('credentials and selected role are sent to the existing endpoint',async()=>{
   let request;globalThis.fetch=async(url,options)=>{request={url,options};return Response.json({user:{role:'artisan'}})};
   assert.equal((await signIn({identity:'test',password:'test-only',role:'artisan'})).user.role,'artisan');assert.equal(request.url,'/api/auth/login');assert.equal(request.options.credentials,'include');assert.equal(JSON.parse(request.options.body).role,'artisan');
  });
  await t.test('empty gateway responses retain HTTP status and are not generic/fake success',async()=>{
   globalThis.fetch=async()=>new Response('',{status:502});await assert.rejects(fetchSession(),e=>e instanceof WorkspaceRequestError&&e.status===502&&e.message.includes('API is unavailable'));
  });
  await t.test('backend authentication/database errors are preserved',async()=>{
   for(const [status,message]of[[401,'Sign in to access this workspace.'],[503,'Phase 2 database migration is required.'],[500,'The request could not be completed.']]){globalThis.fetch=async()=>Response.json({error:message},{status});await assert.rejects(fetchSession(),e=>e.status===status&&e.message===message);}
  });
  await t.test('HTML success is rejected rather than becoming an empty workspace',async()=>{
   globalThis.fetch=async()=>new Response('<html>SPA fallback</html>',{status:200});await assert.rejects(fetchSession(),e=>e.code==='INVALID_RESPONSE');
  });
  await t.test('network errors and abort cancellation remain distinct',async()=>{
   globalThis.fetch=async()=>{throw new TypeError('fetch failed')};await assert.rejects(fetchSession(),e=>e.code==='NETWORK_ERROR');globalThis.fetch=async()=>{throw new DOMException('cancelled','AbortError')};await assert.rejects(fetchSession(),{name:'AbortError'});
  });
  await t.test('valid empty commissions are still legitimate JSON data',async()=>{globalThis.fetch=async()=>Response.json([]);assert.deepEqual(await fetchCommissions(),[]);});
 }finally{globalThis.fetch=original;}
});
