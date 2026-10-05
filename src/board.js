import {knightDestination} from './rules.js';
export const BOARD_MIN=-4,BOARD_MAX=3,BOARD_CELLS=8,BOARD_CENTER=-.5,CELL_SIZE=4;
export const GRID_COLS=12,GRID_ROWS=24;
const opening=[1,-2,1,3,-1,-2,2,-1];

// Logical lookahead and rendering pools stay bounded, however long the run.
export class EndlessCourse{
  constructor(seed=512){this.seed=seed;this.reset();}
  reset(){this.random=this.seed;this.stops=[{index:0,x:-1,z:0,heading:0,turns:0}];this.ensure(8);}
  ensure(index){
    while(this.stops.at(-1).index<index){
      const previous=this.stops.at(-1),next=previous.index+1;
      this.random=(Math.imul(this.random,1664525)+1013904223)>>>0;
      const choices=[-3,-2,-1,1,2,3].filter(turns=>previous.x+turns>=-3&&previous.x+turns<=2&&!(Math.abs(previous.turns)===3&&Math.abs(turns)===3));
      const turns=next<=opening.length?opening[next-1]:choices[this.random%choices.length],offset=knightDestination(turns);
      this.stops.push({index:next,x:previous.x+offset.x,z:previous.z+offset.z,heading:0,turns});
    }
  }
  at(index){this.ensure(index);const stop=this.stops.find(p=>p.index===index);if(!stop)throw new Error('Course stop has already been recycled');return stop;}
  maintain(current){this.ensure(current+8);this.stops=this.stops.filter(p=>p.index>=Math.max(0,current-2));}
}
