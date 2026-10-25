/** The sole, absolute story clock. All 3D and DOM animation samples this clock. */
export const DURATION = 80;
export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
export const smoothstep = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const range = (time, start, end) => start === end ? Number(time >= end) : clamp((time - start) / (end - start));
export const envelope = (t, a, b, c, d) => smoothstep(range(t,a,b)) * (1-smoothstep(range(t,c,d)));
export const toReferenceTime = time => clamp(time, 0, DURATION);
const chapterData = [
 ['thread',0,'The first thread'], ['hand',8,'The artisan’s hand'],
 ['unfold',20,'The idea unfolds'], ['stitch',31,'From sketch to stitch'],
 ['atelier',42,'The atelier'], ['human',53,'The human behind the craft'],
 ['fashion',63,'Craft becomes fashion'], ['reveal',72,'Made to be worn by you'],
];
export const chapters = Object.freeze(chapterData.map(([id,start,label],i)=>Object.freeze({id,start,end:chapterData[i+1]?.[1] ?? DURATION,label})));
export function evaluateTimeline(progress) {
 const time=clamp(progress)*DURATION;
 let i=0;while(i<chapters.length-1 && time+1e-10>=chapters[i+1].start)i++;
 return {time,referenceTime:time,chapter:chapters[i].id,chapterIndex:i,chapterProgress:range(time,chapters[i].start,chapters[i].end)};
}
// XYZ world-space poses. The same hoop and studio persist behind every chapter.
export const cameraKeyframes=Object.freeze([
 [0,[0,.22,5.7],[-.80,.02,0],36],
 [8,[.12,.30,5.25],[-.68,.08,0],36],
 [13,[.65,.40,5.25],[-.54,.15,0],36],
 [18,[.95,.48,5.6],[-.55,.13,0],36],
 [23,[1.5,.55,6.0],[-.5,.15,0],36],
 [29,[2.5,.55,6.5],[-.35,.15,0],36],
 [34,[1.45,.55,6.3],[-.5,.1,0],36],
 [41,[.1,.58,5.8],[-.7,.05,0],36],
 [46,[-.3,1.35,7.6],[-.65,-.25,-.5],38],
 [51,[-.6,.85,6.8],[-.6,-.2,-.7],38],
 [54,[-.1,.5,5.5],[-.6,.05,-1.2],38],
 [59,[.75,.45,2.15],[-.2,.1,-3.0],40],
 [62,[.75,.45,2.15],[-.2,.1,-3.0],40],
 [66,[1.25,.60,6.6],[-.3,.05,-.7],38],
 [70,[.7,.40,6.2],[-.55,.03,-.3],36],
 [74,[.1,.24,5.8],[-.85,.05,0],36],
 [80,[0,.2,5.5],[-.8,.04,0],36],
].map(([time,position,target,fov])=>Object.freeze({time,position:Object.freeze(position),target:Object.freeze(target),fov})));
export function evaluateCamera(time) {
 let i=0;time=clamp(time,0,DURATION);while(i<cameraKeyframes.length-2 && time>cameraKeyframes[i+1].time)i++;
 const a=cameraKeyframes[i],b=cameraKeyframes[i+1],t=smoothstep(range(time,a.time,b.time));
 const lerp=(x,y)=>t===0?x:t===1?y:x+(y-x)*t;
 return {position:a.position.map((x,j)=>lerp(x,b.position[j])),target:a.target.map((x,j)=>lerp(x,b.target[j])),fov:lerp(a.fov,b.fov)};
}
