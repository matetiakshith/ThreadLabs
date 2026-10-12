import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import useReducedMotion from '../Measurements/useReducedMotion.js';

/** Motion owns only this outer element. Anime owns masks/captions inside it. */
export default function ScrollScene({ as = 'div', name, treatment = 'parallax', children, className = '', ...props }) {
  const target = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ['start end', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 160, damping: 32, restDelta: .0001 });
  const y = useTransform(smooth, [0, .5, 1], treatment === 'board' ? [48, 0, -32] : treatment === 'journey' ? [28, 0, -18] : [56, 0, -40]);
  const scale = useTransform(smooth, [0, .5, 1], treatment === 'board' ? [.92, 1, 1.025] : [1, 1, 1]);
  const rotate = useTransform(smooth, [0, .5, 1], treatment === 'board' ? [-1.4, 0, 1.4] : [0, 0, 0]);
  const Component = motion[as];
  return <Component {...props} ref={target} className={`${className} scroll-scene`} data-motion-scene={name} data-motion-library="Motion for React" data-motion-treatment={treatment}
    style={{ '--scene-progress': scrollYProgress, y: reduced ? 0 : y, scale: reduced ? 1 : scale, rotate: reduced ? 0 : rotate }}
    initial={{ opacity: reduced ? 1 : .55 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: .12 }} transition={{ duration: reduced ? 0 : .65 }}>
    {children}
  </Component>;
}

export function ScrollType({ children, className = '' }) {
  const target = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ['start end', 'end start'] });
  const spacing = useTransform(scrollYProgress, [0, .5, 1], ['-.045em', '-.015em', '.015em']);
  return <motion.span ref={target} className={`scroll-type ${className}`} data-motion-scene="studio-typography" style={{ letterSpacing: reduced ? undefined : spacing, '--scene-progress': scrollYProgress }}>{children}</motion.span>;
}
