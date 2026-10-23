> Reviewed development record. Current presentation evidence is in [validation](../validation.md); earlier next steps remain historical.

# Production to Preview acceptance handoff

Historical handoff at 2026-10-24 03:10 SGT. The final acceptance update below supersedes its pending recording/test tasks. Root `LightWeave.esproj`, Lens Studio 5.23.2.26081320, native authorization true. Production has saved the project. Current Preview is run 2, reset through the real Replay button to 0/3 and −55°/−22°; both synthetic hands are free. Production will not write Assets, mutate Lens or refresh while Video owns the Preview. Root coordinates ownership.

## Observed stable contract

- Main component: `LightWeave/LightWeaveMain` on root `LightWeave` (`Assets/Scripts/LightWeaveMain.ts`). Typed getters `getGardenFrame()` (copy), `getBloomWeights()` (actual eased weights), `getAudioEvents()` (`{id,run,at}`), `getAcceptedInputCount()`, `getVisualFeedback()` (actual cloned render material colors and actual rim transforms), `getVisibleHintTargetIds()` (actual enabled hint roots); no gameplay setter.
- Buttons: `LightWeave/LightWeaveControls/BackPlate/Content/PanelLayout/Controls/ButtonRow/{YawMinus,YawPlus,PitchMinus,PitchPlus,Replay}`. Each is UIKit `Button`, with its real `.interactable`. Four angle actions are ±2°; trigger one event path.
- Text rows: `LightWeave/LightWeaveControls/BackPlate/Content/PanelLayout/{Instruction,Progress,Angles}`. Actual `Component.Text` is on each row.
- Mirror hit target: `LightWeave/LightWeaveMirrorHitTarget`. Runtime world center `(0,-26,-140)` cm, identity rotation and unit scale. Main creates its SIK Interactable and 20×22×18 cm box. Mirror art pose: `LightWeave/LightWeaveGarden/LightWeaveMirrorPose`.
- Visual flower roots: `LightWeave/LightWeaveGarden/LightWeave{Coral,Teal,Gold}`. Beneath each: `LightWeave{Color}Art/Scenes/Flower_{Color}_Closed/{Petals,PetalHighlights}`. Both renderers have actual `Bloom` blend shape. Inspect actual weights, not only Main getter.
- Beam pool: `LightWeave/LightWeaveGarden/LightWeaveBeamPool/LightWeaveBeamSegment{0,1}`. Wrapper origin is segment.from; +Z follows delta; Z scale is cm length. Imported child remains scale 100. One mirror means two optical segments, with only display-tail clipping for range misses.
- Source and receiver positions remain Core-authoritative. Common garden local→world transform is Y=180°, position `(0,-40,-140)`; UI root `(0,-47,-115)`.

## Measured final UI placement

Coordinates below are actual runtime world centimeters, after the accepted common garden transform `(0,-40,-140)` / `(0,180,0)` degrees and independent UI transform `(0,-47,-115)` / identity. The UI and mirror hit wrapper have unit world scale.

| Element | World center cm | Size cm |
|---|---|---|
| Yaw− | `(-18,-45.6,-114.32)` | 6×6 |
| Yaw+ | `(-10,-45.6,-114.32)` | 6×6 |
| Pitch− | `(-2,-45.6,-114.32)` | 6×6 |
| Pitch+ | `(6,-45.6,-114.32)` | 6×6 |
| Replay | `(16,-45.6,-114.32)` | 10×6 |
| Instruction | `(0,-40.4,-114.36)` | width 57.6, row height 3.2 |
| Progress | `(0,-50.7,-114.36)` | width 57.6, row height 3.0 |
| Angles | `(0,-54,-114.36)` | width 57.6, row height 2.4 |

The button row uses 2 cm gaps. Button text is another 0.08 cm forward. Actual bounds remain subject to the saved full-frame visual acceptance, not these positions alone.

## Actual input sequence already observed

Use fresh `QueryRuntimeSceneTool` lookup after a reset; unique IDs can change. Exact names with parent disambiguation work. Actual official Preview tool actions below succeeded (do not call Main or Core setters):

1. Replay button pinch resets to yaw −55/pitch −22, 0/3.
2. Mirror pinch hold, drag to world `(44.4394722581,-32.7323754281,-140)`, release → coral, about yaw 33.87894/pitch −8.53525, 1/3.
3. Re-grab the fixed mirror center, drag to `(-32.7508755416,-34.4436172217,-140)`, release → teal, about yaw −31.62281/pitch 8.35199, 2/3.
4. Re-grab, drag to `(20.1560096291,-33.4975361785,-140)`, release → gold, about yaw 8.68921/pitch 23.34705, 3/3.

Each drag was 1.2–1.6 seconds. These endpoints are input fixtures computed from geometry and confirmed through the actual controls, not gameplay answer tables. Note they are **world hand endpoint positions relative to each fresh grab at the fixed mirror**, not receiver coordinates. LEAF hand-drag APIs may take delta instead; adapt using the actual source signature.

Clamp-return was tested from initial state in one grab: world endpoint `(65,-26,-140)` then return to `(0,-26,-140)`, then release. Runtime max yaw was +65; final yaw −55.000017, pitch −22.000004. Mirror center stayed fixed. The later five-second LEAF scenario and 31.133-second held-drag recording satisfy the continuous-drag check.

Yaw+ pinched once: actual Text −55/−22 → −53/−22. Pitch+, Yaw−, Pitch− then restored −55/−22. Formal per-button assertions subsequently passed in `lightweave-start-controls`.

## Installed tooling and 5.23 differences

`AiPreviewAgentInspect.lspkg` and `AiPreviewAgentInteract.lspkg` v2.0.1 are installed. Their scripts share authored `AiPreviewAgent Handler`; Interact was attached after Inspect. Existing inspect depends on Leaf. Before adding LEAF use official installed-package/plugin checks, avoid duplicate handler roots. Package display names are misleadingly all `package`; inspect descriptions/actual files and IDs.

Current native `CapturePanelScreenshotTool` ignores `outputPath`/`saveToFile` despite advertised schema: response contains an ImageContent JPEG. Save its returned bytes as-is; never print base64. Capture and inspect real images. Preview is SPECS 27 / Interactive / Sunlit Room. The Preview dock was widened through official Dock API to 900 logical pixels, yielding 1800×1684 source image. Do not alter camera projection to mask framing.

`RunAndCollectLogsTool` tail contains unrelated account telemetry in raw `tail`; store only filtered LightWeave prints and relevant errors, never the raw tail. Recompile followed by refresh is required after source changes. A source write under Assets during an active drag caused an automatic reset and Release timeout; avoid concurrent edits. That isolated timeout was resolved by the changed source finishing compilation and a clean refresh.

VirtualScene 5.23 rejects `create.preset` and GLB `@asset:path` prefab lookup; creation can partially apply despite newer schema wording. Existing skeleton is complete. Do not rebuild it. Proven prefab addressing was `@id:<verified ObjectPrefab UUID>`. No raw HTTP, package edits or Cache mutations.

`MovePreviewCamera` 5.23 uses **top-level x/y/z** for `lookAt` (the newer `target` object is refused). Its `rotate(yaw:35)` produced an unexpected axis pose, so do not use relative rotate for evidence. Proven absolute view targets: starting camera position `(0,0,0)`, `lookAt(x:0,y:-29.7579178,z:-140)` returns camera rotation `(348,0,0)` = pitch −12°; look-away `x:-100,y:-29.7579178,z:-140` returns about `(350.19,35.54,360)`. Restore the first target after view tests. Generic reset alone returns pitch 0°, which is not the accepted initial view.

## Evidence at handoff (historical)

- Actual runtime start and second complete captures: `lightweave-front-start.jpg`, `lightweave-front-complete.jpg`. Root has accepted previous complete framing; these latest views include near-front flowers.
- Runtime cue evidence and boundary trace: `preview-integration-evidence.json`; script/asset fingerprints: `build-manifest.json`. Current logs show no errors and run-2 blooms once per color; completion delay 0.32149 seconds.
- Verify real blendshape weights/animation timing, latch/hold/miss and Replay rearm; uninterrupted 0→3→Replay→0→3 capture; side viewpoint ≥20 cm; all audio components mixToSnap, recorded audio track and actual listening across two ambient loops.
- Live-hit feedback and mirror hover/grab feedback are now implemented and observed; see `visual-feedback-evidence.md`. Actual `baseColorFactor` values are sampled through `getVisualFeedback()`. Live receivers mix 42% toward white and their rim pulses at 1.06 ± 0.025 scale; miss restores base color/scale while earned morphs stay open.
- Direction hints now run in `Assets/Scripts/LightWeaveDirectionHints.ts`, wired from Main Update. Actual paths `LightWeave/LightWeaveDirectionHints/DirectionHint_{coral,teal,gold}/{LowerArm,UpperArm}`. Arms are noninteractive UIKit RoundedRectangle visuals. `getVisibleHintTargetIds()` reads actual enabled hierarchy. Initial view: none; official camera look-away: three; return: none; after real coral earn then same look-away: only teal and gold. See `lightweave-direction-hints.jpg`. Source geometry diameter is ≤1.933 cm; runtime world scales were 1. The generic mesh bounds are conservative for shader-built RoundedRectangle; LEAF may read actual RoundedRectangle.size (about 1.5743×0.12) and cornerRadius 0.06, rather than treating source mesh AABB as rendered outline.
- Latest full initial frame after all feature integration is `lightweave-final-build-start.jpg`; current error slice is empty. Prior two full runs predate these presentation-only additions; LEAF and the uninterrupted recording must cover the final candidate.
- Preview synthetic inputs do not establish hardware hand-tracking. No headset or publication result is claimed.

## Version 1 acceptance update — 2026-10-24

All five final LEAF scenarios passed: start-controls, drag-retention, connections-audio, replay-repeat, and pending-cue-cancel. The actual runtime tests measured flower opening at 0.8218–0.8330 s, completion cue emission at 0.3071 s, and cancellation through actual Replay at 0.2414 s after the final hit. Product timing was unchanged.

A continuous 260.697-second native recording shows two complete runs and Replay, plus actual player viewpoints at ±25 cm. A separate 31.133-second recording shows one held grab with six seconds outward and six seconds back. The original source transitions and final 150.021333-second edit were visually reviewed. The final edit preserves Preview audio, fits the complete picture beside English captions, and decodes successfully.

The public [validation report](../validation.md) records scenario results, measured views, source and final-media fingerprints. Root verified that the six runtime script fingerprints in `build-manifest.json` still match the reviewed source. Automated and visual checks pass design criteria 1, 2, 3 and 5. Criterion 4 has passed event and signal checks; a user listening question is pending. Technical measurements are not a subjective listening result.

The first opening of an exported project uses the local editor's Preview layout and viewing direction. Widen Preview and look approximately 12° downward to reproduce the reviewed composition; the public README includes these setup steps. Public posting and submission remain separate stages.

## Version 2 presentation update — 2026-10-24

User feedback requested clearer visual meaning after viewing the original sound-review segment. The revised opening states the goal, labels the actual light source, mirror and three flower buds, and shows the first real hit opening a flower and advancing progress to 1/3. These labels are editorial annotations in the movie; no Lens scene or script changed.

The v2 edit is 125.021333 seconds. Its sequence follows first-run 0→1→2→3, actual Replay, then second-run 0→1→2→3. It uses only the recorded Preview footage, original audio, and revised English explanation. Root reviewed the opening role labels and final contact sheet; Anti checked the pointer endpoints across the mirror rotation. The final gold flower is fully open with 3/3 before the closing invitation. The user has been shown the 20-second opening and asked whether the gameplay is clear; that response and explicit subjective audio feedback remain pending.

Current captioned movie: `LightWeave-demo-v2-captioned.mp4`, SHA-256 `974ede5e9d5478fb735d9b7726c8edaf276525d6a9418dc064977c2bcd557962`. Clean movie SHA-256 `3a22a5271e95a234f972605cab470cd689c4dae066cf42351d5fe6c565b30435`. Public validation and the version 2 script identify the current edit; v1 remains a preserved prior version. Original runtime, 40 core tests and 5 LEAF results are unchanged.
