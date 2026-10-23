import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {LIGHTWEAVE_CONTRACTS as P} from '../LightWeaveSceneContracts';
import {ready,reset,LightWeaveLeafInteractor,expect,close,object,vecClose,assertRenderAlignment,report,sleep,nextFrame} from './LightWeaveLeafSupport';
@component
export class LightWeaveDragScenario extends Scenario {
  async run():Promise<void> {
    const main=await ready();const actor=new LightWeaveLeafInteractor();await reset(main,actor);
    const center=object(P.mirror).getTransform().getWorldPosition();const base=main.getVisualFeedback()!;
    await actor.beginMirror();await nextFrame();
    const highlighted=main.getVisualFeedback()!;
    expect(JSON.stringify(highlighted.mirror)!==JSON.stringify(base.mirror)).toBe(true);
    const initial=main.getGardenFrame().state;const startTime=getTime();
    const observations:{time:number;yaw:number;pitch:number}[]=[];
    const sample=this.createEvent('LateUpdateEvent');sample.bind(()=>{
      const s=main.getGardenFrame().state;
      observations.push({time:getTime(),yaw:s.yawDeg,pitch:s.pitchDeg});
    });
    await actor.moveMirror(new vec3(10,-4,0),5000);await actor.endMirror();sample.enabled=false;
    const retained=main.getGardenFrame().state;close(retained.yawDeg-initial.yawDeg,20,.02);close(retained.pitchDeg-initial.pitchDeg,8,.02);
    expect(getTime()-startTime>=5).toBe(true);expect(observations.length).toBeGreaterThan(10);
    expect(observations.every(s=>s.yaw>=-65.001&&s.yaw<=65.001&&s.pitch>=-35.001&&s.pitch<=35.001)).toBe(true);
    await sleep(300);expect(main.getGardenFrame().state).toEqual(retained);assertRenderAlignment(main);
    vecClose(object(P.mirror).getTransform().getWorldPosition(),center);
    expect(main.getVisualFeedback()!.mirror).toEqual(base.mirror);
    await reset(main,actor);await actor.beginMirror();await actor.moveMirror(new vec3(65,0,0),900);
    close(main.getGardenFrame().state.yawDeg,65);await actor.moveMirror(new vec3(-65,0,0),900);await actor.endMirror();
    close(main.getGardenFrame().state.yawDeg,-55,.02);close(main.getGardenFrame().state.pitchDeg,-22,.02);
    vecClose(object(P.mirror).getTransform().getWorldPosition(),center);
    // Separate clamp presses still travel through the actual controls.
    await actor.mirror(new vec3(65,40,0),700);close(main.getGardenFrame().state.pitchDeg,-35);
    const bounded=main.getGardenFrame().state;await actor.button('YawPlus');await actor.button('PitchMinus');
    expect(main.getGardenFrame().state).toEqual(bounded);
    report('drag',{duration:getTime()-startTime,frames:observations.length,first:observations[0],last:observations[observations.length-1],retained,clamp:bounded});
  }
}
