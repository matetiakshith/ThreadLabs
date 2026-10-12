import { useEffect, useState } from 'react';

export const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

export function observeReducedMotion(onChange, environment = window) {
  const media = environment.matchMedia(reducedMotionQuery);
  const update = () => onChange(media.matches);
  update();
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
}

export default function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(reducedMotionQuery).matches);
  useEffect(() => observeReducedMotion(setReduced), []);
  return reduced;
}
