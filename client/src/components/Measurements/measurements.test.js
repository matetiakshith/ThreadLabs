import test from 'node:test';
import assert from 'node:assert/strict';
import { createMeasurementDraft, updateMeasurement, switchMeasurementUnit, validateMeasurements, serializeMeasurements, orderedMeasurementGroups, measurementFields, garmentLengthRequirement, loadMeasurementDraft, measurementDraftKey } from './measurements.js';
import { observeReducedMotion } from './useReducedMotion.js';

test('all 19 optional length measurements accept sensible canonical values', () => {
  let draft = createMeasurementDraft();
  assert.equal(serializeMeasurements(draft), null);
  for (const [key, , min, max] of measurementFields) draft = updateMeasurement(draft, key, String((min + max) / 2));
  assert.deepEqual(validateMeasurements(draft), {});
  assert.equal(Object.keys(serializeMeasurements(draft).values).length, 19);
  assert.equal(serializeMeasurements(draft).unit, 'cm');
});

test('inch edits convert once and repeated unit switches preserve exact canonical values', () => {
  let draft = switchMeasurementUnit(createMeasurementDraft(), 'in');
  draft = updateMeasurement(draft, 'chest', '38.25');
  const canonical = draft.values.chest;
  assert.equal(canonical, 38.25 * 2.54);
  for (let i = 0; i < 100; i++) { draft = switchMeasurementUnit(draft, 'cm'); draft = switchMeasurementUnit(draft, 'in'); }
  assert.equal(draft.values.chest, canonical);
  assert.equal(draft.inputs.chest, '38.25');
  assert.equal(serializeMeasurements(draft).displayUnit, 'in');
});

test('invalid input remains editable and blocks conversion and payload submission', () => {
  for (const raw of ['-1', '0', '99999', '-', '1e2', 'Infinity', 'abc', '5']) {
    const draft = updateMeasurement(createMeasurementDraft(), 'chest', raw);
    assert.ok(validateMeasurements(draft).chest);
    assert.equal(draft.inputs.chest, raw);
    assert.equal(switchMeasurementUnit(draft, 'in'), draft);
    assert.throws(() => serializeMeasurements(draft));
  }
});

test('clearing a field removes it and restoring a valid value removes its error', () => {
  let draft = updateMeasurement(createMeasurementDraft(), 'waist', '-5');
  draft = updateMeasurement(draft, 'waist', '80.');
  assert.deepEqual(validateMeasurements(draft), {});
  assert.equal(draft.inputs.waist, '80.');
  draft = updateMeasurement(draft, 'waist', '');
  assert.equal(serializeMeasurements(draft), null);
});

test('collapsing groups does not alter values, fit, notes, or kilogram weight', () => {
  let draft = updateMeasurement(createMeasurementDraft(), 'garmentLength', '105');
  draft = { ...draft, weight: '70.5', fit: 'Custom', notes: 'More room at the shoulder.', expanded: { basic: false, upper: false, lower: false, additional: false } };
  draft = switchMeasurementUnit(draft, 'in');
  const payload = serializeMeasurements(draft);
  assert.equal(payload.values.garmentLength, 105);
  assert.deepEqual(payload.weight, { value: 70.5, unit: 'kg' });
  assert.equal(payload.desiredFit, 'Custom');
  assert.equal(payload.tailoringNotes, 'More room at the shoulder.');
  assert.equal(garmentLengthRequirement(payload), '105 cm');
  assert.deepEqual(JSON.parse(JSON.stringify({ measurements: payload })).measurements, payload);
});

test('garment context changes priority while retaining all groups', () => {
  assert.deepEqual(orderedMeasurementGroups('Pleated trousers').map(group => group.id), ['basic', 'lower', 'upper', 'additional']);
  assert.deepEqual(orderedMeasurementGroups('Shirt and jeans').map(group => group.id), ['basic', 'upper', 'lower', 'additional']);
  assert.equal(orderedMeasurementGroups('Unknown outfit').length, 4);
});

test('every field rejects values outside its stated range in both units', () => {
  for (const [key, , min, max] of measurementFields) {
    for (const unit of ['cm', 'in']) {
      let draft = switchMeasurementUnit(createMeasurementDraft(), unit);
      const factor = unit === 'in' ? 2.54 : 1;
      assert.ok(validateMeasurements(updateMeasurement(draft, key, String((min - 1) / factor)))[key]);
      assert.ok(validateMeasurements(updateMeasurement(draft, key, String((max + 1) / factor)))[key]);
    }
  }
});

test('weight validates independently of length units', () => {
  for (const weight of ['-1', '0', '999', 'abc', '-']) assert.ok(validateMeasurements({ ...createMeasurementDraft(), weight }).weight);
  assert.deepEqual(validateMeasurements({ ...createMeasurementDraft(), weight: '65' }), {});
});

test('reduced-motion observer responds to live changes and removes its listener', () => {
  let listener, removed;
  const media = { matches: false, addEventListener: (_, callback) => { listener = callback; }, removeEventListener: (_, callback) => { removed = callback; } };
  const values = [];
  const cleanup = observeReducedMotion(value => values.push(value), { matchMedia: query => { assert.equal(query, '(prefers-reduced-motion: reduce)'); return media; } });
  media.matches = true; listener();
  assert.deepEqual(values, [false, true]);
  cleanup(); assert.equal(removed, listener);
});

 test('session draft restoration retains canonical precision and invalid raw entries', () => {
  let draft = updateMeasurement(createMeasurementDraft(), 'chest', '97');
  draft = switchMeasurementUnit(draft, 'in');
  draft = updateMeasurement(draft, 'waist', '-');
  const saved = JSON.stringify({ version: 1, ...draft });
  const restored = loadMeasurementDraft({ getItem: key => { assert.equal(key, measurementDraftKey); return saved; } });
  assert.equal(restored.values.chest, 97);
  assert.equal(restored.inputs.chest, draft.inputs.chest);
  assert.equal(restored.inputs.waist, '-');
  assert.ok(validateMeasurements(restored).waist);
  assert.deepEqual(loadMeasurementDraft({ getItem: () => '{broken' }), createMeasurementDraft());
});
