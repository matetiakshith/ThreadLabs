import * as THREE from 'three';

/**
 * Procedural PBR Fabric Material & Texture Generator
 * Produces canvas-based micro-weave bump, normal, and roughness maps for
 * Cotton Twill, Silk Satin, Raw Denim, Grain Leather, and Ripstop Techwear.
 */

// Cache generated canvas textures so they are created only once
const textureCache = {};

function createProceduralTexture(type, size = 256) {
  if (textureCache[type]) return textureCache[type];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  switch (type) {
    case 'cotton-normal': {
      // Twill weave diagonal pattern
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const diag = (x + y * 2) % 6 < 3 ? 1 : -1;
          const cross = (x * 2 - y) % 6 < 3 ? 1 : -1;
          const nx = 128 + diag * 35;
          const ny = 128 + cross * 35;
          const nz = 240;
          data[idx] = nx;
          data[idx + 1] = ny;
          data[idx + 2] = nz;
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'denim-normal': {
      // Coarse diagonal ribbed weave
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const rib = Math.sin((x * 3 + y * 2) * 0.4) * 45;
          const warp = Math.sin(x * 1.5) * 20;
          data[idx] = 128 + rib;
          data[idx + 1] = 128 + warp;
          data[idx + 2] = 230;
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'leather-normal': {
      // Organic pebble cell noise
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const cell = (Math.sin(x * 0.3) * Math.cos(y * 0.3) + Math.sin(x * 0.7 + y * 0.5)) * 30;
          data[idx] = 128 + cell;
          data[idx + 1] = 128 + cell * 0.8;
          data[idx + 2] = 235;
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'silk-normal': {
      // Fine satin micro-sheen
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const grain = Math.sin(x * 2.5) * 12;
          data[idx] = 128 + grain;
          data[idx + 1] = 128;
          data[idx + 2] = 250;
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'techwear-normal': {
      // Ripstop grid
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const isGridX = x % 16 < 2;
          const isGridY = y % 16 < 2;
          const bump = (isGridX || isGridY) ? 50 : 0;
          data[idx] = 128 + (isGridX ? bump : 0);
          data[idx + 1] = 128 + (isGridY ? bump : 0);
          data[idx + 2] = 240;
          data[idx + 3] = 255;
        }
      }
      break;
    }

    default:
      break;
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  textureCache[type] = texture;

  return texture;
}

/**
 * Builds PBR MeshPhysicalMaterial with proper optical and surface properties
 */
export function createPBRFabricMaterial(fabricType, colorHex, options = {}) {
  const {
    isWireframe = false,
    roughnessMultiplier = 1.0,
    metalnessMultiplier = 1.0,
    emissiveHex = null,
    emissiveIntensity = 0.0,
    side = THREE.DoubleSide,
    transparent = false,
    opacity = 1.0,
  } = options;

  const baseColor = new THREE.Color(colorHex);
  let roughness = 0.5;
  let metalness = 0.1;
  let clearcoat = 0.3;
  let clearcoatRoughness = 0.2;
  let normalMap = null;
  let normalScale = new THREE.Vector2(0.5, 0.5);
  let sheen = 0.0;
  let sheenColor = new THREE.Color(0xffffff);

  switch (fabricType) {
    case 'silk':
      roughness = 0.22 * roughnessMultiplier;
      metalness = 0.18 * metalnessMultiplier;
      clearcoat = 0.85;
      clearcoatRoughness = 0.12;
      sheen = 0.9;
      sheenColor = baseColor.clone().offsetHSL(0, 0.1, 0.15);
      normalMap = createProceduralTexture('silk-normal');
      normalScale.set(0.35, 0.35);
      break;

    case 'cotton':
      roughness = 0.78 * roughnessMultiplier;
      metalness = 0.04 * metalnessMultiplier;
      clearcoat = 0.05;
      sheen = 0.3;
      normalMap = createProceduralTexture('cotton-normal');
      normalScale.set(0.65, 0.65);
      break;

    case 'denim':
      roughness = 0.88 * roughnessMultiplier;
      metalness = 0.08 * metalnessMultiplier;
      clearcoat = 0.02;
      normalMap = createProceduralTexture('denim-normal');
      normalScale.set(0.85, 0.85);
      break;

    case 'leather':
      roughness = 0.38 * roughnessMultiplier;
      metalness = 0.28 * metalnessMultiplier;
      clearcoat = 0.75;
      clearcoatRoughness = 0.35;
      normalMap = createProceduralTexture('leather-normal');
      normalScale.set(0.95, 0.95);
      break;

    case 'polyester':
    case 'techwear':
      roughness = 0.42 * roughnessMultiplier;
      metalness = 0.35 * metalnessMultiplier;
      clearcoat = 0.65;
      normalMap = createProceduralTexture('techwear-normal');
      normalScale.set(0.7, 0.7);
      break;

    case 'zari':
      roughness = 0.16 * roughnessMultiplier;
      metalness = 0.92 * metalnessMultiplier;
      clearcoat = 0.95;
      clearcoatRoughness = 0.1;
      sheen = 1.0;
      sheenColor = new THREE.Color(0xffe066);
      normalMap = createProceduralTexture('cotton-normal');
      normalScale.set(0.4, 0.4);
      break;

    default:
      roughness = 0.5 * roughnessMultiplier;
      metalness = 0.1 * metalnessMultiplier;
      break;
  }

  const mat = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness,
    normalMap,
    normalScale,
    wireframe: isWireframe,
    side,
    transparent,
    opacity,
    emissive: emissiveHex ? new THREE.Color(emissiveHex) : new THREE.Color(0x000000),
    emissiveIntensity,
  });

  return mat;
}
