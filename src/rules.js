// Each tap chains an L-shaped chess move, rotated another quarter turn.
// Four taps return to the departure square; a fifth begins a new cycle.
export function knightDestination(steps) {
  let x = 0, z = 0;
  const direction = Math.sign(steps);
  const moves = [[1, 2], [2, -1], [-1, -2], [-2, 1]];
  for (let i = 0; i < Math.abs(steps) % 4; i++) {
    x += moves[i][0] * direction;
    z += moves[i][1];
  }
  return { x, z };
}
export const positiveMod = (n, d) => ((n % d) + d) % d;
export function isLandingMatch(actual, target) {
  const a = knightDestination(actual), b = knightDestination(target);
  return a.x === b.x && a.z === b.z;
}
export function targetForJump(index, random = Math.random) {
  const tutorial = [1, -1, 2, -2, 3, -3];
  if (index < tutorial.length) return tutorial[index];
  return (random() > .5 ? 1 : -1) * (1 + Math.floor(random() * 3));
}
