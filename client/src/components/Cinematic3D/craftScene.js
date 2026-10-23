import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { evaluateCamera, range, envelope, smoothstep } from './timeline';
import { photographs } from './photography';

const mix=T.MathUtils.lerp, ease=(t,a,b)=>smoothstep(range(t,a,b));
const INK=new T.Color('#24211e'), PAPER=new T.Color('#f2ede3');
const placements=[
 ['artisan-workbench',[0,-2.1,0],[0,0,0],2],
 ['cutting-mat',[0,-.20,.1],[0,0,0],1.8],
 ['thread-spool',[-1.5,.05,-.5],[0,0,.15],1],
 ['sewing-needle',[.8,-.13,.45],[-Math.PI/2,0,-.5],.9],
 ['dressmaking-scissors',[1.7,-.12,.2],[-Math.PI/2,0,.7],1.15],
 ['seam-ripper',[-1.5,-.1,.85],[-Math.PI/2,0,-.3],1.2],
 ['brass-thimble',[.9,-.1,-.8],[0,0,0],1.2],
 ['pin-cushion',[1.85,-.07,-1],[0,0,0],1.2],
 ['folded-linen',[-2,-.12,-.65],[0,.2,0],1.3],
 ['draped-swatch',[-2,-.4,1.1],[-.7,0,.2],1.2],
 ['garment-pattern',[1.1,-.15,-.4],[-Math.PI/2,0,-.25],1.3],
 ['tailors-ruler',[-.9,-.1,1.2],[0,.3,0],1.5],
 ['task-lamp',[-2,.05,-1.25],[0,.8,0],1.6],
 ['hoop-stand',[0,-.08,-.5],[0,0,0],.9],
 ['sewing-bobbin',[-1,.03,-1.25],[0,0,.2],1.5],
 ['fabric-roll',[2,-.05,.95],[0,0,0],1.1],
];

/** Actual WebGL scene. No clock, scroll listener, GSAP ticker or autonomous loop. */
export function createCraftScene(canvas,invalidate) {
 let disposed=false, width=1,height=1, loaded=0, lastFrameMs=0;
 const renderer=new T.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const scene=new T.Scene();scene.background=INK.clone();
 const camera=new T.PerspectiveCamera(34,1,.02,70);
 scene.add(new T.HemisphereLight('#f6ede0','#3d3028',2.1));
 const key=new T.DirectionalLight('#fff0dc',4);key.position.set(-3,5,6);scene.add(key);
 const rim=new T.DirectionalLight('#dba976',3);rim.position.set(4,1,-3);scene.add(rim);
 const fill=new T.DirectionalLight('#dfe8e3',1.3);fill.position.set(2,-1,4);scene.add(fill);
 const objectRoot=new T.Group(), hoop=new T.Group(), wire=new T.Group();
 objectRoot.add(hoop,wire);scene.add(objectRoot);
 const woven=new T.Group();hoop.add(woven);
 const strandGeo=new T.CylinderGeometry(.0018,.0018,1,5,1),strandMat=new T.MeshStandardMaterial({color:'#dbcfb5',roughness:.94});
 const dummy=new T.Object3D();
 for(let axis=0;axis<2;axis++){
  const strands=new T.InstancedMesh(strandGeo,strandMat,160);
  for(let i=0;i<160;i++){const x=(i/159-.5)*1.48,len=2*Math.sqrt(Math.max(0,.743*.743-x*x));dummy.position.set(axis?0:x,axis?x:0,-.0005+axis*.001);dummy.rotation.set(0,0,axis?Math.PI/2:0);dummy.scale.set(1,len,1);dummy.updateMatrix();strands.setMatrixAt(i,dummy.matrix);}
  woven.add(strands);
 }
 const bench=new T.Group();scene.add(bench);
 const gallery=new T.Group();scene.add(gallery);
 const feature=new T.Group();scene.add(feature);
 const textures=new Map(), resources=new Set(), parts=[],cards=[],featureCards=[];
 const loader=new GLTFLoader(), textureLoader=new T.TextureLoader();
 const register=object=>{object.traverse(child=>{if(child.geometry)resources.add(child.geometry);if(child.material){for(const m of Array.isArray(child.material)?child.material:[child.material])resources.add(m);}});return object;};
 register(woven);
 const paperMaterial=new T.MeshStandardMaterial({color:'#d7c9b1',side:T.DoubleSide,roughness:.95});
 const wrappers=[-1,1].map(sign=>{
  const geo=new T.PlaneGeometry(.98,1.98,20,20);
  // A curved, subdivided sheet pivots around its inner seam.
  const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){pos.setX(i,pos.getX(i)+sign*.49);pos.setZ(i,.045*Math.sin(pos.getY(i)*5));}geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,paperMaterial);mesh.position.z=.12;scene.add(mesh);register(mesh);return mesh;
 });
 const splitMaterial=new T.MeshStandardMaterial({color:'#e9dfcd',side:T.DoubleSide,roughness:1});
 const splits=[1,-1].map(sign=>{const mesh=new T.Mesh(new T.PlaneGeometry(6,2.5,12,12),splitMaterial);mesh.position.set(0,sign*1.25,.08);scene.add(mesh);register(mesh);return mesh;});
 const backgroundPhoto=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false}));backgroundPhoto.renderOrder=10;scene.add(backgroundPhoto);register(backgroundPhoto);
 const floor=new T.Mesh(new T.PlaneGeometry(35,35),new T.MeshStandardMaterial({color:'#4a4035',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.17;bench.add(floor);register(floor);
 // Soft physical scale cue, avoiding expensive shadow maps on mobile GPUs.
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
 const ctx=shadowCanvas.getContext('2d'),grad=ctx.createRadialGradient(64,64,4,64,64,64);grad.addColorStop(0,'#00000070');grad.addColorStop(1,'#00000000');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
 const shadowMap=new T.CanvasTexture(shadowCanvas);resources.add(shadowMap);
 const shadow=new T.Mesh(new T.PlaneGeometry(2.7,2.7),new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.18;bench.add(shadow);register(shadow);
 const target=new T.Vector3(),offset=new T.Vector3();
 const resize=()=>{
  width=canvas.clientWidth||window.innerWidth;height=canvas.clientHeight||window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,width<700?1.25:1.5));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();invalidate();
 };
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 const loadTexture=async(spec)=>{
  const tx=await textureLoader.loadAsync(spec.url);if(disposed){tx.dispose();return;}
  if(spec.kind==='color'||spec.kind==='environment')tx.colorSpace=T.SRGBColorSpace;
  tx.name=spec.id;tx.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  if(spec.kind!=='environment'){tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(spec.id.startsWith('linen')?7:spec.id.startsWith('oak')?12:2,spec.id.startsWith('linen')?7:2);}
  resources.add(tx);textures.set(spec.id,tx);loaded++;invalidate();return tx;
 };
 const applyMaps=(root)=>root.traverse(child=>{
  if(!child.isMesh)return;
  const name=child.name,mat=child.material;
  if(/linen|fabric-fold|linen-swatch|cushion/.test(name)){mat.map=textures.get('linen-albedo');mat.bumpMap=textures.get('linen-bump');mat.bumpScale=.009;mat.roughnessMap=textures.get('linen-roughness');}
  if(/oak|wood|bench|ruler-body|stand/.test(name)){mat.color.set('#b9b0a2');mat.map=textures.get('oak-albedo');mat.bumpMap=textures.get('oak-bump');mat.bumpScale=.002;}
  if(/indigo|bobbin-thread/.test(name))mat.map=textures.get('indigo-weave');
  if(/embroidered-petal|thread-wrap|trailing-thread/.test(name))mat.map=textures.get('clay-thread');
  if(/pattern-paper/.test(name))mat.map=textures.get('pattern-paper-grid');
  mat.needsUpdate=true;
 });
 const makeCard=(tx,w,h)=>{
  const map=tx.clone();resources.add(map);map.needsUpdate=true;
  const aspect=tx.image.width/tx.image.height,ratio=w/h;
  if(aspect>ratio){map.repeat.set(ratio/aspect,1);map.offset.set((1-map.repeat.x)/2,0);}else{map.repeat.set(1,aspect/ratio);map.offset.set(0,(1-map.repeat.y)/2);}
  const plane=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,side:T.DoubleSide}));register(plane);return plane;
 };
 const load=async()=>{
  const response=await fetch('/cinematic/models.json');if(!response.ok)throw new Error('Craft asset manifest did not load');const manifest=await response.json();
  await Promise.all(manifest.textures.map(loadTexture));if(disposed)return;
  const env=textures.get('studio-environment');env.mapping=T.EquirectangularReflectionMapping;scene.environment=env;scene.environmentIntensity=.35;
  paperMaterial.map=textures.get('pattern-paper-grid');paperMaterial.needsUpdate=true;
  splitMaterial.map=textures.get('linen-albedo');splitMaterial.bumpMap=textures.get('linen-bump');splitMaterial.bumpScale=.012;splitMaterial.needsUpdate=true;
  const primary=await loader.loadAsync('/cinematic/embroidery-hoop.glb');if(disposed){primary.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return;}
  applyMaps(primary.scene);hoop.add(primary.scene);register(primary.scene);loaded++;
  primary.scene.traverse(child=>{if(child.isMesh){parts.push({mesh:child,position:child.position.clone(),quaternion:child.quaternion.clone()});const line=new T.Mesh(child.geometry,new T.MeshBasicMaterial({color:'#c7ae80',wireframe:true,transparent:true,opacity:.7}));child.updateWorldMatrix(true,false);line.applyMatrix4(child.matrixWorld);line.userData.source=child;wire.add(line);register(line);}});
  invalidate();
  // Stream only three independent props at a time; the first object is already rendered.
  let next=0;
  await Promise.all(Array.from({length:3},async()=>{while(next<placements.length){const [id,position,rotation,scale]=placements[next++];const gltf=await loader.loadAsync(`/cinematic/${id}.glb`);if(disposed){gltf.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return;}const prop=gltf.scene;applyMaps(prop);prop.position.fromArray(position);prop.rotation.set(...rotation);prop.scale.setScalar(scale);bench.add(prop);register(prop);loaded++;invalidate();}}));
  // Batch static tool geometry by actual PBR material to keep the workshop cheap.
  bench.updateMatrixWorld(true);
  const batches=new Map(),old=[],toBench=new T.Matrix4().copy(bench.matrixWorld).invert();
  bench.traverse(child=>{if(!child.isMesh||child===floor||child===shadow)return;const material=child.material;
    const id=[material.color?.getHex(),material.map?.name,material.metalness,material.roughness].join(':');
    if(!batches.has(id))batches.set(id,{geometries:[],material});
    const geometry=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone());
    geometry.applyMatrix4(new T.Matrix4().multiplyMatrices(toBench,child.matrixWorld));
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    if(!geometry.attributes.uv)geometry.setAttribute('uv',new T.BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
    for(const attribute of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(attribute))geometry.deleteAttribute(attribute);
    geometry.clearGroups();batches.get(id).geometries.push(geometry);old.push(child);
  });
  for(const child of old)child.removeFromParent();
  for(const {geometries,material} of batches.values()){const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(merged){const mesh=new T.Mesh(merged,material);bench.add(mesh);register(mesh);}}
  for(let i=0;i<photographs.length;i++){
   const tx=await textureLoader.loadAsync(`/images/${photographs[i].src}`);if(disposed){tx.dispose();return;}tx.colorSpace=T.SRGBColorSpace;resources.add(tx);
   const card=makeCard(tx,2.35,3.8);gallery.add(card);cards.push(card);
   const detail=makeCard(tx,i%2?1.5:3.5,3.1);feature.add(detail);featureCards.push(detail);
   if(i===7){backgroundPhoto.material.map=tx;backgroundPhoto.material.needsUpdate=true;}
   invalidate();
  }
  await renderer.compileAsync(scene,camera);invalidate();
 };
 const render=(t,dt)=>{
  if(disposed)return;
  const begin=performance.now();
  const cp=evaluateCamera(t);camera.position.fromArray(cp.position);target.fromArray(cp.target);
  // Portrait devices retain the complete material study.
  if(width/height<.8){camera.position.z*=1.4;cp.fov=42;}
  camera.fov=cp.fov;camera.lookAt(target);camera.updateProjectionMatrix();
  const paper=envelope(t,57.5,58.4,63.3,64);scene.background.copy(INK).lerp(PAPER,paper);
  const workshop=envelope(t,35.3,37,41.7,43.5)+envelope(t,48.2,49,51.7,52.8);
  bench.visible=workshop>.001;bench.position.y=-(1-workshop)*4;
  const showHoop=envelope(t,1.1,2,19,20.5)+envelope(t,36.4,37.2,45.2,45.8)+envelope(t,48.1,48.6,57,57.7)+envelope(t,62.1,62.3,63.4,63.8)+envelope(t,68,68.6,71,71.6);
  objectRoot.visible=showHoop>.001;
  objectRoot.position.set(0,0,0);objectRoot.rotation.set(0,0,0);objectRoot.scale.setScalar(t<25&&width>=700?.72:1);
  hoop.rotation.set(0,0,0);hoop.position.set(0,0,0);hoop.scale.setScalar(1);
  if(t<6.2){const settle=1-ease(t,5.6,6.2);hoop.rotation.set(-.1*settle,range(t,2,6.2)*Math.PI*2,-.08*settle);}
  if(t>=15.5&&t<20.5){hoop.rotation.y=ease(t,15.5,17)*Math.PI*2;hoop.rotation.x=-ease(t,18.3,19.5)*.55;hoop.position.y=ease(t,18.5,20)*1.4;hoop.scale.setScalar(1-ease(t,19,20.5)*.85);}
  if(t>=35&&t<42){hoop.rotation.x=mix(-.15,-Math.PI/2,ease(t,40.5,41.5));hoop.position.y=mix(.72,-.10,ease(t,40.5,41.5));hoop.rotation.z=.2+ease(t,40.5,42)*.9;}
  const explode=envelope(t,41.5,43,44.6,45.5);
  if(t>=41.5&&t<46){hoop.position.y=mix(-.1,0,ease(t,41.5,43));hoop.rotation.x=mix(-Math.PI/2,-.1,ease(t,41.5,43));hoop.rotation.y=.25*explode;hoop.rotation.z=mix(.2,1.1,ease(t,40.5,42))*(1-ease(t,42,43));}
  for(let i=0;i<parts.length;i++){
   const {mesh,position,quaternion}=parts[i];mesh.position.copy(position);mesh.quaternion.copy(quaternion);
   const z=/outer/.test(mesh.name)?-.5:/inner/.test(mesh.name)?-.2:/linen/.test(mesh.name)?.15:/clamp/.test(mesh.name)?.45:1.0;
   mesh.position.z+=explode*z;
   if(/petal|leaf/.test(mesh.name)){mesh.position.x+=position.x*explode*.5;mesh.position.y+=position.y*explode*.5;}
  }
  wire.visible=explode>.01;wire.rotation.copy(hoop.rotation);wire.position.copy(hoop.position);wire.scale.setScalar(1.005);
  for(const line of wire.children){const source=line.userData.source;line.position.copy(source.position);line.quaternion.copy(source.quaternion);line.material.opacity=.32*explode;}
  if(t>=48&&t<52.6){hoop.rotation.x=mix(-Math.PI/2,0,ease(t,48.3,50));hoop.rotation.y=ease(t,48.3,50)*Math.PI*2;hoop.position.y=mix(-.1,-.4,ease(t,50,51.5));}
  woven.visible=t>=52.5&&t<57.5;
  if(t>=52.5&&t<58){hoop.rotation.set(0,0,0);hoop.position.y=0;}
  if(t>=62&&t<64){hoop.scale.setScalar(.6);hoop.rotation.y=range(t,62,64)*Math.PI*2;}
  if(t>=68){hoop.scale.setScalar(.6);hoop.position.y=-.65;hoop.rotation.y=(t-68)*1.3;}
  const unwrap=envelope(t,16.4,17.2,19.2,20.2),peel=ease(t,18.2,19.4);
  wrappers.forEach((mesh,i)=>{const sign=i?1:-1;mesh.visible=unwrap>.001;mesh.position.x=sign*peel*2.4;mesh.position.y=peel*.3;mesh.rotation.y=sign*peel*1.8;mesh.scale.setScalar(unwrap*(width>=700?.72:1));});
  gallery.visible=t>=19.4&&t<36.1;
  const rail=range(t,20.4,34.5)*7;
  cards.forEach((card,i)=>{const d=i-rail,active=Math.max(0,1-Math.abs(d));card.position.set(d*1.72,0,-Math.abs(d)*.25);card.scale.setScalar(mix(.21,1,smoothstep(active)));card.rotation.y=-d*.04;});
  const expansion=ease(t,34.6,35.7);
  if(cards[7]&&t>=34.6){cards[7].scale.setScalar(mix(1,3.1,expansion));cards[7].position.x=0;}
  const photoFade=envelope(t,35.1,35.6,36.1,37);
  backgroundPhoto.visible=photoFade>.001;backgroundPhoto.material.opacity=photoFade;
  if(backgroundPhoto.visible){camera.getWorldDirection(offset);backgroundPhoto.position.copy(camera.position).addScaledVector(offset,1);backgroundPhoto.quaternion.copy(camera.quaternion);const h=2*Math.tan(T.MathUtils.degToRad(camera.fov)/2);backgroundPhoto.scale.set(h*camera.aspect,h,1);}
  const split=envelope(t,55.5,55.9,57,57.8),separation=ease(t,55.9,57.7);
  splits.forEach((mesh,i)=>{const sign=i? -1:1;mesh.visible=split>.001;mesh.position.y=sign*(1.25+separation*3);mesh.position.z=.1;});
  feature.visible=t>=63.6&&t<68.1;
  const featureRail=range(t,64,67.5)*7;
  featureCards.forEach((card,i)=>{card.position.set((i-featureRail)*2.8,0,(i%2)*.15);card.rotation.y=(i-featureRail)*.025;});
  // Deterministic studio thermal/warm wipe: material color changes follow scroll.
  const thermal=envelope(t,38,38.6,39.5,40.5);key.color.set('#fff0dc').lerp(new T.Color('#d18a50'),thermal);key.intensity=4+thermal*2;
  renderer.render(scene,camera);lastFrameMs=performance.now()-begin;
  // dt belongs to the scroll controller; rendering duration is recorded separately.
  void dt;
 };
 return {load,render,diagnostics:()=>{
  return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,frameMs:lastFrameMs,assetsLoaded:loaded,renderer:renderer.capabilities.isWebGL2?'webgl2':'webgl'};
 },dispose(){disposed=true;observer.disconnect();resources.forEach(r=>r.dispose());renderer.dispose();}};
}
