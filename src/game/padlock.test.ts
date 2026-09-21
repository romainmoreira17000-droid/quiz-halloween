/** @file Tests for the padlock code and dial arithmetic. */
import { isPadlockCode, padlockCode, turnDial } from './padlock'

const steps = [
  { title: 'A', instruction: 'a', solution: 4 },
  { title: 'B', instruction: 'b', solution: 7 },
  { title: 'C', instruction: 'c', solution: 0 },
]

describe('padlockCode', () => {
  it('takes the solutions in step order by default', () => {
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
