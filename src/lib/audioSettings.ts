export interface AudioSettings {
  muted: boolean
  volume: number
  music: boolean
  crowd: boolean
  commentary: boolean
}

export const AUDIO_SETTINGS_KEY = 'coqui-kickoff-audio-v1'
export const AUDIO_SETTINGS_EVENT = 'coqui-audio-settings'
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  volume: 0.72,
  music: true,
  crowd: true,
  commentary: true,
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))
let sessionSettings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS }

export function normalizeAudioSettings(value: unknown): AudioSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_AUDIO_SETTINGS }
  const candidate = value as Partial<AudioSettings>
  return {
    muted: typeof candidate.muted === 'boolean' ? candidate.muted : DEFAULT_AUDIO_SETTINGS.muted,
    volume: typeof candidate.volume === 'number' && Number.isFinite(candidate.volume)
      ? clamp(candidate.volume)
      : DEFAULT_AUDIO_SETTINGS.volume,
    music: typeof candidate.music === 'boolean' ? candidate.music : DEFAULT_AUDIO_SETTINGS.music,
    crowd: typeof candidate.crowd === 'boolean' ? candidate.crowd : DEFAULT_AUDIO_SETTINGS.crowd,
    commentary: typeof candidate.commentary === 'boolean' ? candidate.commentary : DEFAULT_AUDIO_SETTINGS.commentary,
  }
}

export function loadAudioSettings(): AudioSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_AUDIO_SETTINGS }
  try {
    return normalizeAudioSettings(JSON.parse(window.localStorage.getItem(AUDIO_SETTINGS_KEY) ?? 'null'))
  } catch {
    return { ...sessionSettings }
  }
}

export function saveAudioSettings(settings: AudioSettings): AudioSettings {
  const safe = normalizeAudioSettings(settings)
  sessionSettings = safe
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(safe)) } catch { /* Audio still works for this visit. */ }
    window.dispatchEvent(new CustomEvent<AudioSettings>(AUDIO_SETTINGS_EVENT, { detail: safe }))
  }
  return safe
}

export function updateAudioSettings(patch: Partial<AudioSettings>): AudioSettings {
  return saveAudioSettings({ ...loadAudioSettings(), ...patch })
}
