import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {swipe} from './gestures.mjs';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  await p.addInitScript(()=>window.addEventListener('pointerdown',e=>{if(window.knightwave?.state().mode==='playing')window.tapResult={delay:performance.now()-e.timeStamp,...window.knightwave.state()};}));
  await p.goto(process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/');await p.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));
  await p.getByRole('button',{name:'Let’s ride'}).tap();await p.waitForFunction(()=>window.knightwave.state().phase==='waiting');
  await p.touchscreen.tap(310,630);let tap=await p.evaluate(()=>window.tapResult);assert.equal(tap.draft,1);assert.equal(tap.selected,0);assert.ok(tap.delay<50);assert.ok(Math.abs(tap.knightYaw-(Math.PI/2+.32))<1e-8);console.log('INSTANT ORB INPUT',tap.delay.toFixed(1)+' ms');
  await p.touchscreen.tap(65,630);assert.equal((await p.evaluate(()=>window.knightwave.state())).draft,0);
  // A canceled drag restores the draft rather than adding a spurious tap.
  const cdp=await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:315,y:650,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:365,y:650,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await p.evaluate(()=>window.knightwave.state())).draft,0);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:315,y:650,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await p.evaluate(()=>window.knightwave.state())).draft,0);await cdp.detach();
  await p.touchscreen.tap(310,630);await swipe(p,'up',320);let s=await p.evaluate(()=>window.knightwave.state());assert.equal(s.draft,0);assert.equal(s.moveQueue.length,1);assert.equal(s.selected,1,'Swiping from a side must dispatch the existing draft without an extra turn');
  await p.getByRole('button',{name:'Rotate knight right'}).tap();await p.getByRole('button',{name:'Rotate knight right'}).tap();
  await p.getByRole('button',{name:'Send premove',exact:true}).tap();assert.equal((await p.evaluate(()=>window.knightwave.state())).moveQueue.at(-1).turns,2);
  await swipe(p,'down');s=await p.evaluate(()=>window.knightwave.state());assert.equal(s.draft,2);assert.equal(s.moveQueue.length,1);
  await swipe(p);await p.waitForFunction(()=>window.knightwave.state().landings===1);
  await p.getByRole('button',{name:'Pause game'}).tap();const paused=await p.evaluate(()=>window.knightwave.state());await p.waitForTimeout(160);assert.deepEqual((await p.evaluate(()=>window.knightwave.state())).position,paused.position);
  await p.getByRole('button',{name:'Keep riding'}).tap();await p.setViewportSize({width:844,height:390});await p.waitForTimeout(180);await p.screenshot({path:'/tmp/knightwave-orb-landscape.png'});
  console.log('MOBILE PASS: immediate orb input, canceled drags, side swipe dispatch, button dispatch, recall and pause');
}finally{await b.close();}
