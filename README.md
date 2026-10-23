# LightWeave

**Shape the light. Watch your world bloom.**

One mirror. Three discoveries. LightWeave turns a change in mirror angle into a golden path through space. Guide the beam toward coral, teal, and gold targets, and watch each one open into an eight-petal flower.

Created for curious learners and first-time spatial puzzle players, the experience makes a clear connection visible: **turn the mirror → shape the light → earn a bloom**.

## Play the garden

1. Pinch and drag the mirror to change its yaw and pitch.
2. Follow the reflected beam toward a flower. The receiving center brightens and its rim pulses when the beam lands.
3. Use **Yaw − / Yaw + / Pitch − / Pitch +** for precise two-degree adjustments.
4. Reach all three targets to see **Garden Complete — 3/3**. Earned flowers stay open as you explore the next connection.
5. Choose **Replay** to restore the starting arrangement and begin again.

The targets occupy three different heights. Change your viewpoint to see how the mirror, beam, and elevated flower relate in space.

## Open the project

The project was built and exercised in **Lens Studio 5.23.2.26081320**.

1. Keep the delivered project folder together, including `Assets/` and `Packages/`.
2. Open [LightWeave.esproj](LightWeave.esproj) in Lens Studio 5.23.2 and let the project finish initializing.
3. In Preview, select **SPECS 27 → Interactive → Sunlit Room**.
4. Widen the Preview panel and look slightly downward (about 12°) so the source, mirror, three flowers, and controls are visible together. Right-drag, or hold Shift while dragging, to adjust the viewing direction.
5. Use Preview's hand simulation to pinch and drag the mirror, or activate the fine-angle buttons. Complete the three blooms and choose Replay.

## From a spatial idea to a working Lens

We used the **Devpost Learn planning skill** to define the spatial moment, interaction flow, visual language, and concrete success criteria in [the design brief](devpost/design-brief.md).

We then used **CLAD's Lens Studio skills and native Lens Studio MCP tools** to construct the scene, import the original art and audio, connect interactions, inspect runtime state, and refine the actual Preview composition.

The TypeScript optical core calculates finite-mirror intersection, reflection, and receiver hits. The visible beam follows that returned geometry, and a receiver earns its bloom when the optical trace reaches it. Spectacles Interaction Kit supplies direct mirror interaction; UIKit supplies the four angle controls and Replay.

Hover and selection make the mirror's interaction state visible. A live hit brightens the receiving flower and pulses its rim, while earned petals remain open as a record of progress.

## Original art and sound

LightWeave's faceted flowers, mirror, photon source, and beam were created for this project. Each flower combines an eight-petal bloom with coordinated highlights in a bright coral, teal, gold, and pearl palette.

Six original synthesized audio assets cover the mirror interaction, three individual blooms, completion, and ambient garden air. The composition and sound design use the official CLAD `build-sfx` and `build-music` engines; the upstream engine license is preserved alongside the source.

| Material | Project source |
| --- | --- |
| Models and bloom geometry | [Art generator](media/art/source/build_assets.py) · [Art manifest](media/art/manifest.json) |
| Composition and sound design | [Audio generator](media/audio/generate.cjs) · [Audio manifest](media/audio/manifest.json) |
| Audio engine license | [Apache-2.0 engine license](media/audio/ENGINE-LICENSE.txt) |
| Runtime artwork and cues | [Imported models](Assets/GeneratedMeshes/) · [Imported audio](Assets/GeneratedSFX/) |

The project also uses the official Lens Studio SPECS template and its interaction/UI packages. Their supplied notices remain with the delivered dependencies.

## Verified in development

One continuous native Preview recording captures **two complete three-flower runs and Replay**, including the return to the starting state. Actual player-view captures at 25 cm to either side also show the elevated beam, flowers, and complete control panel.

**Five automated LEAF scenarios passed in Lens Studio Preview**, covering initial controls, continuous drag and retention, target connections and cue events, Replay across repeated runs, and pending-cue cancellation. The [validation report](docs/validation.md) records the scenario results, native recording, and measured viewpoints.

The independent optical core passed **40 numerical and state tests across five suites**, covering reflection, finite intersections, target reachability, earned progress, and reset. Reproduce the core checks from the project root with Node.js 22.16.0:

```sh
node scripts/test-optics.mjs
```

## Explore the implementation

| Area | Source |
| --- | --- |
| Optical math and garden state | [Assets/Scripts/Core/](Assets/Scripts/Core/) |
| Interaction and game flow | [LightWeaveMain.ts](Assets/Scripts/LightWeaveMain.ts) |
| Beam, bloom and hit feedback | [LightWeaveVisuals.ts](Assets/Scripts/LightWeaveVisuals.ts) |
| Fine-angle controls and Replay | [LightWeaveControlsUI.ts](Assets/Scripts/LightWeaveControlsUI.ts) |
| Audio event handling | [LightWeaveAudioController.ts](Assets/Scripts/LightWeaveAudioController.ts) |
| Numerical test suite | [tests/core/optics.test.ts](tests/core/optics.test.ts) |
| Spatial design and success criteria | [devpost/design-brief.md](devpost/design-brief.md) |
