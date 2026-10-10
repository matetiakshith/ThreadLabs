import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Compass, Volume2, VolumeX, Eye } from 'lucide-react';
import { playClickSound, playLoomSwoosh } from '../../utils/audioEffects';

/**
 * Opening Cinematic Experience for ThreadLabs
 * - Dark, elegant atmospheric environment
 * - Physically simulated floating silk cloth reacting to cursor drag & subtle wind
 * - Editorial typography with spatial camera movement
 * - Seamless transition into the main 3D Fashion Sanctuary
 */
export default function OpeningCinematic({ onEnterWorld, isMuted, onToggleSound }) {
  const mountRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    clothMesh: null,
    particles: null,
    isDragging: false,
    prevMouse: new THREE.Vector2(),
    targetRot: new THREE.Vector2(0, 0),
    currRot: new THREE.Vector2(0, 0),
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080d);
    scene.fog = new THREE.FogExp2(0x06080d, 0.22);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 2. Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(2, 3, 2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    rimLight.position.set(-3, -1, -1);
    scene.add(rimLight);

    const warmAccent = new THREE.PointLight(0xd97706, 1.8, 10);
    warmAccent.position.set(0, -1.2, 1.5);
    scene.add(warmAccent);

    // 3. Realistic Floating Silk Cloth with Curvature & Wrinkles
    const clothRows = 36;
    const clothCols = 36;
    const clothGeo = new THREE.PlaneGeometry(1.6, 1.6, clothCols - 1, clothRows - 1);

    // Procedural Silk PBR Material
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const val = ((x ^ y) % 255) / 255;
        ctx.fillStyle = `rgb(${Math.floor(128 + val * 20)}, ${Math.floor(128 + val * 20)}, 255)`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    const normalTex = new THREE.CanvasTexture(canvas);
    normalTex.wrapS = THREE.RepeatWrapping;
    normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.set(12, 12);

    const clothMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xf1f5f9),
      roughness: 0.18,
      metalness: 0.12,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
      sheen: 0.85,
      sheenColor: new THREE.Color(0xbae6fd),
      normalMap: normalTex,
      normalScale: new THREE.Vector2(0.4, 0.4),
      side: THREE.DoubleSide,
    });

    const clothMesh = new THREE.Mesh(clothGeo, clothMat);
    scene.add(clothMesh);

    // Initial cloth wave deformation
    const basePos = clothGeo.attributes.position.array.slice();

    // 4. Subtle Atmospheric Golden Thread Fibers
    const fiberCount = 140;
    const fiberGeo = new THREE.BufferGeometry();
    const fiberPos = new Float32Array(fiberCount * 3);
    for (let i = 0; i < fiberCount * 3; i += 3) {
      fiberPos[i] = (Math.random() - 0.5) * 5;
      fiberPos[i + 1] = (Math.random() - 0.5) * 4;
      fiberPos[i + 2] = (Math.random() - 0.5) * 3;
    }
    fiberGeo.setAttribute('position', new THREE.BufferAttribute(fiberPos, 3));
    const fiberMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.03,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const fibers = new THREE.Points(fiberGeo, fiberMat);
    scene.add(fibers);

    stateRef.current = {
      ...stateRef.current,
      scene,
      camera,
      renderer,
      clothMesh,
      particles: fibers,
    };

    // 5. Drag Interaction Listeners
    const onPointerDown = (e) => {
      stateRef.current.isDragging = true;
      setIsInteracting(true);
      setHasDragged(true);
      stateRef.current.prevMouse.set(e.clientX, e.clientY);
    };

    const onPointerMove = (e) => {
      if (!stateRef.current.isDragging) return;
      const dx = e.clientX - stateRef.current.prevMouse.x;
      const dy = e.clientY - stateRef.current.prevMouse.y;
      stateRef.current.targetRot.y += dx * 0.006;
      stateRef.current.targetRot.x += dy * 0.006;
      stateRef.current.prevMouse.set(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      stateRef.current.isDragging = false;
      setIsInteracting(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 6. Animation Loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth camera orbit interpolation
      stateRef.current.currRot.x += (stateRef.current.targetRot.x - stateRef.current.currRot.x) * 0.08;
      stateRef.current.currRot.y += (stateRef.current.targetRot.y - stateRef.current.currRot.y) * 0.08;

      camera.position.x = Math.sin(stateRef.current.currRot.y) * 3.2;
      camera.position.z = Math.cos(stateRef.current.currRot.y) * 3.2;
      camera.position.y = stateRef.current.currRot.x * 1.5;
      camera.lookAt(0, 0, 0);

      // Organic cloth wave simulation
      const pos = clothGeo.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const u = basePos[i];
        const v = basePos[i + 1];
        const wave1 = Math.sin(u * 3.5 + time * 1.8) * 0.14;
        const wave2 = Math.cos(v * 2.8 + time * 1.4) * 0.12;
        const wave3 = Math.sin((u + v) * 4.0 + time * 2.2) * 0.06;
        pos[i + 2] = basePos[i + 2] + wave1 + wave2 + wave3;
      }
      clothGeo.attributes.position.needsUpdate = true;
      clothGeo.computeVertexNormals();

      // Slow idle rotation & floating fibers
      clothMesh.rotation.y = Math.sin(time * 0.3) * 0.2;
      fibers.rotation.y = time * 0.04;

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
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleEnter = () => {
    playLoomSwoosh();
    onEnterWorld();
  };

  return (
    <div className="relative w-full h-screen bg-[#06080d] overflow-hidden select-none cursor-grab active:cursor-grabbing font-sans">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Cinematic Vignette & Ambient Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#06080d] via-transparent to-[#06080d]/60" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,#06080d_95%)]" />

      {/* Top Editorial Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 pointer-events-auto">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono tracking-[0.25em] text-white/80 uppercase font-semibold">
            THREADLABS • ATELIER 2026
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <button
            onClick={onToggleSound}
            className="flex items-center space-x-2 text-xs font-mono text-white/60 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span className="tracking-widest">{isMuted ? 'SOUND OFF' : 'SOUND ON'}</span>
          </button>
        </div>
      </div>

      {/* Center Cinematic Editorial Statements */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 max-w-4xl"
        >
          <span className="inline-block text-[11px] font-mono tracking-[0.4em] uppercase text-amber-400/90 font-bold px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5">
            FROM IMAGINATION TO FORM
          </span>

          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase font-display leading-[0.95]">
            THREADLABS
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto font-light leading-relaxed tracking-wide">
            Where your raw thoughts, voice, and sketches transform into physically simulated haute couture, tailored by master Indian heritage artisans.
          </p>
        </motion.div>

        {/* Spatial Instruction & Enter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1.2 }}
          className="mt-12 pointer-events-auto flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={handleEnter}
            className="group relative px-8 py-4 rounded-full bg-white text-slate-950 font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:scale-105 hover:bg-amber-400 hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] flex items-center gap-3 shadow-2xl"
          >
            <span>Enter Fashion World</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <div className="text-[11px] font-mono text-slate-400 tracking-widest uppercase flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>{hasDragged ? 'Camera Orbiting' : 'Drag Screen to Orbit'}</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Editorial Story Ticker */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-between px-8 pointer-events-none text-[10px] font-mono text-slate-400 tracking-[0.2em] uppercase">
        <span>IMAGINATION → FORM → FABRIC → CRAFT → YOU</span>
        <span>©2026 THREADLABS DIGITAL RUNWAY</span>
      </div>
    </div>
  );
}
