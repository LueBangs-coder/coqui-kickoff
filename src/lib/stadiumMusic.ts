// Original 8-bar retro salsa-inspired loop: 2-3 son clave, tumbao bass,
// montuno-style piano and percussion. Synthesized locally; no audio service.
export function createStadiumMusic(sampleRate = 22050): Float32Array {
  const beat = 60 / 105
  const length = Math.round(32 * beat * sampleRate)
  const samples = new Float32Array(length)
  const note = (position: number, frequency: number, duration: number, volume: number, bright = false) => {
    const start = Math.round(position * beat * sampleRate)
    const count = Math.round(duration * beat * sampleRate)
    for (let i = 0; i < count; i++) {
      const t = i / sampleRate
      const envelope = Math.min(1, t / .006) * Math.exp(-5 * i / count) * (1 - i / count)
      const phase = 2 * Math.PI * frequency * t
      const wave = Math.sin(phase) + (bright ? .35 * Math.sin(phase * 2) + .15 * Math.sin(phase * 3) : 0)
      samples[(start + i) % length] += wave * envelope * volume
    }
  }
  const chords = [[261.63, 329.63, 392], [261.63, 349.23, 440], [246.94, 293.66, 392], [261.63, 329.63, 392]]
  for (let bar = 0; bar < 8; bar++) {
    const chord = chords[bar % 4]
    const bass = [65.41, 87.31, 98, 65.41][bar % 4]
    for (const offset of [0, 1.5, 2.5, 3.5]) note(bar * 4 + offset, bass, .48, .14)
    for (let i = 0; i < 8; i++) {
      note(bar * 4 + i * .5, chord[(i + bar) % 3], .42, .07, true)
      note(bar * 4 + i * .5, 190 + (i % 2) * 90, .13, .06)
    }
    for (const offset of bar % 2 === 0 ? [1, 2] : [0, 1.5, 3]) {
      note(bar * 4 + offset, 2200, .065, .1, true)
    }
    for (const offset of [.75, 1.75, 2.75, 3.25, 3.75]) note(bar * 4 + offset, 580, .08, .025, true)
    if (bar === 3 || bar === 7) chord.forEach(f => note(bar * 4 + 2.5, f, .7, .04, true))
  }
  for (let i = 0; i < length; i++) {
    // Tiny cross-boundary fade avoids clicks at the loop join.
    const edge = Math.min(1, i / 220, (length - 1 - i) / 220)
    samples[i] = Math.tanh(samples[i]) * edge
  }
  return samples
}
