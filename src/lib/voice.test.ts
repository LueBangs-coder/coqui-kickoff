import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import audioManifest from '../data/audio-manifest.json';
import { ALL_PHRASES } from '../data/curriculum';
import {
  cancelSpanishSpeech, chooseSpanishVoice, getSpanishVoices, getSpeechSynthesis,
  isPuertoRicanVoice, isSpanishVoice, normalizeVoiceLocale, speakSpanish, voiceId,
  BUNDLED_VOICE, findBundledPronunciation, normalizePronunciationText, playBundledSpanish,
} from './voice';

function voice(lang: string, name = lang, isDefault = false): SpeechSynthesisVoice {
  return { lang, name, default: isDefault, localService: true, voiceURI: `voice:${name}` };
}

class MockUtterance {
  voice: SpeechSynthesisVoice | null = null;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  constructor(public text: string) {}
}

function speechBrowser() {
  const synthesis = { speak: vi.fn(), cancel: vi.fn() };
  vi.stubGlobal('window', { speechSynthesis: synthesis, SpeechSynthesisUtterance: MockUtterance, Audio: MockAudio });
  return synthesis;
}

class MockAudio {
  static instances: MockAudio[] = [];
  preload = '';
  playbackRate = 1;
  preservesPitch = false;
  onplaying: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  removeAttribute = vi.fn();
  load = vi.fn();
  constructor(public src: string) { MockAudio.instances.push(this); }
}

afterEach(() => {
  cancelSpanishSpeech();
  vi.unstubAllGlobals();
  MockAudio.instances = [];
});

describe('bundled Puerto Rican pronunciation', () => {
  it('keeps downloadable audio metadata identical to the canonical source manifest', () => {
    const sourceManifest = readFileSync(new URL('../data/audio-manifest.json', import.meta.url), 'utf8');
    const publicManifest = readFileSync(new URL('../../public/audio/manifest.json', import.meta.url), 'utf8');
    expect(publicManifest).toBe(sourceManifest);
  });

  it('covers every current lesson phrase and all three additional listening samples', () => {
    expect(audioManifest.clips).toHaveLength(45);
    expect(BUNDLED_VOICE.locale).toBe('es-PR');
    expect(BUNDLED_VOICE.id).toBe('es-PR-VictorNeural');
    for (const phrase of ALL_PHRASES) {
      expect(findBundledPronunciation(phrase.spanish)?.text).toBe(phrase.spanish);
    }
    for (const text of ['¡Hola! ¿Cómo estás?', 'a, e, i, o, u', 'No entiendo.']) {
      expect(findBundledPronunciation(text)).toBeDefined();
    }
  });

  it('normalizes Unicode and punctuation while preserving meaningful accents', () => {
    expect(findBundledPronunciation('  ¿Cómo estás?  ')?.id).toBe('como-estas');
    expect(findBundledPronunciation('HOLA')?.id).toBe('hola');
    expect(normalizePronunciationText(' ÉL  es ')).toBe('él es');
    expect(findBundledPronunciation('A new phrase')).toBeUndefined();
    const keys = audioManifest.clips.map((clip) => normalizePronunciationText(clip.text));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('ships every audited MP3 with intact bytes, a MPEG frame header, and a plausible duration', () => {
    for (const clip of audioManifest.clips) {
      const bytes = readFileSync(new URL(`../../public${clip.src}`, import.meta.url));
      expect(bytes.byteLength).toBe(clip.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(clip.sha256);
      expect(bytes[0]).toBe(0xff);
      expect(bytes[1] & 0xe0).toBe(0xe0);
      expect(clip.duration).toBeGreaterThan(0.2);
      expect(clip.duration).toBeLessThan(20);
    }
  });

  it('plays a static clip at a slower rate without requiring any installed browser voice', () => {
    vi.stubGlobal('window', { Audio: MockAudio });
    const started = vi.fn();
    const ended = vi.fn();
    const clip = findBundledPronunciation('¡Hola!')!;
    playBundledSpanish(clip, 0.75, { onStart: started, onEnd: ended });
    const audio = MockAudio.instances[0];
    expect(audio.src).toBe('/audio/hola.mp3');
    expect(audio.playbackRate).toBe(0.75);
    expect(audio.preservesPitch).toBe(true);
    expect(audio.play).toHaveBeenCalledOnce();
    audio.onplaying?.();
    audio.onended?.();
    expect(started).toHaveBeenCalledOnce();
    expect(ended).toHaveBeenCalledOnce();
    expect(audio.pause).toHaveBeenCalledOnce();
  });

  it('shares cancellation with speech synthesis and prevents stale stops from interrupting new clips', () => {
    const synthesis = speechBrowser();
    const ended = vi.fn();
    speakSpanish('Future phrase', voice('es-PR'), 0.88, { onEnd: ended });
    const cancelFirst = playBundledSpanish(findBundledPronunciation('Hola')!);
    expect(ended).toHaveBeenCalledOnce();
    expect(synthesis.cancel).toHaveBeenCalledTimes(2);
    playBundledSpanish(findBundledPronunciation('Gracias')!);
    const secondAudio = MockAudio.instances[1];
    cancelFirst();
    expect(secondAudio.pause).not.toHaveBeenCalled();
    cancelSpanishSpeech();
    expect(secondAudio.pause).toHaveBeenCalledOnce();
  });

  it('reports a clip load failure once and safely clears playback', () => {
    vi.stubGlobal('window', { Audio: MockAudio });
    const error = vi.fn();
    const cancel = playBundledSpanish(findBundledPronunciation('Hola')!, 1, { onError: error });
    const audio = MockAudio.instances[0];
    audio.onerror?.();
    cancel();
    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0][0]).toContain('could not load');
    expect(audio.onplaying).toBeNull();
    expect(audio.onended).toBeNull();
    expect(audio.onerror).toBeNull();
  });
});

describe('Spanish voice selection', () => {
  it('recognizes normalized Spanish locales without treating other languages as Spanish', () => {
    expect(normalizeVoiceLocale(' ES_pr ')).toBe('es-pr');
    expect(isPuertoRicanVoice(voice('ES_pr'))).toBe(true);
    expect(isSpanishVoice(voice('es'))).toBe(true);
    expect(isSpanishVoice(voice('es-MX'))).toBe(true);
    expect(isSpanishVoice(voice('en-US'))).toBe(false);
    expect(isSpanishVoice(voice('est'))).toBe(false);
    expect(isPuertoRicanVoice(voice('es-MX'))).toBe(false);
  });

  it('prefers Puerto Rico, then Latin America, then other Spanish voices', () => {
    const input = [voice('en-US', 'English', true), voice('es-ES', 'Spain', true), voice('es-MX', 'Mexico'), voice('es-PR', 'Puerto Rico')];
    expect(getSpanishVoices(input).map((item) => item.lang)).toEqual(['es-PR', 'es-MX', 'es-ES']);
    expect(chooseSpanishVoice(input)?.lang).toBe('es-PR');
    expect(input[0].lang).toBe('en-US');
    expect(chooseSpanishVoice(input.slice(0, 3))?.lang).toBe('es-MX');
  });

  it('respects an explicit Spanish selection but rejects a saved English selection', () => {
    const spanish = voice('es-ES');
    const puertoRico = voice('es-PR');
    const english = voice('en-US');
    expect(chooseSpanishVoice([spanish, puertoRico, english], voiceId(spanish))).toBe(spanish);
    expect(chooseSpanishVoice([spanish, puertoRico, english], voiceId(english))).toBe(puertoRico);
    expect(chooseSpanishVoice([english])).toBeUndefined();
    expect(chooseSpanishVoice([])).toBeUndefined();
  });

  it('is safe in a server or browser without speech synthesis', () => {
    vi.stubGlobal('window', undefined);
    expect(getSpeechSynthesis()).toBeUndefined();
    vi.stubGlobal('window', {});
    expect(getSpeechSynthesis()).toBeUndefined();
    expect(() => speakSpanish('Hola', voice('es-PR'))).toThrow('does not support');
  });
});

describe('spoken playback lifecycle', () => {
  it('uses the actual Spanish voice and locale for normal and slower audio', () => {
    const synthesis = speechBrowser();
    const selected = voice('es-MX');
    speakSpanish('¡Hola, qué tal!', selected, 0.65);
    const utterance = synthesis.speak.mock.calls[0][0] as MockUtterance;
    expect(utterance.text).toBe('¡Hola, qué tal!');
    expect(utterance.voice).toBe(selected);
    expect(utterance.lang).toBe('es-MX');
    expect(utterance.rate).toBe(0.65);
  });

  it('never speaks with an English fallback or empty lesson text', () => {
    const synthesis = speechBrowser();
    expect(() => speakSpanish('Hola', voice('en-US'))).toThrow('Choose a Spanish voice');
    expect(() => speakSpanish('  ', voice('es-PR'))).toThrow('no Spanish text');
    expect(synthesis.speak).not.toHaveBeenCalled();
  });

  it('cancels previous playback and makes stale cleanup unable to cancel the next word', () => {
    const synthesis = speechBrowser();
    const ended = vi.fn();
    const cancelOld = speakSpanish('Hola', voice('es-PR'), 0.88, { onEnd: ended });
    const oldUtterance = synthesis.speak.mock.calls[0][0] as MockUtterance;
    const staleEndEvent = oldUtterance.onend;
    const cancelNew = speakSpanish('Adiós', voice('es-PR'));
    expect(ended).toHaveBeenCalledTimes(1);
    const callsBeforeStaleCleanup = synthesis.cancel.mock.calls.length;
    cancelOld();
    staleEndEvent?.();
    expect(synthesis.cancel).toHaveBeenCalledTimes(callsBeforeStaleCleanup);
    expect(ended).toHaveBeenCalledTimes(1);
    cancelNew();
    expect(synthesis.cancel).toHaveBeenCalledTimes(callsBeforeStaleCleanup + 1);
  });

  it('reports audio failures once and clears event handlers', () => {
    const synthesis = speechBrowser();
    const onError = vi.fn();
    const onEnd = vi.fn();
    speakSpanish('Coquí', voice('es-PR'), 0.88, { onError, onEnd });
    const utterance = synthesis.speak.mock.calls[0][0] as MockUtterance;
    utterance.onerror?.({ error: 'synthesis-failed' });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();
    expect(utterance.onerror).toBeNull();
    expect(utterance.onend).toBeNull();
    expect(utterance.onstart).toBeNull();
  });

  it('treats browser cancellation as a normal end, not a pronunciation error', () => {
    const synthesis = speechBrowser();
    const onError = vi.fn();
    const onEnd = vi.fn();
    speakSpanish('Gracias', voice('es-PR'), 0.88, { onError, onEnd });
    const utterance = synthesis.speak.mock.calls[0][0] as MockUtterance;
    utterance.onerror?.({ error: 'interrupted' });
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });
});
