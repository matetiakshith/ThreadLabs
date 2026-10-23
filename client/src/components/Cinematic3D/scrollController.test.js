import test from 'node:test';
import assert from 'node:assert/strict';
import { createScrollController } from './scrollController.js';

function fixture({ scrollY = 0 } = {}) {
  const listeners = new Map(), frames = new Map(), renders = [];
  let nextFrame = 0, observer;
  class MockResizeObserver {
    constructor(callback) { this.callback = callback; observer = this; }
    observe(node) { this.node = node; }
    disconnect() { this.disconnected = true; }
  }
  const originalObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = MockResizeObserver;
  const environment = {
    scrollY, innerHeight: 100,
    ResizeObserver: MockResizeObserver,
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  const shell = { offsetHeight: 1100, getBoundingClientRect: () => ({ top: 100 - environment.scrollY }) };
  const controller = createScrollController({ shell, environment, render: (progress, dt) => renders.push({ progress, dt }) });
  const flush = (now) => {
    const pending = [...frames.values()]; frames.clear();
    pending.forEach((callback) => callback(now));
  };
  const settle = () => { for (let i = 0; i < 100 && frames.size; i++) flush(1000 + i * 16.67); };
  return { environment, shell, controller, listeners, frames, renders, observer, flush, settle,
    restore() { controller.dispose(); globalThis.ResizeObserver = originalObserver; } };
}

test('scroll updates share one pending frame and the idle renderer sleeps', () => {
  const f = fixture();
  try {
    assert.equal(f.frames.size, 1);
    f.flush(100);
    assert.equal(f.frames.size, 0);
    f.environment.scrollY = 600;
    for (let i = 0; i < 20; i++) f.listeners.get('scroll')();
    assert.equal(f.frames.size, 1, 'rapid scroll events must not create competing animation loops');
    f.settle();
    assert.equal(f.renders.at(-1).progress, .5);
    assert.equal(f.frames.size, 0, 'the scene must stop requesting frames once settled');
    f.controller.invalidate();
    assert.equal(f.frames.size, 1);
    f.flush(4000);
    assert.equal(f.frames.size, 0);
  } finally { f.restore(); }
});

test('scroll positions use shell document coordinates, resize correctly, and clamp overscroll', () => {
  const f = fixture({ scrollY: 600 });
  try {
    f.settle();
    assert.equal(f.renders.at(-1).progress, .5);
    f.environment.innerHeight = 600;
    f.listeners.get('resize')(); f.settle();
    assert.equal(f.renders.at(-1).progress, 1);
    f.environment.scrollY = -80;
    f.listeners.get('scroll')(); f.settle();
    assert.equal(f.renders.at(-1).progress, 0);
    f.environment.scrollY = 8000;
    f.listeners.get('scroll')(); f.settle();
    assert.equal(f.renders.at(-1).progress, 1);
  } finally { f.restore(); }
});

test('exponential damping is independent of 30/60/120Hz frame rate while active', () => {
  const sample = (hz) => {
    const f = fixture();
    try {
      f.flush(100);
      f.environment.scrollY = 1100; f.listeners.get('scroll')();
      f.flush(116.67); // The activation frame establishes a common time origin.
      const steps = hz / 5;
      for (let i = 1; i <= steps; i++) f.flush(116.67 + i * (200 / steps));
      return f.renders.at(-1).progress;
    } finally { f.restore(); }
  };
  const baseline = sample(60);
  assert.ok(Math.abs(sample(30) - baseline) < 1e-12);
  assert.ok(Math.abs(sample(120) - baseline) < 1e-12);
});

test('route disposal cancels RAF, detaches listeners/observer and rejects stale callbacks', () => {
  const f = fixture();
  try {
    const stale = [...f.frames.values()][0];
    const initialRenderCount = f.renders.length;
    f.controller.dispose();
    assert.equal(f.frames.size, 0);
    assert.equal(f.listeners.size, 0);
    assert.equal(f.observer.disconnected, true);
    stale(100);
    f.controller.invalidate();
    f.observer.callback();
    assert.equal(f.renders.length, initialRenderCount);
    assert.equal(f.frames.size, 0);
  } finally { f.restore(); }
});
