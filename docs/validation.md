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

`media/video/raw/LightWeave-native-continuous-drag.mp4` provides an additional 31.133-second native take: one held grab, a six-second outward drag and six-second return, then release. The visible mirror and beam move while the garden remains 0/3; the initial angles return. The historical v1 edit uses seconds 7–27 of this take; it remains a separate continuous-drag evidence source for v2.

Source SHA-256:

```
17affca0b1bc2c1f732c3d3782a0a45f4ef874477b1a28a417bc4a01a27d2d0d  LightWeave-native-two-runs.mp4
236c3568a201c83c259ac7ae861477bd880e4c584be5d075c62f4f383c55aaa5  LightWeave-native-continuous-drag.mp4
```

## Public narration and presentation

The current [public demonstration](https://youtu.be/N6D_f7aWozo) uses the same 125-second picture sequence and captions as the reviewed v2 edit. H.264 packet hashes match the previous captioned and clean versions exactly. The full three-flower view, pointer labels, real bloom transitions, Replay and second run therefore retain their reviewed images.

All **21 narration cues** were generated locally using **Kokoro-82M v1.0**, official **af_heart**, and Kokoro **0.9.4**. Their text and caption windows are unchanged. Each generated cue fits its window; the maximum measured tempo adjustment is **1.3457×**. Word tokens have phoneme records, and the retained raw speech tails are below −65 dBFS over their last 75 ms. The new closing line ends at **124.398125 s**, within the final 124.41-second caption boundary. [Voice timing](../media/video/v2-public/voice-sync.json) records every cue. These objective checks do not substitute for subjective listening.

The mixer takes audio solely from the native Preview recording and the newly generated Kokoro PCM tracks. The previous v2 files supply **video only**. [The replacement report](../media/video/v2-public/evidence/public-replacement-report.json) records all native and narration inputs with hashes. Both public versions have identical AAC packet hashes.

The captioned and clean exports are each **125.021029 s**, **3,750 frames**, H.264 1920×1080 at 30 fps, with 48 kHz stereo AAC. Both decode successfully. The new mix measures **−17.6 LUFS integrated** and **−4.2 dBFS true peak**. Two narration-free native-audio windows have correlation **0.999935** and **0.999950**, with gain **0.84819** and **0.84845**. Native audio alignment differs from the video start by approximately **0.00817 ms**. [Audio checks](../media/video/v2-public/evidence/public-audio-checks.json) record the measured windows and timing.

| Public film | SHA-256 |
| --- | --- |
| Captioned | `633c103f363e1be67122db242d3f02434ca4195678386cd214e6606da8835cda` |
| Clean | `8276d9e92c057be047bc3e2ba0f75a854a18e554fcebf72192d91bd497dee3ff` |

The original optical source, all 77 runnable files, 40 numerical test results and five desktop Preview LEAF results are unchanged. This presentation revision adds no hardware validation claim. User comprehension feedback and subjective listening approval remain pending.

## License and reproduction

[The narration notice](../media/video/v2-public/license/README.md) preserves the official Apache-2.0 source declarations, upstream snapshots, model and voice fingerprints, and dependency versions. [The public script](presentation/video-script-v2-public-en.md), [edit record](../media/video/v2-public/edit.json) and [reproduction guide](../media/video/v2-public/REPRODUCE.md) identify the revised delivery.

The original [v1 validation](validation-v1.md) and [v2 local-review validation](validation-v2-local-review.md) retain their prior measurements and movie hashes. They do not identify the current public soundtrack. The Lens repository is directly openable; movie reproduction additionally requires the declared external native capture, previous picture-only inputs and official model artifacts.
