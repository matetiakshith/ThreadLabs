// Adapted from React Bits SplitText (David Haz, 2026).
// https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/SplitText/SplitText.jsx
// License: ./LICENSE.md. Adaptations preserve semantic tags, inherited typography,
// default visibility, font-ready splitting and responsive context cleanup.
import { useRef } from 'react';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { gsap,useGSAP } from '../Motion/engine';
gsap.registerPlugin(GSAPSplitText);
export default function SplitText({text,tag:Tag='span',className='',delay=0}) {
  const ref=useRef(null);
  useGSAP((context)=>{
    let closed=false,media;
    const start=context.add('startSplit',()=>{
      if(closed||!ref.current)return;
      media=gsap.matchMedia();
      media.add('(prefers-reduced-motion:no-preference)',()=>{
        let split;
        try {
          split=GSAPSplitText.create(ref.current,{type:'words',mask:'words',aria:'auto',reduceWhiteSpace:false,
            onSplit:self=>gsap.from(self.words,{yPercent:105,duration:.8,stagger:.055,delay,ease:'power3.out',clearProps:'transform'})});
          return()=>split.revert();
        }catch{split?.revert();}
      });
    });
    // The existing font metrics determine splitting. Never conceal base text
    // while fonts load or if initialization fails.
    if(document.fonts?.status==='loading')document.fonts.ready.then(start);else start();
    return()=>{closed=true;media?.revert();};
  },{scope:ref,dependencies:[text,delay],revertOnUpdate:true});
  return <Tag ref={ref} className={className} data-react-bits="SplitText">{text}</Tag>;
}
