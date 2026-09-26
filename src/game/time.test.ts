/** @file Tests for countdown arithmetic and clock formatting. */
import { formatClock, remainingSeconds, secondsBeforeHint, slotTiming } from './time'

const START = Date.UTC(2026, 9, 31, 14, 0, 0)

describe('remainingSeconds', () => {
  it('is the full duration at the start', () => {
    expect(remainingSeconds(START, START, 90)).toBe(5400)
  })
  it('drops whole seconds only', () => {
    expect(remainingSeconds(START, START + 999, 90)).toBe(5400)
    expect(remainingSeconds(START, START + 1000, 90)).toBe(5399)
  })
  it('goes negative once time is up', () => {
    expect(remainingSeconds(START, START + 91 * 60_000, 90)).toBe(-60)
  })
})

describe('formatClock', () => {
  it('pads minutes and seconds', () => {
    expect(formatClock(5400)).toBe('90:00')
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(0)).toBe('00:00')
  })
  it('keeps minutes above 99', () => {
    expect(formatClock(125 * 60)).toBe('125:00')
  })
  it('prefixes negative times with a minus sign', () => {
    expect(formatClock(-1)).toBe('-00:01')
    expect(formatClock(-61)).toBe('-01:01')
  })
})

describe('slotTiming', () => {
  const MIN = 60_000
  it('shows the full slot at the start', () => {
    expect(slotTiming(1000, 1000, 15)).toEqual({ slot: 0, secondsLeft: 900 })
  })
  it('counts down inside a slot', () => {
    expect(slotTiming(0, 16 * MIN, 15)).toEqual({ slot: 1, secondsLeft: 840 })
  })
  it('shows 1 second left just before the change, then the full next slot', () => {
    expect(slotTiming(0, 15 * MIN - 1, 15)).toEqual({ slot: 0, secondsLeft: 1 })
    expect(slotTiming(0, 15 * MIN, 15)).toEqual({ slot: 1, secondsLeft: 900 })
  })
  it('keeps counting slots after the last one', () => {
    expect(slotTiming(0, 91 * MIN, 15).slot).toBe(6)
  })
  it('treats a time before the start as the start', () => {
    expect(slotTiming(5000, 1000, 15)).toEqual({ slot: 0, secondsLeft: 900 })
  })
})

describe('secondsBeforeHint', () => {
  it('counts down from the hint delay at the start of a slot', () => {
    expect(secondsBeforeHint(900, 15, 10)).toBe(600)
    expect(secondsBeforeHint(301, 15, 10)).toBe(1)
  })
  it('is 0 once the hint is available, and from the start with a delay of 0', () => {
    expect(secondsBeforeHint(300, 15, 10)).toBe(0)
    expect(secondsBeforeHint(12, 15, 10)).toBe(0)
    expect(secondsBeforeHint(900, 15, 0)).toBe(0)
  })
})
