import { Router } from 'express';
import { generateGarmentImage, imageConfiguration } from '../services/imageGenerationService.js';

export function imageGenerationRouter({ env = process.env, generate = generateGarmentImage } = {}) {
  const router = Router();
  const attempts = new Map();
  let active = 0;
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const allowed = (env.FRONTEND_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173').split(',').map(value => value.trim());
    if (req.headers.origin && !allowed.includes(req.headers.origin)) return res.status(403).json({ code: 'ORIGIN_DENIED', error: 'Image generation is not available from this origin.' });
    next();
  });
  router.get('/image-capabilities', (_req, res) => res.json(imageConfiguration(env)));
  router.post('/generate-image', async (req, res) => {
    const now = Date.now();
    for (const [key, value] of attempts) if (now - value.since > 60000) attempts.delete(key);
    const attempt = attempts.get(req.ip) || { since: now, count: 0 };
    attempt.count++; attempts.set(req.ip, attempt);
    if (attempt.count > 5 || active >= 2) return res.status(429).set('Retry-After', '60').json({ code: 'LOCAL_RATE_LIMIT', error: 'Please wait a minute before requesting another garment image.' });
    const controller = new AbortController();
    const cancel = () => { if (!res.writableEnded) controller.abort(); };
    req.on('aborted', cancel); res.on('close', cancel);
    active++;
    try {
      const result = await generate(req.body, { env, signal: controller.signal });
      if (!controller.signal.aborted) res.json(result);
    } catch (error) {
      // No upstream response bodies, tokens, prompts or customer images in logs.
      if (!controller.signal.aborted) res.status(error.status || 500).json({ code: error.code || 'GENERATION_FAILED', error: error.status ? error.message : 'Image generation could not complete. Please try again.' });
    } finally {
      active--; req.off('aborted', cancel); res.off('close', cancel);
    }
  });
  return router;
}
