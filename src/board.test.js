import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOARD_RADIUS, createCircuit, circuitPath, isOnBoard} from './board.js';
import {flightPoint, rotateGrid} from './rules.js';

test('six chained jumps form a closed circuit with the original facing',()=>{
  const stops=createCircuit();
  assert.deepEqual(stops.map(p=>p.turns),[0,1,2,-1,3,-2,-3]);
  assert.deepEqual([stops.at(-1).x,stops.at(-1).z],[stops[0].x,stops[0].z]);
  assert.equal(stops.at(-1).heading,stops[0].heading);
});
test('every landing and intermediate L leg stays inside the finite board',()=>{
  const stops=createCircuit();
  for(let i=1;i<stops.length;i++){
    const start=stops[i-1],end=stops[i],path=circuitPath(start.launch,end.turns);
    assert.deepEqual(path.at(-1),{x:end.x,z:end.z});
    for(const p of [start,start.launch,...path])assert.ok(isOnBoard(p));
    for(let frame=0;frame<=100;frame++){
      const offset=rotateGrid(flightPoint(end.turns,frame/100),start.heading);
      assert.ok(isOnBoard({x:start.launch.x+offset.x,z:start.launch.z+offset.z}));
    }
  }
  assert.ok(isOnBoard({x:BOARD_RADIUS,z:-BOARD_RADIUS}));
  assert.ok(!isOnBoard({x:BOARD_RADIUS+.01,z:0}));
});

test('raised runways do not intersect while upcoming platforms rise',()=>{
  const rectangles=createCircuit().slice(0,-1).map(p=>({left:Math.min(p.x,p.launch.x)-.4625,right:Math.max(p.x,p.launch.x)+.4625,bottom:Math.min(p.z,p.launch.z)-.4625,top:Math.max(p.z,p.launch.z)+.4625}));
  for(let i=0;i<rectangles.length;i++)for(const b of rectangles.slice(0,i)){
    const a=rectangles[i];
    assert.ok(!(a.left<b.right&&a.right>b.left&&a.bottom<b.top&&a.top>b.bottom));
  }
});
