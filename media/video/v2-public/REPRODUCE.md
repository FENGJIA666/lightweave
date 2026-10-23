# Reproduce the public narration revision

The public demonstration uses the original 125-second story and picture stream with new Kokoro-82M v1.0 / af_heart speech. The [public script](../../../docs/presentation/video-script-v2-public-en.md), [edit record](edit.json), [measured voice timing](voice-sync.json) and [source license notice](license/README.md) describe the delivered version.

## Required inputs

The Lens project opens independently of this video workflow. Movie reproduction additionally requires the external files listed in [PRODUCTION_INPUTS.json](PRODUCTION_INPUTS.json): the native Preview master, the two previous picture masters and the three official model artifacts. Previous movie inputs supply only their H.264 video streams; their audio is never selected.

The model artifacts are `kokoro-v1_0.pth`, `af_heart.pt` and `config.json` from [the official Kokoro-82M repository](https://huggingface.co/hexgrad/Kokoro-82M). Place them in a separate local model directory. Their exact SHA-256 values are in the input manifest and are checked before generation. Model weights, raw recordings, prior movies and generated PCM are not embedded in this source repository.

## Commands

Run from the repository root with Python, FFmpeg and ffprobe available. Create an isolated Python environment and install the captured inference dependencies:

```sh
python3 -m venv .venv-narration
.venv-narration/bin/python -m pip install -r media/video/v2-public/license/runtime-requirements.txt
.venv-narration/bin/python scripts/video/public_voice.py --models /path/to/official-models
.venv-narration/bin/python scripts/video/public_mix.py
```

The generation script uses Kokoro 0.9.4, the official af_heart preset, measured timing windows and fresh PCM files. It checks model hashes, retained speech, cue duration and every reused generated-file fingerprint. The mix script checks the native recording and both picture-master hashes, remixes the native sound with the new speech, and copies the H.264 picture stream. It then verifies picture hashes, frame count and full decoding. Exact numerical speech bytes may depend on the captured inference runtime; the delivered measurements and file fingerprints remain the reference.

Outputs are written to `media/video/v2-public/voice/`, `work/` and `output/`. The scripts create their output directories. Keep generated files and external models out of commits.

## Source adaptations

The published generation script adds first-run directory creation and points its narrative record to the public script. The published mix script imports [public_video_support.py](../../../scripts/video/public_video_support.py), a minimal extraction of the production mixing and validation helpers. The selected function bodies, including `mix_filters` and `validate`, are unchanged; unrelated layout rendering and local-review speech commands are omitted. The recorded production edit fingerprint remains in [the replacement report](evidence/public-replacement-report.json); this repository's edit changes only the narrative document reference.

These source adaptations were syntax-checked, and the extracted function bodies were compared with the validated production module. They were not used to regenerate the already-reviewed film. The [current validation](../../../docs/validation.md) distinguishes the delivered video evidence from reproduction instructions.
