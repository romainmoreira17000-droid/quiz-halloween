/** @file Tests for the check of a saved game state. */
import { restoreGameState } from './restore'

// Two-step quiz in every case.
const playing = { status: 'playing', stepIndex: 1, foundDigits: [4], startedAt: 1000, finishedAt: null, wrongAttempts: 3 }
const padlock = { status: 'padlock', stepIndex: 1, foundDigits: [4, 0], startedAt: 1000, finishedAt: null, wrongAttempts: 0 }
const won = { ...padlock, status: 'won', finishedAt: 5000 }

describe('restoreGameState', () => {
  it('restores a game in progress, without the wrong tries', () => {
    expect(restoreGameState(playing, 2)).toEqual({ ...playing, wrongAttempts: 0 })
  })
  it('restores a solved step waiting for "next"', () => {
    const solved = { ...playing, foundDigits: [4, 0] }
    expect(restoreGameState(solved, 2)).toEqual({ ...solved, wrongAttempts: 0 })
  })
  it('restores the padlock and the victory', () => {
    expect(restoreGameState(padlock, 2)).toEqual(padlock)
    expect(restoreGameState(won, 2)).toEqual(won)
  })
  it.each([
    ['nothing', null],
    ['text', 'playing'],
    ['home (nothing to resume)', { ...playing, status: 'home' }],
    ['unknown status', { ...playing, status: 'lost' }],
    ['step out of range', { ...playing, stepIndex: 2 }],
    ['negative step', { ...playing, stepIndex: -1 }],
    ['decimal step', { ...playing, stepIndex: 0.5 }],
    ['digit above 9', { ...playing, foundDigits: [12] }],
    ['digits not a list', { ...playing, foundDigits: '4' }],
    ['digits missing for the step', { ...playing, foundDigits: [] }],
    ['no start time', { ...playing, startedAt: null }],
    ['start time as text', { ...playing, startedAt: '1000' }],
    ['playing with an end time', { ...playing, finishedAt: 5000 }],
    ['padlock before all steps', { ...padlock, foundDigits: [4] }],
    ['victory without end time', { ...won, finishedAt: null }],
  ])('rejects %s', (_label, value) => {
    expect(restoreGameState(value, 2)).toBeNull()
  })
})
