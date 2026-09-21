/** @file Tests for the game state machine. */
import { createGameReducer, initialGameState, isCurrentStepSolved, type GameState } from './progress'

const steps = [
  { title: 'A', instruction: 'a', solution: 4 },
  { title: 'B', instruction: 'b', solution: 0 },
]
const reduce = createGameReducer(steps)
const playing: GameState = { ...initialGameState, status: 'playing', startedAt: 1000 }

describe('game reducer', () => {
  it('starts on the home screen', () => {
    expect(initialGameState).toEqual({ status: 'home', stepIndex: 0, foundDigits: [], startedAt: null, wrongAttempts: 0 })
  })
  it('records the start time', () => {
    expect(reduce(initialGameState, { type: 'start', now: 1000 })).toEqual(playing)
  })
  it('ignores a second start', () => {
    expect(reduce(playing, { type: 'start', now: 9999 })).toBe(playing)
  })
  it('counts wrong answers without other penalty', () => {
    const once = reduce(playing, { type: 'answer', digit: 1 })
    const twice = reduce(once, { type: 'answer', digit: 2 })
    expect(twice).toEqual({ ...playing, wrongAttempts: 2 })
  })
  it('stores the digit of a solved step and clears wrong tries', () => {
    const wrong = reduce(playing, { type: 'answer', digit: 1 })
    const right = reduce(wrong, { type: 'answer', digit: 4 })
    expect(right).toEqual({ ...playing, foundDigits: [4], wrongAttempts: 0 })
    expect(isCurrentStepSolved(right)).toBe(true)
  })
  it('ignores keypad presses once the step is solved', () => {
    const right = reduce(playing, { type: 'answer', digit: 4 })
    expect(reduce(right, { type: 'answer', digit: 7 })).toBe(right)
  })
  it('does not move on before the step is solved', () => {
    expect(reduce(playing, { type: 'next' })).toBe(playing)
  })
  it('moves to the next step', () => {
    const right = reduce(playing, { type: 'answer', digit: 4 })
    const next = reduce(right, { type: 'next' })
    expect(next).toEqual({ ...playing, stepIndex: 1, foundDigits: [4] })
    expect(isCurrentStepSolved(next)).toBe(false)
  })
  it('accepts 0 as a solution and ends after the last step', () => {
    let state = reduce(playing, { type: 'answer', digit: 4 })
    state = reduce(state, { type: 'next' })
    state = reduce(state, { type: 'answer', digit: 0 })
    state = reduce(state, { type: 'next' })
    expect(state).toEqual({ ...playing, status: 'solved', stepIndex: 1, foundDigits: [4, 0] })
  })
  it('ignores answers outside of the playing status', () => {
    expect(reduce(initialGameState, { type: 'answer', digit: 4 })).toBe(initialGameState)
  })
})
