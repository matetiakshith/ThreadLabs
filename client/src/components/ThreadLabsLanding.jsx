import { lazy, Suspense, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Volume2, VolumeX } from 'lucide-react';
import Wordmark from './ui/Wordmark';
import ThemeToggle from './ui/ThemeToggle';
import DesignStudies from './Unseen/DesignStudies';
import CinematicExperience from './Cinematic3D/CinematicExperience';
const ShoppingMall3D=lazy(()=>import('./Mall/ShoppingMall3D'));
export default function ThreadLabsLanding({onEnterApp,isMuted,onToggleSound}) {
 const [view,setView]=useState('index');
 return <section className={`campaign campaign--${view}`}>
  {view==='index'?<CinematicExperience onEnterApp={onEnterApp} onCollection={()=>setView('collection')}>
  <header className="campaign-header"><button className="brand-button campaign-brand" onClick={()=>setView('index')} aria-label="ThreadLabs home"><Wordmark/></button><nav aria-label="Main navigation"><button aria-current={view==='index'?'page':undefined} onClick={()=>setView('index')}>Index</button><button aria-current={view!=='index'?'page':undefined} onClick={()=>setView('collection')}>Collection</button><button onClick={onEnterApp}>Studio <ArrowUpRight size={13}/></button><ThemeToggle/></nav></header>
   <div className="campaign-hero"><div className="campaign-copy"><p className="campaign-kicker">A LIVING ATELIER. ROOTED IN CRAFT.</p><h1><span className="campaign-line">Made to be</span><em className="campaign-line">worn by</em><span className="campaign-line">you.</span></h1><div className="campaign-actions"><p>Your imagination, engineered into fashion.</p><button className="primary-button" onClick={onEnterApp}>Enter the Atelier <ArrowUpRight size={17} strokeWidth={1.4}/></button></div></div>
    <div className="living-canvas"><div className="campaign-photo"><img src="/images/varanasi-weaver.jpg" alt="An Indian silk weaver working at a handloom beside the windows of a Varanasi workshop" fetchPriority="high" width="1024" height="768"/></div><span className="campaign-photo-caption">VARANASI · THE WORK OF HUMAN HANDS<br/><a href="https://commons.wikimedia.org/wiki/File:Weaver.jpg" target="_blank" rel="noreferrer">Steve.kimberley</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a></span></div>
   </div>
  <footer className="home-footer"><button className="sound-button" onClick={onToggleSound} aria-label={isMuted?'Enable sound':'Mute sound'} aria-pressed={!isMuted}>{isMuted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button><button className="text-button" onClick={()=>setView('collection')}>Explore the collection <ArrowUpRight size={13}/></button><span className="hero-scroll-cue">Scroll to explore ↓</span><span>ThreadLabs ©2026</span></footer>
  </CinematicExperience>:<>
  <header className="campaign-header"><button className="brand-button campaign-brand" onClick={()=>{setView('index');window.scrollTo(0,0);}} aria-label="ThreadLabs home"><Wordmark/></button><nav aria-label="Main navigation"><button onClick={()=>{setView('index');window.scrollTo(0,0);}}>Index</button><button aria-current="page" onClick={()=>setView('collection')}>Collection</button><button onClick={onEnterApp}>Studio <ArrowUpRight size={13}/></button><ThemeToggle/></nav></header>
  <AnimatePresence mode="wait">{view==='collection'?<motion.div key="collection" className="campaign-collection" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.25}}><DesignStudies/><div className="collection-actions"><button className="primary-button" onClick={()=>setView('showroom')}>Walk through the 3D gallery <ArrowUpRight size={16}/></button><button className="text-button" onClick={onEnterApp}>Create something of your own <ArrowUpRight size={16}/></button></div></motion.div>:<motion.div key="showroom" className="campaign-showroom" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.25}}><Suspense fallback={<p role="status" className="gallery-loading">Opening the 3D gallery…</p>}><ShoppingMall3D onEnter={onEnterApp}/></Suspense><button className="pill-button collection-enter" onClick={onEnterApp}>Enter the studio <ArrowUpRight size={15}/></button></motion.div>}</AnimatePresence>
  </>}
 </section>;
}
