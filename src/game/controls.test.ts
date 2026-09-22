import { describe, expect, it } from 'vitest'
import { GameControls } from './controls'

describe('football input controls', () => {
  it('supports arrow/WASD aliases without releasing another held key', () => {
    const controls = new GameControls()
    controls.pressKey('ArrowRight')
    controls.pressKey('KeyD')
    controls.releaseKey('ArrowRight')
    expect(controls.read(0).horizontal).toBe(1)
    controls.releaseKey('KeyD')
    expect(controls.read(0).horizontal).toBe(0)
  })

  it('keeps a quick touch tap visible to the next game frame, then releases', () => {
    const controls = new GameControls()
    controls.press('left', 1000)
    controls.release('left')
    expect(controls.read(1016).horizontal).toBe(-1)
    expect(controls.read(1141).horizontal).toBe(0)
  })

  it('combines touch movement and sprint and cancels on pause or focus loss', () => {
    const controls = new GameControls()
    controls.press('right', 0)
    controls.press('sprint', 0)
    controls.pressKey('KeyW')
    expect(controls.read(500)).toEqual({ horizontal: 1, vertical: 1, sprint: true })
    controls.clear()
    expect(controls.read(501)).toEqual({ horizontal: 0, vertical: 0, sprint: false })
  })

  it('allows an assistive button activation and cancels interrupted touches', () => {
    const controls = new GameControls()
    controls.tap('up', 0)
    expect(controls.read(30).vertical).toBe(1)
    controls.cancel('up')
    expect(controls.read(31).vertical).toBe(0)
    controls.pressKey('KeyA')
    controls.pressKey('ArrowRight')
    expect(controls.read(40).horizontal).toBe(0)
  })
})
