import * as THREE from 'three';

// Seeded, tileable over/under yarn height with small slubs. Each map is shared by
// all cloth pieces; folds live in geometry rather than being painted shadows.
export function createTextileMaps(renderer, { embroidered = false } = {}) {
  const size = 512, pixels = size * size;
  const height = new Float32Array(pixels), color = new Uint8Array(pixels * 4), rough = new Uint8Array(pixels * 4), normal = new Uint8Array(pixels * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, cellX = Math.floor(x / 8), cellY = Math.floor(y / 8);
    const warp = Math.pow(Math.sin((x % 8 + .5) / 8 * Math.PI), .65);
    const weft = Math.pow(Math.sin((y % 8 + .5) / 8 * Math.PI), .65);
    const noise = ((x * 73 + y * 151 + x * y * 19) % 101) / 100;
    const over = (cellX + cellY) % 2;
    const h = (over ? warp * .7 + weft * .3 : weft * .7 + warp * .3);
    height[i] = h + noise * .06;
    const slub = Math.sin(x * .071) * Math.sin(y * .043) * 4;
    const value = 168 + h * 63 + noise * 17 + slub;
    color.set([value, value - 6, value - 15, 255], i * 4);
    const r = 200 + (1 - h) * 42; rough.set([r, r, r, 255], i * 4);
  }
  let stitchPixels;
  if(embroidered){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const ctx=canvas.getContext('2d');
    for(const [ox,oy,rotation] of [[110,120,-.3],[345,365,.2]]){
      ctx.save();ctx.translate(ox,oy);ctx.rotate(rotation);
      ctx.strokeStyle='#9b8754';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-65,40);ctx.bezierCurveTo(-25,10,35,10,85,-45);ctx.stroke();
      for(let leaf=0;leaf<7;leaf++){
        const x=-50+leaf*20,y=20-leaf*5,side=leaf%2?1:-1;
        ctx.save();ctx.translate(x,y+side*10);ctx.rotate(side*.7);ctx.fillStyle='#6e7447';ctx.beginPath();ctx.ellipse(0,0,13,5,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#c2ad74';ctx.lineWidth=.9;
        for(let j=-9;j<10;j+=3){ctx.beginPath();ctx.moveTo(j,-3);ctx.lineTo(j+3,3);ctx.stroke();}ctx.restore();
      }
      for(const [x,y]of[[-44,-3],[36,-17]]){
        ctx.save();ctx.translate(x,y);
        for(let petal=0;petal<5;petal++){ctx.save();ctx.rotate(petal*Math.PI*2/5);ctx.fillStyle='#f0dfb7';ctx.beginPath();ctx.ellipse(0,-11,5,10,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c4a577';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(0,-20);ctx.stroke();ctx.restore();}
        ctx.fillStyle='#b7793c';ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();ctx.restore();
      }ctx.restore();
    }
    stitchPixels=ctx.getImageData(0,0,size,size).data;
    for(let i=0;i<pixels;i++)height[i]+=stitchPixels[i*4+3]/255*.65;
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const dx = height[y * size + ((x + 1) % size)] - height[y * size + ((x - 1 + size) % size)];
    const dy = height[((y + 1) % size) * size + x] - height[((y - 1 + size) % size) * size + x];
    const n = new THREE.Vector3(-dx * 1.5, -dy * 1.5, 1).normalize();
    normal.set([(n.x + 1) * 127.5, (n.y + 1) * 127.5, (n.z + 1) * 127.5, 255], i * 4);
  }
  const make = (data, srgb = false) => {
    const map = new THREE.DataTexture(data, size, size); map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.minFilter = THREE.LinearMipmapLinearFilter; map.magFilter = THREE.LinearFilter; map.generateMipmaps = true;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (srgb) map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true; return map;
  };
  return { map: make(color, true), normalMap: make(normal), roughnessMap: make(rough), ...(stitchPixels?{stitchMap:make(stitchPixels,true)}:{}) };
}
export function textileMaterial(color, maps) {
  const {stitchMap,...surface}=maps;
  const material=new THREE.MeshPhysicalMaterial({ color, ...surface, roughness: .93, metalness: 0,
    normalScale: new THREE.Vector2(.48, .48), sheen: .8, sheenRoughness: .85,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color('#f1dfbd'), .35),
    side: THREE.DoubleSide, shadowSide: THREE.DoubleSide });
  if(stitchMap){
    material.onBeforeCompile=shader=>{
      shader.uniforms.threadEmbroidery={value:stitchMap};
      shader.fragmentShader='uniform sampler2D threadEmbroidery;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec4 stitchedThread=texture2D(threadEmbroidery,vMapUv);
        diffuseColor.rgb=mix(diffuseColor.rgb,stitchedThread.rgb,stitchedThread.a*.94);`);
    };
    material.customProgramCacheKey=()=> 'threadlabs-raised-embroidery-v1';
  }
  return material;
}

