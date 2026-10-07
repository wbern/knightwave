import {test} from 'node:test';
import assert from 'node:assert/strict';
import {progression,difficulty,jumpDuration,ScrollProgression} from './progression.js';
test('levels need progressively longer runs with speed changes every three levels',()=>{
 assert.equal(progression(0).level,1);assert.equal(progression(0).difficulty,'Easy');assert.equal(progression(0).speed,3.2);
 assert.equal(progression(10).progress,10);assert.equal(progression(11).level,2);
 assert.equal(progression(11).total,12);assert.equal(progression(22).level,2);
 assert.equal(progression(23).level,3);assert.equal(progression(23).total,13);
 for(let n=0;n<1000;n++){const p=progression(n);assert.ok(p.progress>=0&&p.progress<p.total);assert.ok(p.speed>=3.2);assert.ok(p.speed>=progression(n-1).speed);}
});
test('forced scrolling observes initial grace then advances without knight input',()=>{
 const scroll=new ScrollProgression();scroll.tick(2);assert.equal(scroll.state.distance,0);assert.equal(scroll.state.grace,1);
 scroll.tick(2);assert.equal(scroll.state.distance,3.2);scroll.tick(10);assert.equal(scroll.state.distance,35.2);
 for(let i=0;i<11;i++)scroll.landed();assert.equal(scroll.state.level,2);const previous=scroll.state.distance;
 scroll.tick(1);assert.ok(Math.abs(scroll.state.distance-previous-3.2)<1e-9);
 scroll.reset();assert.equal(scroll.state.distance,0);assert.equal(scroll.state.landings,0);assert.equal(scroll.state.level,1);
});
test('long frames across the grace period produce the same scroll distance as short frames',()=>{
 const a=new ScrollProgression(),b=new ScrollProgression();a.tick(7);for(let i=0;i<70;i++)b.tick(.1);
 assert.ok(Math.abs(a.state.distance-b.state.distance)<1e-9);assert.throws(()=>a.tick(-1),/duration/);
});

test('four difficulty bands change music and scrolling together every three levels',()=>{
 const expected=[[1,3,'Easy',.5,3.2],[4,6,'Intermediate',1,3.85],[7,9,'Advanced',1.26,4.5],[10,30,'Expert',1.5,5.15]];
 for(const [first,last,name,musicSpeed,speed] of expected)for(let level=first;level<=last;level++){
  const tier=difficulty(level);assert.equal(tier.name,name);assert.equal(tier.musicSpeed,musicSpeed);assert.equal(tier.speed,speed);
 }
 let total=0;for(let level=1;level<=12;level++){const p=progression(total);assert.equal(p.level,level);assert.equal(p.speed,difficulty(level).speed);total+=p.total;}
});

test('charging a longer group rewards each move with a faster jump',()=>{
 for(const level of [1,4,7,10]){
  for(let moves=2;moves<=4;moves++)assert.ok(jumpDuration(level,moves)<jumpDuration(level,moves-1));
  assert.ok(jumpDuration(level,4)>=.34);
 }
 assert.equal(jumpDuration(1),jumpDuration(3));assert.ok(jumpDuration(4)<jumpDuration(3));
});
