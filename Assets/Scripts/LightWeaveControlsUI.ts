import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {BackPlate, BackPlateStyle} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"

const ROTATION_STEP_DEGREES = 2
const LAYOUT_Z_LIFT = 0.02
const BUTTON_LABEL_Z = 0.08
const FONT_SIZE_SCALE = 1.0
type TextRole = "Title1" | "Title2" | "HeadlineXL" | "Headline1" | "Headline2"
  | "Subheadline" | "Button" | "Callout" | "Body" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700}, Title2: {size: 93, weight: 700},
  HeadlineXL: {size: 62, weight: 700}, Headline1: {size: 54, weight: 700},
  Headline2: {size: 48, weight: 700}, Subheadline: {size: 41, weight: 700},
  Button: {size: 39, weight: 500}, Callout: {size: 39, weight: 700},
  Body: {size: 39, weight: 500}, Caption: {size: 38, weight: 500},
}

function applyTextRole(text: Text, role: TextRole, distanceCm: number, scale: number): void {
  text.size = TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110) * scale
  ;(text as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

type FlexOptions = {gap?: number; padY?: number; padX?: number; justify?: FlexJustify; align?: FlexAlign}

/** Passive display and input adapter. The owner supplies all garden state. */
@component
export class LightWeaveControlsUI extends BaseScriptComponent {
  @ui.label('<span style="color: #BFFFF0;">LightWeave — mirror controls</span>')
  @ui.separator
  @ui.group_start("Layout in centimeters")
  @input
  @hint("Panel width. The layout preserves room for all five touch targets.")
  @widget(new SliderWidget(44, 70, 1))
  panelWidthCm: number = 60
  @input
  @hint("Preferred panel height; it expands if rows and padding require more room.")
  @widget(new SliderWidget(16, 30, 0.5))
  panelHeightCm: number = 20
  @input
  @hint("Width and height of each fine-angle button; at least 6 cm.")
  @widget(new SliderWidget(6, 10, 0.5))
  rotationButtonSizeCm: number = 6
  @input
  @hint("Replay button width; height matches the rotation buttons.")
  @widget(new SliderWidget(8, 14, 0.5))
  replayWidthCm: number = 10
  @input
  @hint("Clear horizontal gap between buttons.")
  @widget(new SliderWidget(1, 3, 0.1))
  buttonGapCm: number = 2
  @input
  @hint("Vertical gap between the instruction, controls, progress and angles.")
  @widget(new SliderWidget(0.3, 2, 0.1))
  rowGapCm: number = 0.6
  @input
  @hint("Padding inside the BackPlate on every side.")
  @widget(new SliderWidget(1, 3, 0.1))
  paddingCm: number = 1.2
  @input
  @hint("Height reserved for the instruction; fading it never moves the controls.")
  @widget(new SliderWidget(2.5, 5, 0.1))
  instructionHeightCm: number = 3.2
  @input
  @hint("Height reserved for the progress or completion message.")
  @widget(new SliderWidget(2.5, 5, 0.1))
  progressHeightCm: number = 3
  @input
  @hint("Height reserved for the yaw and pitch readout.")
  @widget(new SliderWidget(2, 4, 0.1))
  anglesHeightCm: number = 2.4
  @ui.group_end

  @ui.group_start("Appearance")
  @input
  @hint("UIKit BackPlate surface style. Text and buttons remain bright independently.")
  @widget(new ComboBoxWidget([new ComboBoxItem("Default", "default"), new ComboBoxItem("Simple", "simple"), new ComboBoxItem("Dark", "dark")]))
  backingStyle: string = "default"
  @input
  @hint("Official UIKit theme used by the buttons, selected before initialization.")
  @widget(new ComboBoxWidget([new ComboBoxItem("SnapOS 3", "SnapOS3"), new ComboBoxItem("SnapOS 2", "SnapOS2")]))
  buttonTheme: string = "SnapOS3"
  @input
  @hint("Official UIKit style for the four rotation buttons.")
  @widget(new ComboBoxWidget([new ComboBoxItem("Secondary", "Secondary"), new ComboBoxItem("Primary", "Primary"), new ComboBoxItem("Ghost", "Ghost")]))
  rotationButtonStyle: string = "Secondary"
  @input
  @hint("Official UIKit style for Replay.")
  @widget(new ComboBoxWidget([new ComboBoxItem("Primary", "Primary"), new ComboBoxItem("Secondary", "Secondary"), new ComboBoxItem("Ghost", "Ghost")]))
  replayButtonStyle: string = "Primary"
  @input
  @hint("Typography calibration distance; it does not move the UI root.")
  @widget(new SliderWidget(60, 160, 5))
  textDistanceCm: number = 120
  @input
  @hint("Uniform multiplier for the official text roles, using the system font.")
  @widget(new SliderWidget(1, 1.8, 0.05))
  textScale: number = 1.25
  @input
  @hint("Bright primary labels and rotation-button text.")
  @widget(new ColorWidget())
  primaryColor: vec4 = new vec4(1, 0.97, 0.87, 1)
  @input
  @hint("Instruction and normal progress color.")
  @widget(new ColorWidget())
  accentColor: vec4 = new vec4(0.75, 1, 0.94, 1)
  @input
  @hint("Bright angle readout color.")
  @widget(new ColorWidget())
  secondaryColor: vec4 = new vec4(0.8, 0.96, 1, 1)
  @input
  @hint("Completion message and Replay label color.")
  @widget(new ColorWidget())
  successColor: vec4 = new vec4(1, 0.83, 0.37, 1)
  @input
  @hint("Instruction fade-out duration after the owner accepts the first action.")
  @widget(new SliderWidget(0.1, 1, 0.05))
  instructionFadeSeconds: number = 0.4
  @ui.group_end

  @ui.group_start("Labels")
  @input
  @hint("Instruction shown at start and restored by Replay through the owner.")
  instructionLabel: string = "Pinch and drag the mirror"
  @input
  @hint("Label for the negative yaw increment.")
  yawMinusLabel: string = "Yaw -"
  @input
  @hint("Label for the positive yaw increment.")
  yawPlusLabel: string = "Yaw +"
  @input
  @hint("Label for the negative pitch increment.")
  pitchMinusLabel: string = "Pitch -"
  @input
  @hint("Label for the positive pitch increment.")
  pitchPlusLabel: string = "Pitch +"
  @input
  @hint("Replay action label; the UI emits an event without resetting domain state.")
  replayLabel: string = "Replay"
  @input
  @hint("Progress template; {count} is replaced with the value supplied by Main.")
  progressLabel: string = "Blooms {count}/3"
  @input
  @hint("Completion template; shown only when Main supplies complete=true.")
  completeLabel: string = "Garden Complete - {count}/3"
  @input
  @hint("Angle template; {yaw} and {pitch} are formatted in degrees.")
  anglesLabel: string = "Yaw {yaw}°    Pitch {pitch}°"
  @ui.group_end

  /** Deltas in degrees. Subscribe once; only UIKit's target-phase release emits. */
  public readonly onRotate = new Event<{yaw: number; pitch: number}>()
  public readonly onReplay = new Event<void>()

  // These are display caches only. They never determine achievement or optical state.
  private shownCount = 0
  private shownComplete = false
  private shownYaw = -55
  private shownPitch = -22
  private instructionAlpha = 1
  private instructionWanted = true
  private mounted = false
  private progressText: Text | null = null
  private anglesText: Text | null = null
  private instructionText: Text | null = null
  private instructionFadeEvent: SceneEvent | null = null
  private readonly unsubscribe: Array<() => void> = []

  public onAwake(): void {
    this.instructionFadeEvent = this.createEvent("UpdateEvent")
    this.instructionFadeEvent.enabled = false
    this.instructionFadeEvent.bind(() => {
      const duration = Math.max(0.01, this.instructionFadeSeconds)
      this.instructionAlpha = Math.max(0, this.instructionAlpha - getDeltaTime() / duration)
      this.updateInstructionColor()
      if (this.instructionAlpha === 0 && this.instructionFadeEvent) this.instructionFadeEvent.enabled = false
    })
    this.createEvent("OnStartEvent").bind(() => this.buildPanel())
    this.createEvent("OnDestroyEvent").bind(() => {
      for (const remove of this.unsubscribe) remove()
      this.unsubscribe.length = 0
    })
  }

  public setProgress(count: number, complete: boolean): void {
    if (!Number.isFinite(count)) return
    this.shownCount = Math.max(0, Math.trunc(count))
    this.shownComplete = complete
    this.refreshProgress()
  }

  public setAngles(yaw: number, pitch: number): void {
    if (!Number.isFinite(yaw) || !Number.isFinite(pitch)) return
    this.shownYaw = yaw
    this.shownPitch = pitch
    this.refreshAngles()
  }

  public setInstructionVisible(visible: boolean): void {
    this.instructionWanted = visible
    if (!this.mounted || visible) {
      this.instructionAlpha = visible ? 1 : 0
      if (this.instructionFadeEvent) this.instructionFadeEvent.enabled = false
      this.updateInstructionColor()
      return
    }
    if (this.instructionFadeEvent) this.instructionFadeEvent.enabled = this.instructionAlpha > 0
  }

  private buildPanel(): void {
    if (this.mounted) return
    this.mounted = true
    if (!this.sceneObject.getComponent("Component.Canvas")) this.sceneObject.createComponent("Component.Canvas")
    const buttonSize = Math.max(6, this.rotationButtonSizeCm)
    const replayWidth = Math.max(8, this.replayWidthCm)
    const buttonRowWidth = buttonSize * 4 + replayWidth + this.buttonGapCm * 4
    const width = Math.max(this.panelWidthCm, buttonRowWidth + this.paddingCm * 2)
    const innerWidth = width - this.paddingCm * 2
    const contentHeight = this.instructionHeightCm + buttonSize + this.progressHeightCm + this.anglesHeightCm + this.rowGapCm * 3 + this.paddingCm * 2
    const height = Math.max(this.panelHeightCm, contentHeight)

    // BackPlate owns the content so its InteractionPlane and buttons share an Interactable ancestor.
    const backing = this.obj(this.sceneObject, "BackPlate")
    const backPlate = backing.createComponent(BackPlate.getTypeName()) as BackPlate
    backPlate.size = new vec2(width, height)
    backPlate.style = this.backingStyle as BackPlateStyle
    const content = this.obj(backing, "Content", new vec3(0, 0, 0.6))
    const column = this.flexColumn(content, width, height, {
      gap: this.rowGapCm, padX: this.paddingCm, padY: this.paddingCm,
      align: FlexAlign.Center, justify: FlexJustify.Center,
    })
    column.name = "PanelLayout"
    const outerLayout = column.getComponent(FlexLayout.getTypeName()) as FlexLayout
    this.unsubscribe.push(outerLayout.onLayoutComplete.add(result => {
      backPlate.size = new vec2(result.containerWidth, result.containerHeight)
    }))

    this.flexChild(column, {w: innerWidth, h: this.instructionHeightCm}, child => {
      child.name = "Instruction"
      this.instructionText = this.text(child, this.instructionLabel, innerWidth, this.instructionHeightCm, "Headline2", this.accentColor)
    })
    this.flexChild(column, {w: innerWidth, h: buttonSize}, child => {
      child.name = "Controls"
      const row = this.flexRow(child, innerWidth, buttonSize, {gap: this.buttonGapCm, justify: FlexJustify.Center, align: FlexAlign.Center})
      row.name = "ButtonRow"
      this.addButton(row, "YawMinus", this.yawMinusLabel, buttonSize, buttonSize, false, () => this.onRotate.invoke({yaw: -ROTATION_STEP_DEGREES, pitch: 0}))
      this.addButton(row, "YawPlus", this.yawPlusLabel, buttonSize, buttonSize, false, () => this.onRotate.invoke({yaw: ROTATION_STEP_DEGREES, pitch: 0}))
      this.addButton(row, "PitchMinus", this.pitchMinusLabel, buttonSize, buttonSize, false, () => this.onRotate.invoke({yaw: 0, pitch: -ROTATION_STEP_DEGREES}))
      this.addButton(row, "PitchPlus", this.pitchPlusLabel, buttonSize, buttonSize, false, () => this.onRotate.invoke({yaw: 0, pitch: ROTATION_STEP_DEGREES}))
      this.addButton(row, "Replay", this.replayLabel, replayWidth, buttonSize, true, () => this.onReplay.invoke(undefined))
    })
    this.flexChild(column, {w: innerWidth, h: this.progressHeightCm}, child => {
      child.name = "Progress"
      this.progressText = this.text(child, "", innerWidth, this.progressHeightCm, "Headline2", this.accentColor)
    })
    this.flexChild(column, {w: innerWidth, h: this.anglesHeightCm}, child => {
      child.name = "Angles"
      this.anglesText = this.text(child, "", innerWidth, this.anglesHeightCm, "Body", this.secondaryColor)
    })
    this.instructionAlpha = this.instructionWanted ? 1 : 0
    this.refreshProgress()
    this.refreshAngles()
    this.updateInstructionColor()
  }

  private addButton(parent: SceneObject, name: string, label: string, width: number, height: number, replay: boolean, action: () => void): void {
    this.flexChild(parent, {w: width, h: height}, child => {
      child.name = name
      const button = child.createComponent(Button.getTypeName()) as Button
      button.setVariant({theme: this.buttonTheme, shape: "Rectangle", style: replay ? this.replayButtonStyle : this.rotationButtonStyle})
      button.size = new vec3(width, height, 1)
      const labelObject = this.obj(child, "Label", new vec3(0, 0, BUTTON_LABEL_Z))
      this.text(labelObject, label, width - 0.5, height - 0.5, "Button", replay ? this.successColor : this.primaryColor)
      this.unsubscribe.push(button.onTriggerUp.add(() => action()))
    })
  }

  private text(parent: SceneObject, value: string, width: number, height: number, role: TextRole, color: vec4): Text {
    const text = parent.createComponent("Component.Text") as Text
    text.text = value
    text.depthTest = true
    applyTextRole(text, role, this.textDistanceCm, this.textScale)
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.verticalOverflow = VerticalOverflow.Overflow
    text.layoutRect = Rect.create(-width / 2, width / 2, -height / 2, height / 2)
    text.textFill.color = color
    return text
  }

  private refreshProgress(): void {
    if (!this.progressText) return
    const template = this.shownComplete ? this.completeLabel : this.progressLabel
    this.progressText.text = template.replace(/\{count\}/g, this.shownCount.toString())
    this.progressText.textFill.color = this.shownComplete ? this.successColor : this.accentColor
  }

  private refreshAngles(): void {
    if (!this.anglesText) return
    this.anglesText.text = this.anglesLabel.replace(/\{yaw\}/g, this.shownYaw.toFixed(1)).replace(/\{pitch\}/g, this.shownPitch.toFixed(1))
  }

  private updateInstructionColor(): void {
    if (!this.instructionText) return
    const c = this.accentColor
    this.instructionText.textFill.color = new vec4(c.x, c.y, c.z, c.w * this.instructionAlpha)
  }

  private obj(parent: SceneObject, name: string, position?: vec3): SceneObject {
    const sceneObject = global.scene.createSceneObject(name)
    sceneObject.setParent(parent)
    if (position) sceneObject.getTransform().setLocalPosition(position)
    return sceneObject
  }

  private liftInZ(sceneObject: SceneObject, zOffset: number): void {
    const transform = sceneObject.getTransform()
    const pos = transform.getLocalPosition()
    transform.setLocalPosition(new vec3(pos.x, pos.y, pos.z + zOffset))
  }

  private flexColumn(parent: SceneObject, width: number, height: number, opts?: FlexOptions): SceneObject {
    return this.makeFlex(parent, FlexDirection.Column, width, height, opts)
  }

  private flexRow(parent: SceneObject, width: number, height: number, opts?: FlexOptions): SceneObject {
    return this.makeFlex(parent, FlexDirection.Row, width, height, opts)
  }

  private makeFlex(parent: SceneObject, direction: FlexDirection, width: number, height: number, opts?: FlexOptions): SceneObject {
    const container = this.obj(parent, "Flex")
    this.liftInZ(container, LAYOUT_Z_LIFT)
    const flexLayout = container.createComponent(FlexLayout.getTypeName()) as FlexLayout
    // Children are registered explicitly before OnStart, so startup discovery must be disabled.
    flexLayout.autoDiscoverItemsOnStart = false
    const flexItem = container.createComponent(FlexItem.getTypeName()) as FlexItem
    if (width > 0) flexItem.overrideWidth = width
    if (height > 0) flexItem.overrideHeight = height
    flexLayout.onInitialized.add(() => {
      flexLayout.width = width
      flexLayout.height = height
      flexLayout.direction = direction
      if (direction === FlexDirection.Row) flexLayout.columnGap = opts?.gap ?? 0
      else flexLayout.rowGap = opts?.gap ?? 0
      flexLayout.paddingTop = opts?.padY ?? 0
      flexLayout.paddingBottom = opts?.padY ?? 0
      flexLayout.paddingLeft = opts?.padX ?? 0
      flexLayout.paddingRight = opts?.padX ?? 0
      flexLayout.justifyContent = opts?.justify ?? FlexJustify.Start
      flexLayout.alignItems = opts?.align ?? FlexAlign.Stretch
    })
    return container
  }

  private flexChild(parent: SceneObject, size: {w?: number; h?: number; grow?: number}, builder: (childObject: SceneObject) => void): SceneObject {
    const child = this.obj(parent, "Item")
    this.liftInZ(child, LAYOUT_Z_LIFT)
    const flexItem = child.createComponent(FlexItem.getTypeName()) as FlexItem
    if (size.w !== undefined && size.w > 0) flexItem.overrideWidth = size.w
    if (size.h !== undefined && size.h > 0) flexItem.overrideHeight = size.h
    flexItem.flexGrow = size.grow ?? 0
    flexItem.flexShrink = 0
    builder(child)
    const parentFlexLayout = parent.getComponent(FlexLayout.getTypeName()) as FlexLayout | null
    if (parentFlexLayout) parentFlexLayout.addItems([flexItem])
    return child
  }
}
