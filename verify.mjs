import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {CELL_SIZE,createCircuit} from './src/board.js';
import {knightDestination,rotateGrid} from './src/rules.js';
import {PLATFORM_TOP} from './src/platforms.js';
import {swipe} from './gestures.mjs';
const url=process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const errors=[];
try{
  for(const phone of [false,true]){
    const name=phone?'mobile':'desktop';
    const page=await browser.newPage({viewport:phone?{width:390,height:844}:{width:1440,height:900},isMobile:phone,hasTouch:phone,deviceScaleFactor:phone?2:1});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);await page.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));
    await page.waitForTimeout(350);await page.screenshot({path:`/tmp/knightwave-${name}-start-final.png`});
    const state=()=>page.evaluate(()=>window.knightwave.state());
    const press=dir=>phone?page.getByRole('button',{name:dir>0?'Rotate knight right':'Rotate knight left'}).tap():page.keyboard.press(dir>0?'ArrowRight':'ArrowLeft');
    const send=()=>phone?swipe(page):page.keyboard.press(' ');
    const recall=()=>phone?swipe(page,'down'):page.keyboard.press('Backspace');
    await page.getByRole('button',{name:'Let’s ride'}).click();
    await page.evaluate(()=>{window.landingAudit=[];window.knightwave.scene.onAfterRenderObservable.add(()=>{const s=window.knightwave.state();if(s.landings>window.landingAudit.length)window.landingAudit.push({position:s.lastLanding,camera:s.camera});});});
    assert.equal(await page.locator('#hint, #orbit, .queue-now, .queue-heading, .premove').count(),0);
    assert.equal(await page.locator('#queue-track .move-group').count(),0,'Banner must not reveal the answers');
    const banner=await page.locator('#move-queue').evaluate(e=>({background:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderWidth,height:e.getBoundingClientRect().height}));
    assert.equal(banner.background,'rgba(0, 0, 0, 0)');assert.equal(banner.border,'0px');assert.ok(banner.height<=48);
    const sceneCheck=await page.evaluate(()=>{const g=window.knightwave,s=g.scene;return {routes:s.meshes.some(m=>['complete circuit route','selected knight trace','your landing preview'].includes(m.name)),rims:s.meshes.filter(m=>m.name==='raised square rim').length,dividers:s.meshes.filter(m=>m.name==='raised square divider').length,squares:s.meshes.filter(m=>m.name==='raised chess square').length,decks:s.meshes.filter(m=>m.name==='raised platform deck').map(m=>m.getBoundingInfo().boundingBox.extendSize.asArray()),floor:s.getMaterialByName('recessed light square').diffuseColor.toLuminance(),top:s.getMaterialByName('ivory chess square').diffuseColor.toLuminance(),knight:s.getMeshByName('turned chess pedestal').getTotalVertices()};});
    assert.equal(await page.locator('#flash').count(),0);assert.equal(await page.evaluate(()=>window.knightwave.scene.getTransformNodeByName('premove energy orb')),null);assert.equal((await state()).orb.location,'ui');assert.ok(PLATFORM_TOP-(-2.025)<1);assert.equal(sceneCheck.routes,false);assert.equal(sceneCheck.rims,18);assert.equal(sceneCheck.dividers,0);assert.equal(sceneCheck.squares,7);for(const [width,height,depth] of sceneCheck.decks){assert.ok(Math.abs(width-depth)<1e-6);assert.ok(width*2<CELL_SIZE);}assert.ok(sceneCheck.top>sceneCheck.floor*3);assert.ok(sceneCheck.knight>100);
    await page.evaluate(()=>window.knightwave.start());const initial=await state();assert.deepEqual(initial.board,{min:-4,max:3,cells:64,extent:16});assert.equal(await page.locator('#board-labels span').count(),16);
    if(phone)assert.deepEqual(initial.render,{width:780,height:1688});
    const projected=await page.evaluate(()=>{const g=window.knightwave,c=g.scene.activeCamera,I=g.scene.meshes[0].getWorldMatrix().constructor.Identity(),v=c.viewport.toGlobal(innerWidth,innerHeight);return [[-16,-16],[12,-16],[-16,12]].map(([x,z])=>{const p=g.scene.getTransformNodeByName('knight').position.clone();p.set(x,-2,z);return p.constructor.Project(p,I,g.scene.getTransformMatrix(),v).asArray();});});
    assert.ok(projected[1][0]>projected[0][0]&&Math.abs(projected[1][1]-projected[0][1])<.01);assert.ok(projected[2][1]<projected[0][1]&&Math.abs(projected[2][0]-projected[0][0])<.01);
    await page.waitForTimeout(180);const ready=await state();assert.equal(ready.position.x,initial.position.x);assert.equal(ready.position.z,initial.position.z);assert.ok(ready.platforms[2].height>initial.platforms[2].height);assert.deepEqual(ready.launch,{x:ready.position.x,z:ready.position.z});
    await page.waitForFunction(()=>window.knightwave.state().phase==='waiting');const waiting=await state();
    await page.waitForTimeout(150);assert.equal((await state()).position.z,waiting.position.z);assert.equal(await page.evaluate(()=>window.knightwave.dispatch()),false);
    await press(1);assert.equal((await state()).draft,1);assert.equal((await state()).selected,0);assert.equal(await page.locator('#orb-glyphs .move-icon').count(),1);
    await press(-1);assert.equal((await state()).draft,0);await press(1);await send();
    assert.equal((await state()).draft,0);assert.equal((await state()).selected,1);assert.equal((await state()).locked,true);
    // Recalling a future group cannot modify the flying group.
    await press(-1);await send();await recall();assert.equal((await state()).draft,-1);assert.equal((await state()).moveQueue.length,1);assert.equal((await state()).selected,1);
    await press(1);await press(1);await press(1);await send();await press(-1);await send();
    const queued=await state();assert.equal(await page.locator('.group-divider').count(),Math.max(0,queued.moveQueue.length-1));assert.deepEqual(queued.moveQueue.map(g=>g.turns),[1,2,-1].slice(queued.landings));
    assert.deepEqual(queued.moveQueue.map(g=>g.heading),[0,Math.PI/2,Math.PI*1.5].slice(queued.landings));
    for(let jump=1;jump<=6;jump++){
      const before=await state();if(before.landings>=jump)continue;
      if(jump>3){
        await page.waitForFunction(n=>{const s=window.knightwave.state();return s.jump===n&&['settle','waiting'].includes(s.phase);},jump);
        const target=(await state()).target;for(let i=0;i<Math.abs(target);i++)await press(Math.sign(target));
        assert.equal(await page.locator('#orb-glyphs .move-icon').count(),Math.abs(target));await send();assert.equal((await state()).draft,0);
      }
      await page.waitForFunction(n=>{const s=window.knightwave.state();return s.jump===n&&s.phase==='air'&&s.airtime>.04;},jump);
      const airborne=await state();assert.ok(Math.hypot(airborne.position.x-airborne.launch.x,airborne.position.z-airborne.launch.z)>0);const offset=rotateGrid(knightDestination(airborne.target),airborne.heading);
      assert.equal(airborne.landing.x-airborne.launch.x,offset.x*CELL_SIZE);assert.equal(airborne.landing.z-airborne.launch.z,offset.z*CELL_SIZE);assert.deepEqual(airborne.camera,initial.camera);assert.deepEqual(airborne.orb,initial.orb);assert.equal(airborne.glow,initial.glow);
      if(jump===3){
        await press(1);assert.equal((await state()).selected,-1,'Draft edits must not alter flight');await press(-1);
        await page.getByRole('button',{name:'Pause game'}).click();const paused=await state();await page.waitForTimeout(160);
        assert.equal((await state()).airtime,paused.airtime);assert.deepEqual((await state()).platforms,paused.platforms);assert.deepEqual((await state()).position,paused.position);
        await page.getByRole('button',{name:'Keep riding'}).click();await page.waitForTimeout(160);assert.ok((await state()).sparkles>0);
        assert.equal(await page.evaluate(()=>window.knightwave.scene.getMeshByName('hover shadow').isEnabled()),true);
        await page.screenshot({path:`/tmp/knightwave-${name}-midair-final.png`});
      }
      await page.waitForFunction(n=>window.knightwave.state().landings===n,jump,{timeout:6000});const landed=await state();
      assert.deepEqual(landed.trick,{yaw:0,roll:0,pitch:0});assert.equal(landed.glow,initial.glow);assert.equal(landed.lastLanding.x,airborne.landing.x);assert.equal(landed.lastLanding.z,airborne.landing.z);assert.deepEqual(landed.camera,initial.camera);assert.equal(landed.platforms[jump-1].stage,'falling');
      if(jump===1){await page.waitForTimeout(120);assert.ok((await state()).platforms[0].height<landed.platforms[0].height);}
    }
    const audit=await page.evaluate(()=>window.landingAudit);assert.equal(audit.length,6);
    for(let i=0;i<6;i++){assert.equal(audit[i].position.x,createCircuit()[i+1].x*CELL_SIZE);assert.equal(audit[i].position.z,createCircuit()[i+1].z*CELL_SIZE);assert.deepEqual(audit[i].camera,initial.camera);}
    const won=await state();assert.equal(won.mode,'won');assert.equal(won.combo,6);const home=createCircuit()[0];assert.deepEqual(won.position,{x:home.x*CELL_SIZE,y:PLATFORM_TOP+.06,z:home.z*CELL_SIZE});
    await page.screenshot({path:`/tmp/knightwave-${name}-win-final.png`});await page.getByRole('button',{name:'Ride again'}).click();assert.equal((await state()).moveQueue.length,0);assert.equal((await state()).draft,0);
    await page.getByRole('button',{name:'Mute soundtrack'}).click();assert.equal((await state()).audio.muted,true);await page.getByRole('button',{name:'Unmute soundtrack'}).click();
    await page.getByRole('button',{name:'How to play'}).click();assert.equal(await page.getByRole('dialog').count(),1);await page.getByRole('button',{name:'Got it'}).click();
    await press(-1);await send();await page.waitForFunction(()=>window.knightwave.state().mode==='over',null,{timeout:7000});
    await page.screenshot({path:`/tmp/knightwave-${name}-gameover-final.png`});await page.getByRole('button',{name:'Ride again'}).click();assert.equal((await state()).landings,0);
    console.log(name,'PASS: six exact jumps, orb composition, dispatch, dividers, locking, recall, waiting, pause, win, miss and retry');await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS: no page errors');
}finally{await browser.close();}
