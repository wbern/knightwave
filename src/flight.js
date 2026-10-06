import {knightPath,normalizeMoves,knightDestination} from './rules.js';

const cache=new Map();
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const length=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const smooth=t=>t*t*t*(t*(t*6-15)+10);

// Round only the airborne corners. The logical L moves and landing squares
// stay exact; distance along the rounded curve sets a steady travel speed.
function route(steps){
  const moves=normalizeMoves(steps),key=moves.map(move=>`${move.first}:${move.second}`).join(',');
  if(cache.has(key))return cache.get(key);
  const path=moves.length?knightPath(moves):[{x:0,z:0},{x:0,z:3}];
  const points=[path[0]];
  const line=end=>{
    const start=points.at(-1),count=Math.max(1,Math.ceil(length(start,end)*40));
    for(let i=1;i<=count;i++)points.push(mix(start,end,i/count));
  };
  for(let i=1;i<path.length-1;i++){
    const before=path[i-1],corner=path[i],after=path[i+1],radius=.28;
    const entry=mix(corner,before,radius/length(corner,before));
    const exit=mix(corner,after,radius/length(corner,after));
    line(entry);
    for(let j=1;j<=32;j++){
      const t=j/32;points.push(mix(mix(entry,corner,t),mix(corner,exit,t),t));
    }
  }
  line(path.at(-1));
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

// A centered model pivot gives the knight a shuv-it and, for chained moves,
// a barrel roll. Finish before touchdown so the landing direction reads.
export function trickPose(steps,progress){
  const t=Math.max(0,Math.min(1,(progress-.12)/.72)),ease=smooth(t);
  if(t===0)return {yaw:0,roll:0,pitch:0};
  const moves=normalizeMoves(steps),direction=Math.sign(knightDestination(moves).x)||1,count=moves.length;
  return {yaw:direction*2*Math.PI*(count>=3?2:1)*ease,
    roll:count>=2?direction*2*Math.PI*ease:0,
    pitch:Math.sin(Math.PI*t)*-.16};
}
