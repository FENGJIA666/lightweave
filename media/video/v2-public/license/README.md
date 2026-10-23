# LightWeave public narration source

The public v2 demonstration uses the original LightWeave script, synthesized locally with **Kokoro-82M v1.0** and the official **af_heart American English preset**, using Kokoro 0.9.4. No system voice output, human reference recording or impersonation is used.

The official [model card](https://huggingface.co/hexgrad/Kokoro-82M) declares Apache-2.0 and describes use in production. The publisher's [inference code](https://github.com/hexgrad/kokoro) also uses Apache-2.0. The [voice catalog](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) identifies af_heart. The full license, model card and voice catalog are preserved here; exact source URLs and document hashes are in `sources.json`.

The pinned source model-card revision is `f3ff3571791e39611d31c381e3a41a3af07b4987`. Local inference reads the following unmodified official artifacts, verified before synthesis:

| Artifact | SHA-256 |
|---|---|
| kokoro-v1_0.pth | `496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4` |
| af_heart.pt | `0ab5709b8ffab19bfd849cd11d98f75b60af7733253ad0d67b12382a102cb4ff` |
| config.json | `5abb01e2403b072bf03d04fde160443e209d7a0dad49a423be15196b9b43c17f` |

The model and voice weights are external production inputs and are not bundled with the public video. Generated utterances are measured, resampled, normalized and fitted into the unchanged caption windows. The existing H.264 picture stream is copied without re-encoding; native Preview sound is remixed directly from the original recording.

Suggested credit: “Narration generated locally with Kokoro-82M v1.0 (official af_heart voice), released by hexgrad under Apache License 2.0: https://huggingface.co/hexgrad/Kokoro-82M”. This identifies the synthesis source and implies no endorsement.
