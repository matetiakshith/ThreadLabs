import { clamp, smoothstep, range, envelope } from './timeline.js';
const ease=(t,a,b)=>smoothstep(range(t,a,b));
/** Absolute transforms, independent of visit order and elapsed frame time. */
export function sceneWeights(t) {
 const grip=envelope(t,10,12.5,17.8,19.6);
 return {
  object:1,
  hand:envelope(t,8,10,19.6,21.5),grip,
  lift:envelope(t,12.5,15.5,18.5,22),
  explode:envelope(t,20.5,26.5,33.5,40.5),
  sketch:envelope(t,25,29,38,41),
  stitch:ease(t,32,39.5),
  workshop:1,
  human:envelope(t,52.5,57,62,66),
  fashion:envelope(t,62.5,66,70.8,74.5),
  daylight:ease(t,40,52)* (1-ease(t,70,76)),
  ribbon:clamp(.15+.8*envelope(t,19,25,41,47)+.85*envelope(t,62,68,78,80)),
  reveal:ease(t,71,76),
 };
}
