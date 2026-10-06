import {test} from 'node:test';
import assert from 'node:assert/strict';
import {knightDestination,DIRECTIONS,perpendicular} from './rules.js';
import {flightPose,trickPose} from './flight.js';
const moves=Object.keys(DIRECTIONS).flatMap(first=>Object.keys(DIRECTIONS).filter(second=>perpendicular(first,second)).map(second=>({first,second})));
test('rounded routes retain all eight exact landings and travel continuously around their corners',()=>{
 for(const move of moves){
  const start=flightPose(move,0),end=flightPose(move,1);
  assert.deepEqual({x:start.x,z:start.z},{x:0,z:0});assert.deepEqual({x:end.x,z:end.z},knightDestination(move));
  let previous=start,lastDistance=null;
  for(let i=1;i<=1000;i++){
   const next=flightPose(move,i/1000),distance=Math.hypot(next.x-previous.x,next.z-previous.z);
   assert.ok(Math.abs(next.heading-previous.heading)<.13);
   if(lastDistance!==null)assert.ok(Math.abs(distance-lastDistance)<.0002);
   lastDistance=distance;previous=next;
  }
 }
});
test('multi-move routes round direction changes and aerial tricks settle before landing',()=>{
 for(const count of [1,2,3,4]){
  const group=Array.from({length:count},(_,i)=>moves[i]);
  const end=flightPose(group,1);assert.deepEqual({x:end.x,z:end.z},knightDestination(group));
  assert.deepEqual(trickPose(group,0),{yaw:0,roll:0,pitch:0});
  const mid=trickPose(group,.48),settled=trickPose(group,.9);assert.ok(Math.abs(mid.yaw)>2);
  assert.ok(Math.abs(Math.sin(settled.yaw))<1e-9&&Math.abs(Math.sin(settled.roll))<1e-9);
  assert.ok(Math.abs(settled.pitch)<1e-9);if(count>1)assert.ok(Math.abs(mid.roll)>2);
  assert.deepEqual(settled,trickPose(group,1));
 }
});
