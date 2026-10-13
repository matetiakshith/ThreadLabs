import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { storageConfigured } from '../services/privateStorage.js';
export const asyncRoute = fn => (req,res,next) => Promise.resolve().then(()=>fn(req,res,next)).catch(next);
export const uuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value || '');
export function protectedRouter(requireUser,store) {
  const router=Router(); router.use(requireUser);
  router.use((req,res,next)=>store ? next() : res.status(503).json({error:'Phase 2 database migration is required.'}));
  router.use((req,res,next)=>req.method==='GET'||req.headers.origin ? next() : res.status(403).json({error:'A browser origin is required.'}));
  return router;
}
const string = (value,max) => typeof value==='string' && value.length<=max;
export function validateProfile(body) {
  const result={};
  for (const key of ['studioName','fullName','contact','city','state','bio']) {
    if(body[key]!==undefined) { if(!string(body[key],key==='bio'?2000:160)) return null; result[key]=body[key].trim(); }
  }
  for (const key of ['specializations','categories','materials','capabilities']) {
    if(body[key]!==undefined) { if(!Array.isArray(body[key])||body[key].length>20||body[key].some(v=>!string(v,100))) return null; result[key]=body[key].map(v=>v.trim()); }
  }
  if(body.experienceYears!==undefined) { if(!Number.isInteger(body.experienceYears)||body.experienceYears<0||body.experienceYears>80) return null; result.experienceYears=body.experienceYears; }
  if(body.published!==undefined){if(typeof body.published!=='boolean')return null;result.published=body.published;}
  return result;
}
export function profileRoutes({store,storage,requireUser,env=process.env}) {
  const router=protectedRouter(requireUser,store);
  router.get('/capabilities',(_req,res)=>res.json({uploads:storageConfigured(env)}));
  router.get('/me',asyncRoute(async(req,res)=>res.json({profile:await store.profile(req.user),portfolio:req.user.role==='artisan'?await store.portfolio(req.user):[]})));
  router.patch('/me',asyncRoute(async(req,res)=>{
    const profile=validateProfile(req.body); if(!profile) return res.status(400).json({error:'Invalid profile details.'});
    const merged={...await store.profile(req.user),...profile};
    if(merged.published && (req.user.role!=='artisan'||!merged.studioName||!merged.city||!merged.state))return res.status(400).json({error:'Add your studio name, city and state before publishing.'});
    res.json({profile:await store.saveProfile(req.user,merged)});
  }));
  router.use('/portfolio',(req,res,next)=>req.user.role==='artisan'?next():res.status(403).json({error:'Only artisans manage portfolios.'}));
  const details = body => string(body.title,160)&&body.title.trim()&&string(body.description||'',2000)&&string(body.category||'',100) ? {title:body.title.trim(),description:body.description||'',category:body.category||''}:null;
  router.post('/portfolio',asyncRoute(async(req,res)=>{
    const payload=details(req.body); if(!payload) return res.status(400).json({error:'Add a title and valid portfolio details.'});
    if((await store.portfolio(req.user)).length>=100) return res.status(409).json({error:'Your portfolio can contain up to 100 pieces.'});
    const mediaId=await storage.put(req.user,req.body.imageDataUrl,store),id=randomUUID();
    await store.addPortfolio(req.user,id,mediaId,payload); res.status(201).json({id,mediaId,...payload});
  }));
  router.patch('/portfolio/:id',asyncRoute(async(req,res)=>{
    const payload=details(req.body); if(!uuid(req.params.id)||!payload) return res.status(400).json({error:'Invalid portfolio details.'});
    if(!await store.editPortfolio(req.user,req.params.id,payload)) return res.status(404).json({error:'Portfolio piece not found.'}); res.json({id:req.params.id,...payload});
  }));
  router.delete('/portfolio/:id',asyncRoute(async(req,res)=>{
    if(!uuid(req.params.id)||!await store.deletePortfolio(req.user,req.params.id)) return res.status(404).json({error:'Portfolio piece not found.'}); res.json({success:true});
  }));
  return router;
}
export function mediaRoutes({store,storage,accountStore,requireUser}) {
  const router=protectedRouter(requireUser,store);
  router.get('/:id',asyncRoute(async(req,res)=>{
    const key=uuid(req.params.id)?await store.media(req.user,req.params.id)||await accountStore?.commissionedMedia(req.user,req.params.id):null;
    if(!key) return res.status(404).json({error:'Image not found.'});
    res.set('Content-Type','image/png').set('Cache-Control','private, no-store');
    if(req.query.download==='1') res.set('Content-Disposition',`attachment; filename="threadlabs-${req.params.id}.png"`);
    res.send(await storage.get(key));
  })); return router;
}
