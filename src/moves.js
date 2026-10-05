// Every icon keeps the same up-facing reference, including future groups.
export function moveSequence(steps){
  return Array.from({length:Math.abs(steps)},()=>({direction:Math.sign(steps),heading:0,forward:{x:0,z:2},across:{x:Math.sign(steps),z:0}}));
}
export function moveGlyph(move){
  const rotation=Math.round(move.heading*180/Math.PI);
  return `<svg class="move-icon" viewBox="0 0 64 64" role="img" aria-label="Knight L move"><g transform="translate(32 32) rotate(${rotation}) scale(${move.direction} 1) translate(-32 -32)"><path d="M23 49V17H41" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="m36 11 6 6-6 6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 33h8" stroke="currentColor" stroke-width="2" opacity=".5"/><circle cx="23" cy="49" r="4" fill="currentColor"/></g></svg>`;
}
export function moveGlyphs(steps,heading){
  return moveSequence(steps,heading).map(moveGlyph).join('');
}
