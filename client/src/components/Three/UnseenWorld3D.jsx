import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function UnseenWorld3D({ activeSection = 'studio' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf5e6e0, 0.045);

    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting (Warm Sun & Ambient Dreamy Blush)
    const ambientLight = new THREE.AmbientLight(0xffecd1, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.5);
    sunLight.position.set(8, 12, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    const softFill = new THREE.PointLight(0xf472b6, 1.4, 30);
    softFill.position.set(-6, 4, 3);
    scene.add(softFill);

    const aquaReflect = new THREE.PointLight(0x38bdf8, 1.2, 25);
    aquaReflect.position.set(0, -1, 4);
    scene.add(aquaReflect);

    // 3. Materials (Plaster, Sandstone, Water, Iridescent Pearl)
    const plasterMat = new THREE.MeshStandardMaterial({
      color: 0xf2ded6,
      roughness: 0.85,
      metalness: 0.05,
    });

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0xedd6cb,
      roughness: 0.7,
      metalness: 0.1,
    });

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.6,
      opacity: 0.85,
      transparent: true,
      roughness: 0.1,
      ior: 1.333,
      metalness: 0.1,
      reflectivity: 0.9,
    });

    const pearlMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      iridescence: 0.9,
      iridescenceIOR: 1.6,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2,
    });

    // 4. Architectural Environment Construction
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // A. Water Basin (Floor)
    const waterGeo = new THREE.PlaneGeometry(35, 35, 40, 40);
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -1.2;
    worldGroup.add(waterMesh);

    // B. Stepped Temple Plinth (Center Altar)
    const stepCount = 5;
    for (let s = 0; s < stepCount; s++) {
      const stepWidth = 3.6 - s * 0.45;
      const stepDepth = 3.2 - s * 0.4;
      const stepHeight = 0.18;
      const stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      const stepMesh = new THREE.Mesh(stepGeo, stepMat);
      stepMesh.position.set(0, -1.1 + s * stepHeight, -0.5 - s * 0.1);
      stepMesh.receiveShadow = true;
      stepMesh.castShadow = true;
      worldGroup.add(stepMesh);
    }

    // C. Back Colonnade & Archway
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, -2.5);

    // Left Arch Wall
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 0.4), plasterMat);
    wallLeft.position.set(-2.8, 1.5, 0);
    archGroup.add(wallLeft);

    // Right Arch Wall
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 0.4), plasterMat);
    wallRight.position.set(2.8, 1.5, 0);
    archGroup.add(wallRight);

    // Top Arch Lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.4, 0.4), plasterMat);
    lintel.position.set(0, 4.2, 0);
    archGroup.add(lintel);

    // Classic Cylindrical Columns
    const colGeo = new THREE.CylinderGeometry(0.24, 0.28, 5, 32);
    const col1 = new THREE.Mesh(colGeo, plasterMat);
    col1.position.set(-1.6, 1.2, 0.3);
    archGroup.add(col1);

    const col2 = new THREE.Mesh(colGeo, plasterMat);
    col2.position.set(1.6, 1.2, 0.3);
    archGroup.add(col2);

    worldGroup.add(archGroup);

    // D. Floating Iridescent Silk Orb (Dreamy center element)
    const orbGeo = new THREE.SphereGeometry(0.65, 48, 48);
    const orbMesh = new THREE.Mesh(orbGeo, pearlMat);
    orbMesh.position.set(1.8, 0.6, 0.2);
    orbMesh.castShadow = true;
    worldGroup.add(orbMesh);

    // Orbiting Golden Thread Ring
    const goldRingGeo = new THREE.TorusGeometry(0.95, 0.02, 16, 64);
    const goldRing = new THREE.Mesh(goldRingGeo, goldMat);
    goldRing.position.copy(orbMesh.position);
    worldGroup.add(goldRing);

    // E. Natural River Stones in Water
    const stoneGeo1 = new THREE.DodecahedronGeometry(0.7, 2);
    const stoneMesh1 = new THREE.Mesh(stoneGeo1, stepMat);
    stoneMesh1.scale.set(1.4, 0.8, 1.2);
    stoneMesh1.position.set(2.5, -1.0, 2);
    stoneMesh1.rotation.set(0.3, 0.8, -0.2);
    worldGroup.add(stoneMesh1);

    const stoneMesh2 = new THREE.Mesh(stoneGeo1, stepMat);
    stoneMesh2.scale.set(0.9, 0.6, 0.8);
    stoneMesh2.position.set(-2.8, -1.1, 1.5);
    stoneMesh2.rotation.set(0.5, -0.4, 0.2);
    worldGroup.add(stoneMesh2);

    // F. Golden Sunlight Dust Particles
    const dustCount = 80;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let d = 0; d < dustCount * 3; d += 3) {
      dustPositions[d] = (Math.random() - 0.5) * 12;
      dustPositions[d + 1] = Math.random() * 6 - 1;
      dustPositions[d + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xffedd5,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    worldGroup.add(dustPoints);

    // 5. Cinematic Camera Targets for Different Sections
    const cameraTargets = {
      studio: { x: 0, y: 1.2, z: 7.5, lookX: 0, lookY: 0.4, lookZ: 0 },
      artisans: { x: -2.2, y: 1.6, z: 6.8, lookX: 0.5, lookY: 0.6, lookZ: -1 },
      orders: { x: 2.2, y: 1.4, z: 6.5, lookX: -0.4, lookY: 0.5, lookZ: -0.5 },
      heritage: { x: 0, y: 2.2, z: 8.5, lookX: 0, lookY: 1.0, lookZ: -2 },
    };

    // Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.8;
      targetMouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 0.5;
    };
    container.addEventListener('pointermove', onPointerMove);

    // Resize
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const elapsed = (now - startTime) * 0.001;

      // Smooth camera interpolation towards active section
      const target = cameraTargets[activeSection] || cameraTargets.studio;
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      camera.position.x += (target.x + mouseX - camera.position.x) * 0.04;
      camera.position.y += (target.y + mouseY - camera.position.y) * 0.04;
      camera.position.z += (target.z - camera.position.z) * 0.04;

      camera.lookAt(target.lookX, target.lookY, target.lookZ);

      // Floating Orb animation
      orbMesh.position.y = 0.6 + Math.sin(elapsed * 1.4) * 0.12;
      goldRing.position.y = orbMesh.position.y;
      goldRing.rotation.x = elapsed * 0.5;
      goldRing.rotation.y = elapsed * 0.8;

      // Water mesh subtle wave simulation
      const wPos = waterGeo.attributes.position;
      for (let w = 0; w < wPos.count; w++) {
        const u = wPos.getX(w);
        const v = wPos.getY(w);
        wPos.setZ(w, Math.sin(u * 0.8 + elapsed * 1.5) * 0.04 + Math.cos(v * 0.8 + elapsed * 1.2) * 0.03);
      }
      wPos.needsUpdate = true;
      waterGeo.computeVertexNormals();

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointermove', onPointerMove);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeSection]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full pointer-events-auto" />

      {/* Cinematic Film Grain & Soft Vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-40 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
