import {test} from 'node:test';
import assert from 'node:assert/strict';
import {knightDestination,knightPath,isLandingMatch,moveFromSteps} from './rules.js';
const cases=[['up','left',-1,2],['up','right',1,2],['right','up',2,1],['right','down',2,-1],['down','right',1,-2],['down','left',-1,-2],['left','down',-2,-1],['left','up',-2,1]];
test('all eight ordered direction pairs land on distinct chess knight squares',()=>{
 const endpoints=new Set();
 for(const [first,second,x,z] of cases){
  const move={first,second},path=knightPath(move);
  assert.deepEqual(knightDestination(move),{x,z});endpoints.add(`${x},${z}`);
  assert.equal(Math.abs(path[1].x)+Math.abs(path[1].z),2);
  assert.equal(Math.abs(path[2].x-path[1].x)+Math.abs(path[2].z-path[1].z),1);
  assert.equal(Math.abs(path[1].x*(path[2].x-path[1].x)+path[1].z*(path[2].z-path[1].z)),0);
 }
 assert.equal(endpoints.size,8);
});
test('chained moves preserve input order and landing comparison uses the endpoint',()=>{
 const moves=[{first:'up',second:'left'},{first:'right',second:'up'}];
 assert.deepEqual(knightPath(moves),[{x:0,z:0},{x:0,z:2},{x:-1,z:2},{x:1,z:2},{x:1,z:3}]);
 assert.deepEqual(knightDestination({moves}),{x:1,z:3});
 assert.deepEqual(knightDestination(['up','up','left','right','right','up']),{x:1,z:3});
 assert.ok(isLandingMatch(moves,{x:1,z:3}));assert.ok(!isLandingMatch({first:'up',second:'right'},{first:'right',second:'up'}));
 assert.deepEqual(knightDestination([]),{x:0,z:0});
});

test('every permutation of three square directions lands on the same knight square',()=>{
 for(const [long,short,x,z] of cases)for(const steps of [[long,long,short],[long,short,long],[short,long,long]]){
  assert.deepEqual(knightDestination(steps),{x,z});assert.deepEqual(moveFromSteps(steps),{first:long,second:short});
 }
 assert.equal(moveFromSteps(['up','down','left']),null);assert.equal(moveFromSteps(['up','up','up']),null);
 assert.deepEqual(knightDestination(['up','left']),{x:0,z:0});
});
