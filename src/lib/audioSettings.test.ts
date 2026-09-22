import { describe, expect, it } from 'vitest'
import { DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings } from './audioSettings'

describe('audio settings', () => {
  it('uses friendly audible defaults', () => {
    expect(normalizeAudioSettings(null)).toEqual(DEFAULT_AUDIO_SETTINGS)
  })

  it('preserves valid choices while repairing malformed fields', () => {
    expect(normalizeAudioSettings({ muted: true, volume: 4, music: false, crowd: 'yes', commentary: true })).toEqual({
      muted: true,
      volume: 1,
      music: false,
      crowd: true,
      commentary: true,
    })
  })

  it('clamps volume at both ends', () => {
    expect(normalizeAudioSettings({ volume: -2 }).volume).toBe(0)
    expect(normalizeAudioSettings({ volume: 0.38 }).volume).toBe(0.38)
  })
})
