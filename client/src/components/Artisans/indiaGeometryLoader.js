let geographyPromise;
export function loadIndiaGeometry() {
  if (!geographyPromise) geographyPromise = fetch('/data/india-states.geojson')
    .then(response => { if (!response.ok) throw new Error('Boundary data could not be loaded'); return response.json(); })
    .then(data => new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./indiaGeometry.worker.js', import.meta.url), { type: 'module' });
      const timer = setTimeout(() => { worker.terminate(); reject(new Error('Boundary preparation timed out')); }, 30000);
      const finish = () => { clearTimeout(timer); worker.terminate(); };
      worker.onmessage = event => { finish(); if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.regions); };
      worker.onerror = () => { finish(); reject(new Error('Boundary preparation failed')); };
      worker.postMessage(data);
    })).catch(error => { geographyPromise = undefined; throw error; });
  return geographyPromise;
}
