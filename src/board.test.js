import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EndlessCourse,BOARD_MIN,BOARD_MAX,GRID_COLS} from './board.js';
import {knightDestination} from './rules.js';
test('each fork has two legal choices inside the eight-file strip with a safe forward path',()=>{
 const course=new EndlessCourse();assert.equal(GRID_COLS,8);
 for(let i=0;i<2000;i++){
  const origin=course.current,options=course.options;
  assert.equal(options.length,2);assert.notDeepEqual(options[0],options[1]);
  assert.ok(options.some(p=>p.z>origin.z&&p.piece===null));
  for(const p of options){
   assert.ok(p.x>=BOARD_MIN&&p.x<=BOARD_MAX);
   assert.deepEqual({x:p.x-origin.x,z:p.z-origin.z},knightDestination(p.move));
   assert.equal(p.index,origin.index+1);
  }
  course.advance(options[0]);assert.ok(course.platforms.length<=5);
 }
 assert.ok(course.current.z>3000);
});
test('chosen branches drive the next fork and previewing future cells does not change generation',()=>{
 const a=new EndlessCourse(),b=new EndlessCourse();
 for(let i=0;i<50;i++){
  const choice=a.options[i%2],preview=a.previewOptions(choice);
  assert.deepEqual(a.options,b.options);
  a.advance(choice);b.advance(b.options[i%2]);
  assert.deepEqual(a.options,preview);assert.deepEqual(a.platforms,b.platforms);
 }
 a.reset();b.reset();assert.deepEqual(a.platforms,b.platforms);
 assert.throws(()=>a.advance({x:100,z:100}),/reachable/);
});
test('captures have an empty alternative and their piece disappears after landing',()=>{
 const course=new EndlessCourse();let captures=0,detours=0;
 for(let i=0;i<100;i++){
  const capture=course.options.find(p=>p.piece),choice=capture||course.options[0];
  if(capture){captures++;assert.ok(capture.bonus>0);assert.ok(course.options.some(p=>!p.piece));if(capture.z<=course.current.z)detours++;}
  course.advance(choice);assert.equal(course.current.piece,null);assert.equal(course.current.bonus,0);
 }
 assert.ok(captures>20);assert.ok(detours>0);
});
test('falling history squares do not remain valid landing targets',()=>{
 const course=new EndlessCourse(),start=course.current,first=course.options[0];
 course.advance(first);
 assert.ok(course.history.some(p=>p.id===start.id));
 assert.equal(course.match(start),undefined);
 assert.throws(()=>course.advance(start),/reachable/);
 assert.equal(course.match({x:course.current.x,z:course.current.z+1}),undefined);
});
test('preview forks can offer all eight knight directions across the course',()=>{
 const course=new EndlessCourse(),directions=new Set();
 for(let index=0;index<500;index++)for(let x=BOARD_MIN;x<=BOARD_MAX;x++){
  for(const option of course.previewOptions({x,z:index*2,index}))directions.add(`${option.move.first}+${option.move.second}`);
 }
 assert.equal(directions.size,8);
});
test('queued groups execute both predicted branches through captures and level changes',async()=>{
 const {Premoves}=await import('./premoves.js');
 const {progression,ScrollProgression}=await import('./progression.js');
 const course=new EndlessCourse(),queue=new Premoves(),scroll=new ScrollProgression();
 let captures=0,empty=0;
 for(let batch=0;batch<30;batch++){
  let origin=course.current;const expected=[];
  for(let i=0;i<4;i++){
   const option=course.previewOptions(origin)[(batch+i)%2];
   assert.equal(queue.edit(option.move.first),true);assert.equal(queue.edit(option.move.second),true);
   expected.push(option);origin=option;
  }
  const group=queue.dispatch();assert.ok(group);assert.equal(queue.draft.length,0);queue.begin();
  for(let i=0;i<group.moves.length;i++){
   const delta=knightDestination(group.moves[i]),origin=course.current;
   const hit=course.match({x:origin.x+delta.x,z:origin.z+delta.z});
   assert.ok(hit);assert.equal(hit.id,expected[i].id);
   if(hit.piece)captures++;else empty++;
   course.advance(hit);scroll.tick(1.35);scroll.landed();
   assert.equal(scroll.state.level,progression(course.current.index).level);
   assert.ok(course.platforms.length<=5);
  }
  queue.complete();assert.equal(queue.groups.length,0);
 }
 assert.equal(course.current.index,120);assert.equal(captures,20);assert.equal(empty,100);
 assert.equal(scroll.state.level,9);assert.equal(scroll.state.progress,4);assert.equal(scroll.state.speed,8.4);
});
