import {RoundedRectangle} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"

export interface LightWeaveHintTarget {
  id: string
  worldPosition: vec3
  earned: boolean
}

// Manager defaults in centimeters. Radius matches the existing optical receivers.
const RECEIVER_RADIUS_CM = 4
const HINT_MAX_DIAMETER_CM = 2
const HINT_DEPTH_CM = 80
const EDGE_GAP_CM = 1
const HINT_SEPARATION_CM = 2.5

/** Passive, camera-projected guidance. It never changes optics, input or progress. */
export class LightWeaveDirectionHints {
  private readonly root: SceneObject
  private readonly hints = new Map<string, SceneObject>()
  private visibleIds: string[] = []

  constructor(private readonly camera: Camera, parent: SceneObject) {
    this.root = global.scene.createSceneObject("LightWeaveDirectionHints")
    this.root.setParent(parent)
    this.root.createComponent("Component.Canvas")
  }

  update(targets: ReadonlyArray<LightWeaveHintTarget>): void {
    this.visibleIds = []
    for (const hint of this.hints.values()) hint.enabled = false
    if (isNull(this.camera) || !this.camera.enabled) return

    // Derive edge padding from the real camera's projection at the hint plane.
    // No assumed screen aspect, field-of-view angle or workbench orientation.
    const depth = Math.min(HINT_DEPTH_CM, Math.max(1, this.camera.far - this.camera.near - 1))
    const left = this.camera.screenSpaceToWorldSpace(new vec2(0, 0.5), depth)
    const right = this.camera.screenSpaceToWorldSpace(new vec2(1, 0.5), depth)
    const top = this.camera.screenSpaceToWorldSpace(new vec2(0.5, 0), depth)
    const bottom = this.camera.screenSpaceToWorldSpace(new vec2(0.5, 1), depth)
    const width = right.sub(left).length
    const height = top.sub(bottom).length
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 6 || height <= 6) return
    const inset = HINT_MAX_DIAMETER_CM / 2 + EDGE_GAP_CM
    const halfX = 0.5 - inset / width
    const halfY = 0.5 - inset / height
    const view = this.camera.getViewMatrix()
    const inverseView = view.inverse()
    const cameraRotation = this.camera.getTransform().getWorldRotation()
    const occupied: vec2[] = []

    for (const target of targets) {
      const position = target.worldPosition
      if (target.earned || !this.finite(position)) continue
      // Any visible portion of the receiving sphere suppresses its hint.
      if (this.camera.isSphereVisible(position, RECEIVER_RADIUS_CM)) continue

      const local = view.multiplyPoint(position)
      const behind = local.z >= 0
      // Project a front-facing proxy for targets behind the camera. This keeps
      // left/right and up/down guidance from reversing with projection depth.
      const projectedPosition = behind
        ? inverseView.multiplyPoint(new vec3(local.x, local.y, -Math.max(1, Math.abs(local.z))))
        : position
      const projected = this.camera.worldSpaceToScreenSpace(projectedPosition)
      if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y)) continue
      let dx = projected.x - 0.5
      let dy = projected.y - 0.5
      if (dx * dx + dy * dy < 1e-10) {
        // A target directly behind has no unique turn direction; choose right.
        if (!behind) continue
        dx = 1
        dy = 0
      }
      const travel = Math.min(
        Math.abs(dx) > 1e-9 ? halfX / Math.abs(dx) : Infinity,
        Math.abs(dy) > 1e-9 ? halfY / Math.abs(dy) : Infinity,
      )
      const edge = new vec2(0.5 + dx * travel, 0.5 + dy * travel)
      const screen = this.separate(edge, occupied, width, height, halfX, halfY)
      occupied.push(screen)
      const hint = this.hints.get(target.id) ?? this.createHint(target.id)
      const transform = hint.getTransform()
      transform.setWorldScale(new vec3(1, 1, 1))
      transform.setWorldPosition(this.camera.screenSpaceToWorldSpace(screen, depth))
      // Screen Y points down; camera-local Y points up. Account for physical aspect.
      const angle = Math.atan2(-dy * height, dx * width)
      transform.setWorldRotation(cameraRotation.multiply(quat.angleAxis(angle, new vec3(0, 0, 1))))
      hint.enabled = true
      this.visibleIds.push(target.id)
    }
  }

  getVisibleTargetIds(): ReadonlyArray<string> {
    return this.visibleIds.filter(id => {
      const hint = this.hints.get(id)
      return !!hint && !isNull(hint) && hint.isEnabledInHierarchy
    })
  }

  destroy(): void {
    this.visibleIds = []
    this.hints.clear()
    if (!isNull(this.root)) this.root.destroy()
  }

  private finite(position: vec3): boolean {
    return Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z)
  }

  private separate(edge: vec2, occupied: vec2[], width: number, height: number, halfX: number, halfY: number): vec2 {
    const onVerticalEdge = Math.abs(Math.abs(edge.x - 0.5) - halfX) < 1e-5
    for (const step of [0, -1, 1, -2, 2]) {
      const x = onVerticalEdge ? edge.x : edge.x + step * HINT_SEPARATION_CM / width
      const y = onVerticalEdge ? edge.y + step * HINT_SEPARATION_CM / height : edge.y
      const candidate = new vec2(
        Math.max(0.5 - halfX, Math.min(0.5 + halfX, x)),
        Math.max(0.5 - halfY, Math.min(0.5 + halfY, y)),
      )
      const clear = occupied.every(other => {
        const sx = (candidate.x - other.x) * width
        const sy = (candidate.y - other.y) * height
        return sx * sx + sy * sy >= HINT_SEPARATION_CM * HINT_SEPARATION_CM - 1e-6
      })
      if (clear) return candidate
    }
    return edge
  }

  private createHint(id: string): SceneObject {
    const hint = global.scene.createSceneObject("DirectionHint_" + id)
    hint.setParent(this.root)
    const color = id === "coral" ? new vec4(1, 0.43, 0.53, 1)
      : id === "gold" ? new vec4(1, 0.8, 0.35, 1) : new vec4(0.16, 0.9, 0.78, 1)
    // Chevron ends all lie within a radius-1 cm disk, including stroke thickness.
    // UIKit primitives provide the visuals; there are no interactive components.
    for (const sign of [-1, 1]) {
      const tip = new vec2(0.85, 0)
      const wing = new vec2(-0.55, sign * 0.72)
      const arm = global.scene.createSceneObject(sign < 0 ? "LowerArm" : "UpperArm")
      arm.setParent(hint)
      arm.getTransform().setLocalPosition(new vec3((tip.x + wing.x) / 2, (tip.y + wing.y) / 2, 0))
      arm.getTransform().setLocalRotation(quat.angleAxis(Math.atan2(tip.y - wing.y, tip.x - wing.x), new vec3(0, 0, 1)))
      const shape = arm.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
      shape.size = new vec2(Math.sqrt((tip.x - wing.x) ** 2 + (tip.y - wing.y) ** 2), 0.12)
      shape.depth = 0.04
      shape.cornerRadius = 0.06
      shape.gradient = false
      shape.border = false
      shape.backgroundColor = color
      shape.initialize()
    }
    hint.enabled = false
    this.hints.set(id, hint)
    return hint
  }
}
