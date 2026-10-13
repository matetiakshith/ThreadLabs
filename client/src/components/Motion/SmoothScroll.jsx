import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap,ScrollTrigger } from './engine';
import { nativeScrollSelector } from './motionPolicy';
import 'lenis/dist/lenis.css';
/** One instance; GSAP's existing ticker is the only Lenis RAF owner. */
export default function SmoothScroll({page}) {
  useEffect(()=>{
    const media=gsap.matchMedia();
    media.add('(min-width:1024px) and (pointer:fine) and (prefers-reduced-motion:no-preference)',()=>{
      let lenis;
      try {
        lenis=new Lenis({autoRaf:false,lerp:.16,smoothWheel:true,syncTouch:false,anchors:false,stopInertiaOnNavigate:true,respectReducedMotion:true,
          prevent:node=>!!node.closest?.(nativeScrollSelector)});
        lenis.on('scroll',ScrollTrigger.update);
        const tick=time=>{if(!document.hidden)lenis.raf(time*1000);};
        gsap.ticker.add(tick);gsap.ticker.lagSmoothing(0);
        // Native scrollIntoView, focus scrolling, back/forward and image reflow
        // can all move the real scrollbar. Reconcile without forcing a new position.
        const anchor=event=>{
          if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
          const link=event.target.closest?.('a[href]');if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
          const url=new URL(link.href,location.href);
          if(url.origin!==location.origin||url.pathname!==location.pathname||url.search!==location.search||!url.hash)return;
          let target;try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)));}catch{return;}
          if(!target)return;
          // Use the documented scrollTo API and preserve the URL/history.
          // Handle modifiers here; Lenis's automatic anchor handler does not.
          event.preventDefault();if(url.hash!==location.hash)history.pushState(history.state,'',url.href);
          lenis.resize();lenis.scrollTo(target);
        };
        document.addEventListener('click',anchor);
        const focus=()=>{
          // Conditional views can grow before Lenis's debounced ResizeObserver.
          // Refresh dimensions before reconciling native focus/scrollIntoView.
          lenis.resize();lenis.scrollTo(window.scrollY,{immediate:true});
        };
        const restore=()=>{focus();ScrollTrigger.refresh();};
        const hidden=()=>{if(document.hidden)lenis.stop();else if(document.body.style.overflow!=='hidden'){lenis.start();focus();}};
        window.addEventListener('popstate',restore);window.addEventListener('pageshow',restore);
        document.addEventListener('focusin',focus);document.addEventListener('visibilitychange',hidden);
        const modal=new MutationObserver(()=>{if(document.body.style.overflow==='hidden')lenis.stop();else if(!document.hidden&&lenis.isStopped){lenis.start();focus();}});
        modal.observe(document.body,{attributes:true,attributeFilter:['style']});
        document.documentElement.dataset.scrollEngine='lenis';
        return ()=>{
          document.removeEventListener('click',anchor);modal.disconnect();gsap.ticker.remove(tick);lenis.off('scroll',ScrollTrigger.update);lenis.destroy();
          window.removeEventListener('popstate',restore);window.removeEventListener('pageshow',restore);
          document.removeEventListener('focusin',focus);document.removeEventListener('visibilitychange',hidden);
          delete document.documentElement.dataset.scrollEngine;
        };
      } catch {lenis?.destroy();delete document.documentElement.dataset.scrollEngine;}
    });
    return ()=>media.revert();
  },[page]); // cancels inertia and cleans listeners when the application view changes
  return null;
}
