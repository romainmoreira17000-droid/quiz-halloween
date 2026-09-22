/** @file Tests for the game state machine. */
import { createGameReducer, initialGameState, isCurrentStepSolved, type GameState } from './progress'

const steps = [
  { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '14' }, digit: 4 },
  { title: 'B', instruction: 'b', answer: { kind: 'letters', value: 'Fantôme' }, digit: 0 },
] as const
const reduce = createGameReducer(steps, [0, 4])
const withEntrance = createGameReducer(steps, [0, 4], { kind: 'letters', value: 'Fantôme' })
const playing: GameState = { ...initialGameState, status: 'playing', startedAt: 1000 }
const atPadlock: GameState = { ...playing, status: 'padlock', stepIndex: 1, foundDigits: [4, 0] }
const atEntrance: GameState = { ...initialGameState, status: 'entrance' }

describe('game reducer', () => {
  it('starts on the home screen', () => {
    expect(initialGameState).toEqual({
      status: 'home', stepIndex: 0, foundDigits: [], startedAt: null, finishedAt: null, wrongAttempts: 0,
    })
  })
  it('records the start time', () => {
    expect(reduce(initialGameState, { type: 'start', now: 1000 })).toEqual(playing)
  })
  it('ignores a second start', () => {
    expect(reduce(playing, { type: 'start', now: 9999 })).toBe(playing)
  })
  it('counts wrong answers without other penalty', () => {
    const once = reduce(playing, { type: 'answer', text: '1' })
    const twice = reduce(once, { type: 'answer', text: '2' })
    expect(twice).toEqual({ ...playing, wrongAttempts: 2 })
  })
  it('stores the digit of a solved step and clears wrong tries', () => {
    const wrong = reduce(playing, { type: 'answer', text: '1' })
    const right = reduce(wrong, { type: 'answer', text: '14' })
    expect(right).toEqual({ ...playing, foundDigits: [4], wrongAttempts: 0 })
    expect(isCurrentStepSolved(right)).toBe(true)
  })
  it('ignores keypad presses once the step is solved', () => {
    const right = reduce(playing, { type: 'answer', text: '14' })
    expect(reduce(right, { type: 'answer', text: '14' })).toBe(right)
  })
  it('does not move on before the step is solved', () => {
    expect(reduce(playing, { type: 'next' })).toBe(playing)
  })
  it('moves to the next step', () => {
    const right = reduce(playing, { type: 'answer', text: '14' })
    const next = reduce(right, { type: 'next' })
    expect(next).toEqual({ ...playing, stepIndex: 1, foundDigits: [4] })
    expect(isCurrentStepSolved(next)).toBe(false)
  })
  it('accepts 0 as an earned digit and goes to the padlock after the last step', () => {
    let state = reduce(playing, { type: 'answer', text: '14' })
    state = reduce(state, { type: 'next' })
    state = reduce(state, { type: 'answer', text: 'fantome' })
    state = reduce(state, { type: 'next' })
    expect(state).toEqual(atPadlock)
  })
  it('ignores answers outside of the playing status', () => {
    expect(reduce(initialGameState, { type: 'answer', text: '14' })).toBe(initialGameState)
  })
  it('counts wrong codes without other penalty', () => {
    const once = reduce(atPadlock, { type: 'unlock', code: [4, 0], now: 5000 })
    expect(once).toEqual({ ...atPadlock, wrongAttempts: 1 })
  })
  it('opens with the right code and freezes the time', () => {
    const wrong = reduce(atPadlock, { type: 'unlock', code: [4, 0], now: 5000 })
    expect(reduce(wrong, { type: 'unlock', code: [0, 4], now: 9000 }))
      .toEqual({ ...atPadlock, status: 'won', finishedAt: 9000, wrongAttempts: 0 })
  })
  it('ignores unlock outside of the padlock', () => {
    expect(reduce(playing, { type: 'unlock', code: [0, 4], now: 9000 })).toBe(playing)
    const won = reduce(atPadlock, { type: 'unlock', code: [0, 4], now: 9000 })
    expect(reduce(won, { type: 'unlock', code: [0, 4], now: 12000 })).toBe(won)
  })
  it('goes back to the home screen from anywhere on reset', () => {
    expect(reduce(atPadlock, { type: 'reset' })).toEqual(initialGameState)
    expect(reduce(playing, { type: 'reset' })).toEqual(initialGameState)
  })
  it('goes to the entrance first when there is one, without starting the clock', () => {
    expect(withEntrance(initialGameState, { type: 'start', now: 1000 })).toEqual(atEntrance)
  })
  it('counts wrong entrance answers', () => {
    expect(withEntrance(atEntrance, { type: 'enter', text: 'chat', now: 2000 })).toEqual({ ...atEntrance, wrongAttempts: 1 })
  })
  it('starts the clock when the entrance is solved', () => {
    const wrong = withEntrance(atEntrance, { type: 'enter', text: 'chat', now: 2000 })
    expect(withEntrance(wrong, { type: 'enter', text: 'fantome', now: 3000 })).toEqual({ ...playing, startedAt: 3000 })
  })
  it('ignores enter outside of the entrance', () => {
    expect(withEntrance(playing, { type: 'enter', text: 'fantome', now: 3000 })).toBe(playing)
    expect(reduce(atEntrance, { type: 'enter', text: 'fantome', now: 3000 })).toBe(atEntrance)
  })
  it('ignores step answers at the entrance', () => {
    expect(withEntrance(atEntrance, { type: 'answer', text: '14' })).toBe(atEntrance)
  })
})
