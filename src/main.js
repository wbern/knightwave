import './style.css';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { knightDestination, isLandingMatch, flightPoint, flightHeading, rotateGrid } from './rules.js';
import { BOARD_MIN, BOARD_MAX, BOARD_CELLS, BOARD_CENTER, CELL_SIZE, createCircuit } from './board.js';
import { PLATFORM_TOP, CRUISE_SPEED, platformStage, platformPose } from './platforms.js';
import { moveGlyphs } from './moves.js';
import { createKnight } from './knight.js';
import { Premoves, verticalGesture } from './premoves.js';
import { Soundtrack } from './audio.js';

const asset=name=>`${import.meta.env.BASE_URL}${name}`;
const app=document.querySelector('#app');
app.innerHTML=`<canvas id="world" aria-label="Knightwave 3D chess circuit"></canvas>
<div id="ui" class="start-mode">
  <header class="topbar"><div class="brand"><img class="brand-icon" src="${asset('knight-mark.svg')}" alt="" width="35" height="35"><div class="brand-name">knightwave<small>AN ARCADE DAYDREAM</small></div></div><div class="stats"><div class="stat"><small>SCORE</small><strong id="score">00000</strong></div><div class="stat"><small>BEST</small><strong id="best">00000</strong></div></div><div class="utility"><button class="icon-button" id="sound" aria-label="Mute soundtrack" title="Sound on/off (M)">♫</button><button class="icon-button hidden" id="pause" aria-label="Pause game" title="Pause (Esc)">Ⅱ</button><button class="icon-button" id="help" aria-label="How to play" title="How to play">?</button></div></header>
  <section class="center-card" id="start-screen"><div class="eyebrow">CHESS MOVES. COSMIC GROOVES.</div><h1>Ride the<span>knightwave.</span></h1><p class="intro">A little chess. A little foresight.<br>Charge the orb. Send your moves.<br>Bring your knight back home.</p><button class="primary" id="start">Let’s ride <span>↗</span></button><div class="start-caption">TAP TO COMPOSE. SEND TO JUMP.</div></section>
  <div class="run-label hidden" id="run-label">THE CIRCUIT <span> / </span> <span id="jump-label">JUMP 01</span></div>
  <section id="move-queue" class="move-queue hidden" aria-label="Dispatched premoves"><div class="queue-window"><div id="queue-track" class="queue-track"></div></div></section>
  <button id="orb-send" class="orb-send hidden" aria-label="Dispatch premove"><span id="orb-glyphs" class="orb-glyphs"></span></button>
  <div id="board-labels" class="board-labels" aria-hidden="true"></div>
  <div class="flash" id="flash"></div>
  <div class="touch-controls hidden" id="touch-controls"><button class="turn-button" id="left" aria-label="Rotate knight left"><svg viewBox="0 0 48 48"><path d="M33 38V15Q33 8 23 8H12m7-6-7 6 7 6"/></svg></button><button class="send-button" id="dispatch" aria-label="Send premove"><svg viewBox="0 0 48 48"><path d="M24 37V10m-9 9 9-9 9 9"/></svg></button><button class="turn-button" id="right" aria-label="Rotate knight right"><svg viewBox="0 0 48 48"><path d="M15 38V15Q15 8 25 8H36m-7-6 7 6-7 6"/></svg></button></div>
  <div id="gesture-caption" class="gesture-caption hidden">TAP SIDES · SWIPE UP TO SEND</div>
  <footer class="bottom-bar"><div class="controls-legend"><div class="legend"><span class="keycap">←</span><span class="keycap">→</span> compose</div><div class="legend"><span class="keycap">␣</span> send premove</div><div class="legend">Esc pause · ⌫ recall</div></div><div class="track-name"><span class="pulse-bars"><i></i><i></i><i></i><i></i></span> Stardust Overdrive<small>ORIGINAL SOUNDTRACK · 160 BPM</small></div></footer>
  <div class="modal-shade hidden" id="modal"></div>
</div><div class="loading" id="loading">Tuning the rainbow…</div>`;
const el=id=>document.getElementById(id),audio=new Soundtrack();
const canvas=el('world');
let engine, scene;
try{engine=new Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,powerPreference:'high-performance'});scene=new Scene(engine);}catch(e){el('loading').innerHTML='<div>WebGL is needed to ride the rainbow.<br><small>Try a browser with hardware acceleration enabled.</small></div>';throw e;}
engine.setHardwareScalingLevel(1/Math.min(window.devicePixelRatio||1,2));
scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.exposure=.85;
scene.clearColor=new Color4(.028,.014,.07,1);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogColor=new Color3(.08,.025,.16);scene.fogDensity=0;
const camera=new FreeCamera('fixed front chessboard',new Vector3(BOARD_CENTER*CELL_SIZE,48,BOARD_CENTER*CELL_SIZE-50),scene);camera.minZ=.1;camera.maxZ=1200;camera.mode=Camera.ORTHOGRAPHIC_CAMERA;camera.setTarget(new Vector3(BOARD_CENTER*CELL_SIZE,0,BOARD_CENTER*CELL_SIZE));
const hemi=new HemisphericLight('soft light',new Vector3(-.4,1,-.4),scene);hemi.intensity=.55;hemi.diffuse=new Color3(.76,.83,1);hemi.groundColor=new Color3(.25,.08,.43);
const rim=new PointLight('mint rim',new Vector3(0,8,-4),scene);rim.diffuse=new Color3(.3,1,.83);rim.intensity=.45;rim.range=38;
const sun=new DirectionalLight('soft key light',new Vector3(.35,-1,.3),scene);sun.position.set(-18,40,-18);sun.intensity=.85;sun.diffuse=Color3.FromHexString('#fff2db');
const shadows=new ShadowGenerator(2048,sun);shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=ShadowGenerator.QUALITY_MEDIUM;shadows.bias=.001;shadows.normalBias=.035;shadows.setDarkness(.3);
const glow=new GlowLayer('neon',scene,{mainTextureRatio:.4,blurKernelSize:32});glow.intensity=.65;
function material(name,hex,emission=0){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.emissiveColor=m.diffuseColor.scale(emission);m.specularColor=new Color3(.06,.06,.09);return m;}
const palette=['#ff72c1','#bf7bff','#8c83ff','#70bdff','#75efee','#a8f9c2','#f8e99c'];
const roadMats=palette.map((c,i)=>material('rainbow '+i,c,.25));
const mint=material('mint neon','#8dffe1',1.6),pink=material('pink neon','#fd8bdf',1.5),gold=material('landing gold','#ffb642',.65),white=material('porcelain','#efece5',.06),purple=material('mane','#583680',.3);

// Dedicated sky artwork stays behind the 3D course and planets.
const sky=MeshBuilder.CreateSphere('world sky',{diameter:1800,segments:32,sideOrientation:Mesh.BACKSIDE},scene);
const skyMat=new StandardMaterial('cosmic sky',scene);skyMat.disableLighting=true;skyMat.emissiveTexture=new Texture(asset('cosmic-sky.png'),scene);skyMat.emissiveColor=Color3.Black();skyMat.emissiveTexture.level=.25;skyMat.emissiveTexture.wrapU=Texture.MIRROR_ADDRESSMODE;skyMat.emissiveTexture.uScale=4;skyMat.emissiveTexture.wrapV=Texture.MIRROR_ADDRESSMODE;skyMat.emissiveTexture.vScale=3;skyMat.diffuseColor=Color3.Black();sky.material=skyMat;sky.infiniteDistance=true;sky.applyFog=false;sky.isPickable=false;sky.rotation.x=Math.PI/2;glow.addExcludedMesh(sky);
let seed=512;
function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const planet=MeshBuilder.CreateSphere('lavender planet',{diameter:60,segments:32},scene);planet.material=material('planet','#604292',.4);planet.position.set(-92,52,300);
const planetRing=MeshBuilder.CreateTorus('saturn ring',{diameter:92,thickness:.65,tessellation:100},scene);planetRing.material=material('planet ring','#b996ee',1.3);planetRing.position.copyFrom(planet.position);planetRing.rotation.set(.28,0,-.3);
const moon=MeshBuilder.CreateSphere('mint moon',{diameter:19,segments:24},scene);moon.position.set(110,57,350);moon.material=material('moon','#aff7df',1);
const halo=MeshBuilder.CreateTorus('moon halo',{diameter:28,thickness:.28,tessellation:80},scene);halo.material=mint;halo.position.copyFrom(moon.position);halo.rotation.x=Math.PI/2;
const scenery=new TransformNode('cosmos',scene);planet.parent=planetRing.parent=moon.parent=halo.parent=scenery;
function box(name,w,h,d,x,y,z,mat,parent){const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.material=mat;if(parent)m.parent=parent;return m;}

const {knight,spinner}=createKnight(scene,white,purple,mint);
const FORWARD_YAW=Math.PI/2;
for(const mesh of knight.getChildMeshes()){shadows.addShadowCaster(mesh);glow.addExcludedMesh(mesh);}
const shadow=MeshBuilder.CreateDisc('hover shadow',{radius:1.1,tessellation:30},scene);shadow.rotation.x=Math.PI/2;shadow.material=material('shadow','#170d37',.1);shadow.material.alpha=.4;shadow.material.disableLighting=true;shadow.material.diffuseColor=Color3.Black();shadow.material.emissiveColor=Color3.FromHexString('#1a1525');shadow.position.y=.035;glow.addExcludedMesh(shadow);
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
const orb=new TransformNode('premove energy orb',scene);
const orbBody=MeshBuilder.CreateSphere('energy orb shell',{diameter:3.8,segments:24},scene);orbBody.parent=orb;
const orbMaterial=material('charged energy','#21665e',.5);orbMaterial.alpha=.22;orbMaterial.specularColor=new Color3(.18,.3,.27);orbBody.material=orbMaterial;
const orbCore=MeshBuilder.CreateSphere('energy orb core',{diameter:.4,segments:16},scene);orbCore.parent=orb;orbCore.material=mint;
const orbHalo=MeshBuilder.CreateTorus('energy orbit',{diameter:4.0,thickness:.035,tessellation:48},scene);orbHalo.parent=orb;orbHalo.material=mint;orbHalo.rotation.x=.65;
const circuit=createCircuit(),premoves=new Premoves(circuit.length-1);
let orbKick=0,sendFlash=0,orbScreen={x:0,y:0},gesture=null,orbLimits={top:180,bottom:innerHeight-90,right:innerWidth-38},progressElement=null;
let mode='start',phase='cruise',current=0,selected=0,jumpTime=0,phaseTime=0,runTime=0,score=0,combo=0,landings=0,visualSpin=0,spinJuice=0,flash=0,airDuration=1.25,tapKick=0,lastGuideKey='',lastLanding=null;
const GROUND=PLATFORM_TOP+.06;
let best=0;try{best=Number(localStorage.getItem('knightwave-board-best')||0);}catch{}
el('best').textContent=String(best).padStart(5,'0');
const board=new TransformNode('finite chessboard',scene),boardWidth=BOARD_CELLS*CELL_SIZE;
const boardCenter=BOARD_CENTER*CELL_SIZE;
const frame=material('chessboard frame','#46364e',.18);
box('floating board',boardWidth+1.2,.8,boardWidth+1.2,boardCenter,-2.5,boardCenter,frame,board);
const lightSquare=material('ivory chess square','#ddd4bc',.12),darkSquare=material('plum chess square','#655a76',.06);
const recessedLight=material('recessed light square','#302d43',.035),recessedDark=material('recessed dark square','#191925',.025),floorRim=material('recessed square rim','#4c435b',.025);
const cells=[];
for(let z=BOARD_MIN;z<=BOARD_MAX;z++)for(let x=BOARD_MIN;x<=BOARD_MAX;x++){
  const square=box('chess square',CELL_SIZE-.025,.08,CELL_SIZE-.025,x*CELL_SIZE,-2.065,z*CELL_SIZE,(x+z)%2===0?recessedDark:recessedLight,board);
  square.receiveShadows=true;square.metadata={x,z};cells.push(square);glow.addExcludedMesh(square);
}
// Shared physical rails outline all 64 recessed squares without 256 draw calls.
for(let i=0;i<=BOARD_CELLS;i++){
  const edge=(BOARD_MIN-.5+i)*CELL_SIZE;
  for(const vertical of [false,true]){
    const rail=box('raised square rim',vertical?.075:boardWidth,.16,vertical?boardWidth:.075,vertical?edge:boardCenter,-1.97,vertical?boardCenter:edge,floorRim,board);
    rail.receiveShadows=true;glow.addExcludedMesh(rail);
  }
}
const platformMaterials={occupied:material('raised chess platform','#8a779d',.10),falling:material('departed surface','#48263c',.15)};
const platformAccent=material('platform edge','#b0e4d5',.55);
const fallingAccent=material('departed platform rails','#ae6288',.25);
const platforms=circuit.map((stop,i)=>{
  const root=new TransformNode('platform '+i,scene);root.position.set(stop.x*CELL_SIZE,PLATFORM_TOP,stop.z*CELL_SIZE);root.rotation.y=stop.heading;root.parent=board;
  const length=stop.runLength*CELL_SIZE;
  const deck=box('raised platform deck',3.7,1.05,length+3.7,0,-.525,length/2,platformMaterials.occupied,root);
  box('platform lift column',2.15,1.65,length+2.1,0,-1.86,length/2,platformMaterials.occupied,root);
  const trims=[];
  for(const side of [-1,1])trims.push(box('platform glow rail',.07,.07,length+3.7,side*1.86,.03,length/2,mint,root));
  for(const z of [-1.85,length+1.85])trims.push(box('platform end rail',3.78,.07,.075,0,.03,z,mint,root));
  for(let row=0;row<stop.runLength;row++)trims.push(box('raised square divider',3.78,.14,.08,0,.045,(row+.5)*CELL_SIZE,platformAccent,root));
  const surfaces=[];
  for(let row=0;row<=stop.runLength;row++){
    const offset=rotateGrid({x:0,z:row},stop.heading),light=(stop.x+offset.x+stop.z+offset.z)%2!==0;
    const square=box('raised chess square',3.58,.025,3.58,0,.01,row*CELL_SIZE,light?lightSquare:darkSquare,root);
    square.receiveShadows=true;surfaces.push(square);glow.addExcludedMesh(square);
  }
  for(const mesh of root.getChildMeshes())shadows.addShadowCaster(mesh);
  return {root,deck,trims,surfaces,stage:null,age:0};
});
function updatePlatforms(dt,reset=false){
  for(let i=0;i<platforms.length;i++){
    const p=platforms[i],stage=platformStage(i,current);
    if(reset||stage!==p.stage){p.age=0;p.stage=stage;}else p.age+=dt;
    const pose=platformPose(stage,p.age);p.root.position.y=pose.height;p.root.rotation.x=pose.tilt;p.root.setEnabled(pose.visible);
    const pop=stage==='rising'?Math.min(1,p.age/.85):stage==='falling'?Math.max(0,1-p.age/1.1):1;
    p.root.scaling.setAll(.72+.28*pop);
    for(const mesh of p.root.getChildMeshes())mesh.visibility=stage==='falling'?pop:1;
    const falling=stage==='falling';p.deck.material=platformMaterials[falling?'falling':'occupied'];
    for(const mesh of p.trims)mesh.material=falling?fallingAccent:platformAccent;
  }
}
function worldCell(cell){return new Vector3(cell.x*CELL_SIZE,GROUND,cell.z*CELL_SIZE);}
function fitBoardCamera(){
  const width=innerWidth,height=innerHeight,aspect=width/height,narrow=width<700,short=height<550&&width>height,intro=mode==='start';
  orbLimits={top:short?114:el('move-queue').getBoundingClientRect().bottom+38,bottom:height-90,right:width-38};
  const availableWidth=intro?(narrow?.62:short?.25:.43):(short?.42:.90),availableHeight=short?.66:.58;
  let halfWidth=Math.max((boardWidth+3)/availableWidth,(boardWidth+3)/availableHeight*aspect)/2;
  const centerX=intro&&!narrow?(short?.78:.72):short?.36:.5;let centerY=intro&&narrow?.76:short?.60:narrow?.57:.61;
  if(!short&&(!intro||narrow)){
    const top=(intro?el('start-screen'):el('move-queue')).getBoundingClientRect().bottom+24,bottom=height-(intro?100:narrow?110:70);
    const side=Math.max(80,Math.min(width*availableWidth,bottom-top));
    halfWidth=(boardWidth+3)/side*width/2;centerY=(top+bottom)/2/height;
  }
  const halfHeight=halfWidth/aspect;
  const offsetX=(.5-centerX)*2*halfWidth,offsetY=(centerY-.5)*2*halfHeight;
  camera.orthoLeft=-halfWidth+offsetX;camera.orthoRight=halfWidth+offsetX;camera.orthoTop=halfHeight+offsetY;camera.orthoBottom=-halfHeight+offsetY;
  camera.getViewMatrix(true);
  const screen=(x,z)=>Vector3.Project(new Vector3(x,-2,z),Matrix.Identity(),camera.getViewMatrix().multiply(camera.getProjectionMatrix(true)),camera.viewport.toGlobal(width,height));
  el('board-labels').innerHTML=Array.from({length:8},(_,i)=>{
    const file=screen((BOARD_MIN+i)*CELL_SIZE,BOARD_MIN*CELL_SIZE-CELL_SIZE/2-2.0),rank=screen(BOARD_MIN*CELL_SIZE-CELL_SIZE/2-1.1,(BOARD_MIN+i)*CELL_SIZE);
    return `<span style="left:${file.x}px;top:${file.y}px">${String.fromCharCode(97+i)}</span><span style="left:${rank.x}px;top:${rank.y}px">${i+1}</span>`;
  }).join('');
}
function visible(id,on){el(id).classList.toggle('hidden',!on);}
function setMode(next){mode=next;el('ui').className=mode==='start'?'start-mode':'playing-mode';visible('start-screen',mode==='start');visible('pause',mode==='playing'||mode==='paused');visible('run-label',mode!=='start');visible('touch-controls',mode==='playing');visible('move-queue',mode==='playing'||mode==='paused');visible('orb-send',mode==='playing'||mode==='paused');visible('gesture-caption',mode==='playing');orb.setEnabled(mode==='playing'||mode==='paused');}
function start(){
  premoves.reset();orbKick=0;sendFlash=0;gesture=null;current=0;lastLanding=null;selected=0;score=0;combo=0;landings=0;runTime=0;jumpTime=0;phaseTime=0;phase='cruise';visualSpin=0;
  spinner.rotation.set(0,FORWARD_YAW,0);knight.scaling.setAll(1.38);tapKick=0;jumpSparkles.reset();jumpSparkles.start();airDuration=1.25;knight.position.copyFrom(worldCell(circuit[0]));
  el('score').textContent='00000';visible('modal',false);setMode('playing');audio.start().catch(()=>{});lastGuideKey='';updateGuides();updatePlatforms(0,true);fitBoardCamera();
}
function chosenCell(){
  const origin=circuit[current].launch,offset=rotateGrid(selected===0?{x:0,z:3}:knightDestination(selected),origin.heading);
  return {x:origin.x+offset.x,z:origin.z+offset.z};
}
function updateGuides(){
  if(!['playing','paused'].includes(mode))return;
  el('jump-label').textContent=String(Math.min(landings+1,6)).padStart(2,'0')+' / 06';
  const key=premoves.groups.map(g=>g.id).join(',')+':'+premoves.draft+':'+premoves.locked;if(key===lastGuideKey)return;lastGuideKey=key;
  const track=el('queue-track');if(!premoves.locked)el('move-queue').querySelector('.queue-window').scrollLeft=0;
  track.innerHTML=premoves.groups.map((group,i)=>`${i?'<i class="group-divider" aria-hidden="true"></i>':''}<div class="move-group ${i===0&&premoves.locked?'executing':''}" data-group="${group.id}" aria-label="Platform ${landings+i+1} premove">${moveGlyphs(group.turns,group.heading)}<span class="group-progress"></span></div>`).join('');
  progressElement=track.querySelector('.executing .group-progress');
  el('orb-glyphs').innerHTML=premoves.draft?moveGlyphs(premoves.draft,premoves.draftHeading(circuit[current].heading)):'<svg class="orb-glint" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4Q20 20 36 20Q20 20 20 36Q20 20 4 20Q20 20 20 4" fill="currentColor"/></svg>';
  el('orb-send').classList.toggle('charged',!!premoves.draft);
  el('orb-send').setAttribute('aria-label',premoves.draft?'Dispatch composed premove':'Compose a premove with left or right');
  el('dispatch').disabled=!premoves.draft;el('dispatch').classList.toggle('ready',!!premoves.draft);
  el('gesture-caption').textContent=matchMedia('(pointer:coarse)').matches?'TAP SIDES · SWIPE UP TO SEND':'← → COMPOSE · SPACE SENDS · ⌫ RECALL';
}
function turn(dir){
  if(mode!=='playing'||phase==='fall'||!premoves.edit(dir))return;
  spinJuice=1;tapKick=dir*.32;orbKick=1;orb.scaling.setAll(1.12);
  if(phase!=='air'){spinner.rotation.y=FORWARD_YAW+circuit[current].heading+tapKick;spinner.rotation.z=-dir*.12;}
  audio.spin(premoves.draft);updateGuides();
  const button=el(dir<0?'left':'right');button.classList.add('pressed');setTimeout(()=>button.classList.remove('pressed'),90);
}
function beginJump(){
  const group=premoves.begin();if(!group)return false;
  selected=group.turns;phase='air';jumpTime=0;airDuration=1.25+.30*(Math.abs(selected)-1);phaseTime=0;visualSpin=0;burst();updateGuides();return true;
}
function dispatch(){
  if(mode!=='playing'||phase==='fall')return false;
  const glyphs=el('orb-glyphs').innerHTML,group=premoves.dispatch(circuit[current].heading);if(!group){orbKick=.3;return false;}
  sendFlash=1;orbKick=1;audio.dispatch();updateGuides();
  const slot=el('queue-track').lastElementChild,rect=slot?.getBoundingClientRect(),banner=el('move-queue').getBoundingClientRect();
  if(rect&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
    const token=document.createElement('div');token.className='dispatch-flight';token.innerHTML=glyphs;token.style.left=orbScreen.x+'px';token.style.top=orbScreen.y+'px';document.body.append(token);
    token.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${Math.min(rect.x+rect.width/2,banner.right-20)-orbScreen.x}px),calc(-50% + ${rect.y+rect.height/2-orbScreen.y}px)) scale(.65)`,opacity:0}],{duration:340,easing:'cubic-bezier(.2,.7,.2,1)'}).finished.finally(()=>token.remove());
  }
  if(phase==='waiting')beginJump();return true;
}
function recall(){
  if(mode!=='playing'||phase==='fall')return false;
  if(!premoves.recall())return false;orbKick=1;audio.spin(premoves.draft);updateGuides();return true;
}
function updateOrb(dt){
  const showing=['playing','paused'].includes(mode);orb.setEnabled(showing);if(!showing)return;
  if(mode==='playing'){
    orbKick=Math.max(0,orbKick-dt*5);sendFlash=Math.max(0,sendFlash-dt*3);orbHalo.rotation.y+=dt*.8;
    const heading=spinner.rotation.y-FORWARD_YAW;
    orb.position.set(knight.position.x+Math.sin(heading)*4.8+Math.cos(heading)*2,knight.position.y+2.5+Math.sin(runTime*3)*.12,knight.position.z+Math.cos(heading)*4.8-Math.sin(heading)*2);
    orb.scaling.setAll(1+orbKick*.12+sendFlash*.24);orbMaterial.alpha=.36+(premoves.draft ? .16 : 0)+sendFlash*.12;orbCore.scaling.setAll(premoves.draft ? .4 : 1);
  }
  const matrix=scene.getTransformMatrix(),viewport=camera.viewport.toGlobal(innerWidth,innerHeight),point=Vector3.Project(orb.position,Matrix.Identity(),matrix,viewport);
  const minY=orbLimits.top,maxY=orbLimits.bottom;
  let x=Math.max(38,Math.min(orbLimits.right,point.x));const y=Math.max(minY,Math.min(maxY,point.y));
  const head=knight.position.clone();head.y+=4.5;const headScreen=Vector3.Project(head,Matrix.Identity(),matrix,viewport);
  if(Math.abs(y-headScreen.y)<38&&Math.abs(x-headScreen.x)<44)x=Math.max(38,Math.min(orbLimits.right,headScreen.x+(x>=headScreen.x?44:-44)));

  {
    orb.position.x+=(x-point.x)*(camera.orthoRight-camera.orthoLeft)/innerWidth;
    orb.position.z-=(y-point.y)*(camera.orthoTop-camera.orthoBottom)/innerHeight/Math.sin(camera.rotation.x);
  }
  orbScreen={x,y};el('orb-send').style.left=x+'px';el('orb-send').style.top=y+'px';
  if(progressElement)progressElement.style.transform=`scaleX(${Math.min(1,jumpTime/airDuration)})`;
}
knight.position.copyFrom(worldCell(circuit[0]));updatePlatforms(0,true);fitBoardCamera();
function modal(content){el('modal').innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${content}</div>`;visible('modal',true);el('modal').querySelector('button')?.focus();}
function pause(){if(mode==='playing'){setMode('paused');audio.stop();modal('<div class="eyebrow">TAKE A BREATHER</div><h2 id="dialog-title">Still in the groove.</h2><p>Your circuit will be right here.</p><button class="primary" id="resume">Keep riding <span>↗</span></button><button class="secondary" id="restart">Start a fresh run</button>');el('resume').onclick=resume;el('restart').onclick=start;}else if(mode==='paused')resume();}
function resume(){visible('modal',false);setMode('playing');audio.start().catch(()=>{});el('world').focus();}
function help(){const previous=mode;if(mode==='playing'){setMode('paused');audio.stop();}
  modal('<div class="eyebrow">A KNIGHT TO REMEMBER</div><h2 id="dialog-title">Charge. Send. Jump.</h2><div class="how-steps"><span class="number">1</span><p>Bright platforms are raised and safe to land on. Dark squares sit below. Plan on the a–h, 1–8 chessboard.</p></div><div class="how-steps"><span class="number">2</span><p>Tap the left or right side, or use ← / →, to compose L moves in the energy orb ahead of your knight. Two squares along the icon’s stem, one across its arrow. An opposite tap undoes a turn.</p></div><div class="how-steps"><span class="number">3</span><p>Swipe up or press Space to send one group for one platform. The orb clears for the next group. Your banner shows only moves you have sent; each divider separates platforms. You can also tap the orb or the upward arrow to send.</p></div><div class="how-steps"><span class="number">4</span><p>The knight jumps at the edge using the next sent group. If none is ready, it waits for you. During a jump, compose later groups in the orb. Swipe down or press Backspace to clear a draft, then recall the last unstarted group. Escape pauses.</p></div><button class="primary" id="close-help">Got it <span>↗</span></button>');el('close-help').onclick=()=>{visible('modal',false);if(previous==='playing')resume();};}
function finish(won=false){
  setMode(won?'won':'over');jumpSparkles.emitRate=0;
  if(score>best){best=score;try{localStorage.setItem('knightwave-board-best',String(best));}catch{}el('best').textContent=String(best).padStart(5,'0');}
  modal(`<div class="eyebrow">${won?'A PERFECT LITTLE LOOP':'THE BOARD WILL WAIT'}</div><h2 id="dialog-title">${won?'Circuit complete.':'One more circuit?'}</h2><p>${won?'Six landings, all the way home. You found your flow.':'Recall an unstarted group to edit it, then send it again. Read the bright platforms to plan your next landing.'}</p><div class="dialog-stats"><div><strong>${score}</strong><small>YOUR SCORE</small></div><div><strong>${landings} / 6</strong><small>LANDINGS</small></div></div><button class="primary" id="again">Ride again <span>↗</span></button>`);el('again').onclick=start;
}
function mute(){el('sound').textContent=audio.mute()?'♪̸':'♫';el('sound').setAttribute('aria-label',audio.muted?'Unmute soundtrack':'Mute soundtrack');el('sound').setAttribute('aria-pressed',String(audio.muted));}
el('start').onclick=start;el('sound').onclick=mute;el('pause').onclick=pause;el('help').onclick=help;
el('dispatch').onclick=dispatch;el('orb-send').onclick=dispatch;
for(const [id,direction] of [['left',-1],['right',1]])el(id).addEventListener('pointerdown',event=>{event.preventDefault();turn(direction);});
function beginGesture(event,orbTap=false){
  if(mode!=='playing'||gesture)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);
  const direction=orbTap?0:event.clientX<innerWidth*.42?-1:event.clientX>innerWidth*.58?1:0;
  gesture={id:event.pointerId,start:{x:event.clientX,y:event.clientY},draft:premoves.draft,provisional:false,cancelled:false,orbTap};
  if(direction){turn(direction);gesture.provisional=true;}else{orbKick=.5;}
}
canvas.addEventListener('pointerdown',event=>beginGesture(event));
el('orb-send').addEventListener('pointerdown',event=>beginGesture(event,true));
canvas.addEventListener('pointermove',event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  if(Math.hypot(event.clientX-gesture.start.x,event.clientY-gesture.start.y)>12&&!gesture.cancelled){
    if(gesture.provisional){premoves.draft=gesture.draft;updateGuides();}gesture.cancelled=true;
  }
});
canvas.addEventListener('pointerup',event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  const pending=gesture;gesture=null;
  const action=verticalGesture(pending.start,{x:event.clientX,y:event.clientY});
  if(action){if(pending.provisional&&!pending.cancelled){premoves.draft=pending.draft;updateGuides();}action==='dispatch'?dispatch():recall();}
  else if(pending.orbTap&&!pending.cancelled)dispatch();
});
canvas.addEventListener('pointercancel',event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  if(gesture.provisional&&!gesture.cancelled){premoves.draft=gesture.draft;updateGuides();}gesture=null;
});
window.addEventListener('keydown',event=>{
  if(event.key===' '&&event.target instanceof HTMLButtonElement&&!el('modal').classList.contains('hidden'))return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Escape','Backspace'].includes(event.key))event.preventDefault();
  if(event.repeat)return;
  if(event.key==='ArrowLeft'||event.key==='a'||event.key==='A')turn(-1);
  if(event.key==='ArrowRight'||event.key==='d'||event.key==='D')turn(1);
  if(event.key===' '||event.key==='ArrowUp'){if(['start','over','won'].includes(mode))start();else if(mode==='paused')resume();else dispatch();}
  if(event.key==='Backspace'||event.key==='ArrowDown')recall();
  if(event.key==='Escape'){if(el('close-help')&&!el('modal').classList.contains('hidden'))el('close-help').click();else pause();}if(event.key==='m'||event.key==='M')mute();
});
// Trap modal focus so keyboard play and pause stay predictable.
el('modal').addEventListener('keydown',e=>{if(e.key==='Tab'){const buttons=[...el('modal').querySelectorAll('button')];if(buttons.length===1){e.preventDefault();buttons[0].focus();}else if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
window.addEventListener('resize',()=>{engine.setHardwareScalingLevel(1/Math.min(window.devicePixelRatio||1,2));engine.resize();fitBoardCamera();});
const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function burst(){for(const p of burstPieces){p.mesh.position.copyFrom(knight.position);p.mesh.position.y+=.2;p.velocity.set((rand()-.5)*6,rand()*5+2,(rand()-.5)*6);p.life=.6;p.mesh.setEnabled(true);}}
function update(dt){
  jumpSparkles.emitRate=mode==='playing'&&phase==='air'?180+spinJuice*100:0;
  if(mode==='playing'){
    runTime+=dt;phaseTime+=dt;spinJuice=Math.max(0,spinJuice-dt*4);tapKick*=Math.exp(-dt*14);
    const origin=circuit[current];
    if(phase==='cruise'){
      const distance=Math.min(origin.runLength*CELL_SIZE,phaseTime*CRUISE_SPEED),offset=rotateGrid({x:0,z:distance},origin.heading);
      knight.position.set(origin.x*CELL_SIZE+offset.x,GROUND+Math.sin(distance*2.6)*.025,origin.z*CELL_SIZE+offset.z);
      spinner.rotation.y=FORWARD_YAW+origin.heading+tapKick;spinner.rotation.z=-tapKick*.25;spinner.rotation.x=-.06+Math.sin(distance*2.6)*.035;

      if(distance>=origin.runLength*CELL_SIZE&&!beginJump()){phase='waiting';phaseTime=0;}
    }else if(phase==='waiting'){
      knight.position.set(origin.launch.x*CELL_SIZE,GROUND+Math.sin(phaseTime*3)*.025,origin.launch.z*CELL_SIZE);spinner.rotation.y=FORWARD_YAW+origin.heading+tapKick;spinner.rotation.x=0;spinner.rotation.z=-tapKick*.25;
    }else if(phase==='air'){
      jumpTime+=dt;const t=Math.min(1,jumpTime/airDuration),p=rotateGrid(flightPoint(selected,t),origin.heading);
      knight.position.x=(origin.launch.x+p.x)*CELL_SIZE;knight.position.z=(origin.launch.z+p.z)*CELL_SIZE;
      knight.position.y=GROUND+Math.sin(t*Math.PI)*4.8;
      visualSpin+=wrapAngle(flightHeading(selected,t)-visualSpin)*(1-Math.exp(-dt*24));spinner.rotation.y=FORWARD_YAW+origin.heading+visualSpin;
      spinner.rotation.z=Math.sin(t*Math.PI)*.08*Math.sign(selected);spinner.rotation.x=Math.sin(t*Math.PI)*.12;
      if(t===1){
        knight.position.copyFrom(worldCell(chosenCell()));
        if(isLandingMatch(selected,circuit[current+1].turns)){
          lastLanding={x:knight.position.x,y:knight.position.y,z:knight.position.z};premoves.complete();current++;landings++;combo++;score+=100+combo*25+Math.abs(selected)*10;el('score').textContent=String(score).padStart(5,'0');
          burst();flash=1;audio.land(combo);selected=0;visualSpin=0;spinner.rotation.set(0,FORWARD_YAW+circuit[current].heading,0);updatePlatforms(0);
          if(current===circuit.length-1){finish(true);}
          else{phase='cruise';phaseTime=0;lastGuideKey='';updateGuides();}
        }else{phase='fall';phaseTime=0;audio.fall();}
      }
    }else if(phase==='fall'){knight.position.y-=dt*(6+phaseTime*12);if(phaseTime>.70)finish();}
  }
  if(mode==='playing'||mode==='start'||mode==='won'){
    updatePlatforms(dt);
    const squash=phase==='cruise'?Math.max(0,1-phaseTime/.18)*.12:0;
    knight.scaling.set(1.38*(1+squash/2),1.38*(1-squash),1.38*(1+squash/2));
    glow.intensity=.43+audio.pulse*.10;
    const abovePlatform=platforms.some((p,i)=>{
      if(!p.root.isEnabled()||p.stage==='falling'||p.root.position.y<PLATFORM_TOP-.1)return false;
      const stop=circuit[i],local=rotateGrid({x:knight.position.x-stop.x*CELL_SIZE,z:knight.position.z-stop.z*CELL_SIZE},-stop.heading);
      return Math.abs(local.x)<1.85&&local.z>-1.85&&local.z<stop.runLength*CELL_SIZE+1.85;
    });
    const surface=abovePlatform?PLATFORM_TOP+.05:-2.015,altitude=Math.max(0,knight.position.y-surface);
    shadow.position.set(knight.position.x,surface,knight.position.z);shadow.scaling.setAll(1.38+altitude*.06);
    shadow.material.alpha=Math.max(.16,.44-altitude*.03);shadow.setEnabled(phase!=='fall');

    for(const p of burstPieces){if(p.life>0){p.life-=dt;p.mesh.position.addInPlace(p.velocity.scale(dt));p.velocity.y-=dt*12;p.mesh.scaling.setAll(Math.max(0,p.life/.6));if(p.life<=0)p.mesh.setEnabled(false);}}
    flash=Math.max(0,flash-dt*3.5);el('flash').style.opacity=flash*.35;
  }
}
engine.runRenderLoop(()=>{const dt=Math.min(engine.getDeltaTime()/1000,.05);update(dt);scene.updateTransformMatrix();updateOrb(mode==='playing'?dt:0);scene.render();});
scene.executeWhenReady(()=>{visible('loading',false);});
document.fonts.ready.then(fitBoardCamera);
const state=()=>({mode,phase,selected,draft:premoves.draft,draftHeading:premoves.draftHeading(circuit[current].heading),locked:premoves.locked,orb:{x:orbScreen.x,y:orbScreen.y},target:circuit[current+1]?.turns,jump:landings+1,score,combo,landings,totalLandings:circuit.length-1,lastLanding,position:{x:knight.position.x,y:knight.position.y,z:knight.position.z},planning:phase==='waiting'?1:Math.min(1,phaseTime*CRUISE_SPEED/(circuit[current].runLength*CELL_SIZE)),airtime:jumpTime/airDuration,audio:{state:audio.ctx?.state,muted:audio.muted,steps:audio.step},fps:Math.round(engine.getFps()),meshes:scene.meshes.length,cellSize:CELL_SIZE,board:{min:BOARD_MIN,max:BOARD_MAX,cells:cells.length,extent:boardWidth/2},heading:circuit[current]?.heading,landingHeading:circuit[current+1]?.heading,launch:{x:circuit[current].launch.x*CELL_SIZE,z:circuit[current].launch.z*CELL_SIZE},landing:circuit[current+1]?{x:circuit[current+1].x*CELL_SIZE,z:circuit[current+1].z*CELL_SIZE}:null,render:{width:engine.getRenderWidth(),height:engine.getRenderHeight()},platforms:platforms.map((p,i)=>({index:i,stage:p.stage,height:p.root.position.y,visible:p.root.isEnabled()})),speed:CRUISE_SPEED,moveQueue:premoves.groups.map(g=>({...g})),camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,rotation:{x:camera.rotation.x,y:camera.rotation.y,z:camera.rotation.z},orthographic:camera.mode===Camera.ORTHOGRAPHIC_CAMERA},knightYaw:spinner.rotation.y,sparkles:jumpSparkles.getActiveCount()});
// Observability for playtesting; actions are the same as keyboard and touch.
window.knightwave={state,start,turn,dispatch,recall,pause,resume,mute,engine,scene};
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  for(const tool of [{name:'get_knightwave_state',description:'Read current score, jump phase, selected turns and next landing.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:state},{name:'rotate_knight',description:'Add one left or right quarter-turn to the premove orb. Uses the same action as the on-screen controls.',inputSchema:{type:'object',properties:{direction:{enum:['left','right']}},required:['direction'],additionalProperties:false},execute:input=>{if(!input||!['left','right'].includes(input.direction))throw new Error('Direction must be left or right');if(mode!=='playing')throw new Error('Start a run before rotating');turn(input.direction==='right'?1:-1);return state();}}]){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
