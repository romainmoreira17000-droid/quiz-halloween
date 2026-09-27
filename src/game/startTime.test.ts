/** @file Tests for reading and showing the start time of the game as a time of day. */
import { startAtTimeOfDay, timeOfDay } from './startTime'

// Local times: the tablet shows and reads the clock of its own time zone.
const at = (hours: number, minutes: number, seconds = 0) => new Date(2026, 9, 31, hours, minutes, seconds).getTime()

describe('timeOfDay', () => {
  it('shows hours and minutes on two digits', () => {
    expect(timeOfDay(at(9, 5, 42))).toBe('09:05')
    expect(timeOfDay(at(20, 30))).toBe('20:30')
  })
})

describe('startAtTimeOfDay', () => {
  it('gives the timestamp of that time today', () => {
    expect(startAtTimeOfDay('20:00', at(20, 47, 12))).toBe(at(20, 0))
    expect(startAtTimeOfDay('20:47', at(20, 47, 12))).toBe(at(20, 47))
  })
  it('refuses a time still to come, and anything that is not hh:mm', () => {
    expect(startAtTimeOfDay('20:48', at(20, 47, 12))).toBeNull()
    for (const text of ['', '8', '24:00', '20:60', '2000', 'ab:cd']) expect(startAtTimeOfDay(text, at(20, 47))).toBeNull()
  })
})
