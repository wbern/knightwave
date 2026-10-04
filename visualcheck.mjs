import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const url=process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/';
const output=process.env.KNIGHTWAVE_CAPTURES||'/tmp/knightwave-visual';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report=[];
try {
  for(const phone of [false,true]){
    const name=phone?'phone':'desktop';
    const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1280,height:800},deviceScaleFactor:phone?2:1,isMobile:phone,hasTouch:phone,recordVideo:{dir:output,size:phone?{width:390,height:844}:{width:1280,height:800}}});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);await page.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));
    await page.screenshot({path:`${output}/${name}-start.png`});
    await page.getByRole('button',{name:'Let’s ride'}).click();
    await page.evaluate(()=>{
      window.visualAudit={samples:[],clipped:[],camera:window.knightwave.state().camera};
      function sample(){
        const game=window.knightwave,state=game.state();
        if(state.mode==='playing'&&state.phase!=='fall'){
          const camera=game.scene.activeCamera,viewport=camera.viewport.toGlobal(innerWidth,innerHeight);
          const identity=game.scene.meshes[0].getWorldMatrix().constructor.Identity();
          const points=game.scene.getTransformNodeByName('knight').getChildMeshes().flatMap(mesh=>{
            mesh.computeWorldMatrix(true);
            return mesh.getBoundingInfo().boundingBox.vectorsWorld.map(p=>p.constructor.Project(p,identity,game.scene.getTransformMatrix(),viewport));
          });
          const bounds={left:Math.min(...points.map(p=>p.x))/innerWidth,right:Math.max(...points.map(p=>p.x))/innerWidth,top:Math.min(...points.map(p=>p.y))/innerHeight,bottom:Math.max(...points.map(p=>p.y))/innerHeight};
          const landing=game.scene.getTransformNodeByName('knight').position.clone();landing.set(state.landing.x,.05,state.landing.z);
          const pad=landing.constructor.Project(landing,identity,game.scene.getTransformMatrix(),viewport);
          const deck=game.scene.getMeshByName('floating board');deck.computeWorldMatrix(true);
          const boardPoints=deck.getBoundingInfo().boundingBox.vectorsWorld.map(p=>p.constructor.Project(p,identity,game.scene.getTransformMatrix(),viewport));
          const boardBounds={left:Math.min(...boardPoints.map(p=>p.x))/innerWidth,right:Math.max(...boardPoints.map(p=>p.x))/innerWidth,top:Math.min(...boardPoints.map(p=>p.y))/innerHeight,bottom:Math.max(...boardPoints.map(p=>p.y))/innerHeight};
          const result={jump:state.jump,phase:state.phase,airtime:state.airtime,bounds,boardBounds,cameraMoved:JSON.stringify(state.camera)!==JSON.stringify(window.visualAudit.camera),roll:camera.rotation.z,landing:{x:pad.x/innerWidth,y:pad.y/innerHeight}};
          window.visualAudit.samples.push(result);
          if(result.cameraMoved||boardBounds.left<0||boardBounds.right>1||boardBounds.top<.15||boardBounds.bottom>.9||bounds.left<0||bounds.right>1||bounds.top<(innerWidth<700?.15:.10)||bounds.bottom>.9)window.visualAudit.clipped.push(result);
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
    for(let jump=1;jump<=6;jump++){
      await page.waitForFunction(n=>window.knightwave.state().jump===n&&window.knightwave.state().phase==='air',jump);
      const target=await page.evaluate(()=>window.knightwave.state().target);
      for(let turn=0;turn<Math.abs(target);turn++){
        if(phone)await page.getByRole('button',{name:target>0?'Rotate knight right':'Rotate knight left'}).tap();
        else await page.keyboard.press(target>0?'ArrowRight':'ArrowLeft');
      }
      if([1,3,5,6].includes(jump))for(const [label,time] of [['launch',.18],['middle',.52],['landing',.88]]){
        await page.waitForFunction(t=>window.knightwave.state().phase==='air'&&window.knightwave.state().airtime>=t,time);
        await capture(`jump-${jump}-${label}`);
      }
      await page.waitForFunction(n=>window.knightwave.state().landings===n,jump,{timeout:6000});
      assert.ok(Math.abs(await page.evaluate(()=>{const s=window.knightwave.state();return Math.atan2(Math.sin(s.knightYaw-Math.PI/2-s.heading),Math.cos(s.knightYaw-Math.PI/2-s.heading));}))<.1);
    }
    assert.equal((await page.evaluate(()=>window.knightwave.state())).mode,'won');
    await page.screenshot({path:`${output}/${name}-win.png`});
    const audit=await page.evaluate(()=>window.visualAudit);
    assert.deepEqual(errors,[]);assert.ok(audit.samples.length>100);
    assert.ok(audit.samples.every(s=>Math.abs(s.roll)<1e-8));
    const late=audit.samples.filter(s=>s.phase==='air'&&s.airtime>.85);
    assert.ok(late.every(s=>s.landing.x>=0&&s.landing.x<=1&&s.landing.y>=0&&s.landing.y<=1),'Landing leaves the screen before touchdown');
    report.push({viewport:name,frames:audit.samples.length,clipped:audit.clipped,errors});
    await context.close();
    console.log(name,'six jumps complete;',audit.clipped.length,'frames need framing review');
  }
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  assert.ok(report.every(r=>r.clipped.length===0),'Board or knight clips the viewport or camera moves; inspect report.json and captures');
}finally{await browser.close();}
