import {rotateGrid} from './rules.js';

// Each glyph represents one actual two-forward / one-across knight move.
export function moveSequence(steps,heading){
  if(!steps)return [];
  const direction=Math.sign(steps),count=Math.abs(steps)%4||4;
  return Array.from({length:count},(_,i)=>{
    const angle=heading+direction*i*Math.PI/2;
    return {direction,heading:angle,forward:rotateGrid({x:0,z:2},angle),across:rotateGrid({x:direction,z:0},angle)};
  });
}
export function moveGlyph(move){
  const rotation=Math.round(move.heading*180/Math.PI);
  return `<svg class="move-icon" viewBox="0 0 64 64" role="img" aria-label="Knight L move"><g transform="translate(32 32) rotate(${rotation}) scale(${move.direction} 1) translate(-32 -32)"><path d="M23 49V17H41" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="m36 11 6 6-6 6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 33h8" stroke="currentColor" stroke-width="2" opacity=".5"/><circle cx="23" cy="49" r="4" fill="currentColor"/></g></svg>`;
}
export function moveGlyphs(steps,heading){
  return moveSequence(steps,heading).map(moveGlyph).join('');
}
