
> Reviewed development record, retained for its technical evidence. Dates and next steps describe the stage when it was written. See [delivery status](../../DELIVERY_STATUS.md) for the delivery scope.

# LightWeave — original art handoff

Updated: 2026-10-24, Asia/Singapore. Owner: Art Supervisor.

## Creative result

**A garden made of light.** Three jewel-like flowers use coral, teal and warm gold. Eight sculpted petals unfold around a luminous receiving sphere. Pearl ridges and a fine halo keep silhouettes bright. The mirror has a mint frame, a translucent cyan surface and four gold corner details. A gold source and slender beam connect the garden visually.

The assets are original deterministic geometry authored for this project. They use no third-party models, downloaded textures, generated images, paid service or network request. The geometry and GLBs were produced locally in `media/art/`; they have **not been imported into Lens Studio**. The software-rendered previews below show asset design, not Lens Runtime, Preview, hand tracking or SPECS display acceptance.

The `build-mesh` skill routes animated/articulated geometry to authored parametric meshes. This handoff remains outside the Lens authoring workflow while Production resolves official session readiness. Production owns the later CLAD/MCP import and scene integration.

## Files

All paths below are project-relative.

| Deliverable | Path | Purpose |
|---|---|---|
| Machine-readable handoff | `media/art/manifest.json` | SHA-256, exact bounds, polygon counts and status of every GLB |
| Structure verification | `media/art/validation.json` | 9/9 independent GLB binary, accessor, morph bounds, animation timing and fingerprint checks |
| Palette | `media/art/data/palette.json` | Color tokens and intended Lens material recipes |
| Reproducible source | `media/art/source/build_assets.py` | Original vertex construction, GLB export and offline previews |
| Three closed flowers | `media/art/glb/Flower_{Coral,Teal,Gold}_Closed.glb` | Start shape, `Bloom` morph animation included |
| Three open flowers | `media/art/glb/Flower_{Coral,Teal,Gold}_Bloom.glb` | Open reference shape, same animation and topology |
| Mirror | `media/art/glb/Mirror_16x18cm.glb` | Exactly 16 × 18 cm visual footprint |
| Light source | `media/art/glb/PhotonSource.glb` | Gold orb and two bright orbital rings |
| Unit beam | `media/art/glb/Beam_1cm.glb` | 1 cm long along local +Z, outer diameter 0.44 cm |
| Procedural data | `media/art/data/Flower_{coral,teal,gold}.json` | cm vertices, normals, indices and absolute bloom positions for a MeshBuilder adapter |
| Flower review | `media/art/preview/flower-states-contact-sheet.png` | All six forms, visually inspected |
| Garden review | `media/art/preview/photon-garden-offline-composition.png` | One reflected beam reaching the gold target, visually inspected |
| Bright backdrop review | `media/art/preview/light-background-silhouettes.png` | Silhouette review on a light background |
| Motion review | `media/art/preview/coral-bloom-offline.gif` | Offline transition from closed to bloom |
| Isolated artwork | `media/art/preview/{coral,teal,gold}-{closed,bloom}-transparent.png` | RGBA transparent previews |

## Integration contract

**Units and placement.** Source JSON positions are centimeters. GLB positions are meters; Lens import at its usual 100× scale produces the intended centimeters. Preserve that imported visual scale. Use a unit-scale parent at each optical receiver's center, with the 4 cm collider on that parent. Animate a visual wrapper or morph weight; do not set the imported GLB's scale to `1` to animate it. Read the actual import scale before using it.

**Flower facing.** Each asset's front remains local `-Z`; the receiver sphere is centered at `(0,0,0)` with radius exactly 4 cm. The selected visual wrappers face the initial player, with a small inward tilt that presents the bloom and keeps its incoming light clear. Apply `Ry(yaw) × Rx(pitch)` in garden-local coordinates; keep collider, optical center and Core unchanged. These manager-selected defaults replace the original mirror-facing presentation:

| Receiver | Center cm | Visual-wrapper Euler `(x, y, z)`, degrees |
|---|---|---|
| Coral | `(-26,7,-10)` | `(0,-15,0)` |
| Teal | `(25,21,-12)` | `(0,15,0)` |
| Gold | `(-7,34,-18)` | `(-25,-10,0)` |

**Beam clearance.** All petal vertices retain asset-local `z ≥ 4.533397 cm` throughout the morph. For the selected player-facing poses, direct geometry checks establish clear incoming paths from the mirror to each 4 cm receiving sphere: the continuous center-beam envelope has conservative clearance lower bounds of 2.735 cm, 2.230 cm and 1.770 cm for coral, teal and gold. Each flower also passed 161 sampled sphere-hitting rays at 21 morph states with zero decoration-triangle intersections. The center pearl is part of the receiving visual. The optical core still stops the beam at its radius-4 sphere; inspect that contact and the visible bloom in actual Preview. Full method, sampling boundaries and unchanged-center checks are in [art-orientation-validation.md](art-orientation-validation.md).

**Bloom.** Each flower has `Petals` and `PetalHighlights` meshes with morph target `Bloom`. `Closed.glb` defaults to weight `0`; `Bloom.glb` defaults to `1`. Each GLB includes a linear 0.85 s `Bloom` clip. Production can use the imported clip or drive both weights together using an eased `0..1` value. Trigger from `newlyEarnedReceiverId`; preserve weight `1` for earned targets and restore `0` on reset. The JSON contains the same closed positions and absolute `bloom` positions; interpolate `closed + (bloom - closed) * t` if authoring with Lens MeshBuilder. Do not drive completion from animation.

**Mirror.** Origin is the optical plane center. Width `+X`, height `+Y`, front `-Z`, matching `mirrorFromYawPitch()`. Use the core's `Y-yaw × X-pitch` orientation, not a separately calculated decorative rotation. The pane is 16 × 18 cm; frame members fit inside that footprint.

**Beam.** Its authored endpoints are `(0,0,0)` and `(0,0,1)` cm. Prefer the existing beam renderer if Production already has one; the palette is the shared art interface. If using the GLB, position at each segment start, orient `+Z` along `end-start`, and scale only a dedicated visual wrapper's Z by the segment's centimeter length. It must not share a collider scale.

Beam metadata was aligned to **+Z** in the GLB asset extras, manifest, procedural-data header and generator during the first Preview readiness review. Only metadata changed: the GLB binary geometry payload and procedural mesh parts remain byte-identical/equal. The updated artifact fingerprint is in the manifest. Flowers and mirror retain their **−Z** facing convention.

**Materials.** GLB uses standard `KHR_materials_unlit` with emissive colors as portable intent. Lens must verify imported material behavior and assign its official unlit/additive material where required. The mirror pane carries alpha `0.23`; the frame is opaque/emissive. Use depth-tested golden additive beam plus a pearl core. Do not import the dark editorial preview background as geometry: on SPECS additive displays, black is transparent. Bright silhouette behavior and transparent sorting still require actual Preview and device evidence.

## Direct verification and next action

- Generated 9 nonempty GLBs: 6 flower variants, mirror, source, unit beam.
- Every flower is 1,724 triangles; the mirror is 308, source 1,232, unit beam 56. A three-flower garden plus mirror/source/two beam segments totals 6,824 triangles before UI.
- Generator asserts finite geometry, legal triangle indices, equal morph topology and petal clearance. The manifest records exact bounds and fingerprints.
- A separate reader checked all 9 GLB headers/chunks, accessor byte ranges, index limits, effective default morph bounds, animation timestamps and SHA-256 values: **9 passed**. The official toolkit's `analyze_glb.js` independently confirmed the mirror at `16 × 18 cm` and the closed flower bounds. Total GLB payload is **443,436 bytes**.
- The full-bloom flower bounds are `18 × 19.5 × 11.5 cm`; closed bounds are `8.9419 × 14.97124 × 15.47713 cm`. Origin stays at the receiving sphere center; they are floating flowers, not floor-seated props.
- Art Supervisor actually opened the contact sheet, composition and bright-background review with `view_image`. Coral, teal and warm gold, pearl contour accents, one mirror, source and a continuous reflected beam were visible. A missing arrow glyph was corrected to “TO”; label spacing was corrected before final output.

Next: after official readiness, Production can import the GLBs through the official Lens tool workflow or adapt the cm procedural data. Verify imported units, two morph weights, materials, collider alignment and all three states in actual Lens Preview. This local asset handoff does not satisfy those separate runtime checks.

Rebuild with the bundled Python runtime (NumPy and Pillow are already available):

```sh
python3 media/art/source/build_assets.py
```
