import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {EndlessCourse} from './src/board.js';
export const layouts=[{name:'desktop',width:1280,height:800,phone:false},{name:'phone',width:390,height:844,phone:true},{name:'compact',width:375,height:667,phone:true},{name:'landscape',width:844,height:390,phone:true}];
export async function runBrowserChecks(selectedLayouts=layouts){
 const output=process.env.KNIGHTWAVE_CAPTURES||'/tmp/knightwave-combos',url=process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/',jumps=Number(process.env.KNIGHTWAVE_JUMPS||12),report=[];
 await mkdir(output,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  for(const layout of selectedLayouts){
   const context=await browser.newContext({viewport:{width:layout.width,height:layout.height},isMobile:layout.phone,hasTouch:layout.phone,deviceScaleFactor:layout.phone?2:1}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));await page.goto(url);await page.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));
   await page.screenshot({path:`${output}/${layout.name}-intro.png`});await page.getByRole('button',{name:'Let’s ride'}).click();
   const state=()=>page.evaluate(()=>window.knightwave.state()),press=direction=>layout.phone?page.getByRole('button',{name:`Compose ${direction}`,exact:true}).tap():page.keyboard.press({up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[direction]);
   const send=async()=>{if(layout.phone){await page.locator('#orb-send').tap();await page.locator('#orb-send').tap();}else await page.keyboard.press(' ');};
   await page.evaluate(()=>{
    const initial=window.knightwave.state();window.audit={initial,previous:initial,camera:[],frames:0};
    window.knightwave.scene.onAfterRenderObservable.add(()=>{
     const current=window.knightwave.state(),previous=window.audit.previous;window.audit.frames++;
     if(previous.mode==='playing'&&current.mode==='playing'){
      const expected=current.scrollSpeed*(Math.max(0,current.runTime-3)-Math.max(0,previous.runTime-3));
      if(Math.abs(current.camera.z-previous.camera.z-expected)>1e-5)window.audit.camera.push({current,previous,expected});
     }
     window.audit.previous=current;
    });
   });
   const initial=await state();assert.equal(initial.board.cols,8);assert.equal(await page.locator('#controls-dock #board-labels').count(),0);
   await press('up');assert.deepEqual((await state()).draft,['up']);if(!layout.phone)await page.keyboard.press(' ');assert.equal((await state()).locked,false);await press('down');assert.deepEqual((await state()).draft,['down']);await page.keyboard.press('Backspace');
   await page.screenshot({path:`${output}/${layout.name}-board.png`});
   for(let hop=0;hop<jumps;hop++){
    const before=await state();
    const captureSafe=await page.evaluate(()=>{const game=window.knightwave,s=game.state(),piece=s.options.find(p=>p.piece);if(!piece)return false;const camera=game.scene.activeCamera,V=camera.position.constructor,point=new V(piece.x*4,s.platformTop+.06,piece.z*4),matrix=game.scene.meshes[0].getWorldMatrix().constructor.Identity(),p=V.Project(point,matrix,game.scene.getTransformMatrix(),camera.viewport.toGlobal(innerWidth,innerHeight));return p.y<s.arena.bottom-85;});
    const choice=hop%2===0&&captureSafe?before.options.find(p=>p.piece):before.options[0];
    await press(choice.move.first);await press(choice.move.second);assert.equal(await page.locator('#orb-glyphs .move-icon').count(),1);
    if(hop===0&&layout.phone){await page.locator('#orb-send').tap();assert.equal((await state()).moveQueue.length,0);await page.locator('#orb-send').tap();}else await send();
    await page.waitForFunction(n=>window.knightwave.state().landings===n,hop+1,{timeout:35000});const after=await state();
    assert.equal(after.position.x,choice.x*4);assert.equal(after.position.z,choice.z*4);assert.equal(after.knightYaw,Math.PI/2);assert.equal(after.meshes,initial.meshes);assert.ok(after.board.retainedStops<=5);
    assert.equal(after.score-before.score,100+Math.min(after.combo,10)*10+choice.bonus*10);
    if(hop===1)await page.screenshot({path:`${output}/${layout.name}-capture-choice.png`});
    if(hop===10)await page.screenshot({path:`${output}/${layout.name}-level-up.png`});
   }
   const end=await state();assert.equal(end.mode,'playing');assert.ok(end.progression.level>=2);assert.ok(end.scrollSpeed>initial.scrollSpeed);
   await page.getByRole('button',{name:'Pause game'}).click();const paused=await state();await page.waitForTimeout(200);assert.equal((await state()).camera.z,paused.camera.z);await page.getByRole('button',{name:'Keep riding'}).click();
   assert.deepEqual((await page.evaluate(()=>window.audit.camera)),[]);assert.deepEqual(errors,[]);
   report.push({layout:layout.name,landings:end.landings,captures:end.captures,level:end.progression.level,frames:await page.evaluate(()=>window.audit.frames),cameraIndependent:true});
   // A committed two-combo group executes as two separate landings.
   await page.evaluate(()=>window.knightwave.start());const first=(await state()).options[0],model=new EndlessCourse();model.advance(first);const second=model.options[0];
   for(const move of [first.move,second.move]){await press(move.first);await press(move.second);}await send();await page.waitForFunction(()=>window.knightwave.state().landings===2,null,{timeout:35000});assert.equal((await state()).moveQueue.length,0);
   await page.evaluate(()=>window.knightwave.start());await page.waitForFunction(()=>window.knightwave.state().mode==='over',null,{timeout:35000});assert.equal((await state()).lossReason,'scroll');await page.screenshot({path:`${output}/${layout.name}-scroll-loss.png`});await page.getByRole('button',{name:'Ride again'}).click();assert.equal((await state()).landings,0);
   await context.close();console.log(`${layout.name}: PASS combos, double tap, captures, levels, independent scrolling, pause and retry`);
  }
  await writeFile(`${output}/browser-report.json`,JSON.stringify(report,null,2));return report;
 }finally{await browser.close();}
}
