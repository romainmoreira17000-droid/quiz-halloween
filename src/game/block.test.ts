/** @file Tests for the keyboard block after a wrong answer. */
import { blockEnd, blockSecondsLeft } from './block'

const MIN = 60_000

describe('blockEnd', () => {
  it('blocks for the configured time', () => {
    expect(blockEnd(0, 2 * MIN, 15, 60)).toBe(3 * MIN)
  })
  it('never outlives the slot: the next challenge starts free', () => {
    expect(blockEnd(0, 14.5 * MIN, 15, 60)).toBe(15 * MIN)
    expect(blockEnd(0, 29.9 * MIN, 15, 60)).toBe(30 * MIN)
  })
  it('does not block with blocage_secondes 0', () => {
    expect(blockEnd(0, 2 * MIN, 15, 0)).toBeNull()
  })
})

describe('blockSecondsLeft', () => {
  it('counts whole seconds up, so 00:00 is never shown while blocked', () => {
    expect(blockSecondsLeft(60_000, 0)).toBe(60)
    expect(blockSecondsLeft(60_000, 59_001)).toBe(1)
    expect(blockSecondsLeft(60_000, 60_000)).toBe(0)
    expect(blockSecondsLeft(60_000, 90_000)).toBe(0)
    expect(blockSecondsLeft(null, 0)).toBe(0)
  })
})
