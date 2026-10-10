import * as THREE from 'three';

/**
 * 3D Procedural Fashion Garment Builder & Physics Engine
 * Inspired by Bleach (Tite Kubo Haute Couture Aesthetics) & Indian Heritage Craftsmanship
 */

// Available Outfits Collection
export const FASHION_OUTFITS = [
  {
    id: 'captain-haori',
    name: 'Gotei Captain Haori & Shihakusho',
    animeRef: 'Bleach - 13 Court Guard Captain Robes',
    category: 'Anime Haute Couture (Unisex/Men)',
    gender: 'Unisex',
    description: 'Iconic pure white captain haori with black inner shihakusho kimono, flared bell sleeves, gold crest, and fluid flowing obi sash.',
    defaultColor: '#f8fafc',
    innerColor: '#0f172a',
    accentColor: '#d4af37',
    fabricType: 'Pure Habotai Silk & Raw Cotton',
    craftTechnique: 'Zardozi Gold Crest & Handloom Weave',
    price: '₹5,800',
    tags: ['Bleach', 'Shinigami', 'Haori', 'Kimono', 'Gold Zari']
  },
  {
    id: 'quincy-trench',
    name: 'Sternritter Imperial Trench & Capelet',
    animeRef: 'Bleach - Quincy Wandenreich Uniforms',
    category: 'Avant-Garde Military Tailoring (Men)',
    gender: 'Men',
    description: 'Crisp architectural white trench coat with high standing officer collar, asymmetrical draped shoulder capelet, and silver cross trims.',
    defaultColor: '#ffffff',
    innerColor: '#1e293b',
    accentColor: '#38bdf8',
    fabricType: 'Structured Khadi Wool & Fine Silk',
    craftTechnique: 'Silver Mukaish & Precision Tailoring',
    price: '₹6,400',
    tags: ['Bleach', 'Quincy', 'Trench Coat', 'Cape', 'Mukaish']
  },
  {
    id: 'arrancar-couture',
    name: 'Espada Obsidian Flared Kimono-Gown',
    animeRef: 'Bleach - Espada / Arrancar Aesthetics',
    category: 'High-Fashion Runway (Unisex/Women)',
    gender: 'Unisex',
    description: 'High funnel neck with contrasting black lapel lining, hollow heart crystal emblem, and sweeping flared hakama pleated hemline.',
    defaultColor: '#ffffff',
    innerColor: '#09090b',
    accentColor: '#10b981',
    fabricType: 'Glossy Mulberry Silk & Chanderi',
    craftTechnique: 'Chikankari Shadow Work & Kantha Quilting',
    price: '₹5,200',
    tags: ['Bleach', 'Espada', 'Hakama', 'Minimalist', 'Runway']
  },
  {
    id: 'celestial-anarkali',
    name: 'Celestial Silk Saree-Gown & Anarkali',
    animeRef: 'Ethereal Fantasy & Royal Indian Couture',
    category: 'Royal Heritage Couture (Women)',
    gender: 'Women',
    description: 'Sculpted sweetheart corset with tiered flared georgette skirt and a dynamic floating sheer silk dupatta veil that waves fluidly.',
    defaultColor: '#be185d',
    innerColor: '#831843',
    accentColor: '#fbbf24',
    fabricType: 'Banarasi Brocade & Organza Silk',
    craftTechnique: 'Gold Zari Brocade & Lucknowi Mukaish',
    price: '₹7,200',
    tags: ['Heritage', 'Anarkali', 'Saree Gown', 'Dupatta', 'Banarasi']
  },
  {
    id: 'cyber-haori',
    name: 'Cyber-Heritage Draped Streetwear Haori',
    animeRef: 'Bleach Streetwear & Modern Harajuku',
    category: 'Contemporary Streetwear (Unisex)',
    gender: 'Unisex',
    description: 'Oversized draped kimono streetwear jacket with asymmetric Ajrakh geometric panels, wide drop sleeves, and flowing silk tassels.',
    defaultColor: '#1e3a8a',
    innerColor: '#172554',
    accentColor: '#f97316',
    fabricType: 'Organic Khadi Denim & Ajrakh Modal Silk',
    craftTechnique: 'Natural Indigo Ajrakh Block Print',
    price: '₹4,400',
    tags: ['Streetwear', 'Ajrakh', 'Cyberpunk', 'Modern Kimono']
  }
];

/**
 * Creates Materials for the Outfit based on Sheen and Lighting Mode
 */
export function createFashionMaterials(outfit, options = {}) {
  const {
    sheen = 'silk', // 'silk' | 'cotton' | 'zari' | 'velvet' | 'reiatsu'
    isWireframe = false,
    customColor = null,
    accentColor = null,
  } = options;

  const baseColor = customColor ? new THREE.Color(customColor) : new THREE.Color(outfit.defaultColor);
  const innerCol = new THREE.Color(outfit.innerColor);
  const goldCol = accentColor ? new THREE.Color(accentColor) : new THREE.Color(outfit.accentColor);

  let roughness = 0.35;
  let metalness = 0.15;
  let clearcoat = 0.6;
  let emissive = new THREE.Color(0x000000);
  let emissiveIntensity = 0;

  if (sheen === 'cotton') {
    roughness = 0.85;
    metalness = 0.05;
    clearcoat = 0.05;
  } else if (sheen === 'zari') {
    roughness = 0.2;
    metalness = 0.75;
    clearcoat = 0.9;
  } else if (sheen === 'velvet') {
    roughness = 0.9;
    metalness = 0.3;
    clearcoat = 0.4;
  } else if (sheen === 'reiatsu') {
    roughness = 0.15;
    metalness = 0.4;
    clearcoat = 1.0;
    emissive = new THREE.Color(outfit.accentColor);
    emissiveIntensity = 0.35;
  }

  const mainClothMat = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness: 0.2,
    wireframe: isWireframe,
    side: THREE.DoubleSide,
    emissive,
    emissiveIntensity,
  });

  const innerClothMat = new THREE.MeshPhysicalMaterial({
    color: innerCol,
    roughness: 0.65,
    metalness: 0.1,
    clearcoat: 0.2,
    wireframe: isWireframe,
    side: THREE.DoubleSide,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: goldCol,
    metalness: 0.9,
    roughness: 0.18,
    wireframe: isWireframe,
    emissive: sheen === 'reiatsu' ? goldCol : new THREE.Color(0x332200),
    emissiveIntensity: sheen === 'reiatsu' ? 0.4 : 0.1,
  });

  const mannequinMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x18181b),
    metalness: 0.8,
    roughness: 0.25,
    wireframe: isWireframe,
  });

  const sheerMat = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    roughness: 0.2,
    metalness: 0.1,
    transmission: 0.6,
    opacity: 0.85,
    transparent: true,
    side: THREE.DoubleSide,
    wireframe: isWireframe,
    clearcoat: 0.9,
  });

  return { mainClothMat, innerClothMat, goldTrimMat, mannequinMat, sheerMat };
}

/**
 * Procedural 3D Garment Mesh Builders with Fluid Vertex Physics Registers
 */
export function buildFashionMesh(outfitId, materials) {
  const root = new THREE.Group();
  const fluidVertices = []; // Elements needing dynamic wave inertia

  const { mainClothMat, innerClothMat, goldTrimMat, mannequinMat, sheerMat } = materials;

  // 1. Sleek High-Fashion Mannequin Base (Pedestal & Torso Frame)
  const standMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 1.7, 16),
    mannequinMat
  );
  standMesh.position.y = -1.1;
  root.add(standMesh);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.65, 0.08, 32),
    mannequinMat
  );
  pedestal.position.y = -1.85;
  root.add(pedestal);

  const neckGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 20);
  const neckMesh = new THREE.Mesh(neckGeo, mannequinMat);
  neckMesh.position.y = 1.25;
  root.add(neckMesh);

  // BUILD SPECIFIC OUTFIT MESH
  switch (outfitId) {
    case 'captain-haori': {
      // 1. Inner Shihakusho (Black Kimono Torso & Collar)
      const innerTorso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.42, 1.4, 32, 10),
        innerClothMat
      );
      innerTorso.position.y = 0.35;
      root.add(innerTorso);

      // White Juban Undercollar V-shape
      const jubanCollar = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.035, 12, 32, Math.PI),
        mainClothMat
      );
      jubanCollar.rotation.x = Math.PI / 3;
      jubanCollar.position.set(0, 1.05, 0.15);
      root.add(jubanCollar);

      // 2. White Captain Haori (Flowing Outer Robe)
      const haoriGeo = new THREE.CylinderGeometry(0.55, 0.78, 1.6, 40, 20, true);
      // Make it open in the front
      const haoriPos = haoriGeo.attributes.position;
      for (let i = 0; i < haoriPos.count; i++) {
        const x = haoriPos.getX(i);
        const y = haoriPos.getY(i);
        const z = haoriPos.getZ(i);
        // Flared bottom
        if (y < 0) {
          const flare = 1.0 + Math.abs(y) * 0.45;
          haoriPos.setX(i, x * flare);
          haoriPos.setZ(i, z * flare);
        }
      }
      haoriGeo.computeVertexNormals();

      const haoriMesh = new THREE.Mesh(haoriGeo, mainClothMat);
      haoriMesh.position.y = 0.25;
      root.add(haoriMesh);

      // Register Haori for fluid physics
      fluidVertices.push({
        geometry: haoriGeo,
        flexFactor: 0.35,
        type: 'hem',
      });

      // 3. Flared Kimono Sleeves (Left & Right)
      [-1, 1].forEach((side) => {
        const sleeveGeo = new THREE.CylinderGeometry(0.22, 0.45, 0.95, 24, 16);
        sleeveGeo.rotateZ(side * Math.PI / 4.5);
        sleeveGeo.rotateX(0.15);
        const sleevePos = sleeveGeo.attributes.position;
        for (let i = 0; i < sleevePos.count; i++) {
          const y = sleevePos.getY(i);
          if (y < 0) {
            sleevePos.setZ(i, sleevePos.getZ(i) * 1.5 + 0.1);
          }
        }
        sleeveGeo.computeVertexNormals();

        const sleeveMesh = new THREE.Mesh(sleeveGeo, mainClothMat);
        sleeveMesh.position.set(side * 0.72, 0.6, -0.05);
        root.add(sleeveMesh);

        fluidVertices.push({
          geometry: sleeveGeo,
          flexFactor: 0.55,
          side,
          type: 'sleeve',
        });

        // Black Inner Sleeve Cuff
        const innerSleeve = new THREE.Mesh(
          new THREE.TorusGeometry(0.38, 0.04, 12, 24),
          innerClothMat
        );
        innerSleeve.position.set(side * 0.95, 0.25, 0);
        innerSleeve.rotation.x = Math.PI / 2.2;
        innerSleeve.rotation.y = side * 0.4;
        root.add(innerSleeve);
      });

      // 4. Obi Belt & Flowing Sash Tails
      const obi = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.28, 32),
        innerClothMat
      );
      obi.position.y = 0.28;
      root.add(obi);

      // Gold Trim on Obi
      const obiTrim = new THREE.Mesh(
        new THREE.TorusGeometry(0.51, 0.025, 12, 32),
        goldTrimMat
      );
      obiTrim.rotation.x = Math.PI / 2;
      obiTrim.position.y = 0.28;
      root.add(obiTrim);

      // Trailing Obi Sash Ribbon (Dynamic flutter)
      const sashGeo = new THREE.PlaneGeometry(0.18, 0.9, 8, 16);
      sashGeo.translate(0, -0.45, 0);
      const sashMesh = new THREE.Mesh(sashGeo, mainClothMat);
      sashMesh.position.set(0.12, 0.28, 0.52);
      root.add(sashMesh);

      fluidVertices.push({
        geometry: sashGeo,
        flexFactor: 0.85,
        type: 'sash',
      });

      // Gold Back Squad Insignia Diamond
      const emblemGeo = new THREE.OctahedronGeometry(0.18, 0);
      emblemGeo.scale(1, 1.4, 0.2);
      const emblem = new THREE.Mesh(emblemGeo, goldTrimMat);
      emblem.position.set(0, 0.75, -0.56);
      root.add(emblem);

      // Flared Hakama Lower Trousers
      const hakamaGeo = new THREE.CylinderGeometry(0.55, 0.75, 0.9, 32, 12);
      const hakamaMesh = new THREE.Mesh(hakamaGeo, innerClothMat);
      hakamaMesh.position.y = -0.5;
      root.add(hakamaMesh);

      fluidVertices.push({
        geometry: hakamaGeo,
        flexFactor: 0.25,
        type: 'hem',
      });

      break;
    }

    case 'quincy-trench': {
      // 1. High Standing Officer Collar
      const collarGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.38, 32, 4, true);
      const collarMesh = new THREE.Mesh(collarGeo, mainClothMat);
      collarMesh.position.y = 1.22;
      root.add(collarMesh);

      const collarInner = new THREE.Mesh(
        new THREE.TorusGeometry(0.33, 0.02, 12, 32),
        goldTrimMat
      );
      collarInner.rotation.x = Math.PI / 2;
      collarInner.position.y = 1.38;
      root.add(collarInner);

      // 2. Structured Double-Breasted Long Military Trench Coat
      const coatGeo = new THREE.CylinderGeometry(0.52, 0.85, 2.1, 40, 24, true);
      const coatPos = coatGeo.attributes.position;
      for (let i = 0; i < coatPos.count; i++) {
        const y = coatPos.getY(i);
        const x = coatPos.getX(i);
        const z = coatPos.getZ(i);
        if (y < 0.2) {
          const factor = 1.0 + Math.pow(Math.abs(y - 0.2), 1.2) * 0.5;
          coatPos.setX(i, x * factor);
          coatPos.setZ(i, z * factor);
        }
      }
      coatGeo.computeVertexNormals();

      const coatMesh = new THREE.Mesh(coatGeo, mainClothMat);
      coatMesh.position.y = 0.05;
      root.add(coatMesh);

      fluidVertices.push({
        geometry: coatGeo,
        flexFactor: 0.45,
        type: 'hem',
      });

      // 3. Asymmetrical Draped Shoulder Capelet (Right Side)
      const capeGeo = new THREE.PlaneGeometry(0.65, 1.2, 16, 20);
      capeGeo.translate(0, -0.6, 0);
      const capeMesh = new THREE.Mesh(capeGeo, mainClothMat);
      capeMesh.position.set(-0.35, 0.9, 0.25);
      capeMesh.rotation.y = -Math.PI / 6;
      capeMesh.rotation.z = Math.PI / 16;
      root.add(capeMesh);

      fluidVertices.push({
        geometry: capeGeo,
        flexFactor: 0.9,
        type: 'cape',
      });

      // 4. Silver/Blue Sternritter Cross Pin & Medallion
      const crossVert = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), goldTrimMat);
      const crossHoriz = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), goldTrimMat);
      crossVert.position.set(0.24, 0.85, 0.48);
      crossHoriz.position.set(0.24, 0.85, 0.48);
      root.add(crossVert);
      root.add(crossHoriz);

      // Silver Buttons along Placket
      for (let b = 0; b < 6; b++) {
        const btnL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), goldTrimMat);
        const btnR = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), goldTrimMat);
        btnL.position.set(-0.09, 0.75 - b * 0.16, 0.52);
        btnR.position.set(0.09, 0.75 - b * 0.16, 0.52);
        root.add(btnL);
        root.add(btnR);
      }

      // Fitted Sleeves with Silver Cuffs
      [-1, 1].forEach((side) => {
        const sleeve = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.16, 0.95, 20),
          mainClothMat
        );
        sleeve.rotation.z = side * Math.PI / 6;
        sleeve.position.set(side * 0.65, 0.5, 0);
        root.add(sleeve);

        const cuff = new THREE.Mesh(
          new THREE.TorusGeometry(0.17, 0.02, 12, 24),
          goldTrimMat
        );
        cuff.position.set(side * 0.88, 0.12, 0);
        cuff.rotation.x = Math.PI / 2;
        root.add(cuff);
      });

      break;
    }

    case 'arrancar-couture': {
      // 1. High Funnel Neck Collar with Obsidian Edge
      const funnelGeo = new THREE.CylinderGeometry(0.38, 0.28, 0.45, 32, 6, true);
      const funnelMesh = new THREE.Mesh(funnelGeo, mainClothMat);
      funnelMesh.position.y = 1.2;
      root.add(funnelMesh);

      const funnelTrim = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.025, 12, 32),
        innerClothMat
      );
      funnelTrim.rotation.x = Math.PI / 2;
      funnelTrim.position.y = 1.42;
      root.add(funnelTrim);

      // 2. Sculpted Form-Fitting Obsidian & White Jacket
      const jacketGeo = new THREE.CylinderGeometry(0.48, 0.45, 1.1, 32, 12);
      const jacketMesh = new THREE.Mesh(jacketGeo, mainClothMat);
      jacketMesh.position.y = 0.5;
      root.add(jacketMesh);

      // Central Vertical Black Seam
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, 0.04), innerClothMat);
      seam.position.set(0, 0.5, 0.48);
      root.add(seam);

      // Hollow Heart Jewel (Glowing Emissive Gem)
      const heartGeo = new THREE.TorusGeometry(0.09, 0.025, 16, 32);
      const heartMesh = new THREE.Mesh(heartGeo, goldTrimMat);
      heartMesh.position.set(0, 0.72, 0.51);
      root.add(heartMesh);

      // 3. Wide Flowing Pleated Hakama Skirt (Floor Length)
      const hakamaGeo = new THREE.CylinderGeometry(0.48, 1.05, 1.8, 48, 24, true);
      const hakPos = hakamaGeo.attributes.position;
      for (let i = 0; i < hakPos.count; i++) {
        const y = hakPos.getY(i);
        const theta = Math.atan2(hakPos.getZ(i), hakPos.getX(i));
        // Pleat ridges
        const pleat = Math.sin(theta * 16) * 0.04 * (1.0 - y);
        hakPos.setX(i, hakPos.getX(i) + Math.cos(theta) * pleat);
        hakPos.setZ(i, hakPos.getZ(i) + Math.sin(theta) * pleat);
      }
      hakamaGeo.computeVertexNormals();

      const hakama = new THREE.Mesh(hakamaGeo, mainClothMat);
      hakama.position.y = -0.45;
      root.add(hakama);

      fluidVertices.push({
        geometry: hakamaGeo,
        flexFactor: 0.65,
        type: 'hem',
      });

      // Symmetrical Aerodynamic Wing Sleeves
      [-1, 1].forEach((side) => {
        const wingSleeveGeo = new THREE.PlaneGeometry(0.5, 1.1, 12, 16);
        wingSleeveGeo.translate(side * 0.25, -0.55, 0);
        const wingSleeve = new THREE.Mesh(wingSleeveGeo, mainClothMat);
        wingSleeve.position.set(side * 0.55, 0.75, -0.1);
        wingSleeve.rotation.y = side * 0.3;
        root.add(wingSleeve);

        fluidVertices.push({
          geometry: wingSleeveGeo,
          flexFactor: 0.8,
          side,
          type: 'sleeve',
        });
      });

      break;
    }

    case 'celestial-anarkali': {
      // 1. Sculpted Sweetheart Corset Bodice with Zari Embroidery
      const bodiceGeo = new THREE.CylinderGeometry(0.46, 0.38, 0.75, 32, 12);
      const bodiceMesh = new THREE.Mesh(bodiceGeo, mainClothMat);
      bodiceMesh.position.y = 0.65;
      root.add(bodiceMesh);

      // Sweetheart Gold Neckline Trim
      const neckBorder = new THREE.Mesh(
        new THREE.TorusGeometry(0.36, 0.03, 12, 32, Math.PI),
        goldTrimMat
      );
      neckBorder.rotation.x = Math.PI / 3;
      neckBorder.position.set(0, 1.0, 0.16);
      root.add(neckBorder);

      // Gold Waistband / Kamarbandh
      const belt = new THREE.Mesh(
        new THREE.TorusGeometry(0.39, 0.03, 12, 32),
        goldTrimMat
      );
      belt.rotation.x = Math.PI / 2;
      belt.position.y = 0.28;
      root.add(belt);

      // 2. Multi-Tiered Sweeping Flared Anarkali / Lehenga Skirt
      const skirtGeo = new THREE.CylinderGeometry(0.4, 1.25, 2.1, 48, 28, true);
      const sPos = skirtGeo.attributes.position;
      for (let i = 0; i < sPos.count; i++) {
        const y = sPos.getY(i);
        const theta = Math.atan2(sPos.getZ(i), sPos.getX(i));
        // Deep undulating royal ruffles
        const ruffle = Math.sin(theta * 12) * 0.08 * (1.1 - y);
        sPos.setX(i, sPos.getX(i) + Math.cos(theta) * ruffle);
        sPos.setZ(i, sPos.getZ(i) + Math.sin(theta) * ruffle);
      }
      skirtGeo.computeVertexNormals();

      const skirtMesh = new THREE.Mesh(skirtGeo, mainClothMat);
      skirtMesh.position.y = -0.55;
      root.add(skirtMesh);

      fluidVertices.push({
        geometry: skirtGeo,
        flexFactor: 0.7,
        type: 'hem',
      });

      // Gold Brocade Border along Hemline
      const hemBorder = new THREE.Mesh(
        new THREE.TorusGeometry(1.26, 0.05, 12, 48),
        goldTrimMat
      );
      hemBorder.rotation.x = Math.PI / 2;
      hemBorder.position.y = -1.55;
      root.add(hemBorder);

      // 3. Floating Sheer Silk Dupatta / Veil (Dynamic Ribbon Swirl)
      const dupattaCurvePoints = [];
      for (let p = 0; p <= 30; p++) {
        const t = p / 30;
        const angle = t * Math.PI * 1.6 - 0.4;
        const rad = 0.75 + Math.sin(t * Math.PI) * 0.45;
        const dy = 1.1 - t * 2.2;
        const dx = Math.cos(angle) * rad;
        const dz = Math.sin(angle) * rad + 0.15;
        dupattaCurvePoints.push(new THREE.Vector3(dx, dy, dz));
      }

      const dupattaCurve = new THREE.CatmullRomCurve3(dupattaCurvePoints);
      const dupattaGeo = new THREE.TubeGeometry(dupattaCurve, 40, 0.18, 8, false);
      const dupattaMesh = new THREE.Mesh(dupattaGeo, sheerMat);
      root.add(dupattaMesh);

      fluidVertices.push({
        geometry: dupattaGeo,
        flexFactor: 0.95,
        type: 'dupatta',
      });

      break;
    }

    case 'cyber-haori':
    default: {
      // 1. Oversized Boxy Streetwear Haori
      const haoriTorsoGeo = new THREE.CylinderGeometry(0.58, 0.65, 1.4, 32, 12);
      const haoriTorso = new THREE.Mesh(haoriTorsoGeo, mainClothMat);
      haoriTorso.position.y = 0.35;
      root.add(haoriTorso);

      // Contrast Asymmetrical Lapel Band
      const lapelGeo = new THREE.BoxGeometry(0.14, 1.4, 0.06);
      const lapelL = new THREE.Mesh(lapelGeo, innerClothMat);
      const lapelR = new THREE.Mesh(lapelGeo, goldTrimMat);
      lapelL.position.set(-0.18, 0.35, 0.6);
      lapelR.position.set(0.18, 0.35, 0.6);
      root.add(lapelL);
      root.add(lapelR);

      // 2. Wide Drop-Shoulder Streetwear Sleeves
      [-1, 1].forEach((side) => {
        const boxSleeveGeo = new THREE.BoxGeometry(0.55, 0.9, 0.45, 8, 12, 8);
        const boxSleeve = new THREE.Mesh(boxSleeveGeo, mainClothMat);
        boxSleeve.position.set(side * 0.82, 0.4, 0);
        root.add(boxSleeve);

        fluidVertices.push({
          geometry: boxSleeveGeo,
          flexFactor: 0.5,
          side,
          type: 'sleeve',
        });

        // Silk Tassel Drops dangling from sleeve
        const tassel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.04, 0.4, 8),
          goldTrimMat
        );
        tassel.position.set(side * 0.85, -0.2, 0);
        root.add(tassel);
      });

      // 3. Lower Layered Streetwear Asymmetric Hem
      const lowerGeo = new THREE.CylinderGeometry(0.65, 0.85, 0.9, 32, 16, true);
      const lowerMesh = new THREE.Mesh(lowerGeo, mainClothMat);
      lowerMesh.position.y = -0.45;
      root.add(lowerMesh);

      fluidVertices.push({
        geometry: lowerGeo,
        flexFactor: 0.6,
        type: 'hem',
      });

      // Metallic Cyber Buckle
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), goldTrimMat);
      buckle.position.set(0, 0.2, 0.66);
      root.add(buckle);

      break;
    }
  }

  // Cache original vertices for physics displacement
  fluidVertices.forEach((item) => {
    const pos = item.geometry.attributes.position;
    item.original = new Float32Array(pos.array.length);
    item.original.set(pos.array);
  });

  return { root, fluidVertices };
}

/**
 * Updates dynamic real-time cloth ripple & inertial physics in animation frame loop
 */
export function updateClothPhysics(fluidVertices, state) {
  const {
    elapsedTime = 0,
    angularVelocityY = 0,
    dragInertiaX = 0,
    dragInertiaY = 0,
    windIntensity = 1.0,
  } = state;

  fluidVertices.forEach((item) => {
    const pos = item.geometry.attributes.position;
    const orig = item.original;
    if (!pos || !orig) return;

    const flex = item.flexFactor || 0.5;

    for (let i = 0; i < pos.count; i++) {
      const i3 = i * 3;
      const ox = orig[i3];
      const oy = orig[i3 + 1];
      const oz = orig[i3 + 2];

      // Vertical influence (more motion at the bottom/edges)
      const heightFactor = Math.max(0.1, 1.2 - Math.abs(oy) * 0.5);

      // 1. Wind breeze wave equation
      const windWave = Math.sin(ox * 3.5 + oy * 2.0 + elapsedTime * 3.0) * 0.045 * windIntensity * heightFactor;
      const microFlutter = Math.cos(oz * 4.0 - elapsedTime * 4.5) * 0.025 * windIntensity * flex;

      // 2. Inertial drag displacement (lags behind when rotated or dragged)
      const rotDrag = -angularVelocityY * 0.15 * flex * heightFactor;
      const mouseDrag = dragInertiaX * 0.08 * flex + dragInertiaY * 0.04 * flex;

      // Apply to vertices
      if (item.type === 'hem' || item.type === 'cape') {
        pos.setX(i, ox + (windWave + rotDrag) * 0.6);
        pos.setZ(i, oz + windWave + microFlutter + rotDrag + mouseDrag);
      } else if (item.type === 'sleeve') {
        const sideMult = item.side || 1;
        pos.setX(i, ox + (windWave * 0.5 + rotDrag * sideMult) * 0.7);
        pos.setZ(i, oz + windWave + rotDrag * 0.8 + microFlutter);
      } else if (item.type === 'dupatta' || item.type === 'sash') {
        pos.setX(i, ox + Math.sin(elapsedTime * 2.5 + i * 0.2) * 0.08 * windIntensity + rotDrag);
        pos.setZ(i, oz + Math.cos(elapsedTime * 3.0 + i * 0.25) * 0.09 * windIntensity + mouseDrag);
      }
    }

    pos.needsUpdate = true;
    item.geometry.computeVertexNormals();
  });
}
