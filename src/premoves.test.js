import test from 'node:test';
import assert from 'node:assert/strict';
import {Premoves} from './premoves.js';
const add=(p,first='up',second='left')=>{assert.ok(p.edit(first));assert.ok(p.edit(first));assert.ok(p.edit(second));};
test('three-press moves dispatch as immutable-by-draft FIFO groups and partial input stays editable',()=>{
 const p=new Premoves();p.edit('up');assert.equal(p.dispatch(),null);assert.deepEqual(p.draft,['up']);
 p.edit('down');assert.deepEqual(p.draft,['down']);p.edit('down');p.edit('right');const first=p.dispatch();
 assert.deepEqual(first.moves,[{first:'down',second:'right'}]);assert.deepEqual(p.draft,[]);
 add(p,'right','up');const second=p.dispatch();assert.equal(p.begin(),first);
 add(p);assert.deepEqual(first.moves,[{first:'down',second:'right'}]);assert.equal(p.complete(),first);
 assert.equal(p.groups[0],second);assert.deepEqual(p.draft,['up','up','left']);assert.equal(p.completed,1);
});
test('four-move drafts and pending-group capacity remain bounded across long play',()=>{
 const p=new Premoves(1);for(let i=0;i<4;i++)add(p);
 assert.equal(p.edit('up'),false);assert.equal(p.dispatch().moves.length,4);assert.equal(p.edit('up'),false);
 p.begin();p.complete();assert.equal(p.full,false);
 for(let i=0;i<1000;i++){add(p);p.dispatch();assert.equal(p.groups.length,1);p.begin();p.complete();}
 assert.equal(p.groups.length,0);assert.equal(p.completed,1001);
});
test('recall clears partial drafts and retrieves the latest unstarted group without altering flight',()=>{
 const p=new Premoves();add(p);const first=p.dispatch();p.begin();
 add(p,'left','down');const second=p.dispatch();p.edit('up');
 assert.deepEqual(p.recall(),{cleared:true});assert.equal(p.groups.length,2);
 assert.equal(p.recall(),second);assert.deepEqual(p.draft,['left','left','down']);assert.equal(p.groups[0],first);
 p.recall();assert.equal(p.recall(),null);assert.deepEqual(first.moves,[{first:'up',second:'left'}]);
});

test('all three orderings charge the same move and recall preserves the entered order',()=>{
 for(const steps of [['up','up','left'],['left','up','up'],['up','left','up']]){
  const p=new Premoves();for(const step of steps)assert.ok(p.edit(step));
  const group=p.dispatch();assert.deepEqual(group.moves,[{first:'up',second:'left'}]);
  p.recall();assert.deepEqual(p.draft,steps);
 }
});
test('incomplete and invalid triples do not dispatch or consume charge capacity',()=>{
 const p=new Premoves();p.edit('up');p.edit('left');assert.equal(p.dispatch(),null);
 assert.equal(p.edit('down'),false);assert.deepEqual(p.draft,['up','left']);assert.equal(p.edit('up'),true);assert.equal(p.dispatch().moves.length,1);
 const straight=new Premoves();straight.edit('up');straight.edit('up');assert.equal(straight.edit('up'),false);assert.equal(straight.dispatch(),null);straight.edit('left');assert.equal(straight.dispatch().moves.length,1);
});

test('undo removes one input at a time and never changes an executing group',()=>{
 const p=new Premoves();add(p);const executing=p.dispatch();p.begin();
 add(p,'left','up');const pending=p.dispatch();p.edit('down');p.edit('down');
 assert.deepEqual(p.undo(),{direction:'down'});assert.deepEqual(p.draft,['down']);
 p.undo();assert.deepEqual(p.draft,[]);assert.equal(p.undo(),pending);
 assert.deepEqual(p.draft,['left','left','up']);p.undo();assert.deepEqual(p.draft,['left','left']);p.undo();p.undo();
 assert.equal(p.undo(),null);assert.equal(p.groups[0],executing);assert.equal(p.locked,true);
});
