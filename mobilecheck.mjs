import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
await p.addInitScript(()=>{window.addEventListener('pointerdown',e=>{if(window.knightwave?.state().mode==='playing')window.tapResult={delay:performance.now()-e.timeStamp,selected:window.knightwave.state().selected,yaw:window.knightwave.state().knightYaw};});});
await p.goto(process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/');await p.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));await p.waitForTimeout(1000);
await p.screenshot({path:'/tmp/knightwave-mobile-start-v4.png'});
for(const label of ['How to play','Mute soundtrack']){const box=await p.getByRole('button',{name:label}).boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);}
await p.getByRole('button',{name:'Let’s ride'}).tap();
await p.touchscreen.tap(310,400);let tap=await p.evaluate(()=>window.tapResult);assert.equal(tap.selected,1);assert.ok(tap.delay<50);assert.ok(Math.abs(tap.yaw-(Math.PI/2+.32))<1e-8);console.log('INSTANT TOUCH',JSON.stringify(tap));
await p.touchscreen.tap(70,400);tap=await p.evaluate(()=>window.tapResult);assert.equal(tap.selected,0);assert.ok(tap.delay<50);
await p.waitForFunction(()=>window.knightwave.state().phase==='air');await p.getByRole('button',{name:'Rotate knight right'}).tap();await p.waitForTimeout(150);await p.screenshot({path:'/tmp/knightwave-mobile-air-v4.png'});await p.waitForFunction(()=>window.knightwave.state().landings===1);
await p.getByRole('button',{name:'Pause game'}).tap();await p.screenshot({path:'/tmp/knightwave-mobile-pause-v4.png'});await p.getByRole('button',{name:'Keep riding'}).tap();assert.equal((await p.evaluate(()=>window.knightwave.state())).mode,'playing');
await p.setViewportSize({width:844,height:390});await p.screenshot({path:'/tmp/knightwave-mobile-landscape-v4.png'});console.log('MOBILE PASS');await browser.close();
