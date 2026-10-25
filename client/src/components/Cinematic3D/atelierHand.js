import * as T from 'three';

const FINGERS = ['index', 'middle', 'ring', 'pinky'];
const X = new T.Vector3(1, 0, 0), Z = new T.Vector3(0, 0, 1);

/**
 * Prepare the licensed Meta/WebXR anatomical hand for a 0.8-radius XY hoop.
 * The caller owns root transforms/visibility and disposes resources on teardown.
 * Call pose() from the shared scroll timeline; it never adds a clock or listener.
 */
export function setupHand(gltfScene) {
  const root = new T.Group();
  root.name = 'atelier-articulated-hand';
  const orient = new T.Group();
  orient.name = 'hand-anatomical-orientation';
  root.add(orient);
  orient.add(gltfScene);

  // The official XR asset stores 25 independent world-space joints. Reparent
  // with attach() before posing, preserving every original inverse bind matrix.
  gltfScene.updateMatrixWorld(true);
  const bones = new Map();
  gltfScene.traverse(node => { if (node.isBone) bones.set(node.name, node); });
  const wrist = bones.get('wrist');
  if (!wrist || bones.size !== 25) throw new Error('Atelier hand requires the 25-joint generic-hand rig');
  const chains = [
    ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'],
    ...FINGERS.map(f => [`${f}-finger-metacarpal`, `${f}-finger-phalanx-proximal`, `${f}-finger-phalanx-intermediate`, `${f}-finger-phalanx-distal`, `${f}-finger-tip`]),
  ];
  for (const names of chains) {
    let parent = wrist;
    for (const name of names) { const bone = bones.get(name); parent.attach(bone); parent = bone; }
  }
  const bind = new Map([...bones].map(([name, bone]) => [name, {
    position: bone.position.clone(), quaternion: bone.quaternion.clone(), scale: bone.scale.clone(),
  }]));

  // Original source metres: fingers -Y, palm -X. This positive-determinant
  // rotation makes fingers +Y and palm +Z; it never mirrors skinned normals.
  orient.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(
    new T.Vector3(0, 0, -1), new T.Vector3(0, -1, 0), new T.Vector3(-1, 0, 0),
  ));
  orient.scale.setScalar(5.7);
  gltfScene.position.copy(wrist.position).multiplyScalar(-1);

  const material = new T.MeshPhysicalMaterial({
    name: 'Atelier warm natural skin', color: '#a56c4d', roughness: 0.56,
    metalness: 0, clearcoat: 0.035, clearcoatRoughness: 0.68,
    sheen: 0.18, sheenColor: '#c88b70', sheenRoughness: 0.95,
  });
  const materials = new Set([material]);
  gltfScene.traverse(node => {
    if (!node.isMesh) return;
    node.material?.dispose(); node.material = material;
    node.castShadow = true; node.receiveShadow = true;
    node.frustumCulled = false; // bind-pose bounds do not bound bent fingertips
    if (node.isSkinnedMesh) node.normalizeSkinWeights();
  });

  const q = new T.Quaternion();
  function bend(name, flex = 0, spread = 0) {
    const bone = bones.get(name), initial = bind.get(name);
    bone.quaternion.copy(initial.quaternion);
    // -Z points toward the fingertip and -Y out of the palm in WebXR.
    // Negative X flexion therefore closes the fingers toward the palm.
    bone.quaternion.multiply(q.setFromAxisAngle(X, -flex));
    if (spread) bone.quaternion.multiply(q.setFromAxisAngle(Z, spread));
  }
  function pose(grip = 0) {
    const g = T.MathUtils.clamp(grip, 0, 1);
    for (const [name, bone] of bones) {
      const initial = bind.get(name);
      bone.position.copy(initial.position); bone.quaternion.copy(initial.quaternion); bone.scale.copy(initial.scale);
    }
    FINGERS.forEach((finger, i) => {
      const s = [0.06, 0.015, -0.025, -0.07][i] * (1 - g);
      bend(`${finger}-finger-phalanx-proximal`, 0.06 + g * [0.44, 0.51, 0.61, 0.70][i], s);
      bend(`${finger}-finger-phalanx-intermediate`, 0.09 + g * [0.76, 0.91, 1.02, 1.06][i]);
      bend(`${finger}-finger-phalanx-distal`, 0.045 + g * [0.32, 0.39, 0.44, 0.48][i]);
    });
    bend('thumb-metacarpal', g * 0.22, g * 0.27);
    bend('thumb-phalanx-proximal', 0.07 + g * 0.31);
    bend('thumb-phalanx-distal', 0.04 + g * 0.19);
    root.updateMatrixWorld(true);
  }
  root.position.set(-0.79, -1.15, -0.11);
  root.rotation.z = -0.34;
  pose(0);
  return { root, pose, bones, materials, wrist, source: gltfScene };
}
