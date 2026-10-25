import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneWeights } from './sceneState.js';

test('all scene opacity weights stay finite and bounded across the complete reference', () => {
  for (let i = -100; i <= 7300; i++) {
    const weights = sceneWeights(i / 100);
    for (const [name, weight] of Object.entries(weights)) {
      assert.ok(Number.isFinite(weight), `${name} must be finite`);
      assert.ok(weight >= 0 && weight <= 1, `${name} must remain an opacity`);
    }
    assert.equal(weights.object, Math.min(1, weights.intro + weights.workshopObject + weights.processObject + weights.selectorObject));
  }
});

test('intro object is gone before the gallery enters', () => {
  for (let i = 18500; i <= 20500; i++) {
    const state = sceneWeights(i / 1000);
    assert.equal(Math.min(state.intro, state.gallery), 0, 'photos must not collide with the departing hoop');
  }
  assert.equal(sceneWeights(19.4).intro, 0);
  assert.equal(sceneWeights(19.5).gallery, 0);
  assert.ok(sceneWeights(20.2).gallery > .999);
});

test('collection photos finish before the selector and its object appear', () => {
  for (let i = 67000; i <= 69500; i++) {
    const state = sceneWeights(i / 1000);
    assert.equal(Math.min(state.features, state.selectorObject), 0);
    if (i / 1000 >= 67.8) assert.equal(state.features, 0, 'selector copy must not overlay outgoing collection photos');
    if (i / 1000 <= 68.3) assert.equal(state.selectorObject, 0);
  }
  assert.equal(sceneWeights(69).selectorObject, 1);
});

test('workshop and macro retain their object while the environment enters and exits', () => {
  assert.equal(sceneWeights(38).workshop, 1);
  assert.equal(sceneWeights(38).workshopObject, 1);
  assert.equal(sceneWeights(44).workshop, 0);
  assert.equal(sceneWeights(44).workshopObject, 1);
  assert.equal(sceneWeights(49).workshop, 1);
  assert.equal(sceneWeights(49).workshopObject, 1);
  assert.equal(sceneWeights(53).workshop, 0);
  assert.equal(sceneWeights(53).workshopObject, 1);
  assert.equal(sceneWeights(55.9).split, 1);
  assert.equal(sceneWeights(57.8).object, 0);
  assert.equal(sceneWeights(57.8).split, 0);
});

test('desk finishes fading before the object is released from surface support', () => {
  for (let i = 0; i <= 100; i++) {
    assert.equal(sceneWeights(42.2 + i / 100).workshop, 0);
    assert.equal(sceneWeights(51.7 + i / 100 * .8).workshop, 0);
  }
  assert.ok(sceneWeights(41.6).workshop > .999);
  assert.ok(sceneWeights(51.1).workshop > .999);
  assert.equal(sceneWeights(42.2).workshopObject, 1);
  assert.equal(sceneWeights(51.7).workshopObject, 1);
});

test('fade boundaries are continuous in both directions without frame history', () => {
  const boundaries = [1.1, 2, 18.7, 19.4, 19.5, 20.2, 35.1, 35.2, 35.3, 35.6, 35.8, 36.1, 36.4, 37, 37.2, 41.6, 42.2, 45.2, 45.8, 48.1, 48.2, 48.6, 49, 51.1, 51.7, 55.5, 55.9, 57, 57.7, 57.8, 62.1, 62.3, 63.4, 63.6, 63.8, 64.1, 67.2, 67.8, 68.3, 68.8, 71, 71.6];
  const forward = new Map(boundaries.map((time) => [time, sceneWeights(time)]));
  for (const time of boundaries.toReversed()) {
    assert.deepEqual(sceneWeights(time), forward.get(time));
    const before = sceneWeights(time - .0001), after = sceneWeights(time + .0001);
    for (const name of Object.keys(before)) assert.ok(Math.abs(before[name] - after[name]) < .001, `${name} must not pop at ${time}`);
  }
});
