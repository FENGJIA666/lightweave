import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {ready,reset,LightWeaveLeafInteractor,expect,report,sleep,INPUTS,count,complete} from './LightWeaveLeafSupport';
@component
export class LightWeaveReplayScenario extends Scenario {
  async run():Promise<void> {
    const main=await ready();const actor=new LightWeaveLeafInteractor();const first=await reset(main,actor);
    await complete(main,actor,first);const second=await reset(main,actor);expect(second-first).toBe(1);
    await complete(main,actor,second);
    report('two-complete-runs',{first,second,state:main.getGardenFrame().state,cues:main.getAudioEvents()});
  }
}
