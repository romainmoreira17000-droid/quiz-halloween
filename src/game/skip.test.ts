/** @file Tests for the test-mode skip to the next slot. */
import { startForNextSlot } from './skip'
import { slotTiming } from './time'

const MIN = 60_000

describe('startForNextSlot', () => {
  it('moves the start back so that now opens the next slot', () => {
    const start = startForNextSlot(0, 4 * MIN, 15)
    expect(start).toBe(-11 * MIN)
    expect(slotTiming(start, 4 * MIN, 15)).toEqual({ slot: 1, secondsLeft: 900 })
  })
  it('skips a whole slot from its first second', () => {
    expect(slotTiming(startForNextSlot(0, 15 * MIN, 15), 15 * MIN, 15)).toEqual({ slot: 2, secondsLeft: 900 })
  })
  it('works a few seconds before the change of slot', () => {
    expect(slotTiming(startForNextSlot(1000, 30 * MIN - 1, 15), 30 * MIN - 1, 15)).toEqual({ slot: 2, secondsLeft: 900 })
  })
})
