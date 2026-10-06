export const FIRST_LEVEL_LANDINGS=11;
export const SCROLL_GRACE_SECONDS=3;
const stages=['First flight','Find your rhythm','Quick thinking','Capture rush','Full momentum'];
export function progression(landings=0){
 const count=Math.max(0,Math.floor(landings));
 const completed=Math.floor((Math.sqrt(441+8*count)-21)/2);
 const level=completed+1,previous=completed*(completed+21)/2;
 return {level,name:stages[Math.min(level-1,stages.length-1)],progress:count-previous,total:10+level,speed:3.2+(level-1)*.65};
}
// The camera advances with time even while the knight is waiting. Splitting at
// the grace boundary makes a slow frame behave identically to smaller ticks.
export class ScrollProgression{
 constructor(){this.reset();}
 reset(){this.elapsed=0;this.distance=0;this.landings=0;return this.state;}
 get state(){return {...progression(this.landings),landings:this.landings,elapsed:this.elapsed,distance:this.distance,grace:Math.max(0,SCROLL_GRACE_SECONDS-this.elapsed)};}
 landed(){this.landings++;return this.state;}
 tick(seconds){
  if(!Number.isFinite(seconds)||seconds<0)throw new Error('Scroll time must be a finite nonnegative duration');
  const before=this.elapsed;this.elapsed+=seconds;
  const active=Math.max(0,this.elapsed-SCROLL_GRACE_SECONDS)-Math.max(0,before-SCROLL_GRACE_SECONDS);
  this.distance+=active*progression(this.landings).speed;return this.state;
 }
}
