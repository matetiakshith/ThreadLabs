import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Spool3DWidget({ threadColor = '#d4af37', speed = 1 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffeedd, 2.5, 10);
    pointLight.position.set(2, 3, 2);
    scene.add(pointLight);

    // Spool Object
    const spoolGroup = new THREE.Group();
    scene.add(spoolGroup);

    // Wood Flanges
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.4, metalness: 0.1 });
    const topFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.12, 32), woodMat);
    topFlange.position.y = 0.9;
    spoolGroup.add(topFlange);

    const bottomFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.12, 32), woodMat);
    bottomFlange.position.y = -0.9;
    spoolGroup.add(bottomFlange);

    // Thread Core Winding
    const threadMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(threadColor),
      roughness: 0.3,
      metalness: 0.6,
    });
    const threadCore = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.68, 32), threadMat);
    spoolGroup.add(threadCore);

    // Spool Axial Pin
    const pinMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.3, 16), pinMat);
    spoolGroup.add(pin);

    spoolGroup.rotation.x = Math.PI / 6;
    spoolGroup.rotation.z = Math.PI / 12;

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      spoolGroup.rotation.y += 0.02 * speed;
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
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [threadColor, speed]);

  return (
    <div ref={mountRef} className="w-full h-full min-h-[140px]" />
  );
}
