import { AUDIO_SETTINGS_EVENT, AUDIO_SETTINGS_KEY, loadAudioSettings } from './audioSettings'
import { createStadiumMusic } from './stadiumMusic'

export const touchdownAnnouncement = (teamName: string) => `The ${teamName} score a touchdown!`
export const finalAnnouncement = (teamName: string, touchdowns: number) => touchdowns > 0 ? `The ${teamName} win!` : 'Final whistle. No score.'

export class CoquiAudioEngine {
  private context?: AudioContext
  private master?: GainNode
  private crowdGain?: GainNode
  private crowdSource?: AudioBufferSourceNode
  private music?: AudioBufferSourceNode
  private musicBuffer?: AudioBuffer
  private musicGain?: GainNode
  private recordedMusic?: AudioBuffer
  private musicRequested = false
  private musicActive = false
  private stadiumActive = false
  private listening = false
  private speaking = false
  private effects = new Set<AudioScheduledSourceNode>()
  private speechTimers = new Set<ReturnType<typeof setTimeout>>()

  private ensureContext(): AudioContext | undefined {
    if (typeof window === 'undefined') return undefined
    if (!this.listening) {
      window.addEventListener(AUDIO_SETTINGS_EVENT, () => this.applyMix())
      window.addEventListener('storage', event => { if (event.key === AUDIO_SETTINGS_KEY) this.applyMix() })
      this.listening = true
    }
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return undefined
      try { this.context = new AudioContextClass() } catch { return undefined }
      this.master = this.context.createGain()
      this.master.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') void this.context.resume().catch(() => undefined)
    this.applyMix()
    return this.context
  }

  applyMix(): void {
    const settings = loadAudioSettings()
    const level = settings.muted ? 0 : settings.volume
    if (this.context && this.master) this.master.gain.setTargetAtTime(level, this.context.currentTime, 0.025)
    if (this.context && this.crowdGain) this.crowdGain.gain.setTargetAtTime(settings.crowd ? 0.13 : 0, this.context.currentTime, 0.08)
    if (this.context && this.musicGain) this.musicGain.gain.setTargetAtTime(settings.music ? .5 : 0, this.context.currentTime, .03)
    if (settings.muted || !settings.commentary) this.clearSpeech()
  }

  private track(source: AudioScheduledSourceNode, nodes: AudioNode[]): void {
    this.effects.add(source)
    source.onended = () => {
      this.effects.delete(source)
      source.disconnect()
      nodes.forEach(node => node.disconnect())
    }
  }

  private noise(duration: number, gain: number, frequency: number): void {
    const context = this.ensureContext()
    if (!context || !this.master) return
    const frames = Math.max(1, Math.floor(context.sampleRate * duration))
    const buffer = context.createBuffer(1, frames, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const output = context.createGain()
    filter.type = 'bandpass'
    filter.frequency.value = frequency
    filter.Q.value = 0.7
    output.gain.value = gain
    source.buffer = buffer
    source.connect(filter).connect(output).connect(this.master)
    this.track(source, [filter, output])
    source.start()
  }

  private tone(frequency: number, start: number, duration: number, gain = 0.08, type: OscillatorType = 'triangle'): void {
    const context = this.ensureContext()
    if (!context || !this.master) return
    const oscillator = context.createOscillator()
    const output = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start)
    output.gain.setValueAtTime(0.0001, context.currentTime + start)
    output.gain.exponentialRampToValueAtTime(gain, context.currentTime + start + 0.015)
    output.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration)
    oscillator.connect(output).connect(this.master)
    this.track(oscillator, [output])
    oscillator.start(context.currentTime + start)
    oscillator.stop(context.currentTime + start + duration + 0.02)
  }

  correct(): void {
    if (loadAudioSettings().muted) return
    const context = this.ensureContext()
    if (context && this.master) {
      this.loadRecordedMusic(context)
      if (this.recordedMusic && loadAudioSettings().music) {
        const source = context.createBufferSource()
        const gain = context.createGain()
        source.buffer = this.recordedMusic
        gain.gain.setValueAtTime(.38, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + 1.4)
        source.connect(gain).connect(this.master)
        this.track(source, [gain])
        source.start(0, 0, 1.4)
        return
      }
    }
    this.noise(0.08, 0.09, 2500)
    ;[523.25, 659.25, 783.99].forEach((frequency, index) => this.tone(frequency, index * 0.075, 0.23, 0.055, 'triangle'))
    this.tone(1046.5, 0.24, 0.34, 0.075, 'sine')
  }

  startMusic(): void {
    this.musicActive = true
    const context = this.ensureContext()
    if (!context || !this.master) return
    this.loadRecordedMusic(context)
    this.startMusicSource(context)
    this.applyMix()
  }

  pauseMusic(): void {
    this.musicActive = false
    this.music?.stop()
    this.music = undefined
    this.musicGain = undefined
  }

  startStadium(): void {
    this.stadiumActive = true
    this.startMusic()
    const context = this.ensureContext()
    if (!context || !this.master) return
    const settings = loadAudioSettings()
    if (!this.crowdSource) {
      const seconds = 4
      const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate)
      const data = buffer.getChannelData(0)
      let smooth = 0
      for (let i = 0; i < data.length; i += 1) {
        smooth = smooth * 0.93 + (Math.random() * 2 - 1) * 0.07
        data[i] = smooth + Math.sin(i / 239) * 0.025
      }
      const source = context.createBufferSource()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()
      source.buffer = buffer
      source.loop = true
      filter.type = 'bandpass'
      filter.frequency.value = 950
      filter.Q.value = 0.35
      gain.gain.value = settings.crowd ? 0.13 : 0
      source.connect(filter).connect(gain).connect(this.master)
      source.start()
      this.crowdSource = source
      this.crowdGain = gain
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect() }
    }
    this.applyMix()
  }

  private loadRecordedMusic(context: AudioContext): void {
    if (this.musicRequested) return
    this.musicRequested = true
    // A bundled file, with no provider request or API key at runtime.
    void fetch('/audio/game/boricua-kickoff.mp3')
      .then(response => { if (!response.ok) throw new Error('Music unavailable'); return response.arrayBuffer() })
      .then(bytes => context.decodeAudioData(bytes))
      .then(buffer => {
        this.recordedMusic = buffer
        if (!this.musicActive) return
        this.music?.stop()
        this.music = undefined
        this.startMusicSource(context)
        this.applyMix()
      })
      .catch(() => { /* The original retro loop remains available offline. */ })
  }

  private startMusicSource(context: AudioContext): void {
    if (!this.music && this.master) {
      if (!this.musicBuffer) {
        const samples = createStadiumMusic()
        this.musicBuffer = context.createBuffer(1, samples.length, 22050)
        this.musicBuffer.getChannelData(0).set(samples)
      }
      const music = context.createBufferSource()
      const gain = context.createGain()
      music.buffer = this.recordedMusic ?? this.musicBuffer
      music.loop = true
      music.connect(gain).connect(this.master)
      music.onended = () => { music.disconnect(); gain.disconnect() }
      music.start()
      this.music = music
      this.musicGain = gain
    }
  }

  pauseStadium(): void {
    this.stadiumActive = false
    this.crowdSource?.stop()
    this.crowdSource = undefined
    this.crowdGain = undefined
    this.effects.forEach(source => { try { source.stop() } catch { /* Already ended. */ } })
    this.effects.clear()
    this.clearSpeech()
  }

  stopStadium(): void {
    this.pauseStadium()
  }

  resetCalls(): void { this.clearSpeech() }

  tackle(): void {
    if (loadAudioSettings().muted) return
    this.noise(0.32, 0.22, 180)
    this.tone(220, 0, 0.16, 0.11, 'sawtooth')
    this.tone(165, 0.15, 0.18, 0.1, 'sawtooth')
    this.tone(123.5, 0.32, 0.3, 0.09, 'sawtooth')
    this.crowdReaction(0.75)
    this.scheduleSpeech('Oh! What a tackle!', 400)
  }

  touchdown(teamName: string): void {
    if (loadAudioSettings().muted) return
    this.crowdReaction(1.8)
    ;[261.63, 329.63, 392, 523.25].forEach((frequency, index) => this.tone(frequency, index * 0.04, 0.72, 0.105, 'square'))
    this.scheduleSpeech(touchdownAnnouncement(teamName), 330)
  }

  final(teamName: string, touchdowns: number): void {
    this.scheduleSpeech(finalAnnouncement(teamName, touchdowns), 1850)
  }

  private crowdReaction(duration: number): void {
    if (!loadAudioSettings().crowd) return
    const context = this.ensureContext()
    if (!context || !this.master) return
    const frames = Math.floor(context.sampleRate * duration)
    const buffer = context.createBuffer(1, frames, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i += 1) {
      const envelope = Math.sin(Math.PI * i / frames)
      data[i] = (Math.random() * 2 - 1) * envelope
    }
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const output = context.createGain()
    source.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(720, context.currentTime)
    filter.frequency.exponentialRampToValueAtTime(1250, context.currentTime + duration)
    filter.Q.value = 0.35
    output.gain.value = duration > 1 ? 0.35 : 0.19
    source.connect(filter).connect(output).connect(this.master)
    this.track(source, [filter, output])
    source.start()
  }

  private scheduleSpeech(text: string, delay: number): void {
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return
    const timer = setTimeout(() => {
      this.speechTimers.delete(timer)
      const settings = loadAudioSettings()
      if (!this.stadiumActive || settings.muted || !settings.commentary) return
      const utterance = new window.SpeechSynthesisUtterance(text)
      const voices = window.speechSynthesis.getVoices()
      utterance.voice = voices.find(voice => voice.lang.toLowerCase().startsWith('en-us') && /mark|guy|davis|daniel|male/i.test(voice.name))
        ?? voices.find(voice => voice.lang.toLowerCase().startsWith('en-us'))
        ?? null
      utterance.lang = 'en-US'
      utterance.rate = 0.93
      utterance.pitch = 0.78
      utterance.volume = settings.volume
      this.speaking = true
      utterance.onend = utterance.onerror = () => { this.speaking = false }
      window.speechSynthesis.speak(utterance)
    }, delay)
    this.speechTimers.add(timer)
  }

  private clearSpeech(): void {
    this.speechTimers.forEach(timer => clearTimeout(timer))
    this.speechTimers.clear()
    if (this.speaking && typeof window !== 'undefined') window.speechSynthesis?.cancel()
    this.speaking = false
  }
}

export const coquiAudio = new CoquiAudioEngine()
