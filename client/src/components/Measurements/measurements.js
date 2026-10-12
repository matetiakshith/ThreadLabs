// All linear values are stored in centimeters. Display strings are never used
// as the source for a unit conversion, so repeated switches cannot compound rounding.
export const measurementGroups = [
  { id: 'basic', label: 'Basic', fields: [['height', 'Height', 30, 260]] },
  { id: 'upper', label: 'Upper Body', fields: [
    ['neck', 'Neck circumference', 10, 90], ['shoulder', 'Shoulder width', 10, 90],
    ['chest', 'Chest / Bust', 25, 250], ['waist', 'Waist', 20, 250],
    ['hip', 'Hip', 25, 270], ['armLength', 'Arm length', 10, 120],
    ['bicep', 'Bicep circumference', 8, 100], ['wrist', 'Wrist circumference', 5, 50],
    ['torsoLength', 'Torso / Top length', 10, 160],
  ] },
  { id: 'lower', label: 'Lower Body', fields: [
    ['inseam', 'Inseam', 10, 140], ['outseam', 'Outseam', 15, 180],
    ['thigh', 'Thigh circumference', 10, 150], ['knee', 'Knee circumference', 8, 100],
    ['calf', 'Calf circumference', 8, 100], ['ankle', 'Ankle circumference', 5, 70],
    ['rise', 'Rise', 5, 70],
  ] },
  { id: 'additional', label: 'Additional Measurements', fields: [
    ['garmentLength', 'Garment length', 5, 300], ['sleeveLength', 'Sleeve length', 2, 120],
  ] },
];
export const measurementFields = measurementGroups.flatMap(group => group.fields);
export const fitOptions = ['Slim', 'Regular', 'Relaxed', 'Custom'];
export const formatMeasurement = value => String(Number(value.toFixed(6)));
export const inDisplayUnit = (cm, unit) => unit === 'in' ? cm / 2.54 : cm;
export const createMeasurementDraft = () => ({
  unit: 'cm', values: {}, inputs: {}, weight: '', fit: '', notes: '',
  expanded: { basic: true, upper: false, lower: false, additional: false },
});

export const measurementDraftKey = 'threadlabsMeasurementDraft';
export function loadMeasurementDraft(storage) {
  const blank = createMeasurementDraft();
  try {
    const saved = JSON.parse(storage.getItem(measurementDraftKey) || 'null');
    if (saved?.version !== 1 || !['cm', 'in'].includes(saved.unit)) return blank;
    const keys = measurementFields.map(([key]) => key);
    return {
      ...blank, unit: saved.unit,
      inputs: Object.fromEntries(keys.filter(key => typeof saved.inputs?.[key] === 'string').map(key => [key, saved.inputs[key]])),
      values: Object.fromEntries(keys.filter(key => Number.isFinite(saved.values?.[key])).map(key => [key, saved.values[key]])),
      weight: typeof saved.weight === 'string' ? saved.weight : '',
      fit: typeof saved.fit === 'string' ? saved.fit : '',
      notes: typeof saved.notes === 'string' ? saved.notes : '',
      expanded: Object.fromEntries(measurementGroups.map(({ id }) => [id, typeof saved.expanded?.[id] === 'boolean' ? saved.expanded[id] : blank.expanded[id]])),
    };
  } catch { return blank; }
}

export function updateMeasurement(draft, key, raw) {
  const cm = Number(raw) * (draft.unit === 'in' ? 2.54 : 1);
  const values = { ...draft.values };
  if (raw.trim() && Number.isFinite(cm)) values[key] = cm;
  else delete values[key];
  return { ...draft, inputs: { ...draft.inputs, [key]: raw }, values };
}

export function validateMeasurements(draft) {
  const errors = {};
  for (const [key, , min, max] of measurementFields) {
    const raw = draft.inputs[key] || '';
    if (!raw.trim()) continue;
    const value = draft.values[key];
    if (!/^\d+(?:\.\d*)?$|^\.\d+$/.test(raw.trim()) || !Number.isFinite(value) || value < min || value > max) {
      errors[key] = `Enter ${formatMeasurement(inDisplayUnit(min, draft.unit))}–${formatMeasurement(inDisplayUnit(max, draft.unit))} ${draft.unit}.`;
    }
  }
  if (draft.weight.trim() && (!/^\d+(?:\.\d*)?$|^\.\d+$/.test(draft.weight.trim()) || Number(draft.weight) < 2 || Number(draft.weight) > 500)) {
    errors.weight = 'Enter a weight from 2–500 kg.';
  }
  if (draft.fit && !fitOptions.includes(draft.fit)) errors.fit = 'Choose a listed fit.';
  return errors;
}

export function switchMeasurementUnit(draft, unit) {
  if (!['cm', 'in'].includes(unit) || Object.keys(validateMeasurements(draft)).length) return draft;
  return { ...draft, unit, inputs: Object.fromEntries(Object.entries(draft.values).map(([key, cm]) => [key, formatMeasurement(inDisplayUnit(cm, unit))])) };
}

export function serializeMeasurements(draft) {
  if (Object.keys(validateMeasurements(draft)).length) throw new Error('Correct the measurements before submitting.');
  if (!Object.keys(draft.values).length && !draft.weight.trim() && !draft.fit && !draft.notes.trim()) return null;
  return {
    schemaVersion: 1, unit: 'cm', displayUnit: draft.unit, values: { ...draft.values },
    weight: draft.weight.trim() ? { value: Number(draft.weight), unit: 'kg' } : null,
    desiredFit: draft.fit || null, tailoringNotes: draft.notes.trim() || null,
  };
}

export function garmentLengthRequirement(measurements) {
  return measurements?.values.garmentLength != null ? `${formatMeasurement(measurements.values.garmentLength)} cm` : 'Discuss with artisan';
}

export function orderedMeasurementGroups(garment = '') {
  const lower = /\b(jeans?|trousers?|pants?|shorts?|skirts?|lehenga|leggings?)\b/i.test(garment);
  const upper = /\b(shirts?|t-?shirts?|tops?|jackets?|kurta|sherwani|blouse|dresses?|gown|suit)\b/i.test(garment);
  const ids = lower && !upper ? ['basic', 'lower', 'upper', 'additional'] : ['basic', 'upper', 'lower', 'additional'];
  return ids.map(id => measurementGroups.find(group => group.id === id));
}
