import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createHandRig } from './handRig.js';

const hand = createHandRig({ detail: 'low' });
test.after(() => hand.dispose());

test('original hand has continuous closed skin and a normalized 22-bone skeleton', () => {
  const geometry = hand.skin.geometry;
  assert.ok(hand.skin.isSkinnedMesh);
  assert.equal(hand.skeleton.bones.length, 22);
  const weight = geometry.attributes.skinWeight;
  for (let i = 0; i < weight.count; i++) {
    assert.ok(Math.abs(weight.getX(i) + weight.getY(i) + weight.getZ(i) + weight.getW(i) - 1) < 1e-6);
  }
  const edges = new Map();
  const indices = geometry.index.array;
  for (let i = 0; i < indices.length; i += 3) {
    for (const [a, b] of [[indices[i], indices[i + 1]], [indices[i + 1], indices[i + 2]], [indices[i + 2], indices[i]]]) {
      const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  assert.ok([...edges.values()].every((count) => count === 2), 'skin must have no open ends or disconnected seams');
  const normal = geometry.attributes.normal;
  for (let i = 0; i < normal.count; i++) {
    assert.ok(Math.abs(Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) - 1) < 1e-6);
  }
  assert.ok(!hand.chains.index.bones[2].children.some((child) => child.name.endsWith('_nail')), 'reference glove must not show keratin nails by default');
});

test('grasp animation deforms skin and is deterministic in both scroll directions', () => {
  const position = hand.skin.geometry.attributes.position;
  const vertex = new THREE.Vector3();
  let changed = 0;
  hand.setPose(0);
  const open = [];
  for (let i = 0; i < position.count; i += 31) {
    vertex.fromBufferAttribute(position, i);
    open.push(hand.skin.applyBoneTransform(i, vertex).clone());
  }
  hand.setPose(1);
  let sample = 0;
  for (let i = 0; i < position.count; i += 31) {
    vertex.fromBufferAttribute(position, i);
    hand.skin.applyBoneTransform(i, vertex);
    assert.ok(vertex.toArray().every(Number.isFinite));
    if (vertex.distanceTo(open[sample++]) > .03) changed++;
  }
  assert.ok(changed > 20, 'the skeleton must move the actual skin');
  hand.setPose(.37);
  const forward = hand.getContactPoints();
  hand.setPose(.92); hand.setPose(.37);
  for (const [name, point] of Object.entries(hand.getContactPoints())) assert.ok(point.distanceTo(forward[name]) < 1e-10);
});

test('fingers travel continuously and thumb/index make rim-sized contact', () => {
  hand.setPose(0);
  let previous = hand.getContactPoints();
  for (let i = 1; i <= 100; i++) {
    hand.setPose(i / 100);
    const next = hand.getContactPoints();
    for (const name of Object.keys(next)) assert.ok(next[name].distanceTo(previous[name]) < .05);
    previous = next;
  }
  assert.ok(previous.index.distanceTo(previous.thumb) < .16);
});

test('optional rim target solving is stable and reversible', () => {
  hand.setGraspTargets({ index: [-.30, .35, -.70], thumb: [-.29, .38, -.57] });
  hand.setPose(1);
  const first = hand.getContactPoints();
  hand.setPose(0); hand.setPose(.7); hand.setPose(1);
  const second = hand.getContactPoints();
  assert.ok(first.index.distanceTo(second.index) < 1e-9);
  assert.ok(first.thumb.distanceTo(second.thumb) < 1e-9);
  assert.ok(first.index.distanceTo(new THREE.Vector3(-.30, .35, -.70)) < .03);
  assert.ok(first.thumb.distanceTo(new THREE.Vector3(-.29, .38, -.57)) < .03);
  hand.setGraspTargets(null);
});

test('reference pose can extend the index while curling the other fingers', () => {
  hand.setPose({ grip: 1, curls: { index: .2 } });
  const contact = hand.getContactPoints();
  assert.ok(contact.index.y > contact.middle.y + .8);
  assert.ok(contact.index.z > -.3);
  hand.setPose(0);
});
