import {DIRECTIONS,normalizeMoves} from './rules.js';

export function moveSequence(input){
  return normalizeMoves(input).map(move=>{
    const a=DIRECTIONS[move.first],b=DIRECTIONS[move.second];
    const rotation={up:0,right:90,down:180,left:270}[move.first];
    const canonicalRight={up:'right',right:'down',down:'left',left:'up'}[move.first];
    return {...move,heading:rotation*Math.PI/180,direction:move.second===canonicalRight?1:-1,
      forward:{x:a.x*2,z:a.z*2},across:{x:b.x,z:b.z}};
  });
}
export function moveGlyph(move){
  const shaped=move.forward?move:moveSequence(move)[0];
  if(!shaped)return '';
  const rotation=Math.round(shaped.heading*180/Math.PI);
  return `<svg class="move-icon" viewBox="0 0 64 64" role="img" aria-label="${shaped.first} two, ${shaped.second} one"><g transform="translate(32 32) rotate(${rotation}) scale(${shaped.direction} 1) translate(-32 -32)"><path d="M23 49V17H41" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="m36 11 6 6-6 6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 33h8" stroke="currentColor" stroke-width="2" opacity=".5"/><circle cx="23" cy="49" r="4" fill="currentColor"/></g></svg>`;
}
export function directionGlyph(direction){
  if(!DIRECTIONS[direction])return '';
  const rotation={up:0,right:90,down:180,left:270}[direction];
  return `<svg class="move-icon partial-move" viewBox="0 0 64 64" role="img" aria-label="${direction}; one square entered"><g transform="rotate(${rotation} 32 32)"><path d="M32 49V16m-9 9 9-9 9 9" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 4"/><circle cx="32" cy="49" r="4" fill="currentColor"/></g></svg>`;
}
export function moveGlyphs(input){
  const complete=moveSequence(input).map(moveGlyph).join('');
  const partial=Array.isArray(input)&&typeof input[0]==='string'?input.length%3:0;
  return complete+(partial?input.slice(-partial).map(directionGlyph).join(''):'');
}
