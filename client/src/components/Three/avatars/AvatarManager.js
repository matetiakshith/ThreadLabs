import * as THREE from 'three';

/**
 * High-Precision Articulated Fashion Mannequin & Digital Avatar System
 * Inspired directly by professional 3D atelier & haute couture articulated mannequins:
 * - Sculpted anatomical head, neck, pectoral chest, abdomen, obliques, and pelvic cradle
 * - Articulated ball-and-socket shoulder hinges, dual-pivot elbow joints, wrist rings
 * - Sleek grooved forearms and articulated relaxed hands with sculpted fingers
 * - Articulated hip mechanics, contoured quadriceps, dual-disc knee hinges, gastrocnemius calves, articulated ankles, and sculpted feet
 * - Studio matte white satin resin PBR finish with titanium joint hardware
 * - Strict architectural separation of VISIBLE MESH vs INVISIBLE PHYSICS COLLISION BODY
 * - Automated garment occlusion mask support (zero show-through or clipping)
 */

export function createHumanAvatar(gender = 'male', options = {}) {
  const isMale = gender.toLowerCase() === 'male';
  const root = new THREE.Group();
  root.name = `mannequin-${gender}`;

  // Groups
  const visibleGroup = new THREE.Group();
  visibleGroup.name = 'visible-body-group';
  root.add(visibleGroup);

  const collisionGroup = new THREE.Group();
  collisionGroup.name = 'collision-body-group';
  collisionGroup.visible = false; // Physics-only: NEVER rendered to camera
  root.add(collisionGroup);

  // =========================================================================
  // 1. HIGH-END ATELIER MANNEQUIN PBR MATERIALS
  // =========================================================================

  // Pure Matte/Satin Porcelain-White Fashion Resin Material
  const resinMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf6f6f8),
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.28,
    clearcoatRoughness: 0.22,
    sheen: 0.45,
    sheenColor: new THREE.Color(0xffffff),
    reflectivity: 0.5,
    side: THREE.FrontSide,
  });

  // Polished Titanium / Chrome Articulation Hardware Material
  const jointMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x8e929b,
    metalness: 0.88,
    roughness: 0.18,
  });

  // Darkened Inner Mechanical Joint Shadow Material
  const socketInnerMaterial = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    metalness: 0.5,
    roughness: 0.6,
  });

  // Collision Debug Wireframe Material (Only visible when debug HUD is enabled)
  const collisionDebugMaterial = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });

  // =========================================================================
  // 2. FASHION FIGURE PROPORTIONS (8.5-Head Haute Couture Benchmark)
  // =========================================================================
  const headRadius = isMale ? 0.14 : 0.125;
  const neckRadius = isMale ? 0.065 : 0.052;
  const shoulderWidth = isMale ? 0.54 : 0.44;
  const chestWidth = isMale ? 0.42 : 0.35;
  const chestDepth = isMale ? 0.24 : 0.21;
  const waistWidth = isMale ? 0.32 : 0.24;
  const waistDepth = isMale ? 0.19 : 0.16;
  const hipWidth = isMale ? 0.36 : 0.39;
  const hipDepth = isMale ? 0.22 : 0.23;
  const armLength = 0.72;
  const legLength = 1.08;
  const legSpacing = isMale ? 0.12 : 0.105;

  const bodyParts = {};

  // =========================================================================
  // 3. VISIBLE ARTICULATED MANNEQUIN ASSEMBLY
  // =========================================================================

  // --- A. HEAD & FACIAL PROFILE ---
  const headGroup = new THREE.Group();
  headGroup.name = 'head-group';

  // Cranium & Cheek Contours
  const headGeo = new THREE.SphereGeometry(headRadius, 32, 32);
  headGeo.scale(0.85, 1.28, 0.96);
  const headMesh = new THREE.Mesh(headGeo, resinMaterial);
  headMesh.position.set(0, 1.64, 0.015);
  headGroup.add(headMesh);

  // Sculpted Jawline & Chin
  const jawGeo = new THREE.CylinderGeometry(headRadius * 0.55, headRadius * 0.28, 0.14, 20);
  jawGeo.scale(1.0, 1.0, 1.2);
  const jawMesh = new THREE.Mesh(jawGeo, resinMaterial);
  jawMesh.position.set(0, 1.50, 0.045);
  jawMesh.rotation.x = -0.15;
  headGroup.add(jawMesh);

  // Stylized Nose Ridge & Brow Plate
  const browGeo = new THREE.BoxGeometry(0.045, 0.08, 0.035);
  const browMesh = new THREE.Mesh(browGeo, resinMaterial);
  browMesh.position.set(0, 1.62, headRadius * 0.94);
  headGroup.add(browMesh);

  visibleGroup.add(headGroup);
  bodyParts.head = headGroup;

  // --- B. NECK WITH ARTICULATED COLLAR RING ---
  const neckGroup = new THREE.Group();
  neckGroup.name = 'neck-group';

  const neckGeo = new THREE.CylinderGeometry(neckRadius * 0.88, neckRadius * 1.12, 0.18, 24);
  const neckMesh = new THREE.Mesh(neckGeo, resinMaterial);
  neckMesh.position.set(0, 1.38, 0.01);
  neckGroup.add(neckMesh);

  // Neck Base Articulation Ring & Pin (as shown in reference)
  const neckRingGeo = new THREE.TorusGeometry(neckRadius * 1.15, 0.012, 16, 32);
  neckRingGeo.rotateX(Math.PI / 2);
  const neckRing = new THREE.Mesh(neckRingGeo, jointMetalMaterial);
  neckRing.position.set(0, 1.30, 0.01);
  neckGroup.add(neckRing);

  const neckPinGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.018, 12);
  neckPinGeo.rotateX(Math.PI / 2);
  const neckPin = new THREE.Mesh(neckPinGeo, jointMetalMaterial);
  neckPin.position.set(0, 1.30, neckRadius * 1.16);
  neckGroup.add(neckPin);

  visibleGroup.add(neckGroup);
  bodyParts.neck = neckGroup;

  // --- C. SCULPTED TORSO & PECTORALS ---
  const chestGroup = new THREE.Group();
  chestGroup.name = 'chest-group';

  // Upper Chest / Pectoral Plate
  const chestGeo = new THREE.CylinderGeometry(
    shoulderWidth * 0.50,
    waistWidth * 0.56,
    0.34,
    32,
    8
  );
  chestGeo.scale(1.0, 1.0, chestDepth / chestWidth);
  const chestMesh = new THREE.Mesh(chestGeo, resinMaterial);
  chestMesh.position.set(0, 1.14, 0.005);
  chestGroup.add(chestMesh);

  // Central Seam Line (Mannequin Construction Division)
  const seamGeo = new THREE.BoxGeometry(0.004, 0.32, chestDepth * 0.98);
  const seamMesh = new THREE.Mesh(seamGeo, socketInnerMaterial);
  seamMesh.position.set(0, 1.14, 0.02);
  chestGroup.add(seamMesh);

  // Female Bust Definition (if applicable)
  if (!isMale) {
    [-0.095, 0.095].forEach((xOff) => {
      const bustGeo = new THREE.SphereGeometry(0.09, 20, 20);
      bustGeo.scale(1.0, 0.9, 1.18);
      const bust = new THREE.Mesh(bustGeo, resinMaterial);
      bust.position.set(xOff, 1.15, 0.095);
      chestGroup.add(bust);
    });
  }

  // Clavicle Arch & Shoulder Sockets
  [-1, 1].forEach((side) => {
    const clavicleGeo = new THREE.CylinderGeometry(0.028, 0.038, shoulderWidth * 0.42, 16);
    clavicleGeo.rotateZ(side * (Math.PI / 2.2));
    const clavicle = new THREE.Mesh(clavicleGeo, resinMaterial);
    clavicle.position.set(side * (shoulderWidth * 0.28), 1.28, 0.005);
    chestGroup.add(clavicle);
  });

  visibleGroup.add(chestGroup);
  bodyParts.chest = chestGroup;

  // --- D. ABDOMEN & WAIST ---
  const abdomenGroup = new THREE.Group();
  abdomenGroup.name = 'abdomen-group';

  const abGeo = new THREE.CylinderGeometry(
    waistWidth * 0.56,
    hipWidth * 0.50,
    0.28,
    32,
    6
  );
  abGeo.scale(1.0, 1.0, waistDepth / waistWidth);
  const abMesh = new THREE.Mesh(abGeo, resinMaterial);
  abMesh.position.set(0, 0.85, 0);
  abdomenGroup.add(abMesh);

  // Abdominal Definition Plates
  const abPlateGeo = new THREE.BoxGeometry(0.004, 0.26, waistDepth * 0.96);
  const abPlate = new THREE.Mesh(abPlateGeo, socketInnerMaterial);
  abPlate.position.set(0, 0.85, 0.015);
  abdomenGroup.add(abPlate);

  visibleGroup.add(abdomenGroup);
  bodyParts.abdomen = abdomenGroup;

  // --- E. PELVIC CRADLE & HIP JOINT CUTOUTS ---
  const pelvisGroup = new THREE.Group();
  pelvisGroup.name = 'pelvis-group';

  const pelvisGeo = new THREE.CylinderGeometry(
    hipWidth * 0.50,
    hipWidth * 0.44,
    0.22,
    32
  );
  pelvisGeo.scale(1.0, 1.0, hipDepth / hipWidth);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, resinMaterial);
  pelvisMesh.position.set(0, 0.62, 0);
  pelvisGroup.add(pelvisMesh);

  // Articulated Hip Cutout Sockets (Internal dark bracket as seen in reference)
  [-1, 1].forEach((side) => {
    const hipSocketGeo = new THREE.TorusGeometry(0.065, 0.018, 16, 24, Math.PI);
    hipSocketGeo.rotateZ(side * (Math.PI / 2));
    const hipSocket = new THREE.Mesh(hipSocketGeo, jointMetalMaterial);
    hipSocket.position.set(side * legSpacing, 0.53, 0);
    pelvisGroup.add(hipSocket);

    const hipPivotPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.06, 16),
      jointMetalMaterial
    );
    hipPivotPin.rotation.x = Math.PI / 2;
    hipPivotPin.position.set(side * legSpacing, 0.52, 0);
    pelvisGroup.add(hipPivotPin);
  });

  visibleGroup.add(pelvisGroup);
  bodyParts.hips = pelvisGroup;

  // --- F. ARTICULATED ARMS (Shoulders, Upper Arms, Elbows, Forearms, Hands) ---
  const upperArms = [];
  const elbows = [];
  const forearms = [];
  const hands = [];

  [-1, 1].forEach((side) => {
    const armX = side * (shoulderWidth * 0.54);
    const armAngleZ = side * 0.38; // Natural fashion A-pose arm flare

    // 1. Articulated Shoulder Ball-and-Socket Joint
    const shBallGeo = new THREE.SphereGeometry(0.052, 20, 20);
    const shBall = new THREE.Mesh(shBallGeo, jointMetalMaterial);
    shBall.position.set(armX, 1.25, 0);
    visibleGroup.add(shBall);

    const shCapGeo = new THREE.TorusGeometry(0.054, 0.012, 16, 24);
    shCapGeo.rotateY(Math.PI / 2);
    const shCap = new THREE.Mesh(shCapGeo, jointMetalMaterial);
    shCap.position.set(armX + side * 0.015, 1.25, 0);
    visibleGroup.add(shCap);

    // 2. Upper Arm Segment
    const uArmGroup = new THREE.Group();
    uArmGroup.name = side === -1 ? 'left-upper-arm' : 'right-upper-arm';

    const uArmGeo = new THREE.CylinderGeometry(0.048, 0.040, armLength * 0.44, 24);
    const uArmMesh = new THREE.Mesh(uArmGeo, resinMaterial);
    uArmMesh.position.set(armX - Math.sin(armAngleZ) * (armLength * 0.22), 1.25 - Math.cos(armAngleZ) * (armLength * 0.22), 0);
    uArmMesh.rotation.z = -armAngleZ;
    uArmGroup.add(uArmMesh);

    visibleGroup.add(uArmGroup);
    upperArms.push(uArmGroup);

    // Upper Arm Joint Ring Collar
    const uArmRingGeo = new THREE.TorusGeometry(0.046, 0.008, 12, 24);
    uArmRingGeo.rotateX(Math.PI / 2);
    const uArmRing = new THREE.Mesh(uArmRingGeo, jointMetalMaterial);
    uArmRing.position.set(armX - Math.sin(armAngleZ) * (armLength * 0.12), 1.25 - Math.cos(armAngleZ) * (armLength * 0.12), 0);
    uArmRing.rotation.z = -armAngleZ;
    uArmGroup.add(uArmRing);

    // 3. Articulated Dual-Disc Elbow Joint Mechanism
    const elbowGroup = new THREE.Group();
    elbowGroup.name = side === -1 ? 'left-elbow' : 'right-elbow';

    const elbowPosX = armX - Math.sin(armAngleZ) * (armLength * 0.44);
    const elbowPosY = 1.25 - Math.cos(armAngleZ) * (armLength * 0.44);

    const elbowHingeGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.052, 20);
    elbowHingeGeo.rotateX(Math.PI / 2);
    const elbowHinge = new THREE.Mesh(elbowHingeGeo, jointMetalMaterial);
    elbowHinge.position.set(elbowPosX, elbowPosY, 0);
    elbowGroup.add(elbowHinge);

    const elbowPinGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.065, 16);
    elbowPinGeo.rotateX(Math.PI / 2);
    const elbowPin = new THREE.Mesh(elbowPinGeo, socketInnerMaterial);
    elbowPin.position.set(elbowPosX, elbowPosY, 0);
    elbowGroup.add(elbowPin);

    visibleGroup.add(elbowGroup);
    elbows.push(elbowGroup);

    // 4. Sleek Grooved Forearm (Reference split design)
    const fArmGroup = new THREE.Group();
    fArmGroup.name = side === -1 ? 'left-forearm' : 'right-forearm';

    const fArmGeo = new THREE.CylinderGeometry(0.038, 0.026, armLength * 0.46, 24);
    const fArmMesh = new THREE.Mesh(fArmGeo, resinMaterial);
    const fArmPosX = elbowPosX - Math.sin(armAngleZ) * (armLength * 0.23);
    const fArmPosY = elbowPosY - Math.cos(armAngleZ) * (armLength * 0.23);
    fArmMesh.position.set(fArmPosX, fArmPosY, 0);
    fArmMesh.rotation.z = -armAngleZ;
    fArmGroup.add(fArmMesh);

    // Longitudinal Groove (reference characteristic)
    const grooveGeo = new THREE.BoxGeometry(0.003, armLength * 0.42, 0.045);
    const grooveMesh = new THREE.Mesh(grooveGeo, socketInnerMaterial);
    grooveMesh.position.set(fArmPosX, fArmPosY, 0.008);
    grooveMesh.rotation.z = -armAngleZ;
    fArmGroup.add(grooveMesh);

    // Articulated Wrist Joint Ring
    const wristPosX = elbowPosX - Math.sin(armAngleZ) * (armLength * 0.46);
    const wristPosY = elbowPosY - Math.cos(armAngleZ) * (armLength * 0.46);

    const wristRingGeo = new THREE.TorusGeometry(0.028, 0.006, 12, 24);
    wristRingGeo.rotateX(Math.PI / 2);
    const wristRing = new THREE.Mesh(wristRingGeo, jointMetalMaterial);
    wristRing.position.set(wristPosX, wristPosY, 0);
    wristRing.rotation.z = -armAngleZ;
    fArmGroup.add(wristRing);

    visibleGroup.add(fArmGroup);
    forearms.push(fArmGroup);

    // 5. Sculpted Mannequin Hand with Relaxed Fingers & Thumb
    const handGroup = new THREE.Group();
    handGroup.name = side === -1 ? 'left-hand' : 'right-hand';

    // Palm Block
    const palmGeo = new THREE.BoxGeometry(0.042, 0.065, 0.022);
    const palmMesh = new THREE.Mesh(palmGeo, resinMaterial);
    const handPosX = wristPosX - Math.sin(armAngleZ) * 0.045;
    const handPosY = wristPosY - Math.cos(armAngleZ) * 0.045;
    palmMesh.position.set(handPosX, handPosY, 0);
    palmMesh.rotation.z = -armAngleZ;
    handGroup.add(palmMesh);

    // Fingers Group
    const fingerOffsets = [-0.014, -0.005, 0.005, 0.014];
    fingerOffsets.forEach((fOff, idx) => {
      const fingerLen = 0.055 - Math.abs(idx - 1.5) * 0.006;
      const fGeo = new THREE.CylinderGeometry(0.0045, 0.0035, fingerLen, 12);
      const fMesh = new THREE.Mesh(fGeo, resinMaterial);
      fMesh.position.set(
        handPosX + fOff * Math.cos(armAngleZ) - Math.sin(armAngleZ) * (0.04 + fingerLen * 0.5),
        handPosY + fOff * Math.sin(armAngleZ) - Math.cos(armAngleZ) * (0.04 + fingerLen * 0.5),
        0.002
      );
      fMesh.rotation.z = -armAngleZ;
      fMesh.rotation.x = 0.12; // Slight natural curl
      handGroup.add(fMesh);
    });

    // Opposing Thumb
    const thumbGeo = new THREE.CylinderGeometry(0.005, 0.004, 0.042, 12);
    const thumb = new THREE.Mesh(thumbGeo, resinMaterial);
    thumb.position.set(
      handPosX + side * 0.024 * Math.cos(armAngleZ) - Math.sin(armAngleZ) * 0.025,
      handPosY + side * 0.024 * Math.sin(armAngleZ) - Math.cos(armAngleZ) * 0.025,
      0.012
    );
    thumb.rotation.z = -armAngleZ + side * 0.5;
    thumb.rotation.y = side * 0.35;
    handGroup.add(thumb);

    visibleGroup.add(handGroup);
    hands.push(handGroup);
  });

  bodyParts.upperArms = upperArms;
  bodyParts.elbows = elbows;
  bodyParts.forearms = forearms;
  bodyParts.hands = hands;

  // --- G. ARTICULATED LEGS (Thighs, Dual-Disc Knees, Calves, Ankles, Feet) ---
  const thighs = [];
  const knees = [];
  const calves = [];
  const feet = [];

  [-1, 1].forEach((side) => {
    const legX = side * legSpacing;

    // 1. Sculpted Thigh with Quadriceps Definition
    const thighGroup = new THREE.Group();
    thighGroup.name = side === -1 ? 'left-thigh' : 'right-thigh';

    const thighGeo = new THREE.CylinderGeometry(
      isMale ? 0.088 : 0.082,
      isMale ? 0.062 : 0.055,
      legLength * 0.46,
      28,
      8
    );
    thighGeo.scale(1.0, 1.0, 1.15); // Anatomical depth
    const thighMesh = new THREE.Mesh(thighGeo, resinMaterial);
    thighMesh.position.set(legX, 0.28, 0.005);
    thighGroup.add(thighMesh);

    // Thigh Hip Articulation Insert Cap
    const thighCapGeo = new THREE.SphereGeometry(0.062, 16, 16);
    const thighCap = new THREE.Mesh(thighCapGeo, jointMetalMaterial);
    thighCap.position.set(legX, 0.50, 0);
    thighGroup.add(thighCap);

    visibleGroup.add(thighGroup);
    thighs.push(thighGroup);

    // 2. Articulated Dual-Disc Knee Joint Mechanism
    const kneeGroup = new THREE.Group();
    kneeGroup.name = side === -1 ? 'left-knee' : 'right-knee';

    const kneeHingeGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.068, 24);
    kneeHingeGeo.rotateX(Math.PI / 2);
    const kneeHinge = new THREE.Mesh(kneeHingeGeo, jointMetalMaterial);
    kneeHinge.position.set(legX, 0.04, 0);
    kneeGroup.add(kneeHinge);

    // Patella / Knee Cap Front Shield
    const patellaGeo = new THREE.SphereGeometry(0.038, 16, 16);
    patellaGeo.scale(0.8, 1.2, 0.6);
    const patella = new THREE.Mesh(patellaGeo, resinMaterial);
    patella.position.set(legX, 0.04, 0.032);
    kneeGroup.add(patella);

    // Knee Pivot Axle Bolt
    const kneeBolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.082, 16),
      socketInnerMaterial
    );
    kneeBolt.rotation.x = Math.PI / 2;
    kneeBolt.position.set(legX, 0.04, 0);
    kneeGroup.add(kneeBolt);

    visibleGroup.add(kneeGroup);
    knees.push(kneeGroup);

    // 3. Sculpted Calf with Gastrocnemius Muscle Contour & Slender Shin
    const calfGroup = new THREE.Group();
    calfGroup.name = side === -1 ? 'left-calf' : 'right-calf';

    const calfGeo = new THREE.CylinderGeometry(
      isMale ? 0.068 : 0.060,
      isMale ? 0.042 : 0.036,
      legLength * 0.48,
      28,
      8
    );
    calfGeo.scale(1.0, 1.0, 1.12);
    const calfMesh = new THREE.Mesh(calfGeo, resinMaterial);
    calfMesh.position.set(legX, -0.22, 0.005);
    calfGroup.add(calfMesh);

    // 4. Articulated Ankle Joint Ring & Pivot Bolt
    const ankleRingGeo = new THREE.TorusGeometry(0.038, 0.008, 16, 24);
    ankleRingGeo.rotateX(Math.PI / 2);
    const ankleRing = new THREE.Mesh(ankleRingGeo, jointMetalMaterial);
    ankleRing.position.set(legX, -0.46, 0);
    calfGroup.add(ankleRing);

    const ankleBolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.065, 12),
      socketInnerMaterial
    );
    ankleBolt.rotation.x = Math.PI / 2;
    ankleBolt.position.set(legX, -0.46, 0);
    calfGroup.add(ankleBolt);

    visibleGroup.add(calfGroup);
    calves.push(calfGroup);

    // 5. Sculpted Foot with Articulated Inset and Defined Toes
    const footGroup = new THREE.Group();
    footGroup.name = side === -1 ? 'left-foot' : 'right-foot';

    // Foot Base Arch
    const footGeo = new THREE.BoxGeometry(0.078, 0.055, 0.20);
    const footMesh = new THREE.Mesh(footGeo, resinMaterial);
    footMesh.position.set(legX, -0.52, 0.045);
    footGroup.add(footMesh);

    // Defined Toes Contour Plate
    const toeGeo = new THREE.BoxGeometry(0.076, 0.035, 0.065);
    const toeMesh = new THREE.Mesh(toeGeo, resinMaterial);
    toeMesh.position.set(legX, -0.53, 0.155);
    footGroup.add(toeMesh);

    visibleGroup.add(footGroup);
    feet.push(footGroup);
  });

  bodyParts.thighs = thighs;
  bodyParts.knees = knees;
  bodyParts.calves = calves;
  bodyParts.feet = feet;

  // =========================================================================
  // 4. INVISIBLE COLLISION AVATAR VOLUMES (Strictly for Cloth Physics PBD)
  // =========================================================================
  const collisionSpheres = [
    // Torso Core
    { name: 'chestUpper', center: new THREE.Vector3(0, 1.22, 0), radius: isMale ? 0.32 : 0.28 },
    { name: 'chestMain', center: new THREE.Vector3(0, 1.08, 0.01), radius: isMale ? 0.34 : 0.30 },
    { name: 'abdomen', center: new THREE.Vector3(0, 0.84, 0), radius: isMale ? 0.28 : 0.24 },
    { name: 'waist', center: new THREE.Vector3(0, 0.68, 0), radius: isMale ? 0.29 : 0.26 },
    { name: 'hips', center: new THREE.Vector3(0, 0.52, 0), radius: isMale ? 0.32 : 0.34 },

    // Left Arm Hierarchy
    { name: 'shL', center: new THREE.Vector3(-shoulderWidth * 0.54, 1.25, 0), radius: 0.14 },
    { name: 'uArmL', center: new THREE.Vector3(-shoulderWidth * 0.64, 1.05, 0), radius: 0.11 },
    { name: 'elbowL', center: new THREE.Vector3(-shoulderWidth * 0.74, 0.85, 0), radius: 0.095 },
    { name: 'fArmL', center: new THREE.Vector3(-shoulderWidth * 0.84, 0.68, 0), radius: 0.085 },

    // Right Arm Hierarchy
    { name: 'shR', center: new THREE.Vector3(shoulderWidth * 0.54, 1.25, 0), radius: 0.14 },
    { name: 'uArmR', center: new THREE.Vector3(shoulderWidth * 0.64, 1.05, 0), radius: 0.11 },
    { name: 'elbowR', center: new THREE.Vector3(shoulderWidth * 0.74, 0.85, 0), radius: 0.095 },
    { name: 'fArmR', center: new THREE.Vector3(shoulderWidth * 0.84, 0.68, 0), radius: 0.085 },

    // Lower Body
    { name: 'thighUpperL', center: new THREE.Vector3(-legSpacing, 0.36, 0), radius: 0.16 },
    { name: 'thighUpperR', center: new THREE.Vector3(legSpacing, 0.36, 0), radius: 0.16 },
    { name: 'thighMidL', center: new THREE.Vector3(-legSpacing, 0.20, 0), radius: 0.14 },
    { name: 'thighMidR', center: new THREE.Vector3(legSpacing, 0.20, 0), radius: 0.14 },
    { name: 'kneeL', center: new THREE.Vector3(-legSpacing, 0.04, 0), radius: 0.11 },
    { name: 'kneeR', center: new THREE.Vector3(legSpacing, 0.04, 0), radius: 0.11 },
    { name: 'calfL', center: new THREE.Vector3(-legSpacing, -0.18, 0), radius: 0.10 },
    { name: 'calfR', center: new THREE.Vector3(legSpacing, -0.18, 0), radius: 0.10 },
  ];

  // Populate debug collision spheres (invisible by default)
  collisionSpheres.forEach((sphere) => {
    const sGeo = new THREE.SphereGeometry(sphere.radius, 16, 16);
    const sMesh = new THREE.Mesh(sGeo, collisionDebugMaterial);
    sMesh.position.copy(sphere.center);
    collisionGroup.add(sMesh);
  });

  // =========================================================================
  // 5. BODY OCCLUSION / COVERAGE MASK ENGINE
  // =========================================================================
  /**
   * Automatically occludes visible body parts covered by the active garment
   * while keeping the invisible collision body fully active in physics.
   */
  const applyGarmentCoverage = (coverageMask = {}) => {
    const {
      chest = false,      // false = covered & hidden; true = exposed & visible
      abdomen = false,
      hips = false,
      upperArms = false,
      forearms = true,
      thighs = true,
      calves = true,
      neck = true,
      head = true,
      hands = true,
      feet = true,
    } = coverageMask;

    if (bodyParts.head) bodyParts.head.visible = head;
    if (bodyParts.neck) bodyParts.neck.visible = neck;
    if (bodyParts.chest) bodyParts.chest.visible = chest;
    if (bodyParts.abdomen) bodyParts.abdomen.visible = abdomen;
    if (bodyParts.hips) bodyParts.hips.visible = hips;

    if (bodyParts.upperArms) {
      bodyParts.upperArms.forEach((m) => { m.visible = upperArms; });
    }
    if (bodyParts.elbows) {
      bodyParts.elbows.forEach((m) => { m.visible = upperArms && forearms; });
    }
    if (bodyParts.forearms) {
      bodyParts.forearms.forEach((m) => { m.visible = forearms; });
    }
    if (bodyParts.hands) {
      bodyParts.hands.forEach((m) => { m.visible = hands; });
    }
    if (bodyParts.thighs) {
      bodyParts.thighs.forEach((m) => { m.visible = thighs; });
    }
    if (bodyParts.knees) {
      bodyParts.knees.forEach((m) => { m.visible = thighs && calves; });
    }
    if (bodyParts.calves) {
      bodyParts.calves.forEach((m) => { m.visible = calves; });
    }
    if (bodyParts.feet) {
      bodyParts.feet.forEach((m) => { m.visible = feet; });
    }
  };

  const setDebugMode = (enabled) => {
    collisionGroup.visible = enabled;
  };

  return {
    root,
    group: root,
    gender,
    visibleGroup,
    collisionGroup,
    collisionBodies: collisionSpheres,
    bodyParts,
    applyGarmentCoverage,
    setDebugMode,
    dimensions: {
      shoulderWidth,
      chestWidth,
      waistWidth,
      hipWidth,
      armLength,
      legLength,
    },
  };
}
