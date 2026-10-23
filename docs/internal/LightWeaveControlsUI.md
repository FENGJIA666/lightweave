
> Reviewed development record, retained for its technical evidence. Dates and next steps describe the stage when it was written. See [delivery status](../../DELIVERY_STATUS.md) for the delivery scope.

# LightWeaveControlsUI handoff

Owner: UI/Art Supervisor. Source: [LightWeaveControlsUI.ts](../../Assets/Scripts/LightWeaveControlsUI.ts). Production owns the scene root, typed input connection, MCP compile and Preview acceptance.

This passive component displays externally supplied progress/angles and emits input deltas. It does not import Core, evaluate optics, award achievements or reset domain state. Display setters cache values before its `OnStartEvent` construction. Initial view is `0/3`, yaw −55°, pitch −22°; Main's supplied values take precedence.

| API | Meaning |
| --- | --- |
| `onRotate: Event<{yaw:number,pitch:number}>` | Emits one ±2° axis delta per accepted UIKit `onTriggerUp` |
| `onReplay: Event<void>` | Emits a Replay intent; Main owns reset |
| `setProgress(count, complete)` | Updates the displayed count and completion message from Main |
| `setAngles(yaw, pitch)` | Updates one-decimal angle text in degrees |
| `setInstructionVisible(visible)` | False fades over 0.4 s by default; true restores immediately; safe before build |

Create the root through Production's VirtualScene and attach the exported `LightWeaveControlsUI` type. Main uses a typed `@input controlsUI: LightWeaveControlsUI`. The UI leaves the supplied root's position and rotation unchanged. Production confirmed an independent world-oriented root, with placement to be accepted in actual Preview.

Stable paths relative to that root:

| Path | Component / use |
| --- | --- |
| `BackPlate` | UIKit `BackPlate` |
| `BackPlate/Content/PanelLayout/Controls/ButtonRow/YawMinus` | UIKit `Button`; yaw −2° |
| `BackPlate/Content/PanelLayout/Controls/ButtonRow/YawPlus` | UIKit `Button`; yaw +2° |
| `BackPlate/Content/PanelLayout/Controls/ButtonRow/PitchMinus` | UIKit `Button`; pitch −2° |
| `BackPlate/Content/PanelLayout/Controls/ButtonRow/PitchPlus` | UIKit `Button`; pitch +2° |
| `BackPlate/Content/PanelLayout/Controls/ButtonRow/Replay` | UIKit `Button`; Replay intent |
| `BackPlate/Content/PanelLayout/Instruction` | Same-object `Component.Text`, instruction alpha |
| `BackPlate/Content/PanelLayout/Progress` | Same-object `Component.Text`, progress/completion |
| `BackPlate/Content/PanelLayout/Angles` | Same-object `Component.Text`, yaw/pitch |

Wait for each UIKit button's actual `initialized` state. Obtain its SIK input from `button.interactable`; UIKit Button is not an Interactable subclass. Drive those real controls in LEAF. Only `onTriggerUp` is subscribed, preventing a down+up double increment. No test-only solve or rotation method was added.

Defaults: 60 × 20 cm panel, four 6 × 6 cm rotation buttons, one 10 × 6 cm Replay button, 2 cm button gaps, 1.2 cm panel padding. FlexLayout supplies all row positions, with explicit `addItems` registration and `autoDiscoverItemsOnStart = false` before child construction. BackPlate owns the Content subtree so its InteractionPlane and the five buttons share an Interactable ancestor; content sits +0.6 cm in local Z and button labels receive +0.08 cm. Canvas hierarchy order remains the rendering authority. The panel expands if changed input sizes require more space.

All visuals use UIKit BackPlate, FlexLayout and Button, with the skill's supported raw Text typography inside the layout. Root position is external. Inspector inputs expose dimensions, gaps, labels, theme/style, typography distance/scale, bright colors and instruction fade duration. No icon/font files were present; Production confirmed text-only buttons and the system font. No icon/material assets were downloaded or created.

Actual source was checked against the installed package APIs, including the current public `Button.setVariant` method. Source handoff checks resolved all six package imports, found five unique button names, confirmed the passive public API and the single trigger-up event path, and found no Core import, private UIKit-field cast, manual render order or depth-write override.

**Production verified:** unified Lens TypeScript compilation, actual UI construction and all five UIKit Button Interactable registrations. Official Preview input exercised all four angle buttons: Yaw+ changed the visible angles from −55/−22 to −53/−22; Pitch+, Yaw− and Pitch− restored −55/−22. The BackPlate-owned Content hierarchy passed the real input obstruction check. See [Production's runtime handoff](production-to-video-handoff.md) for current layout, evidence and the completed bloom/Replay run. Root also inspected and accepted the front-facing start and complete captures.

**Still separate:** formal LEAF assertions and measured instruction-fade timing await their corresponding checks. The UI author's local source review is not a substitute for those results. Lens operations and runtime acceptance were performed by Production, not this UI-author task.
