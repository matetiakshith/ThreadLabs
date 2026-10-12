import { Component, Suspense, lazy, useCallback, useEffect, useId, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight, Minus, Plus, RotateCcw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ALL_INDIA_STATES } from './indiaGeography';
import { loadIndiaGeometry } from './indiaGeometryLoader';
import './india-artisan-map.css';

const IndiaMapScene = lazy(() => import('./IndiaMapScene'));
class MapBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? <div className="india-map-notice" role="status">The 3D view is unavailable. Use the state search below to find artisans.</div> : this.props.children; }
}

export default function IndiaArtisanMap({ initialState, onExplore }) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const id = useId();
  const [regions, setRegions] = useState(null);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(null);
  const [selected, setSelected] = useState(initialState || null);
  const [query, setQuery] = useState(initialState || '');
  const [hovered, setHovered] = useState(null);
  const [command, setCommand] = useState({ type: 'overview', serial: 0 });
  const onFailure = useCallback(() => setSupported(false), []);
  const exact = ALL_INDIA_STATES.find(name => name.toLowerCase() === query.trim().toLowerCase());
  const choose = name => {
    setSelected(name); setQuery(name); setHovered(null);
    setCommand(value => ({ type: 'focus', name, serial: value.serial + 1 }));
  };
  const reset = () => {
    setSelected(null); setQuery(''); setHovered(null);
    setCommand(value => ({ type: 'overview', serial: value.serial + 1 }));
  };
  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      const probe = document.createElement('canvas');
      const context = probe.getContext('webgl2');
      if (mounted) setSupported(Boolean(context));
      context?.getExtension('WEBGL_lose_context')?.loseContext();
      return context ? loadIndiaGeometry() : null;
    }).then(data => { if (mounted && data) setRegions(data); })
      .catch(reason => { if (mounted) setError(reason.message); });
    return () => { mounted = false; };
  }, []);
  const available = supported && regions && !error;
  return <div className="india-artisan-map">
    <div className="india-map-viewport" onPointerLeave={() => setHovered(null)}>
      <div className="india-map-caption"><span>INDIA / 36 REGIONS</span><span>Geographic craft discovery</span></div>
      {available ? <MapBoundary onFailure={onFailure}><Suspense fallback={<div className="india-map-notice" role="status">Preparing India’s boundaries…</div>}>
        <IndiaMapScene regions={regions} selected={selected} hovered={hovered} command={command}
          reduced={reduced} dark={theme === 'dark'} onHover={setHovered} onChoose={choose} onFailure={onFailure} />
      </Suspense></MapBoundary> : <div className="india-map-notice" role="status">
        {error ? 'The map could not load. You can still search every state below.' : supported === false ? '3D maps are unavailable on this device. Search any state below.' : 'Preparing India’s boundaries…'}
        {error && <button type="button" onClick={() => { setError(''); loadIndiaGeometry().then(setRegions).catch(reason => setError(reason.message)); }}>Retry map</button>}
      </div>}
      {hovered && <div className="india-map-hover" aria-hidden="true"><strong>{hovered}</strong><span>Check for artisans in {hovered} →</span></div>}
      <div className="india-map-controls" aria-label="Map camera controls">
        <button type="button" disabled={!available} aria-label="Zoom into India map" onClick={() => setCommand(value => ({ type: 'zoom', factor: 1.35, serial: value.serial + 1 }))}><Plus size={17} /></button>
        <button type="button" disabled={!available} aria-label="Zoom out of India map" onClick={() => setCommand(value => ({ type: 'zoom', factor: 1 / 1.35, serial: value.serial + 1 }))}><Minus size={17} /></button>
        <button type="button" aria-label="Return to full India map" onClick={reset}><RotateCcw size={16} /></button>
      </div>
      <span className="india-map-instructions">Drag to tilt · Pinch or use + / − to zoom</span>
    </div>
    <div className="india-map-discovery">
      <label htmlFor={`${id}-search`}>Find a state or union territory</label>
      <input id={`${id}-search`} type="search" list={`${id}-states`} autoComplete="off" placeholder="Search all 36 regions…"
        value={query} onFocus={event => event.target.select()}
        onChange={event => {
          const value = event.target.value; setQuery(value);
          const match = ALL_INDIA_STATES.find(name => name.toLowerCase() === value.trim().toLowerCase());
          if (match) choose(match);
        }}
        onKeyDown={event => { if (event.key === 'Enter' && exact) { event.preventDefault(); choose(exact); } }}
        aria-describedby={`${id}-selection`} />
      <datalist id={`${id}-states`}>{ALL_INDIA_STATES.map(name => <option key={name} value={name} />)}</datalist>
      <p id={`${id}-selection`} className="india-map-selection" role="status">
        {exact && selected === exact ? `Selected: ${selected}` : query ? 'Choose a full state or territory name from the suggestions.' : 'Select a region on the map or search by name.'}
      </p>
      <button type="button" className="primary-button india-map-cta" disabled={!exact || selected !== exact} onClick={() => onExplore(exact)}>
        <span>{exact ? `Check for artisans in ${exact}` : 'Choose a region to find artisans'}</span><ArrowRight size={16} />
      </button>
    </div>
    <p className="india-map-source">Boundaries: <a href="https://www.geoboundaries.org/api/current/gbOpen/IND/ADM1/" target="_blank" rel="noreferrer">DataMeet / geoBoundaries</a> · <a href="https://creativecommons.org/licenses/by/2.5/in/" target="_blank" rel="noreferrer">CC BY 2.5 IN</a>. Community boundary data; not a survey map.</p>
  </div>;
}
