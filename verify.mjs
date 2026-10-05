import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {CELL_SIZE,createCircuit} from './src/board.js';
import {knightDestination,rotateGrid} from './src/rules.js';
const url=process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const errors=[];
try {
  for(const phone of [false,true]){
    const name=phone?'mobile':'desktop';
    const page=await browser.newPage({viewport:phone?{width:390,height:844}:{width:1440,height:900},isMobile:phone,hasTouch:phone,deviceScaleFactor:phone?2:1});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);await page.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'),null,{timeout:60000});
    await page.waitForTimeout(600);await page.screenshot({path:`/tmp/knightwave-${name}-start-final.png`});
    if(phone)assert.deepEqual((await page.evaluate(()=>window.knightwave.state())).render,{width:780,height:1688});
    await page.getByRole('button',{name:'Let’s ride'}).click();
    assert.equal(await page.locator('#hint, #orbit').count(),0);
    assert.equal(await page.locator('#queue-track .move-group').count(),6);
    assert.equal(await page.evaluate(()=>window.knightwave.scene.meshes.some(m=>['complete circuit route','selected knight trace','your landing preview'].includes(m.name))),false);
    const projected=await page.evaluate(()=>{const game=window.knightwave,camera=game.scene.activeCamera,identity=game.scene.meshes[0].getWorldMatrix().constructor.Identity(),viewport=camera.viewport.toGlobal(innerWidth,innerHeight);return [[-16,-16],[12,-16],[-16,12]].map(([x,z])=>{const point=game.scene.getTransformNodeByName('knight').position.clone();point.set(x,-2,z);const screen=point.constructor.Project(point,identity,game.scene.getTransformMatrix(),viewport);return {x:screen.x,y:screen.y};});});
    assert.ok(projected[1].x>projected[0].x&&Math.abs(projected[1].y-projected[0].y)<.01);
    assert.ok(projected[2].y<projected[0].y&&Math.abs(projected[2].x-projected[0].x)<.01);
    assert.equal(await page.locator('#board-labels span').count(),16);
    const initial=await page.evaluate(()=>window.knightwave.state());
    assert.deepEqual(initial.board,{min:-4,max:3,cells:64,extent:16});
    assert.equal(initial.camera.orthographic,true);assert.ok(initial.camera.y>40);assert.ok(initial.camera.rotation.x>.65&&initial.camera.rotation.x<1.1,'Camera shows depth while keeping ranks aligned');
    assert.equal(await page.evaluate(()=>window.knightwave.scene.getMeshByName('turned chess pedestal')?.getTotalVertices()>100),true);
    const press=async dir=>phone?await page.getByRole('button',{name:dir>0?'Rotate knight right':'Rotate knight left'}).tap():await page.keyboard.press(dir>0?'ArrowRight':'ArrowLeft');
    for(let jump=1;jump<=6;jump++){
      await page.waitForFunction(n=>{const s=window.knightwave.state();return s.jump===n&&s.phase==='cruise'},jump);
      const s=await page.evaluate(()=>window.knightwave.state()),offset=rotateGrid(knightDestination(s.target),s.heading);
      assert.deepEqual(s.camera,initial.camera);
      assert.equal(s.landing.x-s.launch.x,offset.x*s.cellSize);
      assert.equal(s.landing.z-s.launch.z,offset.z*s.cellSize);
      for(let i=0;i<Math.abs(s.target);i++)await press(Math.sign(s.target));
      assert.deepEqual((await page.evaluate(()=>window.knightwave.state())).camera,initial.camera);
      assert.equal(await page.locator('#queued-moves .move-icon').count(),Math.abs(s.target));
      if(jump===1){
        assert.equal(s.platforms[1].stage,'target');assert.equal(s.platforms[1].height,.8);
        await page.waitForTimeout(180);const moving=await page.evaluate(()=>window.knightwave.state());
        assert.ok(Math.hypot(moving.position.x-s.position.x,moving.position.z-s.position.z)>.5,'Knight must travel during the run-up');
        assert.ok(moving.platforms[2].height>s.platforms[2].height,'Upcoming platform must rise');
      }
      if(jump===2){
        await page.getByRole('button',{name:'Pause game'}).click();const paused=await page.evaluate(()=>window.knightwave.state());
        await page.waitForTimeout(180);assert.equal((await page.evaluate(()=>window.knightwave.state())).planning,paused.planning);
        assert.deepEqual((await page.evaluate(()=>window.knightwave.state())).position,paused.position);
        assert.deepEqual((await page.evaluate(()=>window.knightwave.state())).platforms,paused.platforms);
        await page.getByRole('button',{name:'Keep riding'}).click();
      }
      await page.waitForFunction(()=>window.knightwave.state().phase==='air');
      if(jump===3){
        await press(1);await page.waitForTimeout(120);await press(-1);
        assert.equal((await page.evaluate(()=>window.knightwave.state())).selected,s.target);
        await page.getByRole('button',{name:'Pause game'}).click();const paused=await page.evaluate(()=>window.knightwave.state());
        await page.waitForTimeout(180);assert.equal((await page.evaluate(()=>window.knightwave.state())).airtime,paused.airtime);
        await page.getByRole('button',{name:'Keep riding'}).click();
        await page.waitForTimeout(160);assert.ok((await page.evaluate(()=>window.knightwave.state())).sparkles>0);
        assert.equal(await page.locator('#flight-indicator').evaluate(e=>e.classList.contains('in-air')),true);
        assert.equal(await page.evaluate(()=>window.knightwave.scene.getMeshByName('hover shadow').isEnabled()),true);
        const separation=await page.evaluate(()=>{const g=window.knightwave,c=g.scene.activeCamera,point=g.scene.getTransformNodeByName('knight').position.clone(),identity=g.scene.meshes[0].getWorldMatrix().constructor.Identity(),viewport=c.viewport.toGlobal(innerWidth,innerHeight);const elevated=point.constructor.Project(point,identity,g.scene.getTransformMatrix(),viewport);point.y=-2.015;const ground=point.constructor.Project(point,identity,g.scene.getTransformMatrix(),viewport);return ground.y-elevated.y;});
        assert.ok(separation>12,'Airtime must show visible separation above the ground');
        await page.screenshot({path:`/tmp/knightwave-${name}-midair-final.png`});
      }
      await page.waitForFunction(n=>window.knightwave.state().landings===n,jump,{timeout:6000});
      const landed=await page.evaluate(()=>window.knightwave.state());
      assert.equal(landed.lastLanding.x,s.landing.x);assert.equal(landed.lastLanding.z,s.landing.z);
      assert.deepEqual(landed.camera,initial.camera);
      if(jump<6)assert.equal(await page.locator('#queue-track .move-group:not(.consumed)').count(),6-jump);
      assert.equal(landed.platforms[jump-1].stage,'falling');
      if(jump===1){await page.waitForTimeout(180);assert.ok((await page.evaluate(()=>window.knightwave.state())).platforms[0].height<landed.platforms[0].height,'Departed platform must fall');}
    }
    const won=await page.evaluate(()=>window.knightwave.state());assert.equal(won.mode,'won');assert.equal(won.combo,6);
    const home=createCircuit()[0];assert.deepEqual(won.position,{x:home.x*CELL_SIZE,y:.8+.06,z:home.z*CELL_SIZE});
    await page.waitForTimeout(200);assert.deepEqual((await page.evaluate(()=>window.knightwave.state())).position,won.position);
    await page.screenshot({path:`/tmp/knightwave-${name}-win-final.png`});
    await page.getByRole('button',{name:'Ride again'}).click();assert.equal((await page.evaluate(()=>window.knightwave.state())).score,0);
    await page.getByRole('button',{name:'Mute soundtrack'}).click();assert.equal((await page.evaluate(()=>window.knightwave.state())).audio.muted,true);
    await page.getByRole('button',{name:'Unmute soundtrack'}).click();
    await page.getByRole('button',{name:'How to play'}).click();assert.equal(await page.getByRole('dialog').count(),1);
    await page.getByRole('button',{name:'Got it'}).click();
    // An unselected jump keeps travelling, misses the amber deck and can be retried.
    await page.waitForFunction(()=>{const s=window.knightwave.state();return s.phase==='air'&&s.airtime>.5});
    const unselected=await page.evaluate(()=>window.knightwave.state());
    await page.waitForFunction(()=>{const s=window.knightwave.state();return s.phase==='air'&&s.airtime>.75});
    assert.ok((await page.evaluate(()=>window.knightwave.state())).position.z>unselected.position.z,'Unselected flight must keep moving');
    await page.waitForFunction(()=>window.knightwave.state().mode==='over',null,{timeout:10000});
    await page.screenshot({path:`/tmp/knightwave-${name}-gameover-final.png`});
    await page.getByRole('button',{name:'Ride again'}).click();assert.equal((await page.evaluate(()=>window.knightwave.state())).landings,0);
    await page.close();console.log(name,'PASS: six exact landings, closed circuit, fixed camera, correction, pause, win, miss and retry');
  }
  assert.deepEqual(errors,[]);console.log('PASS: no page errors');
}finally{await browser.close();}
