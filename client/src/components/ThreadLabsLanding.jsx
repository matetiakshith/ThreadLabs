import { lazy, Suspense, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Wordmark from './ui/Wordmark';
import ThemeToggle from './ui/ThemeToggle';
import DesignStudies from './Unseen/DesignStudies';
import StoryboardExperience from './Storyboard/StoryboardExperience';
const ShoppingMall3D=lazy(()=>import('./Mall/ShoppingMall3D'));
export default function ThreadLabsLanding({onEnterApp,isMuted,onToggleSound}) {
 const [view,setView]=useState('index');
 return <section className={`campaign campaign--${view}`}>
  {view==='index'?<StoryboardExperience onEnterApp={onEnterApp} onCollection={()=>{setView('collection');window.scrollTo(0,0);}} isMuted={isMuted} onToggleSound={onToggleSound}/>:<>
  <header className="campaign-header"><button className="brand-button campaign-brand" onClick={()=>{setView('index');window.scrollTo(0,0);}} aria-label="ThreadLabs home"><Wordmark/></button><nav aria-label="Main navigation"><button onClick={()=>{setView('index');window.scrollTo(0,0);}}>Index</button><button aria-current="page" onClick={()=>setView('collection')}>Collection</button><button onClick={onEnterApp}>Studio <ArrowUpRight size={13}/></button><ThemeToggle/></nav></header>
  <AnimatePresence mode="wait">{view==='collection'?<motion.div key="collection" className="campaign-collection" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.25}}><DesignStudies/><div className="collection-actions"><button className="primary-button" onClick={()=>setView('showroom')}>Walk through the 3D gallery <ArrowUpRight size={16}/></button><button className="text-button" onClick={onEnterApp}>Create something of your own <ArrowUpRight size={16}/></button></div></motion.div>:<motion.div key="showroom" className="campaign-showroom" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.25}}><Suspense fallback={<p role="status" className="gallery-loading">Opening the 3D gallery…</p>}><ShoppingMall3D onEnter={onEnterApp}/></Suspense><button className="pill-button collection-enter" onClick={onEnterApp}>Enter the studio <ArrowUpRight size={15}/></button></motion.div>}</AnimatePresence>
  </>}
 </section>;
}
