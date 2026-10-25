import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createFabricScene } from './fabricScene';
import './storyboard.css';
import LuxuryCTA from './LuxuryCTA';
import ThemeToggle from '../ui/ThemeToggle';
import TextileAtmosphere from './TextileAtmosphere';
import { textileImage, updateTextileAtmosphere } from './textileAtmosphereMotion.js';
import './textile-world.css';
import './cinematic-2.css';
import ArtisanEditorial from './ArtisanEditorial';
import ArtisanNetwork from './ArtisanNetwork';
import { animateEditorial } from './editorialMotion';
import './editorial-refinement.css';
gsap.registerPlugin(ScrollTrigger);
function Fabric({final=false,sceneRef}) {
 const canvas=useRef(null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{let scene;try{scene=createFabricScene(canvas.current,{final});if(sceneRef)sceneRef.current=scene;}catch{queueMicrotask(()=>setFailed(true));}return()=>{scene?.dispose();if(sceneRef)sceneRef.current=null;};},[final,sceneRef]);
 return <><canvas className="story-fabric" ref={canvas} aria-hidden="true"/>{failed&&<div className="story-fabric-fallback" aria-hidden="true"/>}</>;
}
export default function StoryboardExperience({onEnterApp,onCollection}){
 const root=useRef(null),scene=useRef(null);
 useEffect(()=>{
  const el=root.current,hero=el.querySelector('.story-hero'),copy=el.querySelector('.story-wordmark'),thread=el.querySelector('.story-thread path'),spark=el.querySelector('.story-spark'),approach=el.querySelector('.story-approach'),cue=el.querySelector('.story-scroll');
  const mm=gsap.matchMedia();let trigger;
  mm.add('(prefers-reduced-motion: no-preference)',()=>{
   const state={p:0};
   const render=()=>{
    const p=state.p;scene.current?.setProgress(p);updateTextileAtmosphere(el,p);
    const orb=Math.max(0,Math.min(1,p-3));const leave=Math.max(0,p-5);
    copy.style.transform=`translate(-50%, ${orb*window.innerHeight*.25-leave*window.innerHeight*.22}px)`;
    const brandExit=Math.min(1,leave/.35);
    copy.style.opacity=1-brandExit;copy.style.clipPath=`inset(0 0 ${brandExit*100}% 0)`;copy.style.visibility=p>=6?'hidden':'visible';
    const amp=p<1?p*8:p<3?8+(p-1)*37:Math.max(0,82*(4-p));
    thread.setAttribute('d',`M 150 0 C ${150-amp} 90 ${150+amp} 105 150 160 S ${150-amp*2} 260 150 340 S ${150+amp*2} 420 150 500`);
    thread.style.opacity=1-leave;
    spark.style.opacity=Math.max(0,1-(p-1));cue.style.opacity=Math.max(0,1-p*2);
    const approachProgress=Math.max(0,Math.min(1,(leave-.28)/.72));
    const reveal=1-Math.pow(1-approachProgress,3);
    el.querySelector('.story-approach-copy').style.clipPath=`inset(0 0 ${(1-reveal)*100}% 0)`;
    approach.style.transform=`translateY(${(1-reveal)*38}vh)`;approach.style.opacity=reveal;
    el.querySelectorAll('.story-features button').forEach((tile,i)=>{const t=Math.max(0,Math.min(1,(leave-i*.09)/.72));tile.style.transform=`translateY(${(1-t)*45}px)`;tile.style.opacity=t;});approach.style.visibility=approachProgress>0?'visible':'hidden';
    if(import.meta.env.DEV&&window.__threadlabsStoryboard)window.__threadlabsStoryboard.progress=p;
   };
   const tween=gsap.to(state,{p:6,ease:'none',onUpdate:render,scrollTrigger:{refreshPriority:1,trigger:hero,start:'top top',end:()=>`+=${innerHeight*2.8}`,pin:true,scrub:true,invalidateOnRefresh:true,onRefresh:self=>{state.p=self.progress*6;render();}}});trigger=tween.scrollTrigger;render();return()=>tween.kill();
  });
  mm.add('(prefers-reduced-motion: reduce)',()=>{scene.current?.setProgress(0);updateTextileAtmosphere(el,0);copy.style.transform='translateX(-50%)';copy.style.opacity=1;copy.style.clipPath='none';copy.style.visibility='visible';el.querySelector('.story-approach-copy').style.clipPath='none';thread.style.opacity=1;thread.setAttribute('d','M150 0V500');spark.style.opacity=1;el.querySelectorAll('.story-features button').forEach(tile=>{tile.style.transform='none';tile.style.opacity=1;});});
  if(import.meta.env.DEV)window.__threadlabsStoryboard={progress:0,jump(n){if(n<=7&&trigger)window.scrollTo({top:trigger.start+(n-1)/6*(trigger.end-trigger.start),behavior:'instant'});else el.querySelector(n===8?'#story-artisans':n===9?'#story-network':n===10?'#story-start':'.story-approach')?.scrollIntoView({behavior:'instant'});},checkpoints:10,scrollViewports:2.8};
  mm.add('(prefers-reduced-motion: no-preference)',()=>animateEditorial(el));
  const refreshFrame=requestAnimationFrame(()=>{ScrollTrigger.sort();ScrollTrigger.refresh();});
  const refreshImages=()=>ScrollTrigger.refresh();
  const images=[...el.querySelectorAll('img')];
  images.forEach(image=>image.addEventListener('load',refreshImages,{once:true}));
  return()=>{images.forEach(image=>image.removeEventListener('load',refreshImages));cancelAnimationFrame(refreshFrame);mm.revert();delete window.__threadlabsStoryboard;};
 },[]);
 const goApproach=e=>{e.preventDefault();const t=ScrollTrigger.getAll().find(t=>t.trigger===root.current?.querySelector('.story-hero'));const target=root.current?.querySelector('.story-approach');if(t)window.scrollTo({top:t.end,behavior:'instant'});else target?.scrollIntoView();requestAnimationFrame(()=>target?.focus({preventScroll:true}));};
 return <div className="story" ref={root}>
  <a className="story-skip" href="#story-approach" onClick={goApproach}>Skip animation</a>
  <header className="story-header"><button className="story-logo" onClick={()=>window.scrollTo({top:0,behavior:'instant'})}>ThreadLabs</button><nav aria-label="Main navigation"><button onClick={onCollection}>Product</button><a href="#story-approach" onClick={goApproach}>Solutions</a><a href="#story-artisans">Artisans</a><a href="#story-start">Pricing</a></nav><button className="story-button" onClick={onEnterApp}>Get Started</button><ThemeToggle/></header>
  <main>
   <section className="story-hero" aria-label="From a single thread to a world of possibility">
    <TextileAtmosphere/>
    <svg className="story-thread" viewBox="0 0 300 500" preserveAspectRatio="none" aria-hidden="true"><path d="M150 0V500" fill="none" stroke="#b56c37" strokeWidth=".55"/></svg>
    <Fabric sceneRef={scene}/><span className="story-spark" aria-hidden="true">✦</span>
    <div className="story-wordmark"><h1>THREADLABS</h1><p>Your imagination,<br/>engineered into fashion.</p></div>
    <div className="story-scroll">Scroll to explore<span>↓</span></div>
    <section className="story-approach" id="story-approach" tabIndex={-1}><div className="story-approach-copy"><span className="story-eyebrow">OUR APPROACH</span><h2>From Ideas<br/>to Real Garments</h2><p>We combine AI with the craftsmanship of India’s artisans to turn your imagination into real, wearable fashion.</p></div><div className="story-features">{[['04-embroidered-fabric','Design','with AI'],['03-woven-orb','Connect','with Artisans'],['05-fashion-editorial','Wear','Your Story']].map(([image,a,b])=><button key={a} onClick={onEnterApp}><span className="story-material-swatch" aria-hidden="true"><img src={textileImage(image)} alt="" loading="lazy"/></span>{a}<br/>{b}</button>)}</div></section>
   </section>
   <ArtisanEditorial/>
   <ArtisanNetwork onExplore={onEnterApp}/>
   <LuxuryCTA onEnterApp={onEnterApp}/>
  </main>
 </div>;
}
