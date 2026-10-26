import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { fabricFrame, createTextileGeometry, updateTextileGeometry } from './textileGeometry.js';
import { createTextileMaps, textileMaterial } from './textileMaterial.js';
export { sampleFabricPoint } from './textileGeometry.js';

const COLORS = ['#b96136', '#5e6546', '#e5cfaa', '#a54d2b', '#777953', '#efddbc'];
export function createFabricScene(canvas, { final = false, mannequinOnly = false, onReady = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), cloth = new THREE.Group(); scene.add(cloth);
  const camera = new THREE.OrthographicCamera(-4, 4, 5, -5, .1, 70); camera.position.set(0, 0, 22);
  const ambient=new THREE.HemisphereLight('#fff6e5','#62503e',1.25);scene.add(ambient);
  const key = new THREE.DirectionalLight('#fff5e0', 3.4); key.position.set(-5, 7, 10); key.castShadow = true;
  if(mannequinOnly){key.intensity=2.5;renderer.toneMappingExposure=1.02;}
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 35 });
  key.shadow.bias = -.0003; key.shadow.normalBias = .045; key.shadow.radius = 3; scene.add(key);
  const rim = new THREE.DirectionalLight('#f9e4c3', 1.8); rim.position.set(4, 2, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight('#e4ccb1', .45); fill.position.set(4, -1, 6); scene.add(fill);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(40, 25), new THREE.ShadowMaterial({ opacity: .025 }));
  backdrop.position.z = -4; backdrop.receiveShadow = true; scene.add(backdrop);
  backdrop.visible = !mannequinOnly;
  if(mannequinOnly)camera.top = 3;
  const maps = createTextileMaps(renderer);
  const embroideredMaps=mannequinOnly?maps:createTextileMaps(renderer,{embroidered:true});
  const modelTextures = [];
  let disposed = false, aspect = 1, progress = 0, frame = 0, visible = true, mannequin;
  const materials = COLORS.map((color,i) => textileMaterial(color,!mannequinOnly&&[0,4,5].includes(i)?embroideredMaps:maps));
  function piece(index) {
    const mesh = new THREE.Mesh(createTextileGeometry(), materials[index]);
    mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = true; cloth.add(mesh); return mesh;
  }
  const meshes = mannequinOnly ? [piece(0)] : COLORS.map((_, i) => piece(i));
  const lowerCloth = mannequinOnly ? [] : [0, 1, 2].map(i => piece(i));
  const orbits = new THREE.Group(); scene.add(orbits);
  for (let i = 0; i < 3; i++) {
    const points = Array.from({ length: 161 }, (_, j) => {
      const theta = j / 160 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(theta) * 2.65, Math.sin(theta) * .85, Math.sin(theta) * 2.6);
    });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#aa713e', transparent: true, opacity: 0 }));
    line.rotation.z = i * .8; orbits.add(line);
  }
  const petals = new THREE.Group(); scene.add(petals);
  // Sparse leaf shapes follow spatial arcs instead of a rigid ring of particles.
  for (let i = 0; i < 12; i++) {
    const shape = new THREE.Shape(); shape.moveTo(0, -.09); shape.quadraticCurveTo(.1, .02, 0, .12); shape.quadraticCurveTo(-.065, .02, 0, -.09);
    const leaf = new THREE.Mesh(new THREE.ShapeGeometry(shape, 8), materials[i % 6]); leaf.rotation.z = i * 2.4; petals.add(leaf);
  }
  function releaseObject(object) { object.traverse(o => { o.geometry?.dispose(); if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose(); }); }
  if (final) new GLTFLoader().load('/cinematic/atelier-dress-form.glb', gltf => {
    if (disposed) { releaseObject(gltf.scene); return; }
    const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    gltf.scene.position.sub(center);
    gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; if (o.material?.isMeshStandardMaterial) { o.material.roughness = .95; if(mannequinOnly&&o.material.color)o.material.color.multiply(new THREE.Color('#d9c4a2')); const map=maps.map.clone(), normal=maps.normalMap.clone();map.repeat.set(6,6);normal.repeat.set(6,6);modelTextures.push(map,normal);o.material.map = map; o.material.normalMap = normal; o.material.normalScale.set(.16, .16); } } });
    mannequin = new THREE.Group(); mannequin.add(gltf.scene); mannequin.scale.setScalar(5.8 / size.y); mannequin.position.set(mannequinOnly ? 0 : aspect * 2.8, -2.7, 2); scene.add(mannequin); draw();
  });
  function drapeFrame(u, band) {
    const angle = -.9 + u * 1.8;
    const x = (mannequinOnly ? 0 : aspect * 2.8) + .6 - u * 1.15 + Math.sin(u * 3) * .18;
    return { center: new THREE.Vector3(x, -.65 - u * 4.9, 3.1 + Math.cos(angle) * .35),
      side: new THREE.Vector3(1, .45 * (1-u), -.32).normalize(),
      normal: new THREE.Vector3(.3, 0, 1).normalize(), width: .35 + u * 1.5, folds: .12 + u * .05, p: 0, band };
  }
  function draw() {
    if (disposed || !visible) return;
    const started = performance.now();
    const p = Math.max(0, Math.min(6, progress));
    const orbFit=aspect<.6?1-.12*Math.min(1,Math.max(0,p-3))*Math.min(1,Math.max(0,6-p)):1;cloth.scale.setScalar(orbFit);orbits.scale.setScalar(orbFit);petals.scale.setScalar(orbFit);
    cloth.position.y=final?0:-1.05*(1-Math.min(1,p/1.5));
    meshes.forEach((mesh, i) => updateTextileGeometry(mesh.geometry, u => {
      if (final && i === 0) return drapeFrame(u, i);
      const f = fabricFrame(final ? .55 : p, u, i, aspect);
      if (final) { f.center.x -= .5; f.center.y += .15; }
      return f;
    }, i));
    lowerCloth.forEach((mesh, i) => {
      mesh.visible = !final && p > 1;
      if (!mesh.visible) return;
      updateTextileGeometry(mesh.geometry, u => {
        const f = fabricFrame(0, u, i, aspect);
        f.center.y -= .7 + (1 - Math.min(1, p - 1)) * 2 + Math.max(0, p - 5) * 2.5;
        f.center.z -= 1; return f;
      }, i);
    });
    const formation = Math.max(0, Math.min(1, (p - 3.25) / .75));
    orbits.visible = petals.visible = !final && formation > 0;
    orbits.children.forEach(line => { line.material.opacity = .35 * formation; });
    orbits.position.y = 1.25 + Math.max(0, p - 5) * 5; orbits.rotation.y = (p - 4) * .5;
    petals.children.forEach((leaf, i) => {
      const theta = i * 2.399 + p * .38, radius = 2.65 + (i % 3) * .15;
      leaf.position.set(Math.cos(theta) * radius, 1.25 + Math.sin(theta) * radius + Math.max(0, p - 5) * (3 + i * .2), Math.sin(theta * 2) * 1.5 + 1);
      leaf.scale.setScalar(formation * (.5 + (i % 3) * .22)); leaf.rotation.y = theta; leaf.rotation.z = theta * .7;
    });
    if (mannequin) mannequin.position.x = mannequinOnly ? 0 : aspect * 2.8;
    renderer.render(scene, camera);
    if(import.meta.env.DEV)canvas.dataset.renderMs=(performance.now()-started).toFixed(2);
    onReady();
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect(); if (!width || !height) return;
    aspect = width / height; camera.left = -(mannequinOnly ? 4 : 5) * aspect; camera.right = (mannequinOnly ? 4 : 5) * aspect; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); draw();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) draw(); }); intersection.observe(canvas);
  function themeLighting(){
    const dark=document.documentElement.dataset.theme==='dark';
    ambient.intensity=dark?.64:1.25;
    key.intensity=dark?(mannequinOnly?2.3:3.35):(mannequinOnly?2.5:3.4);
    key.color.set(dark?'#f4dfbc':'#fff5e0');rim.intensity=dark?2.15:1.8;fill.intensity=dark?.4:.45;
    rim.color.set(dark?'#e3b87d':'#f9e4c3');
    renderer.toneMappingExposure=dark?1.02:(mannequinOnly?1.02:1.18);
    draw();
  }
  const themeObserver=new MutationObserver(themeLighting);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  resize();themeLighting();
  return {
    setProgress(p) { progress = p; cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); },
    dispose() { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); themeObserver.disconnect(); releaseObject(scene); [...new Set([...Object.values(maps),...Object.values(embroideredMaps),...modelTextures])].forEach(t => t.dispose()); key.shadow.map?.dispose(); renderer.dispose(); },
  };
}
