/** Owns beam presentation and flower morphs under authored slots. Never awards progress. */
import { GARDEN_RECEIVERS } from './Core/garden';
import type { GardenFrame } from './Core/garden';
import type { Vec3 } from './Core/vector';

const beamPrefab = requireAsset('../GeneratedMeshes/Beam_1cm.glb') as ObjectPrefab;
const v3 = (p: Vec3): vec3 => new vec3(p.x, p.y, p.z);
const RAD = Math.PI / 180;

export interface LightWeaveVisualRefs {
  mirrorPose: SceneObject;
  beamPool: SceneObject;
  flowers: SceneObject[];
}

export class LightWeaveVisuals {
  private beams: SceneObject[] = [];
  private morphs: RenderMeshVisual[][] = [];
  private bloomWeights = [0, 0, 0];
  private bloomTargets = [0, 0, 0];
  private mirrorMaterials: { material: Material; color: vec4 }[] = [];
  private receiverMaterials: { material: Material; color: vec4 }[][] = [[], [], []];
  private receiverRims: { transform: Transform; scale: vec3 }[][] = [[], [], []];
  private liveReceiverId: string | null = null;

  constructor(private refs: LightWeaveVisualRefs, private bloomSeconds: number) {
    refs.flowers.forEach((root, i) => {
      this.morphs[i] = [];
      this.walk(root, obj => {
        const player = obj.getComponent('Component.AnimationPlayer') as AnimationPlayer;
        if (player) { player.stopAll(); player.enabled = false; }
        const mesh = obj.getComponent('Component.RenderMeshVisual') as RenderMeshVisual;
        if (mesh && mesh.getBlendShapeNames().includes('Bloom')) this.morphs[i].push(mesh);
        if (mesh && (obj.name === 'ReceiverSphere_R4cm' || obj.name === 'ReceiverRim')) {
          const tint = this.cloneGltfTint(mesh);
          if (tint) this.receiverMaterials[i].push(tint);
          if (obj.name === 'ReceiverRim') {
            const transform = obj.getTransform();
            this.receiverRims[i].push({ transform, scale: transform.getLocalScale() });
          }
        }
      });
      console.log('[LightWeave] bloom-morphs ' + GARDEN_RECEIVERS[i].id + '=' + this.morphs[i].length);
    });
    this.walk(refs.mirrorPose, obj => {
      const mesh = obj.getComponent('Component.RenderMeshVisual') as RenderMeshVisual;
      if (!mesh) return;
      const tint = this.cloneGltfTint(mesh);
      if (tint) this.mirrorMaterials.push(tint);
    });
    this.reset();
  }

  /** Imported GLB shader exposes baseColorFactor, as confirmed in the native asset snapshot. */
  private cloneGltfTint(mesh: RenderMeshVisual): { material: Material; color: vec4 } | null {
    if (!mesh.mainMaterial) return null;
    const material = mesh.mainMaterial.clone();
    const color = material.mainPass.baseColorFactor as vec4;
    if (!color) return null;
    mesh.clearMaterials(); mesh.addMaterial(material);
    return { material, color: new vec4(color.x, color.y, color.z, color.w) };
  }

  private walk(root: SceneObject, visit: (obj: SceneObject) => void): void {
    visit(root);
    for (let i = 0; i < root.getChildrenCount(); i++) this.walk(root.getChild(i), visit);
  }

  setSelected(selected: boolean): void {
    for (const item of this.mirrorMaterials) {
      const c = item.color;
      item.material.mainPass.baseColorFactor = selected
        ? new vec4(Math.min(1, c.x + 0.22), Math.min(1, c.y + 0.22), Math.min(1, c.z + 0.22), c.w)
        : c;
    }
  }

  render(frame: GardenFrame): void {
    this.liveReceiverId = frame.trace.hitReceiverId;
    // Exactly Y(yaw) * X(pitch), matching the optical core's normal and uAxis.
    const pitch = quat.angleAxis(frame.state.pitchDeg * RAD, new vec3(1, 0, 0));
    const yaw = quat.angleAxis(frame.state.yawDeg * RAD, new vec3(0, 1, 0));
    this.refs.mirrorPose.getTransform().setLocalRotation(yaw.multiply(pitch));
    frame.trace.segments.forEach((segment, index) => {
      if (!this.beams[index]) {
        const wrapper = global.scene.createSceneObject('LightWeaveBeamSegment' + index);
        wrapper.setParent(this.refs.beamPool);
        beamPrefab.instantiate(wrapper); // Keep imported GLB scale (100); stretch the wrapper only.
        this.beams[index] = wrapper;
      }
      const from = v3(segment.from);
      const to = v3(segment.endKind === 'range' ? this.clipMiss(segment.from, segment.to) : segment.to);
      const delta = to.sub(from);
      const length = delta.length;
      const wrapper = this.beams[index];
      wrapper.enabled = length > 0.001;
      if (length <= 0.001) return;
      const transform = wrapper.getTransform();
      transform.setLocalPosition(from);
      transform.setLocalRotation(quat.rotationFromTo(new vec3(0, 0, 1), delta.normalize()));
      transform.setLocalScale(new vec3(1, 1, length));
    });
    for (let i = frame.trace.segments.length; i < this.beams.length; i++) this.beams[i].enabled = false;
    GARDEN_RECEIVERS.forEach((target, i) => {
      this.bloomTargets[i] = frame.state.earnedReceiverIds.includes(target.id) ? 1 : 0;
    });
    this.updateLiveIllumination();
  }

  update(dt: number): void {
    this.updateLiveIllumination();
    for (let i = 0; i < 3; i++) {
      const target = this.bloomTargets[i];
      this.bloomWeights[i] = Math.min(target, this.bloomWeights[i] + dt / this.bloomSeconds);
      const t = this.bloomWeights[i];
      const eased = t * t * (3 - 2 * t);
      for (const mesh of this.morphs[i]) mesh.setBlendShapeWeight('Bloom', eased);
    }
  }

  private updateLiveIllumination(): void {
    for (let i = 0; i < 3; i++) {
      const live = this.liveReceiverId === GARDEN_RECEIVERS[i].id;
      const whiteMix = live ? 0.42 : 0;
      for (const item of this.receiverMaterials[i]) {
        const c = item.color;
        item.material.mainPass.baseColorFactor = new vec4(
          c.x + (1 - c.x) * whiteMix, c.y + (1 - c.y) * whiteMix,
          c.z + (1 - c.z) * whiteMix, c.w);
      }
      const pulse = live ? 1.06 + 0.025 * Math.sin(getTime() * Math.PI * 3) : 1;
      for (const rim of this.receiverRims[i]) rim.transform.setLocalScale(rim.scale.uniformScale(pulse));
    }
  }

  reset(): void {
    this.liveReceiverId = null;
    this.updateLiveIllumination();
    this.bloomTargets = [0, 0, 0]; this.bloomWeights = [0, 0, 0];
    this.morphs.forEach(list => list.forEach(mesh => mesh.setBlendShapeWeight('Bloom', 0)));
  }

  getBloomWeights(): number[] { return this.bloomWeights.map(t => t * t * (3 - 2 * t)); }

  /** Samples the actual cloned render materials and rim transforms for acceptance diagnostics. */
  getFeedbackSnapshot(): { liveReceiverId: string | null; mirror: number[][]; receivers: number[][][]; rimScales: number[][][] } {
    const color = (material: Material): number[] => {
      const c = material.mainPass.baseColorFactor as vec4;
      return [c.x, c.y, c.z, c.w];
    };
    return {
      liveReceiverId: this.liveReceiverId,
      mirror: this.mirrorMaterials.map(item => color(item.material)),
      receivers: this.receiverMaterials.map(list => list.map(item => color(item.material))),
      rimScales: this.receiverRims.map(list => list.map(item => {
        const s = item.transform.getLocalScale(); return [s.x, s.y, s.z];
      })),
    };
  }

  private clipMiss(from: Vec3, to: Vec3): Vec3 {
    const d = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
    let fraction = 1;
    const limits = { x: [-35, 35], y: [-14, 46], z: [-35, 35] };
    for (const key of ['x', 'y', 'z'] as const) {
      if (Math.abs(d[key]) < 1e-9) continue;
      const edge = limits[key][d[key] > 0 ? 1 : 0];
      fraction = Math.min(fraction, Math.max(0, (edge - from[key]) / d[key]));
    }
    return { x: from.x + d.x * fraction, y: from.y + d.y * fraction, z: from.z + d.z * fraction };
  }
}
