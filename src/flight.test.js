import {test} from 'node:test';
import assert from 'node:assert/strict';
import {knightDestination} from './rules.js';
import {flightPose,trickPose} from './flight.js';

test('rounded airborne routes keep exact chess landings and continuous heading',()=>{
  for(const turns of [-4,-3,-2,-1,1,2,3,4]){
    const start=flightPose(turns,0),end=flightPose(turns,1);
    assert.deepEqual({x:start.x,z:start.z},{x:0,z:0});
    assert.deepEqual({x:end.x,z:end.z},knightDestination(turns));
    assert.ok(Math.abs(end.heading-Math.sign(turns)*Math.PI/2)<1e-9);
    let previous=start,lastDistance=null;
    for(let i=1;i<=1000;i++){
      const next=flightPose(turns,i/1000),distance=Math.hypot(next.x-previous.x,next.z-previous.z);
      assert.ok(Math.abs(next.heading-previous.heading)<.13,'No instant quarter-turn at a corner');
      if(lastDistance!==null)assert.ok(Math.abs(distance-lastDistance)<.0002,'Travel speed stays steady through bends');
      lastDistance=distance;previous=next;
      const mirrored=flightPose(-turns,i/1000);
      assert.ok(Math.abs(next.x+mirrored.x)<1e-10&&Math.abs(next.z-mirrored.z)<1e-10);
    }
  }
});

test('committed groups determine complete aerial tricks that settle before landing',()=>{
  for(const turns of [-3,-2,-1,1,2,3]){
    assert.deepEqual(trickPose(turns,0),{yaw:0,roll:0,pitch:0});
    const mid=trickPose(turns,.48),end=trickPose(turns,.9);
    assert.ok(Math.abs(mid.yaw)>2);
    assert.ok(Math.abs(Math.sin(end.yaw))<1e-9&&Math.abs(Math.sin(end.roll))<1e-9);
    assert.ok(Math.abs(end.pitch)<1e-9);
    if(Math.abs(turns)>1)assert.ok(Math.abs(mid.roll)>2);
    assert.deepEqual(end,trickPose(turns,1));
  }
});
