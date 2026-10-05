export function normalizeTurns(turns){
  return turns?Math.sign(turns)*(Math.abs(turns)%4||4):0;
}

// The draft is editable. Committed groups are FIFO; the flying group is locked.
export class Premoves {
  constructor(limit=6){this.limit=limit;this.reset();}
  reset(){this.draft=0;this.groups=[];this.completed=0;this.locked=false;this.nextId=1;}
  get full(){return this.completed+this.groups.length>=this.limit;}
  draftHeading(heading){const last=this.groups.at(-1);return last?last.heading+last.turns*Math.PI/2:heading;}
  edit(direction){if(this.full||![-1,1].includes(direction))return false;this.draft+=direction;return true;}
  dispatch(heading){
    if(!this.draft||this.full)return null;
    const group={id:this.nextId++,turns:normalizeTurns(this.draft),heading:this.draftHeading(heading)};
    this.groups.push(group);this.draft=0;return group;
  }
  begin(){if(this.locked||!this.groups.length)return null;this.locked=true;return this.groups[0];}
  complete(){if(!this.locked)return null;const group=this.groups.shift();this.completed++;this.locked=false;return group;}
  recall(){
    if(this.draft){this.draft=0;return {cleared:true};}
    if(this.groups.length<=(this.locked?1:0))return null;
    const group=this.groups.pop();this.draft=group.turns;return group;
  }
}

export function verticalGesture(start,end){
  const dx=end.x-start.x,dy=end.y-start.y;
  if(Math.abs(dy)<44||Math.abs(dy)<Math.abs(dx)*1.35)return null;
  return dy<0?'dispatch':'recall';
}
