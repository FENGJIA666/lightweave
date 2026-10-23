
> Reviewed development record, retained for its technical evidence. Dates and next steps describe the stage when it was written. See [delivery status](../../DELIVERY_STATUS.md) for the delivery scope.

# Player-facing flower orientation validation

Date: 2026-10-24, Asia/Singapore. Art Supervisor; local geometry inspection only. Root approved these visual-wrapper poses for Production to apply through the official scene workflow. This document records numerical geometry evidence, not Preview or device acceptance. No runtime scene or Core file was edited by Art Supervisor.

## Selected poses

Asset-local front remains **−Z**. Apply `Ry(yaw) × Rx(pitch)` to each unit-scale visual wrapper in garden-local coordinates; the Euler values below are degrees. Preserve the imported asset's 100× meter-to-centimeter scale inside that wrapper.

| Flower | Receiver center, cm | Editor Euler `(x, y, z)` | Yaw / pitch | Front-to-authored-camera angle |
| --- | --- | --- | --- | --- |
| Coral | `(-26, 7, -10)` | `(0, -15, 0)` | `-15 / 0` | 14.45° |
| Teal | `(25, 21, -12)` | `(0, 15, 0)` | `15 / 0` | 9.18° |
| Gold | `(-7, 34, -18)` | `(-25, -10, 0)` | `-10 / -25` | 28.56° |

All three optical spheres remain radius **4 cm**, at their existing centers. Mirror center remains `(0, 14, 0)`. Core reflection, hit detection, mirror angle limits, progress and scoring remain unchanged. These are manager-selected visual defaults, not user-specified numbers.

The table was recalculated for the current [Production handoff](production-to-video-handoff.md): garden transform `(0, -40, -140)`, Y rotation 180°, camera position `(0, 0, 0)` and camera X rotation −12°. This places the camera at `(0, 40, -140)` in garden-local coordinates. Each angle is between the flower's front vector and the vector from its center to the camera position. Camera rotation affects framing, not this geometric angle; tracked viewpoints still require direct visual verification. The common garden translation does not change the mirror-to-flower clearance results below.

Historical first-render diagnosis used the earlier garden height −20 cm and identity camera. The original mirror-facing poses then produced angles of 98.01°, 104.03° and 123.09°, explaining the old side/back silhouettes. The formerly reported selected-pose angles 6.70° / 3.97° / 19.55° belonged to that earlier placement and are superseded by the table above.

## Geometry and method

Input geometry: revision-2 `media/art/data/Flower_{coral,teal,gold}.json`. The three colors share identical positions, indices and morph geometry. JSON positions are rounded to six decimals in centimeters; GLB export uses float32 meters. This sub-micrometer nominal export rounding is far below the measured centimeter-scale margins. The preceding revision check confirmed that all six GLBs retained byte-identical base POSITION and morph POSITION arrays.

Inspected decorations: `Petals`, `PetalHighlights`, `ReceiverRim`, `Stem`, and `StemBud`. The receiver and its center pearl are intentional beam targets and are excluded from decoration-obstruction counts.

1. Transform each decoration triangle into garden coordinates using the proposed rotation and unchanged receiver center.
2. Define the center ray from the mirror center toward the receiver center. Stop the tested segment at its **first intersection with the radius-4 sphere**, not at the center behind the sphere's surface.
3. For each triangle, construct an axis-aligned bounding box containing its three closed vertices and three bloom vertices. Every linearly interpolated triangle lies inside this box for the entire morph interval `[0, 1]`. The runtime easing only changes how that interval is traversed.
4. Test the center segment against every swept box using the three-axis slab interval method. Inflate boxes by **0.22 cm** on every axis to conservatively enclose the current golden beam radius. Zero box intersections prove this center beam is clear of the tested decorations throughout the full morph, including between sampled frames.
5. Increase the same box inflation in 0.005 cm steps to report conservative lower bounds on clearance. These are bounds from a conservative envelope, not exact closest-surface distances.
6. Directly test triangle intersections using double-sided Möller–Trumbore segment tests. For each flower, test 161 sphere-hitting rays: the center ray plus 32 azimuths at each of 25%, 50%, 75%, 95%, and 99.5% of the sphere's apparent angular radius `asin(4 / distance(mirror, center))`. Stop every ray at its first analytic sphere intersection. Test morph weights `0, 0.05, …, 1` (21 states). Separately check the center ray at 101 morph weights.
7. Test all 161 rays against the other two flowers' swept decoration boxes, again inflated by 0.22 cm. This checks cross-flower occlusion throughout the continuous morph interval for those sampled rays.

## Results

| Flower | Center beam: swept-box intersections, including 0.22 cm radius | Center beam: conservative clearance lower bound | Direct triangle hits: 161 rays × 21 morph states | Center triangle hits: 101 states |
| --- | --- | --- | --- | --- |
| Coral | 0 | 2.735 cm | 0 | 0 |
| Teal | 0 | 2.230 cm | 0 | 0 |
| Gold | 0 | 1.770 cm | 0 | 0 |

Each of the five decoration parts independently had zero direct triangle hits in the selected poses. All six cross-flower ray/decoration combinations had zero swept-box intersections out of 161 rays each.

The center-beam check covers continuous morph and beam radius. The off-center triangle checks sample ray directions and morph weights; they are not a proof for every possible grazing ray or every off-center beam thickness. Actual input, rendering, depth behavior and full bloom silhouettes remain Production's Preview checks.

A gold candidate at yaw 0°, pitch −20° passed the center ray but intersected decorations on some near-edge rays. It was rejected. The selected yaw −10°, pitch −25° passed the same checks while keeping the flower close to a frontal view.

## Revision-2 asset fingerprints

| Asset, relative to `media/art/glb/` | SHA-256 |
| --- | --- |
| `Flower_Coral_Closed.glb` | `547d8a82ffbd6d8d8d88e0723b4b5ff0c36dea0ac979c8678d205ec217ea5619` |
| `Flower_Teal_Closed.glb` | `0e1af0fa30d2932cf7c8c260305863500d42e95b4a92681a739fdafaaac1ddb6` |
| `Flower_Gold_Closed.glb` | `7988da968ed16a80a13b16d3c72890e28308871a79b09100f266dd13fbefd999` |

The revision reverses only Petals/PetalHighlights winding and recalculates their base/morph normals. Vertex shapes, sphere meshes, materials, animation, and other submeshes remain unchanged. Per-petal signed volumes are positive in closed and bloom states. Detailed before/after checks are in [validation.json](../../media/art/validation.json); current fingerprints are in [manifest.json](../../media/art/manifest.json).

The original gold sphere was complete: 224 outward-facing triangles, 112 in each hemisphere, with 144 outward normals. The old gold horizontal cut was not attributed to that sphere geometry. Neither the normal revision nor this orientation calculation claims to resolve that runtime cut; Production owns its direct verification.

See [art direction](art-direction.md) for the current placement contract and [UI handoff](LightWeaveControlsUI.md) for the independent control hierarchy.
