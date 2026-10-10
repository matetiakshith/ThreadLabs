import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Rotate3d, Wind, Layers, Palette, Eye } from 'lucide-react';
import { playLoomSwoosh } from '../../utils/audioEffects';

export default function InteractiveCloth3D() {
  const mountRef = useRef(null);
  const [activeFabric, setActiveFabric] = useState('captain-silk');
  const [windActive, setWindActive] = useState(true);

  const fabrics = [
    { 
      id: 'captain-silk', 
      name: 'Captain Habotai Silk (Bleach Shihakusho)', 
      color: 0xf8fafc, 
      metalness: 0.25, 
      roughness: 0.2, 
      clearcoat: 0.9,
      accent: 0xd4af37
    },
    { 
      id: 'quincy-wool', 
      name: 'Quincy Khadi Wool (Imperial Cape)', 
      color: 0xffffff, 
      metalness: 0.1, 
      roughness: 0.8, 
      clearcoat: 0.1,
      accent: 0x38bdf8
    },
    { 
      id: 'banarasi-zari', 
      name: 'Banarasi Gold Zari Brocade', 
      color: 0xd4af37, 
      metalness: 0.88, 
      roughness: 0.18, 
      clearcoat: 0.7,
      accent: 0x991b1b
    },
    { 
      id: 'ajrakh-indigo', 
      name: 'Ajrakh Natural Indigo Modal', 
      color: 0x1e3a8a, 
      metalness: 0.15, 
      roughness: 0.65, 
      clearcoat: 0.3,
      accent: 0xf97316
    },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffeedd, 2.5);
    dirLight1.position.set(4, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight2.position.set(-4, -3, 2);
    scene.add(dirLight2);

    const currentFabricObj = fabrics.find(f => f.id === activeFabric) || fabrics[0];

    // Draped Fluid Kimono / Cape Cloth Mesh
    const width = 3.2;
    const height = 2.4;
    const segmentsX = 48;
    const segmentsY = 40;

    const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    const pos = geometry.attributes.position;

    // Initial curve drape
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      // Gentle hanging fold drape
      const initialFold = Math.sin(vx * 2.5) * 0.25 * (1.2 - vy * 0.3);
      pos.setZ(i, initialFold);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(currentFabricObj.color),
      metalness: currentFabricObj.metalness,
      roughness: currentFabricObj.roughness,
      clearcoat: currentFabricObj.clearcoat,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide,
    });

    const clothMesh = new THREE.Mesh(geometry, material);
    scene.add(clothMesh);

    // Gold/Accent Brocade Border Ribbon at the Bottom
    const borderGeo = new THREE.PlaneGeometry(width, 0.15, segmentsX, 2);
    const borderMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(currentFabricObj.accent),
      metalness: 0.9,
      roughness: 0.15,
      side: THREE.DoubleSide,
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.y = -height / 2 + 0.08;
    clothMesh.add(borderMesh);

    // Mouse Ripple Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isHovering = false;
    let touchPoint = new THREE.Vector3(0, 0, 0);

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(clothMesh);

      if (intersects.length > 0) {
        isHovering = true;
        touchPoint.copy(intersects[0].point);
      } else {
        isHovering = false;
      }
    };

    container.addEventListener('pointermove', onPointerMove);

    // Animation Loop
    let animId;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const elapsed = (now - startTime) * 0.001;

      const posAttr = geometry.attributes.position;

      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);

        // Fluid wave formula simulating wind through silk kimono
        let zWave = Math.sin(vx * 2.8 + elapsed * 3.2) * 0.16 * (windActive ? 1 : 0.25) +
                    Math.cos(vy * 3.5 + elapsed * 2.5) * 0.11 * (windActive ? 1 : 0.25);

        // Fluid ripple when mouse hovers/drags
        if (isHovering) {
          const dx = vx - touchPoint.x;
          const dy = vy - touchPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1.1) {
            const pull = (1 - dist / 1.1) * 0.45;
            zWave += Math.sin(dist * 14 - elapsed * 10) * pull;
          }
        }

        posAttr.setZ(i, zWave);
      }

      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();

      // Gentle floating sway
      clothMesh.rotation.y = Math.sin(elapsed * 0.5) * 0.12;
      clothMesh.rotation.x = Math.cos(elapsed * 0.4) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointermove', onPointerMove);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeFabric, windActive]);

  return (
    <div className="relative w-full h-[340px] sm:h-[420px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />

      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-xs font-bold pointer-events-auto shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-Time Fluid Fashion Cloth Physics</span>
        </div>

        <button
          onClick={() => {
            setWindActive(!windActive);
            playLoomSwoosh();
          }}
          className={`px-3 py-1 rounded-xl text-xs font-bold border backdrop-blur-md pointer-events-auto transition-all flex items-center gap-1.5 shadow-lg ${
            windActive ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900/80 text-slate-400 border-white/10'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Loom Breeze</span>
        </button>
      </div>

      {/* Bottom Fabric Switcher */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 pointer-events-auto shadow-lg">
          {fabrics.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setActiveFabric(f.id);
                playLoomSwoosh();
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeFabric === f.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.name.split('(')[0]}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-900/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 pointer-events-none">
          👆 Touch or hover on cloth to generate dynamic fluid waves
        </div>
      </div>
    </div>
  );
}
