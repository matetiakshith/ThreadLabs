// ISO joins keep the source's original names/coordinates untouched.
export const STATE_NAMES = {
  'IN-AP': 'Andhra Pradesh', 'IN-AR': 'Arunachal Pradesh', 'IN-AS': 'Assam',
  'IN-BR': 'Bihar', 'IN-CT': 'Chhattisgarh', 'IN-GA': 'Goa', 'IN-GJ': 'Gujarat',
  'IN-HR': 'Haryana', 'IN-HP': 'Himachal Pradesh', 'IN-JH': 'Jharkhand',
  'IN-KA': 'Karnataka', 'IN-KL': 'Kerala', 'IN-MP': 'Madhya Pradesh',
  'IN-MH': 'Maharashtra', 'IN-MN': 'Manipur', 'IN-ML': 'Meghalaya',
  'IN-MZ': 'Mizoram', 'IN-NL': 'Nagaland', 'IN-OR': 'Odisha', 'IN-PB': 'Punjab',
  'IN-RJ': 'Rajasthan', 'IN-SK': 'Sikkim', 'IN-TN': 'Tamil Nadu',
  'IN-TG': 'Telangana', 'IN-TR': 'Tripura', 'IN-UP': 'Uttar Pradesh',
  'IN-UT': 'Uttarakhand', 'IN-WB': 'West Bengal',
  'IN-AN': 'Andaman and Nicobar Islands', 'IN-CH': 'Chandigarh',
  'IN-DH': 'Dadra and Nagar Haveli and Daman and Diu', 'IN-DL': 'Delhi',
  'IN-JK': 'Jammu and Kashmir', 'IN-LA': 'Ladakh', 'IN-LD': 'Lakshadweep',
  'IN-PY': 'Puducherry',
};
export const ALL_INDIA_STATES = Object.values(STATE_NAMES).sort();

export function polygonsOf(geometry) {
  if (geometry?.type === 'Polygon') return [geometry.coordinates];
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates;
  throw new Error('Unsupported India boundary geometry');
}

export function validateIndiaData(data) {
  if (data?.type !== 'FeatureCollection' || data.features?.length !== 36) throw new Error('Expected 36 Indian states and union territories');
  const seen = new Set();
  for (const feature of data.features) {
    const iso = feature.properties?.shapeISO;
    if (!STATE_NAMES[iso] || seen.has(iso)) throw new Error('Unrecognized or duplicate state');
    seen.add(iso);
    for (const polygon of polygonsOf(feature.geometry)) {
      if (!polygon.length) throw new Error('Empty polygon');
      for (const ring of polygon) {
        if (ring.length < 4) throw new Error('Invalid boundary ring');
        const first = ring[0], last = ring.at(-1);
        if (first[0] !== last[0] || first[1] !== last[1]) throw new Error('Unclosed boundary ring');
        for (const [lon, lat] of ring) {
          if (!Number.isFinite(lon) || !Number.isFinite(lat) || lon < 68 || lon > 98 || lat < 6 || lat > 38) throw new Error('Expected WGS84 longitude, latitude coordinates');
        }
      }
    }
  }
  return data;
}

// One Mercator projection for mainland, enclaves and islands; no insets or offsets.
export function mercator([lon, lat]) {
  return [lon * Math.PI / 180, Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))];
}
export function projectIndia(data) {
  validateIndiaData(data);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const regions = data.features.map(feature => {
    const polygons = polygonsOf(feature.geometry).map(polygon => polygon.map(ring => ring.map(point => {
      const [x, y] = mercator(point);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      return [x, y];
    })));
    return { iso: feature.properties.shapeISO, name: STATE_NAMES[feature.properties.shapeISO], polygons };
  });
  const scale = 10 / (maxY - minY), cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  return regions.map(region => {
    const bounds = [Infinity, Infinity, -Infinity, -Infinity];
    const polygons = region.polygons.map(polygon => polygon.map(ring => ring.map(([x, y]) => {
      x = (x - cx) * scale; y = (y - cy) * scale;
      bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y);
      return [x, y];
    })));
    return { ...region, polygons, bounds };
  });
}

export function pointInRing(x, y, ring) {
  let inside = false;
  const count = ring.length / 2;
  for (let i = 0, j = count - 1; i < count; j = i++) {
    const xi = ring[i * 2], yi = ring[i * 2 + 1], xj = ring[j * 2], yj = ring[j * 2 + 1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function pointInRegion(x, y, region) {
  const [x1, y1, x2, y2] = region.bounds;
  if (x < x1 || x > x2 || y < y1 || y > y2) return false;
  return region.rings.some(([outer, ...holes]) => pointInRing(x, y, outer) && !holes.some(hole => pointInRing(x, y, hole)));
}
