export const FIRST_LEVEL_LANDINGS=11;
export const SCROLL_GRACE_SECONDS=3;
export const DIFFICULTIES=[
 {name:'Easy',musicSpeed:.50,speed:3.2},
 {name:'Intermediate',musicSpeed:1,speed:3.85},
 {name:'Advanced',musicSpeed:1.26,speed:4.5},
 {name:'Expert',musicSpeed:1.50,speed:5.15},
];
export function difficulty(level=1){const band=Math.min(3,Math.max(0,Math.floor((level-1)/3)));return {...DIFFICULTIES[band],band};}
export function comboMultiplier(moves=1){return 1+.24*(Math.min(4,Math.max(1,moves))-1);}
export function jumpDuration(level,moves=1){return Math.max(.34,(.58-difficulty(level).band*.025)/comboMultiplier(moves));}
export function progression(landings=0){
 const count=Math.max(0,Math.floor(landings));
 const completed=Math.floor((Math.sqrt(441+8*count)-21)/2);
 const level=completed+1,previous=completed*(completed+21)/2;
 const tier=difficulty(level);
 return {level,name:tier.name,difficulty:tier.name,band:tier.band,musicSpeed:tier.musicSpeed,progress:count-previous,total:10+level,speed:tier.speed};
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
