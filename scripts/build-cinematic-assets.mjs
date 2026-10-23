/**
 * Original ThreadLabs cinematic asset workshop. No external models or textures.
 * Run from the repository root: node scripts/build-cinematic-assets.mjs
 * Geometry is exported as glTF 2.0 GLB with named meshes and standard PBR materials.
 */
import * as T from '../client/node_modules/three/build/three.module.js';
import { GLTFExporter } from '../client/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from '../client/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(v => { this.result = v; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(v => { this.result = `data:${blob.type};base64,${Buffer.from(v).toString('base64')}`; this.onloadend?.(); }); }
};
const out = resolve(import.meta.dirname, '../client/public/cinematic');
await mkdir(out, { recursive: true });
const materials = {
  oak: new T.MeshStandardMaterial({ name: 'warm-oak', color: '#986a44', roughness: .68 }),
  woodEdge: new T.MeshStandardMaterial({ name: 'oak-edge', color: '#c49869', roughness: .63 }),
  cream: new T.MeshStandardMaterial({ name: 'unbleached-linen', color: '#e7dac1', roughness: .93, side: T.DoubleSide }),
  ink: new T.MeshStandardMaterial({ name: 'threadlabs-ink', color: '#252321', roughness: .58 }),
  clay: new T.MeshStandardMaterial({ name: 'threadlabs-clay', color: '#ad6145', roughness: .87 }),
  sage: new T.MeshStandardMaterial({ name: 'muted-sage', color: '#65705b', roughness: .89 }),
  blue: new T.MeshStandardMaterial({ name: 'natural-indigo', color: '#344b63', roughness: .91 }),
  gold: new T.MeshStandardMaterial({ name: 'brushed-brass', color: '#bc9456', metalness: .72, roughness: .32 }),
  steel: new T.MeshStandardMaterial({ name: 'polished-steel', color: '#bcbcb6', metalness: .88, roughness: .24 }),
  paper: new T.MeshStandardMaterial({ name: 'pattern-paper', color: '#d6c29b', roughness: 1, side: T.DoubleSide }),
};
const group = name => { const g = new T.Group(); g.name = name; return g; };
function mesh(g, name, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const m = new T.Mesh(geometry, materials[mat] ?? mat); m.name = name; m.position.set(...position); m.rotation.set(...rotation); g.add(m); return m;
}
const box = (g, name, size, mat, pos, rot) => mesh(g, name, new T.BoxGeometry(...size), mat, pos, rot);
const cylinder = (g, name, top, bottom, length, mat, pos, rot, n = 24) => mesh(g, name, new T.CylinderGeometry(top, bottom, length, n), mat, pos, rot);
const ring = (g, name, r, tube, mat, pos, rot) => mesh(g, name, new T.TorusGeometry(r, tube, 8, 64), mat, pos, rot);
const line = (g, name, points, radius, mat, segments = 40) => mesh(g, name, new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), segments, radius, 5, false), mat);
const models = [];
async function save(id, g, purpose) {
  g.updateMatrixWorld(true);
  const glb = await new GLTFExporter().parseAsync(g, { binary: true, onlyVisible: true });
  // Parse each exported binary with the real runtime loader before saving it.
  const loaded = await new GLTFLoader().parseAsync(glb, '');
  let count = 0;
  loaded.scene.traverse(o => {
    if (!o.isMesh) return;
    count++;
    if (!o.geometry.attributes.position.array.every(Number.isFinite)) throw new Error(`${id}: nonfinite vertices`);
  });
  if (!count) throw new Error(`${id}: no exported meshes`);
  await writeFile(resolve(out, `${id}.glb`), Buffer.from(glb));
  const bounds = new T.Box3().setFromObject(g), dims = bounds.getSize(new T.Vector3());
  models.push({ id, url: `/cinematic/${id}.glb`, bytes: glb.byteLength, dimensions: dims.toArray().map(n => +n.toFixed(3)), purpose, source: 'Original procedural ThreadLabs geometry', license: 'Project-owned original; CC0-1.0 for reusable geometry', meshes: [] });
  g.traverse(o => { if (o.isMesh) models.at(-1).meshes.push(o.name); });
}

// The central object: +Z is the embroidered face. Wood and textile are separate
// meshes so the master scene can unfold / explode / reassemble them independently.
{
  const g = group('embroidery-hoop');
  ring(g, 'outer-oak-hoop', .8, .047, 'oak');
  ring(g, 'inner-oak-hoop', .745, .023, 'woodEdge', [0, 0, .004]);
  cylinder(g, 'linen-disc', .747, .747, .018, 'cream', [0, 0, -.012], [Math.PI / 2, 0, 0], 64);
  box(g, 'hoop-clamp-left', [.11, .09, .09], 'oak', [-.07, .84, 0]);
  box(g, 'hoop-clamp-right', [.11, .09, .09], 'oak', [.07, .84, 0]);
  cylinder(g, 'clamp-screw', .012, .012, .23, 'gold', [0, .85, 0], [0, 0, Math.PI / 2], 10);
  cylinder(g, 'clamp-head', .028, .028, .024, 'gold', [.13, .85, 0], [0, 0, Math.PI / 2], 12);
  // Original ThreadLabs botanical embroidery. Raised paths read as thread in macro shots.
  line(g, 'embroidered-stem', [[-.08, -.56, .016], [.02, -.2, .02], [-.02, .14, .02], [.1, .44, .02]], .013, 'sage');
  for (let i = 0; i < 8; i++) {
    const theta = i * Math.PI / 4, cx = .1, cy = .28;
    const points = Array.from({ length: 17 }, (_, j) => {
      const t = j / 16 * Math.PI * 2, r = .19 * Math.sin(t / 2);
      return [cx + Math.cos(theta) * r + Math.sin(theta) * .054 * Math.sin(t), cy + Math.sin(theta) * r - Math.cos(theta) * .054 * Math.sin(t), .025];
    });
    line(g, `embroidered-petal-${i}`, points, .009, i % 2 ? 'clay' : 'gold', 24);
  }
  for (let i = 0; i < 5; i++) {
    const y = -.45 + i * .12, side = i % 2 ? 1 : -1;
    line(g, `embroidered-leaf-${i}`, [[0,y,.022],[side*.21,y+.14,.023],[side*.15,y+.02,.023],[0,y,.022]], .012, 'sage', 20);
  }
  cylinder(g, 'flower-center', .044, .044, .024, 'gold', [.1, .28, .034], [Math.PI/2,0,0], 16);
  await save('embroidery-hoop', g, 'Primary round craft object, hand grab, rotation, deconstruction and macro embroidery reveal.');
}
{
  const g = group('thread-spool');
  cylinder(g, 'thread-core', .12, .12, .35, 'clay');
  cylinder(g, 'spool-top', .17, .17, .035, 'oak', [0,.195,0]);
  cylinder(g, 'spool-base', .17, .17, .035, 'oak', [0,-.195,0]);
  for(let i=0;i<24;i++) ring(g, `thread-wrap-${i}`, .122, .004, 'clay', [0, -.165 + i * .014, 0], [Math.PI/2,0,0]);
  line(g,'trailing-thread',[[.12,-.15,0],[.3,-.21,.1],[.5,-.21,.06],[.6,-.2,.25]],.004,'clay');
  await save('thread-spool',g,'Loose clay thread material, workshop and exploded craft components.');
}
{
  const g=group('sewing-needle');
  cylinder(g,'needle-shaft',.005,.009,.73,'steel',[0,-.07,0],undefined,8);
  cylinder(g,'needle-point',.006,0,.12,'steel',[0,-.495,0],undefined,8);
  const eye=ring(g,'needle-eye',.026,.006,'steel',[0,.315,0]); eye.scale.x=.38; eye.scale.y=1.6;
  line(g,'needle-thread',[[-.3,.1,.008],[-.1,.2,.008],[0,.34,.008],[.1,.47,0],[.4,.37,0]],.003,'gold');
  await save('sewing-needle',g,'Needle and eye for hand manipulation and close textile stitching.');
}
{
  const g=group('dressmaking-scissors');
  for(const side of [-1,1]) {
    const h=ring(g,`${side<0?'left':'right'}-handle`,.11,.022,'gold',[side*.12,-.25,0]); h.scale.y=1.3;
    const shape=new T.Shape(); shape.moveTo(side*.018,-.12);shape.lineTo(side*.065,.5);shape.quadraticCurveTo(side*.015,.46,side*-.04,.03);shape.closePath();
    mesh(g,`${side<0?'left':'right'}-blade`,new T.ExtrudeGeometry(shape,{depth:.016,bevelEnabled:false}),'steel',[0,0,-.008]);
    line(g,`${side<0?'left':'right'}-shank`,[[side*.11,-.15,0],[side*.07,-.08,0],[0,0,0]],.019,'gold',12);
  }
  cylinder(g,'scissor-pivot',.024,.024,.045,'gold',[0,0,0],[Math.PI/2,0,0],12);
  await save('dressmaking-scissors',g,'Garment cutting tool in workshop and component spread.');
}
{
  const g=group('seam-ripper');
  cylinder(g,'wooden-handle',.047,.035,.35,'oak',[0,-.18,0]);
  line(g,'ripper-hook',[[0,0,0],[0,.2,0],[.055,.27,0],[.1,.32,0]],.008,'steel',16);
  line(g,'ripper-fork',[[0,.17,0],[-.03,.22,0],[-.05,.25,0]],.008,'steel',10);
  mesh(g,'clay-safety-tip',new T.SphereGeometry(.015,10,8),'clay',[-.05,.25,0]);
  await save('seam-ripper',g,'Small sewing tool with open hook and capped fork.');
}
{
  const g=group('brass-thimble');
  cylinder(g,'thimble-body',.075,.105,.19,'gold',[0,.095,0]);
  mesh(g,'thimble-dome',new T.SphereGeometry(.075,20,10,0,Math.PI*2,0,Math.PI/2),'gold',[0,.19,0]);
  for(let row=0;row<4;row++) for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const r=.098-row*.006;mesh(g,`dimple-${row}-${i}`,new T.SphereGeometry(.005,5,4),'ink',[Math.cos(a)*r,.025+row*.04,Math.sin(a)*r]);}
  await save('brass-thimble',g,'Protective hand tool, brass material and close-up scale cue.');
}
{
  const g=group('pin-cushion');mesh(g,'cushion',new T.SphereGeometry(.18,24,12),'clay',[0,.07,0]).scale.set(1,.55,1);
  for(let i=0;i<7;i++){const a=i*2.399,r=.04+(i%3)*.035,x=Math.cos(a)*r,z=Math.sin(a)*r; cylinder(g,`pin-${i}`, .003,.003,.18,'steel',[x,.17,z],undefined,6);mesh(g,`pin-head-${i}`,new T.SphereGeometry(.012,8,6),i%2?'cream':'gold',[x,.265,z]);}
  await save('pin-cushion',g,'Sewing pin cluster for workshop environment and exploded spread.');
}
{
  const g=group('folded-linen');
  for(let i=0;i<5;i++)box(g,`fabric-fold-${i}`,[.8-i*.012,.028,.52],i===4?'cream':i%2?'paper':'cream',[i*.008,i*.028,0]);
  for(let i=0;i<5;i++)line(g,`fold-edge-${i}`,[[-.39,i*.028, .26],[-.42,i*.028+.014,.22],[-.39,i*.028+.028,.26]],.009,'cream',12);
  await save('folded-linen',g,'Unbleached folded cloth, workshop stack and material transformation.');
}
{
 const g=group('draped-swatch'); const geo=new T.PlaneGeometry(.9,.95,18,18);const p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,.05*Math.sin(x*20)+.025*Math.cos(y*8));}geo.computeVertexNormals();
 mesh(g,'linen-swatch',geo,'cream');
 for(let i=0;i<14;i++)line(g,`hem-stitch-${i}`,[[i*.06-.4,-.43,.025],[i*.06-.37,-.43,.025]],.002,'clay',2);
 await save('draped-swatch',g,'Subdivided draped textile with visible sewn hem.');
}
{
 const g=group('garment-pattern');const s=new T.Shape();s.moveTo(-.32,-.52);s.lineTo(.32,-.52);s.lineTo(.28,.17);s.lineTo(.43,.23);s.lineTo(.31,.48);s.lineTo(.13,.53);s.quadraticCurveTo(0,.38,-.13,.53);s.lineTo(-.31,.48);s.lineTo(-.43,.23);s.lineTo(-.28,.17);s.closePath();
 mesh(g,'bodice-pattern-paper',new T.ShapeGeometry(s),'paper');
 for(let i=0;i<12;i++)box(g,`grainline-mark-${i}`,[.003,.026,.001],'ink',[0,i*.065-.4,.002]);
 line(g,'waist-mark',[[-.29,-.25,.003],[.29,-.25,.003]],.002,'ink',2);
 await save('garment-pattern',g,'Original bodice pattern, technical blueprint and garment construction sequence.');
}
{
 const g=group('tailors-ruler');box(g,'ruler-body',[1.1,.045,.075],'woodEdge');
 for(let i=0;i<=40;i++)box(g,`ruler-tick-${i}`,[.002,.002,i%5===0?.044:.022],'ink',[-.5+i*.025,.023,-.014]);
 await save('tailors-ruler',g,'Scaled wood ruler with forty marks for technical composition.');
}
{
 const g=group('cutting-mat');box(g,'mat-base',[1.4,.025,.95],'sage');
 for(let i=0;i<14;i++)box(g,`mat-grid-x-${i}`,[.002,.001,.85],'cream',[-.65+i*.1,.013,0]);
 for(let i=0;i<9;i++)box(g,`mat-grid-z-${i}`,[1.3,.001,.002],'cream',[0,.014,-.4+i*.1]);
 await save('cutting-mat',g,'Sage cutting surface with measured grid in workshop.');
}
{
 const g=group('artisan-workbench');box(g,'bench-top',[3.3,.16,1.8],'oak',[0,.85,0]);
 for(const x of [-1.3,1.3])for(const z of [-.65,.65])box(g,`bench-leg-${x}-${z}`,[.12,.8,.12],'ink',[x,.4,z]);
 box(g,'bench-crossbar',[2.7,.09,.1],'oak',[0,.22,.65]);box(g,'bench-front-edge',[3.35,.07,.08],'woodEdge',[0,.87,.94]);
 await save('artisan-workbench',g,'Craft workbench establishing a physical artisan studio environment.');
}
{
 const g=group('task-lamp');cylinder(g,'lamp-base',.23,.25,.045,'ink');
 line(g,'lamp-stem',[[0,.02,0],[0,.5,0],[.32,.86,0],[.49,.68,0]],.025,'gold',16);
 mesh(g,'lamp-shade',new T.ConeGeometry(.2,.2,24,1,true),'ink',[.49,.62,0]);
 cylinder(g,'lamp-diffuser',.16,.16,.012,new T.MeshStandardMaterial({name:'warm-lamp-diffuser',color:'#ffdf9a',emissive:'#f4a744',emissiveIntensity:.6}),[.49,.52,0]);
 await save('task-lamp',g,'Warm task lighting fixture for environmental context; scene supplies light.');
}
{
 const g=group('hoop-stand');box(g,'stand-foot',[.65,.06,.48],'oak',[0,-.58,0]);
 cylinder(g,'stand-upright',.028,.04,.82,'oak',[0,-.15,0]);
 box(g,'stand-bracket',[.38,.07,.07],'woodEdge',[0,.26,0]);
 for(const x of [-.18,.18])box(g,`clamp-${x}`,[.045,.16,.14],'oak',[x,.3,0]);
 cylinder(g,'stand-knob',.044,.044,.1,'gold',[.24,.29,0],[0,0,Math.PI/2]);
 await save('hoop-stand',g,'Separately articulated embroidery support for hoop placement and release.');
}
{
 const g=group('sewing-bobbin');cylinder(g,'bobbin-core',.07,.07,.13,'gold');
 for(const y of [-.08,.08]) { cylinder(g,`bobbin-rim-${y}`,.13,.13,.018,'steel',[0,y,0]); for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cylinder(g,`bobbin-hole-${y}-${i}`,.016,.016,.02,'ink',[Math.cos(a)*.095,y,Math.sin(a)*.095],undefined,8);}}
 for(let i=0;i<12;i++)ring(g,`bobbin-thread-${i}`,.072,.003,'blue',[0,-.058+i*.011,0],[Math.PI/2,0,0]);
 await save('sewing-bobbin',g,'Machine bobbin, indigo thread and machined metal insert.');
}
{
 const g=group('fabric-roll');cylinder(g,'fabric-roll-core',.13,.13,.9,'paper',undefined,[0,0,Math.PI/2]);
 cylinder(g,'rolled-indigo-fabric',.19,.19,.82,'blue',undefined,[0,0,Math.PI/2]);
 const geo=new T.PlaneGeometry(.82,.6,12,16),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setXYZ(i,x,-.12+.06*Math.sin((y+.3)*5),.1+y+.3);}geo.computeVertexNormals();mesh(g,'unrolled-fabric-tail',geo,'blue');
 await save('fabric-roll',g,'Indigo textile roll with curved unrolled tail for material transitions.');
}

// Small original deterministic texture maps, written without native image dependencies.
const table=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const crc=b=>{let c=0xffffffff;for(const v of b)c=table[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
const chunk=(type,data)=>{const t=Buffer.from(type),l=Buffer.alloc(4),c=Buffer.alloc(4);l.writeUInt32BE(data.length);c.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([l,t,data,c]);};
async function png(id,w,h,pixel,purpose,kind='color') {
 const raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++){raw[y*(w*3+1)]=0;for(let x=0;x<w;x++){const rgb=pixel(x,y);for(let c=0;c<3;c++)raw[y*(w*3+1)+1+x*3+c]=Math.round(Math.max(0,Math.min(255,rgb[c])));}}
 const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;
 const buf=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);await writeFile(resolve(out,`${id}.png`),buf);
 textures.push({id,url:`/cinematic/${id}.png`,bytes:buf.length,width:w,height:h,kind,purpose,source:'Original mathematical texture by ThreadLabs',license:'CC0-1.0'});
}
const textures=[];const noise=(x,y)=>{const n=Math.sin(x*12.9898+y*78.233)*43758.5453;return n-Math.floor(n);};
await png('linen-albedo',256,256,(x,y)=>{const weave=(x%4<2?5:-5)+(y%4<2?4:-4),n=noise(x,y)*8;return[224+weave+n,211+weave+n,187+weave+n];},'Cream woven textile color.');
await png('linen-bump',256,256,(x,y)=>{const v=135+22*Math.cos(x*Math.PI/2)+20*Math.cos(y*Math.PI/2)+noise(x,y)*12;return[v,v,v];},'Repeating warp and weft height, use as bump map with bumpScale .012.','bump');
await png('linen-roughness',128,128,(x,y)=>{const v=210+noise(x,y)*25;return[v,v,v];},'High diffuse roughness for natural textile.','roughness');
await png('oak-albedo',256,256,(x,y)=>{const g=Math.sin(x*.19+Math.sin(y*.023)*3+Math.sin(y*.08))*.5+.5,n=noise(x,y)*9;return[133+g*49+n,88+g*38+n,54+g*26+n];},'Warm wood ring and workbench grain.');
await png('oak-bump',256,256,(x,y)=>{const v=125+Math.sin(x*.19+Math.sin(y*.023)*3+Math.sin(y*.08))*28;return[v,v,v];},'Fine directional wood grain relief.','bump');
await png('indigo-weave',256,256,(x,y)=>{const v=(x%5<2?9:0)+(y%4<2?7:0)+noise(x,y)*7;return[39+v,58+v,76+v];},'Natural indigo cloth surface for roll and material reveals.');
await png('clay-thread',128,128,(x,y)=>{const v=Math.sin((x+y*.12)*.8)*8+noise(x,y)*9;return[167+v,86+v,59+v];},'Twisted clay thread color for macro embroidery.');
await png('studio-environment',512,256,(x,y)=>{const u=x/512,v=y/256;const soft=Math.exp(-((u-.24)**2/.014+(v-.31)**2/.05))*95;const fill=Math.exp(-((u-.7)**2/.05+(v-.3)**2/.1))*30;const base=v<.5?82+(1-v*2)*36:72-(v-.5)*75;return[base+soft+fill+12,base+soft*.92+fill+5,base+soft*.8+fill-6];},'Original equirectangular studio lighting; use EquirectangularReflectionMapping.','environment');
await png('pattern-paper-grid',256,256,(x,y)=>{const line=x%32===0||y%32===0;const n=noise(x,y)*6;return line?[180,157,118]:[217+n,199+n,162+n];},'Pattern paper with construction grid.');
await writeFile(resolve(out,'models.json'),JSON.stringify({version:1,units:'meters; primary hoop outer radius .847',coordinateSystem:'Y up; primary hoop face points +Z',models,textures},null,2)+'\n');
const total=[...models,...textures].reduce((s,v)=>s+v.bytes,0);
const md=`# ThreadLabs cinematic asset manifest\n\nAll ${models.length} GLB models and ${textures.length} PNG maps are original procedural assets created for this project. No third-party models, textures, faces, artwork, or trademarks are incorporated. Geometry and texture source is reproducible with \`node scripts/build-cinematic-assets.mjs\`. Generated reusable geometry/maps are dedicated under CC0-1.0; ThreadLabs brand remains the owner's.\n\nTotal asset payload: ${(total/1024).toFixed(1)} KiB. JSON runtime manifest: \`client/public/cinematic/models.json\`. GLBs embed standard PBR materials, use named meshes, and require no external resources. GLTFLoader is the supported loader. Units are meters, Y is up. Main hoop lies in XY with the embroidered face +Z; outer radius is 0.847. Models are individual purposeful scene props, not alternate exports counted as separate assets.\n\n## Models\n\n| Asset | Size | Bounds (x × y × z) | Purpose |\n|---|---:|---|---|\n${models.map(m=>`| ${m.id}.glb | ${(m.bytes/1024).toFixed(1)} KiB | ${m.dimensions.join(' × ')} | ${m.purpose} |`).join('\n')}\n\n## Material and environment maps\n\n| Map | Resolution | Size | Purpose |\n|---|---:|---:|---|\n${textures.map(t=>`| ${t.id}.png | ${t.width} × ${t.height} | ${(t.bytes/1024).toFixed(1)} KiB | ${t.purpose} |`).join('\n')}\n\n## Integration\n\nLoad \`embroidery-hoop.glb\` for the primary object. Use the named \`outer-oak-hoop\`, \`inner-oak-hoop\`, \`linen-disc\`, \`embroidered-*\` and \`clamp-*\` meshes for deterministic assembly/unwrap stages. Apply color maps using SRGBColorSpace; bump/roughness maps stay in linear space. Repeat linen maps 5–10 times across the hoop and use a subtle bumpScale (0.008–0.015). The environment PNG is an original low-dynamic-range studio reflection map, not an HDR capture. It should complement scene lighting rather than replace key lights.\n\nGLB models are low polygon and individually streamed by the cinematic subsystem; they must not block account or application routes. Texture maps intentionally remain external to allow reuse and independent progressive loading.\n`;
await writeFile(resolve(import.meta.dirname,'../docs/CINEMATIC_ASSET_MANIFEST.md'),md);
console.log(JSON.stringify({models:models.length,textures:textures.length,totalBytes:total,files:models.map(m=>m.id)},null,2));
