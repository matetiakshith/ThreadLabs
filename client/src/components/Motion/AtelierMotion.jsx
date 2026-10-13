import { useGSAP } from './engine';
import { installAtelierMotion } from './motionCoordinator';
import './motion.css';
export default function AtelierMotion({rootRef}) {
  useGSAP(context=>{
    let stop;
    // Host refs attach after descendant layout effects. Defer just setup by one
    // frame, and cancel it on StrictMode's first cleanup before another can run.
    const setup=context.add('setupMotion',()=>{if(rootRef.current)stop=installAtelierMotion(rootRef.current);});
    const frame=requestAnimationFrame(setup);
    return()=>{cancelAnimationFrame(frame);stop?.();};
  },{scope:rootRef});
  return null;
}
