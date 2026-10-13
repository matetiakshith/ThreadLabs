// Adapted from React Bits AnimatedContent (David Haz, 2026), ./LICENSE.md.
// https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/AnimatedContent/AnimatedContent.jsx
// Uses useGSAP instead of an unscoped effect, defaults to visible, no disappearance.
import { useRef } from 'react';
import { gsap,useGSAP } from '../Motion/engine';
export default function AnimatedContent({as:Tag='div',children,className='',distance=10,revision,...props}) {
  const ref=useRef(null);
  useGSAP(()=>{
    const media=gsap.matchMedia();
    media.add('(prefers-reduced-motion:no-preference)',()=>{
      try{gsap.fromTo(ref.current,{y:distance,opacity:.65},{y:0,opacity:1,duration:.5,ease:'power3.out',clearProps:'transform,opacity',scrollTrigger:{trigger:ref.current,start:'clamp(top 94%)',once:true}});}catch{ref.current?.style.removeProperty('transform');ref.current?.style.removeProperty('opacity');}
    });return()=>media.revert();
  },{scope:ref,dependencies:[distance,revision],revertOnUpdate:true});
  return <Tag ref={ref} className={className} data-react-bits="AnimatedContent" {...props}>{children}</Tag>;
}
