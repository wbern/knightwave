import test from 'node:test';
import assert from 'node:assert/strict';
import {Premoves,normalizeTurns,verticalGesture} from './premoves.js';

test('dispatch separates platform groups and keeps every dispatched group facing north',()=>{
  const p=new Premoves();p.edit(1);const first=p.dispatch(0);assert.equal(p.draft,0);
  p.edit(-1);p.edit(-1);const second=p.dispatch(0);
  assert.deepEqual(p.groups.map(g=>[g.turns,g.heading]),[[1,0],[-2,0]]);
  assert.equal(p.draftHeading(0),0);assert.equal(p.begin(),first);
  p.edit(1);assert.equal(first.turns,1);assert.equal(p.complete(),first);
  assert.equal(p.groups[0],second);assert.equal(p.draft,1);assert.equal(p.completed,1);
});
test('queue capacity recovers indefinitely after completing groups, with bounded drafts',()=>{
  const p=new Premoves(1);assert.equal(p.dispatch(),null);
  for(let i=0;i<4;i++)assert.equal(p.edit(1),true);assert.equal(p.edit(1),false);assert.equal(p.dispatch().turns,4);
  assert.equal(p.edit(1),false);p.begin();p.complete();assert.equal(p.full,false);
  for(let i=0;i<1000;i++){p.edit(-1);p.dispatch();assert.equal(p.groups.length,1);p.begin();p.complete();}
  assert.equal(p.groups.length,0);assert.equal(p.completed,1001);assert.equal(normalizeTurns(-4),-4);
});
test('recall clears a draft first, retrieves the latest unstarted group and never alters a flight',()=>{
  const p=new Premoves();p.edit(1);const first=p.dispatch(0);p.begin();
  p.edit(-1);p.edit(-1);const second=p.dispatch(Math.PI/2);
  p.edit(1);assert.deepEqual(p.recall(),{cleared:true});assert.equal(p.groups.length,2);
  assert.equal(p.recall(),second);assert.equal(p.draft,-2);assert.equal(p.groups[0],first);
  p.recall();assert.equal(p.recall(),null);assert.equal(p.groups[0].turns,1);
});
test('dispatch swipe tolerates slight diagonal motion while horizontal drags and short gestures do nothing',()=>{
  const start={x:200,y:500};
  assert.equal(verticalGesture(start,{x:215,y:420}),'dispatch');
  assert.equal(verticalGesture(start,{x:195,y:565}),'recall');
  assert.equal(verticalGesture(start,{x:205,y:480}),null);
  assert.equal(verticalGesture(start,{x:290,y:450}),null);
});
