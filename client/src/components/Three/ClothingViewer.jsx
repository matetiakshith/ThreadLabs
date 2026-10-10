import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rotate3d,
  Hand,
  Wind,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sun,
  Moon,
  Palette,
  Check,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Sliders,
  User,
  Activity
} from 'lucide-react';
import { createHumanAvatar } from './avatars/AvatarManager';
import { constructTailoredGarment } from './garments/GarmentManager';
import { FABRIC_DEFINITIONS } from './materials/ClothMaterial';
import { playClickSound, playLoomSwoosh, playSuccessChime } from '../../utils/audioEffects';

export default function ClothingViewer({
  garment,
  onClose,
  onCommission,
  onCustomizeInStudio
}) {
  const mountRef = useRef(null);

  // Viewer State
  const [selectedGender, setSelectedGender] = useState(
    garment.gender === 'Women' ? 'female' : 'male'
  );
  const [mode, setMode] = useState('rotate'); // 'rotate' | 'grab'
  const [selectedFabric, setSelectedFabric] = useState(garment.fabricType || 'silk');
  const [selectedColor, setSelectedColor] = useState(garment.defaultColor);
  const [lightingPreset, setLightingPreset] = useState('studio'); // 'studio' | 'golden' | 'gala' | 'cyber'
  const [windStrength, setWindStrength] = useState(1.2);
  const [qualityMode, setQualityMode] = useState('balanced'); // 'performance' | 'balanced' | 'cinematic'
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(3.8);
  const [isGrabHovering, setIsGrabHovering] = useState(false);
  const [fps, setFps] = useState(60);

  // Sync state when garment changes
  useEffect(() => {
    setSelectedGender(garment.gender === 'Women' ? 'female' : 'male');
    setSelectedFabric(garment.fabricType || 'silk');
    setSelectedColor(garment.defaultColor);
  }, [garment]);

  // Handle debug mode changes
  useEffect(() => {
    if (stateRef.current.avatarObj) {
      stateRef.current.avatarObj.setDebugMode(isDebugMode);
    }
  }, [isDebugMode]);

  // Three.js internal references
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    physics: null,
    humanAvatar: null,
    garmentRoot: null,
    clothMesh: null,
    grabIndicator: null,
    isDragging: false,
    prevMouse: new THREE.Vector2(),
    dragVelocity: new THREE.Vector2(),
    targetRotation: new THREE.Vector2(0, 0),
    currentRotation: new THREE.Vector2(0, 0),
    raycaster: new THREE.Raycaster(),
    mouseNDC: new THREE.Vector2(),
    grabPlane: new THREE.Plane(),
    grabIntersection: new THREE.Vector3(),
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(lightingPreset === 'cyber' ? 0x050811 : 0x090e1a);

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.45, zoomLevel);

    const renderer = new THREE.WebGLRenderer({
      antialias: qualityMode !== 'performance',
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(qualityMode === 'performance' ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = qualityMode !== 'performance';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Studio Lighting Environment
    const ambientLight = new THREE.AmbientLight(0xffffff, lightingPreset === 'cyber' ? 0.45 : 0.88);
    scene.add(ambientLight);

    let keyColor = 0xffffff;
    let rimColor = 0x38bdf8;
    let fillColor = 0xf97316;

    if (lightingPreset === 'golden') {
      keyColor = 0xffbe0b;
      rimColor = 0xfb5607;
      fillColor = 0xff006e;
    } else if (lightingPreset === 'gala') {
      keyColor = 0x818cf8;
      rimColor = 0xc084fc;
      fillColor = 0x38bdf8;
    } else if (lightingPreset === 'cyber') {
      keyColor = 0x06b6d4;
      rimColor = 0xec4899;
      fillColor = 0x8b5cf6;
    }

    const keyLight = new THREE.DirectionalLight(keyColor, 2.8);
    keyLight.position.set(3.5, 4.5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(rimColor, 2.4);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(fillColor, 1.8, 15);
    fillLight.position.set(0, -2, 3);
    scene.add(fillLight);

    // 3. Studio Runway Podium Floor
    const floorGeo = new THREE.RingGeometry(0.8, 2.8, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(keyColor),
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = -0.88;
    scene.add(floor);

    // Model Parent Pivot Group (Human + Garment rotate together while cloth simulates)
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // 4. Instantiate Realistic Digital Human Fashion Avatar
    const avatar = createHumanAvatar(selectedGender);
    modelGroup.add(avatar.group);

    // 5. Fit Tailored 3D Garment with Cloth Physics onto Avatar
    const { root: garmentRoot, physics, clothMesh } = constructTailoredGarment(garment, avatar, {
      isWireframe,
      customColor: selectedColor,
      overrideFabric: selectedFabric,
    });
    modelGroup.add(garmentRoot);

    // 6. Visual Grab Indicator Ring
    const grabIndicatorGeo = new THREE.RingGeometry(0.04, 0.07, 24);
    const grabIndicatorMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    });
    const grabIndicator = new THREE.Mesh(grabIndicatorGeo, grabIndicatorMat);
    scene.add(grabIndicator);

    stateRef.current = {
      ...stateRef.current,
      scene,
      camera,
      renderer,
      physics,
      humanAvatar: avatar.group,
      avatarObj: avatar,
      garmentRoot,
      clothMesh,
      grabIndicator,
    };

    avatar.setDebugMode(isDebugMode);

    // 7. Event Handlers (360° Drag + Grab Vertex Raycast)
    const onPointerDown = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX || (e.touches && e.touches[0].clientX);
      const y = e.clientY || (e.touches && e.touches[0].clientY);

      stateRef.current.isDragging = true;
      stateRef.current.prevMouse.set(x, y);

      stateRef.current.mouseNDC.x = ((x - rect.left) / rect.width) * 2 - 1;
      stateRef.current.mouseNDC.y = -((y - rect.top) / rect.height) * 2 + 1;

      if (mode === 'grab' && physics) {
        stateRef.current.raycaster.setFromCamera(stateRef.current.mouseNDC, camera);
        const hitParticle = physics.findNearestParticle(stateRef.current.raycaster, 0.7);

        if (hitParticle) {
          playClickSound();
          stateRef.current.grabPlane.setFromNormalAndCoplanarPoint(
            camera.getWorldDirection(new THREE.Vector3()).negate(),
            hitParticle.position
          );
          physics.setGrabbedParticle(hitParticle, hitParticle.position);
          grabIndicator.position.copy(hitParticle.position);
          grabIndicatorMat.opacity = 0.95;
        }
      }
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      stateRef.current.mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      stateRef.current.mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      if (mode === 'grab' && physics && !stateRef.current.isDragging) {
        stateRef.current.raycaster.setFromCamera(stateRef.current.mouseNDC, camera);
        const nearP = physics.findNearestParticle(stateRef.current.raycaster, 0.6);
        if (nearP) {
          setIsGrabHovering(true);
          grabIndicator.position.copy(nearP.position);
          grabIndicator.lookAt(camera.position);
          grabIndicatorMat.opacity = 0.65;
        } else {
          setIsGrabHovering(false);
          grabIndicatorMat.opacity = 0.0;
        }
      }

      if (!stateRef.current.isDragging) return;

      const deltaX = clientX - stateRef.current.prevMouse.x;
      const deltaY = clientY - stateRef.current.prevMouse.y;

      stateRef.current.dragVelocity.set(deltaX * 0.035, deltaY * 0.035);

      if (mode === 'grab' && physics && physics.grabbedParticle) {
        stateRef.current.raycaster.setFromCamera(stateRef.current.mouseNDC, camera);
        if (stateRef.current.raycaster.ray.intersectPlane(stateRef.current.grabPlane, stateRef.current.grabIntersection)) {
          const localHit = stateRef.current.grabIntersection.clone();
          modelGroup.worldToLocal(localHit);
          physics.updateGrabPosition(localHit);
          grabIndicator.position.copy(stateRef.current.grabIntersection);
          grabIndicator.lookAt(camera.position);
        }
      } else {
        // Rotate Human Avatar in 360° with angular velocity influencing the cloth
        stateRef.current.targetRotation.y += deltaX * 0.012;
        stateRef.current.targetRotation.x = Math.max(
          -0.35,
          Math.min(0.35, stateRef.current.targetRotation.x + deltaY * 0.005)
        );
      }

      stateRef.current.prevMouse.set(clientX, clientY);
    };

    const onPointerUp = () => {
      stateRef.current.isDragging = false;
      if (physics) {
        physics.releaseGrab();
      }
      grabIndicatorMat.opacity = 0.0;
    };

    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    container.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // 8. Animation & Physics Simulation Loop
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) * 0.001;
      lastTime = now;

      // FPS counter
      frameCount++;
      if (now - lastFpsUpdate > 500) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // Smooth camera zoom
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, zoomLevel, 0.1);

      // Auto 360° rotation when enabled
      if (isAutoRotating && !stateRef.current.isDragging && mode !== 'grab') {
        stateRef.current.targetRotation.y += dt * 0.45;
      }

      // Smooth rotation interpolation
      stateRef.current.currentRotation.x = THREE.MathUtils.lerp(
        stateRef.current.currentRotation.x,
        stateRef.current.targetRotation.x,
        0.12
      );
      stateRef.current.currentRotation.y = THREE.MathUtils.lerp(
        stateRef.current.currentRotation.y,
        stateRef.current.targetRotation.y,
        0.12
      );

      modelGroup.rotation.x = stateRef.current.currentRotation.x;
      modelGroup.rotation.y = stateRef.current.currentRotation.y;

      // Step Cloth Physics with Angular Velocity & Drag Inertia
      if (physics) {
        physics.step(dt, {
          mannequinRotationY: modelGroup.rotation.y,
          dragVelocityX: stateRef.current.dragVelocity.x,
          dragVelocityY: stateRef.current.dragVelocity.y,
          windFactor: windStrength,
        });
      }

      stateRef.current.dragVelocity.multiplyScalar(0.9);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onPointerDown);
      container.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onPointerDown);
      container.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [garment, selectedGender, selectedFabric, selectedColor, lightingPreset, isWireframe, mode, windStrength, isAutoRotating, zoomLevel, qualityMode]);

  const handleResetCamera = () => {
    playClickSound();
    stateRef.current.targetRotation.set(0, 0);
    setZoomLevel(3.8);
  };

  return (
    <div className="relative w-full h-full min-h-[620px] lg:min-h-[760px] flex flex-col lg:flex-row bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl select-none">
      
      {/* 3D WebGL Canvas Viewport */}
      <div className="relative flex-1 h-[480px] sm:h-[580px] lg:h-auto overflow-hidden">
        
        <div
          ref={mountRef}
          className={`w-full h-full ${
            mode === 'grab'
              ? isGrabHovering
                ? 'cursor-pointer active:cursor-grabbing'
                : 'cursor-crosshair'
              : 'cursor-grab active:cursor-grabbing'
          }`}
        />

        {/* Top Header Floating Bar */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
          
          {/* Garment & Avatar Badge */}
          <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white shadow-2xl pointer-events-auto flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black font-display text-white">{garment.name}</span>
                <span className="text-[10px] uppercase font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md">
                  {garment.collection}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Model: {selectedGender === 'female' ? 'Female Fashion Avatar' : 'Male Fashion Avatar'} • {FABRIC_DEFINITIONS[selectedFabric]?.name || selectedFabric}
              </p>
            </div>
          </div>

          {/* Mode Switcher (360° Rotate vs Grab Fabric) */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
            <button
              onClick={() => {
                setMode('rotate');
                playClickSound();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'rotate'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>360° Orbit</span>
            </button>

            <button
              onClick={() => {
                setMode('grab');
                setIsAutoRotating(false);
                playClickSound();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'grab'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md animate-pulse'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>Grab Fabric Mode</span>
            </button>
          </div>

        </div>

        {/* Bottom Left Toolbar (Reset, Zoom, Auto-Rotate, Wireframe, FPS) */}
        <div className="absolute left-4 bottom-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
          
          <button
            onClick={handleResetCamera}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 backdrop-blur-md shadow-xl transition-all"
            title="Reset Camera Orientation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setZoomLevel((z) => Math.max(2.5, z - 0.5));
              playClickSound();
            }}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 backdrop-blur-md shadow-xl transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setZoomLevel((z) => Math.min(5.8, z + 0.5));
              playClickSound();
            }}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 backdrop-blur-md shadow-xl transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsAutoRotating(!isAutoRotating);
              playClickSound();
            }}
            className={`p-2.5 rounded-2xl border backdrop-blur-md shadow-xl text-xs font-bold transition-all ${
              isAutoRotating
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900/90 text-slate-300 border-white/10 hover:text-white'
            }`}
            title="Toggle 360° Auto-Rotation"
          >
            <Rotate3d className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsWireframe(!isWireframe);
              playClickSound();
            }}
            className={`p-2.5 rounded-2xl border backdrop-blur-md shadow-xl text-xs font-bold transition-all ${
              isWireframe
                ? 'bg-orange-500 text-white border-orange-400'
                : 'bg-slate-900/90 text-slate-300 border-white/10 hover:text-white'
            }`}
            title="Toggle Weave Structure Wireframe"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Physics & Body Occlusion Debug Toggle */}
          <button
            onClick={() => {
              setIsDebugMode(!isDebugMode);
              playClickSound();
            }}
            className={`px-3 py-2 rounded-2xl border backdrop-blur-md shadow-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isDebugMode
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/50'
                : 'bg-slate-900/90 text-slate-300 border-white/10 hover:text-white'
            }`}
            title="Toggle Physics Collider & Body Occlusion Debug Mode"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Physics Debug</span>
          </button>

          {/* Performance FPS Badge */}
          <div className="bg-slate-900/90 px-3 py-1.5 rounded-2xl border border-white/10 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1.5 shadow-xl">
            <Activity className="w-3.5 h-3.5" />
            <span>{fps} FPS</span>
          </div>

        </div>

        {/* Physics Debug Mode Inspector HUD */}
        {isDebugMode && (
          <div className="absolute top-20 left-4 z-20 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 shadow-2xl max-w-xs text-xs space-y-2.5 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Physics & Occlusion Engine
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">ACTIVE</span>
            </div>
            <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Collision Body:</span>
                <span className="text-emerald-400 font-bold">9 Invisible Spheres</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cloth Sim Mesh:</span>
                <span className="text-cyan-400 font-bold">PBD Verlet Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Torso Show-Through:</span>
                <span className="text-emerald-400 font-bold">0% (Hardware Occluded)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Coverage Mask:</span>
                <span className="text-amber-400 font-bold">{garment.coverage ? 'Custom Occlusion' : 'Standard'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Right Dynamic Physics Helper Hint */}
        <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden sm:block">
          <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[11px] text-slate-300 shadow-xl flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {mode === 'grab'
              ? 'Click & drag any point on fabric to pull and deform'
              : 'Drag 360° — human turns and tailored fabric lags with inertia'}
          </div>
        </div>

      </div>

      {/* Right Control & Product Information Panel */}
      <div className="w-full lg:w-96 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 flex flex-col justify-between space-y-6 overflow-y-auto max-h-[600px] lg:max-h-none">
        
        <div className="space-y-6">
          
          {/* Garment Title & Price */}
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {garment.category} • {garment.collection}
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">{garment.price}</span>
            </div>
            <h3 className="text-xl font-extrabold font-display text-white mt-1 leading-tight">
              {garment.name}
            </h3>
            {garment.animeRef && (
              <p className="text-xs text-cyan-400 mt-1 italic flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {garment.animeRef}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {garment.description}
            </p>
          </div>

          {/* 1. Avatar Model Selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Digital Human Avatar
              </span>
              <span className="text-[10px] text-slate-400">Anatomical Fit</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedGender('male');
                  playClickSound();
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  selectedGender === 'male'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Male Fashion Model</span>
              </button>

              <button
                onClick={() => {
                  setSelectedGender('female');
                  playClickSound();
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  selectedGender === 'female'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Female Fashion Model</span>
              </button>
            </div>
          </div>

          {/* 2. Fabric Physics Profile Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Fabric Type & Physics Profile</span>
              <span className="text-[10px] text-cyan-400 font-mono">PBD Simulation</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {Object.keys(FABRIC_DEFINITIONS).slice(0, 6).map((fKey) => {
                const prof = FABRIC_DEFINITIONS[fKey];
                const isSelected = selectedFabric === fKey;
                return (
                  <button
                    key={fKey}
                    onClick={() => {
                      setSelectedFabric(fKey);
                      playLoomSwoosh();
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-left truncate ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate capitalize">{prof.id}</div>
                    <div className="text-[9px] text-slate-300 font-normal truncate">
                      {prof.weightGSM}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 italic">
              {FABRIC_DEFINITIONS[selectedFabric]?.description}
            </p>
          </div>

          {/* 3. Color Palette Customizer */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
              Color Palette (PBR Dye Simulation)
            </label>
            <div className="flex items-center gap-2.5">
              {(garment.colorPalette || [garment.defaultColor, '#0f172a', '#1e293b', '#f8fafc']).map((hex) => (
                <button
                  key={hex}
                  onClick={() => {
                    setSelectedColor(hex);
                    playClickSound();
                  }}
                  style={{ backgroundColor: hex }}
                  className={`w-8 h-8 rounded-full border-2 transition-all shadow-md flex items-center justify-center ${
                    selectedColor === hex ? 'border-cyan-400 scale-110 ring-2 ring-cyan-400/30' : 'border-slate-700 hover:scale-105'
                  }`}
                >
                  {selectedColor === hex && (
                    <Check className={`w-4 h-4 ${hex === '#ffffff' || hex === '#f8fafc' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Wind Velocity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" /> Wind Velocity
              </span>
              <span className="text-cyan-400 font-mono">{windStrength.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={windStrength}
              onChange={(e) => setWindStrength(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Calm (0.0x)</span>
              <span>Breeze (1.5x)</span>
              <span>Gale (3.0x)</span>
            </div>
          </div>

          {/* 5. Studio Lighting Presets */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
              Studio Environment Lighting
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
              {[
                { id: 'studio', label: 'Daylight' },
                { id: 'golden', label: 'Golden' },
                { id: 'gala', label: 'Gala' },
                { id: 'cyber', label: 'Cyber' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setLightingPreset(l.id);
                    playLoomSwoosh();
                  }}
                  className={`py-1.5 rounded-xl border transition-all ${
                    lightingPreset === l.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Technical Garment Details */}
          {garment.details && (
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Garment Construction:
              </span>
              <ul className="space-y-1 text-xs text-slate-400">
                {garment.details.map((d, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <button
            onClick={() => {
              playSuccessChime();
              if (onCommission) onCommission(garment);
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-102"
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>Commission Artisan Tailor ({garment.price})</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              playClickSound();
              if (onCustomizeInStudio) onCustomizeInStudio(garment);
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Customize Specs in 3D Studio</span>
          </button>
        </div>

      </div>

    </div>
  );
}
