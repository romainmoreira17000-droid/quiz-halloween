/** @file Tests for the check of a saved game state. */
import { restoreGameState } from './restore'

// Two-challenge quiz in every case.
const playing = { status: 'playing', digits: [null, 0], startedAt: 1000, finishedAt: null, wrongAttempts: 3, wrongSlot: 0, blockedUntil: 90_000, hintSlot: 1, hintCount: 2 }
const won = { status: 'won', digits: [4, 0], startedAt: 1000, finishedAt: 5000, wrongAttempts: 0, wrongSlot: 2, blockedUntil: null, hintSlot: null, hintCount: 0 }
const entrance = { status: 'entrance', digits: [null, null], startedAt: null, finishedAt: null, wrongAttempts: 2, wrongSlot: null, blockedUntil: null, hintSlot: null, hintCount: 0 }
const cleared = { wrongAttempts: 0, wrongSlot: null }

describe('restoreGameState', () => {
  it('restores a game in progress with its block, without the wrong tries', () => {
    expect(restoreGameState(playing, 2)).toEqual({ ...playing, ...cleared })
  })
  it('restores a sprint 12 save (no hint shown by an animator) with the hint closed', () => {
    const { hintSlot: _slot, hintCount: _count, ...older } = playing
    expect(restoreGameState(older, 2)).toEqual({ ...playing, ...cleared, hintSlot: null, hintCount: 0 })
  })
  it('restores a sprint 13 save (one hint shown, no count) with that hint', () => {
    const { hintCount: _dropped, ...older } = playing
    expect(restoreGameState(older, 2)).toEqual({ ...playing, ...cleared, hintCount: 1 })
  })
  it('restores the victory and the entrance', () => {
    expect(restoreGameState(won, 2)).toEqual({ ...won, ...cleared })
    expect(restoreGameState(entrance, 2)).toEqual({ ...entrance, ...cleared })
  })
  it.each([
    ['nothing', null],
    ['text', 'playing'],
    ['home (nothing to resume)', { ...playing, status: 'home' }],
    ['a sprint 8 save', { status: 'padlock', stepIndex: 1, foundDigits: [4, 0], startedAt: 1000, finishedAt: null }],
    ['digits not a list', { ...playing, digits: '4' }],
    ['too few digits', { ...playing, digits: [0] }],
    ['digit above 9', { ...playing, digits: [12, null] }],
    ['decimal digit', { ...playing, digits: [0.5, null] }],
    ['no start time', { ...playing, startedAt: null }],
    ['start time as text', { ...playing, startedAt: '1000' }],
    ['playing with an end time', { ...playing, finishedAt: 5000 }],
    ['victory with a missing digit', { ...won, digits: [null, 0] }],
    ['victory without end time', { ...won, finishedAt: null }],
    ['entrance with a start time', { ...entrance, startedAt: 1000 }],
    ['entrance with a digit', { ...entrance, digits: [4, null] }],
    ['a sprint 9 save (no block)', { status: 'playing', digits: [null, 0], startedAt: 1000, finishedAt: null, wrongAttempts: 0, wrongSlot: null }],
    ['block as text', { ...playing, blockedUntil: '90000' }],
    ['hint slot as text', { ...playing, hintSlot: '1' }],
    ['negative hint slot', { ...playing, hintSlot: -1 }],
    ['hint count as text', { ...playing, hintCount: '1' }],
    ['negative hint count', { ...playing, hintCount: -1 }],
  ])('rejects %s', (_label, value) => {
    expect(restoreGameState(value, 2)).toBeNull()
  })
})
