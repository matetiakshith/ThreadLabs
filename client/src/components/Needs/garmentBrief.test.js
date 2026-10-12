import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGarmentBrief } from './garmentBrief.js';
import { drapeVertex } from '../Three/drapeGeometry.js';

test('brief retains every unique requirement without substituting royal/cyber styling',()=>{
  const prompt='Oversized black hoodie with red embroidery on the chest, distressed sleeves and a big back graphic that says HELLO.';
  const brief=buildGarmentBrief(prompt);
  assert.equal(brief.userPrompt,prompt); assert.equal(brief.requirements,prompt); assert.equal(brief.title,'Hoodie');
  assert.deepEqual(brief.colourTerms,['black','red']); assert.equal(brief.fit,'oversized');
  assert.match(brief.garments[0].fabric,/Not specified/);assert.equal(brief.estimatedCost,'Artisan quote required');
});

test('required white linen shirt and contemporary ivory kurta retain garment/material/colors',()=>{
  const shirt=buildGarmentBrief('white linen shirt with a mandarin collar');
  assert.equal(shirt.title,'Shirt');assert.equal(shirt.garments[0].fabric,'linen');assert.deepEqual(shirt.colourTerms,['white']);
  const kurta=buildGarmentBrief('Indian ivory kurta with gold embroidery and a contemporary silhouette');
  assert.equal(kurta.title,'Kurta');assert.equal(kurta.fit,'contemporary silhouette');assert.deepEqual(kurta.colourTerms,['ivory','gold']);
});

test('unrecognized words and unspecified colors remain in the authoritative brief, without filler palettes',()=>{
  const prompt='A cerulean sculptural garment, precisely three phoenixes on the back';
  const brief=buildGarmentBrief(prompt,{schemaVersion:1,unit:'cm',values:{height:170}},'100 cm','voice');
  assert.equal(brief.userPrompt,prompt);assert.equal(brief.inputMethod,'voice');assert.deepEqual(brief.colorPalette,[]);assert.equal(brief.measurements.values.height,170);
});

test('multiple garments do not receive the same invented color/material assignment',()=>{
  const prompt='A black oversized T-shirt with blue jeans';
  const brief=buildGarmentBrief(prompt);
  assert.equal(brief.userPrompt,prompt);
  assert.deepEqual(brief.colourTerms,['black','blue']);
  assert.ok(brief.garments.every(garment=>garment.color==='See original brief — confirm per garment'));
});

test('cloth is bounded, has static gravity folds, pinned upper edge and reversible pointer/time deformation',()=>{
  for(let x=-1.325;x<=1.325;x+=.1) for(let y=-1.425;y<=1.425;y+=.1) {
    const v=drapeVertex(x,y,100,.8,-.5);
    assert.ok(Object.values(v).every(Number.isFinite));assert.ok(Math.abs(v.z)<.5);
  }
  const pinned=drapeVertex(.5,1.425,0,0,0);
  assert.deepEqual(drapeVertex(.5,1.425,40,1,1),pinned);
  assert.notDeepEqual(drapeVertex(.2,-.6,0,0,0),drapeVertex(.2,-.6,10,.8,-.5));
  assert.deepEqual(drapeVertex(.2,-.6,0,0,0),drapeVertex(.2,-.6,0,0,0));
});
