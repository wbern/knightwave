// Every L starts facing north: two ranks forward, then one file across.
export function knightDestination(steps){return {x:steps,z:Math.abs(steps)*2};}
export function isLandingMatch(actual,target){return actual===target;}
export function knightPath(steps){
  const path=[{x:0,z:0}],direction=Math.sign(steps);let x=0,z=0;
  for(let i=0;i<Math.abs(steps);i++){z+=2;path.push({x,z});x+=direction;path.push({x,z});}
  return path;
}
