/** @file Tests for the animator menu actions of the game reducer: solve, unblock, show the hint. */
import type { QuizConfig } from '../config/types'
import { createGameReducer, hintsAvailable, initialGameState, type GameState } from './progress'

const MIN = 60_000
const config: QuizConfig = {
  title: 'T', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintTimes: [5, 8, 11], blockSeconds: 60, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '14' }, digit: 4 },
    { title: 'B', instruction: 'b', answer: { kind: 'letters', value: 'Fantôme' }, digit: 0, hints: ['Bouh', 'Hou', 'Ouh'] },
  ],
  padlock: { order: [2, 1] },
}
// The Zombies (team 1) play B (challenge 1) during slot 0, then A (challenge 0) during slot 1.
const reduce = createGameReducer(config, 1)
const home = initialGameState(2)
const playing: GameState = { ...home, status: 'playing', startedAt: 0 }
const blocked: GameState = { ...playing, wrongAttempts: 2, wrongSlot: 0, blockedUntil: 3 * MIN }

describe('animatorSolve', () => {
  it('gives the digit of the challenge on screen and clears the block', () => {
    expect(reduce(blocked, { type: 'animatorSolve', challenge: 1, now: 2 * MIN }))
      .toEqual({ ...playing, digits: [null, 0], wrongAttempts: 0, blockedUntil: null, wrongSlot: 0 })
  })
  it('ignores another challenge, a found one, and every other screen', () => {
    expect(reduce(playing, { type: 'animatorSolve', challenge: 0, now: MIN })).toBe(playing)
    const found = { ...playing, digits: [null, 0] }
    expect(reduce(found, { type: 'animatorSolve', challenge: 1, now: MIN })).toBe(found)
    expect(reduce(home, { type: 'animatorSolve', challenge: 1, now: 0 })).toBe(home)
    // Slot 1 with challenge B missed: « Temps écoulé » has its own way (the code on screen).
    expect(reduce(playing, { type: 'animatorSolve', challenge: 1, now: 16 * MIN })).toBe(playing)
  })
})

describe('unblock', () => {
  it('ends the block at once, keeping the wrong tries message', () => {
    expect(reduce(blocked, { type: 'unblock', now: 2 * MIN })).toEqual({ ...blocked, blockedUntil: null })
  })
  it('does nothing when the keyboard is free', () => {
    expect(reduce(playing, { type: 'unblock', now: 2 * MIN })).toBe(playing)
    expect(reduce(blocked, { type: 'unblock', now: 4 * MIN })).toBe(blocked)
  })
})

describe('showHint', () => {
  it('gives one more hint on each tap, for the rest of the slot', () => {
    const one = reduce(playing, { type: 'showHint', challenge: 1, now: MIN })
    expect(one).toEqual({ ...playing, hintSlot: 0, hintCount: 1 })
    const two = reduce(one, { type: 'showHint', challenge: 1, now: MIN })
    expect(hintsAvailable(two, config, 1, 0, MIN)).toBe(2)
    expect(hintsAvailable(two, config, 1, 1, 16 * MIN)).toBe(0)
  })
  it('counts from the hints the clock already unlocked', () => {
    // 9 minutes in: the clock gave 2 hints, the animator gives the third.
    expect(reduce(playing, { type: 'showHint', challenge: 1, now: 9 * MIN })).toEqual({ ...playing, hintSlot: 0, hintCount: 3 })
  })
  it('ignores a tap once every hint is out, a challenge without hint, another challenge, or another screen', () => {
    const all = { ...playing, hintSlot: 0, hintCount: 3 }
    expect(reduce(all, { type: 'showHint', challenge: 1, now: MIN })).toBe(all)
    const zombiesOnA = { ...playing, digits: [null, 0] }
    expect(reduce(zombiesOnA, { type: 'showHint', challenge: 0, now: 16 * MIN })).toBe(zombiesOnA)
    expect(reduce(playing, { type: 'showHint', challenge: 0, now: MIN })).toBe(playing)
    expect(reduce(home, { type: 'showHint', challenge: 1, now: 0 })).toBe(home)
  })
})

describe('animatorSkip', () => {
  it('gives the digit of an unsolved challenge and starts the next slot now', () => {
    // 4 minutes into slot 0: the start moves back 11 minutes, so now is 15:00 into the game.
    expect(reduce(blocked, { type: 'animatorSkip', challenge: 1, now: 4 * MIN }))
      .toEqual({ ...blocked, digits: [null, 0], startedAt: -11 * MIN, wrongAttempts: 0, blockedUntil: null })
  })
  it('skips the wait of a found challenge without touching its digit', () => {
    const found = { ...playing, digits: [null, 0] }
    expect(reduce(found, { type: 'animatorSkip', challenge: 1, now: 10 * MIN })).toEqual({ ...found, startedAt: -5 * MIN })
  })
  it('ignores another challenge (a tap right at the change of slot), « Temps écoulé », the padlock and other screens', () => {
    expect(reduce(playing, { type: 'animatorSkip', challenge: 0, now: MIN })).toBe(playing)
    expect(reduce(playing, { type: 'animatorSkip', challenge: 1, now: 16 * MIN })).toBe(playing)
    const allFound = { ...playing, digits: [4, 0] }
    expect(reduce(allFound, { type: 'animatorSkip', challenge: 0, now: 31 * MIN })).toBe(allFound)
    expect(reduce(home, { type: 'animatorSkip', challenge: 1, now: 0 })).toBe(home)
  })
})
