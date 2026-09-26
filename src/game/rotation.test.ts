/** @file Tests for the rotation of the teams across the challenges. */
import { challengeAt } from './rotation'

const SIX = [0, 1, 2, 3, 4, 5]

describe('challengeAt', () => {
  it('matches the rotation table of the spec for the Zombies', () => {
    expect(SIX.map((slot) => challengeAt(1, slot, 6) + 1)).toEqual([2, 3, 4, 5, 6, 1])
  })
  it('never puts two teams on the same challenge in a slot', () => {
    for (const slot of SIX) expect(new Set(SIX.map((team) => challengeAt(team, slot, 6))).size).toBe(6)
  })
  it('gives every challenge to every team', () => {
    for (const team of SIX) expect(new Set(SIX.map((slot) => challengeAt(team, slot, 6))).size).toBe(6)
  })
})
