/** Owns the six original cues and a cancellable completion delay. Never changes game state. */
const clickTrack = requireAsset('../GeneratedSFX/mirror_adjust_click.wav') as AudioTrackAsset;
const coralTrack = requireAsset('../GeneratedSFX/bloom_01.wav') as AudioTrackAsset;
const tealTrack = requireAsset('../GeneratedSFX/bloom_02.wav') as AudioTrackAsset;
const goldTrack = requireAsset('../GeneratedSFX/bloom_03.wav') as AudioTrackAsset;
const completeTrack = requireAsset('../GeneratedSFX/garden_complete.wav') as AudioTrackAsset;
const airTrack = requireAsset('../GeneratedSFX/garden_air_loop.wav') as AudioTrackAsset;

export interface LightWeaveCue { id: string; run: number; at: number }

export class LightWeaveAudioController {
  private click: AudioComponent;
  private blooms: AudioComponent[];
  private complete: AudioComponent;
  private air: AudioComponent;
  private completionDue = -1;
  private lastTick = -100;
  private run = 1;
  private cues: LightWeaveCue[] = [];
  private duckUntil = -1;

  constructor(root: SceneObject, mirror: SceneObject, flowers: SceneObject[], private sfxGain: number, private ambientGain: number) {
    this.click = this.make(mirror, clickTrack, 0.55 * sfxGain, true);
    this.blooms = [coralTrack, tealTrack, goldTrack].map((track, i) => this.make(flowers[i], track, 0.7 * sfxGain, true));
    this.complete = this.make(root, completeTrack, 0.65 * sfxGain, true);
    this.air = this.make(root, airTrack, ambientGain, false);
    this.air.fadeInTime = 0.5; this.air.fadeOutTime = 0.5;
    this.air.play(-1);
    this.record('ambient-start');
  }

  private make(parent: SceneObject, track: AudioTrackAsset, gain: number, spatial: boolean): AudioComponent {
    const audio = parent.createComponent('Component.AudioComponent') as AudioComponent;
    audio.audioTrack = track; audio.volume = gain;
    audio.playbackMode = spatial ? Audio.PlaybackMode.LowLatency : Audio.PlaybackMode.LowPower;
    audio.spatialAudio.enabled = spatial;
    if (spatial) { audio.spatialAudio.positionEffect.enabled = true; audio.spatialAudio.distanceEffect.enabled = false; }
    audio.mixToSnap = true;
    return audio;
  }

  tick(): void {
    if (getTime() - this.lastTick < 0.1) return;
    this.lastTick = getTime(); this.click.play(1); this.record('mirror_adjust_click');
  }

  bloom(id: string): void {
    const index = ['coral', 'teal', 'gold'].indexOf(id);
    if (index < 0) return;
    this.blooms[index].play(1); this.record('bloom_0' + (index + 1));
  }

  scheduleComplete(): void { this.completionDue = getTime() + 0.3; }

  update(): void {
    if (this.completionDue >= 0 && getTime() >= this.completionDue) {
      this.completionDue = -1; this.complete.play(1); this.record('garden_complete');
      this.duckUntil = getTime() + 3.2;
    }
    this.air.volume = this.ambientGain * (getTime() < this.duckUntil ? Math.pow(10, -4 / 20) : 1);
  }

  reset(): void {
    this.completionDue = -1; this.duckUntil = -1; this.run++;
    this.complete.stop(false); this.blooms.forEach(a => a.stop(false));
    this.record('replay');
  }

  getEvents(): LightWeaveCue[] { return this.cues.map(cue => ({ ...cue })); }

  private record(id: string): void {
    const cue = { id, run: this.run, at: getTime() };
    this.cues.push(cue);
    if (this.cues.length > 200) this.cues.shift();
    console.log('[LightWeaveCue] ' + JSON.stringify(cue));
  }
}
