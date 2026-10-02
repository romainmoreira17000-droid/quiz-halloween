/** @file Tests for the way to the room of a new slot. */
import { isOnTheWay } from './arrival'

describe('isOnTheWay', () => {
  it('is true on a challenge whose room the group has not reached yet', () => {
    expect(isOnTheWay({ kind: 'challenge', slot: 0, challenge: 2 }, null)).toBe(true)
    expect(isOnTheWay({ kind: 'challenge', slot: 1, challenge: 2 }, 0)).toBe(true)
  })
  it('is false once arrived, and on every other screen', () => {
    expect(isOnTheWay({ kind: 'challenge', slot: 1, challenge: 2 }, 1)).toBe(false)
    expect(isOnTheWay({ kind: 'waiting', slot: 1, challenge: 2 }, 0)).toBe(false)
    expect(isOnTheWay({ kind: 'timeUp', challenge: 2 }, null)).toBe(false)
    expect(isOnTheWay({ kind: 'padlock' }, null)).toBe(false)
  })
})
