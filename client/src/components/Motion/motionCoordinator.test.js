import test from 'node:test';
import assert from 'node:assert/strict';
import { installAtelierMotion } from './motionCoordinator.js';

function harness(initiallyReduced = false, fail = false) {
  const scopes = [], scrolls = [], listeners = new Map(), frames = new Map(), observers = [];
  let id = 0, mediaListener;
  const node = { connected: true, closest: () => null, querySelectorAll: () => [], contains: () => false };
  const root = { querySelectorAll: selector => selector.startsWith('.page-heading') ? [node] : [], contains: target => target.connected, addEventListener: (event, cb) => listeners.set(event, cb), removeEventListener: event => listeners.delete(event) };
  const media = { matches: initiallyReduced, addEventListener: (_, cb) => { mediaListener = cb; }, removeEventListener: () => { mediaListener = null; } };
  class Observer { constructor(cb) { this.callback = cb; this.disconnected = false; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } }
  const environment = { matchMedia: () => media, MutationObserver: Observer, ResizeObserver: Observer, requestAnimationFrame: cb => { frames.set(++id, cb); return id; }, cancelAnimationFrame: key => frames.delete(key) };
  const api = {
    createScope: () => { const scope = { reverted: false, add(cb) { cb(); return scope; }, revert() { scope.reverted = true; } }; scopes.push(scope); return scope; },
    onScroll: options => {
      if (fail) throw new Error('Animation unavailable');
      const scroll = { options, ready: false, target: null, refreshes: 0, reverted: false, revert() { this.reverted = true; }, refresh() { if (!this.target) throw new Error('Pending target'); this.refreshes++; } };
      scrolls.push(scroll); return scroll;
    },
    createTimeline: () => ({ add() { return this; }, complete() {} }), animate: () => ({ complete() {} }), stagger: () => 0,
  };
  const flush = () => { const callbacks = Array.from(frames.values()); frames.clear(); callbacks.forEach(callback => callback()); };
  const setReduced = value => { media.matches = value; mediaListener(); flush(); };
  return { root, node, scopes, scrolls, listeners, observers, frames, environment, api, flush, setReduced, hasMediaListener: () => !!mediaListener };
}

test('removed views revert their scopes; unmount removes every observer and listener', () => {
  const h = harness(); const stop = installAtelierMotion(h.root, h.environment, h.api); h.flush();
  assert.equal(h.scopes.length, 1);
  h.node.connected = false; h.observers[0].callback(); h.flush();
  assert.ok(h.scopes[0].reverted);
  stop();
  assert.equal(h.listeners.size, 0);
  assert.ok(h.observers.every(observer => observer.disconnected));
  assert.equal(h.frames.size, 0);
  assert.equal(h.hasMediaListener(), false);
});

test('modal entrances observe their own scroll container; caption timelines continuously synchronize', () => {
  const h = harness();
  const container = {};
  h.node.closest = selector => selector === '.dialog-backdrop > div' ? container : null;
  h.root.querySelectorAll = selector => selector === '.creation-caption' ? [h.node] : [];
  const stop = installAtelierMotion(h.root, h.environment, h.api); h.flush();
  assert.equal(h.scrolls[0].options.container, container);
  assert.equal(h.scrolls[0].options.sync, true);
  assert.equal(h.scrolls[0].options.repeat, true);
  stop(); assert.ok(h.scopes[0].reverted);
});

test('reduced motion creates no animation and live preference changes revert motion', () => {
  const reduced = harness(true); const stopReduced = installAtelierMotion(reduced.root, reduced.environment, reduced.api); reduced.flush();
  assert.equal(reduced.scopes.length, 0); stopReduced();
  const h = harness(); const stop = installAtelierMotion(h.root, h.environment, h.api); h.flush();
  h.setReduced(true); assert.ok(h.scopes[0].reverted);
  h.setReduced(false); assert.equal(h.scopes.length, 1, 'entrances do not replay on preference changes');
  stop();
});

test('animation setup failure reverts its partial scope and leaves the view usable', () => {
  const h = harness(false, true); const stop = installAtelierMotion(h.root, h.environment, h.api);
  assert.doesNotThrow(h.flush); assert.ok(h.scopes[0].reverted); stop();
});

test('resize skips pending targets and detaches removed views before refreshing', () => {
  const h = harness(); const stop = installAtelierMotion(h.root, h.environment, h.api); h.flush();
  assert.doesNotThrow(() => h.observers[1].callback());
  assert.equal(h.scrolls[0].refreshes, 0);
  h.scrolls[0].ready = true; h.scrolls[0].target = h.node;
  h.observers[1].callback(); assert.equal(h.scrolls[0].refreshes, 1);
  h.node.connected = false;
  h.observers[1].callback(); assert.ok(h.scopes[0].reverted);
  assert.equal(h.scrolls[0].refreshes, 1);
  stop();
});

test('empty optional content and disconnected targets do not schedule animation', () => {
  const h = harness();
  h.node.children = [];
  h.root.querySelectorAll = () => [h.node];
  h.node.isConnected = false;
  const stop = installAtelierMotion(h.root, h.environment, h.api); h.flush();
  assert.equal(h.scopes.length, 0);
  h.node.isConnected = true;
  h.root.querySelectorAll = selector => ['.workspace-choices, .studio-aside ol, .design-parameters, .artisan-profile .portfolio-entry', '.creation-item', '.order-timeline > div > div'].includes(selector) ? [h.node] : [];
  h.observers[0].callback(); h.flush();
  assert.equal(h.scopes.length, 0);
  stop();
});
