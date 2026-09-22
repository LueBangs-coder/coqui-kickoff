import type { GameInput } from './simulation'

export type Control = 'left' | 'right' | 'up' | 'down' | 'sprint'
export const CONTROL_KEYS: Record<string, Control> = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'sprint', ShiftLeft: 'sprint', ShiftRight: 'sprint',
}

// Touch taps last at least 140ms so a quick tap between animation frames still
// moves the player. Holding a button continues until release or cancellation.
export class GameControls {
  private held = new Set<Control>()
  private keys = new Set<string>()
  private pulses = new Map<Control, number>()

  press(control: Control, now: number): void {
    this.held.add(control)
    this.tap(control, now)
  }

  tap(control: Control, now: number): void { this.pulses.set(control, now + 140) }
  release(control: Control): void { this.held.delete(control) }
  cancel(control: Control): void { this.held.delete(control); this.pulses.delete(control) }
  pressKey(code: string): void { if (CONTROL_KEYS[code]) this.keys.add(code) }
  releaseKey(code: string): void { this.keys.delete(code) }
  clearKeys(): void { this.keys.clear() }
  clear(): void { this.held.clear(); this.keys.clear(); this.pulses.clear() }

  read(now: number): GameInput {
    const active = new Set(this.held)
    this.keys.forEach(key => active.add(CONTROL_KEYS[key]))
    this.pulses.forEach((until, control) => {
      if (until > now) active.add(control)
      else this.pulses.delete(control)
    })
    return {
      horizontal: Number(active.has('right')) - Number(active.has('left')),
      vertical: Number(active.has('up')) - Number(active.has('down')),
      sprint: active.has('sprint'),
    }
  }
}
