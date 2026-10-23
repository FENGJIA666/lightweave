import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {ready,reset,LightWeaveLeafInteractor,expect,report,sleep,INPUTS,count} from './LightWeaveLeafSupport';
@component
export class LightWeaveCancelScenario extends Scenario {
  async run():Promise<void> {
    const main=await ready();const actor=new LightWeaveLeafInteractor();const cancelRun=await reset(main,actor);
    await actor.mirror(INPUTS[0],600);await actor.mirror(INPUTS[1],600);
    await actor.beginMirror();await actor.moveMirror(INPUTS[2],80);await actor.endMirror(false);
    const gold=main.getAudioEvents().find(e=>e.run===cancelRun&&e.id==='bloom_03');expect(!!gold).toBe(true);
    const nextRun=await reset(main,actor);const replay=main.getAudioEvents().filter(e=>e.run===nextRun&&e.id==='replay')[0];
    const resetDelay=replay.at-gold!.at;
    if(resetDelay>=.3)throw new Error('Cancellation setup missed pending window: Replay '+resetDelay.toFixed(4)+'s after gold; this does not establish a product cancellation failure.');
    await sleep(500);expect(count(main,'garden_complete',cancelRun)).toBe(0);
    expect(main.getGardenFrame().state.earnedReceiverIds.length).toBe(0);
    report('pending-cue-cancelled',{cancelRun,nextRun,resetDelay,cues:main.getAudioEvents().filter(e=>e.run>=cancelRun)});
  }
}
