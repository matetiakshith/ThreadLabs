import { useEffect,useRef,useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
/** Original ThreadLabs mark. No texture, raster asset, canvas, or 3D renderer. */
export default function BeatleMascot({ state='idle', size=40, decorative=true, label='The Beatle', look=0 }) {
  const reduced=useReducedMotion(),ref=useRef(null),inView=useInView(ref);
  const [pageVisible,setPageVisible]=useState(()=>!document.hidden);
  useEffect(()=>{const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
  const still=reduced||!inView||!pageVisible;
  const thinking=state==='thinking',responding=state==='responding';
  const movement=still?{y:0,rotate:0}:thinking?{rotate:[0,-5,-5,0],y:[0,-1,-1,0]}:responding?{y:[0,-3,0],rotate:[0,2,0]}:state==='error'?{rotate:-4}:state==='hover'?{rotate:look*5,y:-1}:{y:[0,-1.5,0]};
  return <motion.svg ref={ref} className="beatle-mascot" width={size} height={size} viewBox="0 0 64 64" role={decorative?undefined:'img'} aria-hidden={decorative||undefined} aria-label={decorative?undefined:label} animate={movement} transition={{duration:still?0:thinking?2.8:responding?.55:3.8,repeat:still||['responding','hover','error'].includes(state)?0:Infinity,ease:'easeInOut'}}>
    <motion.g fill="none" stroke="var(--beatle-outline, #554a3f)" strokeWidth="2.4" strokeLinecap="round" animate={still?{rotate:0}:{rotate:thinking?[0,5,0]:[0,1,0]}} transition={{duration:still?0:thinking?1.6:5,repeat:still?0:Infinity}} style={{transformOrigin:'32px 20px'}}>
      <path d="M25 20 Q22 12 18 11 M39 20 Q42 12 46 11"/>
    </motion.g>
    <path d="M32 17 C20 17 13 28 13 39 C13 51 21 57 32 57 C43 57 51 51 51 39 C51 28 44 17 32 17Z" fill="var(--beatle-shell, #e4d7c5)"/>
    <path d="M32 39 V51" fill="none" stroke="var(--beatle-seam, #bba993)" strokeWidth="1.3" strokeLinecap="round"/>
    <motion.g fill="var(--beatle-eye, #302d29)" animate={still?{scaleY:1,x:0}:{scaleY:[1,1,.08,1,1],x:state==='hover'?look*1.1:0}} transition={{scaleY:{duration:still?0:5.4,times:[0,.82,.84,.87,1],repeat:still?0:Infinity},x:{duration:still?0:.2}}} style={{transformOrigin:'32px 29px'}}>
      <ellipse cx="26.5" cy="29.5" rx="1.7" ry={responding?1.4:2.2}/><ellipse cx="37.5" cy="29.5" rx="1.7" ry={responding?1.4:2.2}/>
    </motion.g>
  </motion.svg>;
}
