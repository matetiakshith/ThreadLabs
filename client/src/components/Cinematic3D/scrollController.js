/** One writer for scroll, the paused Anime timeline, camera, bones and objects. */
export function createScrollController({ shell, render, environment = window }) {
  let target = 0, current = 0, frame = 0, previous = 0, stopped = false;
  let top = 0, distance = 1, initialized = false;
  const read = () => {
    target = Math.max(0, Math.min(1, (environment.scrollY - top) / distance));
    if (!frame && !stopped) frame = environment.requestAnimationFrame(tick);
  };
  const tick = now => {
    frame = 0;
    if (stopped) return;
    const dt = Math.min(64, Math.max(1, now - (previous || now - 16.67)));
    previous = now;
    current += (target - current) * (1 - Math.exp(-dt / 68));
    if (Math.abs(target - current) < .000015) current = target;
    render(current, dt);
    if (current !== target) frame = environment.requestAnimationFrame(tick);
    else previous = 0;
  };
  const resize = () => {
    const rect = shell.getBoundingClientRect();
    top = rect.top + environment.scrollY;
    distance = Math.max(1, shell.offsetHeight - environment.innerHeight);
    if (!initialized) {current = Math.max(0, Math.min(1, (environment.scrollY - top) / distance));initialized = true;}
    read();
  };
  const invalidate = () => { if (!frame && !stopped) frame = environment.requestAnimationFrame(tick); };
  environment.addEventListener('scroll', read, { passive: true });
  environment.addEventListener('resize', resize, { passive: true });
  const observer = new ResizeObserver(resize);
  observer.observe(shell);
  resize();
  return { invalidate, resize, dispose() {
    stopped = true; environment.cancelAnimationFrame(frame); observer.disconnect();
    environment.removeEventListener('scroll', read); environment.removeEventListener('resize', resize);
  } };
}
