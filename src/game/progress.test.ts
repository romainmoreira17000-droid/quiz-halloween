/** @file Tests for the game state machine of one team. */
import type { QuizConfig } from '../config/types'
import { createGameReducer, earnsDigit, initialGameState, wrongAttemptsIn, type GameState } from './progress'

const MIN = 60_000
const config: QuizConfig = {
  title: 'T', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintAfterMinutes: 10, blockSeconds: 0, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '14' }, digit: 4 },
    { title: 'B', instruction: 'b', answer: { kind: 'letters', value: 'Fantôme' }, digit: 0 },
  ],
  padlock: { order: [2, 1] },
}
// The Zombies (team 1) play B (challenge 1) during slot 0, then A (challenge 0) during slot 1.
const reduce = createGameReducer(config, 1)
const withEntrance = createGameReducer({ ...config, entrance: { message: 'm', answer: { kind: 'letters', value: 'Bouh' } } }, 1)
const home = initialGameState(2)
const playing: GameState = { ...home, status: 'playing', startedAt: 0 }
const allFound: GameState = { ...playing, digits: [4, 0] }
const atEntrance: GameState = { ...home, status: 'entrance' }

describe('game reducer', () => {
  it('starts on the home screen, with no digit', () => {
    expect(home).toEqual({ status: 'home', digits: [null, null], startedAt: null, finishedAt: null, wrongAttempts: 0, wrongSlot: null })
  })
  it('records the start time, once', () => {
    expect(reduce(home, { type: 'start', now: 0 })).toEqual(playing)
    expect(reduce(playing, { type: 'start', now: 5 })).toBe(playing)
  })
  it('stores the digit of the challenge on screen', () => {
    expect(reduce(playing, { type: 'answer', challenge: 1, text: 'fantome', now: MIN })).toEqual({ ...playing, digits: [null, 0] })
  })
  it('counts wrong answers in the current slot, and clears them on the right one', () => {
    const once = reduce(playing, { type: 'answer', challenge: 1, text: 'chat', now: MIN })
    const twice = reduce(once, { type: 'answer', challenge: 1, text: 'loup', now: 2 * MIN })
    expect(twice).toEqual({ ...playing, wrongAttempts: 2, wrongSlot: 0 })
    expect(wrongAttemptsIn(twice, 0)).toBe(2)
    expect(reduce(twice, { type: 'answer', challenge: 1, text: 'Fantôme', now: 3 * MIN }).wrongAttempts).toBe(0)
  })
  it('forgets the wrong tries of an earlier slot', () => {
    const wrongInSlot0 = reduce(playing, { type: 'answer', challenge: 1, text: 'chat', now: MIN })
    expect(wrongAttemptsIn(wrongInSlot0, 1)).toBe(0)
    const helped = reduce(wrongInSlot0, { type: 'giveDigit', challenge: 1, code: '2710', now: 16 * MIN })
    expect(reduce(helped, { type: 'answer', challenge: 0, text: '99', now: 17 * MIN })).toMatchObject({ wrongAttempts: 1, wrongSlot: 1 })
  })
  it('ignores an answer for a challenge that is not on screen', () => {
    // Tapped just as the slot changed: it must not be checked against the next challenge.
    expect(reduce(playing, { type: 'answer', challenge: 1, text: 'fantome', now: 15 * MIN }).digits).toEqual([null, null])
    expect(reduce(playing, { type: 'answer', challenge: 0, text: '14', now: MIN })).toBe(playing)
  })
  it('ignores answers once the digit is found, and outside of a game', () => {
    const solved = { ...playing, digits: [null, 0] }
    expect(reduce(solved, { type: 'answer', challenge: 1, text: 'fantome', now: 2 * MIN })).toBe(solved)
    expect(reduce(home, { type: 'answer', challenge: 1, text: 'fantome', now: MIN })).toBe(home)
  })
  it('gives the digit of a missed challenge with the animator code', () => {
    expect(reduce(playing, { type: 'giveDigit', challenge: 1, code: '2710', now: 15 * MIN })).toEqual({ ...playing, digits: [null, 0] })
  })
  it('refuses to give a digit with a wrong code, too early, or for another challenge', () => {
    expect(reduce(playing, { type: 'giveDigit', challenge: 1, code: '1111', now: 15 * MIN })).toBe(playing)
    expect(reduce(playing, { type: 'giveDigit', challenge: 1, code: '2710', now: MIN })).toBe(playing)
    expect(reduce(playing, { type: 'giveDigit', challenge: 0, code: '2710', now: 15 * MIN })).toBe(playing)
  })
  it('keeps the padlock closed before the last slot ends', () => {
    expect(reduce(allFound, { type: 'unlock', code: [0, 4], now: 29 * MIN })).toBe(allFound)
  })
  it('opens the padlock with the right code and freezes the time', () => {
    const wrong = reduce(allFound, { type: 'unlock', code: [4, 0], now: 30 * MIN })
    expect(wrong).toEqual({ ...allFound, wrongAttempts: 1, wrongSlot: 2 })
    expect(reduce(wrong, { type: 'unlock', code: [0, 4], now: 31 * MIN }))
      .toEqual({ ...wrong, status: 'won', finishedAt: 31 * MIN, wrongAttempts: 0 })
  })
  it('goes back home from anywhere on reset', () => {
    expect(reduce(allFound, { type: 'reset' })).toEqual(home)
  })
  it('goes to the entrance first when there is one, without starting the clock', () => {
    expect(withEntrance(home, { type: 'start', now: 0 })).toEqual(atEntrance)
  })
  it('counts wrong entrance answers, then starts the clock on the right one', () => {
    const wrong = withEntrance(atEntrance, { type: 'enter', text: 'chat', now: 0 })
    expect(wrong).toEqual({ ...atEntrance, wrongAttempts: 1 })
    expect(wrongAttemptsIn(wrong, null)).toBe(1)
    expect(withEntrance(wrong, { type: 'enter', text: 'bouh', now: 3000 })).toEqual({ ...playing, startedAt: 3000 })
  })
  it('ignores enter outside of the entrance', () => {
    expect(withEntrance(playing, { type: 'enter', text: 'bouh', now: 0 })).toBe(playing)
    expect(reduce(atEntrance, { type: 'enter', text: 'bouh', now: 0 })).toBe(atEntrance)
  })
})

describe('earnsDigit', () => {
  it('is true only for the right answer to the challenge on screen', () => {
    expect(earnsDigit(playing, config, 1, { challenge: 1, text: 'Fantôme', now: MIN })).toBe(true)
    expect(earnsDigit(playing, config, 1, { challenge: 1, text: 'chat', now: MIN })).toBe(false)
    expect(earnsDigit(playing, config, 1, { challenge: 0, text: '14', now: MIN })).toBe(false)
  })
})
