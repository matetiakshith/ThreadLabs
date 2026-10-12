import { Shape, Path, ExtrudeGeometry } from 'three';
import { projectIndia } from './indiaGeography.js';

export function buildIndiaGeometry(data) {
  return projectIndia(data).map(({ iso, name, polygons, bounds }) => {
    const shapes = polygons.map(([outer, ...holes]) => {
      const shape = new Shape();
      outer.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
      shape.closePath();
      holes.forEach(ring => {
        const hole = new Path();
        ring.forEach(([x, y], i) => i ? hole.lineTo(x, y) : hole.moveTo(x, y));
        hole.closePath(); shape.holes.push(hole);
      });
      return shape;
    });
    const geometry = new ExtrudeGeometry(shapes, { depth: 0.075, bevelEnabled: false, steps: 1, curveSegments: 1 });
    // Ring outlines preserve every hole and detached polygon, without artificial bridges.
    const borders = [];
    polygons.forEach(polygon => polygon.forEach(ring => {
      for (let i = 1; i < ring.length; i++) borders.push(...ring[i - 1], 0.078, ...ring[i], 0.078);
    }));
    const result = { iso, name, bounds, positions: geometry.attributes.position.array,
      normals: geometry.attributes.normal.array,
      rings: polygons.map(polygon => polygon.map(ring => new Float32Array(ring.flat()))),
      borders: new Float32Array(borders), polygonCount: polygons.length };
    geometry.dispose();
    return result;
  });
}
