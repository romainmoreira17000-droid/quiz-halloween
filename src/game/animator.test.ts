/** @file Tests for the animator menu actions of the game reducer: solve, unblock, show the hint. */
import type { QuizConfig } from '../config/types'
import { createGameReducer, hintShown, initialGameState, type GameState } from './progress'

const MIN = 60_000
const config: QuizConfig = {
  title: 'T', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintTimes: [10], blockSeconds: 60, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '14' }, digit: 4 },
    { title: 'B', instruction: 'b', answer: { kind: 'letters', value: 'Fantôme' }, digit: 0, hints: ['Bouh'] },
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
  it('opens the hint of the challenge on screen for the rest of its slot', () => {
    const shown = reduce(playing, { type: 'showHint', challenge: 1, now: MIN })
    expect(shown).toEqual({ ...playing, hintSlot: 0 })
    expect(hintShown(shown, 0)).toBe(true)
    expect(hintShown(shown, 1)).toBe(false)
  })
  it('ignores a challenge without hint, another challenge, or another screen', () => {
    const zombiesOnA = { ...playing, digits: [null, 0] }
    expect(reduce(zombiesOnA, { type: 'showHint', challenge: 0, now: 16 * MIN })).toBe(zombiesOnA)
    expect(reduce(playing, { type: 'showHint', challenge: 0, now: MIN })).toBe(playing)
    expect(reduce(home, { type: 'showHint', challenge: 1, now: 0 })).toBe(home)
  })
})
