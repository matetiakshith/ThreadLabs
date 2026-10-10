import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createHumanAvatar } from './avatars/AvatarManager';
import { constructTailoredGarment } from './garments/GarmentManager';
import { GARMENT_DATABASE } from './garments/garmentDatabase';

/**
 * Continuous 3D Fashion Sanctuary & Master Cinematic World
 * - Monumental architectural pavilion with stepped plinths, colonnades, and reflective surfaces
 * - Choreographed cinematic camera transitions between spatial zones:
 *   'origin' -> 'fashion_mall' -> 'create' -> 'artisans' -> 'orders'
 * - High-precision Articulated Atelier Mannequin with PBD cloth physics
 * - Subtle floating golden thread fibers and atmospheric volumetric lighting
 */
export default function FashionSanctuary3D({
  activeZone = 'fashion_mall',
  selectedGarment = null,
  isMuted = false,
}) {
  const mountRef = useRef(null);

  // Camera Targets for each spatial zone
  const zoneCameras = {
    origin: {
      pos: new THREE.Vector3(0, 0.4, 3.4),
      look: new THREE.Vector3(0, 0, 0),
      fov: 42,
    },
    fashion_mall: {
      pos: new THREE.Vector3(0, 0.6, 4.2),
      look: new THREE.Vector3(0, 0.35, 0),
      fov: 38,
    },
    create: {
      pos: new THREE.Vector3(2.4, 1.2, 5.0),
      look: new THREE.Vector3(0, 0.5, 0),
      fov: 40,
    },
    artisans: {
      pos: new THREE.Vector3(-2.8, 1.0, 4.8),
      look: new THREE.Vector3(0, 0.4, 0),
      fov: 42,
    },
    orders: {
      pos: new THREE.Vector3(0, -0.2, 3.8),
      look: new THREE.Vector3(0, 0.2, 0),
      fov: 36,
    },
  };

  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    targetCamPos: new THREE.Vector3(0, 0.6, 4.2),
    targetCamLook: new THREE.Vector3(0, 0.35, 0),
    currCamPos: new THREE.Vector3(0, 0.6, 4.2),
    currCamLook: new THREE.Vector3(0, 0.35, 0),
    targetFov: 38,
    currFov: 38,
    mouseNDC: new THREE.Vector2(0, 0),
    mouseParallax: new THREE.Vector2(0, 0),
    fibers: null,
    sculptureCloth: null,
    avatar: null,
    garmentRoot: null,
    physics: null,
    clothMesh: null,
  });

  // Sync Camera Target when activeZone changes
  useEffect(() => {
    const target = zoneCameras[activeZone] || zoneCameras.fashion_mall;
    stateRef.current.targetCamPos.copy(target.pos);
    stateRef.current.targetCamLook.copy(target.look);
    stateRef.current.targetFov = target.fov;
  }, [activeZone]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080d);
    scene.fog = new THREE.FogExp2(0x06080d, 0.08);

    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.6, 4.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Cinematic Lighting Architecture
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const keySun = new THREE.DirectionalLight(0xfff7ed, 2.4);
    keySun.position.set(4, 7, 5);
    keySun.castShadow = true;
    keySun.shadow.mapSize.set(1024, 1024);
    scene.add(keySun);

    const rimCyan = new THREE.DirectionalLight(0x38bdf8, 2.2);
    rimCyan.position.set(-5, 2, -3);
    scene.add(rimCyan);

    const warmUnderfill = new THREE.PointLight(0xd97706, 1.6, 15);
    warmUnderfill.position.set(0, -1.2, 2.5);
    scene.add(warmUnderfill);

    // 3. Architectural Materials & Plinths
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.25,
      metalness: 0.85,
    });

    const colonnadeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.2,
    });

    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.15,
    });

    // Runway Stepped Plinth
    const podiumGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 48);
    const podiumMesh = new THREE.Mesh(podiumGeo, podiumMat);
    podiumMesh.position.y = -0.98;
    podiumMesh.receiveShadow = true;
    scene.add(podiumMesh);

    const goldRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.78, 0.015, 16, 64),
      goldRingMat
    );
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = -0.98;
    scene.add(goldRing);

    // Background Colonnades & Arches
    const colGroup = new THREE.Group();
    const colCount = 6;
    for (let c = 0; c < colCount; c++) {
      const angle = (c / (colCount - 1)) * Math.PI - Math.PI / 2;
      const radius = 6.2;
      const colGeo = new THREE.CylinderGeometry(0.18, 0.24, 7, 20);
      const colMesh = new THREE.Mesh(colGeo, colonnadeMat);
      colMesh.position.set(Math.sin(angle) * radius, 1.5, Math.cos(angle) * radius - 2.5);
      colGroup.add(colMesh);
    }
    scene.add(colGroup);

    // 4. Center Articulated Atelier Mannequin + Hero Garment
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const avatar = createHumanAvatar('male');
    modelGroup.add(avatar.root);

    // Load initial benchmark garment (Gotei 13 Haori or Camp Shirt)
    const initialGarment = selectedGarment || GARMENT_DATABASE[0];
    const { root: garmentRoot, physics, clothMesh } = constructTailoredGarment(initialGarment, avatar, {
      isWireframe: false,
    });
    modelGroup.add(garmentRoot);

    // 5. Floating Golden Thread Atmospheric Filaments
    const fiberCount = 180;
    const fiberGeo = new THREE.BufferGeometry();
    const fiberPos = new Float32Array(fiberCount * 3);
    for (let i = 0; i < fiberCount * 3; i += 3) {
      fiberPos[i] = (Math.random() - 0.5) * 10;
      fiberPos[i + 1] = (Math.random() - 0.5) * 6 + 0.5;
      fiberPos[i + 2] = (Math.random() - 0.5) * 8;
    }
    fiberGeo.setAttribute('position', new THREE.BufferAttribute(fiberPos, 3));
    const fiberMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.035,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const fibers = new THREE.Points(fiberGeo, fiberMat);
    scene.add(fibers);

    // 6. Floating Silk Sculpture in the Upper Atmosphere
    const clothGeo = new THREE.PlaneGeometry(1.8, 1.8, 28, 28);
    const clothBasePos = clothGeo.attributes.position.array.slice();
    const clothMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 0.8,
      sheen: 0.9,
      sheenColor: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const sculptureCloth = new THREE.Mesh(clothGeo, clothMat);
    sculptureCloth.position.set(0, 3.2, -1.5);
    sculptureCloth.rotation.x = Math.PI / 4;
    scene.add(sculptureCloth);

    stateRef.current = {
      ...stateRef.current,
      scene,
      camera,
      renderer,
      avatar,
      garmentRoot,
      physics,
      clothMesh,
      fibers,
      sculptureCloth,
    };

    // 7. Mouse Parallax Movement
    const onMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      stateRef.current.mouseNDC.set(x, y);
      stateRef.current.mouseParallax.set(x * 0.4, y * 0.25);
    };
    window.addEventListener('mousemove', onMouseMove);

    // 8. Animation & Choreography Loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.033);
      const time = clock.getElapsedTime();

      // Smooth Camera Flight Path Interpolation
      stateRef.current.currCamPos.lerp(stateRef.current.targetCamPos, 0.05);
      stateRef.current.currCamLook.lerp(stateRef.current.targetCamLook, 0.05);
      stateRef.current.currFov += (stateRef.current.targetFov - stateRef.current.currFov) * 0.05;

      camera.fov = stateRef.current.currFov;
      camera.updateProjectionMatrix();

      camera.position.x = stateRef.current.currCamPos.x + stateRef.current.mouseParallax.x;
      camera.position.y = stateRef.current.currCamPos.y + stateRef.current.mouseParallax.y;
      camera.position.z = stateRef.current.currCamPos.z;
      camera.lookAt(stateRef.current.currCamLook);

      // Model Slow Orbit in Fashion Runway Zone
      if (activeZone === 'fashion_mall') {
        modelGroup.rotation.y = Math.sin(time * 0.25) * 0.4;
      }

      // Physics Cloth Simulation Update
      if (physics) {
        physics.step(dt);
      }

      // Upper Silk Sculpture Organic Flutter
      const pos = clothGeo.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const u = clothBasePos[i];
        const v = clothBasePos[i + 1];
        pos[i + 2] = clothBasePos[i + 2] + Math.sin(u * 3 + time * 1.6) * 0.12 + Math.cos(v * 2.5 + time * 1.2) * 0.09;
      }
      clothGeo.attributes.position.needsUpdate = true;
      clothGeo.computeVertexNormals();

      // Atmospheric Thread Rotation
      fibers.rotation.y = time * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#06080d]">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-transparent to-[#06080d]/40 pointer-events-none" />
    </div>
  );
}
