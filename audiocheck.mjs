import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/');
 await page.evaluate(async()=>{const {Soundtrack}=await import('./src/audio.js');window.soundcheck=new Soundtrack();await window.soundcheck.start();});
 const state=()=>page.evaluate(()=>{const s=window.soundcheck;return {speed:s.track.speed,time:s.music.currentTime,playing:!s.music.paused,loop:s.music.loop,duration:s.music.duration,gain:s.master.gain.value,context:s.ctx.state,error:s.music.error?.message};});
 await page.waitForTimeout(300);let s=await state();assert.equal(s.speed,.5);assert.ok(s.playing);assert.ok(s.time>0);assert.ok(s.loop);assert.equal(s.error,undefined);
 const expected=[1,1.26,1.5];
 for(const [index,level] of [4,7,10].entries()){
  await page.evaluate(()=>{window.soundcheck.music.currentTime=20;});const previous=await state();
  await page.evaluate(level=>window.soundcheck.setLevel(level),level);
  await page.waitForFunction(speed=>window.soundcheck.track.speed===speed&&window.soundcheck.music.readyState>=3&&!window.soundcheck.music.paused,expected[index]);
  s=await state();assert.ok(Math.abs(s.time*s.speed-previous.time*previous.speed)<1);assert.equal(s.speed,expected[index]);assert.equal(s.error,undefined);
 }
 await page.evaluate(()=>window.soundcheck.setLevel(20));assert.equal((await state()).speed,1.5);
 await page.evaluate(()=>window.soundcheck.stop());s=await state();assert.equal(s.playing,false);await page.waitForTimeout(150);assert.equal((await state()).time,s.time);
 await page.evaluate(()=>window.soundcheck.start());assert.ok((await state()).playing);
 await page.evaluate(()=>window.soundcheck.mute());await page.waitForTimeout(250);assert.ok((await state()).gain<.001);
 await page.evaluate(()=>{window.soundcheck.setLevel(1,{reset:true});});await page.waitForFunction(()=>window.soundcheck.music.readyState>=3&&!window.soundcheck.music.paused);s=await state();assert.equal(s.speed,.5);assert.ok(s.time<1);
 await page.evaluate(()=>{const s=window.soundcheck;if(s.muted)s.mute();s.analyser=s.ctx.createAnalyser();s.master.connect(s.analyser);});
 await page.evaluate(()=>window.soundcheck.pause());await page.waitForTimeout(120);
 assert.equal((await state()).playing,false);assert.equal((await state()).context,'running');
 assert.ok(await page.evaluate(()=>{const s=window.soundcheck,data=new Uint8Array(s.analyser.fftSize);s.analyser.getByteTimeDomainData(data);return data.some(v=>Math.abs(v-128)>1);}), 'pause cue audible after recording fades');
 const pausedTime=(await state()).time;await page.waitForTimeout(240);assert.equal((await state()).context,'suspended');assert.equal((await state()).time,pausedTime);
 await page.evaluate(()=>window.soundcheck.start());assert.ok((await state()).playing);
 for(const cue of ['clear','over']){
  await page.evaluate(cue=>window.soundcheck.end(cue),cue);
  await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>window.soundcheck.musicGain.gain.value)<1);
  await page.waitForTimeout(250);assert.equal((await state()).playing,false);assert.equal(await page.evaluate(()=>window.soundcheck.musicGain.gain.value),0);
  assert.ok(await page.evaluate(()=>{const s=window.soundcheck,data=new Uint8Array(s.analyser.fftSize);s.analyser.getByteTimeDomainData(data);return data.some(v=>Math.abs(v-128)>1);}),`${cue} melody remains audible after recording fades`);
  await page.evaluate(()=>{window.soundcheck.setLevel(1,{reset:true});return window.soundcheck.start();});assert.ok((await state()).playing);assert.equal(await page.evaluate(()=>window.soundcheck.musicGain.gain.value),1);
 }
 assert.deepEqual(errors,[]);console.log('PASS: all four recordings decode/play, ordered levels, phrase position, final speed cap, looping, pause/resume, mute, retry reset, quick recording fade and audible ending melodies.');
}finally{await browser.close();}
