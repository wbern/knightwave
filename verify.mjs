import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {CELL_SIZE} from './src/board.js';
import {knightDestination} from './src/rules.js';
import {PLATFORM_TOP} from './src/platforms.js';
import {swipe} from './gestures.mjs';
const url=process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/';
const jumps=Number(process.env.KNIGHTWAVE_JUMPS||12);
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const errors=[];
try{
 for(const phone of [false,true]){
  const name=phone?'mobile':'desktop',page=await browser.newPage({viewport:phone?{width:390,height:844}:{width:1440,height:900},isMobile:phone,hasTouch:phone,deviceScaleFactor:phone?2:1});
  page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));
  await page.screenshot({path:`/tmp/knightwave-${name}-start-final.png`});
  const state=()=>page.evaluate(()=>window.knightwave.state());
  const press=dir=>phone?page.getByRole('button',{name:dir>0?'Add right L move':'Add left L move'}).tap():page.keyboard.press(dir>0?'ArrowRight':'ArrowLeft');
  const send=()=>phone?swipe(page):page.keyboard.press(' '),recall=()=>phone?swipe(page,'down'):page.keyboard.press('Backspace');
  await page.getByRole('button',{name:'Let’s ride'}).click();const initial=await state();
  assert.equal(initial.board.endless,true);assert.equal(initial.heading,0);assert.equal(initial.knightYaw,Math.PI/2);
  assert.equal(await page.locator('#flash, .queue-now, .queue-heading').count(),0);assert.equal(await page.locator('#queue-track .move-group').count(),0);
  const banner=await page.locator('#move-queue').evaluate(e=>({background:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderWidth,height:e.getBoundingClientRect().height}));
  assert.equal(banner.background,'rgba(0, 0, 0, 0)');assert.equal(banner.border,'0px');assert.ok(banner.height<=48);
  const geometry=await page.evaluate(()=>{const s=window.knightwave.scene;return {floors:s.meshes.filter(m=>m.name.includes('chess grid')).length,rims:!!s.getMeshByName('raised square rims'),squares:s.meshes.filter(m=>m.name==='raised chess square').length,decks:s.meshes.filter(m=>m.name==='raised platform deck').map(m=>m.getBoundingInfo().boundingBox.extendSize.asArray()),floor:s.getMaterialByName('recessed light square').diffuseColor.toLuminance(),top:s.getMaterialByName('ivory chess square').diffuseColor.toLuminance()};});
  assert.equal(geometry.floors,2);assert.equal(geometry.rims,true);assert.equal(geometry.squares,5);assert.ok(geometry.top>geometry.floor*3);
  for(const [width,,depth] of geometry.decks){assert.ok(Math.abs(width-depth)<1e-6&&width*2<CELL_SIZE);}
  await page.waitForTimeout(180);assert.equal((await state()).position.z,initial.position.z);assert.equal(await page.evaluate(()=>window.knightwave.dispatch()),false);
  await page.evaluate(()=>{window.landingAudit=[];window.knightwave.scene.onAfterRenderObservable.add(()=>{const s=window.knightwave.state();if(s.landings>window.landingAudit.length)window.landingAudit.push(s.lastLanding);});});
  await press(1);assert.equal((await state()).draft,1);assert.equal((await state()).selected,0);assert.equal((await state()).knightYaw,Math.PI/2);await send();assert.equal((await state()).locked,true);
  await press(-1);await press(-1);await send();await press(1);await send();await recall();assert.equal((await state()).draft,1);assert.equal((await state()).selected,1);await send();
  assert.ok((await state()).moveQueue.every(g=>g.heading===0));assert.equal(await page.locator('#orb-glyphs .move-icon').count(),0);
  for(let jump=1;jump<=jumps;jump++){
   if((await state()).landings>=jump)continue;
   if(jump>3){
    await page.waitForFunction(n=>{const s=window.knightwave.state();return s.jump===n&&['waiting','settle'].includes(s.phase);},jump);
    const target=(await state()).target;for(let i=0;i<Math.abs(target);i++)await press(Math.sign(target));await send();
   }
   await page.waitForFunction(n=>{const s=window.knightwave.state();return s.jump===n&&s.phase==='air'&&s.airtime>.06;},jump);
   const airborne=await state(),offset=knightDestination(airborne.target);
   assert.equal(airborne.landing.x-airborne.launch.x,offset.x*CELL_SIZE);assert.equal(airborne.landing.z-airborne.launch.z,offset.z*CELL_SIZE);assert.equal(airborne.heading,0);assert.equal(airborne.knightYaw,Math.PI/2);assert.deepEqual(airborne.orb,initial.orb);assert.equal(airborne.glow,initial.glow);
   if(jump===5){
    await press(1);assert.equal((await state()).selected,airborne.selected);await press(-1);
    await page.getByRole('button',{name:'Pause game'}).click();const paused=await state();await page.waitForTimeout(150);const still=await state();assert.deepEqual(still.position,paused.position);assert.deepEqual(still.camera,paused.camera);assert.deepEqual(still.platforms,paused.platforms);
    await page.getByRole('button',{name:'Keep riding'}).click();await page.waitForTimeout(100);assert.ok((await state()).sparkles>0);await page.screenshot({path:`/tmp/knightwave-${name}-midair-final.png`});
   }
   await page.waitForFunction(n=>window.knightwave.state().landings===n,jump,{timeout:7000});const landed=await state();
   assert.deepEqual(landed.lastLanding,{x:airborne.landing.x,y:PLATFORM_TOP+.06,z:airborne.landing.z});assert.equal(landed.knightYaw,Math.PI/2);assert.deepEqual(landed.trick,{yaw:0,roll:0,pitch:0});
   assert.ok(Math.abs(landed.camera.rotation.x-initial.camera.rotation.x)<1e-8);assert.equal(landed.camera.rotation.y,0);assert.equal(landed.camera.rotation.z,0);assert.equal(landed.meshes,initial.meshes);assert.ok(landed.platforms.length<=5&&landed.board.retainedStops<=11);
  }
  const running=await state();assert.equal(running.mode,'playing');assert.equal(running.landings,jumps);assert.ok(running.position.z>32);assert.ok(running.camera.z>initial.camera.z+32);assert.ok(running.board.firstRow>initial.board.firstRow);assert.equal((await page.evaluate(()=>window.landingAudit)).length,jumps);
  await page.getByRole('button',{name:'Pause game'}).click();await page.evaluate(()=>document.getElementById('modal').classList.add('hidden'));await page.screenshot({path:`/tmp/knightwave-${name}-endless-final.png`});await page.evaluate(()=>window.knightwave.resume());
  await page.getByRole('button',{name:'Mute soundtrack'}).click();assert.equal((await state()).audio.muted,true);await page.getByRole('button',{name:'Unmute soundtrack'}).click();
  await page.getByRole('button',{name:'How to play'}).click();await page.getByRole('button',{name:'Got it'}).click();
  await page.waitForFunction(()=>window.knightwave.state().phase==='waiting');const wrong=-(await state()).target;for(let i=0;i<Math.abs(wrong);i++)await press(Math.sign(wrong));await send();await page.waitForFunction(()=>window.knightwave.state().mode==='over',null,{timeout:7000});
  await page.screenshot({path:`/tmp/knightwave-${name}-gameover-final.png`});await page.getByRole('button',{name:'Ride again'}).click();const fresh=await state();assert.equal(fresh.landings,0);assert.equal(fresh.position.z,0);assert.equal(fresh.moveQueue.length,0);assert.equal(fresh.meshes,initial.meshes);
  console.log(name,`PASS: ${jumps} north-facing jumps, scrolling, bounded pools, premoves, recall, pause, miss and retry`);await page.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: no page errors');
}finally{await browser.close();}
