import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  add, angleBetween, createGardenState, cross, distance, dot, evaluateGarden,
  GARDEN_ANGLE_LIMITS, GARDEN_MIRROR_CENTER, GARDEN_RECEIVERS, GARDEN_SOURCE,
  intersectMirror, intersectReceiver, length, mirrorFromYawPitch, normalize,
  reflect, rotateGarden, scale, subtract, traceRay,
} from '../../Assets/Scripts/Core/index';
import type { GardenState, Mirror, Ray, Vec3 } from '../../Assets/Scripts/Core/index';

const near = (actual: number, expected: number, tolerance = 1e-8): void =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
const nearVector = (actual: Vec3, expected: Vec3, tolerance = 1e-8): void => {
  near(actual.x, expected.x, tolerance);
  near(actual.y, expected.y, tolerance);
  near(actual.z, expected.z, tolerance);
};
const ray = (origin: Vec3, direction: Vec3): Ray => ({ origin, direction });
const frontMirror: Mirror = {
  id: 'front', center: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 0, z: -1 },
  uAxis: { x: 1, y: 0, z: 0 }, halfWidthCm: 5, halfHeightCm: 4,
};
const forward = { x: 0, y: 0, z: 1 };

describe('vector operations and the reflection invariant', () => {
  test('vector operations preserve three independent dimensions', () => {
    nearVector(add({ x: 1, y: 2, z: 3 }, { x: -3, y: 4, z: 6 }), { x: -2, y: 6, z: 9 });
    nearVector(cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }), { x: 0, y: 0, z: 1 });
    near(length(normalize({ x: 2, y: 3, z: 4 })), 1);
    near(distance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 12 }), 13);
  });
  test('normal incidence reverses direction, including non-unit inputs', () => {
    nearVector(reflect({ x: 0, y: 0, z: 7 }, { x: 0, y: 0, z: -3 }), { x: 0, y: 0, z: -1 });
  });
  test('45 degree mirror sends +Z light exactly toward +X', () => {
    nearVector(reflect(forward, { x: 1, y: 0, z: -1 }), { x: 1, y: 0, z: 0 });
  });
  test('reflection preserves tangential direction and reverses normal direction across 3D cases', () => {
    for (let yaw = -60; yaw <= 60; yaw += 15) {
      for (let pitch = -30; pitch <= 30; pitch += 10) {
        const mirror = mirrorFromYawPitch('sample', { x: 0, y: 0, z: 0 }, yaw, pitch);
        const n = mirror.normal;
        const incoming = normalize({ x: 0.12, y: -0.08, z: 1 });
        const outgoing = reflect(incoming, n);
        near(length(outgoing), 1);
        near(dot(outgoing, n), -dot(incoming, n));
        nearVector(subtract(outgoing, scale(n, dot(outgoing, n))), subtract(incoming, scale(n, dot(incoming, n))));
        near(angleBetween(scale(incoming, -1), n), angleBetween(outgoing, n));
        nearVector(reflect(outgoing, n), incoming);
      }
    }
  });
  test('zero vectors and non-finite values are rejected explicitly', () => {
    assert.throws(() => normalize({ x: 0, y: 0, z: 0 }), RangeError);
    assert.throws(() => reflect(forward, { x: NaN, y: 0, z: 1 }), RangeError);
    assert.throws(() => normalize({ x: Infinity, y: 0, z: 1 }), RangeError);
  });
});

describe('finite rectangular mirror intersections', () => {
  test('t is physical centimetres even when ray direction is not normalized', () => {
    const hit = intersectMirror(ray({ x: 2, y: 3, z: -10 }, { x: 0, y: 0, z: 5 }), frontMirror)!;
    near(hit.distanceCm, 10);
    nearVector(hit.point, { x: 2, y: 3, z: 0 });
  });
  test('both rectangle edges and the corner are inclusive', () => {
    for (const [x, y] of [[5, 0], [-5, 0], [0, 4], [0, -4], [5, 4]]) {
      assert.ok(intersectMirror(ray({ x, y, z: -10 }, forward), frontMirror));
    }
  });
  test('rays outside width or height miss the finite mirror', () => {
    assert.equal(intersectMirror(ray({ x: 5.001, y: 0, z: -10 }, forward), frontMirror), null);
    assert.equal(intersectMirror(ray({ x: 0, y: -4.001, z: -10 }, forward), frontMirror), null);
  });
  test('rotated edges are evaluated in mirror-local axes', () => {
    const mirror = mirrorFromYawPitch('tilted', { x: 3, y: 8, z: 2 }, 38, 23, 5, 4);
    const edge = add(mirror.center, scale(mirror.uAxis, 5));
    const origin = add(edge, scale(mirror.normal, 10));
    const hit = intersectMirror(ray(origin, scale(mirror.normal, -1)), mirror)!;
    nearVector(hit.point, edge);
    const missOrigin = add(origin, scale(mirror.uAxis, 0.001));
    assert.equal(intersectMirror(ray(missOrigin, scale(mirror.normal, -1)), mirror), null);
  });
  test('parallel, coplanar, behind-ray and surface-origin rays have no positive hit', () => {
    assert.equal(intersectMirror(ray({ x: 0, y: 0, z: -10 }, { x: 1, y: 0, z: 0 }), frontMirror), null);
    assert.equal(intersectMirror(ray({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), frontMirror), null);
    assert.equal(intersectMirror(ray({ x: 0, y: 0, z: 10 }, forward), frontMirror), null);
    assert.equal(intersectMirror(ray({ x: 0, y: 0, z: 0 }, forward), frontMirror), null);
  });
  test('single-sided backs pass through; two-sided backs reflect toward the incident side', () => {
    const backRay = ray({ x: 0, y: 0, z: 10 }, { x: 0, y: 0, z: -1 });
    assert.equal(intersectMirror(backRay, frontMirror), null);
    const hit = intersectMirror(backRay, { ...frontMirror, twoSided: true })!;
    near(hit.distanceCm, 10);
    nearVector(hit.normal, forward);
    nearVector(reflect(backRay.direction, hit.normal), forward);
  });
  test('the epsilon rejects self-intersections but admits a separated surface', () => {
    assert.equal(intersectMirror(ray({ x: 0, y: 0, z: -0.000001 }, forward), frontMirror), null);
    assert.ok(intersectMirror(ray({ x: 0, y: 0, z: -0.001 }, forward), frontMirror));
  });
  test('invalid mirror dimensions and non-tangent width axes fail clearly', () => {
    const incoming = ray({ x: 0, y: 0, z: -10 }, forward);
    assert.throws(() => intersectMirror(incoming, { ...frontMirror, halfWidthCm: 0 }), RangeError);
    assert.throws(() => intersectMirror(incoming, { ...frontMirror, uAxis: { x: 1, y: 0, z: 1 } }), RangeError);
  });
});

describe('sphere receivers', () => {
  const receiver = { id: 'sphere', center: { x: 0, y: 0, z: 10 }, radiusCm: 2 };
  test('takes the near surface, not the center or back surface', () => {
    const hit = intersectReceiver(ray({ x: 0, y: 0, z: 0 }, forward), receiver)!;
    near(hit.distanceCm, 8);
    nearVector(hit.point, { x: 0, y: 0, z: 8 });
  });
  test('tangent ray is a hit', () => {
    near(intersectReceiver(ray({ x: 2, y: 0, z: 0 }, forward), receiver)!.distanceCm, 10);
  });
  test('outside tangent and behind-ray spheres miss', () => {
    assert.equal(intersectReceiver(ray({ x: 2.001, y: 0, z: 0 }, forward), receiver), null);
    assert.equal(intersectReceiver(ray({ x: 0, y: 0, z: 20 }, forward), receiver), null);
  });
  test('inside sphere returns its positive exit', () => {
    near(intersectReceiver(ray(receiver.center, forward), receiver)!.distanceCm, 2);
  });
  test('receiver crossings work at nonzero X and Y', () => {
    const elevated = { id: 'high', center: { x: 6, y: 8, z: 0 }, radiusCm: 2 };
    near(intersectReceiver(ray({ x: 0, y: 0, z: 0 }, elevated.center), elevated)!.distanceCm, 8);
  });
  test('nonpositive radius is rejected', () => {
    assert.throws(() => intersectReceiver(ray(receiver.center, forward), { ...receiver, radiusCm: -1 }), RangeError);
  });
});

describe('nearest-event bounded tracing', () => {
  const incoming = ray({ x: 0, y: 0, z: -10 }, forward);
  test('mirror then receiver produces two contiguous segments with the correct length', () => {
    const result = traceRay(incoming, [frontMirror], [{ id: 'behind-source', center: { x: 0, y: 0, z: -20 }, radiusCm: 2 }]);
    assert.equal(result.hitReceiverId, 'behind-source');
    assert.equal(result.termination, 'receiver');
    assert.equal(result.hits.length, 1);
    assert.equal(result.segments.length, 2);
    nearVector(result.segments[0].to, result.segments[1].from);
    near(result.totalDistanceCm, 28);
    near(result.hits[0].incidenceAngleRad, result.hits[0].reflectionAngleRad);
  });
  test('nearest receiver wins regardless of receiver array order', () => {
    const nearReceiver = { id: 'near', center: { x: 0, y: 0, z: 0 }, radiusCm: 1 };
    const farReceiver = { id: 'far', center: { x: 0, y: 0, z: 5 }, radiusCm: 1 };
    for (const receivers of [[farReceiver, nearReceiver], [nearReceiver, farReceiver]]) {
      assert.equal(traceRay(incoming, [], receivers).hitReceiverId, 'near');
    }
  });
  test('a receiver before the mirror terminates without reflecting', () => {
    const result = traceRay(incoming, [frontMirror], [{ id: 'first', center: { x: 0, y: 0, z: -5 }, radiusCm: 1 }]);
    assert.equal(result.hitReceiverId, 'first');
    assert.equal(result.hits.length, 0);
  });
  test('nearest mirror occludes a farther mirror and a receiver behind it', () => {
    const far = { ...frontMirror, id: 'far', center: { x: 0, y: 0, z: 5 } };
    for (const mirrors of [[far, frontMirror], [frontMirror, far]]) {
      const result = traceRay(incoming, mirrors, [{ id: 'occluded', center: { x: 0, y: 0, z: 10 }, radiusCm: 1 }]);
      assert.equal(result.hits[0].mirrorId, 'front');
      assert.equal(result.hitReceiverId, null);
    }
  });
  test('a mirror wins an equal-distance receiver surface tie', () => {
    const result = traceRay(incoming, [frontMirror], [{ id: 'touching-back', center: { x: 0, y: 0, z: 1 }, radiusCm: 1 }]);
    assert.equal(result.hits[0].mirrorId, 'front');
    assert.equal(result.hitReceiverId, null);
  });
  test('a back face passes light to a receiver when the mirror is one-sided', () => {
    const result = traceRay(ray({ x: 0, y: 0, z: 10 }, { x: 0, y: 0, z: -1 }), [frontMirror],
      [{ id: 'through-back', center: { x: 0, y: 0, z: -10 }, radiusCm: 1 }]);
    assert.equal(result.hitReceiverId, 'through-back');
    assert.equal(result.hits.length, 0);
  });
  test('finite mirror misses continue straight', () => {
    const result = traceRay(ray({ x: 6, y: 0, z: -10 }, forward), [frontMirror],
      [{ id: 'beside-mirror', center: { x: 6, y: 0, z: 10 }, radiusCm: 1 }]);
    assert.equal(result.hitReceiverId, 'beside-mirror');
    assert.equal(result.hits.length, 0);
  });
  test('two mirrors route a ray through independent X and Y directions', () => {
    const first = { ...frontMirror, normal: normalize({ x: 1, y: 0, z: -1 }), uAxis: { x: 0, y: 1, z: 0 } };
    const second = { ...frontMirror, id: 'second', center: { x: 10, y: 0, z: 0 }, normal: normalize({ x: -1, y: 1, z: 0 }), uAxis: { x: 0, y: 0, z: 1 } };
    const result = traceRay(incoming, [second, first], [{ id: 'upper', center: { x: 10, y: 10, z: 0 }, radiusCm: 1 }]);
    assert.equal(result.hitReceiverId, 'upper');
    assert.equal(result.hits.length, 2);
    nearVector(result.hits[0].outgoing, { x: 1, y: 0, z: 0 });
    nearVector(result.hits[1].outgoing, { x: 0, y: 1, z: 0 });
    near(result.totalDistanceCm, 29);
  });
  test('bounce cap breaks an opposing-mirror loop after eight reflections', () => {
    const left = { ...frontMirror, id: 'left', normal: forward };
    const right = { ...frontMirror, id: 'right', center: { x: 0, y: 0, z: 10 } };
    const result = traceRay(ray({ x: 0, y: 0, z: 5 }, forward), [left, right], [], { maxDistanceCm: 1000 });
    assert.equal(result.termination, 'max-bounces');
    assert.equal(result.hits.length, 8);
    assert.equal(result.segments.length, 9);
    near(result.totalDistanceCm, 85);
  });
  test('zero reflections stops at the first mirror; one reflection can still reach a receiver', () => {
    const receiver = { id: 'return', center: { x: 0, y: 0, z: -20 }, radiusCm: 1 };
    const stopped = traceRay(incoming, [frontMirror], [receiver], { maxBounces: 0 });
    assert.equal(stopped.termination, 'max-bounces');
    assert.equal(stopped.hits.length, 0);
    assert.equal(traceRay(incoming, [frontMirror], [receiver], { maxBounces: 1 }).hitReceiverId, 'return');
  });
  test('range budget covers the whole reflected path, not each segment separately', () => {
    const result = traceRay(incoming, [frontMirror], [], { maxDistanceCm: 15 });
    assert.equal(result.termination, 'max-distance');
    near(result.totalDistanceCm, 15);
    nearVector(result.segments[1].to, { x: 0, y: 0, z: -5 });
  });
  test('range cap excludes an otherwise valid farther receiver', () => {
    const result = traceRay(incoming, [], [{ id: 'far', center: { x: 0, y: 0, z: 10 }, radiusCm: 1 }], { maxDistanceCm: 5 });
    assert.equal(result.hitReceiverId, null);
    near(result.totalDistanceCm, 5);
  });
  test('invalid trace limits are rejected', () => {
    for (const maxBounces of [-1, 1.5, 9, Infinity]) assert.throws(() => traceRay(incoming, [], [], { maxBounces }), RangeError);
    assert.throws(() => traceRay(incoming, [], [], { maxDistanceCm: 0 }), RangeError);
    assert.throws(() => traceRay(incoming, [], [], { epsilonCm: -1 }), RangeError);
  });
});

describe('live garden achievement flow', () => {
  // A geometric derivation is a test oracle only. Runtime code has no answers.
  const aimAt = (target: Vec3): { yawDeg: number; pitchDeg: number } => {
    const outgoing = normalize(subtract(target, GARDEN_MIRROR_CENTER));
    const normal = normalize(subtract(outgoing, GARDEN_SOURCE.direction));
    return { yawDeg: Math.atan2(-normal.x, -normal.z) * 180 / Math.PI, pitchDeg: Math.asin(normal.y) * 180 / Math.PI };
  };
  test('three receivers occupy distinct heights within the workbench footprint', () => {
    assert.equal(new Set(GARDEN_RECEIVERS.map(receiver => receiver.center.y)).size, 3);
    for (const receiver of GARDEN_RECEIVERS) {
      assert.ok(Math.abs(receiver.center.x) + receiver.radiusCm <= 35);
      assert.ok(Math.abs(receiver.center.z) + receiver.radiusCm <= 35);
    }
  });
  test('clean start is an unearned miss', () => {
    const frame = evaluateGarden(createGardenState());
    assert.equal(frame.trace.hitReceiverId, null);
    assert.equal(frame.newlyEarnedReceiverId, null);
    assert.equal(frame.complete, false);
    assert.deepEqual(frame.state.earnedReceiverIds, []);
  });
  test('each elevated receiver is reachable through computed reflection', () => {
    for (const receiver of GARDEN_RECEIVERS) {
      const frame = evaluateGarden({ ...aimAt(receiver.center), earnedReceiverIds: [] });
      assert.equal(frame.trace.hitReceiverId, receiver.id);
      assert.equal(frame.newlyEarnedReceiverId, receiver.id);
      assert.equal(frame.trace.hits.length, 1);
      assert.ok(Math.abs(frame.trace.hits[0].outgoing.y) > 0.1);
      near(frame.trace.hits[0].incidenceAngleRad, frame.trace.hits[0].reflectionAngleRad);
    }
  });
  test('ordinary two-degree controls can reach every receiver without stored solution angles', () => {
    const found = new Set<string>();
    for (let yawDeg = -55; yawDeg <= 55; yawDeg += 2) {
      for (let pitchDeg = -30; pitchDeg <= 30; pitchDeg += 2) {
        const frame = evaluateGarden({ yawDeg, pitchDeg, earnedReceiverIds: [] });
        if (frame.trace.hitReceiverId) found.add(frame.trace.hitReceiverId);
      }
    }
    assert.deepEqual([...found].sort(), GARDEN_RECEIVERS.map(receiver => receiver.id).sort());
  });
  test('changing pitch and yaw changes the continuous beam direction', () => {
    const state = createGardenState();
    const a = rotateGarden(state, 1, 0);
    const b = rotateGarden(state, 2, 0);
    const c = rotateGarden(state, 2, 1);
    assert.ok(distance(a.trace.hits[0].outgoing, b.trace.hits[0].outgoing) > 0.01);
    assert.ok(distance(b.trace.hits[0].outgoing, c.trace.hits[0].outgoing) > 0.01);
    assert.deepEqual(state, createGardenState(), 'inputs remain immutable');
  });
  test('moving away removes the live hit, preserves earned bloom and does not double-award', () => {
    const target = GARDEN_RECEIVERS[0];
    const hit = evaluateGarden({ ...aimAt(target.center), earnedReceiverIds: [] });
    assert.equal(evaluateGarden(hit.state).newlyEarnedReceiverId, null);
    const away = rotateGarden(hit.state, -50, -20);
    assert.equal(away.trace.hitReceiverId, null);
    assert.deepEqual(away.state.earnedReceiverIds, [target.id]);
    assert.equal(away.newlyEarnedReceiverId, null);
  });
  test('completion requires three distinct geometric hits, then reset clears the full loop', () => {
    let state: GardenState = createGardenState();
    for (let index = 0; index < GARDEN_RECEIVERS.length; index++) {
      const angles = aimAt(GARDEN_RECEIVERS[index].center);
      const frame = rotateGarden(state, angles.yawDeg - state.yawDeg, angles.pitchDeg - state.pitchDeg);
      assert.equal(frame.newlyEarnedReceiverId, GARDEN_RECEIVERS[index].id);
      assert.equal(frame.complete, index === 2);
      state = frame.state;
    }
    const reset = evaluateGarden(createGardenState());
    assert.equal(reset.complete, false);
    assert.equal(reset.trace.hitReceiverId, null);
    assert.deepEqual(reset.state.earnedReceiverIds, []);
    assert.equal(reset.state.yawDeg, -55);
    assert.equal(reset.state.pitchDeg, -22);
  });
  test('rotation controls clamp to the authored manipulation envelope', () => {
    const frame = rotateGarden(createGardenState(), 1000, -1000);
    assert.equal(frame.state.yawDeg, GARDEN_ANGLE_LIMITS.maxYawDeg);
    assert.equal(frame.state.pitchDeg, GARDEN_ANGLE_LIMITS.minPitchDeg);
    assert.throws(() => rotateGarden(createGardenState(), NaN, 0), RangeError);
  });
});
