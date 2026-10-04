import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOARD_RADIUS, createCircuit, circuitPath, isOnBoard} from './board.js';
import {flightPoint, rotateGrid} from './rules.js';

test('six chained jumps form a closed circuit with the original facing',()=>{
  const stops=createCircuit();
  assert.deepEqual(stops.map(p=>p.turns),[0,1,-1,-2,2,3,-3]);
  assert.deepEqual([stops.at(-1).x,stops.at(-1).z],[stops[0].x,stops[0].z]);
  assert.equal(stops.at(-1).heading,stops[0].heading);
});
test('every landing and intermediate L leg stays inside the finite board',()=>{
  const stops=createCircuit();
  for(let i=1;i<stops.length;i++){
    const start=stops[i-1],end=stops[i],path=circuitPath(start,end.turns);
    assert.deepEqual(path.at(-1),{x:end.x,z:end.z});
    for(const p of path)assert.ok(isOnBoard(p));
    for(let frame=0;frame<=100;frame++){
      const offset=rotateGrid(flightPoint(end.turns,frame/100),start.heading);
      assert.ok(isOnBoard({x:start.x+offset.x,z:start.z+offset.z}));
    }
  }
  assert.ok(isOnBoard({x:BOARD_RADIUS,z:-BOARD_RADIUS}));
  assert.ok(!isOnBoard({x:BOARD_RADIUS+.01,z:0}));
});
