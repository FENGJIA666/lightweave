// Original LightWeave sound design. Uses the pinned cached Apache-2.0 CLAD DSP engine.
// Staging location follows this task's explicit media/audio ownership boundary.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const OUTPUT = path.resolve(__dirname);
const ENGINE_SOURCE = 'vendor/clad-audio';
const a = require(path.join(ROOT, ENGINE_SOURCE, 'build-sfx/tools'));
const m = require(path.join(ROOT, ENGINE_SOURCE, 'build-music/tools'));
const SR = a.SAMPLE_RATE;
const db = value => 10 ** (value / 20);
const ledger = [];
fs.mkdirSync(OUTPUT, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'vendor/clad-audio/LICENSE'), path.join(OUTPUT, 'ENGINE-LICENSE.txt'));

function mono(buffer) {
  if (!buffer.left) return buffer;
  const out = new Float32Array(buffer.left.length);
  for (let i = 0; i < out.length; i++) out[i] = (buffer.left[i] + buffer.right[i]) * 0.5;
  return out;
}
function exact(buffer, seconds) {
  const out = new Float32Array(Math.round(seconds * SR));
  out.set(buffer.subarray(0, out.length));
  return out;
}
function finalizeOneShot(buffer, seconds, peakDb) {
  const out = exact(mono(buffer), seconds);
  a.highPass2(out, 110, 0.707);
  a.fadeIn(out, 0.0015);
  a.fadeOut(out, Math.min(0.12, seconds * 0.12));
  a.mix_bus.masterChain(out, { normalize: 'peak', peakCeiling: db(peakDb) });
  // masterChain removes DC; finish a tiny edge fade to restore zero-valued edges.
  a.fadeIn(out, 0.0007); a.fadeOut(out, 0.008);
  return out;
}
function write(name, buffer, metadata) {
  a.WavBuilder.write(buffer, path.join(OUTPUT, name + '.wav'));
  ledger.push({ id: name, file: `media/audio/${name}.wav`, lens_destination: `Assets/GeneratedSFX/${name}.wav`, ...metadata });
  return buffer;
}

// Physical tick + mechanism + soft body, synthesized by the curated preset.
const click = write('mirror_adjust_click', finalizeOneShot(a.sfx_presets.uiClick({ character: 'soft', pitch: -3 }), 0.08, -23), {
  purpose: 'Mirror grab / deliberately throttled adjustment tick', synthesis: 'Layered uiClick soft preset; HPF; short fades',
  loop: false, channels: 1, spatial: 'Attach to the mirror', suggested_gain: 0.55,
  trigger: 'Grab start; optional angle-step ticks with at least 100 ms cooldown. Never every frame.'
});

// One coherent D-major discovery motif; fresh physical timbre variation per asset.
const blooms = [];
for (const [index, degree, note] of [[1, 0, 'D5'], [2, 2, 'F#5'], [3, 4, 'A5']]) {
  const events = m.parseMini(String(degree), { cycleBeats: 0.18 });
  m.scale(events, 'major', 'D5');
  events[0].velocity = 75 + index * 3;
  const layers = [
    m.track('light-petal', 'musicBox', events, { fx: { hpf: 260, lpf: 6200, gain: 0.65, reverb: { duration: 0.35, roomSize: 0.25, hfDamping: 0.7, wet: 0.12 } } }),
    m.track('warm-body', 'kalimba', events, { fx: { hpf: 180, lpf: 3800, gain: 0.18 } })
  ];
  const sound = m.render(layers, { bpm: 120, duration: 2.1, master: { normalize: 'peak', glue: true, peakCeiling: 0.7 } });
  blooms.push(write(`bloom_0${index}`, finalizeOneShot(sound, 2.1, -16), {
    purpose: `Flower ${index} activation`, note, scale_degree: degree, synthesis: 'Original D-major motif; musicBox + kalimba physical synthesis; short room tail',
    loop: false, channels: 1, spatial: 'Attach to its flower', suggested_gain: 0.7,
    trigger: 'Once when this target first becomes complete; re-arm after reset.'
  }));
}

const bpm = m.suggestTempo('dreamy');
const { chords, meta } = m.composeChords({ genre: 'dreamy', voice: 'musicBox', key: 'D4', scale: 'major', progression: ['I'], extension: 'add9' });
const melody = m.parseMini('0 2 4 7', { cycleBeats: 1.3 });
m.scale(melody, 'major', 'D5');
const comp = m.chordEvents(chords, { voice: 'musicBox', bars: 1, velocity: 58, gateOverride: 0.08, stagger: 0.08 });
for (const e of comp) e.time += 0.75;
const celebration = m.render([
  m.track('discovery-rise', 'musicBox', melody, { fx: { hpf: 320, lpf: 6400, gain: 0.65, reverb: { duration: 0.45, roomSize: 0.35, hfDamping: 0.65, wet: 0.16 } } }),
  m.track('garden-open', 'musicBox', comp, { fx: { hpf: 190, lpf: 4200, gain: 0.25 } })
], { bpm, duration: 3.2, master: { normalize: 'peak', glue: true, peakCeiling: 0.8 } });
const complete = write('garden_complete', finalizeOneShot(celebration, 3.2, -14), {
  purpose: 'All three flowers complete', synthesis: 'Original ascending D-major discovery motif plus tonic add9 bloom',
  harmony_meta: meta, bpm, loop: false, channels: 1, spatial: 'Garden center', suggested_gain: 0.65,
  trigger: 'Once on transition to 3/3 complete; delay 300 ms after final bloom onset.'
});

// A gently moving textural bed: no speech, no percussion, no competing foreground tune.
let air = a.granular.windTexture(18, 0.16);
for (const channel of [air.left, air.right]) {
  a.humanize.ampWobble(channel, 0.14, 0.08);
  a.highPass2(channel, 190, 0.707);
  a.lowPass2(channel, 2400, 0.707);
}
function seamless(channel, loopSeconds = 16, overlapSeconds = 2) {
  const length = Math.round(loopSeconds * SR), cross = Math.round(overlapSeconds * SR);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    if (i < cross) {
      const w = 0.5 - 0.5 * Math.cos(Math.PI * i / (cross - 1));
      out[i] = channel[length + i] * (1 - w) + channel[i] * w;
    } else out[i] = channel[i];
  }
  return out;
}
const ambient = { left: seamless(air.left), right: seamless(air.right) };
a.mix_bus.masterChain(ambient, { normalize: 'peak', peakCeiling: db(-18), width: 0.7 });
write('garden_air_loop', ambient, {
  purpose: 'Quiet moving garden air', synthesis: 'Granular wind preset + gentle amplitude motion; 190 Hz HPF / 2400 Hz LPF',
  loop: true, loop_seconds: 16, crossfade_seconds: 2, channels: 2,
  spatial: 'Non-positional stereo bed; event sounds are positioned separately', suggested_gain: 0.25,
  trigger: 'Start with scene; fade in/out over 500 ms; duck 4 dB during completion or narration.'
});

// A labelled local audition sequence is separate from the six Lens-delivery WAVs.
const audition = { left: new Float32Array(SR * 18), right: new Float32Array(SR * 18) };
for (let i = 0; i < audition.left.length; i++) {
  audition.left[i] = ambient.left[i % ambient.left.length] * 0.25;
  audition.right[i] = ambient.right[i % ambient.right.length] * 0.25;
}
for (const [at, buffer] of [[0.5, click], [1.1, click], [2.0, blooms[0]], [5.0, blooms[1]], [8.0, blooms[2]], [11.0, complete]]) {
  a.addInto(audition.left, buffer, Math.round(at * SR), 0.7);
  a.addInto(audition.right, buffer, Math.round(at * SR), 0.7);
}
for (const channel of [audition.left, audition.right]) { a.fadeIn(channel, 0.15); a.fadeOut(channel, 0.4); }
a.WavBuilder.write(audition, path.join(OUTPUT, 'LightWeave-audio-audition.wav'));
fs.writeFileSync(path.join(OUTPUT, 'manifest.json'), JSON.stringify({
  project: 'LightWeave / Photon Garden', stage: 'offline assets; not imported into Lens',
  sample_rate: SR, bit_depth: 16, format: 'PCM WAV', engine: 'Official CLAD build-sfx + build-music',
  upstream_revision: '8adedd5d5b93f9dbe55f31c6be4264a4f8a608b3',
  engine_source_relative: ENGINE_SOURCE,
  source_license: 'Apache-2.0; see ENGINE-LICENSE.txt',
  provenance: 'Locally generated algorithmic synthesis. No third-party audio recordings, samples, datasets, model weights, voice recordings or cloned voices. No network or paid service used.',
  regeneration: 'node media/audio/generate.cjs creates a fresh timbral take; preserve delivered WAV hashes for exact reuse.',
  assets: ledger,
  audition: { file: 'media/audio/LightWeave-audio-audition.wav', delivery_asset: false, seconds: 18,
    events: [{ second: 0.5, id: 'mirror_adjust_click' }, { second: 1.1, id: 'mirror_adjust_click' }, { second: 2, id: 'bloom_01' }, { second: 5, id: 'bloom_02' }, { second: 8, id: 'bloom_03' }, { second: 11, id: 'garden_complete' }]
  }
}, null, 2) + '\n');
