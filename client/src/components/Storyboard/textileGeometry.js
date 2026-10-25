import * as THREE from 'three';
export const LONGITUDINAL_SEGMENTS = 128;
export const CROSS_SEGMENTS = 32;
export const mix = (a, b, t) => a + (b - a) * t;
const clamp = v => Math.max(0, Math.min(1, v));
const ease = t => t * t * (3 - 2 * t);

// Positions describe the centre of each independent length of cloth. The cloth's
// cross-section is reconstructed AFTER path interpolation, so it cannot flatten
// into a line when a sweep wraps into an orb.
function keyframe(stage, u, band, aspect) {
  const phase = band * Math.PI / 3;
  const span = Math.min(aspect, 1.3) * 5;
  if (stage < 2) {
    return {
      center: new THREE.Vector3((u - .5) * aspect * 13,
        -5.25 + Math.pow(Math.abs(u - .5) * 2, 1.6) * (1.8 + stage * .55)
        + Math.sin(u * 5.5 + phase) * .38 + band * .035,
        band * .58 + Math.sin(u * 8 + phase) * .13),
      width: 1.85 + .25 * Math.sin(u * 8 + phase), twist: .22 * Math.sin(u * 7 + phase), normal: new THREE.Vector3(0, 0, 1), folds: .16,
    };
  }
  if (stage === 2 || stage === 3 || stage === 6) {
    const opening = stage === 2;
    const exit = stage === 6;
    const x = Math.sin(u * Math.PI * 2 - .65) * (opening ? span * .36 : span * .64);
    return {
      center: new THREE.Vector3(x + (band - 2.5) * (.1 + .1 * u) + Math.sin(u * 5 + phase) * .12 - (exit ? 1.7 : 0),
        5.8 - u * 12 + (exit ? 6.2 : 0),
        band * .48 + Math.sin(u * 7 + phase * .22) * .65),
      width: opening ? .055 + Math.pow(u, 2) * 2.1 : .75 + Math.pow(Math.abs(u - .4) * 2, 1.2) * 1.15,
      twist: Math.sin(u * 6.5 + band * .18) * .65,
      normal: new THREE.Vector3(0, 0, 1), folds: opening ? .09 : .15,
    };
  }
  const radius = stage === 4 ? 1.95 : 2.18;
  const lat = (u - .5) * Math.PI * .88;
  const theta = phase + u * Math.PI * 1.8 + (stage === 4 ? -.25 : .15);
  const radial = new THREE.Vector3(Math.cos(lat) * Math.cos(theta), Math.sin(lat), Math.cos(lat) * Math.sin(theta));
  return {
    center: radial.clone().multiplyScalar(radius + .12 * Math.sin(u * 9 + phase)).add(new THREE.Vector3(0, 1.25, .6)),
    width: (.6 + Math.sin(u * Math.PI) * .65) * (stage === 4 ? 1 : 1.13),
    twist: .12 * Math.sin(u * 9 + phase), normal: radial, folds: .13,
  };
}
function blended(progress, u, band, aspect) {
  const p = Math.min(6, Math.max(0, progress));
  const stage = Math.min(5, Math.floor(p));
  // Small overlapping layer lag, zero at both endpoints: deterministic, reversible.
  const fraction = p - stage;
  const t = ease(clamp(fraction + Math.sin(fraction * Math.PI) * (band - 2.5) * .025));
  const a = keyframe(stage, u, band, aspect), b = keyframe(stage + 1, u, band, aspect);
  const center = a.center.lerp(b.center, t);
  if (stage === 3 || stage === 5) {
    const flight = Math.sin(t * Math.PI);
    center.x += Math.sin(u * Math.PI * 2 + band * .45) * flight * .55;
    center.z += Math.sin(u * Math.PI + band * .35) * flight * 1.1;
  }
  return { center, normal: a.normal.lerp(b.normal, t).normalize(), width: mix(a.width, b.width, t), twist: mix(a.twist, b.twist, t), folds: mix(a.folds, b.folds, t), p };
}
export function fabricFrame(progress, u, band, aspect) {
  const f = blended(progress, u, band, aspect);
  const tangent = blended(progress, Math.min(1, u + .0001), band, aspect).center.sub(blended(progress, Math.max(0, u - .0001), band, aspect).center).normalize();
  let side = new THREE.Vector3().crossVectors(tangent, f.normal);
  if (side.lengthSq() < .001) side.crossVectors(tangent, new THREE.Vector3(0, 1, 0));
  side.normalize().applyAxisAngle(tangent, f.twist);
  const normal = new THREE.Vector3().crossVectors(side, tangent).normalize();
  return { ...f, side, normal };
}
export function crossSection(frame, u, v, band, back = false) {
  const cross = v - .5;
  const phase = band * .73;
  const fold = frame.folds * (Math.sin(v * Math.PI * 5 + Math.sin(u * 7 + phase) * 1.8) * .72
    + Math.sin(v * Math.PI * 9 - u * 10 + phase) * .28);
  const curl = Math.pow(Math.abs(cross) * 2, 6) * (.065 + .035 * Math.sin(u * 19 + phase));
  const gather = .025 * Math.sin(u * 49 + v * 9 + phase) * Math.sin(v * Math.PI);
  const xyz = frame.center.clone().addScaledVector(frame.side, cross * frame.width)
    .addScaledVector(frame.normal, fold + curl + gather - (back ? .025 : 0));
  return xyz;
}
export function sampleFabricPoint(progress, u, v, band, aspect) {
  return crossSection(fabricFrame(progress, u, band, aspect), u, v, band).toArray();
}
export function createTextileGeometry() {
  const rows = LONGITUDINAL_SEGMENTS + 1, cols = CROSS_SEGMENTS + 1, count = rows * cols;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 2 * 3), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2 * 2), 2));
  const indices = [];
  for (let row = 0; row < rows - 1; row++) for (let col = 0; col < cols - 1; col++) {
    const a = row * cols + col, b = a + cols;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
    indices.push(a + count, a + 1 + count, b + count, b + count, a + 1 + count, b + 1 + count);
  }
  const seam = (a, b) => indices.push(a, a + count, b, b, a + count, b + count);
  for (let row = 0; row < rows - 1; row++) { seam(row * cols, (row + 1) * cols); seam((row + 1) * cols + cols - 1, row * cols + cols - 1); }
  for (let col = 0; col < cols - 1; col++) { seam(col + 1, col); seam((rows - 1) * cols + col, (rows - 1) * cols + col + 1); }
  geometry.setIndex(indices);
  return geometry;
}
export function updateTextileGeometry(geometry, frameAt, band) {
  const pos = geometry.attributes.position, uv = geometry.attributes.uv;
  const cols = CROSS_SEGMENTS + 1, count = (LONGITUDINAL_SEGMENTS + 1) * cols;
  let distance = 0, last;
  for (let row = 0; row <= LONGITUDINAL_SEGMENTS; row++) {
    const u = row / LONGITUDINAL_SEGMENTS, frame = frameAt(u);
    if (last) distance += frame.center.distanceTo(last);
    last = frame.center;
    for (let col = 0; col <= CROSS_SEGMENTS; col++) {
      const v = col / CROSS_SEGMENTS, i = row * cols + col;
      const front = crossSection(frame, u, v, band), back = front.clone().addScaledVector(frame.normal, -.025);
      pos.setXYZ(i, ...front.toArray()); pos.setXYZ(i + count, ...back.toArray());
      // Physical-distance UVs avoid stretching yarn across long ribbons.
      uv.setXY(i, distance * .65, v * frame.width * .65); uv.setXY(i + count, distance * .65, v * frame.width * .65);
    }
  }
  pos.needsUpdate = uv.needsUpdate = true;
  geometry.computeVertexNormals();
}
