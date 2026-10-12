import { animate, createScope, createTimeline, onScroll, stagger } from 'animejs';
import { observeReducedMotion } from '../Measurements/useReducedMotion.js';

const excluded = '.india-artisan-map, .cinematic-intro, .campaign-brand, .sketch-workspace, .voice-workspace, .measurement-disclosure';
const headings = '.page-heading h1, .page-heading h2, .creations-title, .login-art-copy h2, .login-form-wrap h1, .desk-heading h1, .order-heading h2, .maker-search-intro h2';
const defaults = { animate, createScope, createTimeline, onScroll, stagger };

// One coordinator follows the existing conditional views. It never owns a
// Framer Motion transform or any state in the map, forms, or order tracker.
export function installAtelierMotion(root, environment = window, api = defaults) {
  if (!environment.matchMedia || !environment.MutationObserver || !environment.ResizeObserver || !environment.requestAnimationFrame) return () => {};
  const records = new Map();
  const seen = new WeakSet();
  const microScopes = new Map();
  let reduced = true;
  let frame = 0;
  let stopped = false;

  const discard = (node, record) => {
    record.scope.revert();
    node.removeAttribute?.('data-anime-scroll');
    records.delete(node);
  };
  const stopMotion = () => {
    for (const [node, record] of records) discard(node, record);
    for (const record of microScopes.values()) record.scope.revert();
    microScopes.clear();
  };
  const register = (node, treatment, scrub = false) => {
    if (node.isConnected === false || records.has(node) || (!scrub && seen.has(node)) || node.closest(excluded)) return;
    let scope;
    try {
      scope = api.createScope({ root: node });
      const record = { scope, animation: null, scroll: null };
      scope.add(() => {
        const container = node.closest('.dialog-backdrop > div');
        record.scroll = api.onScroll({ target: node, ...(container ? { container } : {}), enter: scrub ? 'bottom top' : 'bottom-=24 top', leave: 'top bottom', sync: scrub ? true : 'play', repeat: scrub });
        record.animation = treatment(node, record.scroll);
        if (!scrub) record.animation.onComplete = () => record.scroll.revert();
      });
      node.setAttribute?.('data-anime-scroll', scrub ? 'linked' : 'triggered');
      records.set(node, record);
      if (!scrub) seen.add(node);
    } catch {
      scope?.revert(); // Base HTML and CSS are always fully visible.
    }
  };

  const scan = () => {
    frame = 0;
    if (stopped) return;
    for (const [node, record] of records) if (!root.contains(node)) discard(node, record);
    for (const [node, record] of microScopes) if (!root.contains(node)) { record.scope.revert(); microScopes.delete(node); }
    if (reduced) return;
    root.querySelectorAll(headings).forEach(node => register(node, (target, scroll) => {
      const timeline = api.createTimeline({ autoplay: scroll }).add(target, {
        clipPath: ['inset(0 0 65% 0)', 'inset(0 0 0% 0)'], opacity: [.3, 1], y: [28, 0], duration: 850, ease: 'out(4)',
      });
      const emphasis = target.querySelectorAll('em');
      if (emphasis.length) timeline.add(emphasis, { opacity: [.6, 1], duration: 420, ease: 'out(3)' }, 140);
      return timeline;
    }));

    root.querySelectorAll('.workspace-choices, .studio-aside ol, .design-parameters, .artisan-profile .portfolio-entry').forEach(node => {
      if (!node.children.length) return;
      register(node, (target, scroll) => api.animate(Array.from(target.children), {
      opacity: [.3, 1], x: [-28, 0], delay: api.stagger(95), duration: 650, ease: 'out(3)', autoplay: scroll,
      }));
    });
    root.querySelectorAll('.creation-item').forEach((node, index) => {
      const images = node.querySelectorAll('.study-board, .study-silhouette');
      const captions = node.querySelectorAll('.creation-caption');
      if (!images.length && !captions.length) return;
      register(node, (_target, scroll) => {
        const timeline = api.createTimeline({ autoplay: scroll });
        if (images.length) timeline.add(images, { clipPath: [index % 2 ? 'inset(0 0 0 48%)' : 'inset(0 48% 0 0)', 'inset(0 0 0 0)'], duration: 850, ease: 'out(4)' }, 0);
        if (captions.length) timeline.add(captions, { x: [index % 2 ? 32 : -32, 0], opacity: [.25, 1], duration: 750, ease: 'out(3)' }, 160);
        return timeline;
      });
    });
    root.querySelectorAll('.studio-aside-image, .generated-image-mask, .garment-spec, .artisan-row h4, .artisan-profile h2').forEach(node => register(node, (target, scroll) => api.animate(target, {
      clipPath: ['inset(0 0 38% 0)', 'inset(0 0 0% 0)'], opacity: [.45, 1], duration: 850, ease: 'out(4)', autoplay: scroll,
    })));

    // A reversible Anime timeline reveals typography and draws the rule as
    // each existing fashion study traverses the viewport. Motion owns its outer
    // figure's scale/rotation; Anime never writes that transform.
    root.querySelectorAll('.creation-caption').forEach(node => register(node, (target, scroll) => api.createTimeline({ autoplay: scroll })
      .add(target, { '--caption-progress': [0, 1], ease: 'linear', duration: 1000 }, 0), true));
    root.querySelectorAll('.order-timeline > div').forEach(node => register(node, (target, scroll) => api.animate(target, {
      '--journey-scroll': [0, 1], ease: 'linear', autoplay: scroll,
    }), true));
    root.querySelectorAll('.order-timeline > div > div').forEach(node => {
      if (!node.lastElementChild) return;
      register(node, (target, scroll) => api.animate(target.lastElementChild, {
      opacity: [.65, 1], x: [8, 0], ease: 'out(3)', duration: 480, autoplay: scroll,
      }));
    });
  };
  const scheduleScan = () => {
    if (!frame && !stopped) frame = environment.requestAnimationFrame(scan);
  };
  const stopReducedObserver = observeReducedMotion(value => {
    reduced = value;
    if (value) stopMotion();
    else scheduleScan();
  }, environment);
  const mutations = new environment.MutationObserver(scheduleScan);
  mutations.observe(root, { childList: true, subtree: true });
  const resize = new environment.ResizeObserver(() => {
    for (const [node, record] of records) {
      if (!root.contains(node)) { discard(node, record); continue; }
      // Anime.js initializes explicit targets on its next frame. A root resize
      // can arrive earlier; refreshing a pending observer would read a null target.
      if (!record.scroll?.ready || !record.scroll.target || record.scroll.reverted) continue;
      try { record.scroll.refresh(); } catch { discard(node, record); }
    }
  });
  resize.observe(root);

  const controlFor = event => event.target.closest?.('button, a, .field-label, .creation-item') || null;
  const micro = (event, entering) => {
    if (reduced) return;
    const control = controlFor(event);
    if (!control || !root.contains(control) || control.closest(excluded) || control.contains(event.relatedTarget)) return;
    const target = control.querySelector('.creation-name, svg:not(.study-garment-crop), .nav-number');
    if (!target) return;
    const existing = microScopes.get(target);
    if (existing) {
      existing.returning = !entering;
      if (entering) existing.animation.play();
      else existing.animation.reverse();
      return;
    }
    if (!entering) return;
    let scope;
    try {
      scope = api.createScope({ root: control });
      const record = { scope, animation: null, returning: false };
      scope.add(() => { record.animation = api.animate(target, {
        x: [0, 2], y: [0, -1], scale: [1, 1.035], duration: 260, ease: 'out(3)',
        onComplete: () => {
          if (record.returning) { scope.revert(); if (microScopes.get(target) === record) microScopes.delete(target); }
        },
      }); });
      microScopes.set(target, record);
    } catch { scope?.revert(); }
  };
  const over = event => micro(event, true);
  const out = event => micro(event, false);
  const focus = event => {
    // Keyboard focus always exposes the complete content immediately.
    for (const [node, record] of records) if (node.contains(event.target)) record.animation?.complete();
    micro(event, true);
  };
  const listeners = [['pointerover', over], ['pointerout', out], ['focusin', focus], ['focusout', out]];
  for (const [event, callback] of listeners) root.addEventListener(event, callback);
  scheduleScan();
  return () => {
    stopped = true;
    if (frame) environment.cancelAnimationFrame(frame);
    mutations.disconnect();
    resize.disconnect();
    stopReducedObserver();
    for (const [event, callback] of listeners) root.removeEventListener(event, callback);
    stopMotion();
  };
}
