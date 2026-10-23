import { mirrorFromYawPitch, traceRay } from './optics';
import type { Mirror, Ray, Receiver, TraceResult } from './optics';
import type { Vec3 } from './vector';

/** Workbench-local geometry fits within a 70 cm x 70 cm footprint. */
export const GARDEN_SOURCE: Ray = { origin: { x: 0, y: 14, z: -30 }, direction: { x: 0, y: 0, z: 1 } };
export const GARDEN_MIRROR_CENTER: Vec3 = { x: 0, y: 14, z: 0 };
export const GARDEN_RECEIVERS: readonly Receiver[] = [
  { id: 'coral', center: { x: -26, y: 7, z: -10 }, radiusCm: 4 },
  { id: 'teal', center: { x: 25, y: 21, z: -12 }, radiusCm: 4 },
  { id: 'gold', center: { x: -7, y: 34, z: -18 }, radiusCm: 4 },
];
export const GARDEN_ANGLE_LIMITS = { minYawDeg: -65, maxYawDeg: 65, minPitchDeg: -35, maxPitchDeg: 35 } as const;

export interface GardenState {
  readonly yawDeg: number;
  readonly pitchDeg: number;
  readonly earnedReceiverIds: readonly string[];
}
export interface GardenFrame {
  readonly state: GardenState;
  readonly mirror: Mirror;
  readonly trace: TraceResult;
  /** This frame's new achievement, suitable for one-shot bloom feedback. */
  readonly newlyEarnedReceiverId: string | null;
  readonly complete: boolean;
}

/** Reset by creating a fresh state and evaluating it. */
export function createGardenState(): GardenState {
  return { yawDeg: -55, pitchDeg: -22, earnedReceiverIds: [] };
}

/** Every frame traces live geometry. Previously earned flowers remain lit. */
export function evaluateGarden(state: GardenState): GardenFrame {
  const mirror = mirrorFromYawPitch('main-mirror', GARDEN_MIRROR_CENTER, state.yawDeg, state.pitchDeg);
  const trace = traceRay(GARDEN_SOURCE, [mirror], GARDEN_RECEIVERS, { maxDistanceCm: 150 });
  const earned = GARDEN_RECEIVERS.filter(receiver => state.earnedReceiverIds.includes(receiver.id)).map(receiver => receiver.id);
  const newlyEarnedReceiverId = trace.hitReceiverId && !earned.includes(trace.hitReceiverId) ? trace.hitReceiverId : null;
  if (newlyEarnedReceiverId) earned.push(newlyEarnedReceiverId);
  return {
    state: { yawDeg: state.yawDeg, pitchDeg: state.pitchDeg, earnedReceiverIds: earned }, mirror, trace,
    newlyEarnedReceiverId, complete: earned.length === GARDEN_RECEIVERS.length,
  };
}

/** Buttons/drag inputs only supply angle deltas; receiver success is computed. */
export function rotateGarden(state: GardenState, deltaYawDeg: number, deltaPitchDeg: number): GardenFrame {
  if (!Number.isFinite(deltaYawDeg) || !Number.isFinite(deltaPitchDeg)) throw new RangeError('Rotation deltas must be finite');
  const limit = GARDEN_ANGLE_LIMITS;
  return evaluateGarden({
    yawDeg: Math.max(limit.minYawDeg, Math.min(limit.maxYawDeg, state.yawDeg + deltaYawDeg)),
    pitchDeg: Math.max(limit.minPitchDeg, Math.min(limit.maxPitchDeg, state.pitchDeg + deltaPitchDeg)),
    earnedReceiverIds: state.earnedReceiverIds,
  });
}
