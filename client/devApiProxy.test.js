import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from 'vite';
import { createDevApiProxy } from './devApiProxy.js';

test('development proxy connects the selected API while retaining origin and cookie protections',async()=>{
 let upstreamOrigin;const requests=[];
 const upstream=http.createServer((req,res)=>{
  requests.push({host:req.headers.host,origin:req.headers.origin});
  if(req.headers.origin&&req.headers.origin!==upstreamOrigin){res.writeHead(403,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Origin rejected'}));}
  res.writeHead(200,{'Content-Type':'application/json','Set-Cookie':'threadlabs_session=test-only; Path=/; HttpOnly; Secure; SameSite=Lax; Domain=example.invalid'});res.end(JSON.stringify({ok:true}));
 });
 await new Promise(resolve=>upstream.listen(0,'127.0.0.1',resolve));upstreamOrigin=`http://127.0.0.1:${upstream.address().port}`;
 const vite=await createServer({configFile:false,appType:'custom',logLevel:'silent',server:{host:'127.0.0.1',port:0,proxy:{'/api':createDevApiProxy(upstreamOrigin)}}});await vite.listen();const base=`http://127.0.0.1:${vite.httpServer.address().port}`;
 try{
  const response=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'});
  assert.equal(response.status,200);assert.equal(requests.at(-1).origin,upstreamOrigin);assert.equal(requests.at(-1).host,new URL(upstreamOrigin).host);
  const cookie=response.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);assert.doesNotMatch(cookie,/Secure|Domain=/i);
  const hostile=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{Origin:'https://hostile.invalid','Content-Type':'application/json'},body:'{}'});assert.equal(hostile.status,403);assert.equal(requests.at(-1).origin,'https://hostile.invalid');
  await new Promise(resolve=>upstream.close(resolve));
  const unavailable=await fetch(`${base}/api/auth/me`);assert.equal(unavailable.status,503);assert.equal((await unavailable.json()).code,'API_UNAVAILABLE');
 }finally{await vite.close();if(upstream.listening)await new Promise(resolve=>upstream.close(resolve));}
});
test('proxy rejects credential-bearing, path-bearing and insecure remote targets',()=>{
 for(const target of['https://user:secret@example.invalid','https://example.invalid/api','http://example.invalid','https://example.invalid?token=secret'])assert.throws(()=>createDevApiProxy(target),{message:/must be an HTTPS origin/});
 assert.equal(createDevApiProxy().target,'http://127.0.0.1:5001');
});
