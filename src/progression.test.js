import {test} from 'node:test';
import assert from 'node:assert/strict';
import {progression,ScrollProgression} from './progression.js';
test('levels need progressively longer runs and each milestone increases speed',()=>{
 assert.deepEqual(progression(0),{level:1,name:'First flight',progress:0,total:11,speed:3.2});
 assert.equal(progression(10).progress,10);assert.equal(progression(11).level,2);
 assert.equal(progression(11).total,12);assert.equal(progression(22).level,2);
 assert.equal(progression(23).level,3);assert.equal(progression(23).total,13);
 for(let n=0;n<1000;n++){const p=progression(n);assert.ok(p.progress>=0&&p.progress<p.total);assert.ok(p.speed>=3.2);assert.ok(p.speed>=progression(n-1).speed);}
});
test('forced scrolling observes initial grace then advances without knight input',()=>{
 const scroll=new ScrollProgression();scroll.tick(2);assert.equal(scroll.state.distance,0);assert.equal(scroll.state.grace,1);
 scroll.tick(2);assert.equal(scroll.state.distance,3.2);scroll.tick(10);assert.equal(scroll.state.distance,35.2);
 for(let i=0;i<11;i++)scroll.landed();assert.equal(scroll.state.level,2);const previous=scroll.state.distance;
 scroll.tick(1);assert.ok(Math.abs(scroll.state.distance-previous-3.85)<1e-9);
 scroll.reset();assert.equal(scroll.state.distance,0);assert.equal(scroll.state.landings,0);assert.equal(scroll.state.level,1);
});
test('long frames across the grace period produce the same scroll distance as short frames',()=>{
 const a=new ScrollProgression(),b=new ScrollProgression();a.tick(7);for(let i=0;i<70;i++)b.tick(.1);
 assert.ok(Math.abs(a.state.distance-b.state.distance)<1e-9);assert.throws(()=>a.tick(-1),/duration/);
});
