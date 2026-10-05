import {test} from 'node:test';
import assert from 'node:assert/strict';
import {knightDestination,knightPath,isLandingMatch} from './rules.js';
test('each chained L starts north and advances two ranks, with mirrored lateral steps',()=>{
 for(const turns of [-4,-3,-2,-1,0,1,2,3,4]){
  assert.deepEqual(knightDestination(turns),{x:turns,z:2*Math.abs(turns)});
  const path=knightPath(turns);assert.deepEqual(path.at(-1),knightDestination(turns));
  for(let i=0;i<Math.abs(turns);i++){
   assert.equal(path[i*2+1].z-path[i*2].z,2);assert.equal(path[i*2+1].x,path[i*2].x);
   assert.equal(path[i*2+2].x-path[i*2+1].x,Math.sign(turns));assert.equal(path[i*2+2].z,path[i*2+1].z);
  }
 }
});
test('opposite inputs undo a draft and different groups cannot alias a landing',()=>{
 assert.ok(isLandingMatch(3-1,2));assert.ok(!isLandingMatch(4,0));assert.ok(!isLandingMatch(-1,1));
});
