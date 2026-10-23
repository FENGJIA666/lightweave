/** Plain vectors keep the optical model independent of Lens Studio APIs. */
export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export function assertFiniteVector(v: Vec3, name = 'vector'): void {
  if (![v.x, v.y, v.z].every(Number.isFinite)) {
    throw new RangeError(`${name} must have finite coordinates`);
  }
}

export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const subtract = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const scale = (v: Vec3, factor: number): Vec3 => ({ x: v.x * factor, y: v.y * factor, z: v.z * factor });
export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const length = (v: Vec3): number => Math.hypot(v.x, v.y, v.z);
export const distance = (a: Vec3, b: Vec3): number => length(subtract(a, b));

export function normalize(v: Vec3): Vec3 {
  assertFiniteVector(v);
  const magnitude = length(v);
  if (magnitude <= 1e-12) throw new RangeError('Cannot normalize a zero-length vector');
  return scale(v, 1 / magnitude);
}

export function angleBetween(a: Vec3, b: Vec3): number {
  return Math.acos(Math.max(-1, Math.min(1, dot(normalize(a), normalize(b)))));
}

/** Returns a unit reflection direction: r = d - 2(d·n)n. */
export function reflect(direction: Vec3, normal: Vec3): Vec3 {
  const d = normalize(direction);
  const n = normalize(normal);
  return normalize(subtract(d, scale(n, 2 * dot(d, n))));
}
