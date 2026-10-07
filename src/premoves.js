import {DIRECTIONS,normalizeMoves,perpendicular,moveFromSteps} from './rules.js';

// Three-press moves stay editable until dispatch. Committed groups are FIFO.
export class Premoves {
  constructor(limit=8){this.limit=limit;this.reset();}
  reset(){this.draft=[];this.groups=[];this.completed=0;this.locked=false;this.nextId=1;}
  get full(){return this.groups.length>=this.limit;}
  draftHeading(){return 0;}
  edit(direction){
    if(this.full||!DIRECTIONS[direction])return false;
    if(this.draft.length>=12)return false;
    const partial=this.draft.length%3;
    if(partial===1&&!perpendicular(this.draft.at(-1),direction)&&this.draft.at(-1)!==direction){
      this.draft[this.draft.length-1]=direction;return true;
    }
    if(partial===2&&!moveFromSteps([...this.draft.slice(-2),direction]))return false;
    this.draft.push(direction);return true;
  }

  dispatch(){
    if(!this.draft.length||this.draft.length%3||this.full)return null;
    const group={id:this.nextId++,moves:normalizeMoves(this.draft),inputs:[...this.draft],heading:0};
    this.groups.push(group);this.draft=[];return group;
  }
  begin(){if(this.locked||!this.groups.length)return null;this.locked=true;return this.groups[0];}
  complete(){if(!this.locked)return null;const group=this.groups.shift();this.completed++;this.locked=false;return group;}
  undo(){
    if(this.draft.length){const direction=this.draft.pop();return {direction};}
    return this.recall();
  }
  recall(){
    if(this.draft.length){this.draft=[];return {cleared:true};}
    if(this.groups.length<=(this.locked?1:0))return null;
    const group=this.groups.pop();this.draft=group.inputs?[...group.inputs]:group.moves.flatMap(move=>[move.first,move.first,move.second]);return group;
  }
}

export function verticalGesture(start,end){
  const dx=end.x-start.x,dy=end.y-start.y;
  if(Math.abs(dy)<44||Math.abs(dy)<Math.abs(dx)*1.35)return null;
  return dy<0?'dispatch':'recall';
}
