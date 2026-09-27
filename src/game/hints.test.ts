/** @file Tests for the progressive hint unlock rules. */
import { availableHints, hintsUnlockedByClock, secondsBeforeNextHint } from './hints'

const TIMES = [5, 8, 11]

describe('hintsUnlockedByClock', () => {
  it('unlocks each hint at its minute of the slot', () => {
    expect(hintsUnlockedByClock(900, 15, TIMES)).toBe(0)
    expect(hintsUnlockedByClock(601, 15, TIMES)).toBe(0)
    expect(hintsUnlockedByClock(600, 15, TIMES)).toBe(1)
    expect(hintsUnlockedByClock(420, 15, TIMES)).toBe(2)
    expect(hintsUnlockedByClock(240, 15, TIMES)).toBe(3)
    expect(hintsUnlockedByClock(900, 15, [0])).toBe(1)
  })
})

describe('secondsBeforeNextHint', () => {
  it('counts down to the next hint, null when none is left', () => {
    expect(secondsBeforeNextHint(900, 15, TIMES, 0)).toBe(300)
    expect(secondsBeforeNextHint(600, 15, TIMES, 1)).toBe(180)
    expect(secondsBeforeNextHint(240, 15, TIMES, 3)).toBeNull()
  })
  it('counts to the hint after those given early by an animator', () => {
    expect(secondsBeforeNextHint(900, 15, TIMES, 2)).toBe(660)
  })
  it('is 0, never negative, when the clock is already past that time', () => {
    expect(secondsBeforeNextHint(100, 15, TIMES, 1)).toBe(0)
  })
})

describe('availableHints', () => {
  it('takes the most of clock and animator, not the sum', () => {
    expect(availableHints(1, { slot: 2, count: 1 }, 2, 3)).toBe(1)
    expect(availableHints(1, { slot: 2, count: 2 }, 2, 3)).toBe(2)
  })
  it('forgets the animator hints of another slot', () => {
    expect(availableHints(0, { slot: 1, count: 3 }, 2, 3)).toBe(0)
  })
  it('never exceeds the hints of the step', () => {
    expect(availableHints(3, { slot: null, count: 0 }, 0, 1)).toBe(1)
    expect(availableHints(2, { slot: null, count: 0 }, 0, 0)).toBe(0)
  })
})
