/** Wrap-aware planar geometry on the equirectangular km plane (D14). */

/** Shortest horizontal delta from x1 to x2 on a world of width w (km). */
export function wrapDelta(x1: number, x2: number, w: number): number {
  let d = x2 - x1;
  if (d > w / 2) d -= w;
  else if (d < -w / 2) d += w;
  return d;
}

/** Wrap x into [0, w). */
export function wrapX(x: number, w: number): number {
  return ((x % w) + w) % w;
}

/** Squared wrap-aware planar distance (km²). ⚙ ignores latitude distortion. */
export function wrapDist2(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
): number {
  const dx = wrapDelta(x1, x2, w);
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}
