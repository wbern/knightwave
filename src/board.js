import {progression} from './progression.js';
import {knightDestination} from './rules.js';
export const BOARD_MIN=-4,BOARD_MAX=3,BOARD_CELLS=8,BOARD_CENTER=-.5,CELL_SIZE=4;
export const GRID_COLS=8,GRID_ROWS=24;
const directions=['up','right','down','left'];
const knightMoves=directions.flatMap((first,i)=>[-1,1].map(side=>({first,second:directions[(i+side+4)%4]})));
const pieces=[{piece:'pawn',bonus:15},{piece:'bishop',bonus:30},{piece:'rook',bonus:40}];

function hash(seed,x,z,index){
 let value=(seed^Math.imul(x,73856093)^Math.imul(z,19349663)^Math.imul(index,83492791))>>>0;
 value=Math.imul(value^(value>>>16),2246822507)>>>0;
 return (value^(value>>>13))>>>0;
}
function sameCell(a,b){return a.x===b.x&&a.z===b.z;}

// Only the last landings and the next fork are retained. Previewing a queued
// branch never consumes random state, so the visible choice remains stable.
export class EndlessCourse{
 constructor(seed=512){this.seed=seed;this.reset();}
 reset(){this.history=[{id:'start',index:0,x:-1,z:0,heading:0,move:null,piece:null,bonus:0}];return this.current;}
 get current(){return this.history.at(-1);}
 get options(){return this.previewOptions(this.current);}
 get stops(){return this.platforms;}
 get platforms(){
  const result=[];
  for(const platform of [...this.history,...this.options]){
   const old=result.findIndex(p=>sameCell(p,platform));
   if(old>=0)result.splice(old,1);
   result.push(platform);
  }
  return result;
 }
 previewOptions(origin,index=origin.index??0){
  const random=hash(this.seed,origin.x,origin.z,index);
  const candidates=knightMoves.map(move=>{
   const delta=knightDestination(move);
   return {move,x:origin.x+delta.x,z:origin.z+delta.z,delta};
  }).filter(p=>p.x>=BOARD_MIN&&p.x<=BOARD_MAX);
  const forward=candidates.filter(p=>p.delta.z>0);
  const longForward=forward.filter(p=>p.delta.z===2);
  const level=progression(index),finalLanding=level.progress===level.total-1;
  const shortForward=forward.filter(p=>p.delta.z===1);
  const bendChance=Math.min(.8,(level.level-1)*.1);
  let safePool=shortForward.length&&random%100<bendChance*100?shortForward:longForward;
  if(!safePool.length)safePool=forward;
  const previousSide=origin.move?Math.sign(knightDestination(origin.move).x):0;
  const desiredSide=level.level>=4&&((random>>>8)%100)<75?-previousSide:previousSide;
  const continuing=safePool.filter(p=>Math.sign(p.delta.x)===desiredSide);
  if(continuing.length)safePool=continuing;
  const safe=safePool[random%safePool.length];
  const occupied=index%3===2;
  // Early forks are gentle forward staircases. Later capture detours and
  // tighter zigzags add difficulty while the main route always leads upward.
  const detours=candidates.filter(p=>p!==safe&&p.delta.z<=1);
  const simpleAlternatives=longForward.filter(p=>p!==safe);
  const otherPool=occupied&&level.level>=4&&index%2===0&&!finalLanding?detours:level.level===1&&simpleAlternatives.length?simpleAlternatives:forward.filter(p=>p!==safe);
  const other=otherPool[random%otherPool.length];
  const reward=pieces[Math.floor(index/3)%pieces.length];
  return [safe,other].map((p,i)=>({
   id:`${index+1}:${p.x}:${p.z}`,index:index+1,x:p.x,z:p.z,heading:0,move:p.move,
   piece:occupied&&i===1?reward.piece:null,bonus:occupied&&i===1?reward.bonus:0,
  }));
 }
 at(index){
  const stop=this.history.find(p=>p.index===index)||this.options.find(p=>p.index===index);
  if(!stop)throw new Error('Course stop is outside the active fork');
  return stop;
 }
 match(cell,origin=this.current,index=origin.index??0){
  return this.previewOptions(origin,index).find(p=>sameCell(p,cell));
 }
 advance(chosen){
  const cell=typeof chosen==='string'?this.platforms.find(p=>p.id===chosen):chosen;
  const landing=cell&&this.match(cell);
  if(!landing)throw new Error('Landing must be a reachable raised platform');
  const stop={...landing,index:this.current.index+1,piece:null,bonus:0};
  this.history.push(stop);this.maintain();return stop;
 }
 maintain(){this.history=this.history.slice(-3);}
}
