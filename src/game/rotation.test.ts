/** @file Tests for the rotation of the teams across the challenges. */
import { challengeAt, nextChallenge } from './rotation'

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

describe('challengeAt with a final challenge', () => {
  it('rotates the other challenges, then everyone plays the final', () => {
    expect(SIX.map((slot) => challengeAt(1, slot, 6, 5) + 1)).toEqual([2, 3, 4, 5, 1, 6])
  })
  it('gives every team each rotating challenge once, then the final', () => {
    for (const team of SIX) {
      const order = SIX.map((slot) => challengeAt(team, slot, 6, 5))
      expect(new Set(order.slice(0, 5))).toEqual(new Set([0, 1, 2, 3, 4]))
      expect(order[5]).toBe(5)
    }
  })
  it('puts at most two of six teams on a rotating challenge', () => {
    for (const slot of [0, 1, 2, 3, 4]) {
      const posts = SIX.map((team) => challengeAt(team, slot, 6, 5))
      for (const post of new Set(posts)) expect(posts.filter((p) => p === post).length).toBeLessThanOrEqual(2)
    }
  })
  it('skips a final placed in the middle of the list', () => {
    expect(SIX.map((slot) => challengeAt(0, slot, 6, 2))).toEqual([0, 1, 3, 4, 5, 2])
  })
  it('plays only the final when it is the only challenge', () => {
    expect(challengeAt(3, 0, 1, 0)).toBe(0)
  })
})

describe('nextChallenge', () => {
  it('gives the challenge of the following slot', () => {
    expect(nextChallenge(1, 0, 6, 5)).toBe(2)
    // Before the final: everyone goes to the final.
    expect(nextChallenge(1, 4, 6, 5)).toBe(5)
  })
  it('gives null after the last slot (the padlock comes next)', () => {
    expect(nextChallenge(1, 5, 6, 5)).toBeNull()
  })
})
