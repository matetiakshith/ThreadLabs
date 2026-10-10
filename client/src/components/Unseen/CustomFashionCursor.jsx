import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const isGrab = cursorState === 'grab';
  const isHold = cursorState === 'hold';
  const isDrag = cursorState === 'drag';
  const isView = cursorState === 'view';

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden hidden md:block">
      {/* Outer Spring Ring */}
      <motion.div
        className={`fixed top-0 left-0 rounded-full border pointer-events-none flex items-center justify-center transition-colors duration-200 ${
          isGrab || isHold
            ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
            : isDrag
            ? 'border-cyan-400 bg-cyan-400/10'
            : isView
            ? 'border-white/60 bg-white/5'
            : 'border-white/30 bg-transparent'
        }`}
        animate={{
          x: mousePos.x - (isHold ? 16 : isGrab || isDrag ? 24 : isView ? 32 : 14),
          y: mousePos.y - (isHold ? 16 : isGrab || isDrag ? 24 : isView ? 32 : 14),
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

      {/* Inner Pinpoint Dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-white pointer-events-none shadow-sm"
        animate={{
          x: mousePos.x - 3,
          y: mousePos.y - 3,
          opacity: isGrab || isHold || isDrag || isView ? 0 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 40,
          stiffness: 500,
          mass: 0.1,
        }}
      />
    </div>
  );
}
