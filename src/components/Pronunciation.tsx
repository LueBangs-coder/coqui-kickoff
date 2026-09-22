import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Gauge, Mic, Square, Volume2, X } from 'lucide-react';
import {
  chooseSpanishVoice, getSpanishVoices, getSpeechSynthesis,
  isPuertoRicanVoice, speakSpanish, voiceId, BUNDLED_VOICE,
  findBundledPronunciation, playBundledSpanish, cancelSpanishSpeech,
} from '../lib/voice';
import './Pronunciation.css';

export interface PronunciationProps {
  text: string;
  compact?: boolean;
}

type CaptureState = 'idle' | 'requesting' | 'recording' | 'ready';

function microphoneError(error: unknown): string {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Microphone permission was not granted. You can still listen and practice out loud.';
  }
  if (name === 'NotFoundError') return 'No microphone was found. You can still practice out loud.';
  if (name === 'NotReadableError') return 'The microphone is busy. Close other recording apps and try again.';
  return 'Recording could not start. You can still listen and practice out loud.';
}

export default function Pronunciation({ text, compact = false }: PronunciationProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [captureMessage, setCaptureMessage] = useState('');
  const [clipUrl, setClipUrl] = useState<string>();
  const [canRecord, setCanRecord] = useState(false);
  const voiceSelectId = useId();
  const recordingNoteId = useId();
  const mounted = useRef(false);
  const explicitVoiceChoice = useRef<string | undefined>(undefined);
  const speechCancel = useRef<(() => void) | undefined>(undefined);
  const stream = useRef<MediaStream | undefined>(undefined);
  const recorder = useRef<MediaRecorder | undefined>(undefined);
  const recordTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const recordAttempt = useRef(0);
  const objectUrl = useRef<string | undefined>(undefined);
  const playback = useRef<HTMLAudioElement | null>(null);
  const selectedVoice = voices.find((voice) => voiceId(voice) === selectedId);
  const bundledClip = findBundledPronunciation(text);

  const releaseTracks = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = undefined;
    if (recordTimer.current) clearTimeout(recordTimer.current);
    recordTimer.current = undefined;
  }, []);

  const discardCapture = useCallback(() => {
    recordAttempt.current += 1;
    const current = recorder.current;
    if (current) {
      current.ondataavailable = null;
      current.onstop = null;
      current.onerror = null;
      if (current.state !== 'inactive') {
        try { current.stop(); } catch { /* The device may already have disconnected. */ }
      }
    }
    recorder.current = undefined;
    releaseTracks();
    playback.current?.pause();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = undefined;
  }, [releaseTracks]);

  useEffect(() => {
    mounted.current = true;
    setSpeaking(false);
    setSpeechMessage('');
    setCaptureState('idle');
    setCaptureMessage('');
    setClipUrl(undefined);
    return () => {
      mounted.current = false;
      speechCancel.current?.();
      discardCapture();
    };
  }, [text, discardCapture]);

  useEffect(() => {
    setCanRecord(typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
      && typeof MediaRecorder !== 'undefined');
    if (bundledClip) {
      setVoiceLoading(false);
      return;
    }
    const synthesis = getSpeechSynthesis();
    setSpeechSupported(Boolean(synthesis));
    if (!synthesis) {
      setVoiceLoading(false);
      return;
    }
    setVoiceLoading(true);
    const refreshVoices = () => {
      const available = synthesis.getVoices();
      const spanish = getSpanishVoices(available);
      setVoices(spanish);
      const preferred = chooseSpanishVoice(spanish, explicitVoiceChoice.current);
      setSelectedId(preferred ? voiceId(preferred) : '');
      if (available.length) setVoiceLoading(false);
    };
    refreshVoices();
    synthesis.addEventListener('voiceschanged', refreshVoices);
    const timeout = setTimeout(() => {
      refreshVoices();
      setVoiceLoading(false);
    }, 1800);
    return () => {
      clearTimeout(timeout);
      synthesis.removeEventListener('voiceschanged', refreshVoices);
    };
  }, [bundledClip]);

  const playModel = (rate: number) => {
    if (!bundledClip && !selectedVoice) return;
    playback.current?.pause();
    setSpeechMessage('');
    try {
      const callbacks = {
        onStart: () => { if (mounted.current) setSpeaking(true); },
        onEnd: () => { if (mounted.current) setSpeaking(false); },
        onError: (message: string) => {
          if (!mounted.current) return;
          setSpeaking(false);
          setSpeechMessage(message);
        },
      };
      speechCancel.current = bundledClip
        ? playBundledSpanish(bundledClip, rate < 0.8 ? 0.75 : 1, callbacks)
        : speakSpanish(text, selectedVoice!, rate, callbacks);
    } catch (error) {
      setSpeaking(false);
      setSpeechMessage(error instanceof Error ? error.message : 'Audio is unavailable in this browser.');
    }
  };

  const stopRecording = () => {
    const current = recorder.current;
    if (current?.state === 'recording') {
      try { current.stop(); } catch {
        setCaptureState('idle');
        setCaptureMessage('The recording ended unexpectedly. Please try again.');
      }
    }
    releaseTracks();
  };

  const cancelRecording = () => {
    discardCapture();
    setClipUrl(undefined);
    setCaptureState('idle');
    setCaptureMessage('Recording cleared. Nothing was saved or uploaded.');
  };

  const startRecording = async () => {
    cancelSpanishSpeech();
    discardCapture();
    setClipUrl(undefined);
    setCaptureMessage('Allow the microphone when your browser asks.');
    setCaptureState('requesting');
    const attempt = recordAttempt.current;
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current || attempt !== recordAttempt.current) {
        input.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = input;
      const capture = new MediaRecorder(input);
      recorder.current = capture;
      const chunks: Blob[] = [];
      capture.ondataavailable = (event) => {
        if (attempt === recordAttempt.current && event.data.size > 0) chunks.push(event.data);
      };
      capture.onstop = () => {
        releaseTracks();
        if (!mounted.current || attempt !== recordAttempt.current) return;
        recorder.current = undefined;
        const recording = new Blob(chunks, { type: capture.mimeType || chunks[0]?.type || 'audio/webm' });
        if (!recording.size) {
          setCaptureState('idle');
          setCaptureMessage('No audio was captured. Try recording again.');
          return;
        }
        const url = URL.createObjectURL(recording);
        objectUrl.current = url;
        setClipUrl(url);
        setCaptureState('ready');
        setCaptureMessage('Your recording is ready. Listen and compare it with the Spanish voice.');
      };
      capture.onerror = () => {
        if (!mounted.current || attempt !== recordAttempt.current) return;
        discardCapture();
        setCaptureState('idle');
        setCaptureMessage('The recording was interrupted. You can try again.');
      };
      capture.start();
      setCaptureState('recording');
      setCaptureMessage('Recording… say the Spanish out loud. Stops automatically after 15 seconds.');
      recordTimer.current = setTimeout(() => {
        if (capture.state === 'recording') capture.stop();
        releaseTracks();
      }, 15_000);
    } catch (error) {
      if (!mounted.current || attempt !== recordAttempt.current) return;
      releaseTracks();
      recorder.current = undefined;
      setCaptureState('idle');
      setCaptureMessage(microphoneError(error));
    }
  };

  const recordingBusy = captureState === 'recording' || captureState === 'requesting';
  const audioDisabled = (!bundledClip && !selectedVoice) || recordingBusy;
  const unavailableMessage = !speechSupported
    ? 'Spoken audio is not supported here. Open this page in a browser with Spanish speech voices.'
    : 'No Spanish voice is available. Add a Spanish speech voice in your device’s language or accessibility settings, then reload.';

  return (
    <section className={`pronunciation${compact ? ' pronunciation--compact' : ''}`} aria-label="Spanish pronunciation">
      {!compact && <div className="pronunciation__heading"><Volume2 size={17} aria-hidden="true" /> LISTEN & SAY IT</div>}
      <div className="pronunciation__actions">
        <button type="button" className="pronunciation__listen" onClick={() => playModel(0.88)}
          disabled={audioDisabled} aria-label={`Listen to ${text} in Spanish`}>
          <Volume2 size={18} aria-hidden="true" /> {compact ? 'Listen' : 'Hear Spanish'}
        </button>
        <button type="button" className="pronunciation__slow" onClick={() => playModel(0.65)}
          disabled={audioDisabled} aria-label={`Listen to ${text} slowly in Spanish`}>
          <Gauge size={17} aria-hidden="true" /> {compact ? 'Slow' : 'Slow it down'}
        </button>
        {speaking && <button type="button" className="pronunciation__stop" onClick={() => speechCancel.current?.()} aria-label="Stop spoken audio">
          <Square size={14} aria-hidden="true" /> Stop
        </button>}
      </div>
      {!bundledClip && voiceLoading && !selectedVoice && <p className="pronunciation__note">Finding your Spanish voices…</p>}
      {!bundledClip && !voiceLoading && !selectedVoice && <p className="pronunciation__notice">{unavailableMessage}</p>}
      {bundledClip && <>
        <p className="pronunciation__note">Puerto Rican Spanish · {BUNDLED_VOICE.name} (synthetic)</p>
        <details className="pronunciation__voice-settings">
          <summary><ChevronDown size={13} aria-hidden="true" /> About this voice</summary>
          <p>These audio clips use Microsoft’s {BUNDLED_VOICE.id} voice, labeled {BUNDLED_VOICE.locale} (Puerto Rico). They are synthesized, not human recordings. Both speeds use the same voice, with pitch preserved.</p>
        </details>
      </>}
      {!bundledClip && selectedVoice && <>
        {!compact && <p className="pronunciation__note">{isPuertoRicanVoice(selectedVoice)
          ? 'Puerto Rican Spanish voice selected. Listen, then make it your own.'
          : 'Clear Spanish practice voice; Puerto Rican vocabulary.'}</p>}
        <details className="pronunciation__voice-settings">
          <summary><ChevronDown size={13} aria-hidden="true" /> {compact ? 'Audio voice' : 'Voice & pronunciation'}</summary>
          <label htmlFor={voiceSelectId}>Spanish voice on this device</label>
          <select id={voiceSelectId} value={selectedId} onChange={(event) => {
            speechCancel.current?.();
            setSpeechMessage('');
            explicitVoiceChoice.current = event.target.value;
            setSelectedId(event.target.value);
          }}>
            {voices.map((voice) => <option key={voiceId(voice)} value={voiceId(voice)}>{voice.name} ({voice.lang})</option>)}
          </select>
          <p>This is synthesized audio. {isPuertoRicanVoice(selectedVoice)
            ? 'This voice identifies its language as es-PR (Puerto Rico).'
            : 'This voice is not labeled Puerto Rican Spanish. Vocabulary and culture in your lessons are Puerto Rican.'} Voices depend on your device.</p>
        </details>
      </>}
      <p className={`pronunciation__status${speechMessage ? '' : ' pronunciation__sr-only'}`} aria-live="polite" aria-atomic="true">
        {speechMessage || (speaking ? 'Playing Spanish audio.' : '')}
      </p>
      {!compact && <div className="pronunciation__practice">
        <div className="pronunciation__practice-title"><Mic size={16} aria-hidden="true" /><strong>Your turn</strong><span>Optional</span></div>
        <p id={recordingNoteId} className="pronunciation__note">Say it out loud, then listen to yourself. Your recording stays in memory on this device. No upload, no score.</p>
        {canRecord ? <div className="pronunciation__record-actions">
          {captureState !== 'recording' && captureState !== 'requesting' && <button type="button" className="pronunciation__record"
            onClick={() => void startRecording()} aria-describedby={recordingNoteId}>
            <Mic size={16} aria-hidden="true" /> {captureState === 'ready' ? 'Record again' : 'Record myself'}
          </button>}
          {captureState === 'requesting' && <span className="pronunciation__note">Waiting for microphone permission…</span>}
          {captureState === 'recording' && <button type="button" className="pronunciation__record pronunciation__record--active" onClick={stopRecording}>
            <Square size={14} aria-hidden="true" /> Finish recording
          </button>}
          {captureState !== 'idle' && <button type="button" className="pronunciation__clear" onClick={cancelRecording}>
            <X size={15} aria-hidden="true" /> {captureState === 'ready' ? 'Clear recording' : 'Cancel'}
          </button>}
        </div> : <p className="pronunciation__note">Recording is unavailable in this browser. Practice out loud after the voice instead.</p>}
        {clipUrl && <audio ref={playback} controls src={clipUrl} aria-label="Listen to your practice recording"
          onPlay={cancelSpanishSpeech} preload="metadata">Your browser cannot play this recording.</audio>}
        <p className={`pronunciation__status${captureMessage ? '' : ' pronunciation__sr-only'}`} aria-live="polite" aria-atomic="true">{captureMessage}</p>
      </div>}
    </section>
  );
}

export { Pronunciation };
