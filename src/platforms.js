export const PLATFORM_TOP=-1.1;
import {knightDestination} from './rules.js';
import {progression} from './progression.js';
export const LANDING_DWELL=.12;
export const PLATFORM_RISE_SECONDS=.35;
// Keep a readable four-hop route available before the player starts composing.
export function previewDepth(){return 4;}
export function previewPlatforms(course,moves=[],depth=4){
 const choose=(options,origin,move)=>{
  if(!move)return options[0];
  const delta=knightDestination(move);return options.find(p=>p.x===origin.x+delta.x&&p.z===origin.z+delta.z);
 };
 const first=choose(course.options,course.current,moves[0]);
 const result=course.stops.map(p=>({...p,route:p.id===course.current.id||p.id===first?.id,origin:p.index===course.current.index+1?{x:course.current.x,z:course.current.z}:null}));
 const level=progression(course.current.index).level;let at=course.current;
 for(let step=1;step<depth;step++){
  const next=choose(course.previewOptions(at,at.index),at,moves[step-1]);
  if(!next||progression(next.index).level!==level)break;
  at=next;
  const options=course.previewOptions(at,at.index),preferred=choose(options,at,moves[step]);
  for(const p of options)if(!result.some(q=>q.x===p.x&&q.z===p.z))result.push({...p,preview:true,route:p.id===preferred?.id,origin:{x:at.x,z:at.z}});
 }
 return result;
}
const clamp=value=>Math.max(0,Math.min(1,value));
export function platformStage(index,current){
  return index<current?'falling':index===current?'occupied':index===current+1?'target':index===current+2?'rising':'future';
}
export function platformPose(stage,age){
  if(stage==='falling')return {height:PLATFORM_TOP-3*age-8*age*age,tilt:age*.20,visible:age<1.1};
  if(stage==='rising'){
    const t=clamp(age/PLATFORM_RISE_SECONDS),ease=1-(1-t)**3;
    return {height:PLATFORM_TOP-7*(1-ease),tilt:0,visible:true};
  }
  return {height:stage==='future'?PLATFORM_TOP-7:PLATFORM_TOP,tilt:0,visible:stage!=='future'};
}
