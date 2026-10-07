import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {EndlessCourse} from './src/board.js';
const output=process.env.KNIGHTWAVE_CAPTURES||'/tmp/knightwave-levels';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/');await page.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));await page.locator('#world').tap();
 const state=()=>page.evaluate(()=>window.knightwave.state());const model=new EndlessCourse(),clears=[];
 // Exercise all transitions through Intermediate with the real controls and clock.
 for(let batch=0;batch<9;batch++){
  await page.waitForFunction(()=>window.knightwave.state().mode==='playing');
  const before=await state();let origin=model.current;const planned=[];
  for(let i=0;i<4;i++){const option=model.previewOptions(origin)[0];planned.push(option);origin=option;await page.getByRole('button',{name:`Compose ${option.move.first}`,exact:true}).tap();await page.getByRole('button',{name:`Compose ${option.move.first}`,exact:true}).tap();await page.getByRole('button',{name:`Compose ${option.move.second}`,exact:true}).tap();}
  assert.equal(await page.locator('#orb-send').getAttribute('data-charge'),'4');
  if(batch===0)await page.screenshot({path:`${output}/charged-orb.png`});
  await page.locator('#orb-send').tap();
  for(let i=0;i<4;i++){
   const target=before.landings+i+1;
   await page.waitForFunction(n=>window.knightwave.state().landings>=n,target,{timeout:45000});
   const s=await state();model.advance(planned[i]);assert.equal(s.landings,target);assert.equal(s.comboPower,4);assert.equal(s.comboEffects.successes,target);assert.ok(s.jumpDuration<.4);assert.ok(s.comboEffects.active>0);
   if(s.mode==='level-clear'){
    assert.equal(s.finish.clearVisible,true);assert.equal(s.audio.cue,'clear');
    await page.waitForTimeout(320);const silent=await state();assert.equal(silent.audio.playing,false);assert.equal(silent.audio.musicGain,0);
    const z=silent.camera.z,time=silent.runTime;await page.waitForTimeout(150);assert.equal((await state()).camera.z,z);assert.equal((await state()).runTime,time);
    await page.getByRole('button',{name:'Pause game'}).tap();const elapsed=(await state()).levelClear.elapsed;await page.waitForTimeout(150);assert.equal((await state()).levelClear.elapsed,elapsed);await page.getByRole('button',{name:'RESUME',exact:true}).tap();
    await page.screenshot({path:`${output}/level-${s.levelClear.completedLevel}-clear.png`});
    await page.waitForFunction(()=>window.knightwave.state().mode==='playing',null,{timeout:10000});
    const next=await state();assert.equal(next.audio.speed,next.progression.musicSpeed);assert.ok(next.audio.time<1);assert.equal(next.audio.musicGain,1);
    clears.push({completed:s.levelClear.completedLevel,next:next.progression.level,difficulty:next.progression.difficulty,speed:next.scrollSpeed,cameraFrozen:z===silent.camera.z,runTimeFrozen:time===silent.runTime});
   }
  }
 }
 const end=await state();assert.equal(end.landings,36);assert.equal(end.progression.level,4);assert.equal(end.progression.difficulty,'Intermediate');assert.equal(end.audio.speed,1);assert.equal(end.scrollSpeed,3.85);assert.deepEqual(clears.map(c=>c.completed),[1,2,3]);assert.deepEqual(errors,[]);
 // Game over fades only the recording and leaves the original ending motif audible.
 await page.waitForFunction(()=>window.knightwave.state().mode==='over',null,{timeout:45000});assert.equal((await state()).audio.cue,'over');assert.match(await page.locator('.game-over-level').textContent(),/LEVEL 04/);await page.waitForTimeout(320);assert.equal((await state()).audio.musicGain,0);assert.equal((await state()).audio.playing,false);
 await page.getByRole('button',{name:'PLAY AGAIN'}).tap();await page.waitForFunction(()=>window.knightwave.state().audio.playing);const retry=await state();assert.equal(retry.progression.level,1);assert.equal(retry.audio.speed,.5);assert.equal(retry.audio.musicGain,1);
 await writeFile(`${output}/level-report.json`,JSON.stringify(clears,null,2));console.log('PASS: 36 native-touch landings, charged 4-move combos, three finish celebrations, frozen/pausable transitions, music fades/restarts, Intermediate at level4, game-over fade and retry.');
}finally{await browser.close();}
