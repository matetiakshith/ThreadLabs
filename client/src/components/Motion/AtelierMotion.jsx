import { useEffect } from 'react';
import { installAtelierMotion } from './motionCoordinator.js';
import './motion.css';

export default function AtelierMotion({ rootRef }) {
  useEffect(() => {
    if (!rootRef.current) return;
    return installAtelierMotion(rootRef.current);
  }, [rootRef]);
  return null;
}
