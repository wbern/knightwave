import './style.css';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Layer } from '@babylonjs/core/Layers/layer';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import earcut from 'earcut';
import { knightDestination, isLandingMatch, targetForJump, knightPath, flightPoint } from './rules.js';
import { Soundtrack } from './audio.js';

const asset=name=>`${import.meta.env.BASE_URL}${name}`;
const app=document.querySelector('#app');
app.innerHTML=`<canvas id="world" aria-label="Knightwave neon chess runner"></canvas>
<div id="ui" class="start-mode">
  <header class="topbar"><div class="brand"><img class="brand-icon" src="${asset('knight-mark.svg')}" alt="" width="35" height="35"><div class="brand-name">knightwave<small>AN ARCADE DAYDREAM</small></div></div><div class="stats"><div class="stat"><small>SCORE</small><strong id="score">00000</strong></div><div class="stat"><small>BEST</small><strong id="best">00000</strong></div></div><div class="utility"><button class="icon-button" id="sound" aria-label="Mute soundtrack" title="Sound on/off (M)">♫</button><button class="icon-button hidden" id="pause" aria-label="Pause game" title="Pause (Esc)">Ⅱ</button><button class="icon-button" id="help" aria-label="How to play" title="How to play">?</button></div></header>
  <section class="center-card" id="start-screen"><div class="eyebrow">CHESS MOVES. COSMIC GROOVES.</div><h1>Ride the<span>knightwave.</span></h1><p class="intro">A little chess. A lot of airtime.<br>Spin through the stars and find your<br>way to the next rainbow.</p><button class="primary" id="start">Let’s ride <span>↗</span></button><div class="start-caption">SOUND ON. SHOULDERS DOWN. CHASE THE GLOW.</div></section>
  <div class="run-label hidden" id="run-label">RAINBOW CIRCUIT <span> / </span> <span id="jump-label">JUMP 01</span></div>
  <div class="toast hidden" id="toast"></div><div class="flash" id="flash"></div>
  <div class="touch-controls" id="touch-controls"><button class="turn-button" id="left" aria-label="Rotate knight left">↶</button><button class="turn-button" id="right" aria-label="Rotate knight right">↷</button></div>
  <footer class="bottom-bar"><div class="controls-legend"><div class="legend"><span class="keycap">←</span><span class="keycap">→</span> tap to spin</div><div class="legend"><span class="keycap">␣</span> ride / pause</div></div><div class="track-name"><span class="pulse-bars"><i></i><i></i><i></i><i></i></span> Stardust Overdrive<small>ORIGINAL SOUNDTRACK · 160 BPM</small></div></footer>
  <div class="modal-shade hidden" id="modal"></div>
</div><div class="loading" id="loading">Tuning the rainbow…</div>`;
const el=id=>document.getElementById(id),audio=new Soundtrack();
const canvas=el('world');
let engine, scene;
try{engine=new Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,powerPreference:'high-performance'});scene=new Scene(engine);}catch(e){el('loading').innerHTML='<div>WebGL is needed to ride the rainbow.<br><small>Try a browser with hardware acceleration enabled.</small></div>';throw e;}
engine.setHardwareScalingLevel(1/Math.min(window.devicePixelRatio||1,2));
scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.exposure=.85;
scene.clearColor=new Color4(.028,.014,.07,1);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogColor=new Color3(.08,.025,.16);scene.fogDensity=.004;
const camera=new FreeCamera('chase',new Vector3(0,7,-15),scene);camera.minZ=.1;camera.maxZ=1200;camera.fov=1.03;
const hemi=new HemisphericLight('soft light',new Vector3(-.4,1,-.4),scene);hemi.intensity=.65;hemi.diffuse=new Color3(.76,.83,1);hemi.groundColor=new Color3(.25,.08,.43);
const rim=new PointLight('mint rim',new Vector3(0,8,-4),scene);rim.diffuse=new Color3(.3,1,.83);rim.intensity=.45;rim.range=38;
const glow=new GlowLayer('neon',scene,{mainTextureRatio:.4,blurKernelSize:32});glow.intensity=.65;
function material(name,hex,emission=0){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.emissiveColor=m.diffuseColor.scale(emission);m.specularColor=new Color3(.06,.06,.09);return m;}
const palette=['#ff72c1','#bf7bff','#8c83ff','#70bdff','#75efee','#a8f9c2','#f8e99c'];
const roadMats=palette.map((c,i)=>material('rainbow '+i,c,.25));
const dark=material('underside','#211333',.15),stripe=material('chess tile','#e6cbff',.4),mint=material('mint neon','#8dffe1',1.6),pink=material('pink neon','#fd8bdf',1.5),gold=material('landing gold','#ffe6a3',1.5),white=material('porcelain','#e9fff5',.22),purple=material('mane','#583680',.3);

// Dedicated sky artwork stays behind the 3D course and planets.
const nebula=new Layer('cosmic artwork',asset('cosmic-sky.png'),scene,true);nebula.color=new Color4(.50,.44,.65,1);
let seed=512;
function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const planet=MeshBuilder.CreateSphere('lavender planet',{diameter:60,segments:32},scene);planet.material=material('planet','#604292',.4);planet.position.set(-92,52,300);
const planetRing=MeshBuilder.CreateTorus('saturn ring',{diameter:92,thickness:.65,tessellation:100},scene);planetRing.material=material('planet ring','#b996ee',1.3);planetRing.position.copyFrom(planet.position);planetRing.rotation.set(.28,0,-.3);
const moon=MeshBuilder.CreateSphere('mint moon',{diameter:19,segments:24},scene);moon.position.set(110,57,350);moon.material=material('moon','#aff7df',1);
const halo=MeshBuilder.CreateTorus('moon halo',{diameter:28,thickness:.28,tessellation:80},scene);halo.material=mint;halo.position.copyFrom(moon.position);halo.rotation.x=Math.PI/2;
const scenery=new TransformNode('cosmos',scene);planet.parent=planetRing.parent=moon.parent=halo.parent=scenery;
function box(name,w,h,d,x,y,z,mat,parent){const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.material=mat;if(parent)m.parent=parent;return m;}

// A shallow, extruded silhouette: deliberately a chess cutout in a 3D world.
const knight=new TransformNode('knight',scene),spinner=new TransformNode('spin',scene);spinner.parent=knight;
const outline=[[-.65,.16],[.65,.16],[.65,.38],[.43,.55],[.50,.90],[.54,1.35],[.43,1.75],[.22,2.12],[.05,2.50],[-.02,2.95],[-.30,2.75],[-.64,2.88],[-.59,2.52],[-.88,2.22],[-1.12,1.85],[-.93,1.60],[-.51,1.64],[-.20,1.95],[-.12,1.54],[-.31,1.11],[-.52,.77],[-.39,.52],[-.65,.38]];
function extrude(name,points,depth,mat,parent){const flat=points.flat(),tris=earcut(flat),positions=[],indices=[],n=points.length;for(const z of [-depth/2,depth/2])for(const p of points)positions.push(p[0],p[1],z);for(let i=0;i<tris.length;i+=3){indices.push(tris[i+2],tris[i+1],tris[i],tris[i]+n,tris[i+1]+n,tris[i+2]+n);}for(let i=0;i<n;i++){let j=(i+1)%n;indices.push(i,j,i+n,j,j+n,i+n);}const normals=[];VertexData.ComputeNormals(positions,indices,normals);const v=new VertexData();v.positions=positions;v.indices=indices;v.normals=normals;const m=new Mesh(name,scene);v.applyToMesh(m);m.material=mat;m.parent=parent;return m;}
const FORWARD_YAW=Math.PI/2;
const body=extrude('chess knight silhouette',outline,.64,white,spinner);body.position.y=.58;
const mane=extrude('inlaid purple mane',[[.05,2.48],[.22,2.1],[.44,1.73],[.53,1.35],[.49,.94],[.35,.75],[.33,1.27],[.25,1.69],[-.03,2.17]],.665,purple,spinner);mane.position.y=.58;
for(const z of [-.345,.345]){const eye=MeshBuilder.CreateSphere('onyx eye',{diameter:.105,segments:8},scene);eye.scaling.z=.35;eye.position.set(-.51,2.70,z);eye.material=purple;eye.parent=spinner;}
// Turned, stepped pedestal and collars make the silhouette unmistakably chess.
const profile=[[0,0],[1.02,0],[1.06,.10],[1.02,.18],[.86,.21],[.86,.30],[.68,.37],[.61,.48],[.62,.55],[.77,.57],[.77,.66],[.57,.71],[0,.71]].map(([r,y])=>new Vector3(r,y,0));
const base=MeshBuilder.CreateLathe('turned chess pedestal',{shape:profile,tessellation:64,cap:Mesh.CAP_ALL},scene);base.parent=spinner;base.material=white;
for(const [diameter,y] of [[2.05,.12],[1.55,.61]]){const ring=MeshBuilder.CreateTorus('pedestal inlay',{diameter,thickness:.055,tessellation:64},scene);ring.parent=spinner;ring.position.y=y;ring.material=purple;}
const baseRing=MeshBuilder.CreateTorus('plinth glow',{diameter:2.02,thickness:.045,tessellation:64},scene);baseRing.parent=spinner;baseRing.position.y=.035;baseRing.material=mint;
spinner.rotation.y=FORWARD_YAW;
const shadow=MeshBuilder.CreateDisc('hover shadow',{radius:1.1,tessellation:30},scene);shadow.rotation.x=Math.PI/2;shadow.material=material('shadow','#170d37',.1);shadow.material.alpha=.38;shadow.position.y=.035;
const jumpSparkles=new ParticleSystem('jump star glints',500,scene);
jumpSparkles.particleTexture=new Texture(asset('sparkle.svg'),scene);
jumpSparkles.emitter=knight.position;
jumpSparkles.minEmitBox=new Vector3(-.8,.25,-.8);jumpSparkles.maxEmitBox=new Vector3(.8,1.3,.8);
jumpSparkles.direction1=new Vector3(-1.5,.5,-3);jumpSparkles.direction2=new Vector3(1.5,2,-1);
jumpSparkles.color1=new Color4(.5,1,.85,1);jumpSparkles.color2=new Color4(1,.45,.85,1);jumpSparkles.colorDead=new Color4(.1,.25,.35,0);
jumpSparkles.minSize=.16;jumpSparkles.maxSize=.55;jumpSparkles.minLifeTime=.22;jumpSparkles.maxLifeTime=.65;
jumpSparkles.minEmitPower=2;jumpSparkles.maxEmitPower=5;jumpSparkles.gravity=new Vector3(0,-3,0);
jumpSparkles.blendMode=ParticleSystem.BLENDMODE_ADD;jumpSparkles.emitRate=0;jumpSparkles.updateSpeed=.012;jumpSparkles.start();
const burstPieces=[];for(let i=0;i<20;i++){const m=MeshBuilder.CreateSphere('landing sparkle',{diameter:.16,segments:5},scene);m.material=i%2?mint:gold;m.setEnabled(false);burstPieces.push({mesh:m,velocity:new Vector3(),life:0});}
let roads=[],mode='start',phase='cruise',current=0,selected=0,jumpTime=0,phaseTime=0,runTime=0,score=0,combo=0,landings=0,spinAngle=0,visualSpin=0,spinJuice=0,flash=0,toastTimer=0,cruiseStart=0,tapKick=0,gapRoot=null,pathRoot=null,lastGuideKey='';
let best=0;try{best=Number(localStorage.getItem('knightwave-best')||0);}catch{}
el('best').textContent=String(best).padStart(5,'0');
const FLIGHT=1.28,SPEED=34,SCALE=8,ROAD_LENGTH=48;
function buildRoad(index,x,z,target){const root=new TransformNode('rainbow road '+index,scene),length=ROAD_LENGTH;root.position.set(x,-.12,z+length/2);const start=z,end=z+length;
  box('violet deck',6.4,.32,length+3,0,-.18,-1.5,dark,root);
  roadMats.forEach((m,i)=>box('rainbow ribbon',.86,.10,length+3,(i-3)*.86,0,-1.5,m,root));
  box('left glow rail',.07,.06,length+3,-3.08,.1,-1.5,pink,root);box('right glow rail',.07,.06,length+3,3.08,.1,-1.5,mint,root);
  for(let row=0;row<Math.floor(length/SCALE);row++){let rz=-length/2+row*SCALE;for(let col=0;col<7;col++){if((row+col)%2===0){const m=box('chess shimmer',.84,.015,SCALE,(col-3)*.86,.059,rz, stripe,root);m.material=tileMaterial;}}}
  for(let rz=-length/2+3;rz<length/2;rz+=4){box('edge stud',.17,.14,.5,-3.15,.15,rz,gold,root);box('edge stud',.17,.14,.5,3.15,.15,rz,gold,root);}
  box('takeoff line',6.05,.07,.22,0,.09,length/2-.8,gold,root);
  const gate=new TransformNode('rainbow arch',scene);gate.parent=root;gate.position.z=length/2-6;
  const points=[];for(let j=0;j<=36;j++){const a=j/36*Math.PI;points.push(new Vector3(Math.cos(a)*3.55,Math.sin(a)*4.25+.15,0));}
  const arch=MeshBuilder.CreateTube('arched neon',{path:points,radius:.055,tessellation:10},scene);arch.material=index%2?pink:mint;arch.parent=gate;
  const ring=MeshBuilder.CreateTorus('landing circle',{diameter:2.9,thickness:.08,tessellation:48},scene);ring.position.set(0,.13,-length/2);ring.material=gold;ring.parent=root;
  const arrow=extrude('landing chevron',[[-.5,0],[0,.7],[.5,0],[.2,0],[0,.3],[-.2,0]],.03,mint,root);arrow.rotation.x=Math.PI/2;arrow.position.set(0,.10,-length/2+4);
  const savedPosition=root.position.clone();root.position.setAll(0);root.computeWorldMatrix(true);
  for(let rz=-length/2;rz<=length/2;rz+=SCALE)box('square divider',6.0,.02,.04,0,.08,rz,purple,root);
  const decorations=root.getChildMeshes().filter(m=>['chess shimmer','edge stud','square divider'].includes(m.name));
  for(const mat of [tileMaterial,gold,purple]){const group=decorations.filter(m=>m.material===mat);if(group.length>1){const merged=Mesh.MergeMeshes(group,true,true,undefined,false,false);merged.parent=root;merged.position.set(0,0,0);}}
  root.position.copyFrom(savedPosition);root.computeWorldMatrix(true);
  return {root,x,start,end,target,index,ring};
}
const tileMaterial=material('translucent chess squares','#efdbff',.12);tileMaterial.alpha=.21;
function resetRoads(){roads.forEach(r=>r.root.dispose(false,false));roads=[];roads.push(buildRoad(0,0,-20,0));let x=0;for(let i=0;i<7;i++){let target=targetForJump(i),d=knightDestination(target);x+=d.x*SCALE;roads.push(buildRoad(i+1,x,roads.at(-1).end+d.z*SCALE,target));}}
function extend(){const last=roads.at(-1),target=targetForJump(last.index),d=knightDestination(target);roads.push(buildRoad(last.index+1,last.x+d.x*SCALE,last.end+d.z*SCALE,target));if(roads.length>11){roads[0].root.dispose(false,false);roads.shift();current--;}}
resetRoads();knight.position.set(0,.18,4);camera.position.set(12,7,-13);camera.setTarget(new Vector3(1.5,1.4,21));
function visible(id,on){el(id).classList.toggle('hidden',!on);}
function setMode(next){mode=next;el('ui').className=mode==='start'?'start-mode':'playing-mode';visible('start-screen',mode==='start');visible('pause',mode!=='start');visible('run-label',mode!=='start');visible('touch-controls',mode==='playing');}
function start(){resetRoads();current=0;selected=0;score=0;combo=0;landings=0;runTime=0;jumpTime=0;phaseTime=0;phase='cruise';spinAngle=visualSpin=0;spinner.rotation.set(0,FORWARD_YAW,0);tapKick=0;jumpSparkles.reset();jumpSparkles.start();knight.position.set(0,.16,2);cruiseStart=2;el('score').textContent='00000';visible('modal',false);setMode('playing');audio.start().catch(()=>{});lastGuideKey='';updateGuides();camera.position.set(-7,2.6,knight.position.z-10);camera.setTarget(new Vector3(0,1.1,knight.position.z+10));}
function toast(title,sub,duration=.9){el('toast').innerHTML=`${title}<small>${sub}</small>`;visible('toast',true);toastTimer=duration;}
function updateGuides(){
  if(mode!=='playing')return;
  el('jump-label').textContent='JUMP '+String(landings+1).padStart(2,'0');
  const key=roads[current].index+':'+selected;
  if(key===lastGuideKey)return;lastGuideKey=key;
  drawGapGuides();
}
function turn(dir){
  if(mode!=='playing'||phase==='fall')return;
  selected+=dir;spinAngle+=dir*Math.PI/2;spinJuice=1;tapKick=dir*.32;
  // Apply feedback in the input handler, before the next animation frame.
  if(phase==='air'){visualSpin+=dir*.80;spinner.rotation.y=FORWARD_YAW+visualSpin;}
  else{spinner.rotation.y=FORWARD_YAW+tapKick;spinner.rotation.z=-dir*.12;}
  audio.spin(selected);updateGuides();
  const button=el(dir<0?'left':'right');button.classList.add('pressed');setTimeout(()=>button.classList.remove('pressed'),90);
}
function modal(content){el('modal').innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${content}</div>`;visible('modal',true);el('modal').querySelector('button')?.focus();}
function pause(){if(mode==='playing'){setMode('paused');audio.stop();modal('<div class="eyebrow">TAKE A BREATHER</div><h2 id="dialog-title">Still in the groove.</h2><p>Your rainbow will be right here.</p><button class="primary" id="resume">Keep riding <span>↗</span></button><button class="secondary" id="restart">Start a fresh run</button>');el('resume').onclick=resume;el('restart').onclick=start;}else if(mode==='paused')resume();}
function resume(){visible('modal',false);setMode('playing');audio.start().catch(()=>{});el('world').focus();}
function help(){const previous=mode;if(mode==='playing'){setMode('paused');audio.stop();}
  modal('<div class="eyebrow">A KNIGHT TO REMEMBER</div><h2 id="dialog-title">Catch the next road.</h2><div class="how-steps"><span class="number">1</span><p>You cruise and jump automatically. Look for the solid rainbow road among the hollow lanes.</p></div><div class="how-steps"><span class="number">2</span><p>Tap ← or → at any time to choose your next move. On your phone, tap the left or right half of the play area.</p></div><div class="how-steps"><span class="number">3</span><p>Each tap adds a quarter-turn and a rotated knight move: two squares forward, one across. Four turns loop back home.</p></div><div class="how-steps"><span class="number">4</span><p>You can keep tapping in midair. An opposite tap undoes a turn. The mint marker shows your landing.</p></div><button class="primary" id="close-help">Got it <span>↗</span></button>');el('close-help').onclick=()=>{visible('modal',false);if(previous==='playing')resume();};}
function finish(){setMode('over');if(score>best){best=score;try{localStorage.setItem('knightwave-best',String(best));}catch{}el('best').textContent=String(best).padStart(5,'0');}
  modal(`<div class="eyebrow">THE STARS WILL WAIT</div><h2 id="dialog-title">One more wave?</h2><p>${landings===0?'The solid road sits two squares forward and one to the right. Tap right at any time before landing.':'You found the rhythm. Let’s take it a little further.'}</p><div class="dialog-stats"><div><strong>${score}</strong><small>YOUR SCORE</small></div><div><strong>${landings}</strong><small>LANDINGS</small></div></div><button class="primary" id="again">Ride again <span>↗</span></button>`);el('again').onclick=start;
}
el('start').onclick=start;el('help').onclick=help;el('pause').onclick=pause;
function mute(){el('sound').textContent=audio.mute()?'♪̸':'♫';el('sound').setAttribute('aria-label',audio.muted?'Unmute soundtrack':'Mute soundtrack');el('sound').setAttribute('aria-pressed',String(audio.muted));}
el('sound').onclick=mute;
for(const [id,d] of [['left',-1],['right',1]])el(id).addEventListener('pointerdown',e=>{e.preventDefault();turn(d);});
canvas.addEventListener('pointerdown',e=>{if(mode==='playing'){e.preventDefault();turn(e.clientX<window.innerWidth/2?-1:1);}});
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLButtonElement&&e.code==='Space')return;if(['ArrowLeft','ArrowRight','Space','Escape','KeyA','KeyD'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='ArrowLeft'||e.code==='KeyA')turn(-1);if(e.code==='ArrowRight'||e.code==='KeyD')turn(1);if(e.code==='KeyM')mute();if(e.code==='Escape'){if(mode==='playing'||mode==='paused'){if(!el('close-help'))pause();else el('close-help').click();}}if(e.code==='Space'){if(mode==='start'||mode==='over')start();else pause();}});
// Trap modal focus so keyboard play and pause stay predictable.
el('modal').addEventListener('keydown',e=>{if(e.key==='Tab'){const buttons=[...el('modal').querySelectorAll('button')];if(buttons.length===1){e.preventDefault();buttons[0].focus();}else if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
window.addEventListener('resize',()=>{engine.setHardwareScalingLevel(1/Math.min(window.devicePixelRatio||1,2));engine.resize();});
const landingPreview=MeshBuilder.CreateTorus('your landing preview',{diameter:2.5,thickness:.095,tessellation:44},scene);landingPreview.material=mint;landingPreview.setEnabled(false);
const previewBeam=MeshBuilder.CreateCylinder('landing beam',{diameter:.08,height:3,tessellation:8},scene);previewBeam.material=mint;previewBeam.material.alpha=.45;previewBeam.setEnabled(false);
const ghostColor=Color3.FromHexString('#977fba');
function drawGapGuides(){
  const r=roads[current];
  if(gapRoot?.metadata?.index!==r.index){
    gapRoot?.dispose(false,false);gapRoot=new TransformNode('hollow chess lanes',scene);gapRoot.metadata={index:r.index};
    gapRoot.position.set(r.x,.015,r.end);
    const lines=[];
    for(let x=-3;x<=3;x++)for(let z=-1;z<=2;z++){
      const cx=x*SCALE,cz=z*SCALE,h=SCALE*.47;
      lines.push([new Vector3(cx-h,0,cz-h),new Vector3(cx+h,0,cz-h),new Vector3(cx+h,0,cz+h),new Vector3(cx-h,0,cz+h),new Vector3(cx-h,0,cz-h)]);
    }
    const grid=MeshBuilder.CreateLineSystem('empty chess squares',{lines},scene);grid.color=ghostColor;grid.alpha=.25;grid.parent=gapRoot;
    const laneLines=[];
    for(const n of [-3,-2,-1,1,2,3]){
      if(n===roads[current+1].target)continue;
      const d=knightDestination(n),x=d.x*SCALE,z=d.z*SCALE;
      laneLines.push([new Vector3(x-3,0,z-3),new Vector3(x-3,0,z+28),new Vector3(x+3,0,z+28),new Vector3(x+3,0,z-3),new Vector3(x-3,0,z-3)]);
      for(let dz=0;dz<=24;dz+=SCALE)laneLines.push([new Vector3(x-3,0,z+dz),new Vector3(x+3,0,z+dz)]);
    }
    const lanes=MeshBuilder.CreateLineSystem('possible road outlines',{lines:laneLines},scene);lanes.color=Color3.FromHexString('#ba9bdd');lanes.alpha=.38;lanes.parent=gapRoot;
  }
  pathRoot?.dispose(false,false);pathRoot=new TransformNode('chosen L trajectory',scene);pathRoot.position.copyFrom(gapRoot.position);
  const points=(selected===0?[{x:0,z:0},{x:0,z:2}]:knightPath(selected)).map(p=>new Vector3(p.x*SCALE,.045,p.z*SCALE));
  const route=MeshBuilder.CreateTube('knight move trace',{path:points,radius:.035,tessellation:6},scene);route.material=mint;route.parent=pathRoot;
  for(let i=0;i<points.length;i++){const p=points[i];const marker=MeshBuilder.CreateTorus('L corner marker',{diameter:i===points.length-1?1.0:.55,thickness:.055,tessellation:32},scene);marker.material=mint;marker.position.copyFrom(p);marker.parent=pathRoot;}
}
function chosenLanding(){const r=roads[current],d=selected===0?{x:0,z:2}:knightDestination(selected);return new Vector3(r.x+d.x*SCALE,.18,r.end+d.z*SCALE);}
function burst(){for(let i=0;i<burstPieces.length;i++){const p=burstPieces[i];p.mesh.position.copyFrom(knight.position);p.mesh.position.y+=.2;p.velocity.set((rand()-.5)*9,rand()*7+2,(rand()-.5)*9);p.life=.7;p.mesh.setEnabled(true);}}
function update(dt){
  jumpSparkles.emitRate=mode==='playing'&&phase==='air'?210+spinJuice*180:0;
  if(mode==='playing'){
    runTime+=dt;phaseTime+=dt;spinJuice=Math.max(0,spinJuice-dt*4);tapKick*=Math.exp(-dt*14);
    if(phase==='cruise'){
      const r=roads[current];knight.position.z+=SPEED*Math.min(1.35,1+landings*.012)*dt;knight.position.x=r.x;knight.position.y=.18+Math.sin(runTime*19)*.035;
      spinner.rotation.y=FORWARD_YAW+tapKick;spinner.rotation.z=-tapKick*.25;spinner.rotation.x=-.045;
      if(knight.position.z>=r.end){knight.position.z=r.end;phase='air';jumpTime=0;phaseTime=0;visualSpin=0;burst();}
    }else if(phase==='air'){
      jumpTime+=dt;const t=Math.min(1,jumpTime/FLIGHT),p=flightPoint(selected,t),r=roads[current];
      const desiredX=r.x+p.x*SCALE,desiredZ=r.end+p.z*SCALE;
      knight.position.x+=(desiredX-knight.position.x)*Math.min(1,dt*35);knight.position.z+=(desiredZ-knight.position.z)*Math.min(1,dt*35);
      knight.position.y=.18+Math.sin(t*Math.PI)*3.65+Math.sin(t*Math.PI)*spinJuice*.35;
      visualSpin+=(spinAngle-visualSpin)*Math.min(1,dt*19);spinner.rotation.y=FORWARD_YAW+visualSpin;
      spinner.rotation.z=Math.sin(t*Math.PI)*.10*Math.sign(selected);spinner.rotation.x=Math.sin(t*Math.PI)*.16;
      if(t===1){
        knight.position.copyFrom(chosenLanding());
        if(isLandingMatch(selected,roads[current+1].target)){
          current++;landings++;combo++;score+=100+combo*25+Math.abs(selected)*10;el('score').textContent=String(score).padStart(5,'0');
          burst();flash=1;audio.land(combo);toast(''+combo+'× flow','+'+(100+combo*25+Math.abs(selected)*10),.55);
          phase='cruise';phaseTime=0;cruiseStart=knight.position.z;selected=0;spinAngle=visualSpin=0;spinner.rotation.y=FORWARD_YAW;extend();updateGuides();
        }else{phase='fall';phaseTime=0;combo=0;audio.fall();landingPreview.setEnabled(false);previewBeam.setEnabled(false);}
      }
    }else if(phase==='fall'){knight.position.y-=dt*(5+phaseTime*14);spinner.rotation.z+=dt*1.7;if(phaseTime>1.05)finish();}
    if(phase!=='fall'){
      const show=phase==='air'||roads[current].end-knight.position.z<36;
      landingPreview.setEnabled(show);previewBeam.setEnabled(show);gapRoot?.setEnabled(show);pathRoot?.setEnabled(show);
      if(show){const dest=chosenLanding();landingPreview.position.copyFrom(dest);landingPreview.position.y=.04;previewBeam.position.copyFrom(dest);previewBeam.position.y=1.2;landingPreview.scaling.setAll(1+audio.pulse*.06);}
    }
    const narrow=window.innerWidth<700;
    const goal=new Vector3(knight.position.x-7,2.6+Math.max(0,knight.position.y-.18)*.75,knight.position.z-(narrow?12:10));
    Vector3.LerpToRef(camera.position,goal,1-Math.exp(-dt*11),camera.position);
    camera.setTarget(new Vector3(knight.position.x+(narrow?2.4:2.5),1.15+Math.max(0,knight.position.y-.18)*.65,knight.position.z+(narrow?6:10)));
    scenery.position.z=knight.position.z*.92;rim.position.set(knight.position.x-2,knight.position.y+5,knight.position.z-3);
  }else if(mode==='start'){
    const t=performance.now()*.001;knight.position.y=.25+Math.sin(t*2)*.10;spinner.rotation.y=FORWARD_YAW+Math.sin(t*.5)*.035;
    if(window.innerWidth<700&&window.innerHeight>550){camera.position.set(-8,5.8,-10);camera.setTarget(new Vector3(7,3.0,20));}
    else{camera.position.set(-10+Math.sin(t*.15)*.5,5.0,-11);camera.setTarget(new Vector3(-9,1.4,20));}
  }
  if(mode==='playing'||mode==='start'){
    glow.intensity=.47+audio.pulse*.10;planetRing.rotation.y+=dt*.03;
    shadow.position.set(knight.position.x,.01,knight.position.z);shadow.scaling.setAll(Math.max(.4,1-(knight.position.y-.18)*.08));shadow.setEnabled(phase!=='fall');
    for(const r of roads)r.ring.scaling.setAll(1+Math.sin(runTime*3+r.index)*.05);
    for(const p of burstPieces){if(p.life>0){p.life-=dt;p.mesh.position.addInPlace(p.velocity.scale(dt));p.velocity.y-=dt*13;p.mesh.scaling.setAll(Math.max(0,p.life/.7));if(p.life<=0)p.mesh.setEnabled(false);}}
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)visible('toast',false);}
    flash=Math.max(0,flash-dt*3.5);el('flash').style.opacity=flash*.45;
  }
}
engine.runRenderLoop(()=>{update(Math.min(engine.getDeltaTime()/1000,.05));scene.render();});
scene.executeWhenReady(()=>{visible('loading',false);});
const state=()=>({mode,phase,selected,target:roads[current+1]?.target,jump:landings+1,score,combo,landings,position:{x:knight.position.x,y:knight.position.y,z:knight.position.z},takeoff:roads[current]?.end,airtime:jumpTime/FLIGHT,audio:{state:audio.ctx?.state,muted:audio.muted,steps:audio.step},fps:Math.round(engine.getFps()),meshes:scene.meshes.length,speed:SPEED,cellSize:SCALE,launch:{x:roads[current]?.x,z:roads[current]?.end},landing:{x:roads[current+1]?.x,z:roads[current+1]?.start},render:{width:engine.getRenderWidth(),height:engine.getRenderHeight()},camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z},knightYaw:spinner.rotation.y,sparkles:jumpSparkles.getActiveCount()});
// Observability for playtesting; actions are the same as keyboard and touch.
window.knightwave={state,start,turn,pause,resume,mute,engine,scene};
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  for(const tool of [{name:'get_knightwave_state',description:'Read current score, jump phase, selected turns and next landing.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:state},{name:'rotate_knight',description:'Add one left or right quarter-turn to the current jump. Uses the same action as the on-screen controls.',inputSchema:{type:'object',properties:{direction:{enum:['left','right']}},required:['direction'],additionalProperties:false},execute:input=>{if(!input||!['left','right'].includes(input.direction))throw new Error('Direction must be left or right');if(mode!=='playing')throw new Error('Start a run before rotating');turn(input.direction==='right'?1:-1);return state();}}]){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
