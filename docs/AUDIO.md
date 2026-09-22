# Pronunciation audio

The app bundles 45 MP3 clips: all 42 curriculum phrases, the combined greeting,
the five-vowel sample, and "No entiendo." No installed Spanish device voice is
needed for these clips. The runtime makes ordinary same-origin audio-file requests;
it does not call a text-to-speech service.

The voice is **Microsoft es-PR-VictorNeural**, displayed as **Puerto Rican Spanish ·
Víctor (synthetic)**. Microsoft identifies this voice as Spanish (Puerto Rico),
locale `es-PR`, in its [official voice table](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts).
The generation service's matching locale/name metadata is preserved in the canonical
`src/data/audio-manifest.json`. The generator writes an identical downloadable copy
to `public/audio/manifest.json`; a test checks they stay byte-for-byte identical.
Application code imports only the source manifest. These are synthesized recordings; no human speaker
or native-speaker pronunciation review is claimed.

The clips were created with [edge-tts 7.2.8](https://github.com/rany2/edge-tts),
which accesses Microsoft's online Edge speech service without an API key.
Generation submitted only the app's authored Spanish text. No account, paid API,
user recording, or personal data was involved. The generator and its Python
dependencies are development tools, not app dependencies. The existing clips
remain usable without that service being available again.

`scripts/generate-audio.py` reads the reviewed 42-phrase curriculum and generates
the three additional samples. A temporary Python environment with `edge-tts` and
`mutagen` is sufficient. Run `python scripts/generate-audio.py` from this repo.
Existing clips are reused only when their manifest text, voice, and SHA-256 agree;
the script refuses to silently relabel stale audio. A changed phrase needs an
explicitly reviewed replacement recording and refreshed manifest.

The initial MP3 audit passed for every clip: **590,688 bytes**, **98.448 seconds**
total, **1.776–3.168 seconds** per clip. The manifest records each clip's exact text,
path, duration, byte count, SHA-256, and generation timestamp. The audio tests check
all curriculum mappings, Unicode normalization, every file's MPEG header and hash,
normal/slower playback behavior, and stale-playback cancellation.

Normal playback uses `1×`; the slow button uses `0.75×` with pitch preservation.
Only future text absent from the bundle uses browser speech synthesis, which still
requires an actual Spanish voice and never silently falls back to English.

Optional microphone practice remains separate. It requires an explicit click and
browser permission, stops after 15 seconds, and retains audio only in memory.
Recordings are cleared when the phrase changes or the component closes. There is
no upload, speech recognition, or pronunciation grading.

## Game music and effects

“Estadio Salsa Kickoff” was generated with Eleven Music v2.5 on September 22,
2026, then downloaded as `public/audio/game/boricua-kickoff.mp3`. Music generated
with Eleven Music. The prompt requested an original instrumental Puerto Rican
salsa stadium groove at 105 BPM, with son clave, montuno-style piano, congas,
bongos, timbales, bass, and brass, leaving space for commentary. No artist's name,
copyrighted song, personal document, or voice sample was supplied.

The bundled MP3 is 737,627 bytes, 30.041 seconds, stereo 44.1 kHz at 192 kbps.
SHA-256: `18df0f16ea7bd9fb189c97ca121e90975d22f77cd0256c78ba7495847b151a92`.
It decodes successfully; measured peak is -0.7 dBFS. These are file-integrity
checks, not a claim of human musical or cultural review. The production service
worker includes the music in offline storage. Playback uses the same-origin
file and requires no ElevenLabs account, credentials, or paid API at runtime.
The track loads on the opening page and loops continuously through the learning
and football screens; a short excerpt rewards correct answers. Sound is enabled
by default and a labeled header control turns app music and game sounds on or
off. The app attempts playback at page entry. Because mobile and desktop browsers
can block audible autoplay, the first tap or keypress also starts or resumes the
track. Hiding the page pauses music; returning to it resumes playback.
An original procedural retro loop/jingle remains as a fallback while loading or
when decoding fails. Independent music and crowd switches, volume, and mute are
available. Audio starts through a learner interaction, stops on pause/exit, and
does not resume from a late download after the learner leaves the game.

Crowd ambience, louder touchdown reactions, and tackle/touchdown effects are
original Web Audio synthesis, not recorded stadium crowds. Team-name commentary
uses an available English browser/OS voice, including touchdown and win calls;
it is not John Madden's voice or a clone. A scoreless game gets no winner call.
Turning commentary off cancels queued calls. Voice availability and actual
speaker output require testing on the learner's device.

The generated recording remains subject to [ElevenLabs Music terms](https://elevenlabs.io/music-terms).
Public source access does not grant a separate music redistribution license.
