export function normalizeTurns(turns){
  return turns;
}

// The draft is editable. Committed groups are FIFO; the flying group is locked.
export class Premoves {
  constructor(limit=8){this.limit=limit;this.reset();}
  reset(){this.draft=0;this.groups=[];this.completed=0;this.locked=false;this.nextId=1;}
  get full(){return this.groups.length>=this.limit;}
  draftHeading(){return 0;}
  edit(direction){if(this.full||![-1,1].includes(direction)||Math.abs(this.draft+direction)>4)return false;this.draft+=direction;return true;}
  dispatch(){
    if(!this.draft||this.full)return null;
    const group={id:this.nextId++,turns:this.draft,heading:0};
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
