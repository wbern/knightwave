import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moveSequence,moveGlyphs} from './moves.js';
import {knightPath,DIRECTIONS,perpendicular} from './rules.js';
test('icon orientation mirrors and rotates both ordered legs of all eight possible jumps',()=>{
 for(const first of Object.keys(DIRECTIONS))for(const second of Object.keys(DIRECTIONS)){
  if(!perpendicular(first,second))continue;
  const move={first,second},path=knightPath(move),icon=moveSequence(move)[0];
  assert.deepEqual(icon.forward,path[1]);
  assert.deepEqual(icon.across,{x:path[2].x-path[1].x,z:path[2].z-path[1].z});
  // The canonical icon travels up, then right. Verify its SVG transform in screen space.
  const angle=icon.heading,firstVector={x:Math.sin(angle)*2,z:Math.cos(angle)*2};
  const secondVector={x:Math.cos(angle)*icon.direction,z:-Math.sin(angle)*icon.direction};
  assert.ok(Math.abs(firstVector.x-icon.forward.x)<1e-9&&Math.abs(firstVector.z-icon.forward.z)<1e-9);
  assert.ok(Math.abs(secondVector.x-icon.across.x)<1e-9&&Math.abs(secondVector.z-icon.across.z)<1e-9);
  assert.ok(moveGlyphs(move).includes(`${first} two, ${second} one`));
 }
});
test('draft icons include a partial square directions without presenting it as a complete knight move',()=>{
 const html=moveGlyphs(['up','up','left','right','right']);assert.ok(html.includes('up two, left one'));
 assert.ok(html.includes('partial-move'));assert.ok(html.includes('right; one square entered'));
 assert.equal(moveGlyphs([]),'');
});
