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
