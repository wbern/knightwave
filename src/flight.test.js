import {test} from 'node:test';
import assert from 'node:assert/strict';
import {knightDestination,DIRECTIONS,perpendicular} from './rules.js';
import {flightPose,trickPose,hopProgress,hopShape,landingShape,jumpLift,JUMP_HEIGHT,APEX_FRACTION,TAKEOFF_FRACTION} from './flight.js';
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
test('travel lean stays subtle and returns upright at touchdown for every combo',()=>{
 for(const count of [1,2,3,4]){
  const group=Array.from({length:count},(_,i)=>moves[i]);
  const end=flightPose(group,1);assert.deepEqual({x:end.x,z:end.z},knightDestination(group));
  assert.deepEqual(trickPose(group,0,count),{yaw:0,roll:0,pitch:0});
  assert.deepEqual(trickPose(group,1,count),{yaw:0,roll:0,pitch:0});
  for(let i=0;i<=100;i++){const pose=trickPose(group,i/100,count);assert.equal(pose.yaw,0);assert.ok(Math.abs(pose.roll)<.2&&Math.abs(pose.pitch)<.2);}
 }
});

test('equivalent input orders keep their own takeoff and touchdown curves',()=>{
 const orders=[['right','right','up'],['up','right','right'],['right','up','right']];
 const middles=orders.map(order=>flightPose(order,.5));
 for(const order of orders){const end=flightPose(order,1);assert.deepEqual({x:end.x,z:end.z},{x:2,z:1});}
 assert.ok(flightPose(orders[0],.01).x>flightPose(orders[0],.01).z*10);
 assert.ok(flightPose(orders[1],.01).z>flightPose(orders[1],.01).x*10);
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(Math.hypot(middles[i].x-middles[j].x,middles[i].z-middles[j].z)>.1);
 const a=flightPose({first:'right',second:'up',steps:orders[1]},.5);assert.deepEqual(a,middles[1]);
});

test('hop loads on the platform, rises from an impulse and falls faster into a soft contact',()=>{
 const apex=TAKEOFF_FRACTION+(1-TAKEOFF_FRACTION)*APEX_FRACTION;
 assert.equal(jumpLift(0),0);assert.equal(jumpLift(TAKEOFF_FRACTION),0);assert.equal(jumpLift(1),0);
 assert.equal(jumpLift(apex),JUMP_HEIGHT);assert.equal(jumpLift(-1),0);assert.equal(jumpLift(2),0);
 assert.equal(hopProgress(TAKEOFF_FRACTION),0);assert.equal(hopProgress(1),1);
 assert.ok(hopShape(TAKEOFF_FRACTION/2).height<1);assert.ok(hopShape(.2).height>1);
 assert.ok(landingShape(0).height<1);assert.ok(landingShape(.075).height>1);assert.equal(landingShape(.16).height,1);
 for(let i=0;i<=100;i++){
  const shape=hopShape(i/100);assert.ok(Math.abs(shape.width**2*shape.height-1)<1e-12);
  if(i/100<apex)assert.ok(jumpLift((i+1)/100)>=jumpLift(i/100)-.01);
  else assert.ok(jumpLift((i+1)/100)<=jumpLift(i/100));
 }
 const epsilon=.001;
 assert.ok(Math.abs(jumpLift(1-epsilon)-jumpLift(1))>Math.abs(jumpLift(TAKEOFF_FRACTION+epsilon)-jumpLift(TAKEOFF_FRACTION)));
});
