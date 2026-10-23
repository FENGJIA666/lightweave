import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {ready,reset,LightWeaveLeafInteractor,expect,close,actualWeights,assertRenderAlignment,report,sleep,INPUTS,IDS,count} from './LightWeaveLeafSupport';
@component
export class LightWeaveConnectionsScenario extends Scenario {
  async run():Promise<void> {
    const main=await ready();const actor=new LightWeaveLeafInteractor();const run=await reset(main,actor);
    const baseline=main.getVisualFeedback()!;
    const samples:{at:number;earned:readonly string[];actual:number[][];reported:number[]}[]=[];
    const observe=this.createEvent('LateUpdateEvent');observe.bind(()=>samples.push({at:getTime(),earned:main.getGardenFrame().state.earnedReceiverIds,actual:actualWeights(),reported:main.getBloomWeights()}));
    for(let i=0;i<3;i++) {
      const before=main.getGardenFrame().state.earnedReceiverIds.slice();await actor.mirror(INPUTS[i]);await sleep(950);
      const f=main.getGardenFrame();expect(f.trace.hitReceiverId).toBe(IDS[i]);
      expect(f.state.earnedReceiverIds.length-before.length).toBe(1);expect(f.state.earnedReceiverIds.includes(IDS[i])).toBe(true);
      expect(count(main,'bloom_0'+(i+1),run)).toBe(1);
      for(let j=0;j<3;j++)for(const w of actualWeights()[j])close(w,j<=i?1:0);
      const lit=main.getVisualFeedback()!;expect(JSON.stringify(lit.receivers[i])!==JSON.stringify(baseline.receivers[i])).toBe(true);
      assertRenderAlignment(main);report('connection',{id:IDS[i],state:f.state,liveHit:f.trace.hitReceiverId,actual:actualWeights()});
      if(i===0) {
        const cues=main.getAudioEvents().length;await sleep(3000);expect(main.getAudioEvents().length).toBe(cues);
        expect(main.getGardenFrame().state.earnedReceiverIds).toEqual(f.state.earnedReceiverIds);
        await actor.mirror(new vec3(10,0,0),500);expect(main.getGardenFrame().trace.hitReceiverId).toBeNull();
        expect(main.getVisualFeedback()!.receivers[0]).toEqual(baseline.receivers[0]);
        expect(main.getVisualFeedback()!.rimScales[0]).toEqual(baseline.rimScales[0]);
        for(const w of actualWeights()[0])close(w,1);
        await actor.mirror(new vec3(-10,0,0),500);expect(main.getGardenFrame().trace.hitReceiverId).toBe('coral');
        expect(count(main,'bloom_01',run)).toBe(1);
      }
    }
    observe.enabled=false;
    const timings:unknown[]=[];
    for(let i=0;i<3;i++) {
      const cue=main.getAudioEvents().find(e=>e.run===run&&e.id==='bloom_0'+(i+1))!;
      const full=samples.find(s=>s.at>=cue.at&&s.actual[i].every(w=>w>=.9999));
      expect(!!full).toBe(true);const elapsed=full!.at-cue.at;
      expect(elapsed>=.70&&elapsed<=1.00).toBe(true);
      expect(samples.some(s=>s.at>=cue.at&&s.actual[i].some(w=>w>.05&&w<.95))).toBe(true);
      for(const s of samples)for(const w of s.actual[i])close(w,s.reported[i],.002);
      timings.push({id:IDS[i],secondsToOpen:elapsed});
    }
    const cues=main.getAudioEvents().filter(e=>e.run===run);const gold=cues.find(e=>e.id==='bloom_03')!;const celebration=cues.find(e=>e.id==='garden_complete')!;
    expect(count(main,'garden_complete',run)).toBe(1);const delay=celebration.at-gold.at;expect(delay>=.2&&delay<=.4).toBe(true);
    const clicks=cues.filter(e=>e.id==='mirror_adjust_click');for(let i=1;i<clicks.length;i++)expect(clicks[i].at-clicks[i-1].at>=.0999).toBe(true);
    const reflected=main.getGardenFrame().trace.segments[1];expect(Math.abs(reflected.to.y-reflected.from.y)>1).toBe(true);
    report('bloom-and-audio-timing',{run,timings,completionDelay:delay,cues,sampleCount:samples.length});
  }
}
