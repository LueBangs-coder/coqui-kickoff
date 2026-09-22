import { afterEach, describe, expect, it, vi } from 'vitest'
import { spokenTeamName, TEAMS } from '../data/teams'
import { CoquiAudioEngine, finalAnnouncement, touchdownAnnouncement } from './audioEngine'
import { updateAudioSettings } from './audioSettings'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

describe('dynamic football commentary', () => {
  it('names every selectable team in touchdown and win calls', () => {
    expect(TEAMS).toHaveLength(30)
    for (const team of TEAMS) {
      const name = spokenTeamName(team)
      expect(touchdownAnnouncement(name)).toBe(`The ${name} score a touchdown!`)
      expect(finalAnnouncement(name, 1)).toBe(`The ${name} win!`)
    }
  })

  it('does not announce a false winner after a scoreless game', () => {
    expect(finalAnnouncement('New York Giants', 0)).toBe('Final whistle. No score.')
  })
})

class FakeNode {
  gain = { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  frequency = { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  Q = { value: 0 }
  buffer?: unknown
  loop = false
  onended?: () => void
  connect = vi.fn(() => this)
  disconnect = vi.fn()
  start = vi.fn()
  stop = vi.fn(() => this.onended?.())
}
class FakeContext {
  static sources: FakeNode[] = []
  sampleRate = 22050
  currentTime = 0
  state = 'running'
  destination = new FakeNode()
  createGain = () => new FakeNode()
  createBiquadFilter = () => new FakeNode()
  createBuffer = (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) })
  decodeAudioData = async () => ({ getChannelData: () => new Float32Array(100) })
  createBufferSource = () => { const node = new FakeNode(); FakeContext.sources.push(node); return node }
  createOscillator = this.createBufferSource
}
function audioBrowser() {
  const events = new EventTarget()
  const data = new Map<string, string>()
  const speech = { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] }
  vi.stubGlobal('window', {
    AudioContext: FakeContext,
    speechSynthesis: speech,
    SpeechSynthesisUtterance: class { constructor(public text: string) {} },
    addEventListener: events.addEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    localStorage: { getItem: (key: string) => data.get(key), setItem: (key: string, value: string) => data.set(key, value) },
  })
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  FakeContext.sources = []
  vi.useFakeTimers()
  return speech
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('stadium audio lifecycle', () => {
  it('cancels pending team calls and all sources when the game pauses', () => {
    const speech = audioBrowser()
    const engine = new CoquiAudioEngine()
    engine.startStadium()
    engine.touchdown('New York Giants')
    engine.final('New York Giants', 1)
    engine.pauseStadium()
    vi.runAllTimers()
    expect(speech.speak).not.toHaveBeenCalled()
    expect(FakeContext.sources.every(source => source.stop.mock.calls.length === 1)).toBe(true)
  })
  it('announces the chosen team and responds to the global mute event', () => {
    const speech = audioBrowser()
    const engine = new CoquiAudioEngine()
    engine.startStadium()
    engine.touchdown('New York Giants')
    vi.advanceTimersByTime(350)
    expect(speech.speak.mock.calls[0][0].text).toBe('The New York Giants score a touchdown!')
    engine.final('New York Giants', 1)
    updateAudioSettings({ muted: true })
    expect(speech.cancel).toHaveBeenCalledOnce()
    vi.runAllTimers()
    expect(speech.speak).toHaveBeenCalledOnce()
    engine.stopStadium()
  })
  it('does not restart music if its download finishes after leaving the game', async () => {
    audioBrowser()
    let deliver!: (response: unknown) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { deliver = resolve })))
    const engine = new CoquiAudioEngine()
    engine.startStadium()
    engine.stopStadium()
    const sources = FakeContext.sources.length
    deliver({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })
    await vi.runAllTimersAsync()
    expect(FakeContext.sources).toHaveLength(sources)
    engine.startStadium()
    expect(FakeContext.sources).toHaveLength(sources + 2)
    expect(fetch).toHaveBeenCalledOnce()
    engine.stopStadium()
  })
  it('disables team calls independently of music', () => {
    const speech = audioBrowser()
    updateAudioSettings({ commentary: false })
    const engine = new CoquiAudioEngine()
    engine.startStadium()
    engine.touchdown('Green Bay Packers')
    vi.runAllTimers()
    expect(speech.speak).not.toHaveBeenCalled()
    expect(FakeContext.sources.some(source => source.loop && source.start.mock.calls.length > 0)).toBe(true)
    engine.stopStadium()
  })
  it('keeps gameplay usable when Web Audio is unavailable', () => {
    vi.stubGlobal('window', { addEventListener: vi.fn() })
    const engine = new CoquiAudioEngine()
    expect(() => { engine.startStadium(); engine.correct(); engine.stopStadium() }).not.toThrow()
  })
})

describe('bundled stadium music', () => {
  it('ships the approved 30-second music asset intact', () => {
    const bytes = readFileSync(new URL('../../public/audio/game/boricua-kickoff.mp3', import.meta.url))
    expect(bytes.length).toBe(737627)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe('18df0f16ea7bd9fb189c97ca121e90975d22f77cd0256c78ba7495847b151a92')
  })
})
