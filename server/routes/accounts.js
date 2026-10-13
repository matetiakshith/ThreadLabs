import { Router } from 'express';
import { validateProfile, uuid } from './phase2.js';
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const deriveKey = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
const cookieName = 'threadlabs_session';
const lifetime = 7 * 24 * 60 * 60 * 1000;
const publicUser = user => ({ id: user.id, identity: user.identity, role: user.role, artisanId: user.artisan_id || null });
const identityValue = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
export const productionStages = ['Request Placed', 'Artisan Accepted', 'Measurements Confirmed', 'Fabric Ready', 'Cutting', 'Stitching & Assembly', 'Quality & Steam Press'];

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const [salt, encoded] = stored.split(':');
  const key = await deriveKey(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const expected = Buffer.from(encoded, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}
function tokenFrom(req) {
  const value = (req.headers.cookie || '').split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(value || '') ? value : null;
}
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function accountRoutes({ store, phase2, env = process.env, fetchImpl = fetch } = {}) {
  const router = Router();
  const attempts = new Map();
  let activeLogins = 0;
  router.use((_req, res, next) => store ? next() : res.status(503).json({ error: 'Accounts require a configured DATABASE_URL. No account data has been saved.' }));
  router.use((req, res, next) => {
    if (env.NODE_ENV === 'production' && req.method !== 'GET' && !req.headers.origin) return res.status(403).json({ error: 'A browser origin is required.' });
    next();
  });
  const requireUser = asyncRoute(async (req, res, next) => {
    const token = tokenFrom(req);
    req.user = token ? await store.sessionAccount(hash(token)) : null;
    if (!req.user) return res.status(401).json({ error: 'Sign in to access this workspace.' });
    next();
  });
  const limit = (req, res, next) => {
    const now = Date.now();
    for (const [ip, item] of attempts) if (item.until < now) attempts.delete(ip);
    const item = attempts.get(req.ip) || { count: 0, until: now + 60000 };
    item.count++; attempts.set(req.ip, item);
    if (item.count > 10 || activeLogins >= 2) return res.status(429).set('Retry-After', '60').json({ error: 'Too many sign-in attempts. Try again in a minute.' });
    activeLogins++;
    let released = false;
    const release = () => { if (!released) { activeLogins--; released = true; } };
    res.once('finish', release); res.once('close', release);
    next();
  };
  const session = async (res, user) => {
    const token = randomBytes(32).toString('hex');
    await store.createSession(hash(token), user.id, new Date(Date.now() + lifetime));
    res.cookie(cookieName, token, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: lifetime });
    res.json({ user: publicUser(user) });
  };
  router.post('/register', limit, asyncRoute(async (req, res) => {
    const identity = identityValue(req.body.identity);
    const { password } = req.body;
    if (!/^[a-z0-9@._+\-]{3,120}$/.test(identity) || typeof password !== 'string' || password.length < 12 || password.length > 128) return res.status(400).json({ error: 'Use a valid email/username and a password of 12–128 characters.' });
    const role = req.body.role;
    if (!['customer','artisan'].includes(role)) return res.status(403).json({error:'Choose a valid workspace.'});
    const profile = role === 'artisan' ? validateProfile(req.body.profile || {}) : null;
    if (role === 'artisan' && (!phase2 || !profile || !profile.studioName || !profile.fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity))) return res.status(400).json({error:'Artisan signup requires an email, studio name, full name and the Phase 2 database migration.'});
    const user = { id: randomUUID(), identity, password_hash: await hashPassword(password), role, ...(role === 'artisan' ? {artisan_id:`art-${randomUUID()}`} : {}) };
    // A new artisan gets a new ID; it cannot claim an existing trusted workshop.
    try { if (role === 'artisan') await store.createArtisan(user,{...profile,published:false}); else await store.createAccount(user); }
    catch (error) { if (error.code === '23505') return res.status(409).json({ error: 'This account cannot be created. Try signing in.' }); throw error; }
    await session(res, user);
  }));
  router.post('/login', limit, asyncRoute(async (req, res) => {
    const identity = identityValue(req.body.identity);
    const { password, role } = req.body;
    if (!identity || identity.length > 120 || typeof password !== 'string' || password.length > 128) return res.status(400).json({ error: 'Enter your account identity and password.' });
    const user = await store.findAccount(identity);
    // Hash even absent identities to avoid a fast account-enumeration path.
    const dummy = '0'.repeat(32) + ':' + '0'.repeat(128);
    const valid = await verifyPassword(password, user?.password_hash || dummy);
    if (!user || !valid || user.role !== role) return res.status(401).json({ error: 'The account or password is incorrect for this workspace.' });
    await session(res, user);
  }));
  router.get('/reset-capabilities', (_req,res)=>res.json({available:!!(phase2 && env.RESEND_API_KEY && env.RESET_EMAIL_FROM && env.APP_URL)}));
  router.post('/forgot-password', limit, asyncRoute(async(req,res)=>{
    if (!phase2 || !env.RESEND_API_KEY || !env.RESET_EMAIL_FROM || !env.APP_URL) return res.status(503).json({error:'Verified email password reset is not configured. Contact the workspace operator.'});
    const identity=identityValue(req.body.identity);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity)||identity.length>120) return res.status(400).json({error:'Enter your account email.'});
    const user=await store.findAccount(identity);
    if(user) {
      const token=randomBytes(32).toString('hex');
      await store.pool.query('DELETE FROM threadlabs_password_resets WHERE account_id=$1 OR expires_at<NOW()',[user.id]);
      await store.pool.query('INSERT INTO threadlabs_password_resets(token_hash,account_id,expires_at) VALUES($1,$2,$3)',[hash(token),user.id,new Date(Date.now()+30*60*1000)]);
      const url=new URL(env.APP_URL); if(url.protocol!=='https:') throw new Error('Invalid application URL');
      url.search='';url.hash='';url.searchParams.set('reset',token);
      const response=await fetchImpl('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.RESET_EMAIL_FROM,to:[identity],subject:'Reset your ThreadLabs password',text:`Use this link within 30 minutes to reset your password: ${url.href}\nIf you did not request this, ignore this email.`})});
      if(!response.ok) await store.pool.query('DELETE FROM threadlabs_password_resets WHERE token_hash=$1',[hash(token)]);
    }
    // Never disclose whether an email has an account.
    res.json({message:'If that email has an account, a reset link will be sent when email delivery is available.'});
  }));
  router.post('/reset-password', limit, asyncRoute(async(req,res)=>{
    const {token,password}=req.body;
    if(!phase2||! /^[a-f0-9]{64}$/.test(token||'')||typeof password!=='string'||password.length<12||password.length>128) return res.status(400).json({error:'Use a valid reset link and a password of 12–128 characters.'});
    const passwordHash=await hashPassword(password);
    // One-use token consumption, password change and session revocation in one statement.
    const result=await store.pool.query(`WITH consumed AS (DELETE FROM threadlabs_password_resets WHERE token_hash=$1 AND expires_at>NOW() RETURNING account_id), changed AS (UPDATE threadlabs_accounts SET password_hash=$2 WHERE id IN (SELECT account_id FROM consumed) RETURNING id), revoked AS (DELETE FROM threadlabs_sessions WHERE account_id IN (SELECT id FROM changed)) SELECT id FROM changed`,[hash(token),passwordHash]);
    if(!result.rows.length) return res.status(400).json({error:'This reset link has expired or was already used.'});
    res.json({success:true});
  }));
  router.get('/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));
  router.post('/logout', asyncRoute(async (req, res) => {
    const token = tokenFrom(req);
    if (token) await store.deleteSession(hash(token));
    res.clearCookie(cookieName, { path: '/', httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production' });
    res.json({ success: true });
  }));
  return { router, requireUser: (req, res, next) => store ? requireUser(req, res, next) : res.status(503).json({ error: 'Accounts require a configured DATABASE_URL.' }) };
}

export function commissionRoutes({ store, requireUser, artisanIds, artisanProfiles = new Map(), resolveArtisan, designStore, validateMeasurements }) {
  const router = Router();
  router.use(requireUser);
  router.use((req, res, next) => req.method === 'GET' || req.headers.origin ? next() : res.status(403).json({ error: 'A browser origin is required.' }));
  router.get('/', asyncRoute(async (req, res) => res.json(await store.listCommissions(req.user))));
  router.get('/:id/design',asyncRoute(async(req,res)=>{
    const assigned=uuid(req.params.id)?await store.assignedDesign(req.user,req.params.id):null;
    if(!designStore||!assigned?.design_id)return res.status(404).json({error:'No saved fashion collection is attached to this commission.'});
    const design=await designStore.design({id:assigned.customer_id},assigned.design_id);
    if(!design)return res.status(404).json({error:'Assigned design not found.'});
    // Original reference photographs stay private; only generated views are shared.
    res.json({id:design.id,prompt:design.prompt,views:design.views,specification:{originalPrompt:design.prompt}});
  }));
  router.post('/', asyncRoute(async (req, res) => {
    if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only a customer can create a commission.' });
    const input = req.body;
    const resolvedArtisan=resolveArtisan?await resolveArtisan(input.artisanId):null;
    if ((!artisanIds.has(input.artisanId) && !resolvedArtisan) || !Array.isArray(input.garments) || input.garments.length < 1 || input.garments.length > 12
      || !['delivery', 'pickup'].includes(input.deliveryMode) || !validateMeasurements(input.measurements)) return res.status(400).json({ error: 'Choose an artisan, garments, delivery method and valid measurements.' });
    // Explicit allowlist: no customer IDs, stages, uploads or arbitrary fields.
    const payload = { orderId: randomUUID(), artisanId: input.artisanId, customerName: req.user.identity, status: productionStages[0], currentStageIndex: 0, createdAt: new Date().toISOString(), measurements: input.measurements, deliveryMode: input.deliveryMode };
    for (const key of ['garmentTitle','title','artisanName','artisanState','artisanLocation','artisanAvatar','lengthRequirement','style','fit','occasion','estimatedCost','estimatedCompletion','userPrompt']) {
      if (input[key] !== undefined && (typeof input[key] !== 'string' || input[key].length > (key === 'userPrompt' ? 6000 : 1000))) return res.status(400).json({ error: 'Invalid commission details.' });
      if (typeof input[key] === 'string') payload[key] = input[key];
    }
    for (const key of ['baseCost','totalCost','deliveryFee','artisanRating']) {
      if (input[key] !== undefined && (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < 0 || input[key] > 1e8)) return res.status(400).json({ error: 'Invalid commission amount.' });
      if (input[key] !== undefined) payload[key] = input[key];
    }
    const artisan = resolvedArtisan || artisanProfiles.get(input.artisanId);
    if (artisan) {
      payload.artisanName = artisan.name;
      payload.artisanState = artisan.state;
      payload.artisanLocation = artisan.location || artisan.region || '';
      payload.artisanAvatar = artisan.avatar;
      payload.artisanRating = artisan.rating;
      if(artisan.registered){delete payload.baseCost;delete payload.totalCost;delete payload.deliveryFee;payload.estimatedCompletion='Confirm with artisan';}
      payload.artisanPhone = artisan.phone || null;
    }
    if(input.designId!==undefined){if(!designStore||!uuid(input.designId)||!await designStore.design(req.user,input.designId))return res.status(400).json({error:'Choose a saved design from your own account.'});payload.designId=input.designId;}
    payload.garments = input.garments.map(item => ({ name: item.name, fabric: item.fabric, color: item.color }));
    if (payload.garments.some(item => Object.values(item).some(value => value !== undefined && (typeof value !== 'string' || value.length > 500)))) return res.status(400).json({ error: 'Invalid garment details.' });
    res.status(201).json(await store.createCommission(req.user, payload));
  }));
  router.patch('/:id/status', asyncRoute(async (req, res) => {
    if (req.user.role !== 'artisan') return res.status(403).json({ error: 'Only the assigned artisan can update production.' });
    if (!/^[a-f0-9-]{36}$/.test(req.params.id) || !Number.isInteger(req.body.stageIndex) || req.body.stageIndex < 0 || req.body.stageIndex > 8
      || ![...productionStages, 'Declined', 'Out for Delivery', 'Delivered', 'Ready for Pickup'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid production stage.' });
    const result = await store.updateCommission(req.user, req.params.id, req.body.stageIndex, req.body.status, productionStages);
    if (!result) return res.status(409).json({ error: 'This commission is unavailable or its stage has changed. Refresh the workspace.' });
    res.json(result);
  }));
  return router;
}
