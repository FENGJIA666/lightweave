---
status: approved-by-delegated-manager
acceptance: automated-and-visual-checks-passed-user-listening-pending
decision_owner: delegated-main-manager
project: LightWeave / Photon Garden
planning_method: official-plan-lens-with-user-authorized-manager-delegation
learner_interview: not-conducted
user_item_by_item_signoff: not-claimed
build_status: official-clad-build-verified
preview_status: continuous-two-runs-recorded-and-visually-reviewed
leaf_status: five-scenarios-passed
updated: 2026-10-24
---

# Design brief: LightWeave

**Shape the light. Watch your world bloom.**

This design was determined by the Main Manager under the user's explicit delegation to the manager team. The user requested enthusiastic, achievement-focused presentation and delegated work allocation and production decisions. The design below records manager decisions, not invented interview answers or item-by-item user approval. [Planning workflow and authority](planning-workflow.md).

All design quantities below are **(manager defaults)** unless identified as measured evidence or part of the preserved official template. Existing core/asset values are adopted manager defaults. They are adjustable through recorded design decisions after Preview inspection; numerical tests and offline assets do not establish runtime acceptance.

## The one spatial moment

The player pinches and drags one mirror, watches a golden beam change direction through the surrounding space, and connects it to a luminous flower. The flower opens into color with a musical note; three distinct blooms create a complete Photon Garden that can be reset and enjoyed again.

**One mirror. Three discoveries.** Intended audience: curious learners and first-time spatial puzzle players (manager decision). The visible achievement is the connection between mirror movement, reflected light and a responsive target; no measured learning outcome is claimed.

## Why it belongs on glasses

- Uses: draws in the world and leaves the body free. The mirror, source, reflected segment and flowers share one spatial arrangement, and the player keeps the path in view while manipulating it.
- Why it is better suited to glasses than a flat screen: the player can step to an oblique viewpoint and inspect the elevated target and reflected path at the same real scale. Their viewing position reveals the spatial relationship without changing the puzzle state.
- The garden is world-placed after initialization; status sits beside the task, and no large panel is attached to the player's face. This world-placed arrangement was verified in the recorded Preview viewpoints.

## Product or overlay

- Type: product; the virtual optical garden is the experience.
- What the real version would sense: standard SIK interaction input and viewpoint. No recognition of objects, surfaces, people or text is required.
- Stand-in for the preview: none needed for the gameplay logic. Lens Studio's simulated room hosts the same virtual garden; its standard mouse-driven pinch/drag is the preview input.
- Receivers become complete only when the live optical trace intersects them. UI changes angles; it does not directly award a bloom. Earned blooms persist for the current run until Replay.

## Where things live

The player looks slightly below eye level toward the mirror and its target garden. All core coordinates are centimeters relative to one shared workbench parent. The accepted Preview refinement places the garden 140 cm along the starting horizontal view direction and 40 cm below starting eye height. The initial 120 cm / 35 cm proposal was adjusted after inspecting the full runtime composition. Workbench local +Y is up, and local +Z points away from the starting viewer. For an identity camera facing world −Z this requires a common parent Y rotation of 180° (manager default). Apply the same parent transform to source, mirror, receivers and rendered beam. Controls use an independent, world-placed UIKit root at `(0,-47,-115)` with identity rotation. The garden root is `(0,-40,-140)` with Y rotation 180°; the starting camera remains at the origin with X rotation −12° and FOV 36.6°. These values were read back and the resulting start and complete views were inspected.

| Element | Local position and size (manager defaults) | Design purpose |
| --- | --- | --- |
| Work area | Approximately 70 × 70 cm X/Z footprint | One compact world-placed task; no opaque background plane |
| Source | Center `(0,14,-30)`; emits toward local `+Z` | Warm-gold point and bright orbital outline |
| Main mirror | Center `(0,14,0)`; width 16 cm, height 18 cm | One clearly readable reflective control |
| Coral receiver | Center `(-26,7,-10)`; receiving sphere radius 4 cm | Low coral discovery |
| Teal receiver | Center `(25,21,-12)`; receiving sphere radius 4 cm | Teal discovery at a different height |
| Gold receiver | Center `(-7,34,-18)`; receiving sphere radius 4 cm | Elevated warm-gold discovery |
| Fine-adjust controls | Four 6 × 6 cm targets and a 10 × 6 cm Replay target in one UIKit row; 2 cm gaps | Yaw − / Yaw + / Pitch − / Pitch + and nearby Replay |
| Progress and Replay panel | 60 × 20 cm BackPlate with 1.2 cm padding; FlexLayout arranges instruction, progress, angles and controls | `0/3` to `3/3`, then “Garden Complete”; readable world-placed status |
| Instruction label | UIKit text row above progress, inside the same panel | “Pinch and drag the mirror” before the first action |

Use [the core geometry](../Assets/Scripts/Core/garden.ts) as the authority for optical positions. Use [the art handoff](../docs/internal/art-direction.md) for flower facing, morphs and import scale: asset-local front is −Z; player-facing visual-wrapper Euler rotations are coral `(0,-15,0)`, teal `(0,15,0)` and gold `(-25,-10,0)`. Receiver centers and radii stay unchanged. These refined poses passed the [decoration/beam geometry checks](../docs/internal/art-orientation-validation.md) and Root inspected the resulting real start and full-bloom views. Flower bloom visual bounds are 18 × 19.5 × 11.5 cm (measured delivered asset dimensions, adopted as manager defaults). Preserve a bright contour and pearl accents on coral, teal and gold.

The mirror's zero-angle normal is `(0,0,-1)`; apply X pitch followed by Y yaw, matching the numerical model. Keep the current one-sided optical behavior and give the rear a distinct bright gold back marker (manager default); the reflective mint front remains the action surface.

During Preview framing, adjust the whole parent within 110–140 cm initial distance if needed (manager default), preserving optical relative positions. Start, primary controls, source, mirror and all receivers must be visible together with a 5% viewport inset (manager default). Accepted transform and bindings are recorded in the [production handoff](../docs/internal/production-to-video-handoff.md). Root inspected the actual [start](../docs/internal/lightweave-front-start.jpg) and [complete](../docs/internal/lightweave-front-complete.jpg) captures; the UI refinement above preserves clear gaps.

For a miss, keep the physically traced 150 cm total path budget from the core (manager default). Clip only the displayed terminal miss segment to the local work area box `x=[−35,35], y=[−14,46], z=[−35,35]` (manager default). A real receiver hit uses the full returned geometry. This bounds the visible tail while preserving geometric hits; no opaque tabletop is part of this version.

## Hands and input

- Primary action: standard one-hand SIK pinch and drag on the mirror. Horizontal movement adjusts yaw; vertical movement adjusts pitch. This rotates the fixed-center mirror; it does not translate the source or receivers.
- Starting drag sensitivity: 2° per centimeter in the mirror's initial control plane, tracked from grab start (manager default). Highlight the selected mirror until release, then retain the final angle.
- Fine adjustment: four UI Kit buttons change only one axis by ±2° per accepted press (manager default). This is the repeatable path for Preview and LEAF; it complements the direct mirror drag.
- Clamp yaw to −65°…+65° and pitch to −35°…+35° (manager defaults already in the core). Reset uses yaw −55°, pitch −22° and no earned targets (manager defaults already in the core).
- Targets are big and highlight when aimed at. Highlight feedback and the newly reflected path should appear by the next rendered update after accepted input (manager default; a local responsiveness criterion, not a headset latency claim).
- Replay returns all bloom weights and progress to the initial state and re-arms sounds for a new run. Use `evaluateGarden(createGardenState())`; there is no solve button or authored solution-angle table.
- Voice: not part of this design. Every action is demonstrated with standard Preview input.

## When things show

- Source, mirror and three closed receivers show at scene start. The initial progress is `0/3` and the instruction label is visible. After the first accepted mirror action, fade the instruction over 0.4 s (manager default).
- Fine-adjust controls and progress stay beside the garden throughout the run. Hover and drag highlights recede on exit/release.
- On `newlyEarnedReceiverId`, animate that flower's `Petals` and `PetalHighlights` Bloom weights from 0 to 1 over 0.85 s (measured asset clip duration adopted as manager default). Keep earned flowers open while the beam moves on. Current live illumination may pulse separately from earned state.
- After three distinct earned targets, show **Garden Complete** and emphasize **Replay**. Completion celebrates once per run. Reset cancels pending completion cues, closes all three flowers and restores the start prompt.
- If an unearned target leaves the view, a small bright direction hint points toward it; hide the hint when it returns to view. Its maximum size is 2 cm (manager default). Spatial bloom sound comes from the receiving flower.

Audio uses the six locally staged WAVs and event contract in [the audio handoff](../docs/internal/audio-direction.md) and [audio manifest](../media/audio/manifest.json). All six assets are imported. Real runtime bloom and completion play requests, continuous original-audio capture, and the final mixed video have passed event and signal checks. User listening feedback remains pending.

| Cue | Binding and trigger | Initial mix (manager defaults) |
| --- | --- | --- |
| `mirror_adjust_click.wav` | Mono at mirror; accepted grab or deliberate angle step | Gain 0.55; cooldown at least 100 ms; never every frame |
| `bloom_01.wav` / `bloom_02.wav` / `bloom_03.wav` | Mono at coral / teal / gold respectively; once on that target's first earned hit | Gain 0.70; fixed target-to-note mapping, independent of completion order |
| `garden_complete.wav` | Mono at garden center; once on transition to complete | Gain 0.65; onset 300 ms after final flower cue |
| `garden_air_loop.wav` | Non-positional stereo bed while garden is active | Gain 0.25; 500 ms entry/exit fades; duck 4 dB during completion or narration |

## Done criteria

Each one can be checked in Lens Studio's preview. Five formal LEAF scenarios are **PASSED**: start-controls, drag-retention, connections-audio, replay-repeat, and pending-cue-cancel. They cover the automated parts of the criteria below. Two complete runs and Replay are captured in one native Preview recording and independently reviewed. The final 125.021029-second edit passed visual, duration, decoding, and audio-signal checks; user listening feedback remains pending. See the [validation report](../docs/validation.md). Earlier SIK-driven runs and accepted start/complete framing are recorded in the [integration evidence](../docs/internal/preview-integration-evidence.json). Build LEAF scenarios against the actual SIK/UI Kit controls and supplement automated state checks with the named visual/audio observations. A report must distinguish automated results from manual evidence.

1. **Start, scale and clarity — automated and visual checks passed.** Starting or restarting Preview shows exactly one source, one 16 × 18 cm mirror, three unearned 4 cm-radius receivers, `0/3`, and the instruction. At the initial view, source, full mirror, receiver silhouettes and controls fit inside the 5% inset and labels are readable. Confirm the rendered receiver centers and radius-4 cm spheres match the Core’s analytic ray–sphere receivers, and document the final common parent transform. Receiver hits use the analytic geometry; only the mirror has a physics interaction collider. LEAF checks initial state and object counts; a saved runtime capture verifies framing and additive readability. All design quantities are manager defaults.
2. **Input changes the optical path — automated and visual checks passed.** Actual Preview pinch-drag changes yaw and pitch continuously; releasing retains the final angles. Each fine-adjust button changes exactly its named axis by 2° except at a clamp. Observed mirror orientation and beam update together by the next rendered update. A 5 s continuous drag (manager default) keeps the mirror/beam visible and causes no unintended direct progress assignment. LEAF exercises real controls and angle bounds; an uninterrupted recording shows the direct drag and resulting light path.
3. **Three distinct connections, spatial achievement and bloom feedback — automated and visual checks passed.** Using actual controls, earn coral, teal and gold. Each new geometric hit increments progress once, opens only its target over 0.85 s and triggers exactly its mapped bloom cue. Hold on an already-earned receiver for 3 s (manager default): no extra progress or repeated bloom cue. Move onto a miss: live illumination changes but earned blooms stay open. Reach the gold receiver and inspect its reflected path from a second viewpoint at least 20 cm sideways (manager default), with the world-placed layout stable and the beam's non-horizontal path visible. LEAF tests hit/miss/latching via controls; runtime views confirm alignment, depth and bloom motion.
4. **Sound responds to the scene — automated event and signal checks passed; user listening pending.** Listen in the actual Preview to one mirror adjustment, each of the three flower cues and completion. Observe one event per first achievement; a completion cue starts 300 ms after the last flower onset within ±100 ms (manager defaults). Mirror cues are spaced at least 100 ms (manager default). Play two full 16 s ambient loops (measured loop duration; two cycles is a manager default) and verify a continuous join without clipping or an audible gap. LEAF checks event counts and delays; manual playback checks spatial association, cue balance and the loop join. File measurements alone do not pass this criterion.
5. **Complete, Replay and repeat — automated and visual checks passed.** Exactly three distinct earned receivers show `3/3`, Garden Complete and one completion cue. Actual Replay input restores yaw −55°, pitch −22°, `0/3`, three closed flowers and the start prompt by the next rendered update; pending delayed cues are cancelled and progress/audio events re-arm. Finish a second full run through the same controls (manager default) to demonstrate the complete repeatable loop. LEAF verifies complete/reset/re-earn state and one-shot events; continuous Preview footage shows the visible cycle.

## Out of scope

- Additional mirrors, solution automation, multiple levels or learning-outcome claims in this version. The core's multi-mirror unit tests are library evidence; the Lens has one mirror.
- Live camera recognition, real-surface sensing, persistent anchors or progress between sessions, shared multi-user play, external-data or account-bound cloud features during gameplay.
- Custom two-hand gestures, hand-speed/pose recognition, voice commands, or features whose success cannot be demonstrated in Interactive Preview.
- Public publishing, account credential handling, repository release, YouTube upload and final competition submission are separate authorized stages. The preserved template's submission guidance below is not a record of those actions.

## Risks and open questions

- Accepted Preview framing, control spacing, text scale, drag behavior and material appearance are recorded in the handoff and final video. On a fresh project opening, widen the Preview panel and look approximately 12° downward to reproduce the reviewed composition. Subjective audio balance and the ambient join await user listening.
- Real-glasses comfort over time and actual hand tracking require device observation. For this brief, acceptance uses Lens Studio Preview; no device result is asserted.
- Production must preserve geometry/render alignment, the mirror's one-sided behavior, the GLB meter-to-centimeter import scale and the distinction between a visual miss-tail clip and the physical trace.
- Official account readiness and the integrated CLAD gameplay loop are verified. Final visual refinements and five LEAF scenarios are complete. The continuous native recording and final edit are saved and visually reviewed. User listening remains the open acceptance item.

## Existing inputs and evidence boundary

- [Optical core](../Assets/Scripts/Core/) and [numerical evidence](../docs/internal/optics-validation.md): 40 passing Node tests across five suites are recorded for the standalone geometry and pure state transitions. They establish numerical behavior, not Lens input, rendering or runtime acceptance. The original planning stage did not rerun the tests; subsequent integration and the delivery candidate checks are recorded separately in the validation report.
- [Art manifest](../media/art/manifest.json), [asset verification](../media/art/validation.json) and [art handoff](../docs/internal/art-direction.md): nine original GLBs, centimeter procedural data and offline previews are ready locally. Six selected runtime GLBs are imported and bound; actual start and completed-bloom captures were inspected.
- [Audio manifest](../media/audio/manifest.json) and [measurements](../media/audio/measurements.json): six original local WAVs have decode, clipping and loop-boundary measurements. Lens import, real cue-event timing, recorded original audio and final-mix signal checks are recorded; user listening remains pending. The native recorder outputs mono audio, so it does not establish binaural spatial listening.
- [Creative direction](../docs/creative-direction.md), [public video script](../docs/presentation/video-script-v2-public-en.md) and [claim-to-evidence map](../docs/presentation/claim-evidence-map.md): preparation for an achievement-focused demonstration. The completed 125.021029-second demonstration preserves the original Preview footage and audio, with Kokoro-82M / af_heart English narration and unchanged captions. Its revised opening names the light source, mirror and three flower buds, states the goal, and immediately shows a real first bloom. These are editorial callouts added to genuine Preview footage. Its visual and technical checks passed; user listening is pending. Publication is a separate stage.
- Five LEAF scenarios passed and the integrated two-run loop is recorded. Automated and visual evidence passes criteria 1, 2, 3 and 5. Criterion 4 retains the user-listening check; this distinction is preserved in the final delivery records.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
