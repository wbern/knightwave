import { test } from 'node:test';
import assert from 'node:assert/strict';
import { knightDestination, isLandingMatch, targetForJump } from './rules.js';
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
