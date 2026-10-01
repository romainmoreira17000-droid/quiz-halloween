/** @file Tests for the shared clock of the animator board. */
import { boardClock, referenceStart, startOffsetMinutes } from './boardClock'
import { timeOfDay } from './startTime'

const config = { stepCount: 6, slotMinutes: 15 }

describe('referenceStart', () => {
  it('takes the start most tablets agree on (lower median)', () => {
    expect(referenceStart([3000, 1000, 1000])).toBe(1000)
    expect(referenceStart([1000, 5000])).toBe(1000)
  })
  it('has none without a game in progress', () => {
    expect(referenceStart([])).toBeNull()
  })
})

describe('startOffsetMinutes', () => {
  it('ignores a gap of one minute or less', () => {
    expect(startOffsetMinutes(60_000, 0)).toBeNull()
    expect(startOffsetMinutes(-60_000, 0)).toBeNull()
  })
  it('gives the signed gap in whole minutes beyond that', () => {
    expect(startOffsetMinutes(3 * 60_000 + 10_000, 0)).toBe(3)
    expect(startOffsetMinutes(-2 * 60_000 - 5_000, 0)).toBe(-2)
  })
})

describe('boardClock', () => {
  it('tells the start, the elapsed time and where the rotation stands', () => {
    const start = new Date(2026, 9, 31, 19, 2).getTime()
    expect(boardClock(start, start + 16 * 60_000, config)).toEqual({
      start: timeOfDay(start), elapsedSeconds: 960, slot: 1, secondsLeft: 840,
    })
  })
  it('has no slot once every slot is over', () => {
    expect(boardClock(0, 6 * 15 * 60_000, config)).toMatchObject({ slot: null, secondsLeft: null, elapsedSeconds: 5400 })
  })
})
