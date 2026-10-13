import { Router } from 'express';
import { asyncRoute, protectedRouter, uuid } from './phase2.js';
import { assistantConfiguration, assistantReply } from '../services/beatleService.js';
export function beatleRoutes({store,accountStore,requireUser,env=process.env,reply=assistantReply}) {
  const router=Router();router.get('/capabilities',(_req,res)=>res.json(assistantConfiguration(env)));
  const privateRouter=protectedRouter(requireUser,store),attempts=new Map();let active=0;
  privateRouter.get('/conversation',asyncRoute(async(req,res)=>res.json({messages:await store.conversation(req.user)})));
  privateRouter.delete('/conversation',asyncRoute(async(req,res)=>{await store.deleteConversation(req.user);res.json({success:true});}));
  privateRouter.post('/reply',asyncRoute(async(req,res)=>{
    const {message,history=[],language='en',save=false,shareContext=false}=req.body;
    if(typeof message!=='string'||!message.trim()||message.length>6000||!['en','hi','te'].includes(language)||typeof save!=='boolean'||typeof shareContext!=='boolean'||!Array.isArray(history)||history.length>20||history.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>16000))return res.status(400).json({error:'Invalid assistant message.'});
    const now=Date.now();for(const [id,v] of attempts)if(now-v.start>60000)attempts.delete(id);
    const attempt=attempts.get(req.user.id)||{start:now,count:0};attempt.count++;attempts.set(req.user.id,attempt);
    if(attempt.count>(Number(env.ASSISTANT_RATE_LIMIT)||12)||active>=4)return res.status(429).set('Retry-After','60').json({error:'Please wait before asking another question.'});
    const context={page:['mall','needs','matching','orders','artisan','login'].includes(req.body.page)?req.body.page:'mall'};
    if(shareContext){
      if(req.user.role==='customer'&&typeof req.body.prompt==='string'&&req.body.prompt.length<=6000)context.garmentBrief=req.body.prompt;
      if(req.user.role==='artisan'){
        const profile=await store.profile(req.user);context.profile={studioName:profile.studioName,bio:profile.bio,specializations:profile.specializations,materials:profile.materials};
        if(req.body.commissionId){
          if(!uuid(req.body.commissionId))return res.status(400).json({error:'Invalid commission.'});
          const order=(await accountStore.listCommissions(req.user)).find(v=>v.orderId===req.body.commissionId);
          if(!order)return res.status(404).json({error:'Assigned design not found.'});
          // Omit identity, photographs and precise body measurements even with general context consent.
          context.assignedDesign={garments:order.garments,userPrompt:order.userPrompt,fit:order.fit,style:order.style,status:order.status,measurementFields:Object.keys(order.measurements?.values||{})};
        }
      }
    }
    active++;const controller=new AbortController();const cancel=()=>{if(!res.writableEnded)controller.abort();};req.on('aborted',cancel);res.on('close',cancel);
    try{
      const answer=await reply({message:message.trim(),history,context,role:req.user.role,language},{env,signal:controller.signal});
      if(save&&!controller.signal.aborted)await store.saveConversation(req.user,[...history,{role:'user',content:message},{role:'assistant',content:answer.reply}]);
      if(!controller.signal.aborted)res.json(answer);
    }catch(error){if(!controller.signal.aborted)res.status(error.status||502).json({error:error.status?error.message:'The assistant connection timed out or failed. Try again.'});}
    finally{active--;req.off('aborted',cancel);res.off('close',cancel);}
  }));router.use(privateRouter);return router;
}
