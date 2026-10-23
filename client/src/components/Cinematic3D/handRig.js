import * as THREE from 'three';

/**
 * ThreadLabs original procedural right hand. All geometry, proportions and rigs
 * are authored here; no scans, stock models or reference-site assets are used.
 *
 * Bind space: palm centre (0, 0, 0), fingers +Y, dorsal side +Z,
 * thumb -X, wrist/forearm -Y. Units are roughly palm widths. The continuous
 * implicit skin is skinned to 22 bones, rather than separate finger primitives.
 * Call setPose for deterministic forward/reverse poses. Optional local-space
 * grasp targets let the index and thumb meet the two faces of an object's rim.
 */
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const smooth = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const v = (x, y, z) => new THREE.Vector3(x, y, z);

const FINGERS = [
  { name: 'index', base: [-.315, .405, -.012], lengths: [.46, .31, .245], radius: .104, spread: -.065 },
  { name: 'middle', base: [-.085, .475, -.016], lengths: [.50, .34, .25], radius: .108, spread: -.008 },
  { name: 'ring', base: [.155, .445, -.009], lengths: [.46, .32, .245], radius: .100, spread: .055 },
  { name: 'little', base: [.357, .315, .008], lengths: [.35, .245, .20], radius: .083, spread: .19 },
  { name: 'thumb', base: [-.335, -.185, -.025], lengths: [.37, .285, .23], radius: .127, spread: .76 },
];

function smoothMin(a, b, k) {
  const h = clamp(.5 + .5 * (b - a) / k);
  return b * (1 - h) + a * h - k * h * (1 - h);
}

function ellipsoid(x, y, z, cx, cy, cz, rx, ry, rz) {
  const px = x - cx, py = y - cy, pz = z - cz;
  const k0 = Math.hypot(px / rx, py / ry, pz / rz);
  const k1 = Math.hypot(px / (rx * rx), py / (ry * ry), pz / (rz * rz));
  return k1 < 1e-10 ? -Math.min(rx, ry, rz) : k0 * (k0 - 1) / k1;
}

function segmentDistance(x, y, z, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const u = clamp(((x - a.x) * dx + (y - a.y) * dy + (z - a.z) * dz) / (dx * dx + dy * dy + dz * dz || 1));
  return { distance: Math.hypot(x - a.x - dx * u, y - a.y - dy * u, z - a.z - dz * u), u };
}

// A small marching-tetrahedra authoring pass. Shared vertices ensure smooth
// normals and a single closed skin, including thumb webbing and knuckles.
function buildSkin(skeletonSegments, detail) {
  const fingerSegments = skeletonSegments.filter((s) => s.kind === 'finger');
  const field = (x, y, z) => {
    let d = ellipsoid(x, y, z, .025, -.02, 0, .47, .595, .158);
    d = smoothMin(d, ellipsoid(x, y, z, -.255, -.16, -.05, .245, .37, .185), .12);
    d = smoothMin(d, ellipsoid(x, y, z, .015, -.575, .005, .235, .37, .135), .11);
    // Long tapered forearm; the far end is rounded outside the intended crop.
    d = smoothMin(d, ellipsoid(x, y, z, .04, -1.64, -.005, .345, 1.20, .235), .15);
    for (const s of fingerSegments) {
      const hit = segmentDistance(x, y, z, s.a, s.b);
      const radius = s.radius * (1 - .115 * hit.u);
      d = smoothMin(d, hit.distance - radius, s.joint === 0 ? .068 : .035);
    }
    return d;
  };
  // Fingers need enough radial samples to retain a soft silhouette under the
  // reference's close camera. Lower detail remains substantially below 60k
  // triangles; both use the same continuous surface and contact proportions.
  const step = detail === 'low' ? .039 : .026;
  const min = [-1.14, -2.91, -.40], max = [.67, 1.72, .40];
  const nx = Math.ceil((max[0] - min[0]) / step) + 1;
  const ny = Math.ceil((max[1] - min[1]) / step) + 1;
  const nz = Math.ceil((max[2] - min[2]) / step) + 1;
  const samples = new Float32Array(nx * ny * nz);
  const idx = (x, y, z) => (z * ny + y) * nx + x;
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    samples[idx(x, y, z)] = field(min[0] + x * step, min[1] + y * step, min[2] + z * step);
  }
  const offsets = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  const tetrahedra = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]];
  const positions = [], indices = [], cache = new Map();
  const pointIndex = (a, b) => {
    const t = a[3] / (a[3] - b[3]);
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    // Weld by the originating lattice edge, rather than rounded coordinates:
    // nearby crossings around small knuckles must not collapse to one vertex.
    const key = a[4] < b[4] ? `${a[4]}:${b[4]}` : `${b[4]}:${a[4]}`;
    if (!cache.has(key)) { cache.set(key, positions.length / 3); positions.push(...p); }
    return cache.get(key);
  };
  const triangle = (a, b, c) => {
    const ai = a * 3, bi = b * 3, ci = c * 3;
    const ab = v(positions[bi] - positions[ai], positions[bi + 1] - positions[ai + 1], positions[bi + 2] - positions[ai + 2]);
    const ac = v(positions[ci] - positions[ai], positions[ci + 1] - positions[ai + 1], positions[ci + 2] - positions[ai + 2]);
    const n = ab.cross(ac);
    const cx = (positions[ai] + positions[bi] + positions[ci]) / 3;
    const cy = (positions[ai + 1] + positions[bi + 1] + positions[ci + 1]) / 3;
    const cz = (positions[ai + 2] + positions[bi + 2] + positions[ci + 2]) / 3;
    const e = .001;
    const gradient = v(field(cx + e, cy, cz) - field(cx - e, cy, cz), field(cx, cy + e, cz) - field(cx, cy - e, cz), field(cx, cy, cz + e) - field(cx, cy, cz - e));
    if (n.dot(gradient) < 0) indices.push(a, c, b); else indices.push(a, b, c);
  };
  for (let z = 0; z < nz - 1; z++) for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
    const cube = offsets.map(([dx, dy, dz]) => [min[0] + (x + dx) * step, min[1] + (y + dy) * step, min[2] + (z + dz) * step, samples[idx(x + dx, y + dy, z + dz)], idx(x + dx, y + dy, z + dz)]);
    if (cube.every((p) => p[3] >= 0) || cube.every((p) => p[3] < 0)) continue;
    for (const tet of tetrahedra) {
      const inside = tet.filter((i) => cube[i][3] < 0), outside = tet.filter((i) => cube[i][3] >= 0);
      if (inside.length === 1) triangle(...outside.map((i) => pointIndex(cube[inside[0]], cube[i])));
      if (inside.length === 3) triangle(...inside.map((i) => pointIndex(cube[outside[0]], cube[i])));
      if (inside.length === 2) {
        const a = pointIndex(cube[inside[0]], cube[outside[0]]), b = pointIndex(cube[inside[0]], cube[outside[1]]);
        const c = pointIndex(cube[inside[1]], cube[outside[0]]), d = pointIndex(cube[inside[1]], cube[outside[1]]);
        triangle(a, b, c); triangle(b, d, c);
      }
    }
  }
  const skinIndices = [], skinWeights = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    const candidates = skeletonSegments.map((s) => {
      const { distance } = segmentDistance(x, y, z, s.a, s.b);
      // A sharply local field prevents adjacent fingers influencing one another.
      const score = 1 / Math.pow(Math.max(.035, distance), 5);
      return { bone: s.bone, score };
    }).sort((a, b) => b.score - a.score).slice(0, 4);
    const total = candidates.reduce((sum, s) => sum + s.score, 0);
    for (const s of candidates) { skinIndices.push(s.bone); skinWeights.push(s.score / total); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geometry.computeVertexNormals();
  // Positions above are already welded by the shared edge cache. Marching
  // tetrahedra produce uneven skinny triangles; exact field gradients remove
  // their triangulation bias from the shading without changing the silhouette.
  const normals = new Float32Array(positions.length), epsilon = .0005;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    const nx = field(x + epsilon, y, z) - field(x - epsilon, y, z);
    const ny = field(x, y + epsilon, z) - field(x, y - epsilon, z);
    const nz = field(x, y, z + epsilon) - field(x, y, z - epsilon);
    const length = Math.hypot(nx, ny, nz) || 1;
    normals[i] = nx / length; normals[i + 1] = ny / length; normals[i + 2] = nz / length;
  }
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function solveTip(chain, target, iterations = 10) {
  const tip = chain.tip;
  const targetWorld = chain.root.parent.localToWorld(target.clone());
  const origin = new THREE.Vector3(), current = new THREE.Vector3();
  const inv = new THREE.Quaternion(), turn = new THREE.Quaternion();
  for (let iteration = 0; iteration < iterations; iteration++) {
    for (let j = 2; j >= 0; j--) {
      const joint = chain.bones[j];
      joint.getWorldPosition(origin); tip.getWorldPosition(current);
      inv.copy(joint.getWorldQuaternion(new THREE.Quaternion())).invert();
      const from = current.sub(origin).normalize().applyQuaternion(inv);
      const to = targetWorld.clone().sub(origin).normalize().applyQuaternion(inv);
      turn.setFromUnitVectors(from, to);
      // Damping avoids locking and creates a soft contact rather than a snap.
      joint.quaternion.multiply(new THREE.Quaternion().slerp(turn, .65));
      joint.updateWorldMatrix(false, true);
    }
  }
}

export function createHandRig({ detail = 'high', color = '#332521', roughness = .67, nails = false } = {}) {
  const group = new THREE.Group();
  group.name = 'ThreadLabsOriginalArticulatedRightHand';
  const wrist = new THREE.Bone(); wrist.name = 'wrist'; wrist.position.set(0, -.54, 0);
  const palm = new THREE.Bone(); palm.name = 'palm'; palm.position.set(0, .54, 0); wrist.add(palm);
  const bones = [wrist, palm], joints = { wrist, palm }, chains = {}, rest = new Map();
  for (const definition of FINGERS) {
    const { name, base, lengths, spread } = definition;
    const chain = [], parent = palm;
    let previous = parent;
    for (let i = 0; i < 3; i++) {
      const bone = new THREE.Bone(); bone.name = `${name}_${['metacarpal', 'middle', 'distal'][i]}`;
      bone.position.copy(i === 0 ? v(...base) : v(0, lengths[i - 1], 0));
      if (i === 0) bone.rotation.z = spread;
      if (name === 'thumb' && i === 0) bone.rotation.x = -.22;
      previous.add(bone); bones.push(bone); joints[bone.name] = bone; chain.push(bone); previous = bone;
    }
    const tip = new THREE.Bone(); tip.name = `${name}_tip`; tip.position.set(0, lengths[2], 0);
    previous.add(tip); bones.push(tip); joints[tip.name] = tip;
    chains[name] = { bones: chain, tip, root: chain[0], definition };
  }
  group.add(wrist); group.updateMatrixWorld(true);
  const segments = [
    { a: v(.04, -2.75, 0), b: v(0, -.54, 0), bone: 0, kind: 'forearm' },
    { a: v(0, -.49, 0), b: v(0, .42, 0), bone: 1, kind: 'palm' },
  ];
  for (const chain of Object.values(chains)) for (let i = 0; i < 3; i++) {
    const a = chain.bones[i].getWorldPosition(new THREE.Vector3());
    const b = (i === 2 ? chain.tip : chain.bones[i + 1]).getWorldPosition(new THREE.Vector3());
    segments.push({ a, b, bone: bones.indexOf(chain.bones[i]), radius: chain.definition.radius * Math.pow(.84, i), kind: 'finger', joint: i });
  }
  const geometry = buildSkin(segments, detail);
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness: .035 });
  const skin = new THREE.SkinnedMesh(geometry, material); skin.name = 'ContinuousAnatomicalSkin';
  skin.add(wrist); group.add(skin);
  const skeleton = new THREE.Skeleton(bones); skin.bind(skeleton);
  skin.castShadow = true; skin.receiveShadow = true; skin.frustumCulled = false;
  for (const bone of bones) rest.set(bone, bone.quaternion.clone());

  // Subtle keratin nails follow the distal bones. Their shallow domes avoid
  // an artificial toy-like white tip and preserve the dark warm material story.
  const nailGeometry = new THREE.SphereGeometry(1, 10, 6);
  const nailMaterial = new THREE.MeshStandardMaterial({ color: '#47352e', roughness: .45, metalness: .015 });
  for (const chain of nails ? Object.values(chains) : []) {
    const nail = new THREE.Mesh(nailGeometry, nailMaterial);
    const radius = chain.definition.radius * .68;
    nail.name = `${chain.definition.name}_nail`;
    nail.scale.set(radius * .72, chain.definition.lengths[2] * .31, .009);
    nail.position.set(0, chain.definition.lengths[2] * .62, radius * .88);
    chain.bones[2].add(nail);
  }

  let targets = null;
  group.setGraspTargets = (next) => {
    targets = next ? Object.fromEntries(Object.entries(next).map(([name, target]) => [name, target.isVector3 ? target.clone() : v(...target)])) : null;
    return group;
  };
  group.setPose = (pose = {}) => {
    const params = typeof pose === 'number' ? { grip: pose } : pose;
    const grip = smooth(params.grip ?? 0), pinch = smooth(params.pinch ?? params.grip ?? 0);
    const spread = params.spread ?? 0;
    for (const [bone, quaternion] of rest) bone.quaternion.copy(quaternion);
    wrist.rotateX(params.wrist ?? 0);
    for (const [name, chain] of Object.entries(chains)) {
      const thumb = name === 'thumb', ordinal = FINGERS.findIndex((f) => f.name === name);
      // Reference pinch leaves the index straighter while the remaining three
      // fingers cradle the rim. Overrides are absolute normalized curls and
      // remain sampled from the same master clock as the overall grip.
      const curl = (params.curls?.[name] === undefined
        ? (thumb ? pinch : grip)
        : smooth(params.curls[name])) * (thumb ? 1 : (1 + ordinal * .055));
      const angles = thumb ? [-.35, -.72, -.49] : [-.92, -1.28, -.62];
      chain.bones.forEach((bone, i) => bone.rotateX(angles[i] * curl));
      chain.root.rotateZ((thumb ? -.35 * pinch : (ordinal - 1.5) * .065 * spread * (1 - grip)));
      if (thumb) chain.root.rotateY(-.78 * pinch);
    }
    group.updateWorldMatrix(true, true);
    if (targets) for (const name of ['index', 'thumb']) {
      if (!targets[name]) continue;
      const chain = chains[name];
      const localTip = palm.worldToLocal(chain.tip.getWorldPosition(new THREE.Vector3()));
      const target = localTip.lerp(targets[name], name === 'thumb' ? pinch : grip);
      solveTip(chain, target);
    }
    skeleton.update();
    return group;
  };
  group.getContactPoints = () => Object.fromEntries(['thumb', 'index', 'middle', 'ring', 'little'].map((name) => [name, group.worldToLocal(chains[name].tip.getWorldPosition(new THREE.Vector3()))]));
  group.joints = joints; group.chains = chains; group.skin = skin; group.skeleton = skeleton;
  group.userData.provenance = 'Original ThreadLabs procedural implicit surface, anatomy and skeletal rig; authored in this source. No third-party model assets.';
  group.userData.conventions = { fingers: '+Y', dorsal: '+Z', thumb: '-X', forearm: '-Y', palmWidth: .94 };
  group.dispose = () => { geometry.dispose(); material.dispose(); nailGeometry.dispose(); nailMaterial.dispose(); skeleton.dispose(); };
  group.setPose(0);
  return group;
}

export function updateHandPose(hand, gripOrPose) {
  return hand.setPose(gripOrPose);
}

export default createHandRig;
