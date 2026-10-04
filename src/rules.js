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
// World coordinates for a road's local chess grid. A quarter turn changes
// both the next road's direction and the coordinate frame of its next jump.
export function rotateGrid(point, heading) {
  const c=Math.round(Math.cos(heading)),s=Math.round(Math.sin(heading));
  return {x:point.x*c+point.z*s||0,z:point.z*c-point.x*s||0};
}
export function roadLanding(road, steps, cellSize=8) {
  const offset=rotateGrid(knightDestination(steps),road.heading);
  return {x:road.end.x+offset.x*cellSize,z:road.end.z+offset.z*cellSize,heading:road.heading+steps*Math.PI/2};
}
export function isLandingMatch(actual, target) {
  const a = knightDestination(actual), b = knightDestination(target);
  return a.x === b.x && a.z === b.z;
}
// Every segment lies on the same square grid used by the actual roads.
export function knightPath(steps) {
  const count = steps === 0 ? 0 : Math.abs(steps) % 4 || 4;
  const sign = Math.sign(steps);
  const legs = [[0, 2, 1, 0], [2, 0, 0, -1], [0, -2, -1, 0], [-2, 0, 0, 1]];
  const path = [{ x: 0, z: 0 }];
  let x = 0, z = 0;
  for (let i = 0; i < count; i++) {
    const [ax, az, bx, bz] = legs[i];
    x += ax * sign; z += az; path.push({ x, z });
    x += bx * sign; z += bz; path.push({ x, z });
  }
  return path;
}

export function flightPoint(steps, progress) {
  const t = Math.max(0, Math.min(1, progress));
  // The common opening leg always travels two squares forward. Corrections
  // can change the remaining turns without changing that visible first leg.
  if (t <= .42) return { x: 0, z: 2 * t / .42 };
  if (steps === 0) return { x: 0, z: 2 + (t - .42) / .58 };
  const path = knightPath(steps).slice(1);
  const lengths = path.slice(1).map((p, i) => Math.abs(p.x - path[i].x) + Math.abs(p.z - path[i].z));
  let distance = (t - .42) / .58 * lengths.reduce((sum, value) => sum + value, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]) {
      const f = distance / lengths[i];
      return { x: path[i].x + (path[i + 1].x - path[i].x) * f, z: path[i].z + (path[i + 1].z - path[i].z) * f };
    }
    distance -= lengths[i];
  }
  return path.at(-1);
}

export function flightHeading(steps, progress) {
  const a=flightPoint(steps,Math.max(0,Math.min(1,progress)-.002));
  const b=flightPoint(steps,Math.min(1,Math.max(0,progress)+.002));
  return Math.atan2(b.x-a.x,b.z-a.z);
}
