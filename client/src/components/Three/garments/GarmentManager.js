import * as THREE from 'three';
import { createPBRClothMaterial, FABRIC_DEFINITIONS } from '../materials/ClothMaterial';
import { ClothPhysicsSimulator } from '../physics/ClothPhysics';

/**
 * Professional 3D Tailored Garment Construction Engine
 * Constructs complete garments from anatomical pattern pieces (collars, yokes,
 * front/back panels, armholes, curved sleeves, cuffs, plackets, pockets, pleats, hems)
 * and fits them over the digital human avatar with collision physics.
 */

export function constructTailoredGarment(garment, avatar, options = {}) {
  const {
    isWireframe = false,
    customColor = null,
    overrideFabric = null,
  } = options;

  const root = new THREE.Group();
  root.name = `garment-${garment.id}`;

  const isMale = avatar.gender === 'male';
  const dims = avatar.dimensions;

  const fabricKey = overrideFabric || garment.fabricType || 'cotton';
  const mainColor = customColor || garment.defaultColor;
  const innerColor = garment.innerColor || '#09090b';
  const accentColor = garment.accentColor || '#d4af37';

  // Materials
  const mainMat = createPBRClothMaterial(fabricKey, mainColor, { isWireframe });
  const innerMat = createPBRClothMaterial(fabricKey === 'leather' ? 'cotton' : fabricKey, innerColor, { isWireframe });
  const trimMat = createPBRClothMaterial('zari', accentColor, { isWireframe });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15, wireframe: isWireframe });
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.3, roughness: 0.2, wireframe: isWireframe });
  const sheerMat = createPBRClothMaterial('silk', mainColor, { isWireframe, transparent: true, opacity: 0.82 });

  // Physics Simulator
  const physics = new ClothPhysicsSimulator();
  physics.setProfile(fabricKey);
  if (avatar.collisionBodies) {
    physics.collisionSpheres = avatar.collisionBodies;
  }

  // Apply Garment Body Occlusion Coverage Mask to Avatar
  if (avatar.applyGarmentCoverage && garment.coverage) {
    avatar.applyGarmentCoverage(garment.coverage);
  }

  let clothGeometry = null;
  let clothMesh = null;

  // Build Garment based on pattern type
  switch (garment.id) {
    // =========================================================================
    // 1. GARMENT #1 BENCHMARK: MEN'S OVERSIZED RELAXED SHIRT
    // =========================================================================
    case 'men-oversized-camp-shirt': {
      const sw = dims.shoulderWidth * 1.08;
      const cw = dims.chestWidth * 1.12;
      const ww = dims.waistWidth * 1.15;

      // A. Main Torso (Front & Back Panels + Curved Hem)
      const torsoGeo = new THREE.CylinderGeometry(sw * 0.52, ww * 0.55, 0.98, 36, 20, true);
      const pos = torsoGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const z = pos.getZ(i);
        // Anatomic chest curvature + relaxed side drape
        pos.setZ(i, z * 0.92);
        if (y < -0.2) {
          // Curved shirt-tail hemline
          const curve = Math.sin(pos.getX(i) * 4) * 0.04;
          pos.setY(i, y + curve);
        }
      }
      torsoGeo.computeVertexNormals();

      clothMesh = new THREE.Mesh(torsoGeo, mainMat);
      clothMesh.position.set(0, 0.88, 0);
      root.add(clothMesh);
      clothGeometry = torsoGeo;

      // B. Camp Collar (Folded Wings)
      [-1, 1].forEach((side) => {
        const collarWingGeo = new THREE.PlaneGeometry(0.16, 0.18, 4, 4);
        const wing = new THREE.Mesh(collarWingGeo, mainMat);
        wing.position.set(side * 0.12, 1.34, 0.18);
        wing.rotation.set(-Math.PI / 4.5, side * 0.35, side * Math.PI / 8);
        root.add(wing);
      });

      // Collar Stand Band
      const standBand = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 12, 28, Math.PI * 1.4), mainMat);
      standBand.position.set(0, 1.35, 0.02);
      standBand.rotation.x = Math.PI / 2.3;
      root.add(standBand);

      // C. Front Button Placket & Natural Shell Buttons
      const placket = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.96, 0.025), mainMat);
      placket.position.set(0, 0.88, 0.22);
      root.add(placket);

      for (let b = 0; b < 5; b++) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.008, 16), buttonMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(0, 1.25 - b * 0.18, 0.235);
        root.add(btn);
      }

      // D. Chest Patch Pocket
      const pocket = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.15), innerMat);
      pocket.position.set(-0.16, 1.05, 0.22);
      pocket.rotation.y = -0.15;
      root.add(pocket);

      // E. Sleeves with Cuffs (Left & Right)
      [-1, 1].forEach((side) => {
        const sleeveGeo = new THREE.CylinderGeometry(0.135, 0.12, 0.38, 20, 10);
        sleeveGeo.rotateZ(side * 0.25);
        const sleeve = new THREE.Mesh(sleeveGeo, mainMat);
        sleeve.position.set(side * (sw * 0.58), 1.05, 0);
        root.add(sleeve);

        // Folded Cuff Band
        const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.02, 12, 24), mainMat);
        cuff.position.set(side * (sw * 0.64), 0.88, 0);
        cuff.rotation.x = Math.PI / 2;
        root.add(cuff);
      });

      physics.initFromGeometry(torsoGeo, clothMesh, {
        isPinned: (y) => y > 0.35,
        flexFactor: (y) => Math.max(0.1, 1.2 - y * 0.85)
      });
      break;
    }

    // =========================================================================
    // 2. GARMENT #2 BENCHMARK: WOMEN'S CELESTIAL SILK WRAP DRESS & SAREE-GOWN
    // =========================================================================
    case 'women-celestial-wrap-dress': {
      // A. Shaped bodice with a gently lowered sweetheart front edge.
      const bodiceGeo = new THREE.BufferGeometry();
      const bodiceRings = [[0.22, 0.74], [0.23, 0.82], [0.255, 0.96], [0.25, 1.08], [0.225, 1.17]];
      const bodiceSegments = 64;
      const bodicePositions = [];
      const bodiceIndices = [];
      bodiceRings.forEach(([radius, yBase], ring) => {
        for (let segment = 0; segment <= bodiceSegments; segment += 1) {
          const angle = segment / bodiceSegments * Math.PI * 2;
          const front = Math.max(0, Math.cos(angle - Math.PI / 2));
          const necklineDip = ring === bodiceRings.length - 1 ? 0.075 * Math.pow(front, 2.2) : 0;
          const dart = Math.cos(angle * 4) * 0.006 * Math.sin((ring / (bodiceRings.length - 1)) * Math.PI);
          const r = radius + dart;
          bodicePositions.push(Math.cos(angle) * r, yBase - necklineDip, Math.sin(angle) * r * 0.92 + 0.01);
          if (ring < bodiceRings.length - 1 && segment < bodiceSegments) {
            const a = ring * (bodiceSegments + 1) + segment;
            const b = a + bodiceSegments + 1;
            bodiceIndices.push(a, b, a + 1, b, b + 1, a + 1);
          }
        }
      });
      bodiceGeo.setAttribute('position', new THREE.Float32BufferAttribute(bodicePositions, 3));
      bodiceGeo.setIndex(bodiceIndices);
      bodiceGeo.computeVertexNormals();
      const bodice = new THREE.Mesh(bodiceGeo, mainMat);
      bodice.material.side = THREE.DoubleSide;
      root.add(bodice);

      // Gold Sweetheart Neckline Trim
      const neckBorder = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 12, 32, Math.PI), trimMat);
      neckBorder.rotation.x = Math.PI / 3;
      neckBorder.position.set(0, 1.22, 0.12);
      root.add(neckBorder);

      // Gold Kamarbandh / Waistband
      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.025, 12, 32), trimMat);
      belt.rotation.x = Math.PI / 2;
      belt.position.set(0, 0.74, 0);
      root.add(belt);

      // B. Sweeping Pleated Flared Skirt (Simulated Cloth Mesh)
      const skirtGeo = new THREE.BufferGeometry();
      const radialSegments = 112;
      const verticalSegments = 52;
      const skirtPositions = [];
      const skirtUvs = [];
      const skirtIndices = [];
      for (let row = 0; row <= verticalSegments; row += 1) {
        const t = row / verticalSegments; // hem to waist
        const y = -0.675 + t * 1.45;
        const baseRadius = THREE.MathUtils.lerp(0.82, 0.235, Math.pow(t, 0.88));
        for (let column = 0; column <= radialSegments; column += 1) {
          const angle = column / radialSegments * Math.PI * 2;
          const pleat = Math.cos(angle * 20 + 0.2) * (0.008 + 0.026 * (1 - t));
          const softFold = Math.sin(angle * 9 + 0.8) * 0.012 * (1 - t);
          const hemWave = Math.sin(angle * 5 + 0.4) * 0.035 * (1 - t);
          const radius = baseRadius + pleat + softFold;
          skirtPositions.push(Math.cos(angle) * radius, y + hemWave, Math.sin(angle) * radius * 0.92);
          skirtUvs.push(column / radialSegments, row / verticalSegments);
          if (row < verticalSegments && column < radialSegments) {
            const a = row * (radialSegments + 1) + column;
            const b = a + radialSegments + 1;
            skirtIndices.push(a, a + 1, b, a + 1, b + 1, b);
          }
        }
      }
      skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtPositions, 3));
      skirtGeo.setAttribute('uv', new THREE.Float32BufferAttribute(skirtUvs, 2));
      skirtGeo.setIndex(skirtIndices);
      skirtGeo.computeVertexNormals();

      clothMesh = new THREE.Mesh(skirtGeo, mainMat);
      clothMesh.material.side = THREE.DoubleSide;
      clothMesh.position.set(0, 0.05, 0);
      root.add(clothMesh);
      clothGeometry = skirtGeo;

      // Gold Brocade Lace along Hemline
      const hem = new THREE.Mesh(new THREE.TorusGeometry(0.83, 0.035, 12, 48), trimMat);
      hem.rotation.x = Math.PI / 2;
      hem.position.set(0, -0.66, 0);
      root.add(hem);

      // C. Floating Sheer Silk Dupatta / Veil Ribbon
      const dupattaGeo = new THREE.PlaneGeometry(0.52, 1.92, 20, 40);
      const veilPos = dupattaGeo.attributes.position;
      for (let i = 0; i < veilPos.count; i += 1) {
        const x = veilPos.getX(i);
        const y = veilPos.getY(i);
        veilPos.setZ(i, Math.sin((x + 0.26) * 18) * 0.025 + Math.sin((y + 0.96) * 3.1) * 0.035 + Math.sin(x * 8 + y * 2) * 0.018);
        veilPos.setX(i, x + Math.sin((y + 0.96) * 2.2) * 0.12);
      }
      dupattaGeo.computeVertexNormals();
      const dupatta = new THREE.Mesh(dupattaGeo, sheerMat);
      dupatta.position.set(0.23, 0.47, 0.2);
      dupatta.rotation.set(0.03, -0.12, -0.12);
      root.add(dupatta);

      physics.initFromGeometry(skirtGeo, clothMesh, {
        isPinned: (y) => y > 0.5,
        flexFactor: (y) => Math.max(0.1, 1.4 - y)
      });
      break;
    }

    // =========================================================================
    // 3. ANIME HAUTE COUTURE: GOTEI 13 CAPTAIN HAORI & SHIHAKUSHO
    // =========================================================================
    case 'gotei-captain-haori': {
      // A. Inner Black Shihakusho Kimono
      const innerTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.85, 32, 10), innerMat);
      innerTorso.position.set(0, 0.95, 0);
      root.add(innerTorso);

      // White Juban Collar
      const juban = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 12, 32, Math.PI), mainMat);
      juban.rotation.x = Math.PI / 3;
      juban.position.set(0, 1.34, 0.12);
      root.add(juban);

      // Black Hakama Trousers
      const hakamaGeo = new THREE.CylinderGeometry(0.28, 0.58, 1.2, 36, 16);
      const hakama = new THREE.Mesh(hakamaGeo, innerMat);
      hakama.position.set(0, 0.15, 0);
      root.add(hakama);

      // B. Outer White Captain Haori (Cloth Mesh)
      const haoriGeo = new THREE.CylinderGeometry(0.38, 0.75, 1.45, 40, 24, true);
      const pos = haoriGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < 0.2) {
          const flare = 1.0 + Math.abs(y - 0.2) * 0.6;
          pos.setX(i, pos.getX(i) * flare);
          pos.setZ(i, pos.getZ(i) * flare);
        }
      }
      haoriGeo.computeVertexNormals();

      clothMesh = new THREE.Mesh(haoriGeo, mainMat);
      clothMesh.position.set(0, 0.68, 0);
      root.add(clothMesh);
      clothGeometry = haoriGeo;

      // Flared Kimono Sleeves (Left & Right)
      [-1, 1].forEach((side) => {
        const sleeveGeo = new THREE.CylinderGeometry(0.18, 0.38, 0.72, 24, 16);
        sleeveGeo.rotateZ(side * Math.PI / 4.2);
        sleeveGeo.rotateX(0.1);
        const sleeve = new THREE.Mesh(sleeveGeo, mainMat);
        sleeve.position.set(side * 0.48, 1.02, 0);
        root.add(sleeve);

        const innerCuff = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 12, 24), innerMat);
        innerCuff.position.set(side * 0.68, 0.75, 0);
        innerCuff.rotation.x = Math.PI / 2.2;
        root.add(innerCuff);
      });

      // Obi Sash & Gold Diamond Crest
      const obi = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 32), innerMat);
      obi.position.set(0, 0.76, 0);
      root.add(obi);

      const obiTrim = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.015, 12, 32), trimMat);
      obiTrim.rotation.x = Math.PI / 2;
      obiTrim.position.set(0, 0.76, 0);
      root.add(obiTrim);

      // Trailing Sash Tails
      const sashGeo = new THREE.PlaneGeometry(0.14, 0.65, 8, 12);
      sashGeo.translate(0, -0.32, 0);
      const sash = new THREE.Mesh(sashGeo, mainMat);
      sash.position.set(0.1, 0.76, 0.31);
      root.add(sash);

      // Gold Back Diamond Squad Insignia
      const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), trimMat);
      emblem.scale.set(1, 1.35, 0.2);
      emblem.position.set(0, 1.08, -0.34);
      root.add(emblem);

      physics.initFromGeometry(haoriGeo, clothMesh, {
        isPinned: (y) => y > 0.45,
        flexFactor: (y) => Math.max(0.1, 1.3 - y * 0.9)
      });
      break;
    }

    // =========================================================================
    // 4. ANIME HAUTE COUTURE: WANDENREICH QUINCY STERNRITTER TRENCH
    // =========================================================================
    case 'quincy-sternritter-trench': {
      // High Standing Collar
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.32, 32, 4, true), mainMat);
      collar.position.set(0, 1.44, 0.01);
      root.add(collar);

      const collarEdge = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.015, 12, 32), trimMat);
      collarEdge.rotation.x = Math.PI / 2;
      collarEdge.position.set(0, 1.58, 0.01);
      root.add(collarEdge);

      // Double-Breasted Long Coat (Cloth Mesh)
      const coatGeo = new THREE.CylinderGeometry(0.34, 0.68, 1.75, 40, 24, true);
      const pos = coatGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < 0.2) {
          const flare = 1.0 + Math.pow(Math.abs(y - 0.2), 1.2) * 0.55;
          pos.setX(i, pos.getX(i) * flare);
          pos.setZ(i, pos.getZ(i) * flare);
        }
      }
      coatGeo.computeVertexNormals();

      clothMesh = new THREE.Mesh(coatGeo, mainMat);
      clothMesh.position.set(0, 0.55, 0);
      root.add(clothMesh);
      clothGeometry = coatGeo;

      // Asymmetric Shoulder Capelet
      const capeGeo = new THREE.PlaneGeometry(0.48, 0.95, 16, 20);
      capeGeo.translate(0, -0.47, 0);
      const cape = new THREE.Mesh(capeGeo, mainMat);
      cape.position.set(-0.25, 1.28, 0.18);
      cape.rotation.set(-0.15, -Math.PI / 6, Math.PI / 16);
      root.add(cape);

      // Silver Quincy Cross Pin
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.025), metalMat);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.025), metalMat);
      crossV.position.set(0.16, 1.22, 0.28);
      crossH.position.set(0.16, 1.22, 0.28);
      root.add(crossV);
      root.add(crossH);

      // Silver Buttons
      for (let b = 0; b < 5; b++) {
        const btnL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), metalMat);
        const btnR = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), metalMat);
        btnL.position.set(-0.06, 1.15 - b * 0.14, 0.29);
        btnR.position.set(0.06, 1.15 - b * 0.14, 0.29);
        root.add(btnL);
        root.add(btnR);
      }

      // Fitted Sleeves
      [-1, 1].forEach((side) => {
        const slv = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.68, 20), mainMat);
        slv.rotation.z = side * 0.16;
        slv.position.set(side * 0.42, 0.88, 0);
        root.add(slv);
      });

      physics.initFromGeometry(coatGeo, clothMesh, {
        isPinned: (y) => y > 0.55,
        flexFactor: (y) => Math.max(0.1, 1.2 - y * 0.7)
      });
      break;
    }

    // =========================================================================
    // 5. STREETWEAR HEAVYWEIGHT HOODIE
    // =========================================================================
    case 'shihakusho-techwear-hoodie': {
      // Deep 3D Hood
      const hoodGeo = new THREE.SphereGeometry(0.28, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.5);
      const hood = new THREE.Mesh(hoodGeo, mainMat);
      hood.position.set(0, 1.46, -0.08);
      hood.rotation.x = -Math.PI / 8;
      root.add(hood);

      // Drawstrings
      [-0.06, 0.06].forEach((xOff) => {
        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 8), trimMat);
        string.position.set(xOff, 1.05, 0.28);
        root.add(string);
      });

      // Torso & Kangaroo Pocket (Cloth Mesh)
      const hoodieGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.88, 32, 16, true);
      clothMesh = new THREE.Mesh(hoodieGeo, mainMat);
      clothMesh.position.set(0, 0.92, 0);
      root.add(clothMesh);
      clothGeometry = hoodieGeo;

      // Kangaroo Front Pouch
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.06), innerMat);
      pouch.position.set(0, 0.74, 0.25);
      root.add(pouch);

      // Drop-Shoulder Sleeves & Ribbed Cuffs
      [-1, 1].forEach((side) => {
        const sleeveGeo = new THREE.CylinderGeometry(0.16, 0.11, 0.65, 20);
        sleeveGeo.rotateZ(side * 0.22);
        const sleeve = new THREE.Mesh(sleeveGeo, mainMat);
        sleeve.position.set(side * 0.44, 0.88, 0);
        root.add(sleeve);
      });

      physics.initFromGeometry(hoodieGeo, clothMesh, {
        isPinned: (y) => y > 0.3,
        flexFactor: (y) => Math.max(0.1, 1.1 - y * 0.75)
      });
      break;
    }

    // =========================================================================
    // 6. DEFAULT / STRUCTURED JACKETS, TOPS, SKIRTS
    // =========================================================================
    default: {
      const isSkirt = garment.category === 'Skirts';
      const topR = isSkirt ? 0.24 : 0.32;
      const botR = isSkirt ? 0.58 : 0.38;
      const h = isSkirt ? 0.95 : 0.98;

      const baseGeo = new THREE.CylinderGeometry(topR, botR, h, 36, 20, true);
      clothMesh = new THREE.Mesh(baseGeo, mainMat);
      clothMesh.position.set(0, isSkirt ? 0.35 : 0.88, 0);
      root.add(clothMesh);
      clothGeometry = baseGeo;

      if (!isSkirt) {
        [-1, 1].forEach((side) => {
          const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.65, 16), mainMat);
          sleeve.rotation.z = side * 0.18;
          sleeve.position.set(side * 0.42, 0.88, 0);
          root.add(sleeve);
        });

        // Collar Band
        const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 12, 32), trimMat);
        collarRing.rotation.x = Math.PI / 2;
        collarRing.position.set(0, 1.34, 0);
        root.add(collarRing);
      }

      physics.initFromGeometry(baseGeo, clothMesh, {
        isPinned: (y) => y > 0.3,
        flexFactor: (y) => Math.max(0.1, 1.2 - y * 0.8)
      });
      break;
    }
  }

  return {
    root,
    physics,
    clothMesh,
    clothGeometry,
    materials: { mainMat, innerMat, trimMat, metalMat, buttonMat, sheerMat }
  };
}
