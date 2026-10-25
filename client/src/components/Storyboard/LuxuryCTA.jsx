import { useEffect, useId, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './luxury-cta.css';
import { textileImage } from './textileAtmosphereMotion.js';

gsap.registerPlugin(ScrollTrigger);
const CLOSED = 'M0,.12 C.25,.34 .45,.02 .65,.16 S.92,.32 1,.08 L1,1 L0,1Z';
const OPEN = 'M0,-.18 C.25,-.28 .45,.02 .65,-.21 S.92,-.35 1,-.28 L1,1 L0,1Z';
function CampaignMannequin(){
 const id=`dress-form-${useId().replaceAll(':','')}`;
 return <div className="luxury-cta-mannequin cinematic-photo-mannequin" aria-hidden="true">
  <svg className="luxury-cta-defs"><defs><clipPath id={id} clipPathUnits="objectBoundingBox"><path d="M.605,0 C.63,0 .63,.045 .613,.066 L.665,.06 .668,.23 C.674,.265 .685,.29 .72,.295 L.768,.32 C.813,.33 .832,.36 .839,.42 L.877,1 L.454,1 C.447,.87 .436,.75 .44,.64 L.452,.59 C.448,.5 .45,.45 .468,.42 L.535,.36 C.56,.32 .567,.29 .57,.245 L.568,.11 .567,.087 .60,.066 C.585,.05 .59,.01 .605,0Z"/></clipPath></defs></svg>
  <img src={textileImage('06-tailoring-mannequin')} width="552" height="230" alt="" loading="lazy" style={{clipPath:`url(#${id})`}}/>
 </div>;
}
export default function LuxuryCTA({ onEnterApp }) {
  const root = useRef(null), clipId = `cta-unfurl-${useId().replaceAll(':', '')}`;
  useEffect(() => {
    const section = root.current, mask = section.querySelector('.luxury-cta-mask');
    const image = section.querySelector('.luxury-cta-image'), lines = section.querySelectorAll('.luxury-cta-line > span');
    const supporting = section.querySelectorAll('.luxury-cta-copy > p, .luxury-cta-action, .luxury-cta-eyebrow');
    const figure = section.querySelector('.luxury-cta-mannequin');
    const connectThread = () => {
      const route = document.querySelector('.network-routes path');
      if (!route?.getScreenCTM()) return;
      const point = route.getPointAtLength(route.getTotalLength());
      const screen = new DOMPoint(point.x, point.y).matrixTransform(route.getScreenCTM());
      const bounds = section.getBoundingClientRect();
      const start = (screen.x - bounds.left) / bounds.width * 1440;
      section.querySelector('.cta-connecting-thread path').setAttribute('d', `M${start} 0 C${start-100} 100 50 50 160 190 S1400 160 1300 400`);
    };
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({ scrollTrigger: { id: 'luxury-cta-unfurl', refreshPriority: -1, trigger: section, start: 'top 98%', end: 'top 12%', scrub: true, invalidateOnRefresh: true, onRefresh: connectThread } });
      timeline.fromTo(section.querySelector('.cta-connecting-thread path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .5, ease: 'none' }, 0)
        .fromTo(section.querySelector('.cta-fabric-sweep'), { scaleY: .025, opacity: .4, transformOrigin: '50% 0%' }, { scaleY: 1, opacity: .8, duration: .4, ease: 'power2.inOut' }, .04)
        .to(section.querySelector('.cta-fabric-sweep'), { yPercent: 110, opacity: 0, duration: .45, ease: 'power2.inOut' }, .42)
        .to(section.querySelector('.cta-connecting-thread'), { opacity: 0, duration: .35 }, .5)
        .fromTo(mask, { attr: { d: CLOSED } }, { attr: { d: OPEN }, duration: .56, ease: 'power1.inOut' }, 0)
        .fromTo(image, { scale: 1.09, yPercent: 3 }, { scale: 1, yPercent: 0, duration: 1, ease: 'power2.out' }, 0)
        .fromTo(lines, { yPercent: 110, rotate: 2 }, { yPercent: 0, rotate: 0, duration: .38, stagger: .065, ease: 'power3.out' }, .31)
        .fromTo(supporting, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .3, stagger: .045, ease: 'power2.out' }, .58)
        .fromTo(figure, { y: 45, opacity: 0 }, { y: 0, opacity: 1, duration: .38, ease: 'power2.out' }, .45);
      return () => timeline.kill();
    });
    media.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(section.querySelectorAll('.cta-fabric-sweep,.cta-connecting-thread'), { opacity: 0 });
      gsap.set(mask, { attr: { d: OPEN } });
      gsap.set([image, ...lines, ...supporting, figure], { clearProps: 'transform,opacity' });
    });
    return () => media.revert();
  }, []);
  return <section className="story-editorial story-start luxury-cta" id="story-start" ref={root} aria-labelledby="luxury-cta-title">
    <svg className="luxury-cta-defs" aria-hidden="true"><defs><clipPath id={clipId} clipPathUnits="objectBoundingBox"><path className="luxury-cta-mask" d={OPEN}/></clipPath></defs></svg>
    <div className="luxury-cta-art" style={{ clipPath: `url(#${clipId})` }}>
      <img className="luxury-cta-image" src="/assets/threadlabs-cinematic/textile-horizon-1672.webp" srcSet="/assets/threadlabs-cinematic/textile-horizon-1100.webp 1100w, /assets/threadlabs-cinematic/textile-horizon-1672.webp 1672w" sizes="(max-aspect-ratio: 1/1) 180vh, 110vw" width="1672" height="941" alt="" loading="lazy" decoding="async"/>
      <img className="textile-cta-foreground" src={textileImage('12_woven_valley_cta')} width="554" height="232" alt="" loading="lazy"/>
    </div>
    <svg className="cta-connecting-thread" viewBox="0 0 1440 500" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M950 0 C850 100 50 50 160 190 S1400 160 1300 400"/></svg>
    <svg className="cta-fabric-sweep" viewBox="0 0 1440 500" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id={`${clipId}-fabric`} width="1440" height="810" patternUnits="userSpaceOnUse"><image href="/assets/threadlabs-cinematic/textile-horizon-1672.webp" width="1440" height="810"/></pattern></defs><path fill={`url(#${clipId}-fabric)`} d="M0 0 C400 160 750 -80 1440 60 L1440 220 C980 70 500 440 0 210Z"/><path fill="#8b4b2d" fillOpacity=".36" d="M0 130 C500 340 1000 0 1440 180 L1440 210 C1000 50 500 390 0 155Z"/></svg>
    <div className="luxury-cta-copy">
      <span className="story-eyebrow luxury-cta-eyebrow">GET STARTED</span>
      <h2 id="luxury-cta-title"><span className="luxury-cta-line"><span>Turn Your Ideas</span></span><span className="luxury-cta-line"><span>Into Reality</span></span></h2>
      <p>Bring your imagination to life with the hands that make it. Your next chapter starts with a thread.</p>
      <div className="luxury-cta-action"><button className="story-button" onClick={onEnterApp}>Get Started <span className="luxury-cta-arrow" aria-hidden="true">↗</span></button></div>
    </div>
    <CampaignMannequin/>
  </section>;
}
