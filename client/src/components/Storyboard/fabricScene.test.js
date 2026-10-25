import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleFabricPoint} from './fabricScene.js';
test('cloth remains finite and continuous at every chapter boundary on portrait and desktop',()=>{
 for(const aspect of [.46,.65,1.6])for(let band=0;band<6;band++)for(let u=0;u<=1;u+=.1)for(const v of [0,.5,1]){
  for(let p=0;p<=6;p+=.125)assert.ok(sampleFabricPoint(p,u,v,band,aspect).every(Number.isFinite));
  for(let p=1;p<6;p++){const a=sampleFabricPoint(p-.00001,u,v,band,aspect),b=sampleFabricPoint(p+.00001,u,v,band,aspect);assert.ok(Math.hypot(...a.map((n,i)=>n-b[i]))<.001);}
 }
});
test('reverse and out-of-order scroll samples are identical and overscroll clamps',()=>{
 const samples=Array.from({length:49},(_,i)=>sampleFabricPoint(i/8,.7,.3,2,.65));
 for(let i=48;i>=0;i--)assert.deepEqual(sampleFabricPoint(i/8,.7,.3,2,.65),samples[i]);
 assert.deepEqual(sampleFabricPoint(-2,.7,.3,2,.65),samples[0]);assert.deepEqual(sampleFabricPoint(9,.7,.3,2,.65),samples[48]);
});

test('forming and releasing cloth retains cross-section width between keyframes',()=>{
 for(const aspect of [.46,.65,1.6])for(let p=3;p<=6;p+=.05)for(let band=0;band<6;band++)for(const u of [.1,.3,.5,.7,.9]){
  const left=sampleFabricPoint(p,u,0,band,aspect),right=sampleFabricPoint(p,u,1,band,aspect);
  assert.ok(Math.hypot(...left.map((value,i)=>value-right[i]))>.45,`collapsed section at ${p}/${band}/${u}`);
 }
});

test('ribbon edges do not flip or teleport inside wrapping transitions',()=>{
 for(let band=0;band<6;band++)for(const u of [.05,.2,.4,.6,.8,.95])for(const v of [0,1]){
  let previous=sampleFabricPoint(0,u,v,band,.65);
  for(let i=1;i<=3000;i++){
   const current=sampleFabricPoint(i/500,u,v,band,.65);
   assert.ok(Math.hypot(...current.map((n,k)=>n-previous[k]))<.2,`frame discontinuity at ${i/500}`);
   previous=current;
  }
 }
});
