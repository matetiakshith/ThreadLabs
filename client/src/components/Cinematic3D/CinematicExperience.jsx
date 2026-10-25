import { useEffect, useRef, useState } from 'react';
import { createTimeline } from 'animejs';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDown, Volume2, VolumeX } from 'lucide-react';
import useReducedMotion from '../Measurements/useReducedMotion';
import { createScrollController } from './scrollController';
import { evaluateTimeline, chapters, DURATION } from './timeline';
import { photographs } from './photography';
import './cinematic.css';

const copy = [
 ['A LIVING ATELIER. ROOTED IN CRAFT.',<>Made to be<br/><em>worn by you.</em></>,'Your imagination, engineered into fashion.','From the first spark of an idea to the hands that make it real.'],
 ['01 — THE WORK OF HUMAN HANDS',<>An idea.<br/><em>A human touch.</em></>,'Technology imagines. Craft gives it soul.','A considered gesture. A practiced hand. A small beginning with endless possibilities.'],
 ['02 — THE IDEA UNFOLDS',<>Every layer.<br/><em>A little wonder.</em></>,'Look closer. There is a world in every stitch.','Wood, linen, paper, thread. Ordinary materials, brought together with extraordinary care.'],
 ['03 — FROM SKETCH TO STITCH',<>What if<br/><em>becomes what’s next.</em></>,'Start with a voice, a sketch, a photograph or an idea.','ThreadLabs helps bring your vision into focus, ready for the hands that know how to make it.'],
 ['04 — INSIDE THE ATELIER',<>A place for<br/><em>possibility.</em></>,'Tradition. Craft. Tomorrow.','Tools worn smooth. Cloth waiting to be cut. A space where imagination becomes something you can hold.'],
 ['05 — THE HUMAN BEHIND THE CRAFT',<>Extraordinary<br/><em>hands.</em></>,'Behind every piece, a person.','Meet the tailors, weavers and makers carrying Indian craftsmanship forward. Create with them, from the first conversation to the final stitch.'],
 ['06 — CRAFT BECOMES FASHION',<>Made of stories.<br/><em>Made for yours.</em></>,'From a single stitch to something entirely your own.','Your design. Your measurements. A shared journey with the artisan who brings it to life.'],
 ['07 — FROM IMAGINATION TO HEIRLOOM',<>Your imagination.<br/><em>Made tangible.</em></>,'Engineered into fashion. Crafted by human hands.','A living atelier for a new generation of ideas and generations of extraordinary craft.'],
];
function Credit({photo}) { return <><a href={`https://commons.wikimedia.org/wiki/File:${photo.file}`} target="_blank" rel="noreferrer">{photo.author}</a> · <a href={`https://creativecommons.org/licenses/by-sa/${photo.license}/`} target="_blank" rel="noreferrer">CC BY-SA {photo.license}</a></>; }
export default function CinematicExperience({onEnterApp,onCollection,isMuted,onToggleSound}) {
 const shell=useRef(null),canvas=useRef(null),[unavailable,setUnavailable]=useState(false),[loading,setLoading]=useState(true);
 const reduced=useReducedMotion(),fallback=reduced||unavailable;
 useEffect(()=>{
  if(fallback)return;
  const node=shell.current,surface=canvas.current;
  let alive=true,controller,scene,animation;
  const lost=e=>{e.preventDefault();setUnavailable(true);};surface.addEventListener('webglcontextlost',lost);
  const start=async()=>{
   try {
    const {createCraftScene}=await import('./craftScene');if(!alive)return;
    scene=createCraftScene(surface,()=>controller?.invalidate());
    animation=createTimeline({autoplay:false,defaults:{ease:'linear'}});
    const layers=chapters.map((chapter,i)=>{
     const el=node.querySelector(`[data-scene="${chapter.id}"]`);
     if(i>0)animation.add(el,{opacity:[0,1],translateY:[14,0],duration:1250},chapter.start*1000+350);
     if(i<7)animation.add(el,{opacity:[1,0],translateY:[0,-10],duration:900},(chapter.end-1.1)*1000);
     return {el,chapter};
    });
    const marker=node.querySelector('.journey-thread path');
    animation.add(marker,{strokeDashoffset:[440,0],duration:DURATION*1000},0);
    const label=node.querySelector('.cinematic-chapter'),progressBar=node.querySelector('.cinematic-progress-fill');
    const dots=[...node.querySelectorAll('.cinematic-chapter-nav button')];let previousChapter=-1;
    controller=createScrollController({shell:node,render:(progress,dt)=>{
     const state=evaluateTimeline(progress);animation.seek(state.time*1000,true);
     for(const {el,chapter} of layers){const active=state.time>=chapter.start && (state.time<chapter.end || chapter.id==='reveal');el.inert=!active;el.style.visibility=active?'visible':'hidden';}
     scene.render(state.time,dt);
     if(previousChapter!==state.chapterIndex){label.textContent=`${String(state.chapterIndex+1).padStart(2,'0')} / 08 — ${chapters[state.chapterIndex].label}`;dots.forEach((dot,i)=>{dot.setAttribute('aria-current',i===state.chapterIndex?'step':'false');});previousChapter=state.chapterIndex;}
     progressBar.style.transform=`scaleX(${progress})`;
     node.dataset.chapter=state.chapter;
     window.__threadlabsCinematic={progress,seconds:state.time,referenceSeconds:state.time,...scene.diagnostics()};
    }});
    await scene.load();if(!alive)return;
    surface.dataset.ready='true';setLoading(false);controller.invalidate();
   } catch(error) {console.warn('ThreadLabs cinematic unavailable:',error.message);if(alive)setUnavailable(true);}
  };start();
  return()=>{alive=false;surface.removeEventListener('webglcontextlost',lost);controller?.dispose();animation?.revert();scene?.dispose();delete window.__threadlabsCinematic;};
 },[fallback]);
 const jump=(progress)=>{const el=shell.current;window.scrollTo({top:el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*progress,behavior:'instant'});};
 return <>
 <div ref={shell} className={`cinematic-scroll-shell ${fallback?'cinematic-static':''}`} data-fallback={String(fallback)}>
  <div className="cinematic-stage">
   {fallback?<img className="cinematic-poster" src="/cinematic/atelier-poster.webp" alt="Illustrative embroidery study: a red flower and sage leaves on linen, in a warm artisan workshop"/>:<canvas ref={canvas} className="cinematic-canvas" role="img" aria-label="Interactive three dimensional embroidery and artisan atelier. Scroll to follow the journey."/>}
   <header className="atelier-header"><button className="atelier-brand" aria-label="ThreadLabs home" onClick={()=>jump(0)}>threadlabs<span>THE LIVING ATELIER</span></button><nav aria-label="Main navigation"><button onClick={()=>onCollection()}>Collection <ArrowUpRight size={12}/></button><motion.button className="atelier-nav-cta" whileHover={{y:-2}} whileTap={{scale:.97}} onClick={onEnterApp}>Enter the studio <ArrowUpRight size={14}/></motion.button></nav></header>
   {copy.map(([eyebrow,title,lead,body],i)=><section className={`cinematic-layer atelier-copy ${i===0?'atelier-copy-first':''}`} data-scene={chapters[i].id} key={chapters[i].id} aria-label={chapters[i].label} style={i>0?{opacity:0,visibility:'hidden'}:undefined}>
    <p className="atelier-eyebrow"><i/>{eyebrow}</p>
    {i===0?<h1>{title}</h1>:<h2>{title}</h2>}
    <p className="atelier-lead">{lead}</p><p className="atelier-description">{body}</p>
    {(i===0||i===7)&&<motion.button className="atelier-enter" whileHover={{x:4}} whileTap={{scale:.98}} onClick={onEnterApp}>Create something of your own <span><ArrowUpRight size={19} strokeWidth={1.3}/></span></motion.button>}
    {i===5&&<p className="atelier-photo-credit">Zardozi artisan, India<br/><Credit photo={photographs[7]}/></p>}
    {i===0&&<button className="atelier-scroll" onClick={()=>jump(.1)}>SCROLL TO UNRAVEL <ArrowDown size={14}/></button>}
   </section>)}
   {!fallback&&<>
   <div className="atelier-object-label" aria-hidden="true"><span>STUDY N° 001</span><p>Of thread<br/>& possibility.</p><svg viewBox="0 0 100 30"><path d="M0 25Q40 28 65 10L83 3"/><path d="m76 2 9 0-4 9"/></svg></div>
   <nav className="cinematic-chapter-nav" aria-label="Story chapters">{chapters.map((c,i)=><button key={c.id} aria-label={`Chapter ${i+1}: ${c.label}`} aria-current={i===0?'step':false} onClick={()=>jump((c.start+.8)/DURATION)}><span>{String(i+1).padStart(2,'0')}</span><i/></button>)}</nav>
   <svg className="journey-thread" viewBox="0 0 200 200" aria-hidden="true"><path d="M8 190C150 180 5 70 90 85S185 40 180 5" strokeDasharray="440" strokeDashoffset="440"/></svg>
   {loading&&<span className="cinematic-loading" role="status">Preparing the atelier<span>…</span></span>}
   </>}
   <div className="cinematic-controls"><div><button className="atelier-sound" onClick={onToggleSound} aria-label={isMuted?'Enable sound':'Mute sound'} aria-pressed={!isMuted}>{isMuted?<VolumeX size={14}/>:<Volume2 size={14}/>}</button><span className="cinematic-chapter">01 / 08 — The first thread</span></div><button onClick={onEnterApp}>SKIP TO STUDIO <ArrowUpRight size={12}/></button><span className="atelier-edition">IMAGINED WITH TECHNOLOGY. MADE BY HAND.</span></div>
   <div className="cinematic-progress"><i className="cinematic-progress-fill"/></div>
  </div>
 </div>
 {fallback&&<section className="cinematic-fallback"><span>THE WORK OF HUMAN HANDS.</span><h2>From imagination<br/><em>to heirloom.</em></h2><p>A living atelier connecting creative ideas with extraordinary Indian craftsmanship.</p><div>{photographs.slice(0,3).map(photo=><figure key={photo.src}><img src={`/images/${photo.src}`} alt={photo.label} loading="lazy"/><figcaption>{photo.label}<br/><Credit photo={photo}/></figcaption></figure>)}</div><button className="atelier-enter" onClick={onEnterApp}>Enter the studio <ArrowUpRight size={16}/></button></section>}
 <section className="cinematic-details" aria-label="The ThreadLabs atelier"><div className="atelier-details-intro"><span>A SHARED CREATIVE STUDIO</span><h2>From your first idea.<br/><em>To your forever piece.</em></h2></div>{[['01','Imagine','Tell us what you have in mind. A voice, a sketch, a reference. Make it yours with AI design and your measurements.'],['02','Connect','Discover tailors, weavers and makers across India. Find the right hands for your idea.'],['03','Create','Commission your piece, follow its progress and create together, one thoughtful detail at a time.']].map(([n,title,description])=><article key={title}><span>{n} / THE PROCESS</span><h3>{title}.</h3><p>{description}</p><button onClick={onEnterApp}>Explore the studio <ArrowUpRight size={13}/></button></article>)}</section>
 <footer className="cinematic-end-footer"><div><strong>threadlabs</strong><span>A living atelier. By The Beatles.</span></div><button onClick={onCollection}>The collection <ArrowUpRight size={14}/></button><button onClick={onEnterApp}>Begin your story <ArrowUpRight size={14}/></button><span>© 2026 THREADLABS</span></footer>
 <details className="cinematic-credits"><summary>Craft, photography & asset credits</summary><p>Original ThreadLabs 3D craft studies. Hand geometry from the Immersive Web WebXR Input Profiles assets, MIT. Static fallback artwork supplied as an illustrative art reference; it does not depict a documented workshop.</p>{photographs.map(photo=><p key={photo.src}>{photo.label} — <Credit photo={photo}/></p>)}</details>
 </>;
}
