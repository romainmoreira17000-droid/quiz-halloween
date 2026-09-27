/** @file Tests for the padlock code and dial arithmetic. */
import { DRUM_STEP_DEG, isPadlockCode, padlockCode, rollDrum, turnDial } from './padlock'

const steps = [
  { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
  { title: 'B', instruction: 'b', answer: { kind: 'digits', value: '7' }, digit: 7 },
  { title: 'C', instruction: 'c', answer: { kind: 'digits', value: '0' }, digit: 0 },
] as const

describe('padlockCode', () => {
  it('takes the step digits in step order by default', () => {
    expect(padlockCode(steps, [1, 2, 3])).toEqual([4, 7, 0])
  })
  it('follows the configured order', () => {
    expect(padlockCode(steps, [3, 1, 2])).toEqual([0, 4, 7])
  })
})

describe('isPadlockCode', () => {
  it('accepts the same digits in the same order', () => {
    expect(isPadlockCode([0, 4, 7], [0, 4, 7])).toBe(true)
  })
  it.each([[[4, 0, 7]], [[0, 4]], [[0, 4, 7, 1]]])('rejects %j', (entered) => {
    expect(isPadlockCode([0, 4, 7], entered)).toBe(false)
  })
})

describe('turnDial', () => {
  it.each([[0, 1, 1], [8, 1, 9], [9, 1, 0], [0, -1, 9], [5, -1, 4]] as const)('%i %i → %i', (digit, delta, expected) => {
    expect(turnDial(digit, delta)).toBe(expected)
  })
})

describe('rollDrum', () => {
  it('rolls one notch forward per digit up', () => {
    expect(rollDrum(0, 0, 1)).toBe(DRUM_STEP_DEG)
  })
  it('keeps rolling the same way from 9 to 0', () => {
    expect(rollDrum(9 * DRUM_STEP_DEG, 9, 0)).toBe(10 * DRUM_STEP_DEG)
  })
  it('rolls back from 0 to 9', () => {
    expect(rollDrum(0, 0, 9)).toBe(-DRUM_STEP_DEG)
  })
  it('stays still when the digit does not change', () => {
    expect(rollDrum(720, 4, 4)).toBe(720)
  })
  it('takes the shortest way, forward on a tie', () => {
    expect(rollDrum(0, 1, 8)).toBe(-3 * DRUM_STEP_DEG)
    expect(rollDrum(0, 2, 7)).toBe(5 * DRUM_STEP_DEG)
  })
})
