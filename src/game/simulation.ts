export type GamePhase = 'ready' | 'running' | 'tackled' | 'touchdown'
export interface Defender { id: number; x: number; y: number; direction: -1 | 1 }
export interface GameState {
  phase: GamePhase
  attempt: number
  x: number
  y: number
  stamina: number
  elapsed: number
  touchdowns: number
  yards: number
  defenders: Defender[]
}
export interface GameInput { horizontal: number; vertical: number; sprint: boolean }
export const RETURN_COUNT = 3
export const FIELD_LENGTH = 100
export const IDLE_INPUT: GameInput = { horizontal: 0, vertical: 0, sprint: false }
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))

function defendersFor(attempt: number): Defender[] {
  const offset = (attempt - 1) * 7
  return [
    { id: 0, x: 22 + offset, y: 25, direction: 1 },
    { id: 1, x: 75 - offset, y: 43, direction: -1 },
    { id: 2, x: 37 + offset, y: 61, direction: 1 },
    { id: 3, x: 80 - offset, y: 77, direction: -1 },
    { id: 4, x: 30 + offset, y: 90, direction: 1 },
  ]
}

export function createGame(): GameState {
  return { phase: 'ready', attempt: 1, x: 50, y: 0, stamina: 100, elapsed: 0, touchdowns: 0, yards: 0, defenders: defendersFor(1) }
}

export function startReturn(state: GameState): GameState {
  return state.phase === 'ready' ? { ...state, phase: 'running' } : state
}

export function nextReturn(state: GameState): GameState {
  if (!isReturnOver(state) || state.attempt >= RETURN_COUNT) return state
  const attempt = state.attempt + 1
  return { ...state, phase: 'ready', attempt, x: 50, y: 0, stamina: 100, elapsed: 0, defenders: defendersFor(attempt) }
}

export function isReturnOver(state: GameState): boolean {
  return state.phase === 'touchdown' || state.phase === 'tackled'
}

export function isGameOver(state: GameState): boolean {
  return state.attempt === RETURN_COUNT && isReturnOver(state)
}

// Pure simulation. The renderer supplies seconds; long frames are bounded so a
// background tab cannot teleport the runner past collision checks.
export function stepGame(state: GameState, input: GameInput, delta: number): GameState {
  if (state.phase !== 'running' || !Number.isFinite(delta) || delta <= 0) return state
  const dt = Math.min(delta, 1 / 30)
  const sprinting = input.sprint && state.stamina > 0
  const staminaChange = input.sprint ? (sprinting ? -35 : 0) : 22
  const stamina = clamp(state.stamina + staminaChange * dt, 0, 100)
  const horizontal = Number.isFinite(input.horizontal) ? clamp(input.horizontal, -1, 1) : 0
  const vertical = Number.isFinite(input.vertical) ? clamp(input.vertical, -1, 1) : 0
  const speed = (sprinting ? 13 : 8.5) + vertical * 2.5
  const x = clamp(state.x + horizontal * (sprinting ? 44 : 38) * dt, 4, 96)
  const y = Math.min(FIELD_LENGTH, state.y + speed * dt)
  const elapsed = state.elapsed + dt
  const defenders = state.defenders.map(defender => {
    // Telegraph movement until the runner approaches; a short lateral pursuit
    // rewards changing lanes. Defenders are always slower than the runner.
    const nearby = Math.abs(defender.y - state.y) < 13
    let direction: -1 | 1 = nearby ? (state.x > defender.x ? 1 : -1) : defender.direction
    const moved = defender.x + direction * (nearby ? 13 : 8) * dt
    if (moved >= 92) direction = -1
    if (moved <= 8) direction = 1
    return { ...defender, x: clamp(moved, 8, 92), direction }
  })
  const tackled = defenders.some(defender => Math.abs(defender.y - y) < 3.0 && Math.abs(defender.x - x) < 4.4)
  const touchdown = y >= FIELD_LENGTH && !tackled
  const ended = tackled || touchdown
  return {
    ...state, x, y, stamina, elapsed, defenders,
    phase: tackled ? 'tackled' : touchdown ? 'touchdown' : 'running',
    touchdowns: state.touchdowns + (touchdown ? 1 : 0),
    yards: state.yards + (ended ? Math.floor(y) : 0),
  }
}
