import { randomUUID, randomInt } from 'node:crypto';
import { protectedRouter, asyncRoute, uuid } from './phase2.js';
import { generateGarmentImage, imageConfiguration, validateImageRequest } from '../services/imageGenerationService.js';
import { storageConfigured } from '../services/privateStorage.js';
export const viewDefinitions = [
 ['hero','Hero','A single clear three-quarter garment hero view'],
 ['front','Front','A single straight-on front view of the exact master garment'],
 ['back','Back','A single straight-on back view of the exact master garment'],
 ['side','Side','A single side profile of the exact master garment'],
 ['detail','Fabric & detail','A close-up of the requested fabric and embroidery of the exact master garment'],
 ['styling','Styling','The same garment styled on a neutral mannequin; preserve its design'],
];
export function designRoutes({store,storage,requireUser,env=process.env,generate=generateGarmentImage}) {
  const router=protectedRouter(requireUser,store), attempts=new Map(); let active=0;
  router.use((req,res,next)=>req.user.role==='customer'?next():res.status(403).json({error:'Only customers generate and manage saved designs.'}));
  router.get('/',asyncRoute(async(req,res)=>res.json(await store.designs(req.user))));
  router.get('/:id',asyncRoute(async(req,res)=>{
    const design=uuid(req.params.id)?await store.design(req.user,req.params.id):null;
    if(!design)return res.status(404).json({error:'Design not found.'}); res.json(design);
  }));
  router.post('/',asyncRoute(async(req,res)=>{
    const request=validateImageRequest(req.body),config=imageConfiguration(env);
    if(!config.configured) return res.status(503).json({error:config.reason});
    if(!storageConfigured(env))return res.status(503).json({error:'Private image storage is required to save your fashion collection.'});
    const count=req.body.count ?? 5;
    if(!Number.isInteger(count)||count<1||count>6)return res.status(400).json({error:'Choose 1–6 images.'});
    if(count>1&&!config.supportsReference)return res.status(422).json({error:'This provider cannot preserve a master reference across views. Choose one image or configure image editing.'});
    // Store garment-only specification; never copy measurements or arbitrary client fields.
    const specification={};
    for(const key of ['title','style','fit','occasion'])if(typeof req.body.specification?.[key]==='string'&&req.body.specification[key].length<=500)specification[key]=req.body.specification[key];
    if(Array.isArray(req.body.specification?.garments)&&req.body.specification.garments.length<=12)specification.garments=req.body.specification.garments.map(item=>Object.fromEntries(['name','fabric','color'].filter(key=>typeof item?.[key]==='string'&&item[key].length<=500).map(key=>[key,item[key]])));
    const design={id:randomUUID(),prompt:request.prompt,specification:{...specification,originalPrompt:request.prompt,consistency:'Reference-conditioned concepts; geometry, lettering and hidden details require artisan review.'},seed:request.seed ?? (config.supportsSeed?randomInt(2147483647):null),views:viewDefinitions.slice(0,count).map(([id,label])=>({id,label,status:'queued'}))};
    if(request.imageDataUrl)design.specification.referenceMediaId=await storage.put(req.user,request.imageDataUrl,store);
    await store.createDesign(req.user,design);res.status(201).json(design);
  }));
  router.post('/:id/views/:viewId',asyncRoute(async(req,res)=>{
    const design=uuid(req.params.id)?await store.design(req.user,req.params.id):null;
    const view=design?.views.find(v=>v.id===req.params.viewId);
    if(!view)return res.status(404).json({error:'Design view not found.'});
    if(view.id==='hero'&&view.status==='ready')return res.status(409).json({error:'Start a new collection to change the master garment. Other views depend on it.'});
    if(view.id!=='hero'&&design.views[0].status!=='ready')return res.status(409).json({error:'Generate the master garment first.'});
    const now=Date.now();
    for(const [key,value] of attempts)if(now-value.start>3600000)attempts.delete(key);
    const attempt=attempts.get(req.user.id)||{start:now,count:0};attempt.count++;attempts.set(req.user.id,attempt);
    if(attempt.count>30||active>=2)return res.status(429).set('Retry-After','60').json({error:'Generation is busy or your hourly image limit was reached. Try again later.'});
    if(!await store.claimView(req.user,design.id,view.id))return res.status(409).json({error:'This view is already being generated.'});
    active++;const controller=new AbortController();const cancel=()=>{if(!res.writableEnded)controller.abort();};req.on('aborted',cancel);res.on('close',cancel);
    const previous={...view};
    try {
      const source=view.id==='hero'?design.specification.referenceMediaId:design.views[0].mediaId;
      let imageDataUrl;
      if(source){const key=await store.media(req.user,source);if(!key)throw new Error('Master image unavailable');imageDataUrl=`data:image/png;base64,${(await storage.get(key)).toString('base64')}`;}
      const [,,presentation]=viewDefinitions.find(v=>v[0]===view.id);
      const generated=await generate({prompt:design.prompt,presentation: view.id,imageDataUrl,...(design.seed!==null?{seed:design.seed}:{})},{env,signal:controller.signal});
      const mediaId=await storage.put(req.user,generated.imageDataUrl,store);
      const ready={id:view.id,label:view.label,status:'ready',mediaId,model:generated.model,provider:generated.provider,presentation};
      await store.finishView(req.user,design.id,ready);
      if(!controller.signal.aborted)res.json(ready);
    } catch(error) {
      const message=error.status?error.message:'Generation failed. You can retry this view.';
      // Keep the last good view if regeneration fails.
      await store.finishView(req.user,design.id,{...previous,status:previous.mediaId?'ready':'failed',error:message});
      if(!controller.signal.aborted)res.status(error.status||502).json({error:message});
    } finally {active--;req.off('aborted',cancel);res.off('close',cancel);}
  }));return router;
}
