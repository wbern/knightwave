import {knightPath,rotateGrid,roadLanding} from './rules.js';

export const BOARD_MIN=-4;
export const BOARD_MAX=3;
export const BOARD_CELLS=8;
export const BOARD_CENTER=(BOARD_MIN+BOARD_MAX)/2;
export const CELL_SIZE=4;
export const CIRCUIT_TURNS=[1,2,-1,3,-2,-3];
// Each platform occupies one chess square; jumps start at its center.
export function createCircuit(){
  const stops=[{x:-1,z:0,heading:0,turns:0}];
  for(let i=0;i<=CIRCUIT_TURNS.length;i++){
    const stop=stops[i];
    stop.launch={x:stop.x,z:stop.z,heading:stop.heading};
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
  return point.x>=BOARD_MIN&&point.x<=BOARD_MAX&&point.z>=BOARD_MIN&&point.z<=BOARD_MAX;
}
