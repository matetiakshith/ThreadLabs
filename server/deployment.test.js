import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { configureDeployment, initializeData, serveFrontend } from './deployment.js';

test('production serves nested SPA routes, preserves API/file 404s, rejects foreign origins and protects legacy records', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'threadlabs-spa-'));
  await fs.writeFile(path.join(directory,'index.html'), '<h1>ThreadLabs test shell</h1>');
  const app = express();
  configureDeployment(app, { NODE_ENV:'production', RENDER_EXTERNAL_URL:'https://test.onrender.com' });
  app.get('/api/health', (_req,res)=>res.json({status:'ok'}));
  app.get('/api/orders', (_req,res)=>res.json([{private:true}]));
  serveFrontend(app, directory);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve=>server.on('listening',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(`${base}/api/health`); assert.equal(health.status,200); assert.equal(health.headers.get('x-powered-by'),null);
    assert.equal((await fetch(`${base}/api/health`,{headers:{Origin:'https://foreign.example'}})).status,403);
    assert.equal((await fetch(`${base}/api/health`,{headers:{Origin:'https://test.onrender.com'}})).status,200);
    assert.equal((await fetch(`${base}/api/orders`)).status,503);
    assert.equal((await fetch(`${base}/api/unknown`)).status,404);
    assert.equal((await fetch(`${base}/missing.js`)).status,404);
    const nested = await fetch(`${base}/studio/board`, {headers:{Accept:'text/html'}}); assert.equal(nested.status,200); assert.match(await nested.text(),/test shell/);
  } finally { await new Promise(resolve=>server.close(resolve)); await fs.rm(directory,{recursive:true,force:true}); }
});

test('production disk initialization excludes QA orders and preserves existing data on restart', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(),'threadlabs-data-'));
  try {
    const env = {NODE_ENV:'production',DATA_DIR:directory};
    await initializeData(new URL('.',import.meta.url).pathname, env);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(directory,'orders.json'),'utf8')),[]);
    await fs.writeFile(path.join(directory,'orders.json'),'[{"id":"real-test-order"}]');
    await initializeData(new URL('.',import.meta.url).pathname, env);
    assert.equal(JSON.parse(await fs.readFile(path.join(directory,'orders.json'),'utf8'))[0].id,'real-test-order');
  } finally { await fs.rm(directory,{recursive:true,force:true}); }
});
