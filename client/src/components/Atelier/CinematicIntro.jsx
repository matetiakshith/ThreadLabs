import { useEffect, useRef, useState } from 'react';
import { createScope, createTimeline, stagger } from 'animejs';
/** A short reveal of the existing wordmark and hero. Never blocks the existing entry flow. */
export default function CinematicIntro({root}) {
 const [done,setDone]=useState(()=>{try{return sessionStorage.getItem('threadlabsFirstThread')==='complete'||window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{return true;}});
 const finishRef=useRef(()=>{});
 useEffect(()=>{
  if(done||!root.current)return;
  let scope,timeout;const node=root.current;
  const finish=()=>{scope?.revert();try{sessionStorage.setItem('threadlabsFirstThread','complete');}catch{}setDone(true);};finishRef.current=finish;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce=event=>{if(event.matches)finish();};
  try {scope=createScope({root}).add(()=>{createTimeline({defaults:{ease:'out(3)'},onComplete:finish})
    .add('.campaign-brand .brand-glyph',{opacity:[0,1],y:[8,0],delay:stagger(25),duration:350},0)
    .add('.campaign-brand .brand-credit',{opacity:[0,1],duration:400},150)
    .add('.campaign-photo',{clipPath:['inset(0 0 7% 0)','inset(0 0 0% 0)'],opacity:[.6,1],duration:750},100)
    .add('.campaign-header nav',{opacity:[.45,1],duration:450},150);
   });timeout=setTimeout(finish,1600);
  }catch{finish();}
  preference.addEventListener('change',reduce);
  return()=>{clearTimeout(timeout);scope?.revert();preference.removeEventListener('change',reduce);};
 },[done,root]);
 return done?null:<button className="intro-skip intro-skip--quiet" onClick={()=>finishRef.current()}>Skip intro</button>;
}
