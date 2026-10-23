#!/usr/bin/env python3
"""Build native Preview + public narration audio; stream-copy frozen v2 video."""
from pathlib import Path
import hashlib,json,subprocess
import public_video_support as v
BASE=v.ROOT/'media/video/v2-public';OLD=v.ROOT/'media/video/v2'
EXPECTED={'captioned':'974ede5e9d5478fb735d9b7726c8edaf276525d6a9418dc064977c2bcd557962','clean':'3a22a5271e95a234f972605cab470cd689c4dae066cf42351d5fe6c565b30435'}
def packet_hash(p):
 result=subprocess.run(['ffmpeg','-v','error','-i',str(p),'-map','0:v:0','-c:v','copy','-bsf:v','h264_mp4toannexb','-f','hash','-hash','sha256','-'],check=True,capture_output=True,text=True)
 return result.stdout.strip().split('=')[1]
def main():
 (BASE/"output").mkdir(parents=True,exist_ok=True)
 data=json.loads((BASE/'edit.json').read_text());evidence=v.validate(data);work=BASE/'work';work.mkdir(exist_ok=True)
 olddata=json.loads((OLD/'edit.json').read_text());assert [b['captions']for b in data['beats']]==[b['captions']for b in olddata['beats']]
 mixes=[];input_records=[]
 for b in data['beats']:
  original=v.local(b['source']['path']);voice=v.local(b['audio']);assert voice.is_relative_to(BASE/'voice')
  assert b['voice_evidence']['voice']=='af_heart'
  target=work/f"{b['id']}-mix.wav";filters=v.mix_filters(b['duration'],1,True,True)
  v.ffmpeg('-ss',b['source']['start'],'-t',b['duration'],'-i',original,'-i',voice,'-filter_complex',';'.join(filters),'-map','[aout]','-ar','48000','-ac','2','-c:a','pcm_s16le',target)
  mixes.append(target);input_records.append({'native_source':b['source']['path'],'native_sha256':b['source']['sha256'],'native_start':b['source']['start'],'duration':b['duration'],'narration':b['audio'],'narration_sha256':v.sha256(voice)})
 concat=work/'mix-list.txt';concat.write_text(''.join(f"file '{p.name}'\n"for p in mixes))
 mixed=BASE/'output/LightWeave-v2-public-mix.wav';v.ffmpeg('-f','concat','-safe','1','-i',concat,'-c:a','pcm_s16le',mixed)
 report={'stage':'Public narration replacement','base_edit_sha256':v.sha256(OLD/'edit.json'),'public_edit_sha256':v.sha256(BASE/'edit.json'),'picture_and_captions_unchanged':True,'system_voice_audio_inputs':[],'mix_inputs':input_records,'source_gate':evidence,'exports':{}}
 for suffix,h in EXPECTED.items():
  source=OLD/f'output/LightWeave-demo-v2-{suffix}.mp4';assert v.sha256(source)==h
  srcprobe=v.probe(source);video=next(x for x in srcprobe['streams']if x['codec_type']=='video');delay_samples=round(float(video['start_time'])*48000)
  out=BASE/f'output/LightWeave-demo-v2-public-{suffix}.mp4'
  v.ffmpeg('-i',source,'-i',mixed,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af',f'adelay={delay_samples}S:all=1','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart','-metadata','comment=Original LightWeave narration synthesized locally with Kokoro-82M v1.0, official af_heart preset (Apache-2.0). Native Lens Studio Preview sound retained.',out)
  info=v.probe(out);vs=next(s for s in info['streams']if s['codec_type']=='video');aus=next(s for s in info['streams']if s['codec_type']=='audio')
  assert int(vs['nb_frames'])==3750 and float(info['format']['duration'])<180
  before=packet_hash(source);after=packet_hash(out);assert before==after
  v.ffmpeg('-i',out,'-f','null','-')
  report['exports'][suffix]={'path':v.rel(out),'sha256':v.sha256(out),'size_bytes':out.stat().st_size,'duration':float(info['format']['duration']),'video_frames':int(vs['nb_frames']),'video_start':vs['start_time'],'audio_start':aus['start_time'],'audio_delay_samples':delay_samples,'copied_picture_packet_sha256':after,'picture_packet_match':True,'decoded':True}
  print(json.dumps(report['exports'][suffix],indent=2),flush=True)
 (BASE/'output/public-replacement-report.json').write_text(json.dumps(report,indent=2)+'\n')
if __name__=='__main__':main()
