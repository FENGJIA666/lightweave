# Reproduce the original assets

The delivered WAV and GLB files are the exact project assets. Their manifests record the source fingerprints. Run generators in a copy of the project to preserve those delivered takes.

## Geometry

The procedural source uses Python 3, NumPy and Pillow:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install numpy pillow
.venv/bin/python media/art/source/build_assets.py
```

Geometry is authored in centimeters and GLB vertices are exported in meters. Lens's imported 100× scale converts them to centimeters. The offline PNG/GIF previews show asset construction; the captured Lens views document runtime rendering.

## Audio

The export carries the original CLAD synthesis modules under `vendor/clad-audio/` with their upstream license. The export copy of the generator refers to that directory; the authored source used the pinned local official toolkit cache.

```sh
node media/audio/generate.cjs
python3 media/audio/verify.py
```

The generator uses Node built-ins and the included modules. Verification also requires FFmpeg on `PATH`. Synthesis intentionally creates fresh timbral variation; use the delivered six WAVs for the recorded take. The separate audition WAV is an offline review sequence.

## Optical library

Node.js 22.16.0 was used for the 40 numerical tests:

```sh
node scripts/test-optics.mjs
```

The test runner resolves the same extensionless TypeScript Core source that Lens compiles. Native Lens Preview and LEAF observations are documented separately.


## Public demonstration narration

[The public reproduction guide](media/video/v2-public/REPRODUCE.md) covers the new narration and video-only remux. The required external native recording, frozen picture inputs and official model artifacts are explicitly listed. This is separate from opening and running the delivered Lens project.
