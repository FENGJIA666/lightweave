# LightWeave validation

Recorded 24 October 2026 (Singapore). The tested product uses one mirror and three receivers.

## Numerical core

`node scripts/test-optics.mjs` passes **40 tests in 5 suites** on Node 22.16.0: vectors/reflection (5), finite mirrors (8), spherical receivers (6), bounded ray tracing (13), and garden state (8). These exercise the same `Assets/Scripts/Core/` source used by Lens. The two-mirror cases are library fixtures; the experience uses one mirror. This result covers numerical geometry and pure state transitions.

## Live Preview integration

All five scenarios passed in **Lens Studio 5.23.2 desktop Preview**, using LEAF 2.0.0 and the actual SIK/UIKit Interactables. Tests drive the interaction framework and inspect read-only controller snapshots, actual mesh blendshapes and material values; they do not assign solution state or rotate the product directly.

| Scenario ID | Observed result |
| --- | --- |
| `lightweave-start-controls` | PASS — initial 0/3 and closed meshes; four actual controls each change exactly one axis by ±2°; Replay restores initial state. |
| `lightweave-drag-retention` | PASS — continuous 5-second drag sampled across 150 frames; yaw/pitch retained after release; bounds and return from an overshoot verified. |
| `lightweave-connections-audio` | PASS — three geometrically distinct hits open both petal meshes for each flower, retain earned blooms on a miss, restore live receiver feedback, and emit one-shot cue events. |
| `lightweave-replay-repeat` | PASS — two complete three-flower runs through actual inputs; Replay clears progress, closes petals and rearms per-run cue events. |
| `lightweave-pending-cue-cancel` | PASS — Replay 0.2414 s after the last hit cancels that run's pending completion cue. |

Measured opening times to the test's open threshold were **0.8330 s (coral), 0.8218 s (teal), and 0.8268 s (gold)**. Completion cue emission followed the final hit by **0.3071 s**. A three-second continued hit did not duplicate progress or its bloom cue.

These are desktop Preview integration results. Hardware tracking, on-device performance and user comfort are separate validation scopes.

The common garden parent is at **(0, −40, −140) cm**, rotated 180° about Y with unit scale. Runtime receiver centers read back as coral **(26, −33, −130)**, teal **(−25, −19, −128)** and gold **(7, −6, −122) cm**. The Core uses analytic 4 cm ray–sphere intersections. The same-center rendered spheres are authored at 0.04 m and retain the imported 100× unit conversion. There are no separate receiver Physics colliders.

## Genuine recorded evidence

`media/video/raw/LightWeave-native-two-runs.mp4` is one continuous native Preview recording: **260.697 s**, 1800×1684, 30 fps, H.264 with the original 44.1 kHz mono AAC track. It contains the complete sequence **0→1→2→3→Replay→0→1→2→3**, with no Preview reset or LEAF launch during recording. The visible interaction is driven through the official SIK Preview agent. The room is the Lens Studio Sunlit Room preview environment.

An independent frame review located these transitions to 0.2-second sampling intervals:

| Transition | Source seconds |
| --- | --- |
| First run: coral | (100.6, 100.8] |
| First run: teal | (156.6, 156.8] |
| First run: gold / complete | (168.4, 168.6] |
| Replay: 3/3 to 0/3 | (207.0, 207.2] |
| Second run: coral | (220.2, 220.4] |
| Second run: teal | (234.8, 235.0] |
| Second run: gold / complete | (242.4, 242.6] |

Actual interactive Preview camera positions were read back at **(+25,0,0) cm** and **(−25,0,0) cm**, looking toward the garden. Representative views show the elevated beam, all flowers and the entire controls panel. They are actual player-view Preview frames rather than an independent orthographic inspection render.

`media/video/raw/LightWeave-native-continuous-drag.mp4` provides an additional 31.133-second native take: one held grab, a six-second outward drag and six-second return, then release. The visible mirror and beam move while the garden remains 0/3; the initial angles return. The final edit uses seconds 7–27 of this take.

Source SHA-256:

```
17affca0b1bc2c1f732c3d3782a0a45f4ef874477b1a28a417bc4a01a27d2d0d  LightWeave-native-two-runs.mp4
236c3568a201c83c259ac7ae861477bd880e4c584be5d075c62f4f383c55aaa5  LightWeave-native-continuous-drag.mp4
```

## Audio and presentation review

The complete native master decodes successfully. Its audio/video both begin at timestamp zero and their durations differ by less than 1 ms. The decoded original audio peak is **−12.61 dBFS**, with no NaN or infinite samples. The original audio is preserved in the edited demonstration; narration is separately recorded standard macOS synthetic speech.

The 95-second `LightWeave-runtime-sound-review.mp4` contains untouched-level selections of the original sound and picture: master seconds **0–32, 94–112, 151–179, and 205–222**. This covers at least two 16-second ambient loops, the three bloom cues, completion and Replay. User listening feedback is pending; technical signal checks are not a listening result.

The 150-second editorial timeline is in `media/video/edit.json`. All nine beats use reviewed native Preview footage, full-frame fit, source fingerprints and original audio. Titles and captions occupy a separate right column so they do not cover the flowers or controls. Final encoded-output metrics and visual inspection are recorded with the deliverable technical report.

Both captioned and clean exports are **150.021333 s**, H.264 1920×1080 at 30 fps with 48 kHz stereo AAC, and decode successfully. The captioned mix measures **−16.2 LUFS integrated**, **−4.3 dBFS true peak**. Three narration-free comparison windows retain the original source audio with correlation above **0.99995** and gain approximately **0.849**, matching the configured 0.85. The common AAC packet shift is 21.333 ms; video starts at 21.029 ms, so this measured source audio/video difference is under 1 ms.

A 30-frame contact sheet and full-resolution opening, drag, coral, completion, side-view, Replay and closing frames were inspected. All three flowers and the controls remain visible, and editorial text stays outside the Preview. The original full-run transitions were independently checked. Subjective listening remains pending.

| Final beat | Source range (seconds) |
| --- | --- |
| Hook | master 5–17 |
| Spatial layout | master 47–63 |
| Mirror interaction | continuous-drag take 7–27 |
| First bloom | master 97–114 |
| New angle | master 122–142 |
| Completion | master 154–179 |
| Achievement | master 180–200 |
| Replay | master 206–220 |
| Closing | master 246–252 |

```
3a60918c99ca960adad121cfcd5934001c61482e4a11dafc7a2974ff94d13ca9  LightWeave-demo-captioned.mp4
c06c5099db31573966947328d1f64d34f400a497169a0d13e54f5470767675df  LightWeave-demo-clean.mp4
```
