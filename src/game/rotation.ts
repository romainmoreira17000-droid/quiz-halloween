/**
 * @file Rotation of the teams across the challenges: each team starts on a different one; with a final challenge
 * (`finale: true`), every team plays it together in the last slot, after the rotation of the others.
 */

/**
 * Challenge a team plays during a slot: each team starts one rotating challenge further than the previous team;
 * once every rotating challenge is played, every team plays the final together.
 * @param teamIndex 0-based team, in quiz.yaml order (teams beyond the rotating challenges share a post).
 * @param slot 0-based slot.
 * @param count Number of challenges, final included.
 * @param finalStep 0-based final challenge, played by everyone in the last slot.
 * @returns 0-based challenge.
 * @example challengeAt(1, 4, 6, 5) // 0: the Zombies end the rotation on challenge 1, then play the final
 */
export function challengeAt(teamIndex: number, slot: number, count: number, finalStep?: number): number {
  if (finalStep === undefined) return (teamIndex + slot) % count
  const rotating = count - 1
  if (slot >= rotating) return finalStep
  const position = (teamIndex + slot) % rotating
  // Positions from the final on shift by one: the final is not part of the rotation.
  return position < finalStep ? position : position + 1
}

/**
 * Challenge of the slot after `slot`, announced on the waiting screen.
 * @param teamIndex 0-based team.
 * @param slot 0-based slot on screen.
 * @param count Number of challenges, final included.
 * @param finalStep 0-based final challenge, if any.
 * @returns 0-based challenge, or null after the last slot (the padlock comes next).
 */
export function nextChallenge(teamIndex: number, slot: number, count: number, finalStep?: number): number | null {
  return slot + 1 < count ? challengeAt(teamIndex, slot + 1, count, finalStep) : null
}
