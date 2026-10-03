import { test } from 'node:test';
import assert from 'node:assert/strict';
import { knightDestination, isLandingMatch, targetForJump, knightPath, flightPoint, rotateGrid, roadLanding } from './rules.js';
test('chained right knight moves rotate through a loop and return home', () => {
  assert.deepEqual([0,1,2,3,4,5].map(knightDestination), [{x:0,z:0},{x:1,z:2},{x:3,z:1},{x:2,z:-1},{x:0,z:0},{x:1,z:2}]);
});
test('left loop mirrors the right and opposite taps can correct a landing', () => {
  assert.deepEqual(knightDestination(-2), {x:-3,z:1});
  assert.ok(isLandingMatch(3-1,2));
  assert.ok(isLandingMatch(5,1));
  assert.ok(!isLandingMatch(-1,1));
});
test('opening teaches single taps before multi-tap jumps', () => {
  assert.deepEqual(Array.from({length:6}, (_, i) => targetForJump(i)), [1,-1,2,-2,3,-3]);
});
test('a jump visibly travels two forward before one across on an exact L path', () => {
  assert.deepEqual(knightPath(1), [{x:0,z:0},{x:0,z:2},{x:1,z:2}]);
  assert.deepEqual(flightPoint(1,.42), {x:0,z:2});
  assert.deepEqual(flightPoint(-1,.42), {x:0,z:2});
  assert.deepEqual(flightPoint(1,1), {x:1,z:2});
  assert.deepEqual(flightPoint(-1,1), {x:-1,z:2});
});
test('multi-turn paths and landings agree, including a full loop and corrections', () => {
  for(const steps of [-5,-4,-3,-2,-1,1,2,3,4,5]) {
    assert.deepEqual(knightPath(steps).at(-1),knightDestination(steps));
    const p=flightPoint(steps,1),expected=knightDestination(steps);
    assert.ok(Math.abs(p.x-expected.x)<1e-8&&Math.abs(p.z-expected.z)<1e-8);
  }
});
test('every rotated landing road continues in the direction of the final knight leg',()=>{
  for(const heading of [0,Math.PI/2,Math.PI,3*Math.PI/2])for(const steps of [-3,-2,-1,1,2,3]){
    const road={end:{x:24,z:-16},heading},next=roadLanding(road,steps);
    const path=knightPath(steps),a=path.at(-2),b=path.at(-1);
    const tangent=rotateGrid({x:b.x-a.x,z:b.z-a.z},heading);
    const forward=rotateGrid({x:0,z:1},next.heading);
    assert.deepEqual(tangent,forward);
    const offset=rotateGrid(knightDestination(steps),heading);
    assert.equal(next.x,road.end.x+offset.x*8);
    assert.equal(next.z,road.end.z+offset.z*8);
  }
});
