import test from 'node:test';
import assert from 'node:assert/strict';
import { DURATION, chapters, cameraKeyframes, clamp, smoothstep, range, envelope, evaluateTimeline, evaluateCamera } from './timeline.js';

test('the reference clock covers all 18 chapters exactly once', () => {
  assert.equal(DURATION, 72);
  assert.equal(chapters.length, 18);
  assert.equal(chapters[0].start, 0);
  assert.equal(chapters.at(-1).end, DURATION);
  chapters.forEach((chapter, index) => {
    assert.ok(chapter.start < chapter.end);
    assert.equal(evaluateTimeline(chapter.start / DURATION).chapter, chapter.id);
    assert.equal(evaluateTimeline((chapter.start + chapter.end) / 2 / DURATION).chapterIndex, index);
    assert.equal(chapter.end, chapters[index + 1]?.start ?? DURATION);
  });
  assert.equal(evaluateTimeline(1).chapter, 'closing');
  assert.equal(evaluateTimeline(1).chapterProgress, 1);
});

test('ranges and envelopes clamp overscroll without offscreen scene leakage', () => {
  assert.equal(clamp(-4), 0); assert.equal(clamp(8), 1);
  assert.equal(evaluateTimeline(-1).time, 0);
  assert.equal(evaluateTimeline(2).time, DURATION);
  assert.equal(smoothstep(0), 0); assert.equal(smoothstep(1), 1);
  assert.equal(range(2, 2, 2), 1);
  assert.equal(envelope(0, 1, 2, 5, 6), 0);
  assert.equal(envelope(3, 1, 2, 5, 6), 1);
  assert.equal(envelope(7, 1, 2, 5, 6), 0);
  assert.equal(envelope(1.5, 1, 2, 5, 6), .5);
  assert.equal(envelope(5.5, 1, 2, 5, 6), .5);
});

test('camera sampling reproduces all authored frames with finite perspective', () => {
  for (const frame of cameraKeyframes) {
    const sampled = evaluateCamera(frame.time);
    assert.deepEqual(sampled.position, frame.position);
    assert.deepEqual(sampled.target, frame.target);
    assert.equal(sampled.fov, frame.fov);
  }
  for (let i = 0; i <= 7200; i++) {
    const camera = evaluateCamera(i / 100);
    assert.ok([...camera.position, ...camera.target, camera.fov].every(Number.isFinite));
    assert.ok(Math.hypot(...camera.position.map((value, axis) => value - camera.target[axis])) > .1);
    assert.ok(camera.fov > 20 && camera.fov < 60);
  }
});

test('timeline and camera remain identical when visited in reverse or out of order', () => {
  const forward = new Map();
  for (let i = 0; i <= 144; i++) forward.set(i, { state: evaluateTimeline(i / 144), camera: evaluateCamera(i / 2) });
  for (let i = 144; i >= 0; i--) {
    assert.deepEqual(evaluateTimeline(i / 144), forward.get(i).state);
    assert.deepEqual(evaluateCamera(i / 2), forward.get(i).camera);
  }
});

test('camera boundaries have continuous position and settle smoothly', () => {
  for (const frame of cameraKeyframes.slice(1, -1)) {
    const before = evaluateCamera(frame.time - .0001);
    const after = evaluateCamera(frame.time + .0001);
    assert.ok(Math.hypot(...before.position.map((value, i) => value - after.position[i])) < .00001);
    assert.ok(Math.abs(before.fov - after.fov) < .00001);
  }
});
