import express from 'express';
import cors from 'cors';
import { timingSafeEqual } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export function frontendOrigins(env = process.env) {
  return [...new Set([
    ...(env.FRONTEND_ORIGINS || (env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:5173,http://localhost:5173')).split(',').map(value => value.trim()).filter(Boolean),
    ...(env.RENDER_EXTERNAL_URL ? [new URL(env.RENDER_EXTERNAL_URL).origin] : []),
  ])];
}

export function configureDeployment(app, env = process.env) {
  app.disable('x-powered-by');
  // Render terminates TLS at its reverse proxy; preserve per-client rate limits.
  if (env.RENDER === 'true') app.set('trust proxy', 1);
  const origins = frontendOrigins(env);
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('X-Frame-Options', 'DENY');
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    if (req.headers.origin && !origins.includes(req.headers.origin)) {
      return res.status(403).json({ error: 'This origin is not allowed.' });
    }
    next();
  });
  app.use(cors({ origin: origins }));
  // The existing prototype has no server-authenticated customer identities.
  // Never expose its legacy customer records/writes on the public internet.
  // This operator token is SERVER-ONLY and is not customer authentication.
  app.use('/api', (req, res, next) => {
    const privateRoute = /^\/orders(?:\/|$)/.test(req.path)
      || (req.method !== 'GET' && /^\/artisans(?:\/|$)/.test(req.path));
    if (env.NODE_ENV !== 'production' || !privateRoute) return next();
    const expected = env.LEGACY_API_TOKEN;
    const supplied = req.headers.authorization?.replace(/^Bearer /, '');
    if (!expected || expected.length < 32) return res.status(503).json({ error: 'Customer account authorization is not configured.' });
    if (!supplied || Buffer.byteLength(supplied) !== Buffer.byteLength(expected)
      || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
      return res.status(401).json({ error: 'Server authorization required.' });
    }
    next();
  });
}

export async function initializeData(serverDirectory, env = process.env) {
  const source = path.join(serverDirectory, 'data');
  const directory = env.DATA_DIR ? path.resolve(env.DATA_DIR) : source;
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  if (directory !== source) {
    for (const name of ['artisans.json', 'heritage_crafts.json', 'orders.json']) {
      // Seed an empty production order store, never the checked-in QA records.
      const data = name === 'orders.json' && env.NODE_ENV === 'production'
        ? '[]\n' : await fs.readFile(path.join(source, name));
      try { await fs.writeFile(path.join(directory, name), data, { flag: 'wx', mode: 0o600 }); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
    }
  }
  return directory;
}

export function serveFrontend(app, directory) {
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));
  app.use(express.static(directory, { index: false, setHeaders(res, filename) {
    if (filename.includes(`${path.sep}assets${path.sep}`)) res.set('Cache-Control', 'public, max-age=31536000, immutable');
    else res.set('Cache-Control', 'no-cache');
  } }));
  // Missing files must remain 404; only browser navigation gets the SPA shell.
  app.get('*', (req, res, next) => {
    if (path.extname(req.path) || !req.accepts('html')) return next();
    res.set('Cache-Control', 'no-cache').sendFile(path.join(directory, 'index.html'));
  });
}
