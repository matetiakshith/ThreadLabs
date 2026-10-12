import { useEffect, useRef, useState } from 'react';
import { useScroll } from 'framer-motion';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import useReducedMotion from '../Measurements/useReducedMotion.js';
import { drapeVertex } from './drapeGeometry.js';
import './cloth-study.css';

const fabrics = {
  silk: { color: '#e5dbca', roughness: .38, sheen: .85, bump: .018 },
  linen: { color: '#d8cbb5', roughness: .86, sheen: .18, bump: .045 },
};

/** Existing cloth study, now mounted in the real studio. It is not an AI mesh. */
export default function InteractiveCloth3D() {
  const mount = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: mount, offset: ['start end', 'end start'] });
  const [fabric, setFabric] = useState('silk');
  const [breeze, setBreeze] = useState(true);
  const [failed, setFailed] = useState(false);
  const [staticStudy, setStaticStudy] = useState(false);
  const controls = useRef({ turn: 0, breeze: true });
  useEffect(() => { controls.current.breeze = breeze; }, [breeze]);

  useEffect(() => {
    const host = mount.current;
    if (!host || staticStudy) return;
    let renderer, geometry, material, weave, environment, pmrem, room, resize, intersection;
    let frame = 0, visible = true, disposed = false, last = 0;
    const pointer = { x: 0, y: 0 };
    const move = event => {
      const rect = host.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
      pointer.y = 1 - (event.clientY - rect.top) / rect.height * 2;
      host.dataset.pointer = `${pointer.x.toFixed(2)},${pointer.y.toFixed(2)}`;
      start();
    };
    const leave = () => { pointer.x = 0; pointer.y = 0; start(); };
    const lost = event => { event.preventDefault(); disposed = true; cancelAnimationFrame(frame); setFailed(true); host.dataset.renderState = 'fallback'; };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else start(); };
    let render = () => {};
    function start() { if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(render); }
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, .1, 30);
      camera.position.set(0, .08, 5.5);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = .8;
      renderer.domElement.setAttribute('aria-label', 'Interactive generic draped fabric study');
      renderer.domElement.addEventListener('webglcontextlost', lost);
      host.appendChild(renderer.domElement);
      pmrem = new THREE.PMREMGenerator(renderer);
      room = new RoomEnvironment();
      environment = pmrem.fromScene(room, .04);
      scene.environment = environment.texture;
      scene.add(new THREE.AmbientLight('#fff5df', .25));
      const key = new THREE.DirectionalLight('#fff3de', 2); key.position.set(-4, 2, 1); scene.add(key);
      const fill = new THREE.DirectionalLight('#e8edf3', .45); fill.position.set(3, -1, 2); scene.add(fill);
      geometry = new THREE.PlaneGeometry(2.65, 2.85, 44, 48);
      const position = geometry.attributes.position;
      const original = new Float32Array(position.array);
      const pixels = new Uint8Array(64 * 64);
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) pixels[y * 64 + x] = ((x % 4 < 2) !== (y % 4 < 2)) ? 180 : 90;
      weave = new THREE.DataTexture(pixels, 64, 64, THREE.RedFormat);
      weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(18, 18); weave.needsUpdate = true;
      const optical = fabrics[fabric];
      material = new THREE.MeshPhysicalMaterial({ color: optical.color, side: THREE.DoubleSide, metalness: 0, roughness: optical.roughness, sheen: optical.sheen, sheenColor: '#eee5d5', sheenRoughness: .65, envMapIntensity: .4, bumpMap: weave, bumpScale: optical.bump });
      const cloth = new THREE.Mesh(geometry, material); scene.add(cloth);
      render = now => {
        frame = 0;
        if (disposed || !visible || document.hidden) return;
        // Cap deformation work to 30 fps; no frame loop while out of view.
        if (now - last >= 32 || reduced) {
          last = now;
          const time = reduced || !controls.current.breeze ? 0 : now * .00065;
          for (let i = 0; i < position.count; i++) {
            const x = original[i * 3], y = original[i * 3 + 1];
            const v = drapeVertex(x, y, time, reduced ? 0 : pointer.x, reduced ? 0 : pointer.y);
            position.setXYZ(i, v.x, v.y, v.z);
          }
          position.needsUpdate = true; geometry.computeVertexNormals();
          const progress = scrollYProgress.get();
          cloth.rotation.y = reduced ? 0 : controls.current.turn + pointer.x * .22 + (progress - .5) * .38;
          cloth.rotation.z = reduced ? 0 : Math.sin(time) * .022;
          camera.position.z = reduced ? 5.5 : 5.8 - progress * .45;
          camera.lookAt(0, 0, 0);
          renderer.render(scene, camera);
          host.dataset.renderState = 'ready';
          host.dataset.camera = camera.position.z.toFixed(3);
          host.dataset.rotation = cloth.rotation.y.toFixed(3);
          host.dataset.frame = String(Number(host.dataset.frame || 0) + 1);
        }
        if (!reduced) start();
      };
      const size = () => {
        const width = host.clientWidth, height = host.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); start();
      };
      resize = new ResizeObserver(size); resize.observe(host);
      intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) { cancelAnimationFrame(frame); frame = 0; } else start(); });
      intersection.observe(host);
      host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
      document.addEventListener('visibilitychange', visibility);
      size(); start();
    } catch {
      // WebGL is an external system; notify React asynchronously if startup fails.
      queueMicrotask(() => { if (!disposed) setFailed(true); });
      host.dataset.renderState = 'fallback';
    }
    return () => {
      disposed = true; cancelAnimationFrame(frame); resize?.disconnect(); intersection?.disconnect();
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
      renderer?.domElement.removeEventListener('webglcontextlost', lost);
      geometry?.dispose(); material?.dispose(); weave?.dispose(); environment?.dispose(); room?.dispose(); pmrem?.dispose();
      renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
    };
  }, [fabric, reduced, staticStudy, scrollYProgress]);

  return <div className="cloth-study">
    <div className="cloth-study-viewport" ref={mount} data-render-state={failed ? 'fallback' : staticStudy ? 'static' : 'loading'}>
      {(failed || staticStudy) && <div className="cloth-static" role="img" aria-label="Static fabric folds"><svg viewBox="0 0 300 350"><path d="M55 30 Q150 65 245 30 L230 315 Q180 300 150 330 Q100 300 70 315Z" fill="var(--sand)"/><path d="M95 45 Q125 165 90 315 M140 54 Q180 220 150 330 M190 44 Q155 195 205 314" fill="none" stroke="var(--muted)" strokeWidth="2"/></svg><p>{failed ? 'Interactive 3D is unavailable. Your design brief and images remain available.' : 'A quiet, static fabric study.'}</p></div>}
    </div>
    <div className="cloth-controls" aria-label="Fabric study controls">
      {Object.keys(fabrics).map(key => <button key={key} aria-pressed={fabric === key} onClick={() => setFabric(key)}>{key === 'silk' ? 'Silk' : 'Linen'}</button>)}
      <button aria-pressed={breeze} onClick={() => setBreeze(value => !value)} disabled={reduced || failed || staticStudy}>{breeze && !reduced ? 'Pause breeze' : 'Play breeze'}</button>
      <button aria-label="Rotate fabric left" onClick={() => { controls.current.turn -= .3; }} disabled={reduced || failed || staticStudy}>↶</button>
      <button aria-label="Rotate fabric right" onClick={() => { controls.current.turn += .3; }} disabled={reduced || failed || staticStudy}>↷</button>
      <button aria-pressed={staticStudy} onClick={() => setStaticStudy(value => !value)}>{staticStudy ? 'Interactive view' : 'Static view'}</button>
    </div>
    <p className="cloth-caption">A generic fabric study. Move your pointer or scroll to explore the drape. This is not an exact reconstruction of your AI design or a body-sizing simulation.</p>
  </div>;
}
