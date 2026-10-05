import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {swipe} from './gestures.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5179/',output=process.env.KNIGHTWAVE_CAPTURES||'/tmp/knightwave-visual',jumps=Number(process.env.KNIGHTWAVE_JUMPS||10);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),report=[];
try{
 for(const layout of [{name:'desktop',width:1280,height:800,phone:false},{name:'phone',width:390,height:844,phone:true},{name:'compact',width:375,height:667,phone:true},{name:'landscape',width:844,height:390,phone:true}].filter(l=>!process.env.KNIGHTWAVE_LAYOUTS||process.env.KNIGHTWAVE_LAYOUTS.split(',').includes(l.name))){
  const {name,phone}=layout,size={width:layout.width,height:layout.height},context=await browser.newContext({viewport:size,deviceScaleFactor:phone?2:1,isMobile:phone,hasTouch:phone,recordVideo:{dir:output,size}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));await page.screenshot({path:`${output}/${name}-start.png`});await page.getByRole('button',{name:'Let’s ride'}).click();
  await page.evaluate(()=>{
   window.visualAudit={samples:[],clipped:[],initial:window.knightwave.state()};
   function sample(){
    const game=window.knightwave,s=game.state();
    if(s.mode==='playing'&&s.phase!=='fall'){
     const camera=game.scene.activeCamera,viewport=camera.viewport.toGlobal(innerWidth,innerHeight),identity=game.scene.meshes[0].getWorldMatrix().constructor.Identity();
     const points=game.scene.getTransformNodeByName('knight').getChildMeshes().flatMap(mesh=>{mesh.computeWorldMatrix(true);return mesh.getBoundingInfo().boundingBox.vectorsWorld.map(p=>p.constructor.Project(p,identity,game.scene.getTransformMatrix(),viewport));});
     const bounds={left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
     const point=game.scene.getTransformNodeByName('knight').position.clone();point.set(s.landing.x,s.platformTop+.06,s.landing.z);const landing=point.constructor.Project(point,identity,game.scene.getTransformMatrix(),viewport),orb=document.getElementById('orb-send').getBoundingClientRect(),initial=window.visualAudit.initial;
     const result={jump:s.jump,phase:s.phase,airtime:s.airtime,bounds,landing:{x:landing.x,y:landing.y},arena:s.arena,trick:s.trick,cameraZ:s.camera.z,meshCount:s.meshes,retained:s.board.retainedStops,
      rotationChanged:Math.abs(s.camera.rotation.x-initial.camera.rotation.x)>1e-8||s.camera.rotation.y!==0||s.camera.rotation.z!==0,
      orbMoved:s.orb.x!==initial.orb.x||s.orb.y!==initial.orb.y,glowChanged:s.glow!==initial.glow,north:s.knightYaw===Math.PI/2,
      knightClipped:bounds.left<s.arena.left+4||bounds.right>s.arena.right-4||bounds.top<s.arena.top+8||bounds.bottom>s.arena.bottom-16,
      targetClipped:landing.x<s.arena.left+8||landing.x>s.arena.right-8||landing.y<s.arena.top+16||landing.y>s.arena.bottom-24,
      orbClipped:orb.left<0||orb.right>innerWidth||(orb.left<s.arena.right&&orb.right>s.arena.left&&orb.top<s.arena.bottom&&orb.bottom>s.arena.top)||orb.bottom>innerHeight-30};
     window.visualAudit.samples.push(result);
     if(result.rotationChanged||result.orbMoved||result.glowChanged||!result.north||result.knightClipped||result.targetClipped||result.orbClipped||result.meshCount!==initial.meshes||result.retained>11)window.visualAudit.clipped.push(result);
    }
    requestAnimationFrame(sample);
   }requestAnimationFrame(sample);
  });
  const capture=async label=>{await page.evaluate(()=>{window.knightwave.pause();document.getElementById('modal').classList.add('hidden');document.getElementById('touch-controls').classList.remove('hidden');document.getElementById('gesture-caption').classList.remove('hidden');});await page.screenshot({path:`${output}/${name}-${label}.png`});await page.evaluate(()=>window.knightwave.resume());};
  await page.waitForTimeout(300);await capture('board');await capture('waiting');
  for(let jump=1;jump<=jumps;jump++){
   await page.waitForFunction(n=>{const s=window.knightwave.state();return s.jump===n&&['waiting','settle'].includes(s.phase);},jump);
   const target=await page.evaluate(()=>window.knightwave.state().target);
   for(let i=0;i<Math.abs(target);i++){if(phone)await page.getByRole('button',{name:target>0?'Add right L move':'Add left L move'}).tap();else await page.keyboard.press(target>0?'ArrowRight':'ArrowLeft');}
   await capture(`jump-${jump}-charged`);if(phone)await swipe(page);else await page.keyboard.press(' ');
   for(const [label,time] of [['launch',.18],['middle',.52],['landing',.88]]){await page.waitForFunction(t=>window.knightwave.state().phase==='air'&&window.knightwave.state().airtime>=t,time);await capture(`jump-${jump}-${label}`);}
   await page.waitForFunction(n=>window.knightwave.state().landings===n,jump,{timeout:7000});assert.equal(await page.evaluate(()=>window.knightwave.state().knightYaw),Math.PI/2);
   if(jump<jumps){await page.waitForTimeout(120);await capture(`platform-transition-${jump}`);}
  }
  assert.equal(await page.evaluate(()=>window.knightwave.state().mode),'playing');await capture('endless');
  const audit=await page.evaluate(()=>window.visualAudit),last=await page.evaluate(()=>window.knightwave.state());assert.deepEqual(errors,[]);assert.ok(audit.samples.length>100);assert.ok(last.camera.z>audit.initial.camera.z+32);assert.ok(last.position.z>32);
  const airborne=audit.samples.filter(s=>s.phase==='air'),maxYaw=Math.max(...airborne.map(s=>Math.abs(s.trick.yaw))),maxRoll=Math.max(...airborne.map(s=>Math.abs(s.trick.roll)));
  assert.ok(maxYaw>Math.PI*4-.01&&maxRoll>Math.PI*2-.01);assert.ok(airborne.filter(s=>s.airtime>.85).every(s=>Math.abs(Math.sin(s.trick.yaw))<1e-8&&Math.abs(Math.sin(s.trick.roll))<1e-8));
  report.push({viewport:name,jumps,frames:audit.samples.length,cameraAdvance:last.camera.z-audit.initial.camera.z,maxYaw,maxRoll,clipped:audit.clipped,errors});console.log(name,`${jumps} jumps complete;`,audit.clipped.length,'frames need review');await context.close();
 }
 await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));assert.ok(report.every(r=>r.clipped.length===0),'Inspect framing report and captures');
}finally{await browser.close();}
