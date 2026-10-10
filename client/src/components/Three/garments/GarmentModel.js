import * as THREE from 'three';
import { createPBRFabricMaterial } from '../materials/FabricMaterial';
import { ClothPhysicsSimulator } from '../physics/ClothPhysics';

/**
 * Procedural 3D Garment Mesh Constructor with Physical Cloth Binding
 * Builds tailored 3D silhouettes for all 14+ clothing categories
 * and binds their deformable vertices to the ClothPhysicsSimulator.
 */

export function buildGarmentMeshWithPhysics(garment, options = {}) {
  const {
    isWireframe = false,
    customColor = null,
    overrideFabric = null,
  } = options;

  const root = new THREE.Group();
  root.name = `garment-${garment.id}`;

  const fabricKey = overrideFabric || garment.fabricType || 'cotton';
  const mainColor = customColor || garment.defaultColor;
  const innerColor = garment.innerColor || '#18181b';
  const accentColor = garment.accentColor || '#d4af37';

  // 1. Create PBR Materials
  const mainMat = createPBRFabricMaterial(fabricKey, mainColor, { isWireframe });
  const innerMat = createPBRFabricMaterial(fabricKey === 'leather' ? 'cotton' : fabricKey, innerColor, { isWireframe });
  const trimMat = createPBRFabricMaterial('zari', accentColor, { isWireframe, metalnessMultiplier: 1.2 });
  const sheerMat = createPBRFabricMaterial('silk', mainColor, { isWireframe, transparent: true, opacity: 0.8 });
  const mannequinMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.85,
    roughness: 0.2,
    wireframe: isWireframe,
  });

  // 2. High-Fashion Architectural Pedestal & Mannequin Base
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.72, 0.09, 32),
    mannequinMat
  );
  pedestal.position.y = -1.88;
  pedestal.receiveShadow = true;
  root.add(pedestal);

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 1.75, 16),
    mannequinMat
  );
  stand.position.y = -1.05;
  root.add(stand);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.38, 24),
    mannequinMat
  );
  neck.position.y = 1.26;
  root.add(neck);

  // 3. Initialize Cloth Physics Simulator
  const physics = new ClothPhysicsSimulator();
  physics.setProfile(fabricKey);

  // Mesh that will undergo Verlet cloth simulation
  let clothGeometry = null;
  let clothMesh = null;

  // 4. Build Silhouette Geometries according to Garment Type
  switch (garment.id) {
    // --- A. GOTEI 13 CAPTAIN HAORI ---
    case 'gotei-captain-haori': {
      // Inner Black Shihakusho Torso
      const innerTorso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.44, 1.45, 32, 10),
        innerMat
      );
      innerTorso.position.y = 0.35;
      root.add(innerTorso);

      // White Crossover Juban Undercollar
      const juban = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.035, 12, 32, Math.PI),
        mainMat
      );
      juban.rotation.x = Math.PI / 3;
      juban.position.set(0, 1.06, 0.16);
      root.add(juban);

      // Outer White Captain Haori (Simulated Cloth Mesh)
      const haoriGeo = new THREE.CylinderGeometry(0.55, 0.88, 1.65, 36, 24, true);
      const pos = haoriGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < 0) {
          const flare = 1.0 + Math.abs(y) * 0.55;
          pos.setX(i, pos.getX(i) * flare);
          pos.setZ(i, pos.getZ(i) * flare);
        }
      }
      haoriGeo.computeVertexNormals();

      clothMesh = new THREE.Mesh(haoriGeo, mainMat);
      clothMesh.position.y = 0.25;
      root.add(clothMesh);
      clothGeometry = haoriGeo;

      // Flared Kimono Sleeves
      [-1, 1].forEach((side) => {
        const sleeveGeo = new THREE.CylinderGeometry(0.24, 0.48, 1.0, 24, 16);
        sleeveGeo.rotateZ(side * Math.PI / 4.2);
        sleeveGeo.rotateX(0.12);
        const sleeveMesh = new THREE.Mesh(sleeveGeo, mainMat);
        sleeveMesh.position.set(side * 0.74, 0.62, -0.05);
        root.add(sleeveMesh);

        const innerCuff = new THREE.Mesh(
          new THREE.TorusGeometry(0.4, 0.035, 12, 24),
          innerMat
        );
        innerCuff.position.set(side * 0.98, 0.26, 0);
        innerCuff.rotation.x = Math.PI / 2.2;
        innerCuff.rotation.y = side * 0.4;
        root.add(innerCuff);
      });

      // Obi Sash & Gold Trims
      const obi = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.28, 32), innerMat);
      obi.position.y = 0.28;
      root.add(obi);

      const obiGold = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.025, 12, 32), trimMat);
      obiGold.rotation.x = Math.PI / 2;
      obiGold.position.y = 0.28;
      root.add(obiGold);

      // Trailing Sash Ribbon
      const sashGeo = new THREE.PlaneGeometry(0.18, 0.95, 8, 16);
      sashGeo.translate(0, -0.47, 0);
      const sash = new THREE.Mesh(sashGeo, mainMat);
      sash.position.set(0.14, 0.28, 0.52);
      root.add(sash);

      // Gold Back Diamond Squad Crest
      const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), trimMat);
      emblem.scale.set(1, 1.4, 0.2);
      emblem.position.set(0, 0.76, -0.58);
      root.add(emblem);

      physics.initFromGeometry(haoriGeo, clothMesh, {
        isPinned: (y) => y > 0.6,
        flexFactor: (y) => Math.max(0.1, 1.3 - y * 0.9)
      });
      break;
    }

    // --- B. QUINCY STERNRITTER TRENCH ---
    case 'quincy-sternritter-trench': {
      // High Standing Collar
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.42, 32, 4, true), mainMat);
      collar.position.y = 1.24;
      root.add(collar);

      const collarSilver = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.02, 12, 32), trimMat);
      collarSilver.rotation.x = Math.PI / 2;
      collarSilver.position.y = 1.42;
      root.add(collarSilver);

      // Structured Long Military Trench Skirt (Cloth Mesh)
      const trenchGeo = new THREE.CylinderGeometry(0.52, 0.95, 2.15, 36, 24, true);
      const pos = trenchGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < 0.2) {
          const factor = 1.0 + Math.pow(Math.abs(y - 0.2), 1.2) * 0.6;
          pos.setX(i, pos.getX(i) * factor);
          pos.setZ(i, pos.getZ(i) * factor);
        }
      }
      trenchGeo.computeVertexNormals();

      clothMesh = new THREE.Mesh(trenchGeo, mainMat);
      clothMesh.position.y = 0.08;
      root.add(clothMesh);
      clothGeometry = trenchGeo;

      // Asymmetric Shoulder Capelet
      const capeGeo = new THREE.PlaneGeometry(0.7, 1.25, 16, 20);
      capeGeo.translate(0, -0.62, 0);
      const cape = new THREE.Mesh(capeGeo, mainMat);
      cape.position.set(-0.38, 0.92, 0.26);
      cape.rotation.y = -Math.PI / 6;
      cape.rotation.z = Math.PI / 16;
      root.add(cape);

      // Quincy Silver Cross & Buttons
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), trimMat);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), trimMat);
      crossV.position.set(0.25, 0.85, 0.48);
      crossH.position.set(0.25, 0.85, 0.48);
      root.add(crossV);
      root.add(crossH);

      for (let b = 0; b < 6; b++) {
        const btnL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), trimMat);
        const btnR = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), trimMat);
        btnL.position.set(-0.09, 0.75 - b * 0.16, 0.53);
        btnR.position.set(0.09, 0.75 - b * 0.16, 0.53);
        root.add(btnL);
        root.add(btnR);
      }

      // Fitted Sleeves
      [-1, 1].forEach((side) => {
        const slv = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.98, 20), mainMat);
        slv.rotation.z = side * Math.PI / 6.2;
        slv.position.set(side * 0.65, 0.52, 0);
        root.add(slv);

        const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 12, 24), trimMat);
        cuff.position.set(side * 0.88, 0.13, 0);
        cuff.rotation.x = Math.PI / 2;
        root.add(cuff);
      });

      physics.initFromGeometry(trenchGeo, clothMesh, {
        isPinned: (y) => y > 0.8,
        flexFactor: (y) => Math.max(0.1, 1.2 - y * 0.7)
      });
      break;
    }

    // --- C. ESPADA ARRANCAR HAKAMA ROBE ---
    case 'espada-arrancar-robe': {
      // Funnel Neck
      const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.48, 32, 6, true), mainMat);
      funnel.position.y = 1.22;
      root.add(funnel);

      const funnelEdge = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.025, 12, 32), innerMat);
      funnelEdge.rotation.x = Math.PI / 2;
      funnelEdge.position.y = 1.45;
      root.add(funnelEdge);

      // Torso Jacket
      const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.45, 1.1, 32, 12), mainMat);
      jacket.position.y = 0.52;
      root.add(jacket);

      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, 0.04), innerMat);
      seam.position.set(0, 0.52, 0.48);
      root.add(seam);

      // Hollow Heart Jewel
      const jewel = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.025, 16, 32),
        createPBRFabricMaterial('zari', '#10b981', { isWireframe, emissiveHex: '#10b981', emissiveIntensity: 0.6 })
      );
      jewel.position.set(0, 0.74, 0.51);
      root.add(jewel);

      // Sweeping Pleated Hakama Skirt (Cloth Simulation Mesh)
      const hakamaGeo = new THREE.CylinderGeometry(0.48, 1.12, 1.85, 40, 24, true);
      const pos = hakamaGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const theta = Math.atan2(pos.getZ(i), pos.getX(i));
        const pleat = Math.sin(theta * 16) * 0.045 * (1.0 - y);
        pos.setX(i, pos.getX(i) + Math.cos(theta) * pleat);
        pos.setZ(i, pos.getZ(i) + Math.sin(theta) * pleat);
      }
      hakamaGeo.computeVertexNormals();

      clothMesh = new THREE.Mesh(hakamaGeo, mainMat);
      clothMesh.position.y = -0.45;
      root.add(clothMesh);
      clothGeometry = hakamaGeo;

      // Aerodynamic Wing Sleeves
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.15, 12, 16), mainMat);
        wing.position.set(side * 0.58, 0.78, -0.1);
        wing.rotation.y = side * 0.32;
        root.add(wing);
      });

      physics.initFromGeometry(hakamaGeo, clothMesh, {
        isPinned: (y) => y > 0.6,
        flexFactor: (y) => Math.max(0.15, 1.4 - y * 0.9)
      });
      break;
    }

    // --- D. CELESTIAL SILK SAREE-GOWN & ANARKALI ---
    case 'women-celestial-wrap-dress': {
      // Corset Bodice with Gold Sweetheart Trim
      const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.38, 0.78, 32, 12), mainMat);
      bodice.position.y = 0.66;
      root.add(bodice);

      const neckBorder = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 12, 32, Math.PI), trimMat);
      neckBorder.rotation.x = Math.PI / 3;
      neckBorder.position.set(0, 1.02, 0.16);
      root.add(neckBorder);

      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.03, 12, 32), trimMat);
      belt.rotation.x = Math.PI / 2;
      belt.position.y = 0.28;
      root.add(belt);

      // Sweeping Tiered Flared Skirt (Cloth Mesh)
      const skirtGeo = new THREE.CylinderGeometry(0.4, 1.35, 2.2, 48, 28, true);
      const pos = skirtGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const theta = Math.atan2(pos.getZ(i), pos.getX(i));
        const ruffle = Math.sin(theta * 12) * 0.09 * (1.1 - y);
        pos.setX(i, pos.getX(i) + Math.cos(theta) * ruffle);
        pos.setZ(i, pos.getZ(i) + Math.sin(theta) * ruffle);
      }
      skirtGeo.computeVertexNormals();

      clothMesh = new THREE.Mesh(skirtGeo, mainMat);
      clothMesh.position.y = -0.58;
      root.add(clothMesh);
      clothGeometry = skirtGeo;

      // Gold Brocade Hem Border
      const hem = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.05, 12, 48), trimMat);
      hem.rotation.x = Math.PI / 2;
      hem.position.y = -1.62;
      root.add(hem);

      // Floating Sheer Dupatta Veil Ribbon
      const dupattaPoints = [];
      for (let p = 0; p <= 32; p++) {
        const t = p / 32;
        const angle = t * Math.PI * 1.6 - 0.4;
        const rad = 0.78 + Math.sin(t * Math.PI) * 0.48;
        const dy = 1.15 - t * 2.3;
        const dx = Math.cos(angle) * rad;
        const dz = Math.sin(angle) * rad + 0.15;
        dupattaPoints.push(new THREE.Vector3(dx, dy, dz));
      }
      const dupattaCurve = new THREE.CatmullRomCurve3(dupattaPoints);
      const dupattaGeo = new THREE.TubeGeometry(dupattaCurve, 40, 0.18, 8, false);
      const dupatta = new THREE.Mesh(dupattaGeo, sheerMat);
      root.add(dupatta);

      physics.initFromGeometry(skirtGeo, clothMesh, {
        isPinned: (y) => y > 0.8,
        flexFactor: (y) => Math.max(0.1, 1.5 - y)
      });
      break;
    }

    // --- E. STREETWEAR HOODIE / CASUAL SHIRTS / JACKETS / TOPS ---
    case 'shihakusho-techwear-hoodie':
    case 'men-oversized-camp-shirt':
    case 'men-selvedge-denim-jacket':
    case 'men-mandarin-silk-formal':
    case 'women-leather-biker-jacket':
    case 'women-cyber-pleated-skirt':
    case 'women-cashmere-knit-top':
    case 'unisex-draped-kimono-cardigan':
    case 'cyber-ajrakh-tech-haori':
    default: {
      // Main Body Torso (Cloth Simulation Mesh)
      const isHoodie = garment.category === 'Hoodies';
      const isJacket = garment.category === 'Jackets';
      const isSkirt = garment.category === 'Skirts';
      const isTop = garment.category === 'Tops';

      const topRadius = isSkirt ? 0.42 : isHoodie ? 0.58 : 0.52;
      const botRadius = isSkirt ? 0.95 : isHoodie ? 0.65 : isJacket ? 0.68 : 0.62;
      const height = isSkirt ? 1.4 : isTop ? 1.2 : 1.6;

      const bodyGeo = new THREE.CylinderGeometry(topRadius, botRadius, height, 36, 20, true);
      const pos = bodyGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < 0) {
          const factor = 1.0 + Math.abs(y) * (isSkirt ? 0.6 : 0.35);
          pos.setX(i, pos.getX(i) * factor);
          pos.setZ(i, pos.getZ(i) * factor);
        }
      }
      bodyGeo.computeVertexNormals();

      clothMesh = new THREE.Mesh(bodyGeo, mainMat);
      clothMesh.position.y = isSkirt ? -0.4 : 0.25;
      root.add(clothMesh);
      clothGeometry = bodyGeo;

      // Collar / Hood / Lapel Details
      if (isHoodie) {
        // Relaxed Hood Dome
        const hoodGeo = new THREE.SphereGeometry(0.38, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.5);
        const hood = new THREE.Mesh(hoodGeo, mainMat);
        hood.position.set(0, 1.25, -0.15);
        hood.rotation.x = -Math.PI / 8;
        root.add(hood);

        // Hanging Drawstrings
        [-0.08, 0.08].forEach((xOff) => {
          const string = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8), trimMat);
          string.position.set(xOff, 0.8, 0.48);
          root.add(string);
        });
      } else if (isJacket) {
        // Lapels
        const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.05), innerMat);
        const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.05), trimMat);
        lapelL.position.set(-0.16, 0.6, 0.52);
        lapelR.position.set(0.16, 0.6, 0.52);
        root.add(lapelL);
        root.add(lapelR);
      } else if (!isSkirt) {
        // Collar band
        const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 12, 32), trimMat);
        collarRing.rotation.x = Math.PI / 2;
        collarRing.position.y = 1.12;
        root.add(collarRing);
      }

      // Sleeves (if not skirt)
      if (!isSkirt) {
        [-1, 1].forEach((side) => {
          const sleeveGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.95, 20);
          const sleeve = new THREE.Mesh(sleeveGeo, mainMat);
          sleeve.rotation.z = side * (isHoodie ? Math.PI / 4.5 : Math.PI / 5.5);
          sleeve.position.set(side * 0.68, 0.5, 0);
          root.add(sleeve);
        });
      }

      physics.initFromGeometry(bodyGeo, clothMesh, {
        isPinned: (y) => y > (isSkirt ? 0.4 : 0.6),
        flexFactor: (y) => Math.max(0.1, 1.2 - y * 0.7)
      });
      break;
    }
  }

  return {
    root,
    physics,
    clothMesh,
    clothGeometry,
    materials: { mainMat, innerMat, trimMat, sheerMat, mannequinMat }
  };
}
