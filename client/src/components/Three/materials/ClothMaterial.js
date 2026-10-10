import * as THREE from 'three';

/**
 * PBR Cloth Material Engine
 * Generates physical cloth materials with micro-weave textures, normal bump maps,
 * clearcoat sheen, and physical cloth parameters (stiffness, stretch, bending, damping, weight).
 */

const textureCache = {};

function getProceduralWeaveTexture(type, size = 256) {
  if (textureCache[type]) return textureCache[type];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let nx = 128;
      let ny = 128;
      let nz = 245;

      if (type === 'cotton') {
        // Twill diagonal weave
        const diag = (x + y * 2) % 6 < 3 ? 1 : -1;
        const cross = (x * 2 - y) % 6 < 3 ? 1 : -1;
        nx = 128 + diag * 32;
        ny = 128 + cross * 32;
      } else if (type === 'denim') {
        // Coarse 3x1 twill ridges
        const rib = Math.sin((x * 3 + y * 2) * 0.45) * 48;
        const warp = Math.sin(x * 1.6) * 22;
        nx = 128 + rib;
        ny = 128 + warp;
        nz = 225;
      } else if (type === 'leather') {
        // Organic pebble leather grain
        const cell = (Math.sin(x * 0.35) * Math.cos(y * 0.35) + Math.sin(x * 0.8 + y * 0.6)) * 34;
        nx = 128 + cell;
        ny = 128 + cell * 0.85;
        nz = 230;
      } else if (type === 'silk' || type === 'satin') {
        // Fine satin micro-sheen
        const grain = Math.sin(x * 3.2) * 14;
        nx = 128 + grain;
        ny = 128;
        nz = 250;
      } else if (type === 'wool' || type === 'knit') {
        // Looped knit ribs
        const rib = Math.sin(x * 1.8) * 36;
        const loop = Math.sin(y * 2.4) * 28;
        nx = 128 + rib;
        ny = 128 + loop;
        nz = 230;
      } else if (type === 'techwear') {
        // Ripstop grid
        const isGridX = x % 16 < 2;
        const isGridY = y % 16 < 2;
        const bump = (isGridX || isGridY) ? 55 : 0;
        nx = 128 + (isGridX ? bump : 0);
        ny = 128 + (isGridY ? bump : 0);
        nz = 238;
      }

      data[idx] = nx;
      data[idx + 1] = ny;
      data[idx + 2] = nz;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  textureCache[type] = texture;

  return texture;
}

export const FABRIC_DEFINITIONS = {
  silk: {
    id: 'silk',
    name: 'Habotai Silk (रेशम)',
    roughness: 0.22,
    metalness: 0.16,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    sheen: 0.95,
    sheenColorHex: 0xffffff,
    thickness: 0.008,
    weightGSM: '110 GSM',
    stiffness: 0.16,
    damping: 0.985,
    windSensitivity: 2.5,
    stretchResistance: 0.88,
    bendingResistance: 0.14,
    description: 'Ultra-lightweight, lustrous drape with dynamic fluid wave motion.'
  },
  satin: {
    id: 'satin',
    name: 'Duchess Satin',
    roughness: 0.18,
    metalness: 0.22,
    clearcoat: 0.92,
    clearcoatRoughness: 0.08,
    sheen: 1.0,
    sheenColorHex: 0xffffff,
    thickness: 0.012,
    weightGSM: '180 GSM',
    stiffness: 0.28,
    damping: 0.975,
    windSensitivity: 1.9,
    stretchResistance: 0.90,
    bendingResistance: 0.22,
    description: 'High specular shine with graceful cascading folds.'
  },
  cotton: {
    id: 'cotton',
    name: 'Organic Cotton Khadi',
    roughness: 0.76,
    metalness: 0.04,
    clearcoat: 0.05,
    sheen: 0.25,
    thickness: 0.015,
    weightGSM: '220 GSM',
    stiffness: 0.48,
    damping: 0.955,
    windSensitivity: 1.1,
    stretchResistance: 0.94,
    bendingResistance: 0.42,
    description: 'Natural matte surface, breathable drape, and organic settle.'
  },
  denim: {
    id: 'denim',
    name: 'Raw 14.5oz Selvedge Denim',
    roughness: 0.88,
    metalness: 0.08,
    clearcoat: 0.02,
    sheen: 0.12,
    thickness: 0.035,
    weightGSM: '480 GSM',
    stiffness: 0.82,
    damping: 0.93,
    windSensitivity: 0.45,
    stretchResistance: 0.98,
    bendingResistance: 0.86,
    description: 'Heavyweight rigid twill with crisp structured creases.'
  },
  leather: {
    id: 'leather',
    name: 'Full-Grain Lambskin Leather',
    roughness: 0.36,
    metalness: 0.26,
    clearcoat: 0.78,
    clearcoatRoughness: 0.32,
    sheen: 0.45,
    thickness: 0.042,
    weightGSM: '600 GSM',
    stiffness: 0.92,
    damping: 0.90,
    windSensitivity: 0.22,
    stretchResistance: 0.99,
    bendingResistance: 0.92,
    description: 'Firm, heavy drape with subtle organic highlights.'
  },
  wool: {
    id: 'wool',
    name: 'Cashmere & Merino Wool',
    roughness: 0.82,
    metalness: 0.05,
    clearcoat: 0.08,
    sheen: 0.55,
    thickness: 0.028,
    weightGSM: '350 GSM',
    stiffness: 0.55,
    damping: 0.94,
    windSensitivity: 0.8,
    stretchResistance: 0.92,
    bendingResistance: 0.58,
    description: 'Soft, tactile, and substantial with cozy volume.'
  },
  linen: {
    id: 'linen',
    name: 'Pure Slub Linen',
    roughness: 0.80,
    metalness: 0.03,
    clearcoat: 0.04,
    sheen: 0.2,
    thickness: 0.014,
    weightGSM: '160 GSM',
    stiffness: 0.42,
    damping: 0.96,
    windSensitivity: 1.3,
    stretchResistance: 0.93,
    bendingResistance: 0.38,
    description: 'Light, crisp texture that billows easily in the breeze.'
  },
  techwear: {
    id: 'techwear',
    name: 'Ripstop Technical Nylon',
    roughness: 0.44,
    metalness: 0.32,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
    sheen: 0.5,
    thickness: 0.016,
    weightGSM: '240 GSM',
    stiffness: 0.62,
    damping: 0.95,
    windSensitivity: 1.4,
    stretchResistance: 0.96,
    bendingResistance: 0.48,
    description: 'Aerodynamic, resilient, with water-repellent sheen.'
  },
  zari: {
    id: 'zari',
    name: 'Banarasi Gold Zari Brocade',
    roughness: 0.18,
    metalness: 0.92,
    clearcoat: 0.95,
    clearcoatRoughness: 0.1,
    sheen: 1.0,
    sheenColorHex: 0xffe066,
    thickness: 0.022,
    weightGSM: '380 GSM',
    stiffness: 0.70,
    damping: 0.95,
    windSensitivity: 0.7,
    stretchResistance: 0.97,
    bendingResistance: 0.72,
    description: 'Gilded metallic weave with opulent reflective gold threads.'
  }
};

export function createPBRClothMaterial(fabricKey, colorHex, options = {}) {
  const {
    isWireframe = false,
    emissiveHex = null,
    emissiveIntensity = 0.0,
    transparent = false,
    opacity = 1.0,
  } = options;

  const def = FABRIC_DEFINITIONS[fabricKey] || FABRIC_DEFINITIONS.cotton;
  const baseColor = new THREE.Color(colorHex);
  const normalMap = getProceduralWeaveTexture(fabricKey === 'zari' ? 'cotton' : fabricKey);

  const mat = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    roughness: def.roughness,
    metalness: def.metalness,
    clearcoat: def.clearcoat,
    clearcoatRoughness: def.clearcoatRoughness || 0.2,
    sheen: def.sheen,
    sheenColor: def.sheenColorHex ? new THREE.Color(def.sheenColorHex) : baseColor.clone().offsetHSL(0, 0.08, 0.1),
    normalMap,
    normalScale: new THREE.Vector2(0.65, 0.65),
    wireframe: isWireframe,
    side: THREE.DoubleSide,
    transparent,
    opacity,
    emissive: emissiveHex ? new THREE.Color(emissiveHex) : new THREE.Color(0x000000),
    emissiveIntensity,
  });

  return mat;
}
