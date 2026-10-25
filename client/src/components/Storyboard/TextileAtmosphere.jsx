import { useId } from 'react';
import { textileImage } from './textileAtmosphereMotion.js';
function FabricArtwork({className,name}){
 const id=`scene-${useId().replaceAll(':','')}`;
 return <div className={`textile-world-layer ${className}`} style={{clipPath:`url(#${id})`}}>
  <svg width="0" height="0"><defs><clipPath id={id} clipPathUnits="objectBoundingBox"><path className="textile-scene-mask" d="M0,1.1 C.2,1 .42,1.2 .65,1.1 S.9,1 1,1.1 L1,1 L0,1Z"/></clipPath></defs></svg>
  <img src={textileImage(name)} alt="" width="554" height="232" loading={name==='01-textile-landscape'?'eager':'lazy'}/>
 </div>;
}
export default function TextileAtmosphere(){
 return <div className="textile-world-atmosphere" aria-hidden="true">
  <div className="textile-world-valley"><img src="/assets/threadlabs-cinematic/textile-horizon-1672.webp" srcSet="/assets/threadlabs-cinematic/textile-horizon-1100.webp 1100w, /assets/threadlabs-cinematic/textile-horizon-1672.webp 1672w" sizes="(max-aspect-ratio: 1/1) 180vh, 100vw" alt="" width="1672" height="941" fetchPriority="high"/></div>
  <FabricArtwork className="textile-world-origin" name="01-textile-landscape"/>
  <FabricArtwork className="textile-world-ribbons" name="02-floating-silk"/>
  <FabricArtwork className="textile-world-continuation" name="11-flowing-threads"/>
  <FabricArtwork className="textile-world-embroidery" name="04-embroidered-fabric"/>
  <FabricArtwork className="textile-world-unfurl" name="08-fabric-architecture"/>
 </div>;
}
