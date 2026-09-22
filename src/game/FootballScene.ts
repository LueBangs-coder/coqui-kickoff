import Phaser from 'phaser'
import type { Team } from '../data/teams'
import { createGame, stepGame } from './simulation'
import type { GameInput, GameState } from './simulation'

export interface SceneBridge {
  team: Team
  opponent: Team
  readInput: () => GameInput
  readPaused: () => boolean
  onState: (state: GameState) => void
  onReady: (scene: FootballScene) => void
  onError: () => void
}

const FIELD = { left: 126, right: 594, top: 102, bottom: 596 }
const color = (hex: string) => Number.parseInt(hex.replace('#', ''), 16)
const PLAYER_PIXELS = [
  '....HHHH....',
  '...HHSHHH...',
  '...HHSHHH...',
  '...KKKKKK...',
  '..AJJJJJJA..',
  '.AAJJJJJJAA.',
  '.AKJJWWJJKA.',
  '.AKJJWWJJKA.',
  '..KJJJJJJK..',
  '...PPPPPP...',
  '...PPPPPP...',
  '...PPP.PP...',
  '...WW..WW...',
  '..DDD..DDD..',
]

export class FootballScene extends Phaser.Scene {
  private state: GameState = createGame()
  private bridge: SceneBridge
  private runner!: Phaser.GameObjects.Sprite
  private defenders: Phaser.GameObjects.Sprite[] = []
  private effects!: Phaser.GameObjects.Graphics
  private lastHudTime = 0
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  constructor(bridge: SceneBridge) {
    super({ key: 'football' })
    this.bridge = bridge
  }

  preload(): void {
    this.load.image('stadium', '/assets/football-preview.webp')
  }

  create(): void {
    try {
      this.cameras.main.setBackgroundColor('#082c24')
      this.drawStadium()
      this.makePlayerTexture('runner', this.bridge.team, true)
      this.makePlayerTexture('defender', this.bridge.opponent, false)
      this.runner = this.add.sprite(360, FIELD.bottom, 'runner').setScale(2.3).setDepth(20)
      this.defenders = this.state.defenders.map(() => this.add.sprite(0, 0, 'defender').setScale(2.3).setDepth(15))
      this.effects = this.add.graphics().setDepth(25)
      this.renderState()
      this.bridge.onReady(this)
      this.bridge.onState(this.state)
    } catch {
      this.bridge.onError()
    }
  }

  setGameState(state: GameState): void {
    this.state = state
    this.renderState()
    this.bridge.onState(state)
  }

  getGameState(): GameState { return this.state }

  update(time: number, delta: number): void {
    if (this.bridge.readPaused()) return
    const previousPhase = this.state.phase
    this.state = stepGame(this.state, this.bridge.readInput(), delta / 1000)
    this.renderState()
    if (time - this.lastHudTime >= 100 || previousPhase !== this.state.phase) {
      this.lastHudTime = time
      this.bridge.onState(this.state)
    }
  }

  private renderState(): void {
    if (!this.runner) return
    const fieldX = (x: number) => FIELD.left + x / 100 * (FIELD.right - FIELD.left)
    const fieldY = (y: number) => FIELD.bottom - y / 100 * (FIELD.bottom - FIELD.top)
    const running = this.state.phase === 'running'
    const stride = running && !this.reducedMotion ? Math.sin(this.state.elapsed * 23) * 1.2 : 0
    this.runner.setPosition(fieldX(this.state.x), fieldY(this.state.y) + stride)
    this.runner.setAngle(running ? this.bridge.readInput().horizontal * 9 : 0)
    this.defenders.forEach((sprite, index) => {
      const defender = this.state.defenders[index]
      sprite.setPosition(fieldX(defender.x), fieldY(defender.y) - stride)
      sprite.setFlipX(defender.direction < 0)
    })
    this.effects.clear()
    // A visible gold ring identifies the controlled player for every kit color.
    this.effects.lineStyle(2, 0xffd568, 0.9)
    this.effects.strokeEllipse(fieldX(this.state.x), fieldY(this.state.y) + 17, 39, 12)
    if (this.state.phase === 'touchdown') {
      for (let i = 0; i < 22; i++) {
        this.effects.fillStyle(i % 2 ? 0xf5ca53 : 0xffffff, 0.9)
        this.effects.fillRect(135 + ((i * 71) % 445), 30 + ((i * 31) % 88), 5, 5)
      }
    }
  }

  private makePlayerTexture(key: string, team: Team, ball: boolean): void {
    const graphic = this.make.graphics({ x: 0, y: 0 })
    graphic.fillStyle(0x08291e, 0.45)
    graphic.fillEllipse(9, 17, 16, 5)
    const palette: Record<string, number> = {
      H: color(ball ? team.secondary : team.primary), S: color(ball ? team.primary : team.secondary), K: 0x182a33,
      J: color(team.primary), W: 0xf9f5e8, P: ball ? color(team.secondary) : 0xf9f5e8, A: 0xa76b42, D: 0x152631,
    }
    PLAYER_PIXELS.forEach((row, y) => [...row].forEach((pixel, x) => {
      if (pixel !== '.') graphic.fillStyle(palette[pixel]).fillRect(x + 3, y + 2, 1, 1)
    }))
    if (ball) {
      graphic.fillStyle(0x633517).fillRect(14, 8, 3, 5)
      graphic.fillStyle(0xc0824d).fillRect(14, 8, 2, 4)
      graphic.fillStyle(0xfff6d5).fillRect(15, 9, 1, 2)
    }
    graphic.generateTexture(key, 20, 21)
    graphic.destroy()
  }

  private drawStadium(): void {
    // Original generated artwork provides the stadium backdrop; the playable
    // field and sprites remain crisp, exact, and aligned with simulation units.
    if (this.textures.exists('stadium')) this.add.image(360, 335, 'stadium').setDisplaySize(900, 680).setAlpha(0.45)
    const g = this.add.graphics()
    g.fillStyle(0x082d25, 0.9).fillRect(100, 30, 520, 628)
    const fanColors = [0xedc665, 0xdedfcf, 0x316f90, 0xae563d, 0x173f69]
    for (let row = 0; row < 32; row++) {
      for (let col = 0; col < 7; col++) {
        g.fillStyle(fanColors[(row * 3 + col * 7) % fanColors.length], 0.85)
        g.fillRect(18 + col * 10, 64 + row * 17, 5, 7)
        g.fillRect(637 + col * 10, 64 + row * 17, 5, 7)
      }
    }
    g.fillStyle(0xebe8d3).fillRect(113, 46, 494, 604)
    g.fillStyle(color(this.bridge.opponent.primary)).fillRect(120, 52, 480, 50)
    g.fillStyle(color(this.bridge.team.primary)).fillRect(120, 596, 480, 47)
    for (let i = 0; i < 10; i++) {
      g.fillStyle(i % 2 ? 0x337b43 : 0x2d703e)
      g.fillRect(120, FIELD.top + i * 49.4, 480, 49.4)
    }
    // Subtle, deterministic turf flecks, so there is no per-frame random noise.
    for (let i = 0; i < 650; i++) {
      g.fillStyle(i % 3 ? 0x8ab160 : 0x133f2a, 0.13)
      g.fillRect(124 + (i * 73) % 468, 105 + (i * 131) % 486, 2, 2)
    }
    for (let yard = 0; yard <= 100; yard += 10) {
      const y = FIELD.bottom - yard / 100 * (FIELD.bottom - FIELD.top)
      g.lineStyle(2, 0xe4ecd7, 0.86).lineBetween(120, y, 600, y)
      if (yard > 0 && yard < 100) {
        const label = String(yard > 50 ? 100 - yard : yard)
        this.add.text(145, y - 18, label, { fontFamily: 'monospace', fontSize: '20px', color: '#d9e3c8', fontStyle: 'bold' }).setAlpha(0.85)
        this.add.text(548, y - 18, label, { fontFamily: 'monospace', fontSize: '20px', color: '#d9e3c8', fontStyle: 'bold' }).setAlpha(0.85)
      }
    }
    for (let yard = 5; yard < 100; yard += 5) {
      const y = FIELD.bottom - yard / 100 * (FIELD.bottom - FIELD.top)
      g.lineStyle(2, 0xe4ecd7, 0.8)
      for (const x of [123, 280, 430, 589]) g.lineBetween(x, y, x + 8, y)
    }
    const textStyle = { fontFamily: 'Barlow Condensed, sans-serif', fontSize: '23px', fontStyle: 'bold', color: '#ffffff', letterSpacing: 5 }
    this.add.text(360, 78, `${this.bridge.opponent.city} ${this.bridge.opponent.name}`.toUpperCase(), textStyle).setOrigin(0.5)
    this.add.text(360, 620, `${this.bridge.team.city} ${this.bridge.team.name}`.toUpperCase(), { ...textStyle, fontSize: '18px', letterSpacing: 2 }).setOrigin(0.5)
    for (const x of [115, 600]) {
      g.fillStyle(0xffa743).fillRect(x, 99, 5, 9).fillRect(x, 590, 5, 9)
    }
    // A tiny Puerto Rican flag at each sideline: five alternating stripes.
    for (const x of [42, 648]) {
      g.fillStyle(0xe4d7b3).fillRect(x - 3, 22, 3, 40)
      for (let i = 0; i < 5; i++) g.fillStyle(i % 2 ? 0xffffff : 0xe5414f).fillRect(x, 23 + i * 4, 30, 4)
      g.fillStyle(0x2455ab).fillTriangle(x, 23, x, 43, x + 17, 33)
      const star = Array.from({ length: 10 }, (_, index) => {
        const angle = -Math.PI / 2 + index * Math.PI / 5
        const radius = index % 2 ? 1.3 : 3.2
        return { x: x + 6 + Math.cos(angle) * radius, y: 33 + Math.sin(angle) * radius }
      })
      g.fillStyle(0xffffff).fillPoints(star, true)
    }
  }
}
