import { add, angleBetween, assertFiniteVector, cross, dot, normalize, reflect, scale, subtract } from './vector';
import type { Vec3 } from './vector';

/** All positions, sizes, distances and epsilon values are in centimetres. */
export interface Ray { readonly origin: Vec3; readonly direction: Vec3 }
export interface Mirror {
  readonly id: string;
  readonly center: Vec3;
  readonly normal: Vec3;
  /** Tangent along the rectangle width; perpendicular to normal. */
  readonly uAxis: Vec3;
  readonly halfWidthCm: number;
  readonly halfHeightCm: number;
  /** Default false: only dot(direction, normal) < 0 reflects. Backs pass through. */
  readonly twoSided?: boolean;
}
export interface Receiver { readonly id: string; readonly center: Vec3; readonly radiusCm: number }
export interface Intersection { readonly distanceCm: number; readonly point: Vec3 }
export interface MirrorIntersection extends Intersection { readonly normal: Vec3 }
export interface TraceOptions {
  /** Number of reflections permitted. Integer from 0 through 8, inclusive. */
  readonly maxBounces?: number;
  /** Total optical path length, including every segment. Default 300 cm. */
  readonly maxDistanceCm?: number;
  /** Ignore intersections at or within this distance. Default 0.00001 cm. */
  readonly epsilonCm?: number;
}
export interface BeamSegment {
  readonly from: Vec3;
  readonly to: Vec3;
  readonly endKind: 'mirror' | 'receiver' | 'range';
  readonly objectId?: string;
}
export interface MirrorBounce {
  readonly mirrorId: string;
  readonly point: Vec3;
  readonly normal: Vec3;
  readonly incoming: Vec3;
  readonly outgoing: Vec3;
  readonly incidenceAngleRad: number;
  readonly reflectionAngleRad: number;
}
export interface TraceResult {
  readonly segments: readonly BeamSegment[];
  readonly hits: readonly MirrorBounce[];
  readonly hitReceiverId: string | null;
  readonly termination: 'receiver' | 'max-distance' | 'max-bounces';
  readonly totalDistanceCm: number;
}

export const DEFAULT_EPSILON_CM = 1e-5;
const PARALLEL_EPSILON = 1e-10;

function positive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and positive`);
}

function checkedRay(ray: Ray): Ray {
  assertFiniteVector(ray.origin, 'ray origin');
  return { origin: ray.origin, direction: normalize(ray.direction) };
}

/**
 * Inclusive rectangular edges. Parallel, coplanar, behind-ray and back-face
 * intersections return null. Two-sided mirrors face the returned normal toward
 * the incoming ray. Non-unit direction/normal/tangent inputs are normalized.
 */
export function intersectMirror(ray: Ray, mirror: Mirror, epsilonCm = DEFAULT_EPSILON_CM): MirrorIntersection | null {
  positive(epsilonCm, 'epsilonCm');
  positive(mirror.halfWidthCm, 'halfWidthCm');
  positive(mirror.halfHeightCm, 'halfHeightCm');
  assertFiniteVector(mirror.center, 'mirror center');
  const { origin, direction } = checkedRay(ray);
  let normal = normalize(mirror.normal);
  const u = normalize(mirror.uAxis);
  if (Math.abs(dot(normal, u)) > 1e-6) throw new RangeError('Mirror uAxis must be perpendicular to normal');
  const v = normalize(cross(normal, u));
  const denominator = dot(direction, normal);
  if (Math.abs(denominator) <= PARALLEL_EPSILON) return null;
  if (!mirror.twoSided && denominator >= 0) return null;
  const distanceCm = dot(subtract(mirror.center, origin), normal) / denominator;
  if (distanceCm <= epsilonCm) return null;
  const point = add(origin, scale(direction, distanceCm));
  const offset = subtract(point, mirror.center);
  if (Math.abs(dot(offset, u)) > mirror.halfWidthCm + epsilonCm ||
      Math.abs(dot(offset, v)) > mirror.halfHeightCm + epsilonCm) return null;
  if (denominator > 0) normal = scale(normal, -1);
  return { distanceCm, point, normal };
}

/** Nearest positive sphere surface crossing. A ray starting inside exits it. */
export function intersectReceiver(ray: Ray, receiver: Receiver, epsilonCm = DEFAULT_EPSILON_CM): Intersection | null {
  positive(epsilonCm, 'epsilonCm');
  positive(receiver.radiusCm, 'receiver radiusCm');
  assertFiniteVector(receiver.center, 'receiver center');
  const { origin, direction } = checkedRay(ray);
  const offset = subtract(origin, receiver.center);
  const b = dot(offset, direction);
  const c = dot(offset, offset) - receiver.radiusCm * receiver.radiusCm;
  const discriminant = b * b - c;
  if (discriminant < -epsilonCm * epsilonCm) return null;
  const root = Math.sqrt(Math.max(0, discriminant));
  const near = -b - root;
  const far = -b + root;
  const distanceCm = near > epsilonCm ? near : far;
  if (distanceCm <= epsilonCm) return null;
  return { distanceCm, point: add(origin, scale(direction, distanceCm)) };
}

/**
 * Trace the nearest positive event, independent of object-array order.
 * Mirrors win distance ties within epsilon. Receivers terminate the trace.
 * A ray may reach a receiver after its final permitted reflection; the next
 * mirror terminates with max-bounces. Self-hits at t <= epsilon are excluded,
 * so segments remain contiguous without adding an artificial origin offset.
 */
export function traceRay(ray: Ray, mirrors: readonly Mirror[], receivers: readonly Receiver[], options: TraceOptions = {}): TraceResult {
  const maxBounces = options.maxBounces ?? 8;
  const maxDistanceCm = options.maxDistanceCm ?? 300;
  const epsilonCm = options.epsilonCm ?? DEFAULT_EPSILON_CM;
  if (!Number.isInteger(maxBounces) || maxBounces < 0 || maxBounces > 8) throw new RangeError('maxBounces must be an integer from 0 to 8');
  positive(maxDistanceCm, 'maxDistanceCm');
  positive(epsilonCm, 'epsilonCm');
  let current = checkedRay(ray);
  let totalDistanceCm = 0;
  const segments: BeamSegment[] = [];
  const hits: MirrorBounce[] = [];
  const result = (termination: TraceResult['termination'], hitReceiverId: string | null = null): TraceResult =>
    ({ segments, hits, hitReceiverId, termination, totalDistanceCm });

  // At most 8 reflections plus one terminal segment.
  while (true) {
    const remaining = maxDistanceCm - totalDistanceCm;
    let nearest: { intersection: Intersection; receiver?: Receiver; mirror?: Mirror; normal?: Vec3 } | null = null;
    for (const receiver of receivers) {
      const intersection = intersectReceiver(current, receiver, epsilonCm);
      if (intersection && intersection.distanceCm <= remaining &&
          (!nearest || intersection.distanceCm < nearest.intersection.distanceCm)) nearest = { intersection, receiver };
    }
    for (const mirror of mirrors) {
      const intersection = intersectMirror(current, mirror, epsilonCm);
      if (intersection && intersection.distanceCm <= remaining &&
          (!nearest || intersection.distanceCm <= nearest.intersection.distanceCm + epsilonCm)) {
        nearest = { intersection, mirror, normal: intersection.normal };
      }
    }
    if (!nearest) {
      segments.push({ from: current.origin, to: add(current.origin, scale(current.direction, remaining)), endKind: 'range' });
      totalDistanceCm = maxDistanceCm;
      return result('max-distance');
    }
    const { intersection, receiver, mirror, normal } = nearest;
    totalDistanceCm += intersection.distanceCm;
    segments.push({ from: current.origin, to: intersection.point, endKind: receiver ? 'receiver' : 'mirror', objectId: receiver?.id ?? mirror!.id });
    if (receiver) return result('receiver', receiver.id);
    if (hits.length === maxBounces) return result('max-bounces');
    const outgoing = reflect(current.direction, normal!);
    hits.push({
      mirrorId: mirror!.id, point: intersection.point, normal: normal!, incoming: current.direction, outgoing,
      incidenceAngleRad: angleBetween(scale(current.direction, -1), normal!),
      reflectionAngleRad: angleBetween(outgoing, normal!),
    });
    current = { origin: intersection.point, direction: outgoing };
  }
}

/**
 * Local mirror at 0° has normal (0,0,-1), width +X and height +Y.
 * Apply X pitch then Y yaw (degrees): the same Y * X rotation must orient
 * the rendered mirror. Positive pitch tilts the normal toward +Y.
 */
export function mirrorFromYawPitch(id: string, center: Vec3, yawDeg: number, pitchDeg: number, halfWidthCm = 8, halfHeightCm = 9): Mirror {
  if (!Number.isFinite(yawDeg) || !Number.isFinite(pitchDeg)) throw new RangeError('Mirror angles must be finite');
  const yaw = yawDeg * Math.PI / 180;
  const pitch = pitchDeg * Math.PI / 180;
  return {
    id, center, halfWidthCm, halfHeightCm,
    normal: { x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) },
    uAxis: { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) },
  };
}
