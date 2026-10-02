/** @file Tests for the alerts of the animator board. */
import { activeAlerts, newAlerts } from './boardAlerts'
import type { TeamCardView } from './boardCard'

const card = (over: Partial<TeamCardView>): TeamCardView => ({
  team: 'Zombies', status: 'challenge', challengeTitle: 'Le cimetière', slotSecondsLeft: 300, found: [], track: [],
  solution: null, hintTexts: [], blockedSeconds: 0, wrongAttempts: 0, hints: null, offsetMinutes: null, finishedAt: null,
  silentSeconds: 3, freshness: 'fresh', ...over,
})

describe('activeAlerts', () => {
  it('raises nothing for a team that plays normally', () => {
    expect(activeAlerts([card({}), card({ status: 'waiting' }), card({ status: 'unseen', freshness: null })], true)).toEqual([])
  })
  it('raises « time up » with the missed challenge', () => {
    expect(activeAlerts([card({ status: 'timeUp' })], true)).toEqual([
      { key: 'Zombies|timeUp|Le cimetière', team: 'Zombies', kind: 'timeUp', text: 'Zombies : Temps écoulé (Le cimetière)' },
    ])
  })
  it('raises a silent tablet, only while the board itself is up to date', () => {
    const silent = card({ freshness: 'silent', silentSeconds: 130 })
    expect(activeAlerts([silent], true)).toEqual([
      { key: 'Zombies|silent|', team: 'Zombies', kind: 'silent', text: 'Zombies : plus de nouvelles depuis 2 min' },
    ])
    expect(activeAlerts([silent], false)).toEqual([])
    expect(activeAlerts([card({ freshness: 'late' })], true)).toEqual([])
  })
  it('raises 3 wrong answers in the slot, not 2', () => {
    expect(activeAlerts([card({ wrongAttempts: 2 })], true)).toEqual([])
    expect(activeAlerts([card({ wrongAttempts: 4 })], true)).toEqual([
      { key: 'Zombies|wrong|Le cimetière', team: 'Zombies', kind: 'wrong', text: 'Zombies : 3 mauvaises réponses (Le cimetière)' },
    ])
  })
})

describe('newAlerts', () => {
  const timeUp = activeAlerts([card({ status: 'timeUp' })], true)
  const wrongHere = activeAlerts([card({ wrongAttempts: 3 })], true)
  const wrongThere = activeAlerts([card({ wrongAttempts: 3, challengeTitle: 'L’addition' })], true)
  it('rings nothing on the first board (what is already going on is not news)', () => {
    expect(newAlerts(null, timeUp)).toEqual([])
  })
  it('rings an alert once', () => {
    expect(newAlerts([], timeUp)).toEqual(timeUp)
    expect(newAlerts(timeUp, timeUp)).toEqual([])
  })
  it('rings again for another challenge, or once an alert was over', () => {
    expect(newAlerts(wrongHere, wrongThere)).toEqual(wrongThere)
    expect(newAlerts([], wrongHere)).toEqual(wrongHere)
  })
})
