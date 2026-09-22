"""Build static Spanish pronunciation assets. No key, account, or app-time TTS call.

One-time tooling: python -m pip install edge-tts mutagen
Run from the repository: python scripts/generate-audio.py
Existing clips are audited and reused. --sample only creates/audits the first clip.
Only authored curriculum text is submitted. This script never reads a microphone.
"""

import argparse
import asyncio
import hashlib
import importlib.metadata
import json
from datetime import datetime, timezone
from pathlib import Path
import re

import edge_tts
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "audio"
SOURCE_MANIFEST = ROOT / "src" / "data" / "audio-manifest.json"
VOICE = "es-PR-VictorNeural"


def curriculum_clips():
    curriculum = (ROOT / "src" / "data" / "curriculum.ts").read_text(encoding="utf-8")
    matches = re.findall(r"\{\s*id:\s*'([^']+)'\s*,\s*spanish:\s*'((?:\\.|[^'])*)'", curriculum)
    if len(matches) != 42:
        raise ValueError(f"Expected the reviewed 42-phrase curriculum, found {len(matches)}")
    phrases = [{"id": key, "text": text.replace("\\'", "'")} for key, text in matches]
    return phrases + [
        {"id": "greeting-combined", "text": "¡Hola! ¿Cómo estás?"},
        {"id": "vowel-sample", "text": "a, e, i, o, u"},
        {"id": "no-entiendo", "text": "No entiendo."},
    ]


def audit(path):
    data = path.read_bytes()
    mp3 = MP3(path)
    duration = mp3.info.length
    if not 0.2 <= duration <= 20 or len(data) < 1000:
        raise ValueError(f"Implausible audio in {path.name}: {duration:.3f}s, {len(data)} bytes")
    return {
        "duration": round(duration, 3),
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
    }


async def main(sample=False):
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = SOURCE_MANIFEST
    previous_manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else None
    previous_clips = {clip["id"]: clip for clip in previous_manifest["clips"]} if previous_manifest else {}
    voices = await edge_tts.list_voices()
    matching = [voice for voice in voices if voice["ShortName"] == VOICE and voice["Locale"] == "es-PR"]
    if len(matching) != 1:
        raise RuntimeError(f"The service does not currently list the exact Puerto Rican voice {VOICE}")
    print(f"Verified service voice: {VOICE} ({matching[0]['Locale']})", flush=True)
    clips = curriculum_clips()[:1] if sample else curriculum_clips()
    semaphore = asyncio.Semaphore(3)

    async def generate(clip):
        async with semaphore:
            path = OUT / f"{clip['id']}.mp3"
            if path.exists():
                previous = previous_clips.get(clip["id"])
                if not previous or previous["text"] != clip["text"] or previous_manifest["voice"] != VOICE:
                    raise ValueError(f"Refusing to relabel an existing clip without matching text/voice provenance: {path.name}")
                if hashlib.sha256(path.read_bytes()).hexdigest() != previous["sha256"]:
                    raise ValueError(f"Existing clip hash differs from its audited manifest: {path.name}")
            else:
                await edge_tts.Communicate(clip["text"], VOICE, rate="+0%").save(str(path))
            clip.update(src=f"/audio/{path.name}", **audit(path))
            print(f"{clip['id']}: {clip['duration']}s / {clip['bytes']} bytes", flush=True)

    await asyncio.gather(*(generate(clip) for clip in clips))
    if not sample or not previous_manifest:
        manifest = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "voice": VOICE,
            "voiceLabel": "Víctor",
            "locale": "es-PR",
            "synthetic": True,
            "generator": f"edge-tts {importlib.metadata.version('edge-tts')}",
            "voiceMetadata": matching[0],
            "clips": clips,
        }
        serialized = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
        manifest_path.write_text(serialized, encoding="utf-8")
        (OUT / "manifest.json").write_text(serialized, encoding="utf-8")
    elif previous_manifest:
        # Keep the public download synchronized even when checking a single sample.
        (OUT / "manifest.json").write_bytes(manifest_path.read_bytes())
    print(f"AUDIT PASS: {len(clips)} clips; {sum(clip['bytes'] for clip in clips)} bytes; "
          f"{sum(clip['duration'] for clip in clips):.3f}s total", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", action="store_true")
    asyncio.run(main(sample=parser.parse_args().sample))
