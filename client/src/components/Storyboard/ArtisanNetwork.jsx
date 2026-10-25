import { lazy, Suspense, useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import india from '@svg-maps/india';
import { textileImage } from './textileAtmosphereMotion';
const IndiaArtisanMap = lazy(() => import('../Artisans/IndiaArtisanMap'));
export default function ArtisanNetwork({ onExplore }) {
 const [selected,setSelected]=useState(null),[hovered,setHovered]=useState(null),[showMap,setShowMap]=useState(false);
 const active=hovered||selected;
 useEffect(()=>{
  // The optional discovery view changes section height after its lazy module loads.
  const observer=new ResizeObserver(()=>ScrollTrigger.refresh());
  observer.observe(document.querySelector('#story-network'));
  return()=>observer.disconnect();
 },[]);
 return <section className="story-editorial story-network" id="story-network" aria-labelledby="network-title">
  <div className="network-composition">
   <div className="story-section-copy"><span className="story-eyebrow">PAN INDIA NETWORK</span><h2 id="network-title">Artisans<br/>Across India</h2><p>Explore India’s craft traditions and discover artisans by region. Availability depends on registered makers.</p>
    <div className="network-region" aria-live="polite"><strong>{active||'A shared tradition'}</strong><p>{active?'Discover the makers behind the craft.':'Select a state to begin your discovery.'}</p><button className="story-map-link" onClick={()=>setShowMap(v=>!v)} aria-expanded={showMap} aria-controls="network-discovery">{showMap?'Close interactive map':active?'Explore Artisans':'Explore the interactive artisan map'} →</button></div>
   </div>
   <div className="network-map-stage">
    <svg className="story-india" viewBox={india.viewBox} role="group" aria-label="Select an Indian state to discover artisans">
     <defs><pattern id="story-weave" width="120" height="50" patternUnits="userSpaceOnUse"><image href={textileImage('09-textile-macro')} width="120" height="50"/></pattern></defs>
     {india.locations.map((state,i)=><g key={state.id} className={`network-state${active===state.name?' is-active':''}`} role="button" tabIndex={0} aria-label={state.name} aria-pressed={selected===state.name} onPointerEnter={()=>setHovered(state.name)} onPointerLeave={()=>setHovered(null)} onFocus={()=>setHovered(state.name)} onBlur={()=>setHovered(null)} onClick={()=>setSelected(state.name)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(state.name);}}}>
      <path d={state.path} fill={['#ba6237','#c1a378','#626548','#dfc29d','#8b542f'][i%5]} stroke="var(--story-line)" strokeWidth="1"/><path className="network-weave" d={state.path} fill="url(#story-weave)" opacity=".08"/>
     </g>)}
    </svg>
    <svg className="network-routes" viewBox="0 0 600 650" aria-hidden="true"><path pathLength="1" d="M255 90 C460 180 80 270 220 400 S465 450 350 550 C300 605 150 570 110 650"/><path pathLength="1" d="M70 300 C190 160 450 420 540 250"/></svg>
    <span className="network-route-note">Threads of craft · decorative routes</span>
   </div>
  </div>
  {showMap&&<div id="network-discovery"><Suspense fallback={<p role="status">Opening the map…</p>}><IndiaArtisanMap key={selected||'all'} initialState={selected} onExplore={onExplore}/></Suspense></div>}
 </section>;
}
