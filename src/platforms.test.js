import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PLATFORM_TOP, platformStage, platformPose} from './platforms.js';
test('upcoming platforms rise before becoming a target, and departed platforms fall away',()=>{
  assert.equal(platformStage(3,0),'future');assert.equal(platformStage(3,1),'rising');
  assert.equal(platformStage(3,2),'target');assert.equal(platformStage(3,3),'occupied');assert.equal(platformStage(3,4),'falling');
  assert.ok(platformPose('rising',0).height<PLATFORM_TOP-6);
  assert.ok(platformPose('rising',.3).height>platformPose('rising',0).height);
  assert.equal(platformPose('rising',.85).height,PLATFORM_TOP);
  assert.equal(platformPose('target',0).height,PLATFORM_TOP);
  assert.equal(platformPose('occupied',0).height,PLATFORM_TOP);
  assert.equal(platformPose('falling',0).height,PLATFORM_TOP);
  assert.ok(platformPose('falling',.5).height<platformPose('falling',.1).height);
  assert.equal(platformPose('falling',1.2).visible,false);
  assert.equal(platformPose('future',0).visible,false);
});

test('four future forks are always planned from the opening through expert levels',async()=>{
 const {previewDepth}=await import('./platforms.js');
 for(let level=1;level<=30;level++)for(let index=0;index<50;index++)assert.equal(previewDepth(level,index),4);
});

test('automatic preview exposes future forks without input and respects the chosen branch and finish',async()=>{
 const {previewPlatforms,PLATFORM_RISE_SECONDS}=await import('./platforms.js');
 const {EndlessCourse}=await import('./board.js');const course=new EndlessCourse();
 const shown=previewPlatforms(course,[],4);assert.ok(shown.some(p=>p.index===4));assert.ok(shown.length<=11);
 const path=shown.filter(p=>p.route&&p.origin);assert.equal(path.length,4);
 for(const p of path){const dx=Math.abs(p.x-p.origin.x),dz=p.z-p.origin.z;assert.equal(dx*dz,2);assert.ok(dz>0);}
 assert.deepEqual(course.current,{id:'start',index:0,x:-1,z:0,heading:0,move:null,piece:null,bonus:0});
 const chosen=course.options[1],fork=course.previewOptions(chosen);
 const branch=previewPlatforms(course,[chosen.move],2);for(const p of fork)assert.ok(branch.some(q=>q.id===p.id));
 while(course.current.index<10)course.advance(course.options[0]);
 assert.ok(previewPlatforms(course,[],4).every(p=>p.index<=11));
 assert.equal(platformPose('rising',PLATFORM_RISE_SECONDS).height,PLATFORM_TOP);
});
