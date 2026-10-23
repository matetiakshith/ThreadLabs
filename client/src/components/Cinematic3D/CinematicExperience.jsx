import { useEffect, useRef, useState } from 'react';
import { createTimeline } from 'animejs';
import { ArrowUpRight } from 'lucide-react';
import useReducedMotion from '../Measurements/useReducedMotion';
import { createScrollController } from './scrollController';
import { evaluateTimeline } from './timeline';
import { photographs } from './photography';
import './cinematic.css';

function Credit({photo}) {
 return <><a href={`https://commons.wikimedia.org/wiki/File:${photo.file}`} target="_blank" rel="noreferrer">{photo.author}</a> · <a href={`https://creativecommons.org/licenses/by-sa/${photo.license}/`} target="_blank" rel="noreferrer">CC BY-SA {photo.license}</a></>;
}

const textScenes = [
 ['object',2,2.5,5.7,6.2],
 ['wrapper',16,16.8,19.6,20.4], ['gallery',20,21,34.3,35.4],
 ['workbench',36,36.8,41,42], ['construction',42,42.7,45.2,45.8],
 ['wordmark',45.5,46,47.7,48.4], ['return',48.4,49,51.8,52.5],
 ['macro',52.7,53.3,55.2,55.9], ['heritage',57.4,58.3,60.4,61.2],
 ['columns',60.5,61,61.7,62.1], ['process',61.8,62.1,63.5,64],
 ['collection',63.7,64.1,67.4,68], ['selector',67.8,68.4,70.8,71.7],
 ['closing',71.1,71.8,73,74],
];

/** The only scroll animation owner. Motion continues to own route transitions. */
export default function CinematicExperience({children,onEnterApp,onCollection}) {
 const shell=useRef(null), canvas=useRef(null), [unavailable,setUnavailable]=useState(false), [loading,setLoading]=useState(true);
 const reduced=useReducedMotion();
 useEffect(()=>{
  if(reduced||unavailable)return;
  const node=shell.current, surface=canvas.current;
  let alive=true, controller, scene, animation;
  const onLost=event=>{event.preventDefault();setUnavailable(true);};
  surface.addEventListener('webglcontextlost',onLost);
  const start=async()=>{
   try {
    const { createCraftScene }=await import('./craftScene');
    if(!alive)return;
    scene=createCraftScene(surface,()=>controller?.invalidate());
    const opening=node.querySelector('.cinematic-opening');
    animation=createTimeline({autoplay:false,defaults:{ease:'linear'}})
      .add(opening,{opacity:[1,0],duration:1500},600)
      .add(surface,{opacity:[0,1],duration:1400},700);
    const layers=textScenes.map(([id,a,b,c,d])=>{
      const el=node.querySelector(`[data-scene="${id}"]`);
      animation.add(el,{opacity:[0,1],y:[18,0],duration:(b-a)*1000},a*1000)
        .add(el,{opacity:[1,0],y:[0,-16],duration:(d-c)*1000},c*1000);
      return {el,start:a,end:d};
    });
    animation.add(node.querySelector('.cinematic-giant-type'),{x:['85vw','-110vw'],duration:4800},16000)
      .add(node.querySelector('.cinematic-wordmark span'),{scale:[4,.15],rotate:[-10,10],duration:2900},45500)
      .add(node.querySelector('.cinematic-heritage h2'),{x:['65vw','-25vw'],duration:3500},57500)
      .add(node.querySelector('.cinematic-process-track'),{y:['35vh','-80vh'],duration:2000},61800)
      .add(node.querySelector('.cinematic-closing-ring'),{rotate:[-50,90],scale:[.65,1],duration:1200},70800);
    controller=createScrollController({shell:node,render:(progress,dt)=>{
      const state=evaluateTimeline(progress);
      animation.seek(state.referenceTime*1000);
      opening.inert=state.referenceTime>1.8; opening.style.visibility=state.referenceTime>2.2?'hidden':'visible';
      for(const {el,start,end} of layers){const visible=state.referenceTime>=start&&state.referenceTime<end;el.inert=!visible;el.style.visibility=visible?'visible':'hidden';}
      scene.render(state.referenceTime,dt);
      const light=state.referenceTime>57.9&&state.referenceTime<63.7;
      node.dataset.tone=light?'paper':'ink';
      node.querySelector('.cinematic-chapter').textContent=`${String(state.chapterIndex+1).padStart(2,'0')} / ${state.chapter.replaceAll('-',' ')}`;
      node.style.setProperty('--journey',progress);
      window.__threadlabsCinematic={progress,seconds:state.time,referenceSeconds:state.referenceTime,...scene.diagnostics()};
    }});
    await scene.load();
    if(!alive)return;
    surface.dataset.ready='true';setLoading(false);controller.invalidate();
   } catch(error) {
    console.warn('ThreadLabs cinematic unavailable:',error.message);
    if(alive)setUnavailable(true);
   }
  };
  start();
  return()=>{alive=false;surface.removeEventListener('webglcontextlost',onLost);controller?.dispose();animation?.revert();scene?.dispose();delete window.__threadlabsCinematic;};
 },[reduced,unavailable]);
 const fallback=reduced||unavailable;
 return <>
 <div className={`cinematic-scroll-shell ${fallback?'cinematic-static':''}`} ref={shell} data-fallback={fallback?'true':'false'}>
  <div className="cinematic-stage">
   <div className="cinematic-opening">{children}</div>
   {!fallback&&<>
    <canvas ref={canvas} className="cinematic-canvas" aria-label="Three dimensional embroidery hoop, artisan workbench and textile material study" role="img"/>
    <div className="cinematic-vignette" aria-hidden="true"/>
    <section data-scene="object" className="cinematic-layer cinematic-object-copy"><div><span>01 / FROM AN IDEA</span><h2>A living<br/><em>atelier.</em></h2></div><p>Something imagined.<br/>Something made.<br/><small>AI brings the idea into focus.<br/>Human hands bring it to life.</small></p></section>
    <section data-scene="wrapper" className="cinematic-layer cinematic-wrapper-copy"><p className="cinematic-giant-type">worn by you.</p><span>A pattern becomes a possibility.</span></section>
    <section data-scene="gallery" className="cinematic-layer cinematic-gallery-copy"><span>02 / EXTRAORDINARY HANDS</span><h2>Rooted in craft.</h2><p className="cinematic-gallery-label">Eight studies in Indian craftsmanship</p><span className="cinematic-gallery-cue">SCROLL TO DISCOVER →</span></section>
    <section data-scene="workbench" className="cinematic-layer cinematic-scene-copy"><div><span>03 / THE ATELIER</span><p>Generations of extraordinary craft.</p></div><h2>Tradition.<br/>Craft. Tomorrow.</h2><span className="cinematic-corner-note">WOOD × BRASS × LINEN × THREAD</span></section>
    <section data-scene="construction" className="cinematic-layer cinematic-scene-copy"><div><span>04 / THE CONSTRUCTION</span><p>Every part has a purpose.</p></div><h2>Made with<br/><em>intention.</em></h2><span className="cinematic-corner-note">MATERIAL STUDY / 001</span></section>
    <section data-scene="wordmark" className="cinematic-layer cinematic-wordmark" aria-hidden="true"><i/><i/><span>THREADLABS</span></section>
    <section data-scene="return" className="cinematic-layer cinematic-return-copy"><span>THE IDEA TAKES SHAPE</span><h2>Your imagination,<br/><em>engineered into fashion.</em></h2></section>
    <section data-scene="macro" className="cinematic-layer cinematic-macro-copy"><span>05 / CLOSER TO THE MATERIAL</span><h2>Every thread<br/>tells a story.</h2><div><b>WARP × WEFT</b><p>Natural linen.<br/>An original stitch.</p></div></section>
    <section data-scene="heritage" className="cinematic-layer cinematic-heritage"><h2>Rooted in craft.</h2><p>A shared space for a new generation of ideas<br/>and generations of extraordinary craft.</p></section>
    <section data-scene="columns" className="cinematic-layer cinematic-columns">{[['01','Imagine','Start with a voice, a sketch, a photograph or an idea.'],['02','Connect','Meet the tailors, weavers and makers who know the material.'],['03','Make','Create together, with measurements and updates at every step.']].map(([n,title,copy])=><article key={n}><span>{n} / THE ATELIER</span><h2>{title}.</h2><p>{copy}</p></article>)}</section>
    <section data-scene="process" className="cinematic-layer cinematic-process"><div className="cinematic-process-track">{[['Your imagination.','Create a custom outfit.'],['Extraordinary hands.','Find your artisan.'],['Made together.','Follow every stitch.']].map(([title,copy],i)=><article key={title}><span>0{i+1} / THE ATELIER</span><h2>{title}</h2><p>{copy}</p></article>)}</div></section>
    <section data-scene="collection" className="cinematic-layer cinematic-collection-copy"><span>06 / A LIVING HERITAGE</span><h2>Made of stories.</h2><span>WEAVING · STITCHING · TEXTILES · GARMENTS</span></section>
    <section data-scene="selector" className="cinematic-layer cinematic-selector"><span>FROM IMAGINATION TO HEIRLOOM</span><h2>THREADLABS</h2><div><button onClick={onEnterApp}>Enter the Atelier <ArrowUpRight size={14}/></button><button onClick={onCollection}>Collection <ArrowUpRight size={14}/></button><button onClick={onEnterApp}>Studio <ArrowUpRight size={14}/></button></div></section>
    <section data-scene="closing" className="cinematic-layer cinematic-closing"><div><span>A LIVING ATELIER.</span><h2>Made to be<br/><em>worn by you.</em></h2><button className="primary-button" onClick={onEnterApp}>Enter the Atelier <ArrowUpRight size={16}/></button></div><svg className="cinematic-closing-ring" viewBox="0 0 1000 700" aria-hidden="true">{Array.from({length:160},(_,i)=>{const a=i*2.39996323,r=150+(i%9)*12,x=400+Math.cos(a)*r,y=400+Math.sin(a)*r*.8;return <path key={i} d={`M${x} ${y}q${8+i%8} ${-4+i%9} ${14+i%8} ${3+i%6}`} stroke={i%3?'#b69a68':'#a66a50'} opacity={.2+(i%5)*.13} transform={`rotate(${i*47} ${x} ${y})`}/>;})}</svg></section>
    <div className="cinematic-controls"><button onClick={()=>window.scrollTo({top:shell.current.offsetTop+shell.current.offsetHeight,behavior:'instant'})}>Skip to the atelier ↓</button><span className="cinematic-chapter">01 / introduction</span><button onClick={onEnterApp}>Studio <ArrowUpRight size={13}/></button></div>
    {loading&&<span className="cinematic-loading" role="status">Preparing the craft study…</span>}
   </>}
  </div>
 </div>
 {fallback&&<section className="cinematic-fallback"><span>THE WORK OF HUMAN HANDS.</span><h2>From imagination to heirloom.</h2><p>A living atelier connecting creative ideas with extraordinary Indian craftsmanship.</p><div>{photographs.slice(0,3).map(photo=><figure key={photo.src}><img src={`/images/${photo.src}`} alt={photo.label} loading="lazy"/><figcaption>{photo.label}<br/><Credit photo={photo}/></figcaption></figure>)}</div><button className="primary-button" onClick={onEnterApp}>Enter the Atelier <ArrowUpRight size={16}/></button></section>}
 <section className="cinematic-details" aria-label="The ThreadLabs atelier">{[['Customer','Your imagination.',['AI fashion design','Voice, sketch and reference inputs','Design visualization board','Measurements and commissions']],['Artisan','Extraordinary hands.',['Craft profiles and portfolios','Tailor and weaver discovery','Commission requests','Order progress updates']],['ThreadLabs','Made together.',['A shared creative studio','Indian artisan map','Beatle AI assistance','Ideas made physical']]].map(([label,title,details])=><article key={label}><span>{label}</span><h2>{title}</h2>{details.map((detail,i)=><p key={detail}><small>0{i+1}</small>{detail}</p>)}</article>)}</section>
 <footer className="cinematic-end-footer"><div><strong>THREADLABS</strong><span>by The Beatles</span></div><button onClick={onCollection}>Explore the collection <ArrowUpRight size={14}/></button><button onClick={onEnterApp}>Studio <ArrowUpRight size={14}/></button><span>©2026</span></footer>
 <details className="cinematic-credits"><summary>Craft photography & asset credits</summary><p>The craft models, textures and studio environment are original ThreadLabs assets.</p>{photographs.map(photo=><p key={photo.src}>{photo.label} — <Credit photo={photo}/></p>)}</details>
 </>;
}
