# Exported-project verification

On 24 October 2026, an allowlist export was opened as a separate project through the official Lens Studio Editor API in **Lens Studio 5.23.2**. The exact exported project path was read back. Forced TypeScript compilation succeeded. A fresh Preview run reported no errors, two bloom morphs for each of the three flowers, the ambient-start event and the LightWeave ready message at 0/3. The actual progress Text read **Blooms 0/3**.

The native Preview was set to **SPECS 27 / Interactive / Sunlit Room**. Its panel was widened to 900 logical pixels and the camera at the origin looked approximately 12 degrees downward. The resulting full initial view showed the source, mirror, three flowers, beam, five controls, progress and angle readout. The Main Manager independently inspected this frame. These Preview setup steps are included in the [README](../README.md); local workspace layout and camera state are not packaged.

The final exporter requires every delivered `Assets/`, `Packages/` and `LightWeave.esproj` byte to match that independently opened candidate. Later changes are limited to the frozen documentation and generated delivery records. The tested candidate manifest SHA-256 is:

```
64590fde4b034cbddaa0980e8012568a905dccfe89e8dc938f6bfad39b511dc1
```

The [validation summary](validation.md) records the separate 40-test Core result, five LEAF passes and final film inspection. The exported Core suite was also run in the first verified candidate and passed 40/40. Four current Core source hashes match that tested version.

Six exact source files use the previously verified snapshot explicitly selected by the Main Manager: the Core test runner, the Core test file, the Apache license, and three audio synthesis modules. `DELIVERY_MANIFEST.json` identifies those paths and their hashes. All other source files were read from the frozen working tree. The selected files were not written back to the working project.

The archive uses an explicit file list and includes required SDK packages, original source assets and upstream notices. It excludes accounts, authentication screenshots, connection configuration, editor caches, workspace settings and raw recording masters. Relative document links, script imports, archive paths, vendor module loading and text privacy checks passed. `SHA256SUMS` supports a complete local byte check.


## Presentation v2 delta

The v2 archive starts from the exact independently reviewed v1 ZIP. All 77 Assets/Packages/project files are copied unchanged from that archive; no iCloud product-source read, Lens opening, recompile or additional product test was performed for this editorial delta. Only the approved documents and versioned editorial records changed. [DELTA_MANIFEST.json](../DELTA_MANIFEST.json) identifies the complete change set, and [MEDIA_MANIFEST.json](../MEDIA_MANIFEST.json) identifies the separate final films. The earlier package-open result applies to the unchanged runnable files.
