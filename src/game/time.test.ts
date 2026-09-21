/** @file Tests for countdown arithmetic and clock formatting. */
import { formatClock, remainingSeconds } from './time'

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
