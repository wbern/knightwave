import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moveSequence} from './moves.js';
import {knightPath,rotateGrid} from './rules.js';

test('rotated and mirrored queue glyphs agree with every physical knight leg',()=>{
  for(const heading of [0,Math.PI/2,Math.PI,3*Math.PI/2])for(const turns of [-4,-3,-2,-1,1,2,3,4,5]){
    const path=knightPath(turns).map(p=>rotateGrid(p,heading)),icons=moveSequence(turns,heading);
    assert.equal(path.length,icons.length*2+1);
    for(let i=0;i<icons.length;i++){
      assert.deepEqual(icons[i].forward,{x:path[i*2+1].x-path[i*2].x||0,z:path[i*2+1].z-path[i*2].z||0});
      assert.deepEqual(icons[i].across,{x:path[i*2+2].x-path[i*2+1].x||0,z:path[i*2+2].z-path[i*2+1].z||0});
    }
  }
  assert.deepEqual(moveSequence(0,0),[]);
});
