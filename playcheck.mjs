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
   await page.screenshot({path:`${output}/${layout.name}-intro.png`});if(layout.phone)await page.locator('#world').tap();else await page.locator('#world').click();
   await page.waitForFunction(()=>window.knightwave.state().boardLights.platforms>=9);
   const state=()=>page.evaluate(()=>window.knightwave.state()),press=direction=>layout.phone?page.getByRole('button',{name:`Compose ${direction}`,exact:true}).tap():page.keyboard.press({up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[direction]);
   const send=async()=>{if(layout.phone)await page.locator('#orb-send').tap();else await page.keyboard.press(' ');};
   const compose=async(move,variant=0)=>{const a=move.first,b=move.second;for(const direction of [[a,a,b],[b,a,a],[a,b,a]][variant%3])await press(direction);};
   await page.evaluate(()=>{
    const initial=window.knightwave.state();window.audit={initial,previous:initial,camera:[],visual:[],platforms:[],frames:0};
    window.knightwave.scene.onAfterRenderObservable.add(()=>{
     const current=window.knightwave.state(),previous=window.audit.previous;window.audit.frames++;
     if(previous.mode==='playing'&&current.mode==='playing'){
      const expected=current.scrollSpeed*(Math.max(0,current.runTime-current.scrollGraceUntil)-Math.max(0,previous.runTime-current.scrollGraceUntil));
      if(current.camera.z-previous.camera.z-expected< -1e-5)window.audit.camera.push({current,previous,expected});
     }
     if(current.mode==='playing'&&current.phase!=='fall'){
      const game=window.knightwave,camera=game.scene.activeCamera,V=camera.position.constructor,identity=game.scene.meshes[0].getWorldMatrix().constructor.Identity(),viewport=camera.viewport.toGlobal(innerWidth,innerHeight);
      const points=game.scene.getTransformNodeByName('knight').getChildMeshes().flatMap(mesh=>{mesh.computeWorldMatrix(true);return mesh.getBoundingInfo().boundingBox.vectorsWorld.map(p=>V.Project(p,identity,game.scene.getTransformMatrix(),viewport));});
      const bounds={left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))},arena=current.arena,orb=document.getElementById('orb-send').getBoundingClientRect();
      const failures=[];
      if(bounds.left<arena.left+4||bounds.right>arena.right-4||bounds.top<arena.top+12||bounds.bottom>arena.bottom-16)failures.push('knight clipped');
      if(orb.left<0||orb.right>innerWidth||orb.top<0||orb.bottom>innerHeight||(!current.board.fullScreen&&orb.left<arena.right&&orb.right>arena.left&&orb.top<arena.bottom&&orb.bottom>arena.top))failures.push('orb outside control area');
      if(current.knightYaw!==Math.PI/2||current.glow!==initial.glow||current.meshes!==initial.meshes||current.board.retainedStops>5)failures.push('scene invariant changed');
      if(failures.length&&window.audit.visual.length<30)window.audit.visual.push({failures,bounds,arena,phase:current.phase,airtime:current.airtime});
     }
     if(current.landings>=previous.landings){
      for(const tile of current.platforms){
       const old=previous.platforms.find(p=>p.x===tile.x&&p.z===tile.z);
       if(old&&old.stage!=='falling'&&tile.stage!=='falling'&&(tile.slot!==old.slot||tile.age<old.age-1e-8||tile.height<old.height-.001))window.audit.platforms.push({old,tile});
      }
     }
     window.audit.previous=current;
    });
   });
   const initial=await state();assert.equal(initial.boardLights.links,0);
   if(layout.phone)assert.equal(await page.locator('#world').evaluate(e=>getComputedStyle(e).maskImage),'none');assert.equal(initial.board.cols,8);assert.equal(initial.board.previewDepth,4);
   assert.equal(initial.platforms.filter(p=>p.route&&p.index>0).length,4);assert.equal(await page.locator('#controls-dock #board-labels').count(),0);
   await press('up');assert.deepEqual((await state()).draft,['up']);if(!layout.phone)await page.keyboard.press(' ');assert.equal((await state()).locked,false);await press('down');assert.deepEqual((await state()).draft,['down']);await page.keyboard.press('Backspace');
   await press('up');await press('left');await send();assert.equal((await state()).moveQueue.length,0);assert.equal(await page.locator('#orb-send').getAttribute('data-charge'),'0');await page.getByRole('button',{name:'Undo last input'}).click();assert.deepEqual((await state()).draft,['up']);await page.getByRole('button',{name:'Undo last input'}).click();assert.deepEqual((await state()).draft,[]);
   await page.screenshot({path:`${output}/${layout.name}-board.png`});
   for(let hop=0;hop<jumps;hop++){
    await page.waitForFunction(()=>window.knightwave.state().mode==='playing');
    const before=await state();
    const captureSafe=await page.evaluate(()=>{const game=window.knightwave,s=game.state(),piece=s.options.find(p=>p.piece);if(!piece)return false;const camera=game.scene.activeCamera,V=camera.position.constructor,point=new V(piece.x*4,s.platformTop+.06,piece.z*4),matrix=game.scene.meshes[0].getWorldMatrix().constructor.Identity(),p=V.Project(point,matrix,game.scene.getTransformMatrix(),camera.viewport.toGlobal(innerWidth,innerHeight));return p.y<s.arena.bottom-85;});
    const choice=hop%2===0&&captureSafe?before.options.find(p=>p.piece):before.options[0];
    await compose(choice.move,hop%3);assert.equal(await page.locator('#orb-glyphs .move-icon').count(),1);
    await send();
    if(hop===0){await page.waitForFunction(()=>{const s=window.knightwave.state();return s.phase==='air'&&s.airtime>.35;},null,{timeout:35000});await page.screenshot({path:`${output}/${layout.name}-midair.png`});}
    await page.waitForFunction(n=>window.knightwave.state().landings===n,hop+1,{timeout:35000});const after=await state();
    assert.equal(after.position.x,choice.x*4);assert.equal(after.position.z,choice.z*4);assert.equal(after.knightYaw,Math.PI/2);assert.equal(after.meshes,initial.meshes);assert.ok(after.board.retainedStops<=5);
    assert.equal(after.score-before.score,100+Math.min(after.combo,10)*10+choice.bonus*10);
    if(hop===1)await page.screenshot({path:`${output}/${layout.name}-capture-choice.png`});
    if(hop===9)await page.screenshot({path:`${output}/${layout.name}-finish-approach.png`});
    if(hop===10){assert.equal(after.mode,'level-clear');await page.screenshot({path:`${output}/${layout.name}-level-clear.png`});assert.equal(after.audio.cue,'clear');}
   }
   const end=await state();assert.equal(end.mode,'playing');assert.ok(end.progression.level>=2);assert.equal(end.progression.difficulty,'Easy');assert.equal(end.scrollSpeed,initial.scrollSpeed);
   await page.getByRole('button',{name:'Pause game'}).click();const paused=await state();await page.waitForTimeout(200);assert.equal((await state()).camera.z,paused.camera.z);await page.getByRole('button',{name:'RESUME'}).click();
   const audit=await page.evaluate(()=>({camera:window.audit.camera,visual:window.audit.visual,platforms:window.audit.platforms}));await writeFile(`${output}/${layout.name}-audit.json`,JSON.stringify(audit,null,2));assert.deepEqual(audit.camera,[]);assert.deepEqual(audit.visual,[]);assert.deepEqual(audit.platforms,[]);assert.deepEqual(errors,[]);
   report.push({layout:layout.name,landings:end.landings,captures:end.captures,level:end.progression.level,frames:await page.evaluate(()=>window.audit.frames),cameraIndependent:true});
   // A committed two-combo group executes as two separate landings.
   await page.evaluate(()=>window.knightwave.start());const first=(await state()).options[0],model=new EndlessCourse();model.advance(first);const second=model.options[0];
   for(const move of [first.move,second.move])await compose(move);await send();await page.waitForFunction(()=>window.knightwave.state().landings===2,null,{timeout:35000});assert.equal((await state()).moveQueue.length,0);
   await page.evaluate(()=>window.knightwave.start());await page.waitForFunction(()=>window.knightwave.state().mode==='over',null,{timeout:35000});assert.equal((await state()).lossReason,'scroll');await page.screenshot({path:`${output}/${layout.name}-scroll-loss.png`});await page.getByRole('button',{name:'PLAY AGAIN'}).click();assert.equal((await state()).landings,0);
   await context.close();console.log(`${layout.name}: PASS three-press combos, single tap, captures, levels, independent scrolling, pause and retry`);
  }
  await writeFile(`${output}/browser-report.json`,JSON.stringify(report,null,2));return report;
 }finally{await browser.close();}
}
