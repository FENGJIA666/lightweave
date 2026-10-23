/** Owns garden state and input orchestration. Authored refs are wired in Phase B; UI is passive. */
import { Interactable } from 'SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';
import type { DragInteractorEvent } from 'SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent';
import { createGardenState, evaluateGarden, rotateGarden } from './Core/garden';
import type { GardenFrame } from './Core/garden';
import { LightWeaveControlsUI } from './LightWeaveControlsUI';
import { LightWeaveVisuals } from './LightWeaveVisuals';
import { LightWeaveAudioController } from './LightWeaveAudioController';
import { LightWeaveDirectionHints } from './LightWeaveDirectionHints';
import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider';

@component
export class LightWeaveMain extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">LightWeave — shape light, bloom a garden</span>')
  @ui.group_start('References')
  @input @hint('Passive UIKit control panel') controlsUI!: LightWeaveControlsUI;
  @input @hint('Common optical coordinate frame') gardenRoot!: SceneObject;
  @input @hint('Rotating mirror visual pose; optical center stays fixed') mirrorPose!: SceneObject;
  @input @hint('Identity-rotation world-space SIK hit wrapper') mirrorHitTarget!: SceneObject;
  @input @hint('Pool parent for data-driven beam segments') beamPool!: SceneObject;
  @input @hint('Authored coral flower visual') coralFlower!: SceneObject;
  @input @hint('Authored teal flower visual') tealFlower!: SceneObject;
  @input @hint('Authored elevated gold flower visual') goldFlower!: SceneObject;
  @ui.group_end
  @ui.group_start('Settings')
  @input @hint('Degrees per centimeter of mirror drag') @widget(new SliderWidget(0.5, 5, 0.1)) dragSensitivity: number = 2;
  @input @hint('Seconds for a newly earned flower to unfold') @widget(new SliderWidget(0.2, 2, 0.05)) bloomSeconds: number = 0.85;
  @input @hint('Multiplier for original event sounds') @widget(new SliderWidget(0, 1, 0.05)) sfxGain: number = 1;
  @input @hint('Quiet garden air bed') @widget(new SliderWidget(0, 1, 0.05)) ambientGain: number = 0.25;
  @input @hint('Show hit volumes when diagnosing input') debugColliders: boolean = false;
  @ui.group_end

  private frame: GardenFrame = evaluateGarden(createGardenState());
  private visuals: LightWeaveVisuals | null = null;
  private audio: LightWeaveAudioController | null = null;
  private hints: LightWeaveDirectionHints | null = null;
  private dragging = false;
  private hovered = false;
  private interaction: Interactable | null = null;
  private acceptedInputCount = 0;
  private grabStartYaw = 0;
  private grabStartPitch = 0;
  private grabDeltaX = 0;
  private grabDeltaY = 0;

  onAwake(): void {
    this.createEvent('OnStartEvent').bind(() => this.start());
    this.createEvent('OnDestroyEvent').bind(() => this.hints?.destroy());
    this.createEvent('UpdateEvent').bind(() => { this.visuals?.update(getDeltaTime()); this.audio?.update(); this.updateHints(); });
  }

  private start(): void {
    if (!this.controlsUI || !this.gardenRoot || !this.mirrorPose || !this.mirrorHitTarget || !this.beamPool || !this.coralFlower || !this.tealFlower || !this.goldFlower) {
      console.warn('[LightWeave] Waiting for Phase B authored references.'); return;
    }
    const flowers = [this.coralFlower, this.tealFlower, this.goldFlower];
    this.visuals = new LightWeaveVisuals({ mirrorPose: this.mirrorPose, beamPool: this.beamPool, flowers }, this.bloomSeconds);
    this.hints = new LightWeaveDirectionHints(WorldCameraFinderProvider.getInstance().getComponent(), this.getSceneObject());
    this.audio = new LightWeaveAudioController(this.gardenRoot, this.mirrorPose, flowers, this.sfxGain, this.ambientGain);
    this.controlsUI.onRotate.add(delta => this.rotate(delta.yaw, delta.pitch));
    this.controlsUI.onReplay.add(() => this.replay());
    this.bindMirror();
    this.render();
    this.setColliderDebugAll(this.getSceneObject(), this.debugColliders);
    console.log('[LightWeave] ready: one mirror, three flowers, real reflection, 0/3.');
  }

  private bindMirror(): void {
    // The collider is independent of the rotated optical parent and always unit scale.
    this.mirrorHitTarget.getTransform().setWorldPosition(this.mirrorPose.getTransform().getWorldPosition());
    const collider = this.mirrorHitTarget.createComponent('Physics.ColliderComponent') as ColliderComponent;
    const box = Shape.createBoxShape(); box.size = new vec3(20, 22, 18); collider.shape = box;
    this.interaction = this.mirrorHitTarget.createComponent(Interactable.getTypeName()) as Interactable;
    this.interaction.targetingMode = 3; this.interaction.enableInstantDrag = true;
    this.interaction.onTriggerStart.add(() => {
      this.dragging = true;
      this.grabStartYaw = this.frame.state.yawDeg; this.grabStartPitch = this.frame.state.pitchDeg;
      this.grabDeltaX = 0; this.grabDeltaY = 0;
      this.visuals?.setSelected(true); this.audio?.tick(); this.logMirrorFeedback('grab-start');
    });
    const release = () => { this.dragging = false; this.visuals?.setSelected(this.hovered); this.logMirrorFeedback('release'); };
    this.interaction.onTriggerEnd.add(release);
    this.interaction.onTriggerEndOutside.add(release);
    this.interaction.onTriggerCanceled.add(release);
    this.interaction.onHoverEnter.add(() => { this.hovered = true; this.visuals?.setSelected(true); this.logMirrorFeedback('hover-enter'); });
    this.interaction.onHoverExit.add(() => { this.hovered = false; this.visuals?.setSelected(this.dragging); this.logMirrorFeedback('hover-exit'); });
    this.interaction.onDragUpdate.add((event: DragInteractorEvent) => {
      const delta = event.planecastDragVector || event.dragVector;
      this.grabDeltaX += delta.x; this.grabDeltaY += delta.y;
      const targetYaw = this.grabStartYaw + this.grabDeltaX * this.dragSensitivity;
      const targetPitch = this.grabStartPitch - this.grabDeltaY * this.dragSensitivity;
      this.rotate(targetYaw - this.frame.state.yawDeg, targetPitch - this.frame.state.pitchDeg, false);
    });
  }

  private logMirrorFeedback(event: string): void {
    console.log('[LightWeaveFeedback] ' + JSON.stringify({ event, color: this.visuals?.getFeedbackSnapshot().mirror[0] || [], at: getTime() }));
  }

  private rotate(yaw: number, pitch: number, cue = true): void {
    if (!Number.isFinite(yaw) || !Number.isFinite(pitch) || (yaw === 0 && pitch === 0)) return;
    this.acceptedInputCount++;
    this.controlsUI.setInstructionVisible(false);
    const wasComplete = this.frame.complete;
    this.frame = rotateGarden(this.frame.state, yaw, pitch);
    if (cue) this.audio?.tick();
    if (this.frame.newlyEarnedReceiverId) this.audio?.bloom(this.frame.newlyEarnedReceiverId);
    if (!wasComplete && this.frame.complete) this.audio?.scheduleComplete();
    this.render();
    console.log('[LightWeaveState] ' + JSON.stringify({ yaw: this.frame.state.yawDeg, pitch: this.frame.state.pitchDeg, earned: this.frame.state.earnedReceiverIds, liveHit: this.frame.trace.hitReceiverId }));
  }

  private replay(): void {
    this.frame = evaluateGarden(createGardenState()); this.acceptedInputCount = 0;
    this.audio?.reset(); this.visuals?.reset(); this.controlsUI.setInstructionVisible(true); this.render();
    console.log('[LightWeave] replay reset complete.');
  }

  private render(): void {
    this.visuals?.render(this.frame);
    this.controlsUI.setProgress(this.frame.state.earnedReceiverIds.length, this.frame.complete);
    this.controlsUI.setAngles(this.frame.state.yawDeg, this.frame.state.pitchDeg);
    this.updateHints();
  }

  private updateHints(): void {
    if (!this.hints) return;
    const roots = [this.coralFlower, this.tealFlower, this.goldFlower];
    const ids = ['coral', 'teal', 'gold'];
    this.hints.update(roots.map((root, i) => ({
      id: ids[i], worldPosition: root.getTransform().getWorldPosition(),
      earned: this.frame.state.earnedReceiverIds.includes(ids[i]),
    })));
  }

  /** Read-only snapshots for runtime diagnostics and LEAF assertions; no solve or mutation endpoint. */
  getGardenFrame(): GardenFrame { return JSON.parse(JSON.stringify(this.frame)); }
  getBloomWeights(): number[] { return this.visuals?.getBloomWeights() || [0, 0, 0]; }
  getAudioEvents(): { id: string; run: number; at: number }[] { return this.audio?.getEvents() || []; }
  getAcceptedInputCount(): number { return this.acceptedInputCount; }
  getVisibleHintTargetIds(): ReadonlyArray<string> { return this.hints?.getVisibleTargetIds() || []; }
  getVisualFeedback(): ReturnType<LightWeaveVisuals['getFeedbackSnapshot']> | null { return this.visuals?.getFeedbackSnapshot() || null; }

  private setColliderDebugAll(obj: SceneObject, enabled: boolean): void {
    const collider = obj.getComponent('Physics.ColliderComponent') as ColliderComponent;
    if (collider) collider.debugDrawEnabled = enabled;
    for (let i = 0; i < obj.getChildrenCount(); i++) this.setColliderDebugAll(obj.getChild(i), enabled);
  }
}
