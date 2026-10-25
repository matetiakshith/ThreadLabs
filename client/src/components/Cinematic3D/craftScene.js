import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { evaluateCamera, range, envelope, smoothstep } from './timeline';
import { sceneWeights } from './sceneState';
import { setupHand } from './atelierHand';

const ease=(t,a,b)=>smoothstep(range(t,a,b));
const placements=[
 ['artisan-workbench',[.45,-3.04,-.25],[0,0,0],2.15],
 ['cutting-mat',[.65,-1.025,.1],[0,0,0],2.0],
 ['thread-spool',[-1.15,-.71,.35],[0,0,0],1.5],
 ['thread-spool',[2.2,-.71,-.65],[0,0,.04],1.45],
 ['sewing-needle',[.8,-.97,1.0],[-Math.PI/2,0,-.6],1.25],
 ['dressmaking-scissors',[.1,-.98,1.05],[-Math.PI/2,0,.65],1.65],
 ['seam-ripper',[-1.45,-.98,1.2],[-Math.PI/2,0,-.3],1.0],
 ['brass-thimble',[1.45,-.98,.9],[0,0,0],1.6],
 ['pin-cushion',[2.6,-.98,.5],[0,0,0],1.4],
 ['folded-linen',[-1.8,-1.02,-.6],[0,.2,0],1.8],
 ['draped-swatch',[1.7,-1.0,1.3],[-.7,0,.3],1.3],
 ['garment-pattern',[-.6,-.995,-.9],[-Math.PI/2,0,-.25],1.4],
 ['tailors-ruler',[-1.4,-1.0,.9],[0,.3,0],1.5],
 ['task-lamp',[-1.7,-1.0,-1.35],[0,-.3,0],2.25],
 ['hoop-stand',[.08,-.48,-.18],[0,0,0],1.0],
 ['sewing-bobbin',[-1,-.88,-1.25],[0,0,.2],1.5],
 ['fabric-roll',[2.0,-.99,1.25],[0,-.5,0],1.4],
 ['atelier-dress-form',[2.25,-1.2,-2.0],[0,-.25,0],1.45],
 ['atelier-shelf',[2.2,-1.0,-4.0],[0,0,0],1.2],
 ['atelier-measuring-tape',[1.5,-.97,-.15],[0,.1,0],1.2],
 ['atelier-botanical',[-2.25,-1.0,-.2],[0,0,0],1.5],
 ['atelier-botanical',[2.8,-1.0,-.5],[0,1.3,0],.8],
];

/** Persistent physical world: one render entry point, sampled by the scroll owner. */
export function createCraftScene(canvas,invalidate) {
 let disposed=false,width=1,height=1,loaded=0,frameMs=0,lastState={},quality=1.5,slowFrames=0;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color('#25211e');scene.fog=new T.FogExp2('#25211e',.047);
 const camera=new T.PerspectiveCamera(36,1,.05,60),target=new T.Vector3();
 const resources=new Set(),textures=new Map(),parts=[],propRoots=[];
 const register=root=>{root.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])resources.add(m);});return root;};
 const ambient=new T.HemisphereLight('#ead6b7','#292a20',1.15);scene.add(ambient);
 const sun=new T.DirectionalLight('#ffe1ab',3.1);sun.position.set(-3,5,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-4;sun.shadow.camera.near=.5;sun.shadow.camera.far=20;sun.shadow.bias=-.00018;sun.shadow.normalBias=.008;sun.shadow.radius=3;scene.add(sun);
 const fill=new T.DirectionalLight('#e3d9c6',1.0);fill.position.set(4,1,5);scene.add(fill);
 const rim=new T.DirectionalLight('#e8bd72',1.4);rim.position.set(2,3,-3);scene.add(rim);
 const lamp=new T.PointLight('#ffc16b',7,7,2);lamp.position.set(-.7,1,-1);scene.add(lamp);
 const carrier=new T.Group(),hoop=new T.Group();carrier.add(hoop);scene.add(carrier);
 const bench=new T.Group();scene.add(bench);
 const architecture=new T.Group();scene.add(architecture);
 const linen=new T.MeshPhysicalMaterial({name:'world-linen',color:'#e5d2ae',roughness:.95,side:T.DoubleSide,sheen:.25,sheenColor:'#e1cbab'});
 const olive=new T.MeshPhysicalMaterial({name:'world-sage',color:'#616c4a',roughness:.93,side:T.DoubleSide,sheen:.3,sheenColor:'#b4b496'});
 const wood=new T.MeshStandardMaterial({name:'world-oak',color:'#60412a',roughness:.82});
 const brass=new T.MeshStandardMaterial({color:'#b79b69',roughness:.35,metalness:.72});
 const dark=new T.MeshStandardMaterial({color:'#2b2b24',roughness:.95});
 function box(parent,name,size,mat,pos){const m=new T.Mesh(new T.BoxGeometry(...size),mat);m.name=name;m.position.set(...pos);m.receiveShadow=true;parent.add(m);register(m);return m;}
 box(architecture,'atelier-wall',[18,10,.2],new T.MeshStandardMaterial({color:'#332a21',roughness:1}),[0,1,-5.3]);
 box(architecture,'atelier-floor',[18,.15,15],wood,[0,-3.12,-1]);
 // A real window, mullions, sill and linen curtain give the light a physical source.
 const windowLight=new T.MeshStandardMaterial({color:'#d2bd86',emissive:'#d2b675',emissiveIntensity:.55,roughness:1});
 box(architecture,'window-recess',[2.5,4.2,.16],dark,[-4,1,-5.05]);
 box(architecture,'window-light',[2.2,3.8,.04],windowLight,[-4,1,-4.93]);
 for(const x of [-5.1,-4.36,-3.63,-2.9])box(architecture,'wooden-window-mullion',[.065,3.9,.16],wood,[x,1,-4.86]);
 for(const y of [-.9,.35,1.65,2.9])box(architecture,'wooden-window-transom',[2.28,.06,.16],wood,[-4,y,-4.86]);
 box(architecture,'window-sill',[2.55,.1,.35],wood,[-4,-.98,-4.78]);
 function cloth(w,h,segmentsX,segmentsY,mat,fn){
  const g=new T.PlaneGeometry(w,h,segmentsX,segmentsY),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),q=fn(x,y);p.setXYZ(i,...q);}g.computeVertexNormals();
  const m=new T.Mesh(g,mat);m.receiveShadow=true;m.castShadow=true;register(m);return m;
 }
 const drape=cloth(4.8,2.4,100,52,linen,(x,y)=>[x,-.94+.035*Math.cos(x*4+y*4)+.08*Math.sin(x*4.2+.7)*Math.sin(y*1.3+.5),y*.85]);drape.position.set(.45,0,-.1);bench.add(drape);
 const curtain=cloth(.8,4.7,20,60,linen,(x,y)=>[x,y,.09*Math.sin(x*25)+.04*Math.sin(y*1.2)]);curtain.position.set(-2.7,1,-4.7);architecture.add(curtain);
 // Curved fabric is a tessellated textile, animated by absolute bend phase.
 const ribbonGeometry=new T.PlaneGeometry(4.6,.32,100,5),ribbonBase=ribbonGeometry.attributes.position.array.slice();
 const ribbon=new T.Mesh(ribbonGeometry,olive);ribbon.castShadow=true;scene.add(ribbon);register(ribbon);
 const threadPoints=Array.from({length:80},()=>new T.Vector3());
 const redThread=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.16,.38,.08),new T.Vector3(1,0,0),new T.Vector3(2,.3,.2),new T.Vector3(3,1,-1)]),160,.007,7,false),new T.MeshStandardMaterial({color:'#993b25',roughness:.78}));hoop.add(redThread);register(redThread);
 // Original plotted flower: paper lives behind the assembly, never over the face.
 const sketchCanvas=document.createElement('canvas');sketchCanvas.width=768;sketchCanvas.height=768;
 const cx=sketchCanvas.getContext('2d');cx.fillStyle='#ded1ad';cx.fillRect(0,0,768,768);cx.strokeStyle='#a4876240';cx.lineWidth=1;
 for(let x=0;x<768;x+=32){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,768);cx.stroke();cx.beginPath();cx.moveTo(0,x);cx.lineTo(768,x);cx.stroke();}
 const px=x=>384+x*440,py=y=>384-y*440;cx.strokeStyle='#4e5342';cx.lineWidth=2;
 const sketchPath=points=>{cx.beginPath();points.forEach(([x,y],i)=>i?cx.lineTo(px(x),py(y)):cx.moveTo(px(x),py(y)));cx.stroke();};
 sketchPath([[-.1,-.57],[-.01,-.2],[.05,.32]]);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,pts=[];for(let j=0;j<=32;j++){const q=j/32*Math.PI*2,r=.23*Math.sin(q/2);pts.push([.08+Math.cos(a)*r+Math.sin(a)*.06*Math.sin(q),.3+Math.sin(a)*r-Math.cos(a)*.06*Math.sin(q)]);}sketchPath(pts);}
 for(let i=0;i<6;i++){const y=-.45+i*.12,s=i%2?1:-1;sketchPath([[0,y],[s*.22,y+.13],[s*.14,y+.02],[0,y]]);}
 const sketchMap=new T.CanvasTexture(sketchCanvas);sketchMap.colorSpace=T.SRGBColorSpace;resources.add(sketchMap);
 const pattern=new T.Mesh(new T.CircleGeometry(.77,128),new T.MeshStandardMaterial({map:sketchMap,side:T.DoubleSide,roughness:1}));hoop.add(pattern);register(pattern);
 const backingPaper=new T.Mesh(new T.CircleGeometry(.76,128),new T.MeshStandardMaterial({color:'#d6c19d',side:T.DoubleSide,roughness:1}));hoop.add(backingPaper);register(backingPaper);
 // The actual artisan photograph is printed on a shaped, hanging linen panel in
 // the same room. Camera travel and fabric unrolling reveal it spatially.
 const portraitGeometry=new T.PlaneGeometry(2.4,2.5,56,56),portraitBase=portraitGeometry.attributes.position.array.slice();
 const portraitMaterial=new T.MeshStandardMaterial({color:'#ffffff',roughness:1,side:T.DoubleSide});
 const portrait=new T.Mesh(portraitGeometry,portraitMaterial);portrait.name='documentary-artisan-textile';portrait.position.set(.45,.15,-3.7);scene.add(portrait);register(portrait);
 const loom=new T.Group();loom.position.copy(portrait.position);scene.add(loom);
 for(const x of [-1.29,1.29])box(loom,'loom-upright',[.07,3.1,.09],wood,[x,0,-.06]);
 for(const y of [-1.45,1.45])box(loom,'loom-crossbar',[2.7,.09,.12],wood,[0,y,-.06]);
 const warpGeo=new T.CylinderGeometry(.002,.002,2.9,4),warp=new T.InstancedMesh(warpGeo,linen,62),dummy=new T.Object3D();
 for(let i=0;i<62;i++){dummy.position.set(-1.2+i*.039,0,-.12);dummy.updateMatrix();warp.setMatrixAt(i,dummy.matrix);}loom.add(warp);register(warp);
 // Hanging garment carries the very same embroidery geometry during fashion.
 const garmentRoot=new T.Group();garmentRoot.position.set(1.45,.05,-1.3);scene.add(garmentRoot);
 const garment=cloth(1.7,2.5,52,65,olive,(x,y)=>[x*(.70+.18*Math.cos(y*1.8)),y,.12*Math.cos(x*11)+.03*Math.sin(y*3)]);garmentRoot.add(garment);garmentRoot.visible=false;
 let garmentMotif=null,hand=null;
 const loader=new GLTFLoader(),textureLoader=new T.TextureLoader();
 const texture=async(name,url,color=true,repeat=1)=>{const tx=await textureLoader.loadAsync(url);if(disposed){tx.dispose();return null;}if(color)tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(repeat,repeat);tx.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());resources.add(tx);textures.set(name,tx);return tx;};
 function applyMaps(root){root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const m=o.material,n=m.name||'',on=o.name||'';
  if(/atelier-oak|world-oak/.test(n)||/oak|wood|bench|ruler-body|stand/.test(on)){m.map=textures.get('oak');m.normalMap=textures.get('oakNormal');m.normalScale=new T.Vector2(.22,.22);m.color.set('#e8d9c2');m.roughness=.73;}
  if(/atelier-linen|atelier-backing|world-linen/.test(n)||/linen|fabric-fold|linen-swatch|cushion/.test(on)){m.map=textures.get('linen');m.normalMap=textures.get('linenNormal');m.normalScale=new T.Vector2(.38,.38);m.roughnessMap=textures.get('roughness');m.color.set('#fff4df');}
  if(/floss/.test(n)){m.normalMap=textures.get('floss');m.normalScale=new T.Vector2(.3,.3);m.roughness=.83;}
  if(/world-sage/.test(n)){m.map=textures.get('olive');m.normalMap=textures.get('linenNormal');m.normalScale=new T.Vector2(.4,.4);m.color.set('#c6c8a1');}
  m.needsUpdate=true;
 });}
 // Static props are batched by material; the hoop, hand and fabrics stay articulated.
 function batchStatic(root){root.updateMatrixWorld(true);const groups=new Map(),old=[];
  root.traverse(o=>{if(!o.isMesh||o===drape)return;const m=o.material;if(Array.isArray(m))return;const key=[m.color.getHex(),m.map?.uuid,m.normalMap?.uuid,m.metalness,m.roughness,m.emissive?.getHex()].join(':');
   if(!groups.has(key))groups.set(key,{material:m,geometries:[]});const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);
   for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));g.clearGroups();groups.get(key).geometries.push(g);old.push(o);
  });for(const o of old)o.removeFromParent();
  for(const {material,geometries} of groups.values()){const g=mergeGeometries(geometries);geometries.forEach(x=>x.dispose());if(g){const m=new T.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;root.add(m);register(m);}}
 }
 async function load(){
  await Promise.all([
   texture('oak','/cinematic/atelier-oak-color.webp'),texture('oakNormal','/cinematic/atelier-oak-normal.png',false),
   texture('linen','/cinematic/atelier-linen-color.webp',true,9),texture('linenNormal','/cinematic/atelier-linen-normal.png',false,9),
   texture('roughness','/cinematic/atelier-linen-roughness.webp',false,9),texture('floss','/cinematic/atelier-floss-normal.png',false,3),
   texture('olive','/cinematic/atelier-olive-color.webp',true,5),texture('environment','/cinematic/studio-environment.png'),
  ]);if(disposed)return;
  const env=textures.get('environment');env.mapping=T.EquirectangularReflectionMapping;scene.environment=env;scene.environmentIntensity=.35;
  applyMaps(bench);applyMaps(architecture);applyMaps(ribbon);applyMaps(loom);applyMaps(garmentRoot);
  const primary=await loader.loadAsync('/cinematic/atelier-hoop.glb');if(disposed){register(primary.scene);return;}
  applyMaps(primary.scene);hoop.add(primary.scene);register(primary.scene);loaded++;
  primary.scene.traverse(m=>{if(m.isMesh){parts.push({mesh:m,position:m.position.clone(),role:m.userData.role||'',count:m.geometry.index?.count??m.geometry.attributes.position.count});}});
  garmentMotif=new T.Group();for(const {mesh,role}of parts)if(role.startsWith('stitch')){const clone=mesh.clone();garmentMotif.add(clone);}garmentMotif.position.set(-.05,.25,.18);garmentMotif.scale.setScalar(.63);garmentRoot.add(garmentMotif);
  invalidate();
  const handFile=await loader.loadAsync('/cinematic/atelier-hand.glb');if(disposed){register(handFile.scene);return;}
  hand=setupHand(handFile.scene);carrier.add(hand.root);register(hand.root);loaded++;invalidate();
  const portraitTex=await texture('portrait','/images/zardozi-artisan.jpg');if(disposed)return;
  portraitTex.wrapS=portraitTex.wrapT=T.ClampToEdgeWrapping;portraitMaterial.map=portraitTex;portraitMaterial.needsUpdate=true;
  let next=0;await Promise.all(Array.from({length:3},async()=>{while(next<placements.length){const [id,pos,rot,scale]=placements[next++];const file=await loader.loadAsync(`/cinematic/${id}.glb`);register(file.scene);if(disposed)return;applyMaps(file.scene);file.scene.position.set(...pos);file.scene.rotation.set(...rot);file.scene.scale.setScalar(scale);bench.add(file.scene);propRoots.push(file.scene);loaded++;invalidate();}}));
  batchStatic(bench);if(disposed)return;await renderer.compileAsync(scene,camera);invalidate();
 }
 const resize=()=>{width=canvas.clientWidth||innerWidth;height=canvas.clientHeight||innerHeight;quality=Math.min(quality,width<700?1.15:1.5,devicePixelRatio||1);renderer.setPixelRatio(quality);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();invalidate();};
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 const DARK=new T.Color('#25211e'),WARM=new T.Color('#524737'),LAMP=new T.Color('#ffe1ab'),DAY=new T.Color('#fff0d5');
 function render(t,dt){
  if(disposed)return;const begin=performance.now(),s=sceneWeights(t);lastState=s;
  const cp=evaluateCamera(t),mobile=width/height<.8;camera.position.fromArray(cp.position);target.fromArray(cp.target);
  if(mobile){camera.position.x*=.35;camera.position.y+=1.2;camera.position.z*=1.12;target.x=0;target.y=-1.12;camera.fov=42;}else camera.fov=cp.fov;
  camera.lookAt(target);camera.updateProjectionMatrix();
  scene.background.copy(DARK).lerp(WARM,s.daylight*.40);scene.fog.color.copy(scene.background);
  ambient.intensity=1.05+s.daylight*.35;sun.intensity=2.8+s.daylight*.65;sun.color.copy(LAMP).lerp(DAY,s.daylight*.7);lamp.intensity=7-s.daylight*2;
  carrier.position.set(-.02-.55*s.human,.02+.23*s.lift,-.2*s.fashion);
  carrier.rotation.set(-.045+.05*s.lift,.08+.16*s.lift+.32*s.explode,-.06+.07*s.lift);
  // The hoop is always above the tabletop, including reversals and exploded views.
  hoop.position.set(0,0,0);hoop.rotation.set(0,0,0);hoop.scale.setScalar(1-.2*s.human);
  const stack=s.explode;
  for(const part of parts){const {mesh,position,role,count}=part;mesh.position.copy(position);
   const depth=role==='outer-rim'?.58:role==='inner-rim'?-.40:role==='backing'?-.68:role==='linen'?-.05:role.startsWith('stitch')?.23:role==='clamp'||role==='fastener'?.60:0;
   mesh.position.z+=stack*depth;
   mesh.position.x+=stack*(role==='backing'?-.22:role==='inner-rim'?-.10:role==='outer-rim'?.22:0);
   if(role==='stitch-petals'){const a=(mesh.userData.petal||0)*Math.PI/4;mesh.position.x+=Math.cos(a)*stack*.035;mesh.position.y+=Math.sin(a)*stack*.035;}
   const reveal=t>=31&&t<=40?Math.max(.005,ease(t,31+(mesh.userData.petal||0)*.45,35.5+(mesh.userData.petal||0)*.45)):1;
   mesh.geometry.setDrawRange(0,role.startsWith('stitch')?Math.floor(count*reveal/3)*3:count);
  }
  pattern.visible=s.sketch>0;pattern.position.set(-.8*stack,-.02,-.88*stack);pattern.rotation.y=-.4*stack;
  backingPaper.visible=stack>.001;backingPaper.position.set(-.35*stack,0,-.57*stack);backingPaper.rotation.y=-.13*stack;
  if(hand){hand.root.visible=s.hand>.001;hand.pose(s.grip);hand.root.position.set(-.54,-1.20-(1-s.hand)*1.8,.02);hand.root.rotation.set(0,0,-.10);}
  // Textile ribbon stays in the world. Its endpoint follows the central object.
  const rp=ribbonGeometry.attributes.position;
  for(let i=0;i<rp.count;i++){const x=ribbonBase[i*3],v=ribbonBase[i*3+1],u=x/4.6+.5,a=u*Math.PI*2.1+t*.025;const reach=.65+s.ribbon*.40;
   rp.setXYZ(i,.45+Math.cos(a)*reach*1.8+v*Math.sin(a),.15+Math.sin(a)*reach*.95+v*Math.cos(a),-.55+Math.sin(a*1.1)*.45+v*Math.sin(u*6));
  }rp.needsUpdate=true;ribbonGeometry.computeVertexNormals();ribbon.position.y=-.15+s.fashion*.3;ribbon.rotation.z=.10;
  // The red tail retains its attachment to the same flower in every chapter.
  redThread.rotation.set(0,0,0);redThread.scale.set(1,1,1);redThread.position.z=stack*.23;
  const pp=portraitGeometry.attributes.position,unroll=ease(t,51,57);
  for(let i=0;i<pp.count;i++){const x=portraitBase[i*3],y=portraitBase[i*3+1],curl=(1-unroll)*Math.max(0,1.25-y)*2.0;
   pp.setXYZ(i,x,y+.04*Math.sin(x*4)*(1-unroll),.035*Math.sin(x*4)+Math.sin(curl)*(1-unroll)*.5);
  }pp.needsUpdate=true;portraitGeometry.computeVertexNormals();portrait.rotation.y=(1-unroll)*-.35;
  garmentRoot.visible=s.fashion>.001;garmentRoot.scale.setScalar(.65+.35*s.fashion);garmentRoot.position.set(1.1,.1,-1.4+(1-s.fashion)*-3);garmentRoot.rotation.y=-.16+.2*s.fashion;
  // No elapsed-time particle randomization. Fixed sampled poses are repeatable.
  renderer.render(scene,camera);frameMs=performance.now()-begin;
  if(dt<60&&frameMs>26)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
  if(slowFrames>30&&quality>1){quality=Math.max(1,quality-.25);renderer.setPixelRatio(quality);slowFrames=0;}
 }
 return {load,render,diagnostics:()=>({assetsLoaded:loaded,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,frameMs,dpr:quality,camera:camera.position.toArray(),sceneWeights:lastState,handRig:Boolean(hand),handGrip:lastState.grip,hoopParts:parts.length,canvasWidth:width,canvasHeight:height}),dispose(){disposed=true;observer.disconnect();resources.forEach(r=>r.dispose?.());sun.shadow.map?.dispose();renderer.dispose();}};
}
