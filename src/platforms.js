export const PLATFORM_TOP=.8;
export const CRUISE_SPEED=5.2;
const clamp=value=>Math.max(0,Math.min(1,value));
export function platformStage(index,current){
  return index<current?'falling':index===current?'occupied':index===current+1?'target':index===current+2?'rising':'future';
}
export function platformPose(stage,age){
  if(stage==='falling')return {height:PLATFORM_TOP-3*age-8*age*age,tilt:age*.20,visible:age<1.1};
  if(stage==='rising'){
    const t=clamp(age/.85),ease=1-(1-t)**3;
    return {height:PLATFORM_TOP-7*(1-ease),tilt:0,visible:true};
  }
  return {height:stage==='future'?PLATFORM_TOP-7:PLATFORM_TOP,tilt:0,visible:stage!=='future'};
}
