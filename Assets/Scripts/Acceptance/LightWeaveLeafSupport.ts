/** Acceptance-only helpers. Actions enter the real SIK Interactable route. */
import {DefaultLeafInteractor} from 'Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor';
import {awaitEventOnce, nextFrame, sleep, withTimeout} from 'Leaf.lspkg/Utils/common/Utils';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {Interactable} from 'SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';
import {LightWeaveMain} from '../LightWeaveMain';
import {LIGHTWEAVE_CONTRACTS as P} from '../LightWeaveSceneContracts';

export {nextFrame, sleep, expect};
export const COLORS = ['Coral', 'Teal', 'Gold'];
export const IDS = ['coral', 'teal', 'gold'];
// Production-observed world hand displacements, each from a fresh mirror grab.
export const INPUTS = [new vec3(44.4394722581,-6.7323754281,0), new vec3(-32.7508755416,-8.4436172217,0), new vec3(20.1560096291,-7.4975361785,0)];
export const TEXT_ROOT = P.ui + '/BackPlate/Content/PanelLayout/';

export function object(path: string): SceneObject {
  const names = path.split('/');
  let candidates: SceneObject[] = [];
  for (let i=0;i<global.scene.getRootObjectsCount();i++) candidates.push(global.scene.getRootObject(i));
  let result: SceneObject | undefined;
  for (const name of names) {
    const matches = candidates.filter(o => o.name === name);
    if (matches.length !== 1) throw new Error('Expected one object at ' + path + ', segment ' + name + ', got ' + matches.length);
    result = matches[0]; candidates=[];
    for (let i=0;i<result.getChildrenCount();i++) candidates.push(result.getChild(i));
  }
  return result!;
}
export function actualInput(path: string): Interactable {
  const o=object(path);
  const inputs=o.getComponents(Interactable.getTypeName()) as Interactable[];
  expect(inputs.length).toBe(1);
  expect(inputs[0].enabled && o.isEnabledInHierarchy).toBe(true);
  expect(inputs[0].colliders.length).toBeGreaterThan(0);
  return inputs[0];
}
export function label(name: string): Text { return object(TEXT_ROOT+name).getComponent('Component.Text') as Text; }
export function petals(color: string): RenderMeshVisual[] {
  const base=P.garden+'/LightWeave'+color+'/LightWeave'+color+'Art/Scenes/Flower_'+color+'_Closed/';
  return ['Petals','PetalHighlights'].map(n => {
    const mesh=object(base+n).getComponent('Component.RenderMeshVisual') as RenderMeshVisual;
    expect(mesh.getBlendShapeNames().includes('Bloom')).toBe(true); return mesh;
  });
}
export function actualWeights(): number[][] { return COLORS.map(c=>petals(c).map(m=>m.getBlendShapeWeight('Bloom'))); }
export function report(part: string, value: unknown): void { print('[LightWeaveLEAF] '+JSON.stringify({part,at:getTime(),value})); }
export function close(a:number,b:number,tolerance=.001):void { expect(Math.abs(a-b)<tolerance).toBe(true); }
export function vecClose(a:vec3,b:vec3,tolerance=.002):void { close(a.x,b.x,tolerance);close(a.y,b.y,tolerance);close(a.z,b.z,tolerance); }
export async function ready(): Promise<LightWeaveMain> {
  await sleep(1000);
  const main=object(P.main).getComponent(LightWeaveMain.getTypeName()) as LightWeaveMain;
  expect(!!main).toBe(true); expect(!!main.getVisualFeedback()).toBe(true);
  for (const name of ['YawMinus','YawPlus','PitchMinus','PitchPlus','Replay']) actualInput(P.buttonRow+'/'+name);
  actualInput(P.mirrorHit); actualWeights();
  return main;
}

/** Installed BaseLeafInteractor.drag uses per-frame vectors. This adapter consumes
 * one measured delta per genuine onDragUpdate, so total motion does not depend on FPS.
 * It does not invoke game events, set scene transforms or call gameplay methods. */
export class LightWeaveLeafInteractor extends DefaultLeafInteractor {
  async button(name:string):Promise<void> { await this.trigger(actualInput(P.buttonRow+'/'+name)); await nextFrame(); }
  async beginMirror():Promise<void> {
    const target=actualInput(P.mirrorHit);
    await this.enterHover(target); await nextFrame();
    const started=awaitEventOnce(target.onTriggerStart); this.startSelecting();
    await withTimeout(started,2000,'Mirror TriggerStart not observed');
  }
  async moveMirror(total:vec3,durationMs:number):Promise<void> {
    const target=actualInput(P.mirrorHit); const start=getTime(); let applied=vec3.zero();
    do {
      await nextFrame();
      const fraction=Math.min(1,(getTime()-start)*1000/durationMs);
      const desired=total.uniformScale(fraction); const delta=desired.sub(applied);
      if (delta.length>1e-8) {
        const moved=awaitEventOnce(target.onDragUpdate);
        this.overrideDragVector=delta;
        await withTimeout(moved,2000,'Mirror DragUpdate not observed');
        this.overrideDragVector=undefined;
        this.startPoint=this.startPoint.add(delta); this.endPoint=this.endPoint.add(delta);
      }
      applied=desired;
    } while (applied.distance(total)>1e-6);
  }
  async endMirror(settle=true):Promise<void> {
    const ended=awaitEventOnce(actualInput(P.mirrorHit).onTriggerEnd);
    this.overrideDragVector=undefined; this.stopSelecting();
    await withTimeout(ended,2000,'Mirror TriggerEnd not observed');
    await this.exitHover(); this.resetStartEndPoint(); if(settle) await nextFrame();
  }
  async mirror(total:vec3,durationMs=1300):Promise<void> {
    await this.beginMirror(); await this.moveMirror(total,durationMs); await this.endMirror();
  }
}
export async function reset(main:LightWeaveMain,actor:LightWeaveLeafInteractor):Promise<number> {
  await actor.button('Replay');
  const f=main.getGardenFrame(); close(f.state.yawDeg,-55);close(f.state.pitchDeg,-22);
  expect(f.state.earnedReceiverIds.length).toBe(0);expect(f.complete).toBe(false);
  expect(label('Progress').text.includes('0/3')).toBe(true);
  expect(label('Instruction').text.includes('Pinch and drag')).toBe(true);
  expect(label('Instruction').getSceneObject().isEnabledInHierarchy).toBe(true);
  for(const list of actualWeights())for(const w of list)close(w,0);
  expect(main.getAcceptedInputCount()).toBe(0);
  const replay=main.getAudioEvents().filter(e=>e.id==='replay');
  expect(replay.length).toBeGreaterThan(0); return replay[replay.length-1].run;
}
export function count(main:LightWeaveMain,id:string,run:number):number { return main.getAudioEvents().filter(e=>e.id===id&&e.run===run).length; }
export async function complete(main:LightWeaveMain,actor:LightWeaveLeafInteractor,run:number):Promise<void> {
  for(let i=0;i<3;i++) {
    const before=main.getGardenFrame().state.earnedReceiverIds.slice();
    await actor.mirror(INPUTS[i]); await sleep(950);
    const f=main.getGardenFrame();expect(f.trace.hitReceiverId).toBe(IDS[i]);
    expect(f.state.earnedReceiverIds.length-before.length).toBe(1);
    expect(f.state.earnedReceiverIds.includes(IDS[i])).toBe(true);
    expect(count(main,'bloom_0'+(i+1),run)).toBe(1);
    for(const w of actualWeights()[i])close(w,1);
  }
  expect(main.getGardenFrame().complete).toBe(true);
  expect(label('Progress').text.includes('Garden Complete')).toBe(true);
  expect(count(main,'garden_complete',run)).toBe(1);
}
export function assertRenderAlignment(main:LightWeaveMain):void {
  const f=main.getGardenFrame();const pose=object(P.mirror).getTransform();
  const normal=pose.getLocalRotation().multiplyVec3(new vec3(0,0,-1));
  vecClose(normal,new vec3(f.mirror.normal.x,f.mirror.normal.y,f.mirror.normal.z));
  f.trace.segments.forEach((s,i)=>{
    const transform=object(P.beams+'/LightWeaveBeamSegment'+i).getTransform();
    vecClose(transform.getLocalPosition(),new vec3(s.from.x,s.from.y,s.from.z));
    if(s.endKind!=='range') {
      const end=transform.getLocalPosition().add(transform.getLocalRotation().multiplyVec3(new vec3(0,0,transform.getLocalScale().z)));
      vecClose(end,new vec3(s.to.x,s.to.y,s.to.z));
    }
  });
}
