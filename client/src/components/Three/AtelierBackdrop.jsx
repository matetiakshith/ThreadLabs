import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Animates the supplied architectural artwork; a still remains beneath WebGL. */
export default function AtelierBackdrop() {
  const mount = useRef(null);
  useEffect(() => {
    const host = mount.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      artwork: { value: null }, time: { value: 0 },
      ratio: { value: 1 }, pointer: { value: new THREE.Vector2() },
      movement: { value: preference.matches ? 0 : 1 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}`,
      fragmentShader: `
        uniform sampler2D artwork;
        uniform float time, ratio, movement;
        uniform vec2 pointer;
        varying vec2 vUv;
        void main(){
          vec2 uv=vUv;
          float imageRatio=1.777;
          if(ratio<imageRatio) uv.x=(uv.x-.5)*ratio/imageRatio+.5;
          else uv.y=(uv.y-.5)*imageRatio/ratio+.5;
          uv=(uv-.5)*.96+.5;
          uv+=pointer*.008*movement;
          float water=1.-smoothstep(.13,.29,uv.y);
          float ripple=sin(uv.y*135.-time*.85)+sin(uv.x*29.+uv.y*74.+time*.55)*.45;
          uv.x+=ripple*.0016*water*movement;
          uv.y+=sin(uv.x*45.+time*.6)*.0007*water*movement;
          gl_FragColor=texture2D(artwork,uv);
          #include <colorspace_fragment>
        }`,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));
    let disposed = false;
    const texture = new THREE.TextureLoader().load('/images/threadlabs-pink-studio.png', (loaded) => {
      if (disposed) { loaded.dispose(); return; }
      loaded.colorSpace = THREE.SRGBColorSpace;
      uniforms.artwork.value = loaded;
      renderer.render(scene, camera);
      host.classList.add('is-ready');
    });
    const target = new THREE.Vector2();
    const move = (event) => {
      if (event.pointerType === 'touch') return;
      target.set(event.clientX / window.innerWidth - .5, .5 - event.clientY / window.innerHeight);
    };
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height);
      uniforms.ratio.value = width / Math.max(height, 1);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const changeMotion = () => { uniforms.movement.value = preference.matches ? 0 : 1; };
    preference.addEventListener('change', changeMotion);
    window.addEventListener('pointermove', move, { passive: true });
    let frame;
    let last = 0;
    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      if (document.hidden || now - last < 32 || !uniforms.artwork.value) return;
      last = now;
      uniforms.time.value = now * .001;
      uniforms.pointer.value.lerp(target, .035);
      renderer.render(scene, camera);
    };
    resize();
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      preference.removeEventListener('change', changeMotion);
      geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div className="atelier-backdrop" aria-hidden="true"><div ref={mount} className="atelier-backdrop-canvas" /></div>;
}
