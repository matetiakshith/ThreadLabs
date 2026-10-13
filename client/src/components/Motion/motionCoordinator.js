import { gsap,ScrollTrigger } from './engine';
import { choreographyExcluded,storyPinDistance } from './motionPolicy';

// Every record owns its own GSAP context; removed conditional views are reverted
// before their React DOM can be recycled. No global killAll or document selectors.
export function installAtelierMotion(root) {
  const media=gsap.matchMedia();
  media.add({all:'(min-width:0px)',reduce:'(prefers-reduced-motion:reduce)',desktop:'(min-width:1100px) and (min-height:740px)',fine:'(pointer:fine)'},({conditions})=>{
    if(conditions.reduce)return;
    const records=new Map();let scanFrame=0,refreshFrame=0,closed=false,serial=0;
    const register=(node,kind,factory)=>{
      if(!node?.isConnected||records.has(node)||node.closest(choreographyExcluded))return;
      let context;
      try{
        context=gsap.context(()=>{},node);context.add(()=>factory(node));
        records.set(node,{context,kind});node.dataset.gsapMotion=kind;
      }catch{context?.revert();node.style.removeProperty('clip-path');node.style.removeProperty('opacity');node.style.removeProperty('transform');}
    };
    const scrub=(trigger,extra={})=>({id:`threadlabs-${++serial}`,trigger,start:'clamp(top bottom)',end:'clamp(bottom top)',scrub:.45,invalidateOnRefresh:true,...extra});
    const reveal=(node,extra={})=>node.getBoundingClientRect().top<innerHeight*.91?undefined:({trigger:node,start:'clamp(top 91%)',once:true,fastScrollEnd:true,...extra});
    const scan=()=>{
      scanFrame=0;if(closed)return;
      for(const [node,record] of records)if(!root.contains(node)){record.context.revert();delete node.dataset.gsapMotion;records.delete(node);}
      root.querySelectorAll('.page-heading h1,.page-heading h2,.creations-title,.desk-heading h1,.maker-search-intro h2,.artisan-profile-editor h2').forEach(node=>register(node,'headline',target=>{
        gsap.fromTo(target,{clipPath:'inset(0 0 55% 0)',y:22,opacity:.6},{clipPath:'inset(0%)',y:0,opacity:1,duration:.8,ease:'power3.out',scrollTrigger:reveal(target),clearProps:'clipPath,transform,opacity'});
      }));
      root.querySelectorAll('[data-motion-treatment]').forEach(node=>{
        if(node.matches('.studio-aside'))return; // pin owns this element, never a second transform
        register(node,'scene-scrub',target=>{
          const board=target.dataset.motionTreatment==='board';
          gsap.fromTo(target,{y:board?22:14},{y:board?-18:-12,ease:'none',scrollTrigger:scrub(target)});
        });
      });
      root.querySelectorAll('.study-silhouette,.study-board').forEach((node,index)=>register(node,'study-mask',mask=>{
        const target=mask.closest('.creation-item'),caption=target.querySelector('.creation-caption');
        const timeline=gsap.timeline({scrollTrigger:reveal(target)});
        if(mask)timeline.fromTo(mask,{clipPath:`inset(0 ${index%2?0:10}% 12% ${index%2?10:0}%)`},{clipPath:'inset(0%)',duration:.9,ease:'power3.inOut',clearProps:'clipPath'},0);
        if(caption)timeline.fromTo(caption.children,{y:10,opacity:.65},{y:0,opacity:1,stagger:.09,duration:.65,ease:'power3.out',clearProps:'transform,opacity'},.12);
      }));
      root.querySelectorAll('.creation-caption').forEach(node=>register(node,'caption-rule-scrub',target=>gsap.fromTo(target,{'--caption-progress':0},{'--caption-progress':1,ease:'none',scrollTrigger:scrub(target,{start:'clamp(top 90%)',end:'clamp(top 35%)'})})));
      root.querySelectorAll('.studio-aside').forEach(node=>{
        const layout=node.closest('.studio-layout');
        const eligible=!!(conditions.desktop&&conditions.fine&&layout&&storyPinDistance(layout.offsetHeight,node.offsetHeight)>120);
        const previous=records.get(node);
        if(previous&&previous.eligible!==eligible){previous.context.revert();records.delete(node);}
        register(node,'studio-story',target=>{
          const story=target.querySelector('ol'),steps=story?.querySelectorAll('li');
          if(eligible&&story){
            // Pin only existing read-only story lines; preview, forms and controls stay native.
            const timeline=gsap.timeline({scrollTrigger:scrub(story,{pin:story,pinSpacing:false,start:'top 60%',end:()=>`+=${storyPinDistance(layout.offsetHeight,target.offsetHeight)}`,anticipatePin:1})});
            steps.forEach((step,index)=>timeline.fromTo(step,{x:5,opacity:.65},{x:0,opacity:1,duration:.5,ease:'none'},index*.25));
            timeline.fromTo(target,{'--studio-story-progress':0},{'--studio-story-progress':1,duration:1,ease:'none'},0);
          }
        });
        if(records.has(node))records.get(node).eligible=eligible;
      });
      root.querySelectorAll('.studio-aside-image img').forEach(node=>register(node,'editorial-image-scrub',target=>gsap.fromTo(target,{scale:1.055,yPercent:2},{scale:1,yPercent:-2,ease:'none',scrollTrigger:scrub(target.parentElement,{id:'threadlabs-editorial-image'})})));
      root.querySelectorAll('.generated-image-mask').forEach(node=>register(node,'board-mask',target=>{
        // The image stays at full scale; only the enclosing presentation reveals.
        gsap.fromTo(target,{clipPath:'inset(5% 0 10% 0)'},{clipPath:'inset(0%)',duration:.7,ease:'power3.inOut',scrollTrigger:reveal(target),clearProps:'clipPath'});
      }));
      root.querySelectorAll('.design-parameters,.workspace-choices').forEach(node=>register(node,'stagger',target=>gsap.fromTo(target.children,{y:12,opacity:.65},{y:0,opacity:1,duration:.65,stagger:.065,ease:'power3.out',scrollTrigger:reveal(target),clearProps:'transform,opacity'})));
      root.querySelectorAll('.garment-spec h4,.design-brief blockquote,.artisan-row h4,.artisan-profile h2').forEach(node=>register(node,'text-mask',target=>gsap.fromTo(target,{clipPath:'inset(0 0 38% 0)'},{clipPath:'inset(0%)',duration:.65,ease:'power3.out',scrollTrigger:reveal(target),clearProps:'clipPath'})));
      root.querySelectorAll('.artisan-row img,.portfolio-saved article img').forEach(node=>register(node,'portfolio-mask',target=>gsap.fromTo(target,{clipPath:'inset(0 0 18% 0)'},{clipPath:'inset(0%)',duration:.6,ease:'power3.out',scrollTrigger:reveal(target),clearProps:'clipPath'})));
      root.querySelectorAll('.order-timeline > div').forEach(node=>register(node,'journey-scrub',target=>gsap.fromTo(target,{'--journey-scroll':0},{'--journey-scroll':1,ease:'none',scrollTrigger:scrub(target,{start:'clamp(top 85%)',end:'clamp(bottom 65%)'})})));
      root.querySelectorAll('.order-timeline > div > div').forEach(node=>register(node,'journey-stage',target=>{
        if(target.lastElementChild)gsap.fromTo(target.lastElementChild,{x:10,opacity:.7},{x:0,opacity:1,duration:.45,ease:'power2.out',scrollTrigger:reveal(target),clearProps:'transform,opacity'});
      }));
      refresh();
    };
    const refresh=()=>{if(!refreshFrame&&!closed)refreshFrame=requestAnimationFrame(()=>{refreshFrame=0;ScrollTrigger.refresh();});};
    const schedule=()=>{if(!scanFrame&&!closed)scanFrame=requestAnimationFrame(scan);};
    const mutation=new MutationObserver(schedule);mutation.observe(root,{childList:true,subtree:true});
    let resizeTimer;const resize=new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{schedule();refresh();},120);});resize.observe(root);
    const focus=event=>{for(const [node,record] of records)if(node.contains(event.target)&&!record.kind.includes('scrub')&&record.kind!=='studio-story')record.context.getTweens().forEach(tween=>tween.totalProgress(1));};
    root.addEventListener('load',refresh,true);root.addEventListener('focusin',focus);
    document.fonts?.ready.then(()=>{if(!closed)refresh();});schedule();
    return()=>{closed=true;clearTimeout(resizeTimer);cancelAnimationFrame(scanFrame);cancelAnimationFrame(refreshFrame);mutation.disconnect();resize.disconnect();root.removeEventListener('load',refresh,true);root.removeEventListener('focusin',focus);for(const [node,record]of records){record.context.revert();delete node.dataset.gsapMotion;}records.clear();};
  },root);
  return()=>media.revert();
}
