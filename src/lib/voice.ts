import audioManifest from '../data/audio-manifest.json';

export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

export interface BundledPronunciation {
  id: string;
  text: string;
  src: string;
  duration: number;
  bytes: number;
  sha256: string;
}

export const BUNDLED_VOICE = {
  name: audioManifest.voiceLabel,
  id: audioManifest.voice,
  locale: audioManifest.locale,
};

export function normalizePronunciationText(text: string): string {
  return text.normalize('NFC').toLocaleLowerCase('es')
    .replace(/[¡!¿?.,…]/g, '').replace(/\s+/g, ' ').trim();
}

const bundledClips = new Map<string, BundledPronunciation>(
  audioManifest.clips.map((clip) => [normalizePronunciationText(clip.text), clip]),
);

export function findBundledPronunciation(text: string): BundledPronunciation | undefined {
  return bundledClips.get(normalizePronunciationText(text));
}

const latinAmericanLocales = new Set([
  'es-419', 'es-mx', 'es-us', 'es-do', 'es-cu', 'es-co', 'es-ve',
  'es-pa', 'es-cr', 'es-ni', 'es-hn', 'es-sv', 'es-gt', 'es-pe',
  'es-ec', 'es-bo', 'es-cl', 'es-ar', 'es-uy', 'es-py',
]);

export function normalizeVoiceLocale(locale: string): string {
  return locale.trim().replaceAll('_', '-').toLowerCase();
}

export function isSpanishVoice(voice: Pick<SpeechSynthesisVoice, 'lang'>): boolean {
  const locale = normalizeVoiceLocale(voice.lang);
  return locale === 'es' || locale.startsWith('es-');
}

export function isPuertoRicanVoice(voice: Pick<SpeechSynthesisVoice, 'lang'>): boolean {
  return normalizeVoiceLocale(voice.lang) === 'es-pr';
}

export function voiceId(voice: SpeechSynthesisVoice): string {
  return `${voice.voiceURI}|${voice.lang}|${voice.name}`;
}

function voicePriority(voice: SpeechSynthesisVoice): number {
  const locale = normalizeVoiceLocale(voice.lang);
  if (locale === 'es-pr') return 0;
  if (latinAmericanLocales.has(locale)) return 1;
  return 2;
}

/** Never include an English fallback in a Spanish lesson. */
export function getSpanishVoices(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices.filter(isSpanishVoice).sort((a, b) =>
    voicePriority(a) - voicePriority(b)
    || Number(b.default) - Number(a.default)
    || a.name.localeCompare(b.name),
  );
}

export function chooseSpanishVoice(
  voices: readonly SpeechSynthesisVoice[],
  preferredId?: string,
): SpeechSynthesisVoice | undefined {
  const spanish = getSpanishVoices(voices);
  return spanish.find((voice) => voiceId(voice) === preferredId) ?? spanish[0];
}

export function getSpeechSynthesis(): SpeechSynthesis | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)
    || typeof window.SpeechSynthesisUtterance !== 'function') return undefined;
  return window.speechSynthesis;
}

let activeSpeech: (() => void) | undefined;

export function cancelSpanishSpeech(): void {
  activeSpeech?.();
}

/** Static es-PR clips work even when the device has no installed Spanish voices. */
export function playBundledSpanish(
  clip: BundledPronunciation,
  playbackRate = 1,
  callbacks: SpeechCallbacks = {},
): () => void {
  if (typeof window === 'undefined' || typeof window.Audio !== 'function') {
    throw new Error('Audio playback is unavailable in this browser.');
  }
  cancelSpanishSpeech();
  const audio = new window.Audio(clip.src);
  audio.preload = 'auto';
  audio.playbackRate = Math.min(1.2, Math.max(0.5, playbackRate));
  audio.preservesPitch = true;
  let finished = false;

  const finish = (error?: string) => {
    if (finished) return;
    finished = true;
    audio.onplaying = null;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    if (activeSpeech === cancel) activeSpeech = undefined;
    if (error) callbacks.onError?.(error);
    else callbacks.onEnd?.();
  };
  const cancel = () => finish();
  audio.onplaying = () => { if (!finished) callbacks.onStart?.(); };
  audio.onended = () => finish();
  audio.onerror = () => finish('This audio clip could not load. Check your connection and try again.');
  activeSpeech = cancel;
  try {
    void audio.play().catch(() => finish('Audio could not play. Tap Listen to try again.'));
  } catch {
    finish('Audio could not play. Tap Listen to try again.');
  }
  return cancel;
}

/** A selected Spanish voice is required; browser defaults must never silently take over. */
export function speakSpanish(
  text: string,
  voice: SpeechSynthesisVoice,
  rate = 0.88,
  callbacks: SpeechCallbacks = {},
): () => void {
  const synthesis = getSpeechSynthesis();
  if (!synthesis) throw new Error('This browser does not support spoken audio.');
  if (!isSpanishVoice(voice)) throw new Error('Choose a Spanish voice before playing audio.');
  if (!text.trim()) throw new Error('There is no Spanish text to read.');

  cancelSpanishSpeech();
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = Math.min(1.2, Math.max(0.5, rate));
  utterance.pitch = 1;
  utterance.volume = 1;
  let finished = false;

  const finish = (error?: string) => {
    if (finished) return;
    finished = true;
    utterance.onstart = null;
    utterance.onend = null;
    utterance.onerror = null;
    if (activeSpeech === cancel) activeSpeech = undefined;
    if (error) callbacks.onError?.(error);
    else callbacks.onEnd?.();
  };
  const cancel = () => {
    if (finished) return;
    // Clear callbacks first: engines differ in which event cancel() dispatches.
    finish();
    synthesis.cancel();
  };

  utterance.onstart = () => { if (!finished) callbacks.onStart?.(); };
  utterance.onend = () => finish();
  utterance.onerror = (event) => {
    if (event.error === 'canceled' || event.error === 'interrupted') finish();
    else finish('Audio could not play. Try again or choose another Spanish voice.');
  };
  activeSpeech = cancel;
  try {
    synthesis.cancel();
    synthesis.speak(utterance);
  } catch {
    finish('Audio could not play. Try again or choose another Spanish voice.');
  }
  return cancel;
}
