
> Reviewed development record, retained for its technical evidence. Dates and next steps describe the stage when it was written. See [delivery status](../../DELIVERY_STATUS.md) for the delivery scope.

# LightWeave optical core and numerical evidence

Updated 2026-10-24 SGT. Owner: Optics Supervisor.

## Verified result

The standalone optical core passes **40 tests in 5 suites** on Node **v22.16.0**. It computes finite mirror intersections, three-dimensional reflection, spherical receiver hits, bounded multi-mirror paths and earned garden progress. The only production source is [`Assets/Scripts/Core/`](../../Assets/Scripts/Core/); the former `src/core/` has no source files.

Reproduce from the project root:

```sh
node scripts/test-optics.mjs
```

The command uses Node's built-in TypeScript stripping and test runner. A scoped in-memory resolution hook maps extensionless Core imports to the same `.ts` files, preserving one source for Node and Lens. It requires no package installation. The observed result is `tests 40`, `pass 40`, `fail 0`, `skipped 0`. This verifies the numerical library and its pure state transitions. Lens compilation, Lens rendering, SIK inputs, LEAF scenarios and device behavior remain separate integration evidence. Native type stripping does not perform static TypeScript type checking.

## Interface contract

All vectors are ordinary `{ x, y, z }` objects. Every position, radius, half-extent, path length and spatial epsilon is in **centimetres**. Inputs remain unchanged. Functions do not use Lens APIs, DOM APIs, timers or scene components.

| Export | Contract |
| --- | --- |
| `reflect(direction, normal)` | Normalizes inputs and returns the unit vector `d - 2(d·n)n`. |
| `intersectMirror(ray, mirror, epsilonCm?)` | Returns `{ distanceCm, point, normal }` or `null` for a finite rectangle. |
| `intersectReceiver(ray, receiver, epsilonCm?)` | Returns `{ distanceCm, point }` or `null` for a spherical receiver. |
| `traceRay(ray, mirrors, receivers, options?)` | Returns `{ segments, hits, hitReceiverId, termination, totalDistanceCm }`. Supports multiple mirrors. |
| `mirrorFromYawPitch(id, center, yawDeg, pitchDeg, halfWidthCm?, halfHeightCm?)` | Creates a mirror with a transformed normal and width tangent. Defaults to a 16 × 18 cm mirror. |
| `createGardenState()` | Fresh `{ yawDeg: -55, pitchDeg: -22, earnedReceiverIds: [] }` state. |
| `evaluateGarden(state)` | Traces the current geometry and returns `GardenFrame`. |
| `rotateGarden(state, deltaYawDeg, deltaPitchDeg)` | Clamps angle changes to the authored range and evaluates the resulting geometry. |

`Mirror` contains `id`, `center`, `normal`, `uAxis`, `halfWidthCm`, `halfHeightCm` and optional `twoSided`. The width tangent must be perpendicular to the normal. `Receiver` contains `id`, `center` and `radiusCm`. Scene object IDs should be unique.

`BeamSegment` contains `from`, `to`, `endKind` (`mirror`, `receiver` or `range`), and optional `objectId`. Each mirror bounce in `hits` contains `mirrorId`, `point`, `normal`, `incoming`, `outgoing`, `incidenceAngleRad` and `reflectionAngleRad`. Angles in bounce evidence are **radians**; control angles are **degrees**.

`GardenFrame` contains `state`, `mirror`, `trace`, `newlyEarnedReceiverId` and `complete`. Use `trace.hitReceiverId` for the current live illumination, `state.earnedReceiverIds` for latched bloom visuals and `newlyEarnedReceiverId` for a one-shot celebration. `complete` becomes true when three distinct receivers have been reached.

Example control flow:

```ts
let frame = evaluateGarden(createGardenState());

// A yaw button only changes yaw. Render from the returned geometry/state.
frame = rotateGarden(frame.state, 2, 0);

// A pitch button only changes pitch.
frame = rotateGarden(frame.state, 0, 2);

// Reset clears earned progress and recomputes the initial live beam.
frame = evaluateGarden(createGardenState());
```

The runtime has no solution-angle table or solve action. Tests independently derive optical orientations and also search a two-degree manipulation grid to verify that every receiver is reachable with ordinary controls. The persisted `earnedReceiverIds` input is internal session state: adapters must carry it forward from returned frames rather than populate it from unrelated UI events.

## Geometry and rendering alignment

The authored workbench occupies a 70 × 70 cm footprint in local X/Z. Source: `(0, 14, -30)`, direction `+Z`; mirror center: `(0, 14, 0)`; three receiver centers: coral `(-26, 7, -10)`, teal `(25, 21, -12)`, gold `(-7, 34, -18)`, each radius 4 cm. All three reachable routes have a vertical component. Yaw controls span −65° through +65°; pitch spans −35° through +35°.

The unrotated mirror's reflective normal is local `(0, 0, -1)`, with its width along +X. Render its orientation by applying **X pitch followed by Y yaw**, the same `Y * X` rotation used in the model. Parent the source, mirror, receiver meshes and beam segments under the same workbench transform.

Lens uses a right-handed coordinate system, and an identity camera looks toward −Z. To present the mirror's reflective side to such a camera, place the workbench in front of the camera and rotate its whole parent 180° around Y, or observe it from its local −Z side. Flipping only the mirror would desynchronize its visible orientation from its computed normal. Final placement and readability require inspection in Lens Preview.

## Deliberate intersection rules

- Ray directions and mirror normals are normalized before computation, so returned distances are centimetres.
- Finite rectangle boundaries are inclusive, with a 0.00001 cm default positional tolerance. Outside rays continue straight.
- Parallel and coplanar rays do not create a mirror hit. Intersections behind the ray or at `t <= epsilonCm` are ignored.
- Mirrors are one-sided by default. Back-face rays pass through. `twoSided: true` reflects from either side and faces the returned normal toward the incoming ray. The visual material should communicate the chosen sidedness.
- Sphere tangency counts as a hit. A ray originating inside a receiver hits its positive exit surface.
- The nearest positive intersection wins; a mirror wins a receiver tie within epsilon. Avoid geometrically coincident duplicate objects, whose exact tied identity is not a gameplay mechanic.
- Receivers terminate the beam. Already-earned receivers remain geometrically present and can still receive light.
- `maxBounces` accepts integers from 0 through 8. After the last allowed reflection, a receiver remains reachable; a further mirror terminates as `max-bounces`.
- `maxDistanceCm` is one total path budget, default 300 cm (150 cm for the garden). It terminates as `max-distance`. A hit receiver terminates as `receiver`.
- Self-intersections are excluded by positive-distance epsilon. Segment endpoints remain contiguous without an artificial origin offset.

## Direct numerical checks

| Suite | Tests | Meaningful observed cases |
| --- | ---: | --- |
| Vectors and reflection | 5 | Normal incidence reverses direction; a 45° normal turns +Z to +X; 63 three-dimensional orientations preserve tangential components, reverse normal components and equate incidence/reflection angles. |
| Finite mirrors | 8 | Unnormalized rays return physical distances; edges/corners hit; outside-width/height rays miss; tilted edges follow local axes; parallel/coplanar/behind/self/back-face cases obey the stated rules. |
| Sphere receivers | 6 | Near surface wins; tangency hits; near-tangent and behind-ray cases miss; inside-origin ray exits; elevated receiver coordinates work. |
| Bounded tracing | 13 | Nearest receiver and mirror win regardless of list order for distinct depths; mirror occludes a farther target; a two-mirror path goes +Z → +X → +Y; opposing mirrors stop after 8 reflections and 85 cm rather than looping. |
| Garden state | 8 | Three distinct target heights; clean-start miss; all receivers reachable geometrically and by a two-degree control grid; continuous response; moving away removes the live hit without erasing earned progress; completion then reset. |

The two-mirror fixture has a measured computed path length of 29 cm: 10 cm to mirror one, 10 cm to mirror two, then 9 cm to the receiver's near surface. The normal-incidence return fixture totals 28 cm. These fixtures check actual optical distances rather than only object IDs.

## Handoff and fingerprints

Lens Logger reported `TS5097` for explicit `.ts` import suffixes. The Core imports/exports and test imports now use extensionless paths. `scripts/test-optics.mjs` registers an in-memory Node resolution hook scoped to `Assets/Scripts/Core/`; it appends `.ts` only while loading that single source for tests. No source copy, dependency, cache edit or Lens compiler configuration change is required. The same 40 numerical tests passed after this compatibility correction; mathematical and game-state behavior is unchanged. Production owns the subsequent actual Lens Logger recheck.

Next action: the Production Supervisor verifies the compiler result, binds angle controls, renders the returned geometry, and verifies clean start → three earned blooms → reset in actual Lens Preview.

SHA-256 after the extensionless-import compatibility fix and 40-test rerun:

| File | SHA-256 |
| --- | --- |
| `Assets/Scripts/Core/vector.ts` | `2ce5f2cfb0ac193c003de3cfdd3806aa2d329966743afd3773f67346a98c9742` |
| `Assets/Scripts/Core/optics.ts` | `67b00f41abc80ab0a4532e3b46486528ccb8f8bc01a0fbc3da2ea2fedc6ccd8c` |
| `Assets/Scripts/Core/garden.ts` | `5638cfc3474520068cce8a95668680ba23f9aa54018c02db556812241b32c76a` |
| `Assets/Scripts/Core/index.ts` | `5b88835d08ed60d785e2a40771a7765f0d1ec98cd5b1e6a0fce1b4a6846f5895` |
| `tests/core/optics.test.ts` | `532f75f9fcfb65a32bb66bea995de675b701b53f07841d4fe5a9058be6491abc` |
| `scripts/test-optics.mjs` | `1c15df6e0cbd83c9d98f387f888c401ef93fbbae71ca84728bd1af1239b1f366` |
