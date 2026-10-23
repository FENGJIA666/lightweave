"""Exact mixing/validation helpers extracted from the production video module.

This export omits the unrelated layout renderer and legacy local-review voice
commands. The selected function bodies are unchanged from the validated source.
"""
from pathlib import Path
import hashlib,json,math,subprocess
ROOT = Path(__file__).resolve().parents[2]
PREVIEW_GAIN, NARRATION_GAIN = 0.85, 1.0
MIX_PEAK = 10 ** (-1.5 / 20)

def run(args, **kwargs):
    return subprocess.run([str(a) for a in args], check=True, **kwargs)


def ffmpeg(*args):
    return run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args])


def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)
    ]))


def audio_stream(info, label, preview=True):
    stream = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    if stream is None:
        remedy = ("Re-record the genuine Preview with Lens audio / Mix to Snap; no silent replacement will be used."
                  if preview else "Regenerate the narration audio before rendering.")
        raise ValueError(f"{label}: no audio stream. {remedy}")
    return stream


def mix_filters(seconds, narration_index, has_preview=True, has_narration=True):
    """Source input 0 is already sought/trimmed with video; preserve its audio PTS gaps."""
    samples = round(seconds * 48000)
    timing = ("aresample=48000:async=1:first_pts=0,"
              "aformat=sample_fmts=fltp:channel_layouts=stereo,"
              f"apad,atrim=end_sample={samples},asetpts=N/SR/TB")
    filters = []
    if has_preview:
        filters.append(f"[0:a:0]{timing},volume={PREVIEW_GAIN}[preview]")
    if has_narration or not has_preview:
        filters.append(f"[{narration_index}:a:0]{timing},volume={NARRATION_GAIN}[narration]")
    if has_preview and has_narration:
        filters += [
            "[narration]asplit=2[voice][sidechain]",
            # Partial wet mix retains at least 60% of the original sound under speech.
            "[preview][sidechain]sidechaincompress=threshold=0.02:ratio=4:attack=20:release=250:makeup=1:mix=0.4[ducked]",
            "[ducked][voice]amix=inputs=2:duration=longest:normalize=0[mixed]",
        ]
    else:
        filters.append(f"[{'preview' if has_preview else 'narration'}]anull[mixed]")
    # Oversample the limiter, disable automatic makeup, and compensate its latency.
    # Verify encoded peaks/listening on the real export; this is not a loudness claim.
    filters.append(f"[mixed]aresample=192000,alimiter=limit={MIX_PEAK}:level=false:latency=true,"
                   f"aresample=48000,apad,atrim=end_sample={samples},asetpts=N/SR/TB[aout]")
    return filters


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def local(path):
    p = Path(path)
    return p if p.is_absolute() else ROOT / p


def rel(path):
    return str(path.relative_to(ROOT))


def validate(data, require_sources=True):
    total = sum(b["duration"] for b in data["beats"])
    if not 0 < total < 180:
        raise ValueError(f"Competition cut must be shorter than 180 seconds, got {total}")
    actual = 0.0
    problems = []
    for beat in data["beats"]:
        if beat.get("kind") == "card":
            continue
        src = beat.get("source")
        if not src:
            problems.append(f"{beat['id']}: genuine Preview clip not registered")
            continue
        path = local(src["path"])
        if src.get("origin") != "lens-studio-preview" or not src.get("reviewed"):
            problems.append(f"{beat['id']}: human/agent source review is required")
        elif not path.exists() or sha256(path) != src["sha256"]:
            problems.append(f"{beat['id']}: recorded source file is missing or changed")
        else:
            info = probe(path)
            if not math.isfinite(src["start"]) or src["start"] < 0:
                problems.append(f"{beat['id']}: source start must be finite and non-negative")
            elif src["start"] + beat["duration"] > float(info["format"]["duration"]) + 0.1:
                problems.append(f"{beat['id']}: source range exceeds recorded footage")
            else:
                try:
                    audio_stream(info, beat["id"])
                except ValueError as exc:
                    problems.append(str(exc))
                else:
                    actual += beat["duration"]
    if require_sources and problems:
        raise ValueError("Final assembly awaits actual recordings:\n" + "\n".join(problems))
    if require_sources and actual / total < 0.75:
        raise ValueError("At least 75% of the cut must use reviewed actual Preview footage")
    return {"duration_seconds": total, "preview_seconds": actual, "preview_fraction": round(actual / total, 4), "pending_sources": problems}
