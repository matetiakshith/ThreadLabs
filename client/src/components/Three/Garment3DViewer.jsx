import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rotate3d, Sun, Moon, Sparkles, Layers, RefreshCw, ZoomIn, Wind, Palette, ShieldCheck, Flame, Compass } from 'lucide-react';
import { FASHION_OUTFITS, createFashionMaterials, buildFashionMesh, updateClothPhysics } from './fashionModels';
import { playLoomSwoosh } from '../../utils/audioEffects';

export default function Garment3DViewer({ techPack, initialOutfitId = 'captain-haori', onSelectOutfit }) {
  const mountRef = useRef(null);
  const [selectedOutfitId, setSelectedOutfitId] = useState(initialOutfitId);
  const [lightingMode, setLightingMode] = useState('studio'); // 'studio' | 'golden' | 'gala' | 'neon'
  const [isWireframe, setIsWireframe] = useState(false);
  const [fabricSheen, setFabricSheen] = useState('silk'); // 'silk' | 'cotton' | 'zari' | 'velvet' | 'reiatsu'
  const [isRotating, setIsRotating] = useState(true);
  const [windIntensity, setWindIntensity] = useState(1.2);
  const [customColor, setCustomColor] = useState(techPack?.colorScheme?.hex || null);

  // Sync with prop techPack if provided
  useEffect(() => {
    if (techPack?.colorScheme?.hex) {
      setCustomColor(techPack.colorScheme.hex);
    }
  }, [techPack]);

  const currentOutfit = FASHION_OUTFITS.find(o => o.id === selectedOutfitId) || FASHION_OUTFITS[0];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.2, 4.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup based on Mode
    const ambientLight = new THREE.AmbientLight(0xffffff, lightingMode === 'neon' ? 0.4 : 0.85);
    scene.add(ambientLight);

    let keyLightColor = 0xffffff;
    let rimLightColor = 0xf97316;
    let fillLightColor = 0x3b82f6;

    if (lightingMode === 'golden') {
      keyLightColor = 0xffbe0b;
      rimLightColor = 0xfb5607;
      fillLightColor = 0xff006e;
    } else if (lightingMode === 'gala') {
      keyLightColor = 0x818cf8;
      rimLightColor = 0xc084fc;
      fillLightColor = 0x38bdf8;
    } else if (lightingMode === 'neon') {
      keyLightColor = 0x06b6d4;
      rimLightColor = 0xec4899;
      fillLightColor = 0x8b5cf6;
    }

    const mainLight = new THREE.DirectionalLight(keyLightColor, 2.5);
    mainLight.position.set(3, 4, 3.5);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(rimLightColor, 2.0);
    rimLight.position.set(-3.5, 2.5, -2.5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(fillLightColor, 1.8, 12);
    fillLight.position.set(0, -2, 2.5);
    scene.add(fillLight);

    // 3. Runway Floor Glow Disc
    const floorGeo = new THREE.RingGeometry(0.7, 2.2, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(keyLightColor),
      metalness: 0.8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = Math.PI / 2;
    floorMesh.position.y = -1.86;
    scene.add(floorMesh);

    // 4. Build Procedural 3D Garment Mesh & Fluid Physics
    const materials = createFashionMaterials(currentOutfit, {
      sheen: fabricSheen,
      isWireframe,
      customColor: customColor || currentOutfit.defaultColor,
      accentColor: currentOutfit.accentColor,
    });

    const { root: mannequinGroup, fluidVertices } = buildFashionMesh(selectedOutfitId, materials);
    scene.add(mannequinGroup);

    // 5. Drag & Inertia Physics Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let angularVelY = 0;
    let dragInertiaX = 0;
    let dragInertiaY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX || (e.touches && e.touches[0].clientX);
      prevMouseY = e.clientY || (e.touches && e.touches[0].clientY);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;

      angularVelY = deltaX * 0.012;
      mannequinGroup.rotation.y += angularVelY;
      mannequinGroup.rotation.x = Math.max(-0.35, Math.min(0.35, mannequinGroup.rotation.x + deltaY * 0.005));

      dragInertiaX = deltaX * 0.02;
      dragInertiaY = deltaY * 0.02;

      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.addEventListener('touchstart', onMouseDown, { passive: true });
    container.addEventListener('touchmove', onMouseMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // 6. Fluid Animation Loop with Real-Time Cloth Inertia
    let lastTime = performance.now();
    let startTime = performance.now();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) * 0.001;
      const elapsed = (now - startTime) * 0.001;
      lastTime = now;

      // Auto rotation when not dragging
      if (isRotating && !isDragging) {
        const autoSpeed = 0.4;
        mannequinGroup.rotation.y += delta * autoSpeed;
        angularVelY = autoSpeed * 0.1;
      } else if (!isDragging) {
        // Friction damping on angular velocity
        angularVelY *= 0.92;
        dragInertiaX *= 0.9;
        dragInertiaY *= 0.9;
      }

      // Gentle floating breathing animation
      mannequinGroup.position.y = Math.sin(elapsed * 1.5) * 0.035;

      // Update fluid cloth vertex waves & inertia
      updateClothPhysics(fluidVertices, {
        elapsedTime: elapsed,
        angularVelocityY: angularVelY,
        dragInertiaX,
        dragInertiaY,
        windIntensity,
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onMouseDown);
      container.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedOutfitId, lightingMode, isWireframe, fabricSheen, isRotating, windIntensity, customColor]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl space-y-0">
      
      {/* 3D WebGL Canvas */}
      <div className="relative w-full h-[440px] sm:h-[520px]">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Floating Badge & Anime Inspiration */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-xs font-bold pointer-events-auto flex items-center gap-2 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-display">{currentOutfit.name}</span>
            <span className="text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/20">
              {currentOutfit.gender}
            </span>
          </div>

          {/* Lighting Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-white/10 pointer-events-auto text-[11px] font-bold text-white shadow-lg">
            <button
              onClick={() => {
                setLightingMode('studio');
                playLoomSwoosh();
              }}
              className={`p-1.5 px-2.5 rounded-xl transition-all ${
                lightingMode === 'studio' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Daylight Studio"
            >
              Daylight
            </button>
            <button
              onClick={() => {
                setLightingMode('golden');
                playLoomSwoosh();
              }}
              className={`p-1.5 px-2.5 rounded-xl transition-all ${
                lightingMode === 'golden' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Golden Festive"
            >
              Festive
            </button>
            <button
              onClick={() => {
                setLightingMode('gala');
                playLoomSwoosh();
              }}
              className={`p-1.5 px-2.5 rounded-xl transition-all ${
                lightingMode === 'gala' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Evening Gala"
            >
              Gala
            </button>
            <button
              onClick={() => {
                setLightingMode('neon');
                playLoomSwoosh();
              }}
              className={`p-1.5 px-2.5 rounded-xl transition-all ${
                lightingMode === 'neon' ? 'bg-cyan-500 text-black font-extrabold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Cyber Runway"
            >
              Cyber
            </button>
          </div>
        </div>

        {/* Anime Reference Pill */}
        <div className="absolute top-16 left-4 pointer-events-none hidden sm:flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-[11px] text-slate-300">
          <span className="text-amber-400 font-bold">Inspiration:</span> {currentOutfit.animeRef}
        </div>

        {/* Bottom Overlay Controls (Sheen, Wind, Wireframe, Rotation) */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            
            {/* Fabric Sheen Switcher */}
            <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-white/10 text-[11px] font-bold text-white flex items-center gap-1 shadow-lg">
              <span className="px-2 text-slate-400">Sheen:</span>
              {[
                { id: 'silk', label: 'Silk' },
                { id: 'zari', label: 'Zari Gold' },
                { id: 'velvet', label: 'Velvet' },
                { id: 'reiatsu', label: 'Reiatsu Glow' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setFabricSheen(s.id);
                    playLoomSwoosh();
                  }}
                  className={`px-2.5 py-1 rounded-xl transition-all ${
                    fabricSheen === s.id ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Wireframe Toggle */}
            <button
              onClick={() => setIsWireframe(!isWireframe)}
              className={`p-2 rounded-2xl border backdrop-blur-md text-xs font-bold transition-all shadow-lg ${
                isWireframe
                  ? 'bg-orange-500 text-white border-orange-400'
                  : 'bg-slate-900/90 text-slate-300 border-white/10 hover:text-white'
              }`}
              title="Toggle Weave Structure Wireframe"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* 360 Auto-Rotate Toggle */}
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`p-2 rounded-2xl border backdrop-blur-md text-xs font-bold transition-all shadow-lg ${
                isRotating
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900/90 text-slate-300 border-white/10 hover:text-white'
              }`}
              title="Toggle 360° Auto Rotation"
            >
              <Rotate3d className="w-4 h-4" />
            </button>

            {/* Wind Breeze Intensity Button */}
            <button
              onClick={() => {
                setWindIntensity(w => (w >= 2.0 ? 0.3 : w + 0.6));
                playLoomSwoosh();
              }}
              className="bg-slate-900/90 text-slate-200 border border-white/10 p-2 px-2.5 rounded-2xl text-[11px] font-bold flex items-center gap-1.5 hover:text-white shadow-lg"
              title="Adjust Wind Physics Intensity"
            >
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Breeze: {windIntensity.toFixed(1)}x</span>
            </button>

          </div>

          <div className="text-slate-400 text-xs flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 pointer-events-none">
            <Rotate3d className="w-3.5 h-3.5 text-blue-400 animate-spin" /> Drag to rotate & ripple cloth in real-time
          </div>

        </div>
      </div>

      {/* Outfit Rack Carousel Selector (Real Shopping Mall Experience) */}
      <div className="p-4 bg-slate-900/95 border-t border-slate-800">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Select Fashion Silhouette (Bleach & Heritage Couture):
          </span>
          <span className="text-[11px] text-slate-400 font-mono">5 Iconic Runway Models</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {FASHION_OUTFITS.map((outfit) => {
            const isSelected = outfit.id === selectedOutfitId;
            return (
              <button
                key={outfit.id}
                onClick={() => {
                  setSelectedOutfitId(outfit.id);
                  if (onSelectOutfit) onSelectOutfit(outfit);
                  playLoomSwoosh();
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-900/60 to-slate-900 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-lg scale-102'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-amber-300">
                    {outfit.gender}
                  </span>
                  <span className="text-[11px] font-black text-emerald-400">{outfit.price}</span>
                </div>
                <h4 className="text-xs font-bold truncate group-hover:text-white">{outfit.name}</h4>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{outfit.craftTechnique}</p>

                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
