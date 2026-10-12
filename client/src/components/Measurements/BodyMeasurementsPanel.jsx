import { useId, useLayoutEffect, useRef } from 'react';
import { animate, createScope, stagger } from 'animejs';
import { ChevronDown } from 'lucide-react';
import useReducedMotion from './useReducedMotion';
import { fitOptions, orderedMeasurementGroups, updateMeasurement, switchMeasurementUnit, validateMeasurements } from './measurements';
import './measurements.css';

function MeasurementGroup({ group, open, toggle, children, errorCount, reduced }) {
  const id = useId();
  const region = useRef(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    const node = region.current;
    if (first.current || reduced) {
      first.current = false;
      node.style.height = open ? 'auto' : '0px';
      node.style.visibility = open ? 'visible' : 'hidden';
      return;
    }
    let scope;
    try {
      const start = node.getBoundingClientRect().height;
      node.style.visibility = 'visible';
      scope = createScope({ root: node }).add(() => {
        animate(node, { height: [start, open ? node.scrollHeight : 0], duration: 320, ease: 'out(3)',
          onComplete: () => { node.style.height = open ? 'auto' : '0px'; node.style.visibility = open ? 'visible' : 'hidden'; },
        });
        if (open) animate(node.querySelectorAll('.field-label'), { opacity: [.6, 1], y: [4, 0], delay: stagger(18), duration: 220, ease: 'out(3)' });
      });
    } catch {
      scope?.revert();
      node.style.height = open ? 'auto' : '0px';
      node.style.visibility = open ? 'visible' : 'hidden';
    }
    return () => {
      const height = node.getBoundingClientRect().height;
      const visibility = node.style.visibility;
      scope?.revert();
      // Carry the current visual height into an interrupted open/close transition.
      node.style.height = `${height}px`;
      node.style.visibility = visibility;
    };
  }, [open, reduced]);
  return <div className="measurement-group">
    <button type="button" className="measurement-disclosure" aria-expanded={open} aria-controls={id} onClick={toggle}>
      <span>{group.label}{errorCount > 0 && <small> · {errorCount} to check</small>}</span><ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
    </button>
    <div ref={region} id={id} role="region" aria-label={group.label} inert={!open} className="measurement-region"><div className="measurement-fields">{children}</div></div>
  </div>;
}

export default function BodyMeasurementsPanel({ draft, onChange, garment, draftStorageWarning }) {
  const id = useId();
  const reduced = useReducedMotion();
  const errors = validateMeasurements(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const update = patch => onChange(previous => ({ ...previous, ...patch }));
  return <section className="body-measurements" aria-labelledby={`${id}-title`}>
    <div className="measurement-heading"><h3 id={`${id}-title`}>Customer Body Measurements</h3><span className="muted">Optional</span></div>
    <p className="measurement-help">Add what you know. Your artisan can confirm the rest.</p>
    {draftStorageWarning && <p className="measurement-error" role="status">Browser draft storage is unavailable. Your entries stay here while this tab is open; refreshing will clear this draft.</p>}
    <label className="field-label measurement-unit">Measurement unit
      <select value={draft.unit} onChange={event => onChange(previous => switchMeasurementUnit(previous, event.target.value))} disabled={hasErrors} aria-describedby={hasErrors ? `${id}-errors` : undefined}>
        <option value="cm">Centimeters</option><option value="in">Inches</option>
      </select>
    </label>
    {orderedMeasurementGroups(garment).map(group => <MeasurementGroup key={group.id} group={group} reduced={reduced} open={draft.expanded[group.id]} errorCount={group.fields.filter(([key]) => errors[key]).length + (group.id === 'basic' && errors.weight ? 1 : 0)} toggle={() => onChange(previous => ({ ...previous, expanded: { ...previous.expanded, [group.id]: !previous.expanded[group.id] } }))}>
      {group.fields.map(([key, label]) => <div key={key} className="field-label"><label htmlFor={`${id}-${key}`}>{label} <span>({draft.unit})</span></label>
        <input id={`${id}-${key}`} type="text" inputMode="decimal" autoComplete="off" value={draft.inputs[key] || ''} onChange={event => onChange(previous => updateMeasurement(previous, key, event.target.value))} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${id}-${key}-error` : undefined} />
        {errors[key] && <small id={`${id}-${key}-error`} className="measurement-error">{errors[key]}</small>}
      </div>)}
      {group.id === 'basic' && <div className="field-label"><label htmlFor={`${id}-weight`}>Weight <span>(kg · optional)</span></label><input id={`${id}-weight`} type="text" inputMode="decimal" autoComplete="off" value={draft.weight} onChange={event => update({ weight: event.target.value })} aria-invalid={!!errors.weight} aria-describedby={errors.weight ? `${id}-weight-error` : undefined} />{errors.weight && <small id={`${id}-weight-error`} className="measurement-error">{errors.weight}</small>}</div>}
      {group.id === 'additional' && <>
        <label className="field-label">Desired fit<select value={draft.fit} onChange={event => update({ fit: event.target.value })}><option value="">Discuss with artisan</option>{fitOptions.map(fit => <option key={fit}>{fit}</option>)}</select></label>
        <label className="field-label measurement-notes">Tailoring notes <span>— optional</span><textarea rows={3} value={draft.notes} onChange={event => update({ notes: event.target.value })} /></label>
      </>}
    </MeasurementGroup>)}
    {hasErrors && <p id={`${id}-errors`} className="measurement-error" role="status">Check the marked measurements before switching units or creating your brief. Your entries are kept.</p>}
  </section>;
}
