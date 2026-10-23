import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {LIGHTWEAVE_CONTRACTS as P} from '../LightWeaveSceneContracts';
import {ready,reset,LightWeaveLeafInteractor,expect,close,object,actualWeights,assertRenderAlignment,report,label,sleep} from './LightWeaveLeafSupport';
@component
export class LightWeaveStartControlsScenario extends Scenario {
  async run():Promise<void> {
    const main=await ready(); const actor=new LightWeaveLeafInteractor(); const run=await reset(main,actor);
    const start=main.getGardenFrame();
    close(start.mirror.halfWidthCm*2,16);close(start.mirror.halfHeightCm*2,18);
    expect(actualWeights().length).toBe(3);
    const transform=object(P.garden).getTransform(); const pos=transform.getWorldPosition();
    close(pos.x,0);close(pos.y,-40);close(pos.z,-140);
    const normal=transform.getWorldRotation().multiplyVec3(new vec3(0,0,1));close(normal.z,-1);
    const steps:[string,number,number][]=[['YawPlus',2,0],['PitchPlus',0,2],['YawMinus',-2,0],['PitchMinus',0,-2]];
    for(const [button,dy,dp] of steps) {
      const before=main.getGardenFrame().state;const accepted=main.getAcceptedInputCount();
      await actor.button(button);const after=main.getGardenFrame().state;
      close(after.yawDeg-before.yawDeg,dy);close(after.pitchDeg-before.pitchDeg,dp);
      expect(main.getAcceptedInputCount()-accepted).toBe(1);assertRenderAlignment(main);
      expect(label('Angles').text.includes(after.yawDeg.toFixed(1))).toBe(true);
      report('fine-control',{button,before,after});
    }
    await sleep(450);close(label('Instruction').textFill.color.w,0);
    await reset(main,actor);close(label('Instruction').textFill.color.w,1);
    report('start-controls',{run,position:{x:pos.x,y:pos.y,z:pos.z},state:main.getGardenFrame().state,weights:actualWeights()});
  }
}
