import { describe, expect, it } from 'vitest'
import { createGame, IDLE_INPUT, isGameOver, nextReturn, startReturn, stepGame } from './simulation'
import type { GameState } from './simulation'

describe('football simulation', () => {
  it('only advances a started return and leaves the original state untouched', () => {
    const ready = createGame()
    expect(stepGame(ready, IDLE_INPUT, 0.016)).toBe(ready)
    const running = startReturn(ready)
    const next = stepGame(running, IDLE_INPUT, 0.016)
    expect(next.y).toBeGreaterThan(0)
    expect(running.y).toBe(0)
    expect(ready.phase).toBe('ready')
  })

  it('records a tackle once and preserves totals through the next return', () => {
    const running = { ...startReturn(createGame()), y: 30, defenders: [{ id: 1, x: 50, y: 30, direction: 1 as const }] }
    const tackled = stepGame(running, IDLE_INPUT, 0.016)
    expect(tackled.phase).toBe('tackled')
    expect(tackled.yards).toBe(30)
    expect(stepGame(tackled, IDLE_INPUT, 0.016)).toBe(tackled)
    const next = nextReturn(tackled)
    expect(next.phase).toBe('ready')
    expect(next.attempt).toBe(2)
    expect(next.yards).toBe(30)
    expect(next.stamina).toBe(100)
  })

  it('scores a touchdown once, finishes after three returns, and cannot add a fourth', () => {
    let state = createGame()
    for (let attempt = 1; attempt <= 3; attempt++) {
      state = stepGame({ ...startReturn(state), y: 99.99, defenders: [] }, IDLE_INPUT, 0.016)
      expect(state.phase).toBe('touchdown')
      expect(state.touchdowns).toBe(attempt)
      expect(state.yards).toBe(attempt * 100)
      if (attempt < 3) state = nextReturn(state)
    }
    expect(isGameOver(state)).toBe(true)
    expect(nextReturn(state)).toBe(state)
  })

  it('keeps the runner in bounds and caps large or invalid frame gaps', () => {
    const state = startReturn(createGame())
    expect(stepGame(state, IDLE_INPUT, 999).y).toBeLessThan(1)
    expect(stepGame(state, IDLE_INPUT, Number.NaN)).toBe(state)
    let edge: GameState = { ...state, x: 4, defenders: [] }
    for (let i = 0; i < 50; i++) edge = stepGame(edge, { horizontal: -1, vertical: 0, sprint: true }, 0.016)
    expect(edge.x).toBe(4)
    expect(Number.isFinite(stepGame(state, { horizontal: NaN, vertical: NaN, sprint: false }, 0.016).x)).toBe(true)
  })

  it('makes sprint faster, drains stamina, and restores it when released', () => {
    const state = startReturn(createGame())
    const sprint = stepGame(state, { ...IDLE_INPUT, sprint: true }, 0.03)
    const jog = stepGame(state, IDLE_INPUT, 0.03)
    expect(sprint.y).toBeGreaterThan(jog.y)
    expect(sprint.stamina).toBeLessThan(100)
    expect(stepGame(sprint, IDLE_INPUT, 0.03).stamina).toBeGreaterThan(sprint.stamina)
    const empty = { ...state, stamina: 0 }
    const heldEmpty = stepGame(empty, { ...IDLE_INPUT, sprint: true }, 0.03)
    expect(heldEmpty.stamina).toBe(0)
    expect(heldEmpty.y).toBe(jog.y)
  })

  it('produces identical outcomes for identical input sequences', () => {
    let first = startReturn(createGame())
    let second = startReturn(createGame())
    for (let i = 0; i < 200; i++) {
      const input = { horizontal: i < 100 ? -1 : 1, vertical: 0, sprint: i % 3 === 0 }
      first = stepGame(first, input, 1 / 60)
      second = stepGame(second, input, 1 / 60)
    }
    expect(first).toEqual(second)
  })

  it('allows a fair lane-changing route to score on all three returns', () => {
    let state = createGame()
    for (let attempt = 1; attempt <= 3; attempt++) {
      state = startReturn(state)
      let target = 50
      let previousDefender = -1
      for (let frame = 0; frame < 1800 && state.phase === 'running'; frame++) {
        const upcoming = state.defenders.find(defender => defender.y + 4 > state.y)
        if (upcoming && upcoming.id !== previousDefender) {
          target = upcoming.x < 50 ? 87 : 13
          previousDefender = upcoming.id
        }
        const horizontal = Math.abs(target - state.x) < 1 ? 0 : Math.sign(target - state.x)
        state = stepGame(state, { horizontal, vertical: 0, sprint: false }, 1 / 60)
      }
      expect(state.phase).toBe('touchdown')
      if (attempt < 3) state = nextReturn(state)
    }
    expect(state.touchdowns).toBe(3)
  })
})
