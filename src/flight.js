import {DIRECTIONS,normalizeMoves,knightDestination} from './rules.js';

const cache=new Map();
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const length=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const clamp=t=>Math.max(0,Math.min(1,t));

// Ordered takeoff and landing directions shape a single curved trick jump.
// Distance along the curve keeps travel quick and evenly paced.
function route(steps){
  const moves=normalizeMoves(steps);
  const entered=Array.isArray(steps)&&typeof steps[0]==='string'?steps:null;
  const routes=moves.map((move,i)=>({move,steps:steps?.steps||move.steps||entered?.slice(i*3,i*3+3)||[move.first,move.first,move.second]}));
  const key=routes.map(r=>r.steps.join(':')).join(',');
  if(cache.has(key))return cache.get(key);
  const points=[{x:0,z:0}];
  for(const {move,steps:input} of routes){
    const start=points.at(-1),delta=knightDestination(move),end={x:start.x+delta.x,z:start.z+delta.z};
    const first=DIRECTIONS[input[0]],last=DIRECTIONS[input[2]],handle=1.25;
    const a={x:start.x+first.x*handle,z:start.z+first.z*handle};
    const b={x:end.x-last.x*handle,z:end.z-last.z*handle};
    // Fly along one flowing arc. Its takeoff and landing tangents preserve
    // the first and last presses instead of reordering the player's inputs.
    for(let i=1;i<=200;i++){
      const t=i/200,u=1-t;
      points.push({x:u*u*u*start.x+3*u*u*t*a.x+3*u*t*t*b.x+t*t*t*end.x,z:u*u*u*start.z+3*u*u*t*a.z+3*u*t*t*b.z+t*t*t*end.z});
    }
  }
  if(points.length===1)points.push({x:0,z:3});
  let distance=0,heading=0;
  const samples=points.map((p,i)=>{
    if(i)distance+=length(points[i-1],p);
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
    const tangent=Math.atan2(b.x-a.x,b.z-a.z);
    heading+=Math.atan2(Math.sin(tangent-heading),Math.cos(tangent-heading));
    return {...p,distance,heading};
  });
  const result={samples,distance};cache.set(key,result);if(cache.size>256)cache.delete(cache.keys().next().value);return result;
}

export function flightPose(steps,progress){
  const {samples,distance}=route(steps),target=Math.max(0,Math.min(1,progress))*distance;
  let low=0,high=samples.length-1;
  while(low+1<high){const mid=(low+high)>>1;if(samples[mid].distance<target)low=mid;else high=mid;}
  const a=samples[low],b=samples[high],t=(target-a.distance)/(b.distance-a.distance);
  return {...mix(a,b,t),heading:a.heading+(b.heading-a.heading)*t};
}

// A brief loaded stance, an impulse-driven rise, and a heavier fall.
export const JUMP_HEIGHT=2.4;
export const TAKEOFF_FRACTION=.08;
export const APEX_FRACTION=.55;
export function hopProgress(progress){return clamp((progress-TAKEOFF_FRACTION)/(1-TAKEOFF_FRACTION));}
export function jumpLift(progress){
 const t=hopProgress(progress);
 if(t<=APEX_FRACTION){const u=t/APEX_FRACTION;return JUMP_HEIGHT*(2*u-u*u);}
 const u=(t-APEX_FRACTION)/(1-APEX_FRACTION);return JUMP_HEIGHT*(1-u*u);
}

// Keep the piece upright: lean into its travel instead of somersaulting.
export function trickPose(steps,progress,power=1){
 const t=hopProgress(progress),envelope=Math.sin(Math.PI*t);
 if(t===0||t===1)return {yaw:0,roll:0,pitch:0};
 const delta=knightDestination(steps),distance=Math.hypot(delta.x,delta.z)||1;
 const lean=.13+Math.min(3,Math.max(0,power-1))*.018;
 return {yaw:0,roll:-delta.x/distance*lean*envelope,pitch:delta.z/distance*lean*envelope};
}

// Volume-preserving squash/stretch makes launch and contact read as a hop.
export function hopShape(progress){
 const t=clamp(progress),air=hopProgress(t);
 const height=t<TAKEOFF_FRACTION?1-.16*Math.sin(Math.PI*t/TAKEOFF_FRACTION):1+.12*Math.sin(2*Math.PI*air)*Math.exp(-air*2);
 return {height,width:1/Math.sqrt(height)};
}
export function landingShape(seconds){
 const age=Math.max(0,seconds),height=age>=.16?1:1-.18*Math.exp(-age*24)*Math.cos(age*42);
 return {height,width:1/Math.sqrt(height)};
}
