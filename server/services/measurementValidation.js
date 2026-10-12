import { measurementFields, fitOptions } from '../../client/src/components/Measurements/measurements.js';

export function validMeasurementPayload(value) {
  if (value === null || value === undefined) return true; // Existing fields are optional.
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || value.schemaVersion !== 1 || value.unit !== 'cm' || !['cm','in'].includes(value.displayUnit)
    || !value.values || typeof value.values !== 'object' || Array.isArray(value.values)) return false;
  if (Object.keys(value).some(key => !['schemaVersion','unit','displayUnit','values','weight','desiredFit','tailoringNotes'].includes(key))) return false;
  const ranges = new Map(measurementFields.map(([key, , min, max]) => [key, [min,max]]));
  for (const [key, number] of Object.entries(value.values)) {
    const range = ranges.get(key);
    if (!range || !Number.isFinite(number) || number < range[0] || number > range[1]) return false;
  }
  if (value.weight && (Object.keys(value.weight).some(key => !['unit','value'].includes(key)) || value.weight.unit !== 'kg' || !Number.isFinite(value.weight.value) || value.weight.value < 2 || value.weight.value > 500)) return false;
  if (value.desiredFit && !fitOptions.includes(value.desiredFit)) return false;
  if (value.tailoringNotes && (typeof value.tailoringNotes !== 'string' || value.tailoringNotes.length > 2000)) return false;
  return true;
}
