import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Luxury Fashion Interaction Cursor
 * Smoothly interpolates with spring physics and reflects spatial interaction states:
 * - 'default': Subtle ring & inner dot
 * - 'drag': Expanded ring with rotational orbit indicator
 * - 'grab': Amber magnetic ring indicating cloth fabric interaction
 * - 'hold': Compressed pulse ring during active vertex pulling
 * - 'view': Wide editorial circle for 3D garment exploration
 */
export default function CustomFashionCursor({ cursorState = 'default' }) {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const smoothX = useSpring(x, { damping: 30, stiffness: 260, mass: .4 });
  const smoothY = useSpring(y, { damping: 30, stiffness: 260, mass: .4 });
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;
    const move = event => { x.set(event.clientX - 14); y.set(event.clientY - 14); setIsVisible(true); };
    const leave = () => setIsVisible(false);
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('mouseleave', leave); };
  }, [x, y, reducedMotion]);
  if (!isVisible || reducedMotion || cursorState === 'default') return null;

  const isGrab = cursorState === 'grab';
  const isHold = cursorState === 'hold';
  const isDrag = cursorState === 'drag';
  const isView = cursorState === 'view';

  return (
    <div aria-hidden="true" className="fashion-cursor fixed inset-0 pointer-events-none z-[9999] overflow-hidden hidden md:block">
      {/* Outer Spring Ring */}
      <motion.div
        className={`fixed top-0 left-0 rounded-full border pointer-events-none flex items-center justify-center transition-colors duration-200 ${
          isGrab || isHold
            ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
            : isDrag
            ? 'border-cyan-400 bg-cyan-400/10'
            : isView
            ? 'border-white/60 bg-white/5'
            : 'border-[#53423a]/30 bg-transparent'
        }`}
        style={{ x: smoothX, y: smoothY }}
        animate={{
          width: isHold ? 32 : isGrab || isDrag ? 48 : isView ? 64 : 28,
          height: isHold ? 32 : isGrab || isDrag ? 48 : isView ? 64 : 28,
          scale: isHold ? 0.9 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 340,
          mass: 0.4,
        }}
      >
        {(isGrab || isHold || isDrag || isView) && (
          <span className="text-[9px] font-mono tracking-widest font-bold uppercase text-white/90">
            {isHold ? 'HOLD' : isGrab ? 'GRAB' : isDrag ? 'DRAG' : 'VIEW'}
          </span>
        )}
      </motion.div>

    </div>
  );
}
