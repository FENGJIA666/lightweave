#!/usr/bin/env python3
"""Inspect delivered PCM samples, FFmpeg loudness, hashes, and the real loop join."""
import array
import hashlib
import json
import math
import re
import subprocess
import sys
import wave
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[1]

def db(value):
    return 20 * math.log10(value) if value > 0 else None

def rounded(value):
    return round(value, 4) if value is not None else None

def inspect(path):
    with wave.open(str(path)) as wav:
        channels, rate, width, frames = wav.getnchannels(), wav.getframerate(), wav.getsampwidth(), wav.getnframes()
        assert width == 2 and rate == 44100
        samples = array.array('h', wav.readframes(frames))
        if sys.byteorder != 'little': samples.byteswap()
    planes = [[v / 32768 for v in samples[ch::channels]] for ch in range(channels)]
    peak = max(abs(v) for p in planes for v in p)
    rms = math.sqrt(sum(v*v for p in planes for v in p) / len(samples))
    proc = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'loudnorm=I=-23:TP=-1:LRA=7:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True)
    match = re.search(r'\{\s*"input_i".*?\}', proc.stderr, re.S)
    if not match: raise ValueError(f'Missing FFmpeg loudness measurement: {path}')
    loud = json.loads(match.group())
    number = lambda key: float(loud[key]) if math.isfinite(float(loud[key])) else None
    result = {
        'file': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size,
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'duration_seconds': frames/rate, 'frames': frames, 'sample_rate': rate, 'channels': channels, 'pcm_bits': 16,
        'sample_peak_dbfs': rounded(db(peak)), 'true_peak_dbtp': number('input_tp'),
        'rms_dbfs': rounded(db(rms)), 'integrated_lufs': number('input_i') if frames/rate >= 0.4 else None,
        'loudness_note': 'Integrated LUFS is gated over the file; RMS dBFS is the exact full-file digital signal level.' if frames/rate >= 0.4 else '80 ms transient is shorter than the 400 ms BS.1770 block; integrated LUFS not reported. Use measured RMS and peak.',
        'clipped_samples': sum(abs(v) >= 32767 for v in samples),
        'dc_mean_per_channel': [rounded(sum(p)/len(p)) for p in planes],
        'decoded': True
    }
    assert result['clipped_samples'] == 0
    assert peak > 0.001, 'Unexpected silent output'
    return result, planes, rate

manifest = json.loads((BASE/'manifest.json').read_text())
measurements = {}
loop = None
for asset in manifest['assets']:
    info, planes, rate = inspect(ROOT/asset['file'])
    measurements[asset['id']] = info
    asset['measurement'] = info
    if asset['loop']:
        edge = []
        for ch, p in enumerate(planes):
            deltas = sorted(abs(p[i] - p[i-1]) for i in range(1, len(p)))
            jump = abs(p[0]-p[-1])
            p999 = deltas[int(0.999*(len(deltas)-1))]
            before = math.sqrt(sum(v*v for v in p[-2205:])/2205)
            after = math.sqrt(sum(v*v for v in p[:2205])/2205)
            assert jump <= p999*3 + 2/32768, 'Loop discontinuity exceeds ordinary waveform movement'
            edge.append({'channel': ch, 'join_step_dbfs': rounded(db(jump)), 'adjacent_step_p99_9_dbfs': rounded(db(p999)), 'join_to_p99_9_ratio': round(jump/p999, 4) if p999 else 0, 'rms_50ms_before_dbfs': rounded(db(before)), 'rms_50ms_after_dbfs': rounded(db(after))})
        loop = {'method': '2 second complementary cosine tail-to-head crossfade; continuous sample join', 'channels': edge, 'sample_discontinuity_check': 'pass', 'two_cycle_decode': 'pass', 'listening_review': 'pending'}
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-stream_loop','1','-i',str(ROOT/asset['file']),'-f','null','-'], check=True)
audition, _, _ = inspect(ROOT/manifest['audition']['file'])
manifest['verification'] = {'loop_seam': loop, 'listening_review': 'pending; no unsupported audio-hearing claim', 'lens_import': 'pending', 'runtime_spatial_mix': 'pending'}
(BASE/'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
(BASE/'measurements.json').write_text(json.dumps({'assets':measurements,'loop_seam':loop,'audition':audition}, indent=2) + '\n')
for key, item in measurements.items():
    print(f"{key}: {item['duration_seconds']:.3f}s / peak {item['sample_peak_dbfs']:.2f} dBFS / RMS {item['rms_dbfs']:.2f} dBFS / LUFS {item['integrated_lufs']}")
print('Loop sample join and two-cycle decode: pass.')
