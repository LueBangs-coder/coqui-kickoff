import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import Phaser from 'phaser'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw, Volume2, VolumeX, X, Zap } from 'lucide-react'
import { spokenTeamName, type Team } from '../data/teams'
import { FootballScene } from '../game/FootballScene'
import { createGame, isGameOver, isReturnOver, nextReturn, startReturn } from '../game/simulation'
import type { GameState } from '../game/simulation'
import { CONTROL_KEYS, GameControls } from '../game/controls'
import type { Control } from '../game/controls'
import { coquiAudio } from '../lib/audioEngine'
import { AUDIO_SETTINGS_EVENT, loadAudioSettings, updateAudioSettings, type AudioSettings } from '../lib/audioSettings'
import './FootballGame.css'

interface FootballGameProps {
  team: Team
  opponent: Team
  onClose: () => void
  onResult: (result: { touchdowns: number; yards: number }) => void
  onUnavailable?: () => void
}

export default function FootballGame({ team, opponent, onClose, onResult, onUnavailable }: FootballGameProps) {
  const host = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const scene = useRef<FootballScene | null>(null)
  const controls = useRef(new GameControls())
  const pausedRef = useRef(false)
  const reported = useRef(false)
  const unavailableReported = useRef(false)
  const resultCallback = useRef(onResult)
  const unavailableCallback = useRef(onUnavailable)
  const previousPhase = useRef<GameState['phase']>('ready')
  const [state, setState] = useState<GameState>(createGame)
  const [paused, setPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(loadAudioSettings)
  resultCallback.current = onResult
  unavailableCallback.current = onUnavailable

  const pause = (value: boolean) => {
    pausedRef.current = value
    setPaused(value)
    controls.current.clear()
    if (value) coquiAudio.pauseStadium()
    else if (state.phase === 'running') coquiAudio.startStadium()
  }

  const changeAudio = (patch: Partial<AudioSettings>) => {
    const next = updateAudioSettings(patch)
    setAudioSettings(next)
    coquiAudio.applyMix()
    if (!next.muted && state.phase === 'running' && !pausedRef.current) coquiAudio.startStadium()
  }

  useEffect(() => {
    const sync = () => setAudioSettings(loadAudioSettings())
    window.addEventListener(AUDIO_SETTINGS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUDIO_SETTINGS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    if (!host.current) return
    reported.current = false
    unavailableReported.current = false
    pausedRef.current = false
    setPaused(false)
    setLoading(true)
    setFailed(false)
    setState(createGame())
    previousPhase.current = 'ready'
    let active = true
    let game: Phaser.Game | undefined
    let bootTimeout: ReturnType<typeof setTimeout> | undefined
    const fail = () => {
      if (!active || unavailableReported.current) return
      unavailableReported.current = true
      clearTimeout(bootTimeout)
      pausedRef.current = true
      controls.current.clear()
      coquiAudio.stopStadium()
      scene.current = null
      game?.destroy(true)
      setFailed(true)
      setLoading(false)
      unavailableCallback.current?.()
    }
    bootTimeout = setTimeout(fail, 18000)
    const football = new FootballScene({
      team,
      opponent,
      readInput: () => controls.current.read(performance.now()),
      readPaused: () => pausedRef.current,
      onState: current => {
        if (!active) return
        const prior = previousPhase.current
        if (prior === 'running' && current.phase === 'touchdown') coquiAudio.touchdown(spokenTeamName(team))
        if (prior === 'running' && current.phase === 'tackled') coquiAudio.tackle()
        if (prior === 'running' && isGameOver(current)) coquiAudio.final(spokenTeamName(team), current.touchdowns)
        previousPhase.current = current.phase
        setState(current)
        if (isGameOver(current) && !reported.current) {
          reported.current = true
          resultCallback.current({ touchdowns: current.touchdowns, yards: current.yards })
        }
      },
      onReady: current => {
        if (!active || unavailableReported.current) return
        clearTimeout(bootTimeout)
        scene.current = current
        setLoading(false)
      },
      onError: fail,
    })
    try {
      game = new Phaser.Game({
        type: Phaser.CANVAS, parent: host.current, width: 720, height: 680,
        backgroundColor: '#082c24', pixelArt: true, antialias: false,
        audio: { noAudio: true }, scene: football,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 720, height: 680 },
        input: { keyboard: false, mouse: false, touch: false },
        banner: false,
      })
      game.canvas?.setAttribute('aria-hidden', 'true')
    } catch {
      fail()
    }
    const pauseAway = () => {
      controls.current.clear()
      coquiAudio.stopStadium()
      if (scene.current?.getGameState().phase === 'running') {
        pausedRef.current = true
        if (active) setPaused(true)
      }
    }
    const visibility = () => { if (document.hidden) pauseAway() }
    window.addEventListener('blur', pauseAway)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      active = false
      clearTimeout(bootTimeout)
      window.removeEventListener('blur', pauseAway)
      document.removeEventListener('visibilitychange', visibility)
      controls.current.clear()
      coquiAudio.stopStadium()
      scene.current = null
      game?.destroy(true)
    }
  }, [team, opponent])

  const begin = () => {
    if (!scene.current) return
    coquiAudio.resetCalls()
    pause(false)
    coquiAudio.startStadium()
    scene.current.setGameState(startReturn(scene.current.getGameState()))
    viewport.current?.focus({ preventScroll: true })
  }
  const next = () => {
    if (!scene.current) return
    coquiAudio.resetCalls()
    pause(false)
    coquiAudio.startStadium()
    scene.current.setGameState(nextReturn(scene.current.getGameState()))
  }
  const restart = () => {
    if (!scene.current) return
    coquiAudio.stopStadium()
    reported.current = false
    scene.current.setGameState(createGame())
    pausedRef.current = false
    setPaused(false)
    controls.current.clear()
  }
  const rematch = () => {
    if (!scene.current) return
    coquiAudio.resetCalls()
    reported.current = false
    pause(false)
    coquiAudio.startStadium()
    scene.current.setGameState(startReturn(createGame()))
    viewport.current?.focus({ preventScroll: true })
  }
  const keyboard = (event: KeyboardEvent<HTMLDivElement>, held: boolean) => {
    // Let native buttons inside the overlay keep Enter/Space activation.
    if (event.target instanceof HTMLElement && event.target.closest('button')) return
    if (CONTROL_KEYS[event.code]) {
      event.preventDefault()
      if (held) controls.current.pressKey(event.code)
      else controls.current.releaseKey(event.code)
    }
    if (held && !event.repeat && event.code === 'KeyP' && state.phase === 'running') {
      event.preventDefault()
      pause(!pausedRef.current)
    }
    if (held && !event.repeat && event.code === 'Enter' && state.phase === 'ready') begin()
  }
  const touchStart = (event: PointerEvent<HTMLButtonElement>, control: Control) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    controls.current.press(control, performance.now())
  }
  const controlProps = (control: Control) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => touchStart(event, control),
    onPointerUp: () => controls.current.release(control),
    onPointerCancel: () => controls.current.cancel(control),
    onLostPointerCapture: () => controls.current.release(control),
    onClick: (event: MouseEvent<HTMLButtonElement>) => { if (event.detail === 0) controls.current.tap(control, performance.now()) },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); controls.current.press(control, performance.now()) }
    },
    onKeyUp: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); controls.current.release(control) }
    },
    onBlur: () => controls.current.cancel(control),
  })

  const ended = isReturnOver(state)
  const finished = isGameOver(state)
  const overlay = paused || state.phase !== 'running' || loading || failed
  const opponentName = `${opponent.city} ${opponent.name}`
  const announce = finished ? `Game complete. ${state.touchdowns} touchdowns and ${state.yards} return yards.` : state.phase === 'touchdown' ? '¡Touchdown! One hundred yards. Great return!' : state.phase === 'tackled' ? `Tackled after ${Math.floor(state.y)} yards. Look for the open lane on your next return.` : paused ? 'Game paused.' : state.phase === 'running' ? `Return ${state.attempt} started. Run toward the ${opponentName} end zone.` : `Return ${state.attempt} ready.`

  return <section className="football-game" style={{ '--football-team': team.primary, '--football-kit': team.secondary } as CSSProperties} aria-label="Retro football game">
    <header className="football-header">
      <div><span className="football-eyebrow">FREE PLAY · 1997 SEASON</span><h1>Kickoff time<span>¡A jugar!</span></h1></div>
      <button className="football-exit" onClick={onClose} aria-label="Return to clubhouse"><X size={18} /><span>Clubhouse</span></button>
    </header>

    <div className="football-layout">
      <div className="football-main">
        <div className="football-scoreboard" aria-label={`${team.city} ${team.name} ${state.touchdowns * 6}, ${opponentName} 0. ${state.touchdowns} touchdowns. Return ${state.attempt} of 3.`}>
          <div className="football-team"><i style={{ background: team.secondary }} /><span>{team.city}<strong>{team.name}</strong></span></div>
          <div className="football-score">
            <b>{state.touchdowns * 6}</b>
            <span><strong>SCOREBOARD</strong><em>{state.touchdowns} TD · RETURN {state.attempt}/3</em></span>
            <b>0</b>
          </div>
          <div className="football-team football-away"><span>{opponent.city}<strong>{opponent.name}</strong></span><i style={{ background: opponent.primary }} /></div>
        </div>

        <div className="football-field-wrap" ref={viewport} tabIndex={0} role="application" aria-label="Football field. Move with arrow keys or W A S D. Hold space to sprint. P pauses." aria-describedby="football-instructions" onKeyDown={event => keyboard(event, true)} onKeyUp={event => keyboard(event, false)} onBlur={() => controls.current.clearKeys()}>
          <div ref={host} className="football-canvas" />
          {overlay && <div className="football-overlay"><div className="football-overlay-card">
            {failed ? <><span className="football-eyebrow">THE FIELD NEEDS A MOMENT</span><h2>Game could not load</h2><p>Your lesson progress is safe. Return to the clubhouse and refresh this page.</p><button className="football-primary" onClick={onClose}>Back to clubhouse</button></> : loading ? <><span className="football-eyebrow">LIGHTS ON. CLEATS ON.</span><h2>Getting the field ready…</h2></> : paused ? <><span className="football-eyebrow">TAKE A BREATHER</span><h2>Time out.</h2><p>Your return is right where you left it.</p><button className="football-primary" onClick={() => { pause(false); viewport.current?.focus({ preventScroll: true }) }}><Play size={17} /> Resume game</button></> : finished ? <><span className="football-eyebrow">FINAL WHISTLE · ¡BIEN HECHO!</span><h2>{state.touchdowns ? 'That’s a big play.' : 'Every yard counts.'}</h2><p><strong>{state.touchdowns} touchdowns · {state.yards} return yards</strong><br />Ready for another three returns?</p><button className="football-primary" onClick={rematch}>Play again <RotateCcw size={18} /></button></> : ended ? <><span className="football-eyebrow">{state.phase === 'touchdown' ? '¡TOUCHDOWN! · 100 YARDS' : `${Math.floor(state.y)} YARD RETURN`}</span><h2>{state.phase === 'touchdown' ? 'End zone energy.' : 'Find your next opening.'}</h2><p>{state.phase === 'touchdown' ? 'Great run. Let’s do it again.' : 'The defense got that one. Change lanes early and save a little sprint for the gap.'}</p><button className="football-primary" onClick={next}>Next return <ArrowRight size={18} /></button></> : <><span className="football-eyebrow">RETURN {state.attempt} OF 3</span><h2>{state.attempt === 1 ? 'Find a lane. Go.' : 'You’ve got this.'}</h2><p>You run forward automatically. Dodge {opponentName} and sprint through gaps to the far end zone.</p><button className="football-primary" onClick={begin}><Play size={18} /> Start return</button><small>Tap or hold the touch controls below.<br />Keyboard: arrows / WASD · Space to sprint.</small></>}
          </div></div>}
        </div>

        <div className="football-gamebar">
          <span><small>RETURN</small><strong>{state.attempt} <em>/ 3</em></strong></span>
          <span><small>THIS RUN</small><strong>{Math.floor(state.y)} <em>yds</em></strong></span>
          <div className="football-stamina"><div><Zap size={13} /><span>SPRINT</span><b>{Math.round(state.stamina)}%</b></div><div className="football-meter" role="meter" aria-label="Sprint stamina" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.stamina)}><i style={{ width: `${state.stamina}%` }} /></div></div>
          <button className="football-icon-button" aria-label={audioSettings.muted ? 'Turn game sound on' : 'Mute game sound'} aria-pressed={audioSettings.muted} onClick={() => changeAudio({ muted: !audioSettings.muted })}>{audioSettings.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
          <button className="football-icon-button" aria-label={paused ? 'Resume game' : 'Pause game'} disabled={state.phase !== 'running'} onClick={() => { pause(!paused); if (paused) viewport.current?.focus({ preventScroll: true }) }}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
        </div>
        <div className="football-touch-controls" aria-label="Hold controls to move">
          <div className="football-dpad">
            <button className="football-control football-up" aria-label="Run faster; hold" disabled={state.phase !== 'running' || paused} {...controlProps('up')}><ArrowUp /></button>
            <button className="football-control football-left" aria-label="Move left; hold" disabled={state.phase !== 'running' || paused} {...controlProps('left')}><ArrowLeft /></button>
            <button className="football-control football-down" aria-label="Slow down; hold" disabled={state.phase !== 'running' || paused} {...controlProps('down')}><ArrowDown /></button>
            <button className="football-control football-right" aria-label="Move right; hold" disabled={state.phase !== 'running' || paused} {...controlProps('right')}><ArrowRight /></button>
          </div>
          <span>HOLD TO MOVE</span>
          <button className="football-sprint football-control" aria-label="Sprint; hold to use stamina" disabled={state.phase !== 'running' || paused} {...controlProps('sprint')}><Zap size={24} /><span>SPRINT</span></button>
        </div>
      </div>

      <aside className="football-playbook" id="football-instructions">
        <span className="football-eyebrow">THE MINI PLAYBOOK</span><h2>Big plays.<br />Bigger confidence.</h2>
        <p>Three kickoff returns against {opponentName}. Let’s see what you’ve got.</p>
        <ol><li><strong>Find the gap</strong><span>Use ← → or A / D to change lanes. You move forward automatically.</span></li><li><strong>Pick your pace</strong><span>↑ / W speeds up. ↓ / S slows you down. Hold Space or Sprint for a burst.</span></li><li><strong>Go the distance</strong><span>Reach the {opponentName} end zone for a touchdown. A tackle starts your next return.</span></li></ol>
        <div className="football-vocab"><span>YOUR SIDELINE SPANISH</span><p><strong>¡Corre!</strong> Run!</p><p><strong>¡Vamos!</strong> Let’s go!</p><p><strong>¡Buen trabajo!</strong> Good work!</p></div>
        <div className="football-audio-panel">
          <div><span>STADIUM SOUND</span><b>{audioSettings.muted ? 'Muted' : 'On'}</b></div>
          <label>Volume <input type="range" min="0" max="1" step="0.05" value={audioSettings.volume} onChange={event => changeAudio({ volume: Number(event.target.value), muted: false })} /></label>
          <div className="football-audio-switches">
            <label><input type="checkbox" checked={audioSettings.music} onChange={event => changeAudio({ music: event.target.checked })} /> Salsa music</label>
            <label><input type="checkbox" checked={audioSettings.crowd} onChange={event => changeAudio({ crowd: event.target.checked })} /> Crowd</label>
            <label><input type="checkbox" checked={audioSettings.commentary} onChange={event => changeAudio({ commentary: event.target.checked })} /> Team calls</label>
          </div>
        </div>
        <p className="football-small">Each touchdown earns 6 points. Team calls use your device’s English voice; voice availability varies offline.</p>
        <p className="football-small">Your player wears {team.city} colors and has a gold ring. The defenders wear {opponentName} colors. Press P to pause while the field is focused.</p>
        {!finished && <button className="football-restart" disabled={loading || failed} onClick={restart}><RotateCcw size={15} /> Restart these 3 returns</button>}
        <p className="football-small">Play as often as you like. Your Spanish progress stays saved.</p>
      </aside>
    </div>
    <p className="football-sr-only" role="status" aria-live="polite" aria-atomic="true">{announce}</p>
    <p className="football-disclaimer">An original arcade return challenge inspired by the 1997 season. Not affiliated with the NFL, its teams, or EA Sports.</p>
  </section>
}
