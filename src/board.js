import {knightPath,rotateGrid,roadLanding} from './rules.js';

export const BOARD_RADIUS=4;
export const CELL_SIZE=4;
export const CIRCUIT_TURNS=[1,2,-1,3,-2,-3];
// Every platform has a one-square run-up; the raised decks never intersect.
export function createCircuit(){
  const stops=[{x:0,z:0,heading:0,turns:0}];
  for(let i=0;i<=CIRCUIT_TURNS.length;i++){
    const stop=stops[i],offset=rotateGrid({x:0,z:1},stop.heading);
    stop.runLength=1;
    stop.launch={x:stop.x+offset.x,z:stop.z+offset.z,heading:stop.heading};
    if(i<CIRCUIT_TURNS.length){
      const turns=CIRCUIT_TURNS[i];
      stops.push({...roadLanding({end:stop.launch,heading:stop.heading},turns,1),turns});
    }
  }
  return stops;
}
export function circuitPath(start,turns){
  return knightPath(turns).map(point=>{
    const offset=rotateGrid(point,start.heading);
    return {x:start.x+offset.x,z:start.z+offset.z};
  });
}
export function isOnBoard(point){
  return Math.abs(point.x)<=BOARD_RADIUS&&Math.abs(point.z)<=BOARD_RADIUS;
}
