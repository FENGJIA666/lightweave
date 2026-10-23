#!/usr/bin/env python3
"""Replace local-only narration while copying the frozen v2 picture stream.

Models are external production inputs. Supply the official Kokoro v1.0 model,
config, and af_heart files with --models. No system voices or reference audio.
"""
from pathlib import Path
import argparse,copy,hashlib,json,os,subprocess,wave
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'media/video/v2-public'
OLD=ROOT/'media/video/v2'
MODEL_HASHES={'kokoro-v1_0.pth':'496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4','af_heart.pt':'0ab5709b8ffab19bfd849cd11d98f75b60af7733253ad0d67b12382a102cb4ff','config.json':'5abb01e2403b072bf03d04fde160443e209d7a0dad49a423be15196b9b43c17f'}
def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def run(a):subprocess.run([str(x)for x in a],check=True)
def ff(*a):run(['ffmpeg','-hide_banner','-v','error','-y',*a])
def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(p)]))
def generate(models):
 (BASE/"voice").mkdir(parents=True,exist_ok=True)
 (BASE/"output").mkdir(parents=True,exist_ok=True)
 import faulthandler
 faulthandler.enable();faulthandler.dump_traceback_later(25,repeat=True)
 print('Loading local numerical and speech runtime.',flush=True)
 import numpy as np,soundfile as sf,torch,espeakng_loader
 from phonemizer.backend.espeak.wrapper import EspeakWrapper
 EspeakWrapper.set_library(espeakng_loader.get_library_path());os.environ['ESPEAK_DATA_PATH']=espeakng_loader.get_data_path()
 os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
 from kokoro import KModel,KPipeline
 print('Runtime imported; checking official model hashes.',flush=True)
 torch.set_num_threads(4)
 for f,h in MODEL_HASHES.items():assert sha(models/f)==h,f
 model=KModel(repo_id='hexgrad/Kokoro-82M',config=str(models/'config.json'),model=str(models/'kokoro-v1_0.pth')).eval()
 pipeline=KPipeline(lang_code='a',repo_id='hexgrad/Kokoro-82M',model=model)
 faulthandler.cancel_dump_traceback_later()
 print('Local Kokoro and af_heart ready; generating 21 cues.',flush=True)
 data=json.loads((OLD/'edit.json').read_text());records=[];elapsed=0
 for beat in data['beats']:
  samples=np.zeros((round(beat['duration']*48000),2),np.float32)
  for i,c in enumerate(beat['captions']):
   label=f"{beat['id']}-{i:02d}";raw=BASE/f'voice/{label}-raw.wav';fit=BASE/f'voice/{label}.wav';record=BASE/f'voice/{label}.json'
   text=c['text'];spoken=text.replace('LightWeave','Light Weave')
   key={'text':text,'spoken_text':spoken,'start':c['start'],'end':c['end'],'voice':'af_heart','model':'Kokoro-82M v1.0','speed':1.0}
   if record.exists() and fit.exists() and json.loads(record.read_text())['key']==key:
    r=json.loads(record.read_text());assert sha(fit)==r['sha256'];audio,sr=sf.read(fit,dtype='float32',always_2d=True)
   else:
    results=list(pipeline(spoken,voice=str(models/'af_heart.pt'),speed=1.0,split_pattern=None))
    assert results and all(r.audio is not None for r in results)
    tokens=[{'text':t.text,'phonemes':t.phonemes}for r in results for t in (r.tokens or [])]
    missing=[t for t in tokens if any(c.isalpha()for c in t['text']) and not t['phonemes']];assert not missing,missing
    signal=np.concatenate([r.audio.numpy()for r in results]);active=np.flatnonzero(np.abs(signal)>.0005);assert len(active)
    lo=max(0,int(active[0])-1920);hi=min(len(signal),int(active[-1])+1921)
    trimmed=signal[lo:hi];sf.write(raw,trimmed,24000,subtype='PCM_16')
    available=c['end']-c['start']-.025;tempo=max(1.0,len(trimmed)/24000/available)
    if tempo>1.8:raise ValueError(f'{label} needs excessive tempo {tempo:.3f}: {len(trimmed)/24000:.3f}s / {available:.3f}s')
    ff('-i',raw,'-af',f'atempo={tempo:.9f},loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000','-ar','48000','-ac','2','-c:a','pcm_s16le',fit)
    audio,sr=sf.read(fit,dtype='float32',always_2d=True);seconds=len(audio)/sr
    assert seconds<=c['end']-c['start']+.002,(label,seconds,available)
    r={'key':key,'beat':beat['id'],'caption_index':i,'global_start':elapsed+c['start'],'global_end':elapsed+c['start']+seconds,'visual_window':[elapsed+c['start'],elapsed+c['end']],'raw_seconds':len(signal)/24000,'trimmed_seconds':len(trimmed)/24000,'trim_samples_24k':[lo,hi],'retained_silence_margin_ms':80,'tempo':tempo,'duration':seconds,'phonemes':' '.join(r.phonemes for r in results),'tokens':tokens,'sha256':sha(fit),'fit':'pass'}
    record.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
   start=round(c['start']*48000);assert start+len(audio)<=len(samples);samples[start:start+len(audio)]+=audio;records.append(r)
   print(f"{label}: {r['duration']:.3f}s / {c['end']-c['start']:.3f}s; tempo {r['tempo']:.3f}",flush=True)
  target=BASE/f"voice/{beat['id']}.wav";sf.write(target,samples,48000,subtype='PCM_16');beat['audio']=str(target.relative_to(ROOT));beat['voice_evidence']={'engine':'Kokoro 0.9.4','model':'Kokoro-82M v1.0','voice':'af_heart','license':'Apache-2.0','human_impersonation':False,'all_cues_measured':True}
  elapsed+=beat['duration']
 assert len(records)==21
 data['output_stem']='LightWeave-demo-v2-public';data['narrative_source']='docs/presentation/video-script-v2-public-en.md';data['stage']='Public-licensed narration replacement, frozen v2 picture and captions';data['voice_license']='media/video/v2-public/license/README.md'
 (BASE/'edit.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');(BASE/'voice-sync.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
 print('All 21 cues synthesized and fitted.',flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--models',type=Path,required=True);args=p.parse_args();generate(args.models)
