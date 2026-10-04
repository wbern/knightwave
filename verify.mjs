import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
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
    const initial=await page.evaluate(()=>window.knightwave.state());
    assert.deepEqual(initial.board,{radius:4,cells:81,extent:18});
    assert.equal(initial.camera.orthographic,true);assert.ok(initial.camera.y>40);
    const press=async dir=>phone?await page.getByRole('button',{name:dir>0?'Rotate knight right':'Rotate knight left'}).tap():await page.keyboard.press(dir>0?'ArrowRight':'ArrowLeft');
    for(let jump=1;jump<=6;jump++){
      await page.waitForFunction(n=>{const s=window.knightwave.state();return s.jump===n&&s.phase==='ready'},jump);
      const s=await page.evaluate(()=>window.knightwave.state()),offset=rotateGrid(knightDestination(s.target),s.heading);
      assert.deepEqual(s.camera,initial.camera);
      assert.equal(s.landing.x-s.launch.x,offset.x*s.cellSize);
      assert.equal(s.landing.z-s.launch.z,offset.z*s.cellSize);
      for(let i=0;i<Math.abs(s.target);i++)await press(Math.sign(s.target));
      assert.deepEqual((await page.evaluate(()=>window.knightwave.state())).camera,initial.camera);
      if(jump===2){
        await page.getByRole('button',{name:'Pause game'}).click();const paused=await page.evaluate(()=>window.knightwave.state());
        await page.waitForTimeout(180);assert.equal((await page.evaluate(()=>window.knightwave.state())).planning,paused.planning);
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
        await page.screenshot({path:`/tmp/knightwave-${name}-midair-final.png`});
      }
      await page.waitForFunction(n=>window.knightwave.state().landings===n,jump,{timeout:6000});
      const landed=await page.evaluate(()=>window.knightwave.state());
      assert.equal(landed.position.x,s.landing.x);assert.equal(landed.position.z,s.landing.z);
      assert.deepEqual(landed.camera,initial.camera);
    }
    const won=await page.evaluate(()=>window.knightwave.state());assert.equal(won.mode,'won');assert.equal(won.combo,6);
    assert.deepEqual(won.position,initial.position);
    await page.waitForTimeout(200);assert.deepEqual((await page.evaluate(()=>window.knightwave.state())).position,won.position);
    await page.screenshot({path:`/tmp/knightwave-${name}-win-final.png`});
    await page.getByRole('button',{name:'Ride again'}).click();assert.equal((await page.evaluate(()=>window.knightwave.state())).score,0);
    await page.getByRole('button',{name:'Mute soundtrack'}).click();assert.equal((await page.evaluate(()=>window.knightwave.state())).audio.muted,true);
    await page.getByRole('button',{name:'Unmute soundtrack'}).click();
    await page.getByRole('button',{name:'How to play'}).click();assert.equal(await page.getByRole('dialog').count(),1);
    await page.getByRole('button',{name:'Got it'}).click();
    // A neutral straight jump misses the gold destination; retry must fully reset.
    await page.waitForFunction(()=>window.knightwave.state().mode==='over',null,{timeout:10000});
    await page.screenshot({path:`/tmp/knightwave-${name}-gameover-final.png`});
    await page.getByRole('button',{name:'Ride again'}).click();assert.equal((await page.evaluate(()=>window.knightwave.state())).landings,0);
    await page.close();console.log(name,'PASS: six exact landings, closed circuit, fixed camera, correction, pause, win, miss and retry');
  }
  assert.deepEqual(errors,[]);console.log('PASS: no page errors');
}finally{await browser.close();}
