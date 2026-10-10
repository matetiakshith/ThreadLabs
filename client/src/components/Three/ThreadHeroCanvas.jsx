import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Eye, Maximize2, Rotate3d, Compass, Wand2 } from 'lucide-react';
import { playLoomSwoosh } from '../../utils/audioEffects';

export default function ThreadHeroCanvas({ themeColor = '#2563eb' }) {
  const mountRef = useRef(null);
  const [activePreset, setActivePreset] = useState('reiatsu'); // 'reiatsu' | 'silk' | 'zari'

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(
      activePreset === 'reiatsu' ? 0x06b6d4 : 0x3b82f6,
      3.5,
      25
    );
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(
      activePreset === 'reiatsu' ? 0xec4899 : 0xf97316,
      3.0,
      25
    );
    pointLight2.position.set(-5, -3, 3);
    scene.add(pointLight2);

    const goldLight = new THREE.PointLight(0xfcd34d, 3.0, 18);
    goldLight.position.set(0, 4, 2);
    scene.add(goldLight);

    // 3. Dynamic Organic 3D Floating Silk Robe / Ribbon Curves
    const group = new THREE.Group();
    scene.add(group);

    const ribbonCount = 6;
    const ribbonMeshes = [];

    for (let i = 0; i < ribbonCount; i++) {
      const points = [];
      const segmentCount = 70;
      const radius = 2.0 + i * 0.38;
      const heightSpan = 3.6;

      for (let j = 0; j <= segmentCount; j++) {
        const theta = (j / segmentCount) * Math.PI * 3.2 + (i * Math.PI) / 3;
        const y = ((j / segmentCount) - 0.5) * heightSpan;
        const x = Math.cos(theta) * radius * (1 - Math.abs(y) * 0.18);
        const z = Math.sin(theta) * (radius * 0.85) + Math.sin(theta * 2.2 + i) * 0.45;
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.08 + (i === 0 ? 0.05 : 0), 16, false);
      
      const isGold = i === 1 || i === 4;
      const isReiatsu = activePreset === 'reiatsu';

      const mat = new THREE.MeshPhysicalMaterial({
        color: isGold 
          ? new THREE.Color(0xd4af37) 
          : isReiatsu && i % 2 === 0 
          ? new THREE.Color(0x06b6d4) 
          : isReiatsu 
          ? new THREE.Color(0xf43f5e) 
          : i % 2 === 0 
          ? new THREE.Color(0x2563eb) 
          : new THREE.Color(0xf97316),
        emissive: isReiatsu 
          ? (i % 2 === 0 ? new THREE.Color(0x083344) : new THREE.Color(0x4c0519))
          : isGold 
          ? new THREE.Color(0x332200) 
          : new THREE.Color(0x051530),
        roughness: 0.2,
        metalness: isGold ? 0.85 : 0.25,
        clearcoat: 0.9,
        clearcoatRoughness: 0.15,
      });

      const mesh = new THREE.Mesh(tubeGeo, mat);
      group.add(mesh);
      ribbonMeshes.push(mesh);
    }

    // 4. Center Floating Glowing Orb Rings
    const orbGeo = new THREE.TorusGeometry(1.5, 0.035, 16, 100);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x443000,
    });
    const orbRing1 = new THREE.Mesh(orbGeo, orbMat);
    const orbRing2 = new THREE.Mesh(orbGeo, orbMat);
    orbRing2.rotation.x = Math.PI / 2.4;
    group.add(orbRing1);
    group.add(orbRing2);

    // 5. Floating Dust / Thread Particles
    const particleCount = 140;
    const particleGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0xfcd34d,
      emissive: 0xaa820a,
      roughness: 0.1,
      metalness: 0.9,
    });

    const particlesInstanced = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    const dummy = new THREE.Object3D();
    const particleSpeeds = [];

    for (let p = 0; p < particleCount; p++) {
      dummy.position.set(
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      );
      dummy.scale.setScalar(0.5 + Math.random() * 1.5);
      dummy.updateMatrix();
      particlesInstanced.setMatrixAt(p, dummy.matrix);
      particleSpeeds.push({
        y: 0.002 + Math.random() * 0.005,
        rot: 0.01 + Math.random() * 0.02,
        xOff: dummy.position.x,
        yOff: dummy.position.y,
        zOff: dummy.position.z,
      });
    }
    group.add(particlesInstanced);

    // 6. Interactive Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 1.6;
      targetY = -y * 1.6;
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
    let startTime = performance.now();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const elapsedTime = (now - startTime) * 0.001;

      // Smooth camera parallax
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      group.rotation.y = elapsedTime * 0.28 + mouseX;
      group.rotation.x = Math.sin(elapsedTime * 0.22) * 0.15 + mouseY;
      group.rotation.z = Math.cos(elapsedTime * 0.18) * 0.08;

      orbRing1.rotation.z = elapsedTime * 0.45;
      orbRing2.rotation.y = -elapsedTime * 0.35;

      // Floating dust particles
      for (let p = 0; p < particleCount; p++) {
        const s = particleSpeeds[p];
        const curY = ((s.yOff + elapsedTime * s.y * 2) % 6) - 3;
        dummy.position.set(
          s.xOff + Math.sin(elapsedTime + p) * 0.15,
          curY,
          s.zOff + Math.cos(elapsedTime * 0.8 + p) * 0.15
        );
        dummy.updateMatrix();
        particlesInstanced.setMatrixAt(p, dummy.matrix);
      }
      particlesInstanced.instanceMatrix.needsUpdate = true;

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
  }, [activePreset]);

  return (
    <div className="relative w-full h-[360px] sm:h-[480px] lg:h-[540px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl group">
      
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Controls & Pill Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-xs font-bold pointer-events-auto shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>3D Fluid Haute Couture Thread Simulation</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-white/10 pointer-events-auto text-[11px] font-bold text-white shadow-lg">
          <button
            onClick={() => {
              setActivePreset('reiatsu');
              playLoomSwoosh();
            }}
            className={`px-3 py-1 rounded-xl transition-all ${
              activePreset === 'reiatsu' ? 'bg-cyan-500 text-slate-950 font-black shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Reiatsu Aura
          </button>
          <button
            onClick={() => {
              setActivePreset('silk');
              playLoomSwoosh();
            }}
            className={`px-3 py-1 rounded-xl transition-all ${
              activePreset === 'silk' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Habotai Silk
          </button>
          <button
            onClick={() => {
              setActivePreset('zari');
              playLoomSwoosh();
            }}
            className={`px-3 py-1 rounded-xl transition-all ${
              activePreset === 'zari' ? 'bg-amber-500 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Gold Zari
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-slate-400 text-xs pointer-events-none">
        <span className="flex items-center gap-1.5 bg-slate-900/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
          <Rotate3d className="w-3.5 h-3.5 text-cyan-400" /> Move cursor to rotate & interact with fluid silk threads
        </span>
        <span className="hidden sm:inline text-[10px] text-slate-500 font-mono">Three.js WebGL Engine</span>
      </div>

    </div>
  );
}
