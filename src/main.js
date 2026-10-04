import './style.css';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { knightDestination, isLandingMatch, flightPoint, flightHeading, rotateGrid } from './rules.js';
import { BOARD_RADIUS, CELL_SIZE, createCircuit, circuitPath, isOnBoard } from './board.js';
import { Soundtrack } from './audio.js';

const asset=name=>`${import.meta.env.BASE_URL}${name}`;
const app=document.querySelector('#app');
app.innerHTML=`<canvas id="world" aria-label="Knightwave isometric chess circuit"></canvas>
<div id="ui" class="start-mode">
  <header class="topbar"><div class="brand"><img class="brand-icon" src="${asset('knight-mark.svg')}" alt="" width="35" height="35"><div class="brand-name">knightwave<small>AN ARCADE DAYDREAM</small></div></div><div class="stats"><div class="stat"><small>SCORE</small><strong id="score">00000</strong></div><div class="stat"><small>BEST</small><strong id="best">00000</strong></div></div><div class="utility"><button class="icon-button" id="sound" aria-label="Mute soundtrack" title="Sound on/off (M)">♫</button><button class="icon-button hidden" id="pause" aria-label="Pause game" title="Pause (Esc)">Ⅱ</button><button class="icon-button" id="help" aria-label="How to play" title="How to play">?</button></div></header>
  <section class="center-card" id="start-screen"><div class="eyebrow">CHESS MOVES. COSMIC GROOVES.</div><h1>Ride the<span>knightwave.</span></h1><p class="intro">A little chess. A little foresight.<br>Plan your jumps. Follow the glow.<br>Bring your knight back home.</p><button class="primary" id="start">Let’s ride <span>↗</span></button><div class="start-caption">SOUND ON. SHOULDERS DOWN. CHASE THE GLOW.</div></section>
  <div class="run-label hidden" id="run-label">THE CIRCUIT <span> / </span> <span id="jump-label">JUMP 01</span></div>
  <div class="flash" id="flash"></div>
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
scene.clearColor=new Color4(.028,.014,.07,1);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogColor=new Color3(.08,.025,.16);scene.fogDensity=0;
const camera=new FreeCamera('fixed isometric board',new Vector3(-48,58,-48),scene);camera.minZ=.1;camera.maxZ=1200;camera.mode=Camera.ORTHOGRAPHIC_CAMERA;camera.setTarget(Vector3.Zero());
const hemi=new HemisphericLight('soft light',new Vector3(-.4,1,-.4),scene);hemi.intensity=.65;hemi.diffuse=new Color3(.76,.83,1);hemi.groundColor=new Color3(.25,.08,.43);
const rim=new PointLight('mint rim',new Vector3(0,8,-4),scene);rim.diffuse=new Color3(.3,1,.83);rim.intensity=.45;rim.range=38;
const glow=new GlowLayer('neon',scene,{mainTextureRatio:.4,blurKernelSize:32});glow.intensity=.65;
function material(name,hex,emission=0){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.emissiveColor=m.diffuseColor.scale(emission);m.specularColor=new Color3(.06,.06,.09);return m;}
const palette=['#ff72c1','#bf7bff','#8c83ff','#70bdff','#75efee','#a8f9c2','#f8e99c'];
const roadMats=palette.map((c,i)=>material('rainbow '+i,c,.25));
const mint=material('mint neon','#8dffe1',1.6),pink=material('pink neon','#fd8bdf',1.5),gold=material('landing gold','#ffb642',.65),white=material('porcelain','#e9fff5',.22),purple=material('mane','#583680',.3);

// Dedicated sky artwork stays behind the 3D course and planets.
const sky=MeshBuilder.CreateSphere('world sky',{diameter:1800,segments:32,sideOrientation:Mesh.BACKSIDE},scene);
const skyMat=new StandardMaterial('cosmic sky',scene);skyMat.disableLighting=true;skyMat.emissiveTexture=new Texture(asset('cosmic-sky.png'),scene);skyMat.emissiveColor=Color3.Black();skyMat.emissiveTexture.level=.25;skyMat.emissiveTexture.wrapU=Texture.MIRROR_ADDRESSMODE;skyMat.emissiveTexture.uScale=4;skyMat.emissiveTexture.wrapV=Texture.MIRROR_ADDRESSMODE;skyMat.emissiveTexture.vScale=3;skyMat.diffuseColor=Color3.Black();sky.material=skyMat;sky.infiniteDistance=true;sky.applyFog=false;sky.isPickable=false;glow.addExcludedMesh(sky);
let seed=512;
function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const planet=MeshBuilder.CreateSphere('lavender planet',{diameter:60,segments:32},scene);planet.material=material('planet','#604292',.4);planet.position.set(-92,52,300);
const planetRing=MeshBuilder.CreateTorus('saturn ring',{diameter:92,thickness:.65,tessellation:100},scene);planetRing.material=material('planet ring','#b996ee',1.3);planetRing.position.copyFrom(planet.position);planetRing.rotation.set(.28,0,-.3);
const moon=MeshBuilder.CreateSphere('mint moon',{diameter:19,segments:24},scene);moon.position.set(110,57,350);moon.material=material('moon','#aff7df',1);
const halo=MeshBuilder.CreateTorus('moon halo',{diameter:28,thickness:.28,tessellation:80},scene);halo.material=mint;halo.position.copyFrom(moon.position);halo.rotation.x=Math.PI/2;
const scenery=new TransformNode('cosmos',scene);planet.parent=planetRing.parent=moon.parent=halo.parent=scenery;
function box(name,w,h,d,x,y,z,mat,parent){const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.material=mat;if(parent)m.parent=parent;return m;}

// A slender porcelain chess knight, sculpted for every travel direction.
const knight=new TransformNode('knight',scene),spinner=new TransformNode('spin',scene);spinner.parent=knight;
const FORWARD_YAW=Math.PI/2;
// Sculpted elliptical sections give the horse a readable neck, muzzle and
// paired ears from the rear camera as well as from the side during a turn.
function sculpt(name,sections,axis){
  const sides=32,positions=[],indices=[];
  for(const [along,cx,cy,rx,ry] of sections)for(let i=0;i<sides;i++){
    const angle=i/sides*Math.PI*2;
    if(axis==='vertical')positions.push(cx+Math.cos(angle)*rx,along,cy+Math.sin(angle)*ry);
    else positions.push(along,cx+Math.cos(angle)*rx,cy+Math.sin(angle)*ry);
  }
  for(let row=0;row<sections.length-1;row++)for(let i=0;i<sides;i++){
    const a=row*sides+i,b=row*sides+(i+1)%sides,c=a+sides,d=b+sides;
    indices.push(a,b,c,b,d,c);
  }
  for(const row of [0,sections.length-1])for(let i=1;i<sides-1;i++){
    if(row===0)indices.push(row*sides,row*sides+i+1,row*sides+i);
    else indices.push(row*sides,row*sides+i,row*sides+i+1);
  }
  const normals=[];VertexData.ComputeNormals(positions,indices,normals);
  const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;
  const mesh=new Mesh(name,scene);data.applyToMesh(mesh);mesh.material=white;mesh.parent=spinner;return mesh;
}
const neckSections=[[.65,0,0,.53,.48],[.9,.02,0,.50,.43],[1.25,.08,0,.43,.34],[1.65,.08,0,.36,.29],[2.0,-.03,0,.33,.31],[2.3,-.20,0,.30,.36],[2.55,-.25,0,.27,.37],[2.8,-.22,0,.23,.30],[2.96,-.22,0,.16,.22]];
sculpt('carved chess knight neck',neckSections,'vertical');
sculpt('sculpted horse muzzle',[[.15,2.78,0,.23,.28],[-.08,2.82,0,.36,.40],[-.38,2.73,0,.30,.38],[-.68,2.55,0,.22,.32],[-1.0,2.43,0,.17,.28],[-1.10,2.43,0,.12,.21]],'horizontal');
const manePath=neckSections.slice(1).map(([y,x,z,rx])=>new Vector3(x+rx-.015,y,z));
const mane=MeshBuilder.CreateTube('carved purple mane',{path:manePath,radius:.085,tessellation:12},scene);mane.material=purple;mane.parent=spinner;
for(const side of [-1,1]){
  const ear=MeshBuilder.CreateCylinder('pointed horse ear',{height:.48,diameterBottom:.27,diameterTop:.035,tessellation:12},scene);ear.parent=spinner;ear.material=white;ear.position.set(-.12,3.17,side*.25);ear.rotation.z=.18;ear.rotation.x=side*.16;
  const eye=MeshBuilder.CreateSphere('onyx eye',{diameter:.12,segments:16},scene);eye.parent=spinner;eye.material=purple;eye.scaling.z=.4;eye.position.set(-.4,2.83,side*.365);
  const nostril=MeshBuilder.CreateSphere('carved nostril',{diameter:.065,segments:12},scene);nostril.parent=spinner;nostril.material=purple;nostril.scaling.z=.4;nostril.position.set(-1.0,2.48,side*.27);
}
// Turned, stepped pedestal and collars make the silhouette unmistakably chess.
const profile=[[0,0],[1.02,0],[1.06,.10],[1.02,.18],[.86,.21],[.86,.30],[.68,.37],[.61,.48],[.62,.55],[.77,.57],[.77,.66],[.57,.71],[0,.71]].map(([r,y])=>new Vector3(r,y,0));
const base=MeshBuilder.CreateLathe('turned chess pedestal',{shape:profile,tessellation:64,cap:Mesh.CAP_ALL},scene);base.parent=spinner;base.material=white;
for(const [diameter,y] of [[2.05,.12],[1.55,.61]]){const ring=MeshBuilder.CreateTorus('pedestal inlay',{diameter,thickness:.055,tessellation:64},scene);ring.parent=spinner;ring.position.y=y;ring.material=purple;}
const baseRing=MeshBuilder.CreateTorus('plinth glow',{diameter:2.02,thickness:.045,tessellation:64},scene);baseRing.parent=spinner;baseRing.position.y=.035;baseRing.material=mint;
spinner.rotation.y=FORWARD_YAW;knight.scaling.setAll(1.55);
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
const circuit=createCircuit();
let mode='start',phase='ready',current=0,selected=0,jumpTime=0,phaseTime=0,runTime=0,score=0,combo=0,landings=0,visualSpin=0,spinJuice=0,flash=0,airDuration=1.25,tapKick=0,pathRoot=null,lastGuideKey='';
const READY_TIME=2.25,GROUND=.06;
let best=0;try{best=Number(localStorage.getItem('knightwave-board-best')||0);}catch{}
el('best').textContent=String(best).padStart(5,'0');
const board=new TransformNode('finite chessboard',scene),boardWidth=(BOARD_RADIUS*2+1)*CELL_SIZE;
const frame=material('board frame','#211933',.14);
box('floating board',boardWidth+1.2,.65,boardWidth+1.2,0,-.43,0,frame,board);
const cells=[];
for(let z=-BOARD_RADIUS;z<=BOARD_RADIUS;z++){
  const hue=Color3.FromHexString(palette[(z+BOARD_RADIUS)%palette.length]);
  const light=material('light square '+z,'#332a4b',.12),darkTile=material('dark square '+z,'#211c34',.10);
  light.diffuseColor=Color3.Lerp(light.diffuseColor,hue,.18);darkTile.diffuseColor=Color3.Lerp(darkTile.diffuseColor,hue,.10);
  for(let x=-BOARD_RADIUS;x<=BOARD_RADIUS;x++){
    const tile=box('board square',CELL_SIZE-.09,.17,CELL_SIZE-.09,x*CELL_SIZE,-.085,z*CELL_SIZE,(x+z)%2?light:darkTile,board);
    tile.metadata={x,z};cells.push(tile);
    box('rainbow tile edge',CELL_SIZE-.20,.012,.035,x*CELL_SIZE,.014,z*CELL_SIZE+CELL_SIZE*.45,roadMats[(z+BOARD_RADIUS)%7],board);
  }
}
for(const side of [-1,1]){
  box('rainbow board rail',boardWidth+.6,.06,.055,0,.07,side*(boardWidth/2+.28),side<0?pink:mint,board);
  box('rainbow board rail',.055,.06,boardWidth+.6,side*(boardWidth/2+.28),.07,0,side<0?pink:mint,board);
}
for(const x of [-1,1])for(const z of [-1,1]){
  const stud=MeshBuilder.CreateSphere('board corner jewel',{diameter:.32,segments:12},scene);stud.position.set(x*(boardWidth/2+.28),.12,z*(boardWidth/2+.28));stud.material=mint;stud.parent=board;
}
const routeLines=[];
for(let i=1;i<circuit.length;i++)routeLines.push(circuitPath(circuit[i-1],circuit[i].turns).map(p=>new Vector3(p.x*CELL_SIZE,.028,p.z*CELL_SIZE)));
const route=MeshBuilder.CreateLineSystem('complete circuit route',{lines:routeLines},scene);route.color=Color3.FromHexString('#b49bd8');route.alpha=.35;route.parent=board;
const markers=circuit.slice(1).map((stop,i)=>{
  const root=new TransformNode('landing '+(i+1),scene);root.position.set(stop.x*CELL_SIZE,0,stop.z*CELL_SIZE);root.parent=board;
  const pad=MeshBuilder.CreateCylinder('landing tile',{diameter:3.1,height:.035,tessellation:48},scene);pad.position.y=.04;pad.material=material('landing surface '+i,'#8b7bba',.10);pad.material.alpha=.18;pad.parent=root;
  const ring=MeshBuilder.CreateTorus('landing ring',{diameter:2.95,thickness:.055,tessellation:48},scene);ring.position.y=.09;ring.material=gold;ring.parent=root;
  const crystal=MeshBuilder.CreatePolyhedron('landing crystal',{type:1,size:.30},scene);crystal.position.y=.85;crystal.material=gold;crystal.parent=root;
  return {root,pad,ring,crystal};
});
const landingPreview=MeshBuilder.CreateTorus('your landing preview',{diameter:2.4,thickness:.075,tessellation:48},scene);landingPreview.material=mint;landingPreview.setEnabled(false);
const launchRing=MeshBuilder.CreateTorus('takeoff countdown',{diameter:3.2,thickness:.045,tessellation:48},scene);launchRing.material=mint;launchRing.position.y=.08;launchRing.setEnabled(false);
const visitedMaterial=material('completed landing','#75efde',.20),missMaterial=material('missed landing','#ff7fa8',.5);
function worldCell(cell){return new Vector3(cell.x*CELL_SIZE,GROUND,cell.z*CELL_SIZE);}
function fitBoardCamera(){
  const width=window.innerWidth,height=window.innerHeight,aspect=width/height,narrow=width<700;
  const intro=mode==='start';
  const projectedWidth=(boardWidth+2)*Math.SQRT2,projectedHeight=projectedWidth*.65+8;
  const availableWidth=intro&&!narrow?.51:.91,availableHeight=height<550?.60:.67;
  const halfWidth=Math.max(projectedWidth/availableWidth,projectedHeight/availableHeight*aspect)/2;
  const halfHeight=halfWidth/aspect;
  const centerX=intro&&!narrow?.72:.5,centerY=intro&&narrow?.74:height<550?.59:.55;
  const offsetX=(.5-centerX)*2*halfWidth,offsetY=(centerY-.5)*2*halfHeight;
  camera.orthoLeft=-halfWidth+offsetX;camera.orthoRight=halfWidth+offsetX;
  camera.orthoTop=halfHeight+offsetY;camera.orthoBottom=-halfHeight+offsetY;
}
function visible(id,on){el(id).classList.toggle('hidden',!on);}
function setMode(next){mode=next;el('ui').className=mode==='start'?'start-mode':'playing-mode';visible('start-screen',mode==='start');visible('pause',mode==='playing'||mode==='paused');visible('run-label',mode!=='start');visible('touch-controls',mode==='playing');}
function updateMarkers(){
  for(let i=0;i<markers.length;i++){
    const m=markers[i],completed=i<current,active=i===current;
    m.root.setEnabled(i!==markers.length-1||current>=3);
    m.ring.material=completed?visitedMaterial:active?gold:i===current+1?mint:purple;
    m.ring.visibility=completed?.55:active?1:i===current+1?.65:.28;
    m.pad.material.alpha=active?.36:completed?.16:.08;
    m.crystal.setEnabled(!completed);m.crystal.material=active?gold:i===current+1?mint:purple;
    m.crystal.scaling.setAll(active?1.35:.65);
  }
}
function start(){
  current=0;selected=0;score=0;combo=0;landings=0;runTime=0;jumpTime=0;phaseTime=0;phase='ready';visualSpin=0;
  spinner.rotation.set(0,FORWARD_YAW,0);tapKick=0;jumpSparkles.reset();jumpSparkles.start();airDuration=1.25;knight.position.copyFrom(worldCell(circuit[0]));
  el('score').textContent='00000';visible('modal',false);setMode('playing');audio.start().catch(()=>{});lastGuideKey='';updateGuides();updateMarkers();fitBoardCamera();
}
function chosenCell(){
  const origin=circuit[current],offset=rotateGrid(selected===0?{x:0,z:2}:knightDestination(selected),origin.heading);
  return {x:origin.x+offset.x,z:origin.z+offset.z};
}
function updateGuides(){
  if(mode!=='playing')return;
  el('jump-label').textContent='LANDING '+String(Math.min(landings+1,6)).padStart(2,'0')+' / 06';
  const key=current+':'+selected;if(key===lastGuideKey)return;lastGuideKey=key;
  pathRoot?.dispose(false,false);pathRoot=new TransformNode('selected L route',scene);
  const origin=circuit[current];
  const points=selected===0?[origin,{x:origin.x+Math.sin(origin.heading)*2,z:origin.z+Math.cos(origin.heading)*2}]:circuitPath(origin,selected);
  const line=MeshBuilder.CreateTube('selected knight trace',{path:points.map(p=>new Vector3(p.x*CELL_SIZE,.07,p.z*CELL_SIZE)),radius:.045,tessellation:8},scene);line.material=mint;line.parent=pathRoot;
  for(const p of points){const dot=MeshBuilder.CreateTorus('L corner',{diameter:.35,thickness:.04,tessellation:24},scene);dot.position.set(p.x*CELL_SIZE,.075,p.z*CELL_SIZE);dot.material=mint;dot.parent=pathRoot;}
  landingPreview.position.copyFrom(worldCell(chosenCell()));landingPreview.position.y=.10;landingPreview.material=isOnBoard(chosenCell())?mint:missMaterial;landingPreview.setEnabled(true);
}
function turn(dir){
  if(mode!=='playing'||!['ready','air'].includes(phase))return;
  selected+=dir;spinJuice=1;tapKick=dir*.32;
  if(phase==='air'){visualSpin+=dir*.80;spinner.rotation.y=FORWARD_YAW+circuit[current].heading+visualSpin;}
  else{spinner.rotation.y=FORWARD_YAW+circuit[current].heading+tapKick;spinner.rotation.z=-dir*.12;}
  audio.spin(selected);updateGuides();
  const button=el(dir<0?'left':'right');button.classList.add('pressed');setTimeout(()=>button.classList.remove('pressed'),90);
}
knight.position.copyFrom(worldCell(circuit[0]));updateMarkers();fitBoardCamera();
function modal(content){el('modal').innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${content}</div>`;visible('modal',true);el('modal').querySelector('button')?.focus();}
function pause(){if(mode==='playing'){setMode('paused');audio.stop();modal('<div class="eyebrow">TAKE A BREATHER</div><h2 id="dialog-title">Still in the groove.</h2><p>Your circuit will be right here.</p><button class="primary" id="resume">Keep riding <span>↗</span></button><button class="secondary" id="restart">Start a fresh run</button>');el('resume').onclick=resume;el('restart').onclick=start;}else if(mode==='paused')resume();}
function resume(){visible('modal',false);setMode('playing');audio.start().catch(()=>{});el('world').focus();}
function help(){const previous=mode;if(mode==='playing'){setMode('paused');audio.stop();}
  modal('<div class="eyebrow">A KNIGHT TO REMEMBER</div><h2 id="dialog-title">Plan the whole loop.</h2><div class="how-steps"><span class="number">1</span><p>The whole board stays in view. Reach the gold landing, then follow the next glowing tiles back home.</p></div><div class="how-steps"><span class="number">2</span><p>Jumps launch automatically after a short planning beat. Tap ← or → to choose your next move. On your phone, tap the left or right half of the play area.</p></div><div class="how-steps"><span class="number">3</span><p>Each tap chains a rotated L: two squares forward, one across. The mint route and ring preview your jump. Four taps make a loop.</p></div><div class="how-steps"><span class="number">4</span><p>You can keep tapping in midair. An opposite tap undoes a turn. The mint marker shows your landing.</p></div><button class="primary" id="close-help">Got it <span>↗</span></button>');el('close-help').onclick=()=>{visible('modal',false);if(previous==='playing')resume();};}
function finish(won=false){
  setMode(won?'won':'over');jumpSparkles.emitRate=0;landingPreview.setEnabled(false);launchRing.setEnabled(false);pathRoot?.setEnabled(false);
  if(score>best){best=score;try{localStorage.setItem('knightwave-board-best',String(best));}catch{}el('best').textContent=String(best).padStart(5,'0');}
  modal(`<div class="eyebrow">${won?'A PERFECT LITTLE LOOP':'THE BOARD WILL WAIT'}</div><h2 id="dialog-title">${won?'Circuit complete.':'One more circuit?'}</h2><p>${won?'Six landings, all the way home. You found your flow.':'Follow the gold tile. Use the mint L to plan your landing, and correct your turn before touchdown.'}</p><div class="dialog-stats"><div><strong>${score}</strong><small>YOUR SCORE</small></div><div><strong>${landings} / 6</strong><small>LANDINGS</small></div></div><button class="primary" id="again">Ride again <span>↗</span></button>`);el('again').onclick=start;
}
el('start').onclick=start;el('help').onclick=help;el('pause').onclick=pause;
function mute(){el('sound').textContent=audio.mute()?'♪̸':'♫';el('sound').setAttribute('aria-label',audio.muted?'Unmute soundtrack':'Mute soundtrack');el('sound').setAttribute('aria-pressed',String(audio.muted));}
el('sound').onclick=mute;
for(const [id,d] of [['left',-1],['right',1]])el(id).addEventListener('pointerdown',e=>{e.preventDefault();turn(d);});
canvas.addEventListener('pointerdown',e=>{if(mode==='playing'){e.preventDefault();turn(e.clientX<window.innerWidth/2?-1:1);}});
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLButtonElement&&e.code==='Space')return;if(['ArrowLeft','ArrowRight','Space','Escape','KeyA','KeyD'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='ArrowLeft'||e.code==='KeyA')turn(-1);if(e.code==='ArrowRight'||e.code==='KeyD')turn(1);if(e.code==='KeyM')mute();if(e.code==='Escape'){if(mode==='playing'||mode==='paused'){if(!el('close-help'))pause();else el('close-help').click();}}if(e.code==='Space'){if(mode==='start'||mode==='over'||mode==='won')start();else pause();}});
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
    if(phase==='ready'){
      knight.position.y=GROUND;spinner.rotation.y=FORWARD_YAW+origin.heading+tapKick;spinner.rotation.z=-tapKick*.25;spinner.rotation.x=0;
      launchRing.setEnabled(true);launchRing.position.copyFrom(knight.position);launchRing.position.y=.09;launchRing.scaling.setAll(.65+.45*(1-Math.min(1,phaseTime/READY_TIME)));
      if(phaseTime>=READY_TIME){phase='air';jumpTime=0;airDuration=1.25+.30*(Math.abs(circuit[current+1].turns)-1);phaseTime=0;visualSpin=0;burst();launchRing.setEnabled(false);}
    }else if(phase==='air'){
      jumpTime+=dt;const t=Math.min(1,jumpTime/airDuration),p=rotateGrid(flightPoint(selected,t),origin.heading);
      knight.position.x=(origin.x+p.x)*CELL_SIZE;knight.position.z=(origin.z+p.z)*CELL_SIZE;
      knight.position.y=GROUND+Math.sin(t*Math.PI)*3.0;
      visualSpin+=wrapAngle(flightHeading(selected,t)-visualSpin)*(1-Math.exp(-dt*24));spinner.rotation.y=FORWARD_YAW+origin.heading+visualSpin;
      spinner.rotation.z=Math.sin(t*Math.PI)*.08*Math.sign(selected);spinner.rotation.x=Math.sin(t*Math.PI)*.12;
      if(t===1){
        knight.position.copyFrom(worldCell(chosenCell()));
        if(isLandingMatch(selected,circuit[current+1].turns)){
          current++;landings++;combo++;score+=100+combo*25+Math.abs(selected)*10;el('score').textContent=String(score).padStart(5,'0');
          burst();flash=1;audio.land(combo);selected=0;visualSpin=0;spinner.rotation.set(0,FORWARD_YAW+circuit[current].heading,0);updateMarkers();
          if(current===circuit.length-1){finish(true);}
          else{phase='ready';phaseTime=0;lastGuideKey='';updateGuides();}
        }else{phase=isOnBoard(chosenCell())?'miss':'fall';phaseTime=0;audio.fall();landingPreview.material=missMaterial;pathRoot?.setEnabled(false);}
      }
    }else if(phase==='miss'){spinner.rotation.z*=Math.exp(-dt*8);if(phaseTime>.65)finish();}
    else if(phase==='fall'){knight.position.y-=dt*(6+phaseTime*12);if(phaseTime>.70)finish();}
  }
  if(mode==='playing'||mode==='start'){
    glow.intensity=.43+audio.pulse*.10;
    shadow.position.set(knight.position.x,.012,knight.position.z);shadow.scaling.setAll(Math.max(.6,1.55-(knight.position.y-GROUND)*.10));shadow.setEnabled(isOnBoard({x:knight.position.x/CELL_SIZE,z:knight.position.z/CELL_SIZE}));
    for(let i=0;i<markers.length;i++){const m=markers[i];m.crystal.rotation.y+=dt*.65;m.crystal.position.y=.85+Math.sin(runTime*2+i)*.12;m.ring.scaling.setAll(i===current?1+Math.sin(runTime*3)*.04:1);}
    for(const p of burstPieces){if(p.life>0){p.life-=dt;p.mesh.position.addInPlace(p.velocity.scale(dt));p.velocity.y-=dt*12;p.mesh.scaling.setAll(Math.max(0,p.life/.6));if(p.life<=0)p.mesh.setEnabled(false);}}
    flash=Math.max(0,flash-dt*3.5);el('flash').style.opacity=flash*.35;
  }
}
engine.runRenderLoop(()=>{update(Math.min(engine.getDeltaTime()/1000,.05));scene.render();});
scene.executeWhenReady(()=>{visible('loading',false);});
const state=()=>({mode,phase,selected,target:circuit[current+1]?.turns,jump:landings+1,score,combo,landings,totalLandings:circuit.length-1,position:{x:knight.position.x,y:knight.position.y,z:knight.position.z},planning:Math.min(1,phaseTime/READY_TIME),airtime:jumpTime/airDuration,audio:{state:audio.ctx?.state,muted:audio.muted,steps:audio.step},fps:Math.round(engine.getFps()),meshes:scene.meshes.length,cellSize:CELL_SIZE,board:{radius:BOARD_RADIUS,cells:cells.length,extent:boardWidth/2},heading:circuit[current]?.heading,landingHeading:circuit[current+1]?.heading,launch:{x:circuit[current].x*CELL_SIZE,z:circuit[current].z*CELL_SIZE},landing:circuit[current+1]?{x:circuit[current+1].x*CELL_SIZE,z:circuit[current+1].z*CELL_SIZE}:null,render:{width:engine.getRenderWidth(),height:engine.getRenderHeight()},camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,rotation:{x:camera.rotation.x,y:camera.rotation.y,z:camera.rotation.z},orthographic:camera.mode===Camera.ORTHOGRAPHIC_CAMERA},knightYaw:spinner.rotation.y,sparkles:jumpSparkles.getActiveCount()});
// Observability for playtesting; actions are the same as keyboard and touch.
window.knightwave={state,start,turn,pause,resume,mute,engine,scene};
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  for(const tool of [{name:'get_knightwave_state',description:'Read current score, jump phase, selected turns and next landing.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:state},{name:'rotate_knight',description:'Add one left or right quarter-turn to the current jump. Uses the same action as the on-screen controls.',inputSchema:{type:'object',properties:{direction:{enum:['left','right']}},required:['direction'],additionalProperties:false},execute:input=>{if(!input||!['left','right'].includes(input.direction))throw new Error('Direction must be left or right');if(mode!=='playing')throw new Error('Start a run before rotating');turn(input.direction==='right'?1:-1);return state();}}]){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
