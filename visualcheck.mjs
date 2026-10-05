import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {swipe} from './gestures.mjs';
import {mkdir,writeFile} from 'node:fs/promises';

const url=process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/';
const output=process.env.KNIGHTWAVE_CAPTURES||'/tmp/knightwave-visual';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report=[];
try {
  for(const layout of [{name:'desktop',width:1280,height:800,phone:false},{name:'phone',width:390,height:844,phone:true},{name:'compact',width:375,height:667,phone:true},{name:'landscape',width:844,height:390,phone:true}].filter(layout=>!process.env.KNIGHTWAVE_LAYOUTS||process.env.KNIGHTWAVE_LAYOUTS.split(',').includes(layout.name))){
    const {name,phone}=layout;const size={width:layout.width,height:layout.height};
    const context=await browser.newContext({viewport:size,deviceScaleFactor:phone?2:1,isMobile:phone,hasTouch:phone,recordVideo:{dir:output,size}});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);await page.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));
    await page.screenshot({path:`${output}/${name}-start.png`});
    await page.getByRole('button',{name:'Let’s ride'}).click();
    await page.evaluate(()=>{
      window.visualAudit={samples:[],clipped:[],camera:window.knightwave.state().camera,orb:window.knightwave.state().orb,glow:window.knightwave.state().glow};
      function sample(){
        const game=window.knightwave,state=game.state();
        if(state.mode==='playing'&&state.phase!=='fall'){
          const camera=game.scene.activeCamera,viewport=camera.viewport.toGlobal(innerWidth,innerHeight);
          const identity=game.scene.meshes[0].getWorldMatrix().constructor.Identity();
          const points=game.scene.getTransformNodeByName('knight').getChildMeshes().filter(mesh=>mesh.isEnabled()).flatMap(mesh=>{
            mesh.computeWorldMatrix(true);
            return mesh.getBoundingInfo().boundingBox.vectorsWorld.map(p=>p.constructor.Project(p,identity,game.scene.getTransformMatrix(),viewport));
          });
          const bounds={left:Math.min(...points.map(p=>p.x))/innerWidth,right:Math.max(...points.map(p=>p.x))/innerWidth,top:Math.min(...points.map(p=>p.y))/innerHeight,bottom:Math.max(...points.map(p=>p.y))/innerHeight};
          const landing=game.scene.getTransformNodeByName('knight').position.clone();landing.set(state.landing.x,state.platformTop+.06,state.landing.z);
          const pad=landing.constructor.Project(landing,identity,game.scene.getTransformMatrix(),viewport);
          const deck=game.scene.getMeshByName('floating board');deck.computeWorldMatrix(true);
          const boardPoints=deck.getBoundingInfo().boundingBox.vectorsWorld.map(p=>p.constructor.Project(p,identity,game.scene.getTransformMatrix(),viewport));
          const boardBounds={left:Math.min(...boardPoints.map(p=>p.x))/innerWidth,right:Math.max(...boardPoints.map(p=>p.x))/innerWidth,top:Math.min(...boardPoints.map(p=>p.y))/innerHeight,bottom:Math.max(...boardPoints.map(p=>p.y))/innerHeight};
          const queue=document.getElementById('move-queue').getBoundingClientRect();
          const overlapsQueue=boardBounds.left*innerWidth<queue.right&&boardBounds.right*innerWidth>queue.left&&boardBounds.top*innerHeight<queue.bottom&&boardBounds.bottom*innerHeight>queue.top;
          const knightOverlapsQueue=bounds.left*innerWidth<queue.right&&bounds.right*innerWidth>queue.left&&bounds.top*innerHeight<queue.bottom&&bounds.bottom*innerHeight>queue.top;
          const orb=document.getElementById('orb-send').getBoundingClientRect(),orbOverlapsQueue=orb.left<queue.right&&orb.right>queue.left&&orb.top<queue.bottom&&orb.bottom>queue.top,orbClipped=orb.left<0||orb.right>innerWidth||orb.top<80||orb.bottom>innerHeight-30;
          const orbOverlapsBoard=orb.left<boardBounds.right*innerWidth&&orb.right>boardBounds.left*innerWidth&&orb.top<boardBounds.bottom*innerHeight&&orb.bottom>boardBounds.top*innerHeight;
          const result={orbOverlapsBoard,orbMoved:state.orb.x!==window.visualAudit.orb.x||state.orb.y!==window.visualAudit.orb.y,glowChanged:state.glow!==window.visualAudit.glow,trick:state.trick,orbOverlapsQueue,orbClipped,knightOverlapsQueue,overlapsQueue,jump:state.jump,phase:state.phase,airtime:state.airtime,bounds,boardBounds,cameraMoved:JSON.stringify(state.camera)!==JSON.stringify(window.visualAudit.camera),roll:camera.rotation.z,landing:{x:pad.x/innerWidth,y:pad.y/innerHeight}};
          window.visualAudit.samples.push(result);
          if(result.orbOverlapsBoard||result.orbMoved||result.glowChanged||result.orbOverlapsQueue||result.orbClipped||result.knightOverlapsQueue||result.overlapsQueue||result.cameraMoved||boardBounds.left<0||boardBounds.right>1||boardBounds.top<.15||boardBounds.bottom>.9||bounds.left<0||bounds.right>1||bounds.top<(innerWidth<700?.15:.10)||bounds.bottom>.9)window.visualAudit.clipped.push(result);
        }
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    const capture=async label=>{
      await page.evaluate(()=>{window.knightwave.pause();document.getElementById('modal').classList.add('hidden');document.getElementById('touch-controls').classList.remove('hidden');});
      await page.screenshot({path:`${output}/${name}-${label}.png`});
      await page.evaluate(()=>window.knightwave.resume());
    };
    await page.waitForTimeout(200);await capture('board');
    await page.waitForFunction(()=>window.knightwave.state().phase==='waiting');await capture('waiting');
    for(let jump=1;jump<=6;jump++){
      await page.waitForFunction(n=>{const s=window.knightwave.state();return s.jump===n&&['settle','waiting'].includes(s.phase);},jump);
      const target=await page.evaluate(()=>window.knightwave.state().target);
      for(let turn=0;turn<Math.abs(target);turn++){
        if(phone)await page.getByRole('button',{name:target>0?'Rotate knight right':'Rotate knight left'}).tap();
        else await page.keyboard.press(target>0?'ArrowRight':'ArrowLeft');
      }
      await capture(`jump-${jump}-charged`);
      if(phone)await swipe(page);else await page.keyboard.press(' ');
      await page.waitForFunction(()=>window.knightwave.state().phase==='air');
      if([1,2,3,4,5,6].includes(jump))for(const [label,time] of [['launch',.18],['middle',.52],['landing',.88]]){
        await page.waitForFunction(t=>window.knightwave.state().phase==='air'&&window.knightwave.state().airtime>=t,time);
        await capture(`jump-${jump}-${label}`);
      }
      await page.waitForFunction(n=>window.knightwave.state().landings===n,jump,{timeout:6000});
      if(jump<6){await page.waitForTimeout(140);await capture(`platform-transition-${jump}`);}
      assert.ok(Math.abs(await page.evaluate(()=>{const s=window.knightwave.state();return Math.atan2(Math.sin(s.knightYaw-Math.PI/2-s.heading),Math.cos(s.knightYaw-Math.PI/2-s.heading));}))<.1);
    }
    assert.equal((await page.evaluate(()=>window.knightwave.state())).mode,'won');
    await page.screenshot({path:`${output}/${name}-win.png`});
    const audit=await page.evaluate(()=>window.visualAudit);
    assert.deepEqual(errors,[]);assert.ok(audit.samples.length>100);
    assert.ok(audit.samples.every(s=>Math.abs(s.roll)<1e-8));
    const late=audit.samples.filter(s=>s.phase==='air'&&s.airtime>.85);
    assert.ok(late.every(s=>s.landing.x>=0&&s.landing.x<=1&&s.landing.y>=0&&s.landing.y<=1),'Landing leaves the screen before touchdown');
    const tricks=audit.samples.filter(s=>s.phase==='air'),maxYaw=Math.max(...tricks.map(s=>Math.abs(s.trick.yaw))),maxRoll=Math.max(...tricks.map(s=>Math.abs(s.trick.roll)));
    assert.ok(maxYaw>Math.PI*4-.01&&maxRoll>Math.PI*2-.01,'Full spins and rolls must appear in the rendered jumps');
    assert.ok(tricks.filter(s=>s.airtime>.85).every(s=>Math.abs(Math.sin(s.trick.yaw))<1e-8&&Math.abs(Math.sin(s.trick.roll))<1e-8),'Tricks settle before landing');
    report.push({viewport:name,frames:audit.samples.length,maxYaw,maxRoll,clipped:audit.clipped,errors});
    await context.close();
    console.log(name,'six jumps complete;',audit.clipped.length,'frames need framing review');
  }
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  assert.ok(report.every(r=>r.clipped.length===0),'Board or knight clips the viewport or camera moves; inspect report.json and captures');
}finally{await browser.close();}
