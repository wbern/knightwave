export const DIRECTIONS=Object.freeze({up:{x:0,z:1},down:{x:0,z:-1},left:{x:-1,z:0},right:{x:1,z:0}});
export function perpendicular(first,second){
  const a=DIRECTIONS[first],b=DIRECTIONS[second];
  return !!a&&!!b&&a.x*b.x+a.z*b.z===0;
}
// Inputs preserve their order: the first direction travels two squares.
export function normalizeMoves(input){
  if(input?.moves)return normalizeMoves(input.moves);
  if(input?.first)return perpendicular(input.first,input.second)?[{first:input.first,second:input.second}]:[];
  if(!Array.isArray(input))return [];
  if(typeof input[0]==='string'){
    const moves=[];
    for(let i=0;i+1<input.length;i+=2){
      if(!perpendicular(input[i],input[i+1]))throw new TypeError('Knight directions must be perpendicular');
      moves.push({first:input[i],second:input[i+1]});
    }
    return moves;
  }
  return input.flatMap(move=>normalizeMoves(move));
}
export function knightPath(input){
  const path=[{x:0,z:0}];let x=0,z=0;
  for(const move of normalizeMoves(input)){
    const first=DIRECTIONS[move.first],second=DIRECTIONS[move.second];
    x+=first.x*2;z+=first.z*2;path.push({x,z});
    x+=second.x;z+=second.z;path.push({x,z});
  }
  return path;
}
export function knightDestination(input){return knightPath(input).at(-1);}
export function isLandingMatch(actual,target){
  const a=actual?.x!==undefined?actual:knightDestination(actual),b=target?.x!==undefined?target:knightDestination(target);
  return a.x===b.x&&a.z===b.z;
}
