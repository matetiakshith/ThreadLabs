import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectIndia, polygonsOf, validateIndiaData, STATE_NAMES, mercator, pointInRegion } from './indiaGeography.js';
import { buildIndiaGeometry } from './indiaGeometry.js';
const data = JSON.parse(readFileSync(new URL('../../../public/data/india-states.geojson', import.meta.url)));

test('licensed local data covers every canonical state/UT and uses valid WGS84 rings', () => {
  assert.equal(validateIndiaData(data), data);
  assert.deepEqual(new Set(data.features.map(f => f.properties.shapeISO)), new Set(Object.keys(STATE_NAMES)));
  for (const name of ['Telangana', 'Maharashtra', 'Kerala', 'Rajasthan', 'Arunachal Pradesh']) {
    assert.ok(projectIndia(data).some(region => region.name === name));
  }
});
test('all disconnected islands/enclaves are retained, never joined or moved to insets', () => {
  const regions = projectIndia(data);
  for (const [iso, count] of [['IN-AN', 187], ['IN-LD', 22], ['IN-PY', 21], ['IN-DH', 3]]) {
    assert.equal(regions.find(region => region.iso === iso).polygons.length, count);
  }
  const andaman = regions.find(r => r.iso === 'IN-AN'), kerala = regions.find(r => r.iso === 'IN-KL');
  const lakshadweep = regions.find(r => r.iso === 'IN-LD');
  assert.ok(andaman.bounds[0] > kerala.bounds[2]);
  assert.ok(lakshadweep.bounds[2] < kerala.bounds[0]);
  assert.ok(andaman.bounds[1] < kerala.bounds[1]);
});
test('one projection preserves relative geography and all input vertices without mutating data', () => {
  const before = JSON.stringify(data), regions = projectIndia(data);
  for (const feature of data.features) {
    const original = polygonsOf(feature.geometry), projected = regions.find(r => r.iso === feature.properties.shapeISO).polygons;
    original.forEach((polygon, i) => polygon.forEach((ring, j) => assert.equal(projected[i][j].length, ring.length)));
  }
  assert.equal(JSON.stringify(data), before);
  assert.ok(mercator([92, 10])[0] > mercator([72, 10])[0]);
  assert.throws(() => polygonsOf({ type: 'LineString' }));
  assert.throws(() => validateIndiaData({ type: 'FeatureCollection', features: data.features.slice(1) }));
});
test('Polygon holes and MultiPolygon pieces survive Three triangulation and extrusion', () => {
  const fixture = structuredClone(data);
  const feature = fixture.features.find(f => f.properties.shapeISO === 'IN-TG');
  feature.geometry = { type: 'MultiPolygon', coordinates: [
    [[[78, 17], [80, 17], [80, 19], [78, 19], [78, 17]], [[78.5, 17.5], [78.5, 18.5], [79.5, 18.5], [79.5, 17.5], [78.5, 17.5]]],
    [[[81, 17], [81.5, 17], [81.5, 17.5], [81, 17.5], [81, 17]]],
  ] };
  const mesh = buildIndiaGeometry(fixture).find(r => r.iso === 'IN-TG');
  const projected = projectIndia(fixture).find(r => r.iso === 'IN-TG');
  const hole = projected.polygons[0][1];
  const cx = (hole[0][0] + hole[2][0]) / 2, cy = (hole[0][1] + hole[2][1]) / 2;
  function contains(ax, ay, bx, by, dx, dy) {
    const signs = [(cx - bx) * (ay - by) - (ax - bx) * (cy - by),
      (cx - dx) * (by - dy) - (bx - dx) * (cy - dy),
      (cx - ax) * (dy - ay) - (dx - ax) * (cy - ay)];
    return signs.every(v => v >= 0) || signs.every(v => v <= 0);
  }
  let topTriangles = 0;
  for (let i = 0; i < mesh.positions.length; i += 9) {
    const p = mesh.positions;
    if (p[i + 2] > 0.07 && p[i + 5] > 0.07 && p[i + 8] > 0.07) {
      topTriangles++;
      assert.equal(contains(p[i], p[i+1], p[i+3], p[i+4], p[i+6], p[i+7]), false, 'hole must remain empty');
    }
  }
  assert.ok(topTriangles > 0); assert.equal(mesh.polygonCount, 2);
  assert.equal(mesh.borders.length, 3 * 4 * 6);
  assert.equal(pointInRegion(cx, cy, mesh), false);
  const piece = projected.polygons[1][0];
  assert.equal(pointInRegion((piece[0][0]+piece[2][0])/2, (piece[0][1]+piece[2][1])/2, mesh), true);
  assert.equal(pointInRegion(mesh.bounds[2]+1, cy, mesh), false);
});
test('actual meshes have finite attributes and match every source polygon count', () => {
  const regions = buildIndiaGeometry(data);
  for (const region of regions) {
    assert.equal(region.positions.length, region.normals.length);
    assert.ok(region.positions.length > 0);
    assert.ok(region.positions.every(Number.isFinite));
    assert.equal(region.polygonCount, polygonsOf(data.features.find(f => f.properties.shapeISO === region.iso).geometry).length);
  }
});
