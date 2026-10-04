import {knightPath,rotateGrid,roadLanding} from './rules.js';

export const BOARD_RADIUS=4;
export const CELL_SIZE=4;
export const CIRCUIT_TURNS=[1,-1,-2,2,3,-3];

// A closed circuit whose landings AND every L-shaped leg fit on the board.
export function createCircuit(){
  const stops=[{x:0,z:-2,heading:0,turns:0}];
  for(const turns of CIRCUIT_TURNS){
    const previous=stops.at(-1);
    const next=roadLanding({end:previous,heading:previous.heading},turns,1);
    stops.push({...next,turns});
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
