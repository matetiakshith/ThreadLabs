import test from 'node:test';
import assert from 'node:assert/strict';
import { storyPinDistance } from './motionPolicy.js';
test('editorial pin never exceeds existing room or its short reading budget',()=>{
 for(const section of [500,800,1200,2400])for(const aside of [400,700,1100]){
  const distance=storyPinDistance(section,aside);
  assert.ok(distance>=0&&distance<=280);
  assert.ok(distance<=Math.max(0,section-aside-48));
 }
});
test('hidden or unmeasurable content cannot create a pin interval',()=>{
 for(const sizes of [[0,400],[1200,0],[NaN,400],[1200,Infinity],[-10,300]])assert.equal(storyPinDistance(...sizes),0);
});
