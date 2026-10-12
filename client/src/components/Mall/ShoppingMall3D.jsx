import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, RotateCcw } from 'lucide-react';

const looks = [
  { title: 'Midnight Zardozi Kurta', category: 'SILK & ZARI', artisan: 'Ustad Rahimuddin Ansari', price: '₹4,800', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1100&h=1450&q=85', side: -1, z: 10.5 },
  { title: 'Indigo Ajrakh Shirt', category: 'AJRAKH', artisan: 'Khatri Ismail Mohammed', price: '₹2,600', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1100&h=1450&q=85', side: 1, z: 3.5 },
  { title: 'Sage Shadow-Work Anarkali', category: 'CHIKANKARI', artisan: 'Begum Shagufta Parveen', price: '₹4,200', image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=1100&h=1450&q=85', side: -1, z: -3.5 },
  { title: 'Monochrome Ikat Blazer', category: 'IKAT', artisan: 'Balaram Padmashali', price: '₹3,800', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1100&h=1450&q=85', side: 1, z: -10.5 },
  { title: 'Forest Kantha Overcoat', category: 'KANTHA', artisan: 'Manjula Devi Roy', price: '₹4,600', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1100&h=1450&q=85', side: -1, z: -17.5 },
  { title: 'Dabu Block Summer Shirt', category: 'DABU', artisan: 'Devi Lal Chhipa', price: '₹2,100', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1100&h=1450&q=85', side: 1, z: -24.5 },
];

const progressForLook = (index) => (index + 1) / (looks.length + 1);

function createPetalField(scene, camera) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.5);
  shape.bezierCurveTo(0.34, 0.28, 0.3, -0.18, 0, -0.5);
  shape.bezierCurveTo(-0.3, -0.18, -0.34, 0.28, 0, 0.5);
  const geometry = new THREE.ShapeGeometry(shape, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false });
  const mesh = new THREE.InstancedMesh(geometry, material, 120);
  mesh.name = 'ENV_floating_petals';
  mesh.frustumCulled = false;
  const hues = [0xff9fc4, 0xffb7d0, 0xf984b5, 0xffd1df];
  const particles = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < mesh.count; i += 1) {
    // Store particle coordinates relative to the camera so the field stays around
    // the visitor throughout the corridor instead of being left behind in world space.
    particles.push({ x: (Math.random() - 0.5) * 8.2, y: Math.random() * 6.2, z: (Math.random() - 0.5) * 20, phase: Math.random() * Math.PI * 2, size: 0.035 + Math.random() * 0.035, spin: Math.random() * 6 });
    mesh.setColorAt(i, new THREE.Color(hues[i % hues.length]));
    dummy.position.set(0, 0, -100);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  scene.add(mesh);
  return { mesh, particles, dummy, lastCamera: new THREE.Vector3(), ready: false };
}

function updatePetals(field, camera, dt, time) {
  const speed = field.ready ? camera.position.distanceTo(field.lastCamera) / Math.max(dt, 0.001) : 0;
  field.lastCamera.copy(camera.position);
  field.ready = true;
  field.particles.forEach((petal, index) => {
    petal.y -= dt * (0.42 + Math.min(speed * 0.025, 0.22));
    petal.x += Math.sin(time * 0.42 + petal.phase) * dt * 0.16;
    petal.z += Math.cos(time * 0.27 + petal.phase) * dt * 0.08;
    petal.spin += dt * (0.42 + speed * 0.025);
    if (petal.y < -1.4 || Math.abs(petal.z) > 10) {
      petal.y = 4.4 + Math.random() * 2.2;
      petal.x = (Math.random() - 0.5) * 8.2;
      petal.z = (Math.random() - 0.5) * 18;
    }
    field.dummy.position.set(camera.position.x + petal.x, camera.position.y + petal.y, camera.position.z + petal.z);
    field.dummy.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2 + Math.sin(petal.spin) * 0.48, petal.spin * 0.6, petal.spin));
    field.dummy.scale.set(petal.size, petal.size * 1.35, petal.size);
    field.dummy.updateMatrix();
    field.mesh.setMatrixAt(index, field.dummy.matrix);
  });
  field.mesh.instanceMatrix.needsUpdate = true;
}

function makeFrameMaterial(color, roughness = 0.7, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, ...extra });
}

function createSurfaceTextures() {
  const makeTexture = (paint) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    paint(canvas.getContext('2d'));
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  };

  const textile = makeTexture((ctx) => {
    ctx.fillStyle = '#e8e1d8';
    ctx.fillRect(0, 0, 256, 256);
    for (let p = 0; p < 256; p += 4) {
      ctx.strokeStyle = p % 8 ? 'rgba(105,82,66,.10)' : 'rgba(255,255,255,.38)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(256, p); ctx.stroke();
    }
  });
  textile.repeat.set(2.4, 2.4);

  const wood = makeTexture((ctx) => {
    ctx.fillStyle = '#d1b99b';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 42; i += 1) {
      const y = i * 6 + Math.random() * 4;
      ctx.strokeStyle = i % 3 ? 'rgba(98,65,39,.12)' : 'rgba(255,241,216,.25)';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(70, y - 5, 180, y + 6, 256, y - 1);
      ctx.stroke();
    }
  });
  wood.repeat.set(1.5, 1.5);

  const stone = makeTexture((ctx) => {
    ctx.fillStyle = '#c2b5a6';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1500; i += 1) {
      ctx.fillStyle = i % 2 ? 'rgba(255,250,240,.12)' : 'rgba(79,65,54,.08)';
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    ctx.strokeStyle = 'rgba(255,247,231,.16)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 82); ctx.bezierCurveTo(80, 72, 150, 91, 256, 78); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 190); ctx.bezierCurveTo(80, 178, 170, 202, 256, 187); ctx.stroke();
  });
  stone.repeat.set(4, 5);

  const ceramic = makeTexture((ctx) => {
    ctx.fillStyle = '#d5b5a2';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1200; i += 1) {
      ctx.fillStyle = i % 2 ? 'rgba(255,248,237,.13)' : 'rgba(116,75,60,.08)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ceramic.repeat.set(2, 1.4);
  return { textile, wood, stone, ceramic };
}

function addBox(scene, name, size, position, material, rotationY = 0, bevel = 0.035) {
  const geometry = new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (bevel > 0) {
    const edge = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edge, new THREE.LineBasicMaterial({ color: material.color, transparent: true, opacity: 0.14 }));
    mesh.add(line);
  }
  scene.add(mesh);
  return mesh;
}

function addSofa(scene, side, z, palette, textileMap) {
  const group = new THREE.Group();
  group.name = 'FURNITURE_gallery_sofa';
  group.position.set(side * 4.16, 0.05, z);
  group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  const fabric = makeFrameMaterial(palette, 0.94, { map: textileMap });
  const seatFabric = makeFrameMaterial(new THREE.Color(palette).multiplyScalar(1.08), 0.96, { map: textileMap });
  const legs = new THREE.MeshStandardMaterial({ color: 0x725c50, roughness: 0.72 });
  const add = (name, size, pos, mat, radius) => {
    const geometry = new RoundedBoxGeometry(...size, 5, radius);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.name = name;
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  add('sofa_upholstered_base', [2.02, 0.38, 0.82], [0, 0.36, -0.02], fabric, 0.15);
  add('sofa_continuous_back', [1.98, 1.0, 0.27], [0, 0.95, -0.29], fabric, 0.13).rotation.x = -0.06;
  [-0.88, 0.88].forEach((x) => {
    add('sofa_round_arm', [0.31, 0.58, 0.84], [x, 0.59, 0.015], fabric, 0.145);
  });
  [-0.65, 0, 0.65].forEach((x, index) => {
    add('sofa_seat_cushion_' + index, [0.61, 0.2, 0.64], [x, 0.58, 0.095], seatFabric, 0.085);
    const back = add('sofa_back_cushion_' + index, [0.61, 0.69, 0.2], [x, 1.12, -0.18], seatFabric, 0.095);
    back.rotation.x = -0.08;
  });
  [[-0.72, -0.25], [0.72, -0.25], [-0.72, 0.27], [0.72, 0.27]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.22, 16), legs);
    leg.position.set(x, 0.12, z);
    group.add(leg);
  });
  [-0.36, 0.42].forEach((x, index) => {
    const cushion = add('loose_linen_cushion_' + index, [0.4, 0.34, 0.16], [x, 1.0, -0.12], makeFrameMaterial(index ? 0xd8c3b8 : 0xe7d9d0, 0.95, { map: textileMap }), 0.07);
    cushion.rotation.z = index ? -0.12 : 0.09;
  });
  scene.add(group);
}

function addWardrobe(scene, side, z, woodMap) {
  const group = new THREE.Group();
  group.name = 'FURNITURE_open_clothing_cupboard';
  group.position.set(side * 4.22, 0.08, z);
  group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  const shell = makeFrameMaterial(0xe8ded2, 0.78, { map: woodMap });
  const inner = makeFrameMaterial(0xbba58f, 0.8, { map: woodMap });
  const rail = makeFrameMaterial(0xa4825e, 0.28, { metalness: 0.58 });
  const panel = (name, size, pos, mat) => {
    const obj = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
    obj.name = name;
    obj.position.set(...pos);
    obj.castShadow = true;
    obj.receiveShadow = true;
    group.add(obj);
    return obj;
  };
  panel('wardrobe_back', [1.52, 2.82, 0.06], [0, 1.45, -0.38], inner);
  panel('wardrobe_left_side', [0.07, 2.9, 0.82], [-0.76, 1.48, 0], shell);
  panel('wardrobe_right_side', [0.07, 2.9, 0.82], [0.76, 1.48, 0], shell);
  panel('wardrobe_top', [1.58, 0.09, 0.88], [0, 2.94, 0], shell);
  panel('wardrobe_base', [1.58, 0.12, 0.88], [0, 0.06, 0], shell);
  panel('wardrobe_upper_shelf', [1.43, 0.06, 0.7], [0, 2.44, 0.02], shell);
  panel('wardrobe_lower_shelf', [1.43, 0.06, 0.7], [0, 0.52, 0.02], shell);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.23, 12), rail);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 2.27, 0.15);
  group.add(bar);

  const garmentColors = [0x9d4554, 0x294d65, 0xc58b67, 0x5c725d, 0xd4c3a9, 0x794f68, 0x354c3f, 0xc1a24f];
  garmentColors.forEach((color, index) => {
    const center = -0.57 + index * 0.162;
    const width = 0.155 + (index % 3) * 0.012;
    const verts = [];
    const faces = [];
    const rows = 16;
    const cols = 8;
    for (let row = 0; row <= rows; row += 1) {
      const t = row / rows;
      const y = 2.16 - t * 1.42;
      const shape = t < 0.18 ? 0.42 + t * 3.2 : t > 0.78 ? 1.16 - (t - 0.78) * 0.45 : 1;
      for (let col = 0; col <= cols; col += 1) {
        const u = col / cols - 0.5;
        const fold = Math.sin((u + 0.5) * Math.PI * 8 + index) * 0.018;
        verts.push([center + u * width * shape, y, 0.21 + fold + t * 0.014]);
        if (row < rows && col < cols) {
          const a = row * (cols + 1) + col;
          const b = a + cols + 1;
          faces.push([a, a + 1, b + 1, b]);
        }
      }
    }
    const clothGeo = new THREE.BufferGeometry();
    clothGeo.setFromPoints(verts.map((v) => new THREE.Vector3(...v)));
    clothGeo.setIndex(faces.flat());
    clothGeo.computeVertexNormals();
    const clothMat = makeFrameMaterial(color, 0.72, { side: THREE.DoubleSide });
    const garment = new THREE.Mesh(clothGeo, clothMat);
    garment.name = 'wardrobe_hanging_garment_' + index;
    garment.castShadow = true;
    group.add(garment);

    const hangerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(center, 2.23, 0.2),
      new THREE.Vector3(center + 0.06, 2.19, 0.2),
      new THREE.Vector3(center + width * 0.56, 2.01, 0.2),
      new THREE.Vector3(center, 2.08, 0.2),
      new THREE.Vector3(center - width * 0.56, 2.01, 0.2),
      new THREE.Vector3(center - 0.04, 2.17, 0.2),
      new THREE.Vector3(center, 2.23, 0.2),
    ]);
    const hanger = new THREE.Mesh(new THREE.TubeGeometry(hangerCurve, 18, 0.008, 6, false), rail);
    group.add(hanger);
  });

  // Folded textiles on the lower shelf, visible through the open front.
  [0, 1, 2].forEach((stack) => {
    for (let layer = 0; layer < 3; layer += 1) {
      const folded = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.075, 0.3), makeFrameMaterial(garmentColors[(stack + layer + 2) % garmentColors.length], 0.8));
      folded.position.set(-0.47 + stack * 0.47, 0.65 + layer * 0.078, 0.08);
      folded.rotation.z = (layer % 2 ? 1 : -1) * 0.025;
      group.add(folded);
    }
  });
  scene.add(group);
}

function addPlanter(scene, side, z, ceramicTexture) {
  const group = new THREE.Group();
  group.name = 'FURNITURE_terracotta_cactus_pot';
  group.position.set(side * 4.14, 0, z);
  const cactusCanvas = document.createElement('canvas');
  cactusCanvas.width = 256;
  cactusCanvas.height = 512;
  const cactusContext = cactusCanvas.getContext('2d');
  cactusContext.fillStyle = '#496e50';
  cactusContext.fillRect(0, 0, cactusCanvas.width, cactusCanvas.height);
  const ribWidth = cactusCanvas.width / 12;
  for (let rib = 0; rib < 12; rib += 1) {
    const x = rib * ribWidth;
    const light = cactusContext.createLinearGradient(x, 0, x + ribWidth, 0);
    light.addColorStop(0, 'rgba(27, 53, 36, .28)');
    light.addColorStop(0.2, 'rgba(45, 76, 50, .04)');
    light.addColorStop(0.5, 'rgba(164, 180, 126, .18)');
    light.addColorStop(0.78, 'rgba(72, 104, 72, .02)');
    light.addColorStop(1, 'rgba(27, 53, 36, .25)');
    cactusContext.fillStyle = light;
    cactusContext.fillRect(x, 0, ribWidth, cactusCanvas.height);
  }
  for (let mark = 0; mark < 900; mark += 1) {
    const pale = mark % 3 === 0;
    cactusContext.fillStyle = pale ? 'rgba(207, 207, 156, .18)' : 'rgba(24, 48, 33, .14)';
    cactusContext.beginPath();
    cactusContext.ellipse(Math.random() * 256, Math.random() * 512, 0.45 + Math.random() * 1.1, 0.8 + Math.random() * 1.8, 0, 0, Math.PI * 2);
    cactusContext.fill();
  }
  const cactusTexture = new THREE.CanvasTexture(cactusCanvas);
  cactusTexture.colorSpace = THREE.SRGBColorSpace;
  cactusTexture.wrapS = THREE.RepeatWrapping;
  cactusTexture.wrapT = THREE.ClampToEdgeWrapping;
  cactusTexture.anisotropy = 4;

  const saucer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.365, 0.34, 0.055, 48),
    makeFrameMaterial(0xb96f53, 0.92, { map: ceramicTexture, bumpMap: ceramicTexture, bumpScale: 0.012 })
  );
  saucer.position.y = 0.028;
  saucer.castShadow = true;
  saucer.receiveShadow = true;
  group.add(saucer);
  const saucerLip = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.018, 8, 48), makeFrameMaterial(0xc27b5d, 0.9, { map: ceramicTexture }));
  saucerLip.rotation.x = Math.PI / 2;
  saucerLip.position.y = 0.055;
  group.add(saucerLip);

  const potProfile = [
    new THREE.Vector2(0.16, 0.015), new THREE.Vector2(0.22, 0.035), new THREE.Vector2(0.255, 0.11),
    new THREE.Vector2(0.29, 0.45), new THREE.Vector2(0.315, 0.53), new THREE.Vector2(0.325, 0.56),
    new THREE.Vector2(0.345, 0.58), new THREE.Vector2(0.342, 0.62), new THREE.Vector2(0.285, 0.62),
    new THREE.Vector2(0.276, 0.57), new THREE.Vector2(0.25, 0.14), new THREE.Vector2(0.18, 0.09),
  ];
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potProfile, 48), makeFrameMaterial(0xe1a181, 0.92, { map: ceramicTexture, bumpMap: ceramicTexture, bumpScale: 0.018 }));
  pot.castShadow = true;
  group.add(pot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.333, 0.025, 10, 48), makeFrameMaterial(0xe6ad8d, 0.88, { map: ceramicTexture, bumpMap: ceramicTexture, bumpScale: 0.01 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.595;
  group.add(rim);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.272, 0.272, 0.035, 32), makeFrameMaterial(0x44352c, 1));
  soil.position.y = 0.55;
  group.add(soil);

  const cactusMat = makeFrameMaterial(0xffffff, 0.94, { map: cactusTexture, bumpMap: cactusTexture, bumpScale: 0.016 });
  const ribMat = makeFrameMaterial(0x637f5c, 0.96);
  const spineMat = makeFrameMaterial(0xd8d4ae, 0.92);
  const cactusProfile = [
    new THREE.Vector2(0.02, 0), new THREE.Vector2(0.12, 0.035), new THREE.Vector2(0.17, 0.12),
    new THREE.Vector2(0.185, 0.35), new THREE.Vector2(0.18, 0.78), new THREE.Vector2(0.155, 1.08),
    new THREE.Vector2(0.09, 1.25), new THREE.Vector2(0.015, 1.31),
  ];
  const trunk = new THREE.Mesh(new THREE.LatheGeometry(cactusProfile, 64), cactusMat);
  trunk.position.y = 0.57;
  group.add(trunk);

  for (let rib = 0; rib < 10; rib += 1) {
    const angle = (rib / 10) * Math.PI * 2;
    const points = [];
    for (let row = 0; row <= 10; row += 1) {
      const t = row / 10;
      const y = 0.68 + t * 1.08;
      const radius = 0.18 - Math.max(0, t - 0.68) * 0.21 + Math.sin(t * Math.PI) * 0.006;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
    }
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, 0.008, 6, false), ribMat));
  }

  const spineGeo = new THREE.ConeGeometry(0.004, 0.032, 4);
  const spines = new THREE.InstancedMesh(spineGeo, spineMat, 180);
  const dummy = new THREE.Object3D();
  let spineIndex = 0;
  for (let row = 0; row < 10; row += 1) {
    const t = (row + 0.45) / 10;
    const y = 0.68 + t * 1.08;
    const radius = 0.17 - Math.max(0, t - 0.68) * 0.21;
    for (let column = 0; column < 18; column += 1) {
      const angle = (column / 18) * Math.PI * 2 + (row % 2) * 0.16;
      const outward = new THREE.Vector3(Math.cos(angle), 0.12, Math.sin(angle)).normalize();
      dummy.position.set(outward.x * radius, y, outward.z * radius);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward);
      dummy.scale.setScalar(0.7 + (column % 3) * 0.12);
      dummy.updateMatrix();
      spines.setMatrixAt(spineIndex++, dummy.matrix);
    }
  }
  spines.instanceMatrix.needsUpdate = true;
  group.add(spines);

  [[-1, 0], [1, 0]].forEach(([direction, zOffset]) => {
    const branchPoints = [
      new THREE.Vector3(direction * 0.105, 0.91, zOffset),
      new THREE.Vector3(direction * 0.22, 0.92, zOffset),
      new THREE.Vector3(direction * 0.29, 1.01, zOffset),
      new THREE.Vector3(direction * 0.30, 1.18, zOffset),
      new THREE.Vector3(direction * 0.30, 1.37, zOffset),
    ];
    const branchCurve = new THREE.CatmullRomCurve3(branchPoints);
    const branch = new THREE.Mesh(new THREE.TubeGeometry(branchCurve, 28, 0.073, 16, false), cactusMat);
    branch.castShadow = true;
    branch.receiveShadow = true;
    group.add(branch);
    const roundedTip = new THREE.Mesh(new THREE.SphereGeometry(0.073, 16, 12), cactusMat);
    roundedTip.position.copy(branchPoints[branchPoints.length - 1]);
    roundedTip.castShadow = true;
    group.add(roundedTip);
  });
  scene.add(group);
}

function addShoppingDisplay(scene, side, z) {
  const x = side * 3.45;
  const stone = makeFrameMaterial(0xe8dace, 0.72);
  const brass = makeFrameMaterial(0xb99a73, 0.34, { metalness: 0.5 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.72, 0.72), stone);
  table.position.set(x, 0.38, z);
  table.castShadow = true;
  table.receiveShadow = true;
  scene.add(table);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 0.8), brass);
  top.position.set(x, 0.77, z);
  scene.add(top);

  [0, 1, 2].forEach((index) => {
    const color = [0xb96f7f, 0x8d9e90, 0xd2a86b][index];
    const bag = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.18), makeFrameMaterial(color, 0.48));
    body.position.y = 0.19;
    body.castShadow = true;
    bag.add(body);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 20, Math.PI), brass);
    handle.position.set(0, 0.4, 0.02);
    bag.add(handle);
    bag.position.set(x + (index - 1) * 0.34, 0.82, z);
    bag.rotation.y = (index - 1) * 0.14;
    scene.add(bag);
  });
}

function addPendant(scene, z, index) {
  const brass = new THREE.MeshBasicMaterial({ color: 0xc39762, toneMapped: false });
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.34, 10), brass);
  cable.position.set(0, 4.77, z);
  scene.add(cable);
  const shadeGeo = new THREE.LatheGeometry([
    new THREE.Vector2(0.035, 0), new THREE.Vector2(0.08, 0.03), new THREE.Vector2(0.22, 0.16),
    new THREE.Vector2(0.28, 0.28), new THREE.Vector2(0.27, 0.31), new THREE.Vector2(0.08, 0.31),
  ], 32);
  // Opaque, unlit enamel: transmission on this open shade was rendering black from below.
  const shadeMaterial = new THREE.MeshBasicMaterial({ color: index % 2 ? 0xf5d9cd : 0xf1e2cc, side: THREE.DoubleSide, toneMapped: false });
  const shade = new THREE.Mesh(shadeGeo, shadeMaterial);
  shade.position.set(0, 3.6, z);
  shade.castShadow = true;
  scene.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffdca0 }));
  bulb.position.set(0, 3.65, z);
  scene.add(bulb);
  const glow = new THREE.PointLight(0xffd9ab, 10, 7, 1.6);
  glow.position.set(0, 3.55, z);
  scene.add(glow);
}

function addChandelier(scene, z) {
  // Metallic PBR without an environment map can go nearly black at grazing angles.
  // Unlit warm gold keeps every chandelier element visibly gold from every camera angle.
  const brass = new THREE.MeshBasicMaterial({ color: 0xc79a58, toneMapped: false });
  const glass = new THREE.MeshBasicMaterial({ color: 0xffe2b5, toneMapped: false });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 1.35, 12), brass);
  stem.position.set(0, 4.72, z);
  scene.add(stem);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.025, 10, 64), brass);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 4.07, z);
  scene.add(ring);
  for (let i = 0; i < 6; i += 1) {
    const a = i * Math.PI / 3;
    const end = new THREE.Vector3(Math.cos(a) * 0.78, 3.84, z + Math.sin(a) * 0.78);
    const start = new THREE.Vector3(0, 4.25, z);
    const axis = end.clone().sub(start);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, axis.length(), 10), brass);
    arm.position.copy(start).add(end).multiplyScalar(0.5);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
    scene.add(arm);
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 12), glass);
    cup.scale.set(1, 0.7, 1);
    cup.position.copy(end);
    scene.add(cup);
  }
}

function addGarland(scene, z) {
  const points = [
    new THREE.Vector3(-4.55, 4.65, z), new THREE.Vector3(-3.2, 4.25, z),
    new THREE.Vector3(-1.6, 3.98, z), new THREE.Vector3(0, 3.91, z),
    new THREE.Vector3(1.6, 3.98, z), new THREE.Vector3(3.2, 4.25, z),
    new THREE.Vector3(4.55, 4.65, z),
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const vine = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.022, 7, false), makeFrameMaterial(0x617356, 0.8));
  scene.add(vine);

  const bloomGeo = new THREE.SphereGeometry(0.05, 10, 8);
  const bloomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
  const blooms = new THREE.InstancedMesh(bloomGeo, bloomMat, 48);
  const leafGeo = new THREE.SphereGeometry(0.045, 9, 7);
  const leafMat = makeFrameMaterial(0x718365, 0.84);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, 64);
  const dummy = new THREE.Object3D();
  const colors = [0xe7c0bd, 0xf2e4d3, 0xd8a7a4, 0xe8d2b9];
  for (let i = 0; i < 16; i += 1) {
    const t = (i + 0.3) / 16;
    const center = curve.getPoint(t);
    for (let petal = 0; petal < 3; petal += 1) {
      const angle = petal * Math.PI * 2 / 3;
      dummy.position.set(center.x + Math.cos(angle) * 0.065, center.y + Math.sin(angle) * 0.065, center.z + (petal - 1) * 0.025);
      dummy.scale.set(1, 0.9, 0.8);
      dummy.rotation.set(Math.sin(angle) * 0.4, Math.cos(angle) * 0.4, angle);
      dummy.updateMatrix();
      const idx = i * 3 + petal;
      blooms.setMatrixAt(idx, dummy.matrix);
      blooms.setColorAt(idx, new THREE.Color(colors[(i + petal) % colors.length]));
    }
    const leaf = curve.getPoint(Math.min(0.98, t + 0.018));
    for (let side = 0; side < 2; side += 1) {
      const n = i * 2 + side;
      dummy.position.set(leaf.x + (side ? 0.08 : -0.08), leaf.y + (side ? 0.035 : -0.035), leaf.z);
      dummy.scale.set(0.72, 1.5, 0.65);
      dummy.rotation.set(0.35, side ? 0.6 : -0.6, side ? 0.8 : -0.8);
      dummy.updateMatrix();
      leaves.setMatrixAt(n, dummy.matrix);
    }
  }
  blooms.instanceMatrix.needsUpdate = true;
  leaves.instanceMatrix.needsUpdate = true;
  scene.add(blooms, leaves);
}

function addExitDoor(scene, woodTexture) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(10.2, 6.15, 0.36), makeFrameMaterial(0xd8cbbf, 0.88));
  wall.position.set(0, 2.9, -38.9);
  scene.add(wall);

  const gold = new THREE.MeshBasicMaterial({ color: 0xc99b62, toneMapped: false });
  const cream = new THREE.MeshBasicMaterial({ color: 0xf1e3d2, toneMapped: false });
  const portal = new THREE.Group();
  portal.position.z = -38.55;
  [[-1.58, 2.08, 0.16, 4.35], [1.58, 2.08, 0.16, 4.35], [0, 4.25, 3.3, 0.18], [0, -0.06, 3.3, 0.18]].forEach(([x, y, w, h]) => {
    const surround = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.22), gold);
    surround.position.set(x, y, 0);
    portal.add(surround);
  });
  [[-1.48, 2.08, 0.035, 3.95], [1.48, 2.08, 0.035, 3.95], [0, 4.04, 2.95, 0.035]].forEach(([x, y, w, h]) => {
    const inlay = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), cream);
    inlay.position.set(x, y, 0.13);
    portal.add(inlay);
  });
  scene.add(portal);

  const makeLeaf = (side) => {
    const hinge = new THREE.Group();
    hinge.position.set(side < 0 ? -1.48 : 1.48, 0.08, -38.36);
    const leafWidth = 1.46;
    const centerX = side < 0 ? leafWidth / 2 : -leafWidth / 2;
    const doorMaterial = makeFrameMaterial(0x8a5949, 0.76, { map: woodTexture });
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafWidth, 3.88, 0.16), doorMaterial);
    leaf.position.set(centerX, 1.94, 0);
    leaf.userData.isExitDoor = true;
    hinge.add(leaf);

    const panelMat = new THREE.MeshBasicMaterial({ color: 0xb98562, toneMapped: false });
    [[1.15, 1.1, 0.04, 1.2], [1.15, 2.85, 0.04, 1.45]].forEach(([localX, y, w, h]) => {
      const x = side < 0 ? localX - leafWidth / 2 : leafWidth / 2 - localX;
      const molding = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.035), panelMat);
      molding.position.set(centerX + x, y, 0.1);
      hinge.add(molding);
    });
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), gold);
    knob.position.set(centerX + (side < 0 ? leafWidth * 0.82 : -leafWidth * 0.82), 1.92, 0.15);
    hinge.add(knob);
    scene.add(hinge);
    return { hinge, leaf };
  };

  const left = makeLeaf(-1);
  const right = makeLeaf(1);
  const meetingStile = new THREE.Mesh(
    new RoundedBoxGeometry(0.075, 3.82, 0.12, 4, 0.025),
    makeFrameMaterial(0x8a5949, 0.76, { map: woodTexture }),
  );
  meetingStile.position.set(1.475, 1.96, 0.12);
  meetingStile.userData.isExitDoor = true;
  left.hinge.add(meetingStile);
  return { left, right, interactiveLeaves: [left.leaf, right.leaf, meetingStile] };
}

function addGallery(scene, photoMeshes) {
  const surfaceTextures = createSurfaceTextures();
  scene.background = new THREE.Color(0xe8ded3);
  scene.fog = new THREE.FogExp2(0xe8ded3, 0.006);
  scene.add(new THREE.HemisphereLight(0xfff7ed, 0x76665a, 1.65));

  const key = new THREE.DirectionalLight(0xffe0c3, 2.2);
  key.position.set(-4, 8, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -30;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdce8ef, 0.85);
  fill.position.set(4, 5, -10);
  scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 62), makeFrameMaterial(0xb8a999, 0.8, { map: surfaceTextures.stone }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.08, -7);
  floor.receiveShadow = true;
  scene.add(floor);

  const runner = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 60), makeFrameMaterial(0xcfc1b3, 0.94, { map: surfaceTextures.textile }));
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, -0.055, -7);
  scene.add(runner);

  const wallMat = makeFrameMaterial(0xd8cbbf, 0.86);
  [-5.05, 5.05].forEach((x) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 6.2, 52), wallMat);
    wall.position.set(x, 2.85, -7);
    wall.receiveShadow = true;
    scene.add(wall);

    // Close the short gap between the gallery side wall and the exit wall.
    // Without this return, the bright scene background shows through beside the door.
    const returnWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 6.2, 6.05), wallMat);
    returnWall.position.set(x, 2.85, -35.9);
    returnWall.receiveShadow = true;
    scene.add(returnWall);

    const dado = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.48, 52), makeFrameMaterial(0xbda996, 0.7));
    dado.position.set(x + (x < 0 ? 0.17 : -0.17), 0.35, -7);
    scene.add(dado);
  });

  const scenicPrints = [
    'photo-1470252649378-9c29740c9fa8', 'photo-1500530855697-b586d89ba3ee',
    'photo-1470770841072-f978cf4d019e', 'photo-1472214103451-9374bd1c798e',
    'photo-1511497584788-876760111969', 'photo-1441974231531-c6227db76b6e',
  ];
  const printLoader = new THREE.TextureLoader();
  printLoader.setCrossOrigin('anonymous');
  const printTextures = scenicPrints.map((id) => printLoader.load(
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=1200&q=82`,
    (texture) => { texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; },
  ));
  // Actual landscape photographs in gold gallery frames replace the window openings.
  [-1, 1].forEach((side) => [-6.5, -20.5, -27.5].forEach((z, index) => {
    const frameGroup = new THREE.Group();
    frameGroup.position.set(side * 4.89, 2.78, z);
    frameGroup.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 2.0), new THREE.MeshBasicMaterial({ map: printTextures[index + (side > 0 ? 3 : 0)], color: 0xffffff, toneMapped: false }));
    frameGroup.add(pane);
    const frame = new THREE.MeshBasicMaterial({ color: 0xc39a6c, toneMapped: false });
    [[0, 1.04, 2.0, 0.1], [0, -1.04, 2.0, 0.1], [-0.99, 0, 0.1, 2.16], [0.99, 0, 0.1, 2.16]].forEach(([x, y, w, h]) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), frame);
      rail.position.set(x, y, 0.06);
      frameGroup.add(rail);
    });
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xf0d6b0, toneMapped: false });
    [[0, 0.94, 1.82, 0.025], [0, -0.94, 1.82, 0.025], [-0.9, 0, 0.025, 1.9], [0.9, 0, 0.025, 1.9]].forEach(([x, y, w, h]) => {
      const inlay = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.035), innerMat);
      inlay.position.set(x, y, 0.12);
      frameGroup.add(inlay);
    });
    scene.add(frameGroup);
  }));

  // Keep the end-of-gallery supports in warm sandstone so they blend into the
  // plaster around the exit instead of reading as bright white wall strips.
  const stone = makeFrameMaterial(0xcbb49b, 0.86);
  [-1.5, -8.5, -15.5, -22.5, -29.5].forEach((z) => {
    [-4.55, 4.55].forEach((x) => {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.22, 5.15, 0.3), stone);
      pier.position.set(x, 2.48, z);
      scene.add(pier);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(9.1, 0.22, 0.3), stone);
    beam.position.set(0, 5.05, z);
    scene.add(beam);
  });

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(10.15, 0.18, 52), makeFrameMaterial(0xeee4da, 0.78));
  ceiling.position.set(0, 5.43, -7);
  ceiling.receiveShadow = true;
  scene.add(ceiling);
  [-4.65, 4.65].forEach((x) => {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 52), makeFrameMaterial(0xb79a79, 0.32, { metalness: 0.45 }));
    trim.position.set(x, 5.29, -7);
    scene.add(trim);
  });

  const tapeMat = makeFrameMaterial(0xd7c4a5, 0.86);
  const paperMat = makeFrameMaterial(0xf0e8dc, 0.64);
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  const cameraPoints = [{ pos: [0, 1.62, 16.5], look: [0, 1.8, 12.5] }];

  looks.forEach((look, index) => {
    const side = look.side;
    const panelX = side * 4.86;
    const group = new THREE.Group();
    group.name = 'PHOTO_' + (index + 1) + '_' + look.category;
    group.position.set(panelX, 1.93, look.z);
    group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;

    const backing = new THREE.Mesh(new THREE.BoxGeometry(2.38, 3.05, 0.11), makeFrameMaterial(0x958273, 0.83));
    backing.position.z = -0.09;
    backing.castShadow = true;
    group.add(backing);
    const paper = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.98, 0.055), paperMat);
    paper.castShadow = true;
    group.add(paper);

    const photoMat = new THREE.MeshBasicMaterial({ color: 0xc5b7a8, side: THREE.DoubleSide, toneMapped: false });
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 2.58), photoMat);
    photo.position.set(0, 0.04, 0.033);
    photo.userData.lookIndex = index;
    photo.userData.look = look;
    group.add(photo);
    photoMeshes.push(photo);

    const titleCanvas = document.createElement('canvas');
    titleCanvas.width = 800;
    titleCanvas.height = 160;
    const ctx = titleCanvas.getContext('2d');
    ctx.fillStyle = '#f0e8dc';
    ctx.fillRect(0, 0, 800, 160);
    ctx.fillStyle = '#59483d';
    ctx.textAlign = 'center';
    ctx.font = '36px Georgia, serif';
    ctx.fillText(look.title, 400, 68);
    ctx.font = '18px Arial, sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillStyle = '#987c66';
    ctx.fillText(look.category, 400, 118);
    const captionTexture = new THREE.CanvasTexture(titleCanvas);
    captionTexture.colorSpace = THREE.SRGBColorSpace;
    const caption = new THREE.Mesh(new THREE.PlaneGeometry(2.14, 0.42), new THREE.MeshBasicMaterial({ map: captionTexture, side: THREE.DoubleSide, toneMapped: false }));
    caption.position.set(0, -1.29, 0.04);
    group.add(caption);

    [-0.84, 0.84].forEach((x, tabIndex) => {
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.075, 0.018), tapeMat);
      tab.position.set(x, 1.43, 0.082);
      tab.rotation.z = tabIndex === 0 ? -0.09 : 0.09;
      group.add(tab);
    });

    loader.load(look.image, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      photoMat.map = texture;
      photoMat.color.set(0xffffff);
      photoMat.needsUpdate = true;
    }, undefined, () => photoMat.color.set(0xd4c4b5));
    scene.add(group);

    const lamp = new THREE.SpotLight(0xffe3c7, 42, 8, Math.PI / 3.1, 0.82, 1.1);
    lamp.position.set(side * 3.7, 4.3, look.z + 0.8);
    lamp.target.position.set(panelX, 1.9, look.z);
    scene.add(lamp, lamp.target);

    cameraPoints.push({
      pos: [side * 1.05, 1.62, look.z + 2.7],
      look: [side * 4.43, 2.0, look.z],
    });
  });

  // Lounge moments, open wardrobes, and planted corners make the gallery feel inhabited by shoppers.
  addSofa(scene, -1, 7.0, 0xd4b9ae, surfaceTextures.textile);
  addSofa(scene, 1, 0.0, 0xb9c7c4, surfaceTextures.textile);
  addSofa(scene, -1, -7.0, 0xc7b8a6, surfaceTextures.textile);
  addWardrobe(scene, 1, -3.0, surfaceTextures.wood);
  addWardrobe(scene, -1, -14.0, surfaceTextures.wood);
  addPlanter(scene, 1, 7.0, surfaceTextures.ceramic);
  addPlanter(scene, -1, 0.0, surfaceTextures.ceramic);
  addPlanter(scene, 1, -10.5, surfaceTextures.ceramic);
  addPlanter(scene, -1, -24.5, surfaceTextures.ceramic);
  addShoppingDisplay(scene, 1, 4.8);
  addShoppingDisplay(scene, -1, -18.7);

  [-2.5, -9.5, -16.5, -23.5].forEach((z, index) => addPendant(scene, z, index));
  [-6, -20].forEach((z) => addChandelier(scene, z));
  [-1.5, -15.5, -29.5].forEach((z) => addGarland(scene, z));

  const exitDoor = addExitDoor(scene, surfaceTextures.wood);
  cameraPoints.push({ pos: [0, 1.62, -32.6], look: [0, 1.85, -38.36] });
  const positionCurve = new THREE.CatmullRomCurve3(cameraPoints.map((point) => new THREE.Vector3(...point.pos)), false, 'centripetal', 0.32);
  const lookCurve = new THREE.CatmullRomCurve3(cameraPoints.map((point) => new THREE.Vector3(...point.look)), false, 'centripetal', 0.32);
  return { positionCurve, lookCurve, exitDoor };
}

export default function ShoppingMall3D({ onEnter }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    progress: 0, scrollTarget: null, clickTarget: null, dragging: false, playing: false,
    dragStartY: 0, dragStartProgress: 0, pointer: new THREE.Vector2(), doorOpening: false, doorOpenProgress: 0,
    raycaster: new THREE.Raycaster(), hoveredIndex: -1, suppressClickUntil: 0,
  });
  const onEnterRef = useRef(onEnter);
  const enterTimerRef = useRef(null);
  onEnterRef.current = onEnter;
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [doorBurst, setDoorBurst] = useState(false);
  stateRef.current.playing = playing;

  const openExitDoor = () => {
    const state = stateRef.current;
    if (state.doorOpening) return;
    state.doorOpening = true;
    state.clickTarget = null;
    state.scrollTarget = null;
    setPlaying(false);
    setDoorBurst(true);
    enterTimerRef.current = window.setTimeout(() => {
      setDoorBurst(false);
      onEnterRef.current?.();
    }, 1500);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.62, 16.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const photoMeshes = [];
    const { positionCurve, lookCurve, exitDoor } = addGallery(scene, photoMeshes);
    const petals = createPetalField(scene, camera);
    const state = stateRef.current;
    const clock = new THREE.Clock();
    let animationId;
    let lastPublished = -1;
    let lastLook = -1;

    const readPointer = (event) => {
      const rect = container.getBoundingClientRect();
      state.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      state.raycaster.setFromCamera(state.pointer, camera);
      const hit = state.raycaster.intersectObjects([...photoMeshes, ...exitDoor.interactiveLeaves], false)[0];
      state.hoveredIndex = hit?.object.userData.lookIndex ?? -1;
      state.hoveringDoor = Boolean(hit?.object.userData.isExitDoor);
      container.style.cursor = hit ? 'pointer' : state.dragging ? 'grabbing' : 'grab';
      return hit;
    };
    const onPointerDown = (event) => {
      state.dragging = true;
      state.dragStartY = event.clientY;
      state.dragStartProgress = state.progress;
      state.scrollTarget = null;
      state.clickTarget = null;
      container.setPointerCapture?.(event.pointerId);
      container.style.cursor = 'grabbing';
    };
    const onPointerMove = (event) => {
      readPointer(event);
      if (state.dragging) {
        const delta = state.dragStartY - event.clientY;
        if (Math.abs(delta) > 5) state.suppressClickUntil = Date.now() + 220;
        state.progress = THREE.MathUtils.clamp(state.dragStartProgress + delta * 0.00125, 0, 1);
        setPlaying(false);
      }
    };
    const onPointerUp = () => {
      state.dragging = false;
      container.style.cursor = state.hoveredIndex >= 0 ? 'pointer' : 'grab';
    };
    const onClick = (event) => {
      if (Date.now() < state.suppressClickUntil) return;
      const hit = readPointer(event);
      if (hit?.object.userData.isExitDoor) {
        openExitDoor();
        return;
      }
      if (!hit) return;
      state.clickTarget = progressForLook(hit.object.userData.lookIndex);
      state.scrollTarget = null;
      setPlaying(false);
    };
    const onWheel = (event) => {
      event.preventDefault();
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? container.clientHeight : 1;
      const base = state.scrollTarget ?? state.clickTarget ?? state.progress;
      const step = THREE.MathUtils.clamp(-event.deltaY * scale * 0.00022, -0.035, 0.035);
      state.scrollTarget = THREE.MathUtils.clamp(base + step, 0, 1);
      state.clickTarget = null;
      setPlaying(false);
    };
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('click', onClick);
    container.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    const resize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', resize);

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (state.dragging) {
        // Drag directly scrubs the same continuous route.
      } else if (state.clickTarget !== null) {
        state.progress = motionPreference.matches ? state.clickTarget : THREE.MathUtils.damp(state.progress, state.clickTarget, 4.4, dt);
        if (Math.abs(state.clickTarget - state.progress) < 0.0015) state.clickTarget = null;
      } else if (state.scrollTarget !== null) {
        state.progress = motionPreference.matches ? state.scrollTarget : THREE.MathUtils.damp(state.progress, state.scrollTarget, 4.4, dt);
        if (Math.abs(state.scrollTarget - state.progress) < 0.0015) state.scrollTarget = null;
      } else if (state.playing) {
        state.progress = Math.min(1, state.progress + dt / 78);
        if (state.progress >= 1) setPlaying(false);
      }

      const t = THREE.MathUtils.clamp(state.progress, 0, 1);
      state.doorOpenProgress = THREE.MathUtils.damp(state.doorOpenProgress, state.doorOpening ? 1 : 0, 3.4, dt);
      const swing = state.doorOpenProgress * 1.18;
      exitDoor.left.hinge.rotation.y = -swing;
      exitDoor.right.hinge.rotation.y = swing;
      const cameraPoint = positionCurve.getPoint(t);
      const lookPoint = lookCurve.getPoint(t);
      if (t > 0.82) {
        const doorAim = THREE.MathUtils.smoothstep(t, 0.84, 0.96);
        cameraPoint.lerp(new THREE.Vector3(0, 1.62, -32.6), doorAim);
        lookPoint.lerp(new THREE.Vector3(0, 1.9, -38.36), doorAim);
      }
      const parallax = motionPreference.matches ? new THREE.Vector3() : new THREE.Vector3(state.pointer.x * 0.07, -state.pointer.y * 0.045, 0);
      if (motionPreference.matches) camera.position.copy(cameraPoint);
      else camera.position.lerp(cameraPoint.clone().add(parallax), 1 - Math.exp(-dt * 4.2));
      camera.lookAt(lookPoint.clone().add(parallax));
      if (!motionPreference.matches) updatePetals(petals, camera, dt, clock.elapsedTime);
      photoMeshes.forEach((photo, index) => {
        const desired = state.hoveredIndex === index ? 1.025 : 1;
        photo.scale.lerp(new THREE.Vector3(desired, desired, 1), 1 - Math.exp(-dt * 4));
      });

      if (Math.abs(state.progress - lastPublished) > 0.003) {
        lastPublished = state.progress;
        setProgress(state.progress);
      }
      const nearest = Math.min(looks.length - 1, Math.max(0, Math.round(state.progress * (looks.length + 1)) - 1));
      const selection = state.hoveredIndex >= 0 ? state.hoveredIndex : nearest;
      if (selection !== lastLook) {
        lastLook = selection;
        setActiveIndex(selection);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('click', onClick);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', resize);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((entry) => {
          if (entry.map) entry.map.dispose();
          entry.dispose();
        });
      });
    };
  }, []);

  const focusLook = (index) => {
    const bounded = THREE.MathUtils.clamp(index, 0, looks.length - 1);
    stateRef.current.clickTarget = progressForLook(bounded);
    stateRef.current.scrollTarget = null;
    setPlaying(false);
  };
  const toggleJourney = () => {
    if (progress >= 0.995) stateRef.current.progress = 0;
    stateRef.current.scrollTarget = null;
    stateRef.current.clickTarget = null;
    setPlaying((value) => !value);
  };
  const replay = () => {
    stateRef.current.progress = 0;
    stateRef.current.scrollTarget = null;
    stateRef.current.clickTarget = null;
    setProgress(0);
    setPlaying(false);
    focusLook(0);
  };
  const look = looks[activeIndex] || looks[0];
  const counter = String(Math.min(looks.length, Math.max(1, activeIndex + 1))).padStart(2, '0');

  return (
    <section className="atelier-experience relative h-[calc(100svh-72px)] min-h-[580px] w-full overflow-hidden select-none bg-[#e8ded3] text-[#3d312b]">
      <div ref={mountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing touch-none" aria-label="Interactive 3D fashion photo gallery" />
      <div className="atelier-grain absolute inset-0 z-[1] pointer-events-none" />
      <div className="atelier-shade absolute inset-0 z-[1] pointer-events-none" />
      <div className="pointer-events-none absolute left-7 top-7 z-10 sm:left-12 sm:top-9">
        <p className="text-[8px] tracking-[0.34em] text-[#8d7766]">THREADLABS · THE COLLECTION</p>
        <h1 className="mt-2 font-serif text-2xl tracking-[0.02em] text-[#43352d] sm:text-3xl">Made to be discovered.</h1>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeIndex} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.35 }} className="pointer-events-none absolute right-7 top-8 z-10 max-w-[240px] text-right sm:right-12 sm:top-10">
          <p className="text-[8px] tracking-[0.25em] text-[#987b63]">{look.category}</p>
          <p className="mt-1 font-serif text-base text-[#43352d] sm:text-lg">{look.title}</p>
          <p className="mt-1 text-[9px] text-[#786558]">{look.artisan} · {look.price}</p>
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {progress > 0.91 && !doorBurst && (
          <>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={openExitDoor}
              aria-label="Open the gold exit door"
              className="absolute left-1/2 top-[47%] z-[5] h-[58%] w-[min(70vw,680px)] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#c49c70]/80"
            />
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#c49c70]/40 bg-[#f7eee4]/85 px-5 py-2 text-[9px] tracking-[0.2em] text-[#634d3c] shadow-lg backdrop-blur-sm">
              CLICK THE GOLD DOOR TO ENTER
            </motion.p>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {doorBurst && (
          <motion.div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} aria-hidden="true">
            {Array.from({ length: 132 }, (_, index) => {
              const angle = index * 2.399;
              const reach = 160 + (index % 7) * 36;
              const colors = ['#ff9fc4', '#ffb7d0', '#f984b5', '#ffd1df', '#ffe0ea'];
              return (
                <motion.span
                  key={index}
                  className="absolute rounded-[90%_0_90%_0] shadow-sm"
                  style={{ left: '50%', top: '57%', width: 7 + (index % 5) * 2, height: 12 + (index % 6) * 2, backgroundColor: colors[index % colors.length] }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.15, rotate: 0 }}
                  animate={{ x: Math.cos(angle) * reach * 3, y: Math.sin(angle) * reach * 2 - 180, opacity: [0, 1, 0.9, 0], scale: [0.15, 1.2 + (index % 3) * 0.25, 0.8], rotate: 280 + index * 31 }}
                  transition={{ delay: index * 0.012, duration: 1.32, ease: [0.18, 0.72, 0.25, 1] }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-7 left-7 z-10 flex items-center gap-3 sm:bottom-9 sm:left-12">
        <button onClick={toggleJourney} className="rounded-full border border-[#776455]/30 bg-[#f4ece3]/60 p-2.5 text-[#514239] backdrop-blur-sm transition hover:bg-[#fffaf4]" aria-label={playing ? 'Pause journey' : 'Play journey'}>
          {playing ? <Pause size={14} strokeWidth={1.6} /> : <Play size={14} strokeWidth={1.6} />}
        </button>
        <span className="text-[8px] tracking-[0.16em] text-[#6f5d50]">SCROLL OR DRAG TO EXPLORE</span>
      </div>
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {looks.map((item, index) => (
          <button key={item.title} onClick={() => focusLook(index)} aria-label={'Go to ' + item.title} className={'h-1 rounded-full transition-all duration-500 ' + (index === activeIndex ? 'w-8 bg-[#87664e]' : 'w-3 bg-[#8a7767]/35 hover:bg-[#8a7767]/70')} />
        ))}
      </div>
      <div className="absolute bottom-7 right-7 z-10 flex items-center gap-3 sm:bottom-9 sm:right-12">
        <span className="font-serif text-sm text-[#685448]">{counter}<span className="px-1 text-[#a99788]">/</span>{String(looks.length).padStart(2, '0')}</span>
        {progress > 0.98 && <button onClick={replay} className="inline-flex items-center gap-1 text-[8px] tracking-[0.16em] text-[#685448]"><RotateCcw size={11} /> REPLAY</button>}
      </div>
    </section>
  );
}
