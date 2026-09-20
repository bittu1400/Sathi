/**
 * Douglas–Peucker, so a route weighs less on a phone connection. A 239 km trek
 * comes back from ORS as ~9,300 points, half a megabyte of JSON, and nothing on
 * screen can show that detail: the line is drawn, never walked turn by turn.
 * Run it last, after the day split, which needs every point to measure climb.
 */

/** Metres of deviation allowed. Below a phone's pixel at any zoom we draw at. */
const TOLERANCE_M = 10;

const M_PER_DEG = 111_320;

/** Flat-earth metres, fine over the few kilometres a segment ever spans. */
function perpendicularM(point: number[], start: number[], end: number[]): number {
  const [plng = 0, plat = 0] = point;
  const [slng = 0, slat = 0] = start;
  const [elng = 0, elat = 0] = end;
  const scale = Math.cos((plat * Math.PI) / 180);
  const px = (plng - slng) * scale * M_PER_DEG;
  const py = (plat - slat) * M_PER_DEG;
  const ex = (elng - slng) * scale * M_PER_DEG;
  const ey = (elat - slat) * M_PER_DEG;
  const lengthSq = ex * ex + ey * ey;
  if (lengthSq === 0) return Math.hypot(px, py);
  // How far along the segment the closest point sits, clamped to its ends.
  const t = Math.max(0, Math.min(1, (px * ex + py * ey) / lengthSq));
  return Math.hypot(px - t * ex, py - t * ey);
}

export function simplifyLine(coordinates: number[][], toleranceM = TOLERANCE_M): number[][] {
  if (coordinates.length < 3) return coordinates;

  const keep = new Uint8Array(coordinates.length);
  keep[0] = 1;
  keep[coordinates.length - 1] = 1;

  // Iterative rather than recursive: a 9,300-point line would go deep.
  const stack: [number, number][] = [[0, coordinates.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop() as [number, number];
    let furthest = -1;
    let furthestM = toleranceM;
    for (let i = first + 1; i < last; i += 1) {
      const distance = perpendicularM(
        coordinates[i] as number[],
        coordinates[first] as number[],
        coordinates[last] as number[],
      );
      if (distance > furthestM) {
        furthest = i;
        furthestM = distance;
      }
    }
    if (furthest === -1) continue;
    keep[furthest] = 1;
    stack.push([first, furthest], [furthest, last]);
  }

  return coordinates.filter((_, index) => keep[index] === 1);
}
