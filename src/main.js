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
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { knightDestination, normalizeMoves } from './rules.js';
import { progression, SCROLL_GRACE_SECONDS as SCROLL_GRACE } from './progression.js';
import { createCapturePiece } from './pieces.js';
import { BOARD_MIN, BOARD_MAX, BOARD_CELLS, BOARD_CENTER, CELL_SIZE, GRID_COLS, GRID_ROWS, EndlessCourse } from './board.js';
import { PLATFORM_TOP, LANDING_DWELL, platformPose } from './platforms.js';
import {flightPose,trickPose} from './flight.js';
import { moveGlyphs, directionGlyph } from './moves.js';
import { createKnight } from './knight.js';
import { Premoves, verticalGesture } from './premoves.js';
import { Soundtrack } from './audio.js';

const asset=name=>`${import.meta.env.BASE_URL}${name}`;
const app=document.querySelector('#app');
app.innerHTML=`<canvas id="world" aria-label="Knightwave endless 3D chess course"></canvas>
<div id="ui" class="start-mode">
  <header class="topbar"><div class="brand"><img class="brand-icon" src="${asset('knight-mark.svg')}" alt="" width="35" height="35"><div class="brand-name">knightwave<small>AN ARCADE DAYDREAM</small></div></div><div class="stats"><div class="stat"><small>SCORE</small><strong id="score">00000</strong></div><div class="stat"><small>BEST</small><strong id="best">00000</strong></div></div><div class="utility"><button class="icon-button" id="sound" aria-label="Mute soundtrack" title="Sound on/off (M)">♫</button><button class="icon-button hidden" id="pause" aria-label="Pause game" title="Pause (Esc)">Ⅱ</button><button class="icon-button" id="help" aria-label="How to play" title="How to play">?</button></div></header>
  <section class="center-card" id="start-screen"><div class="eyebrow">CHESS MOVES. COSMIC GROOVES.</div><h1>Ride the<span>knightwave.</span></h1><p class="intro">A little chess. A little foresight.<br>Charge the orb. Send your moves.<br>Read the board. Ride the rising tempo.</p><button class="primary" id="start">Let’s ride <span>↗</span></button><div class="start-caption">TWO DIRECTIONS. ONE KNIGHT MOVE.</div></section>
  <div class="run-label hidden" id="run-label"><span id="level-label">LEVEL 01</span><span id="jump-label"></span><span id="level-progress"><i></i></span></div><div id="level-toast" class="level-toast hidden" aria-live="polite"></div><div id="scroll-seam" class="scroll-seam hidden"><span id="scroll-status"></span></div>
  <section id="move-queue" class="move-queue hidden" aria-label="Dispatched premoves"><div class="queue-window"><div id="queue-track" class="queue-track"></div></div></section>
  <div class="controls-dock hidden" id="controls-dock"><div class="touch-controls" id="touch-controls"><button class="turn-button" id="up" aria-label="Compose up">${directionGlyph('up')}</button><button class="turn-button" id="left" aria-label="Compose left">${directionGlyph('left')}</button><button class="turn-button" id="right" aria-label="Compose right">${directionGlyph('right')}</button><button class="turn-button" id="down" aria-label="Compose down">${directionGlyph('down')}</button></div><button id="orb-send" class="orb-send hidden" aria-label="Dispatch premove"><svg class="orb-art" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="orb-shell" cx="35%" cy="27%" r="75%"><stop offset="0" stop-color="#78d4bc" stop-opacity=".8"/><stop offset=".5" stop-color="#164a43" stop-opacity=".95"/><stop offset="1" stop-color="#062723"/></radialGradient></defs><circle cx="50" cy="50" r="37" fill="url(#orb-shell)" stroke="#98e9cf" stroke-opacity=".6"/><ellipse cx="50" cy="50" rx="46" ry="17" transform="rotate(-30 50 50)" fill="none" stroke="#baffeb" stroke-opacity=".55"/><path d="M26 35Q31 20 46 21" fill="none" stroke="#e4fff4" stroke-opacity=".65" stroke-width="2" stroke-linecap="round"/></svg><span id="orb-glyphs" class="orb-glyphs"></span></button>
  </div><div id="board-labels" class="board-labels" aria-hidden="true"></div>
  <div id="gesture-caption" class="gesture-caption hidden">TWO DIRECTIONS · DOUBLE TAP ORB TO SEND</div>
  <footer class="bottom-bar"><div class="controls-legend"><div class="legend"><span class="keycap">↑↓←→</span> compose</div><div class="legend"><span class="keycap">␣</span> send premove</div><div class="legend">Esc pause · ⌫ recall</div></div><div class="track-name"><span class="pulse-bars"><i></i><i></i><i></i><i></i></span> Nebula Checkmate Run<small>TEMPO FOLLOWS YOUR LEVEL</small></div></footer>
  <div class="modal-shade hidden" id="modal"></div>
</div><div class="loading" id="loading">Tuning the rainbow…</div>`;
const el=id=>document.getElementById(id),audio=new Soundtrack();
const canvas=el('world');
let engine, scene;
try{engine=new Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,powerPreference:'high-performance'});scene=new Scene(engine);}catch(e){el('loading').innerHTML='<div>WebGL is needed to ride the rainbow.<br><small>Try a browser with hardware acceleration enabled.</small></div>';throw e;}
engine.setHardwareScalingLevel(1/Math.min(window.devicePixelRatio||1,2));
scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.exposure=.85;
scene.clearColor=new Color4(.028,.014,.07,1);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogColor=new Color3(.08,.025,.16);scene.fogDensity=0;
const camera=new FreeCamera('fixed front chessboard',new Vector3(BOARD_CENTER*CELL_SIZE,68,BOARD_CENTER*CELL_SIZE-42),scene);camera.minZ=.1;camera.maxZ=1200;camera.mode=Camera.ORTHOGRAPHIC_CAMERA;camera.setTarget(new Vector3(BOARD_CENTER*CELL_SIZE,0,BOARD_CENTER*CELL_SIZE));
const hemi=new HemisphericLight('soft light',new Vector3(-.4,1,-.4),scene);hemi.intensity=.55;hemi.diffuse=new Color3(.76,.83,1);hemi.groundColor=new Color3(.25,.08,.43);
const rim=new DirectionalLight('mint rim',new Vector3(.4,-.35,-.5),scene);rim.diffuse=new Color3(.3,1,.83);rim.intensity=.25;
const sun=new DirectionalLight('soft key light',new Vector3(.35,-1,.3),scene);sun.position.set(-18,40,-18);sun.intensity=.85;sun.diffuse=Color3.FromHexString('#fff2db');
const shadows=new ShadowGenerator(2048,sun);shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=ShadowGenerator.QUALITY_MEDIUM;shadows.bias=.001;shadows.normalBias=.035;shadows.setDarkness(.3);
const glow=new GlowLayer('neon',scene,{mainTextureRatio:.4,blurKernelSize:32});glow.intensity=.43;
function material(name,hex,emission=0){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.emissiveColor=m.diffuseColor.scale(emission);m.specularColor=new Color3(.06,.06,.09);return m;}
const mint=material('mint neon','#8dffe1',1.6),gold=material('landing gold','#ffb642',.65),white=material('porcelain','#efece5',.06),purple=material('mane','#583680',.3);

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

const {knight,spinner,trick}=createKnight(scene,white,purple,mint);
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
const course=new EndlessCourse(),premoves=new Premoves();
let orbKick=0,sendFlash=0,orbScreen={x:0,y:0},gesture=null,progressElement=null;
let mode='start',phase='waiting',current=0,selected=null,moveIndex=0,captures=0,scrollSpeed=0,levelTime=0,lossReason='',jumpTime=0,phaseTime=0,runTime=0,score=0,combo=0,landings=0,spinJuice=0,airDuration=1.25,tapKick=0,lastGuideKey='',lastLanding=null;
const GROUND=PLATFORM_TOP+.06;
let best=0;try{best=Number(localStorage.getItem('knightwave-board-best')||0);}catch{}
el('best').textContent=String(best).padStart(5,'0');
const board=new TransformNode('endless chessboard',scene),boardWidth=BOARD_CELLS*CELL_SIZE;
let scrollZ=4,firstRow=-12,arena={top:160,bottom:innerHeight-122,left:0,right:innerWidth};
const boardCenter=BOARD_CENTER*CELL_SIZE;
const foundation=material('board foundation','#211e2d',.025);
box('endless board foundation',GRID_COLS*CELL_SIZE,.7,GRID_ROWS*CELL_SIZE,boardCenter,-2.5,-CELL_SIZE/2,foundation,board);
const lightSquare=material('ivory chess square','#ddd4bc',.12),darkSquare=material('plum chess square','#655a76',.06);
const recessedLight=material('recessed light square','#302d43',.035),recessedDark=material('recessed dark square','#191925',.025),floorRim=material('recessed square rim','#4c435b',.025);
const tiles=[[],[]],rails=[];
for(let row=-GRID_ROWS/2;row<GRID_ROWS/2;row++)for(let col=-GRID_COLS/2;col<GRID_COLS/2;col++){
  const parity=Math.abs((col+row)%2);
  tiles[parity].push(box('chess square',CELL_SIZE-.025,.08,CELL_SIZE-.025,col*CELL_SIZE,-2.065,row*CELL_SIZE,parity?recessedLight:recessedDark));
}
for(let i=0;i<=GRID_COLS;i++)rails.push(box('square rim',.075,.16,GRID_ROWS*CELL_SIZE,(-GRID_COLS/2-.5+i)*CELL_SIZE,-1.97,-CELL_SIZE/2,floorRim));
for(let i=0;i<=GRID_ROWS;i++)rails.push(box('square rim',GRID_COLS*CELL_SIZE,.16,.075,boardCenter,-1.97,(-GRID_ROWS/2-.5+i)*CELL_SIZE,floorRim));
// Three merged meshes draw hundreds of squares and physical rims.
for(const [name,meshes] of [['dark chess grid',tiles[0]],['light chess grid',tiles[1]],['raised square rims',rails]]){
  const merged=Mesh.MergeMeshes(meshes,true,true);merged.name=name;merged.parent=board;merged.receiveShadows=true;glow.addExcludedMesh(merged);
}
const boardEdge=material('chessboard side rail','#766580',.05);
for(const x of [(BOARD_MIN-.5)*CELL_SIZE,(BOARD_MAX+.5)*CELL_SIZE]){
  const edge=box('physical board edge',.20,.42,GRID_ROWS*CELL_SIZE,x,-1.87,-CELL_SIZE/2,boardEdge,board);edge.receiveShadows=true;glow.addExcludedMesh(edge);
}
const capturePorcelain=material('capture coral porcelain','#edac78',.06),captureInk=material('capture inlay','#734f4a',.03);
const platformMaterials={occupied:material('raised chess platform','#8a779d',.10),falling:material('departed surface','#48263c',.15)};
const platformAccent=material('platform edge','#b0e4d5',.55);
const fallingAccent=material('departed platform rails','#ae6288',.25);
const platforms=Array.from({length:10},(_,i)=>{
  const root=new TransformNode('platform '+i,scene);root.setEnabled(false);
  const deck=box('raised platform deck',3.7,.35,3.7,0,-.175,0,platformMaterials.occupied,root);
  box('platform lift column',2.15,.55,2.15,0,-.625,0,platformMaterials.occupied,root);
  const trims=[];
  for(const side of [-1,1]){
    trims.push(box('platform glow rail',.07,.07,3.7,side*1.86,.03,0,platformAccent,root));
    trims.push(box('platform end rail',3.78,.07,.075,0,.03,side*1.85,platformAccent,root));
  }
  const square=box('raised chess square',3.58,.025,3.58,0,.01,0,lightSquare,root);
  square.receiveShadows=true;glow.addExcludedMesh(square);
  for(const mesh of root.getChildMeshes())shadows.addShadowCaster(mesh);
  const pieces=Object.fromEntries(['pawn','rook','bishop'].map(kind=>[kind,createCapturePiece(scene,root,kind,capturePorcelain,captureInk)]));
  for(const piece of Object.values(pieces))for(const mesh of piece.getChildMeshes()){shadows.addShadowCaster(mesh);glow.addExcludedMesh(mesh);}
  return {root,deck,trims,square,pieces,index:null,stop:null,stage:null,age:0};
});
function upcomingPlatforms(){
  const origin=course.at(current),result=[...course.stops],pending=premoves.groups.flatMap((g,i)=>i===0&&premoves.locked?g.moves.slice(moveIndex):g.moves);
  const draft=normalizeMoves(premoves.draft);let at=origin;
  for(const move of [...pending,...draft].slice(0,3)){
    const offset=knightDestination(move),cell={x:at.x+offset.x,z:at.z+offset.z};
    const next=course.previewOptions(at,at.index).find(p=>p.x===cell.x&&p.z===cell.z);
    if(!next)break;at=next;
    for(const p of course.previewOptions(at,at.index))if(!result.some(q=>q.x===p.x&&q.z===p.z))result.push({...p,preview:true});
  }
  return result.slice(0,platforms.length);
}
function updatePlatforms(dt,reset=false){
  const wanted=upcomingPlatforms(),active=new Set();
  for(const stop of wanted){
    let p=platforms.find(p=>p.index===stop.id);
    if(!p)p=platforms.find(p=>!active.has(p)&&!wanted.some(s=>s.id===p.index));
    if(!p)continue;active.add(p);
    const stage=stop.index<current?'falling':stop.id===course.at(current).id?'occupied':stop.preview?'rising':'target';
    if(reset||p.index!==stop.id||(stage==='falling'&&p.stage!=='falling'))p.age=0;else p.age+=dt;p.stage=stage;p.index=stop.id;p.stop=stop;
    const pose=platformPose(stage==='target'&&p.age<.85?'rising':stage,p.age);p.root.position.set(stop.x*CELL_SIZE,pose.height,stop.z*CELL_SIZE);p.root.rotation.x=pose.tilt;p.root.setEnabled(pose.visible);
    p.square.material=(stop.x+stop.z)%2!==0?lightSquare:darkSquare;
    const pop=stage==='rising'?Math.min(1,p.age/.85):stage==='falling'?Math.max(0,1-p.age/1.1):1;
    p.root.scaling.setAll(.88+.12*pop);
    for(const mesh of p.root.getChildMeshes())mesh.visibility=stage==='falling'?pop:1;
    const falling=stage==='falling';p.deck.material=platformMaterials[falling?'falling':'occupied'];
    for(const mesh of p.trims)mesh.material=falling?fallingAccent:stop.piece?gold:platformAccent;
    for(const [kind,piece] of Object.entries(p.pieces))piece.setEnabled(stop.piece===kind&&stage!=='occupied'&&stage!=='falling');
  }
  for(const p of platforms)if(!active.has(p)){p.root.setEnabled(false);p.index=null;p.stop=null;}
}
function worldCell(cell){return new Vector3(cell.x*CELL_SIZE,GROUND,cell.z*CELL_SIZE);}
function fitBoardCamera(){
  const width=innerWidth,height=innerHeight,narrow=width<700,short=height<550&&width>height,intro=mode==='start';
  const queueBottom=el('move-queue').getBoundingClientRect().bottom;
  arena={top:intro?(narrow?el('start-screen').getBoundingClientRect().bottom+20:110):short?92:queueBottom+20,bottom:height-(short?40:172),left:0,right:width};
  const introSide=intro&&!narrow,centerX=introSide?.75:short?.32:.5;
  const maxWidth=introSide?width*.38:short?width*.50:Math.min(width-40,650);
  const boardPixels=Math.max(100,Math.min(maxWidth,(arena.bottom-arena.top)*1.2));
  const halfWidth=(boardWidth+2.6)/boardPixels*width/2,halfHeight=halfWidth*height/width;
  const centerY=(arena.top+arena.bottom)/2/height;
  const offsetX=(.5-centerX)*2*halfWidth,offsetY=(centerY-.5)*2*halfHeight;
  camera.orthoLeft=-halfWidth+offsetX;camera.orthoRight=halfWidth+offsetX;camera.orthoTop=halfHeight+offsetY;camera.orthoBottom=-halfHeight+offsetY;
  const side=boardPixels/2+10;arena.left=Math.max(12,centerX*width-side);arena.right=Math.min(width-12,centerX*width+side);
  for(const [name,value] of Object.entries(arena))canvas.style.setProperty('--scene-'+name,value+'px');
  el('scroll-seam').style.cssText=`left:${arena.left+10}px;right:${width-arena.right+10}px;top:${arena.bottom-27}px`;
  el('board-labels').innerHTML=Array.from({length:BOARD_CELLS},()=>'<span class="file-label"></span>').join('')+Array.from({length:GRID_ROWS},()=>'<span class="rank-label"></span>').join('');
  updateCourseView(0,intro);
}
function updateCourseView(dt,reset=false){
  if(reset)scrollZ=knight.position.z+2;
  else if(mode==='playing'){
    scrollSpeed+=(progression(landings).speed-scrollSpeed)*(1-Math.exp(-dt*2));
    scrollZ+=scrollSpeed*(Math.max(0,runTime-SCROLL_GRACE)-Math.max(0,runTime-dt-SCROLL_GRACE));
    // Only elapsed time advances the view; the knight never pulls the camera.
  }
  camera.position.set(boardCenter,68,scrollZ-42);camera.setTarget(new Vector3(boardCenter,0,scrollZ));
  sun.position.z=scrollZ-18;scenery.position.z=scrollZ-16;
  firstRow=Math.floor(scrollZ/(CELL_SIZE*2))*2-GRID_ROWS/2;board.position.z=(firstRow+GRID_ROWS/2)*CELL_SIZE;
}
function updateBoardLabels(){
  const viewport=camera.viewport.toGlobal(innerWidth,innerHeight),matrix=scene.getTransformMatrix();
  const project=(x,z)=>Vector3.Project(new Vector3(x,-2,z),Matrix.Identity(),matrix,viewport);
  el('board-labels').querySelectorAll('.file-label').forEach((label,i)=>{
    const p=project((BOARD_MIN+i)*CELL_SIZE,scrollZ);label.style.display=p.x>arena.left+8&&p.x<arena.right-8?'block':'none';label.textContent=String.fromCharCode(97+i);label.style.left=p.x+'px';label.style.top=(arena.bottom-8)+'px';
  });
  el('board-labels').querySelectorAll('.rank-label').forEach((label,i)=>{
    const row=firstRow+i,p=project((BOARD_MIN-.5)*CELL_SIZE-.8,row*CELL_SIZE),rank=row-BOARD_MIN+1;
    label.style.display=rank>0&&p.y>arena.top+12&&p.y<arena.bottom-24?'block':'none';label.textContent=String(rank);label.style.left=p.x+'px';label.style.top=p.y+'px';
  });
}
function visible(id,on){el(id).classList.toggle('hidden',!on);}
function setMode(next){mode=next;el('ui').className=mode==='start'?'start-mode':'playing-mode';visible('start-screen',mode==='start');visible('pause',mode==='playing'||mode==='paused');visible('run-label',mode!=='start');visible('controls-dock',mode==='playing'||mode==='paused');visible('scroll-seam',mode==='playing'||mode==='paused');visible('move-queue',mode==='playing'||mode==='paused');visible('orb-send',mode==='playing'||mode==='paused');visible('gesture-caption',mode==='playing');}
function start(){
  course.reset();premoves.reset();lastOrbTap=0;orbKick=0;sendFlash=0;gesture=null;current=0;captures=0;moveIndex=0;scrollSpeed=progression(0).speed;levelTime=0;lossReason='';lastLanding=null;selected=null;score=0;combo=0;landings=0;runTime=0;jumpTime=0;phaseTime=0;phase='waiting';trick.rotation.set(0,0,0);
  spinner.rotation.set(0,FORWARD_YAW,0);knight.scaling.setAll(1.38);tapKick=0;jumpSparkles.reset();jumpSparkles.start();airDuration=1.25;knight.position.copyFrom(worldCell(course.at(0)));
  scrollZ=3;el('score').textContent='00000';visible('modal',false);setMode('playing');audio.setLevel(1,{reset:true});audio.start().catch(()=>{});lastGuideKey='';updateGuides();updatePlatforms(0,true);fitBoardCamera();updateOrb(0);
}
function chosenCell(){
  const origin=course.at(current),offset=knightDestination(selected);
  return {x:origin.x+offset.x,z:origin.z+offset.z};
}
function updateGuides(){
  if(!['playing','paused'].includes(mode))return;
  const level=progression(landings);el('jump-label').textContent=`${level.progress}/${level.total}`;el('level-label').textContent=`LEVEL ${String(level.level).padStart(2,'0')} / ${level.name}`;el('level-progress').firstElementChild.style.transform=`scaleX(${level.progress/level.total})`;
  const key=premoves.groups.map(g=>g.id).join(',')+':'+premoves.draft+':'+premoves.locked+':'+moveIndex;if(key===lastGuideKey)return;lastGuideKey=key;
  const track=el('queue-track');if(!premoves.locked)el('move-queue').querySelector('.queue-window').scrollLeft=0;
  track.innerHTML=premoves.groups.map((group,i)=>`${i?'<i class="group-divider" aria-hidden="true"></i>':''}<div class="move-group ${i===0&&premoves.locked?'executing':''}" data-group="${group.id}" aria-label="Platform ${landings+i+1} premove">${moveGlyphs(i===0&&premoves.locked?group.moves.slice(moveIndex):group.moves)}<span class="group-progress"></span></div>`).join('');
  progressElement=track.querySelector('.executing .group-progress');
  el('orb-glyphs').innerHTML=premoves.draft.length?moveGlyphs(premoves.draft):'<svg class="orb-glint" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4Q20 20 36 20Q20 20 20 36Q20 20 4 20Q20 20 20 4" fill="currentColor"/></svg>';
  el('orb-send').classList.toggle('charged',!!premoves.draft.length);
  el('orb-send').setAttribute('aria-label',premoves.draft.length?'Double tap to dispatch composed moves':'Compose two directions, then double tap this orb');
  el('gesture-caption').textContent=matchMedia('(pointer:coarse)').matches?'TWO DIRECTIONS · DOUBLE TAP ORB TO SEND':'↑↓←→ COMPOSE · SPACE SENDS · ⌫ RECALL';
}
function turn(dir){
  lastOrbTap=0;
  if(mode!=='playing'||phase==='fall'||!premoves.edit(dir))return;
  spinJuice=1;tapKick=(dir==='left'?-1:1)*.32;orbKick=1;el('orb-send').style.setProperty('--orb-scale','1.12');
  if(phase!=='air'){spinner.rotation.y=FORWARD_YAW;spinner.rotation.z=-tapKick*.375;}
  audio.spin(premoves.draft.length);updateGuides();
  const button=el(dir);button.classList.add('pressed');setTimeout(()=>button.classList.remove('pressed'),90);
}
function beginJump(){
  const pending=premoves.groups[0];if(!pending)return false;
  const origin=course.at(current),offset=knightDestination(pending.moves[moveIndex]),cell={x:origin.x+offset.x,z:origin.z+offset.z};
  if(course.match(cell)){
    const target=Vector3.Project(new Vector3(cell.x*CELL_SIZE,GROUND,cell.z*CELL_SIZE),Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(innerWidth,innerHeight));
    const pixelsPerUnit=innerWidth/(camera.orthoRight-camera.orthoLeft);
    const flightClearance=(4.8+4.7)*Math.cos(camera.rotation.x)*pixelsPerUnit+22;
    if(target.y<arena.top+Math.max(60,flightClearance))return false;
  }
  const group=premoves.locked?pending:premoves.begin();if(!group)return false;
  selected=group.moves[moveIndex];phase='air';jumpTime=0;airDuration=Math.max(.70,1.05-(progression(landings).level-1)*.025);phaseTime=0;trick.rotation.set(0,0,0);burst();updateGuides();return true;
}
function dispatch(){
  if(mode!=='playing'||phase==='fall')return false;
  const glyphs=el('orb-glyphs').innerHTML,group=premoves.dispatch();if(!group){orbKick=.3;return false;}
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
  if(!premoves.recall())return false;orbKick=1;audio.spin(premoves.draft.length);updateGuides();return true;
}
function updateOrb(dt){
  if(!['playing','paused'].includes(mode))return;
  orbKick=Math.max(0,orbKick-dt*5);sendFlash=Math.max(0,sendFlash-dt*3);
  const button=el('orb-send'),rect=button.getBoundingClientRect();
  orbScreen={x:rect.x+rect.width/2,y:rect.y+rect.height/2};
  button.style.setProperty('--orb-scale',String(1+orbKick*.12+sendFlash*.16));
  if(progressElement)progressElement.style.transform=`scaleX(${(moveIndex+(phase==='air'?Math.min(1,jumpTime/airDuration):0))/premoves.groups[0].moves.length})`;
}
knight.position.copyFrom(worldCell(course.at(0)));updatePlatforms(0,true);fitBoardCamera();
function modal(content){el('modal').innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${content}</div>`;visible('modal',true);el('modal').querySelector('button')?.focus();}
function pause(){lastOrbTap=0;if(mode==='playing'){setMode('paused');audio.stop();modal('<div class="eyebrow">TAKE A BREATHER</div><h2 id="dialog-title">Still in the groove.</h2><p>Your run will be right here.</p><button class="primary" id="resume">Keep riding <span>↗</span></button><button class="secondary" id="restart">Start a fresh run</button>');el('resume').onclick=resume;el('restart').onclick=start;}else if(mode==='paused')resume();}
function resume(){lastOrbTap=0;visible('modal',false);setMode('playing');audio.start().catch(()=>{});el('world').focus();}
function help(){const previous=mode;if(mode==='playing'){setMode('paused');audio.stop();}
  modal('<div class="eyebrow">A KNIGHT TO REMEMBER</div><h2 id="dialog-title">Pair. Plan. Jump.</h2><div class="how-steps"><span class="number">1</span><p>Choose two directions: the first travels two squares, the second one square. ↑ then ← goes two up and one left. → then ↑ goes two right and one up. All eight chess knight moves work.</p></div><div class="how-steps"><span class="number">2</span><p>Compose one or several L moves in the orb. Press Space, or double tap the orb on your phone, to send them. Your knight carries out the pairs in order. The banner shows sent moves.</p></div><div class="how-steps"><span class="number">3</span><p>Land on bright raised squares. At a fork, choose an empty square or capture the gold piece for extra points. Read the board: icons show your plan, not the answer.</p></div><div class="how-steps"><span class="number">4</span><p>The board keeps scrolling. Stay ahead of the lower edge! Each level needs more landings and moves faster. Backspace recalls unstarted plans; Escape pauses. On mobile, swipe down on the board to recall.</p></div><button class="primary" id="close-help">Got it <span>↗</span></button>');el('close-help').onclick=()=>{visible('modal',false);if(previous==='playing')resume();};}
function finish(){
  setMode('over');jumpSparkles.emitRate=0;
  if(score>best){best=score;try{localStorage.setItem('knightwave-board-best',String(best));}catch{}el('best').textContent=String(best).padStart(5,'0');}
  modal(`<div class="eyebrow">KEEP YOUR NEXT MOVE IN MIND</div><h2 id="dialog-title">One more run?</h2><p>${lossReason==='scroll'?'The scrolling edge caught up. Send your next move a little sooner.':'Find a raised square for each knight move, then send your plan.'}</p><div class="dialog-stats"><div><strong>${score}</strong><small>YOUR SCORE</small></div><div><strong>${landings}</strong><small>LANDINGS · ${captures} CAPTURES</small></div></div><button class="primary" id="again">Ride again <span>↗</span></button>`);el('again').onclick=start;
}
function mute(){el('sound').textContent=audio.mute()?'♪̸':'♫';el('sound').setAttribute('aria-label',audio.muted?'Unmute soundtrack':'Mute soundtrack');el('sound').setAttribute('aria-pressed',String(audio.muted));}
el('start').onclick=start;el('sound').onclick=mute;el('pause').onclick=pause;el('help').onclick=help;
let lastOrbTap=0;
el('orb-send').addEventListener('pointerdown',event=>{
  event.preventDefault();const now=performance.now();
  if(event.pointerType==='mouse'){dispatch();return;}
  if(lastOrbTap&&now-lastOrbTap<350){lastOrbTap=0;dispatch();}else{lastOrbTap=now;orbKick=.35;}
});
el('orb-send').addEventListener('click',event=>{if(event.detail===0)dispatch();});
for(const direction of ['up','left','right','down'])el(direction).addEventListener('pointerdown',event=>{event.preventDefault();turn(direction);});
canvas.addEventListener('pointerdown',event=>{
  if(mode!=='playing'||gesture)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);gesture={id:event.pointerId,start:{x:event.clientX,y:event.clientY}};
});
canvas.addEventListener('pointerup',event=>{
  if(!gesture||gesture.id!==event.pointerId)return;const pending=gesture;gesture=null;
  if(verticalGesture(pending.start,{x:event.clientX,y:event.clientY})==='recall')recall();
});
canvas.addEventListener('pointercancel',()=>{gesture=null;});
window.addEventListener('keydown',event=>{
  if(event.key===' '&&event.target instanceof HTMLButtonElement&&!el('modal').classList.contains('hidden'))return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Escape','Backspace'].includes(event.key))event.preventDefault();
  if(event.repeat)return;
  const directions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  if(directions[event.key.length===1?event.key.toLowerCase():event.key])turn(directions[event.key.length===1?event.key.toLowerCase():event.key]);
  if(event.key===' '){if(['start','over'].includes(mode))start();else if(mode==='paused')resume();else dispatch();}
  if(event.key==='Backspace')recall();
  if(event.key==='Escape'){if(el('close-help')&&!el('modal').classList.contains('hidden'))el('close-help').click();else pause();}if(event.key==='m'||event.key==='M')mute();
});
// Trap modal focus so keyboard play and pause stay predictable.
el('modal').addEventListener('keydown',e=>{if(e.key==='Tab'){const buttons=[...el('modal').querySelectorAll('button')];if(buttons.length===1){e.preventDefault();buttons[0].focus();}else if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
window.addEventListener('resize',()=>{engine.setHardwareScalingLevel(1/Math.min(window.devicePixelRatio||1,2));engine.resize();fitBoardCamera();});
function burst(){for(const p of burstPieces){p.mesh.position.copyFrom(knight.position);p.mesh.position.y+=.2;p.velocity.set((rand()-.5)*6,rand()*5+2,(rand()-.5)*6);p.life=.6;p.mesh.setEnabled(true);}}
function update(dt){
  jumpSparkles.emitRate=mode==='playing'&&phase==='air'?180+spinJuice*100:0;
  if(mode==='playing'){
    runTime+=dt;phaseTime+=dt;spinJuice=Math.max(0,spinJuice-dt*4);tapKick*=Math.exp(-dt*14);
    const origin=course.at(current);
    if(phase==='settle'){
      knight.position.set(origin.x*CELL_SIZE,GROUND,origin.z*CELL_SIZE);
      spinner.rotation.set(0,FORWARD_YAW,-tapKick*.25);
      if(phaseTime>=LANDING_DWELL&&!beginJump()){phase='waiting';phaseTime=0;}
    }else if(phase==='waiting'){
      knight.position.set(origin.x*CELL_SIZE,GROUND+Math.sin(phaseTime*3)*.025,origin.z*CELL_SIZE);spinner.rotation.y=FORWARD_YAW;spinner.rotation.x=0;spinner.rotation.z=-tapKick*.25;if(premoves.groups.length)beginJump();
    }else if(phase==='air'){
      jumpTime+=dt;const t=Math.min(1,jumpTime/airDuration),pose=flightPose(selected,t),p=pose,airTrick=trickPose(premoves.groups[0]?.moves||selected,t);
      knight.position.x=(origin.x+p.x)*CELL_SIZE;knight.position.z=(origin.z+p.z)*CELL_SIZE;
      knight.position.y=GROUND+Math.sin(t*Math.PI)*4.8;
      spinner.rotation.y=FORWARD_YAW;trick.rotation.set(airTrick.pitch,airTrick.yaw,airTrick.roll);
      spinner.rotation.z=Math.sin(t*Math.PI)*.08*(Math.sign(knightDestination(selected).x)||1);spinner.rotation.x=Math.sin(t*Math.PI)*.12;
      if(t===1){
        knight.position.copyFrom(worldCell(chosenCell()));
        const destination=chosenCell(),hit=course.match(destination);
        if(hit){
          const before=progression(landings).level;
          lastLanding={x:knight.position.x,y:knight.position.y,z:knight.position.z};
          course.advance(hit);current++;landings++;combo++;if(hit.piece)captures++;
          score+=100+Math.min(combo,10)*10+(hit.bonus||0)*10;el('score').textContent=String(score).padStart(5,'0');
          if(hit.piece)captureReward(hit.bonus*10);
          moveIndex++;if(moveIndex>=premoves.groups[0].moves.length){premoves.complete();moveIndex=0;}
          burst();audio.land(hit.piece?combo+3:combo);selected=null;trick.rotation.set(0,0,0);spinner.rotation.set(0,FORWARD_YAW,0);updatePlatforms(0);
          if(progression(landings).level>before){audio.setLevel(progression(landings).level);levelTime=1.8;el('level-toast').textContent=`LEVEL ${String(progression(landings).level).padStart(2,'0')} / TEMPO UP`;visible('level-toast',true);audio.dispatch();}
          phase='settle';phaseTime=0;lastGuideKey='';updateGuides();
        }else{lossReason='miss';phase='fall';phaseTime=0;audio.fall();}
      }
    }else if(phase==='fall'){knight.position.y-=dt*(6+phaseTime*12);if(phaseTime>.70)finish();}
  }
  if(mode==='playing'||mode==='start'){
    updatePlatforms(dt);
    const squash=phase==='settle'?Math.max(0,1-phaseTime/.18)*.12:0;
    knight.scaling.set(1.38*(1+squash/2),1.38*(1-squash),1.38*(1+squash/2));
    const abovePlatform=platforms.some((p,i)=>{
      if(!p.root.isEnabled()||p.stage==='falling'||p.root.position.y<PLATFORM_TOP-.1)return false;
      const stop=p.stop;
      return Math.abs(knight.position.x-stop.x*CELL_SIZE)<1.85&&Math.abs(knight.position.z-stop.z*CELL_SIZE)<1.85;
    });
    const surface=abovePlatform?PLATFORM_TOP+.05:-2.015,altitude=Math.max(0,knight.position.y-surface);
    shadow.position.set(knight.position.x,surface,knight.position.z);shadow.scaling.setAll(1.38+altitude*.06);
    shadow.material.alpha=Math.max(.16,.44-altitude*.03);shadow.setEnabled(phase!=='fall');

    for(const p of burstPieces){if(p.life>0){p.life-=dt;p.mesh.position.addInPlace(p.velocity.scale(dt));p.velocity.y-=dt*12;p.mesh.scaling.setAll(Math.max(0,p.life/.6));if(p.life<=0)p.mesh.setEnabled(false);}}
  }
}
function captureReward(points){
  const label=document.createElement('span');label.className='capture-reward';label.textContent=`+${points}`;
  const p=Vector3.Project(knight.position.add(new Vector3(0,4,0)),Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(innerWidth,innerHeight));
  label.style.left=p.x+'px';label.style.top=p.y+'px';document.body.append(label);setTimeout(()=>label.remove(),900);
}
function checkScroll(dt){
  if(mode!=='playing')return;
  levelTime=Math.max(0,levelTime-dt);if(!levelTime)visible('level-toast',false);
  const p=Vector3.Project(new Vector3(knight.position.x,GROUND,knight.position.z),Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(innerWidth,innerHeight));
  const danger=p.y>arena.bottom-85,grace=runTime<SCROLL_GRACE;
  el('scroll-seam').classList.toggle('danger',danger&&!grace);
  el('scroll-status').textContent=grace?`SCROLL STARTS IN ${Math.ceil(SCROLL_GRACE-runTime)}`:danger?'KEEP AHEAD OF THE EDGE':'';
  if(!grace&&phase!=='fall'&&p.y>arena.bottom-25){lossReason='scroll';phase='fall';phaseTime=0;audio.fall();}
}
engine.runRenderLoop(()=>{const dt=Math.min(engine.getDeltaTime()/1000,.05);update(dt);if(mode==='playing')updateCourseView(dt);scene.updateTransformMatrix();checkScroll(dt);updateBoardLabels();updateOrb(mode==='playing'?dt:0);scene.render();});
scene.executeWhenReady(()=>{visible('loading',false);});
document.fonts.ready.then(fitBoardCamera);
const state=()=>({mode,phase,selected,draft:[...premoves.draft],draftHeading:0,locked:premoves.locked,moveIndex,orb:{...orbScreen,location:'ui'},options:course.options.map(p=>({...p})),target:course.options[0]?.move,jump:landings+1,score,combo,captures,landings,lastLanding,runTime,lossReason,progression:progression(landings),scrollSpeed,position:{x:knight.position.x,y:knight.position.y,z:knight.position.z},airtime:jumpTime/airDuration,audio:{state:audio.ctx?.state,muted:audio.muted,track:audio.track.file,speed:audio.track.speed,time:audio.music.currentTime,playing:!audio.music.paused},fps:Math.round(engine.getFps()),meshes:scene.meshes.length,cellSize:CELL_SIZE,board:{endless:true,cols:GRID_COLS,rows:GRID_ROWS,firstRow,retainedStops:course.stops.length},arena:{...arena},heading:0,launch:{x:course.at(current).x*CELL_SIZE,z:course.at(current).z*CELL_SIZE},landing:{x:chosenCell().x*CELL_SIZE,z:chosenCell().z*CELL_SIZE},render:{width:engine.getRenderWidth(),height:engine.getRenderHeight()},platforms:platforms.filter(p=>p.index!==null).map(p=>({id:p.index,stage:p.stage,piece:p.stop.piece,bonus:p.stop.bonus,height:p.root.position.y,visible:p.root.isEnabled(),x:p.stop.x*CELL_SIZE,z:p.stop.z*CELL_SIZE})),landingDwell:LANDING_DWELL,moveQueue:premoves.groups.map(g=>({...g})),camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,rotation:{x:camera.rotation.x,y:camera.rotation.y,z:camera.rotation.z},orthographic:camera.mode===Camera.ORTHOGRAPHIC_CAMERA},knightYaw:spinner.rotation.y,trick:{yaw:trick.rotation.y,roll:trick.rotation.z,pitch:trick.rotation.x},platformTop:PLATFORM_TOP,glow:glow.intensity,sparkles:jumpSparkles.getActiveCount()});
// Observability for playtesting; actions are the same as keyboard and touch.
window.knightwave={state,start,turn,dispatch,recall,pause,resume,mute,engine,scene};
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  for(const tool of [{name:'get_knightwave_state',description:'Read score, ordered combos, capture options, level, scrolling speed and jump phase.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:state},{name:'compose_knight_move',description:'Add a direction to an ordered two-direction knight combo in the premove orb. Uses the same action as the on-screen controls.',inputSchema:{type:'object',properties:{direction:{enum:['up','down','left','right']}},required:['direction'],additionalProperties:false},execute:input=>{if(!input||!['up','down','left','right'].includes(input.direction))throw new Error('Direction must be up, down, left or right');if(mode!=='playing')throw new Error('Start a run before composing');turn(input.direction);return state();}}]){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
