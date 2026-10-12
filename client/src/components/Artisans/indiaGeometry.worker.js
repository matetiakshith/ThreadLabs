import { buildIndiaGeometry } from './indiaGeometry.js';
self.onmessage = ({ data }) => {
  try {
    const regions = buildIndiaGeometry(data);
    self.postMessage({ regions }, regions.flatMap(region => [region.positions.buffer, region.normals.buffer, region.borders.buffer, ...region.rings.flat().map(ring => ring.buffer)]));
  } catch (error) { self.postMessage({ error: error.message }); }
};
