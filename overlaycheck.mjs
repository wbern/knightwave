import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 for(const [name,width,height,mobile] of [['desktop',1280,800,false],['phone',390,844,true],['compact',375,667,true],['landscape',844,390,true],['narrow',320,568,true]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.KNIGHTWAVE_URL||'http://127.0.0.1:5180/');await page.waitForFunction(()=>window.knightwave&&document.getElementById('loading').classList.contains('hidden'));await page.locator('#world').tap();
  const state=()=>page.evaluate(()=>window.knightwave.state());
  const before=await state();assert.equal(before.boardLights.links,0);assert.equal(before.boardLights.pooledMeshes,40);
  const layout=await page.evaluate(()=>{
   const buttons=[...document.querySelectorAll('#controls-dock button')].map(button=>{const r=button.getBoundingClientRect();return {id:button.id,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,hits:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===button};});
   const scene=window.knightwave.scene,camera=scene.activeCamera,V=camera.position.constructor,M=scene.meshes[0].getWorldMatrix().constructor;
   const points=scene.meshes.filter(m=>m.name.includes('chess grid')&&m.isEnabled()).flatMap(floor=>{floor.computeWorldMatrix(true);return floor.getBoundingInfo().boundingBox.vectorsWorld.map(p=>V.Project(p,M.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(innerWidth,innerHeight)));});
   return {buttons,mask:getComputedStyle(document.getElementById('world')).maskImage,guides:scene.meshes.filter(m=>m.name.includes('future route light')).length,floor:{left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))}};
  });
  assert.equal(layout.guides,0);assert.equal(layout.mask,'none');
  for(const b of layout.buttons){assert.ok(b.x>=0&&b.y>=0&&b.right<=width&&b.bottom<=height,`${name}: ${b.id} stays on screen`);assert.ok(b.width>=44&&b.height>=44);assert.ok(b.hits,`${name}: ${b.id} receives overlay taps`);}
  const undo=layout.buttons.find(b=>b.id==='undo'),orb=layout.buttons.find(b=>b.id==='orb-send');assert.ok(undo.x>orb.right);assert.ok(undo.right>=width-30);
  if(mobile){assert.equal(layout.mask,'none');assert.ok(layout.floor.left<=0&&layout.floor.right>=width&&layout.floor.top<=0&&layout.floor.bottom>=height,`${name}: floor covers viewport ${JSON.stringify(layout.floor)}`);}
  const tiles=s=>s.platforms.map(p=>({id:p.id,slot:p.slot,x:p.x,z:p.z,height:p.height}));
  for(const direction of ['up','right','down','left']){
   await page.getByRole('button',{name:`Compose ${direction}`,exact:true}).tap();
   assert.equal(await page.locator('#direction-feedback').getAttribute('data-direction'),direction);assert.equal(await page.locator('#direction-feedback').evaluate(e=>e.classList.contains('active')),true);
   assert.deepEqual(tiles(await state()),tiles(before),`${name}: input does not respawn platforms`);
   await page.getByRole('button',{name:'Undo last input'}).tap();assert.deepEqual((await state()).draft,[]);
  }
  await page.screenshot({path:`/tmp/knightwave-overlay-verified-${name}.png`});assert.deepEqual(errors,[]);console.log(`${name}: PASS fullscreen floor, no guides, large hit targets, overlay taps, right-side undo, directional glow, stable platforms`);await page.close();
 }
}finally{await browser.close();}
