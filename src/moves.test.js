import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moveSequence} from './moves.js';
import {knightPath} from './rules.js';
test('every upright icon matches the forward and lateral legs of its actual jump',()=>{
 for(const turns of [-4,-3,-2,-1,1,2,3,4]){
  const path=knightPath(turns),icons=moveSequence(turns);
  assert.equal(path.length,icons.length*2+1);
  for(let i=0;i<icons.length;i++){
   assert.equal(icons[i].heading,0);
   assert.deepEqual(icons[i].forward,{x:path[i*2+1].x-path[i*2].x,z:path[i*2+1].z-path[i*2].z});
   assert.deepEqual(icons[i].across,{x:path[i*2+2].x-path[i*2+1].x,z:path[i*2+2].z-path[i*2+1].z});
  }
 }
 assert.deepEqual(moveSequence(0),[]);
});
