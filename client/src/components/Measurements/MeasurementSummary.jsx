import { measurementFields, measurementGroups, formatMeasurement, inDisplayUnit } from './measurements';
import './measurements.css';

export default function MeasurementSummary({ measurements, open = false }) {
  // Older requests keep their original length-only review. No invented measurements.
  if (measurements?.schemaVersion !== 1 || measurements.unit !== 'cm') return null;
  const unit = measurements.displayUnit === 'in' ? 'in' : 'cm';
  const count = measurementFields.filter(([key]) => measurements.values[key] != null).length + (measurements.weight ? 1 : 0);
  return <details className="measurement-summary" open={open || undefined}>
    <summary>Customer Body Measurements <span>{count ? `${count} measurements · ${unit}` : 'Fit & tailoring notes'}</span></summary>
    {measurementGroups.map(group => {
      const fields = group.fields.filter(([key]) => measurements.values[key] != null);
      if (!fields.length && !(group.id === 'basic' && measurements.weight)) return null;
      return <div key={group.id} className="measurement-summary-group"><h4>{group.label}</h4><dl>{fields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{formatMeasurement(inDisplayUnit(measurements.values[key], unit))} {unit}</dd></div>)}{group.id === 'basic' && measurements.weight && <div><dt>Weight</dt><dd>{measurements.weight.value} {measurements.weight.unit}</dd></div>}</dl></div>;
    })}
    {measurements.desiredFit && <p className="measurement-summary-note">Desired fit: {measurements.desiredFit}</p>}
    {measurements.tailoringNotes && <p className="measurement-summary-note">Tailoring notes: {measurements.tailoringNotes}</p>}
    <p className="measurement-help">Shared with your artisan for confirmation. Lengths are saved in centimeters; weight in kilograms.</p>
  </details>;
}
