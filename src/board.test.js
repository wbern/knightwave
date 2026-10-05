import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EndlessCourse} from './board.js';
import {knightDestination,knightPath} from './rules.js';
test('an endless course keeps progressing beyond old board bounds with bounded lookahead',()=>{
 const course=new EndlessCourse();let previous=course.at(0),maxRetained=0;
 for(let i=1;i<=2000;i++){
  const next=course.at(i),offset=knightDestination(next.turns);
  assert.deepEqual({x:next.x-previous.x,z:next.z-previous.z},offset);
  assert.ok(next.z>previous.z);assert.equal(next.heading,0);assert.ok(next.x>=-3&&next.x<=2);
  for(const p of knightPath(next.turns))assert.ok(previous.x+p.x>=-3&&previous.x+p.x<=2);
  course.maintain(i);maxRetained=Math.max(maxRetained,course.stops.length);previous=next;
 }
 assert.ok(previous.z>4000);assert.ok(maxRetained<=11);
});
test('course generation is reproducible across resets and recycling',()=>{
 const a=new EndlessCourse(),b=new EndlessCourse();
 for(let i=0;i<100;i++){assert.deepEqual(a.at(i),b.at(i));a.maintain(i);b.maintain(i);}
 a.reset();b.reset();assert.deepEqual(a.stops,b.stops);
});
