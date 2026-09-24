/** @file Rotation of the teams across the challenges: never two teams on the same challenge in the same slot. */

/**
 * Challenge a team plays during a slot: each team starts one challenge further than the previous team.
 * @param teamIndex 0-based team, in quiz.yaml order.
 * @param slot 0-based slot.
 * @param count Number of challenges (equal to the number of teams).
 * @returns 0-based challenge.
 * @example challengeAt(1, 5, 6) // 0: the Zombies end on challenge 1
 */
export function challengeAt(teamIndex: number, slot: number, count: number): number {
  return (teamIndex + slot) % count
}
