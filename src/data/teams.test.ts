import { describe, expect, it } from 'vitest'
import { getOpponent, GIANTS, TEAMS } from './teams'

describe('selectable 1997 franchises', () => {
  it('includes all 30 unique teams, including the New York Giants', () => {
    expect(TEAMS).toHaveLength(30)
    expect(new Set(TEAMS.map(team => team.id)).size).toBe(30)
    expect(new Set(TEAMS.map(team => team.abbreviation)).size).toBe(30)
    expect(TEAMS.find(team => team.id === 'giants')).toEqual(GIANTS)
  })

  it('preserves the Packers as the first/default choice and existing team ids', () => {
    expect(TEAMS[0].id).toBe('packers')
    expect(TEAMS.map(team => team.id).sort()).toEqual([
      '49ers', 'bears', 'bengals', 'bills', 'broncos', 'buccaneers', 'cardinals',
      'chargers', 'chiefs', 'colts', 'cowboys', 'dolphins', 'eagles', 'falcons',
      'giants', 'jaguars', 'jets', 'lions', 'oilers', 'packers', 'panthers',
      'patriots', 'raiders', 'rams', 'ravens', 'saints', 'seahawks', 'steelers',
      'vikings', 'washington',
    ])
  })

  it('keeps 1997 locations and excludes franchises absent that season', () => {
    expect(TEAMS.find(team => team.id === 'oilers')?.city).toBe('Tennessee')
    expect(TEAMS.find(team => team.id === 'rams')?.city).toBe('St. Louis')
    expect(TEAMS.find(team => team.id === 'raiders')?.city).toBe('Oakland')
    expect(TEAMS.find(team => team.id === 'chargers')?.city).toBe('San Diego')
    expect(TEAMS.some(team => /Browns|Texans|Titans/.test(team.name))).toBe(false)
  })
})

describe('opponent selection', () => {
  it('defaults to the Giants for every other player team and Cowboys for Giants', () => {
    for (const player of TEAMS) {
      const opponent = getOpponent(player)
      expect(opponent.id).not.toBe(player.id)
      expect(opponent.id).toBe(player.id === 'giants' ? 'cowboys' : 'giants')
    }
  })

  it('honors every known non-self opponent choice across all 30 teams', () => {
    for (const player of TEAMS) {
      for (const preferred of TEAMS) {
        const opponent = getOpponent(player, preferred.id)
        expect(opponent.id).not.toBe(player.id)
        if (preferred.id !== player.id) expect(opponent).toBe(preferred)
      }
    }
  })

  it('falls back safely for unknown or self-opponent preferences', () => {
    for (const player of TEAMS) {
      expect(getOpponent(player, 'not-a-team')).toBe(getOpponent(player))
      expect(getOpponent(player, player.id)).toBe(getOpponent(player))
    }
  })
})
