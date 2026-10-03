import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import {knightDestination,rotateGrid} from './src/rules.js';
const gameURL=process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(gameURL);await page.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'),null,{timeout:60000});
await page.waitForTimeout(1200);await page.screenshot({path:'/tmp/knightwave-desktop-final.png'});
await page.getByRole('button',{name:'Let’s ride'}).click();
assert.equal(await page.locator('#hint').count(),0);
assert.equal(await page.locator('#orbit').count(),0);
await page.keyboard.press('ArrowRight');assert.equal((await page.evaluate(()=>window.knightwave.state())).selected,1);
await page.keyboard.press('ArrowLeft');assert.equal((await page.evaluate(()=>window.knightwave.state())).selected,0);
await page.waitForTimeout(250);
const cruise=await page.evaluate(()=>window.knightwave.state());assert.equal(cruise.speed,34);assert.ok(cruise.camera.y<4.7);assert.ok(Math.abs(cruise.knightYaw-Math.PI/2)<.05);
for(let jump=1;jump<=8;jump++){
  await page.waitForFunction(n=>{const s=window.knightwave.state();return s.jump===n&&s.phase==='air'},jump,{timeout:15000});
  const s=await page.evaluate(()=>window.knightwave.state());
  const overlaps=await page.evaluate(()=>{const {scene,state}=window.knightwave,s=state();const bounds=index=>{const deck=scene.getTransformNodeByName('rainbow road '+index).getChildMeshes().find(m=>m.name==='violet deck');deck.computeWorldMatrix(true);return deck.getBoundingInfo().boundingBox;};const a=bounds(s.jump-1),b=bounds(s.jump);return a.minimumWorld.x<b.maximumWorld.x&&a.maximumWorld.x>b.minimumWorld.x&&a.minimumWorld.z<b.maximumWorld.z&&a.maximumWorld.z>b.minimumWorld.z;});
  assert.equal(overlaps,false,'Departure and landing roads intersect');
  const destination=rotateGrid(knightDestination(s.target),s.heading);
  assert.ok(Math.abs(s.landingHeading-s.heading-s.target*Math.PI/2)<1e-8);
  assert.equal(s.landing.x-s.launch.x,destination.x*s.cellSize);
  assert.equal(s.landing.z-s.launch.z,destination.z*s.cellSize);
  const key=s.target>0?'ArrowRight':'ArrowLeft';for(let i=0;i<Math.abs(s.target);i++)await page.keyboard.press(key);
  if(jump===3){await page.keyboard.press('ArrowRight');await page.waitForTimeout(160);await page.keyboard.press('ArrowLeft');assert.equal((await page.evaluate(()=>window.knightwave.state())).selected,2);}
  if(jump===2){await page.getByRole('button',{name:'Pause game'}).click();const paused=await page.evaluate(()=>window.knightwave.state());await page.waitForTimeout(220);assert.equal((await page.evaluate(()=>window.knightwave.state())).airtime,paused.airtime);await page.getByRole('button',{name:'Keep riding'}).click();}
  if(jump===3){await page.waitForTimeout(280);assert.ok((await page.evaluate(()=>window.knightwave.state())).sparkles>0);await page.screenshot({path:'/tmp/knightwave-midair-final.png'});}
  await page.waitForFunction(n=>window.knightwave.state().landings===n,jump,{timeout:5000});
  console.log('LANDED',jump,JSON.stringify(await page.evaluate(()=>window.knightwave.state())));
}
await page.getByRole('button',{name:'Mute soundtrack'}).click();assert.equal((await page.evaluate(()=>window.knightwave.state())).audio.muted,true);
await page.getByRole('button',{name:'Unmute soundtrack'}).click();
// Deliberately miss; verify recovery and a fresh run without disposing shared materials.
await page.waitForFunction(()=>window.knightwave.state().mode==='over',null,{timeout:15000});
await page.screenshot({path:'/tmp/knightwave-gameover-final.png'});await page.getByRole('button',{name:'Ride again'}).click();assert.equal((await page.evaluate(()=>window.knightwave.state())).score,0);
await page.getByRole('button',{name:'How to play'}).click();assert.equal(await page.getByRole('dialog').count(),1);await page.getByRole('button',{name:'Got it'}).click();
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});mobile.on('pageerror',e=>errors.push(e.message));
await mobile.goto(gameURL);await mobile.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));
await mobile.waitForTimeout(900);await mobile.screenshot({path:'/tmp/knightwave-mobile-start-final.png'});
assert.deepEqual((await mobile.evaluate(()=>window.knightwave.state())).render,{width:780,height:1688});
await mobile.getByRole('button',{name:'Let’s ride'}).tap();
await mobile.touchscreen.tap(315,410);assert.equal((await mobile.evaluate(()=>window.knightwave.state())).selected,1);
await mobile.touchscreen.tap(80,410);assert.equal((await mobile.evaluate(()=>window.knightwave.state())).selected,0);
await mobile.waitForFunction(()=>window.knightwave.state().phase==='air',null,{timeout:15000});await mobile.touchscreen.tap(315,410);await mobile.waitForTimeout(200);await mobile.screenshot({path:'/tmp/knightwave-mobile-air-final.png'});await mobile.waitForFunction(()=>window.knightwave.state().landings===1,null,{timeout:5000});
await mobile.waitForFunction(()=>window.knightwave.state().jump===2&&window.knightwave.state().phase==='air',null,{timeout:15000});await mobile.getByRole('button',{name:'Rotate knight left'}).tap();await mobile.waitForFunction(()=>window.knightwave.state().landings===2,null,{timeout:5000});
assert.equal(errors.length,0);console.log(JSON.stringify({result:'PASS',desktopJumps:8,midairCorrection:true,pause:true,restart:true,mute:true,mobileJumps:2,errors,mobile:await mobile.evaluate(()=>window.knightwave.state())}));await browser.close();
