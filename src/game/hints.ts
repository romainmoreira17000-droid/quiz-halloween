/** @file Progressive hints: when each hint of a challenge unlocks, by the slot clock or by an animator. */

const elapsedSeconds = (slotSecondsLeft: number, slotMinutes: number) => slotMinutes * 60 - slotSecondsLeft

/**
 * Hints the slot clock has unlocked.
 * @param slotSecondsLeft Seconds left in the current slot.
 * @param slotMinutes Length of a slot.
 * @param hintTimes Minute of the slot at which each hint unlocks (strictly increasing).
 * @returns Between 0 and `hintTimes.length`.
 * @example hintsUnlockedByClock(420, 15, [5, 8, 11]) // 2 (8 minutes in)
 */
export function hintsUnlockedByClock(slotSecondsLeft: number, slotMinutes: number, hintTimes: readonly number[]): number {
  const elapsed = elapsedSeconds(slotSecondsLeft, slotMinutes)
  return hintTimes.filter((minutes) => minutes * 60 <= elapsed).length
}

/**
 * Seconds before hint n° `available + 1` unlocks by the clock.
 * @param slotSecondsLeft Seconds left in the current slot.
 * @param slotMinutes Length of a slot.
 * @param hintTimes Minute of the slot at which each hint unlocks.
 * @param available Hints already available (clock or animator).
 * @returns 0 when that time is already past, null when there is no further hint time.
 * @example secondsBeforeNextHint(600, 15, [5, 8, 11], 1) // 180
 */
export function secondsBeforeNextHint(
  slotSecondsLeft: number,
  slotMinutes: number,
  hintTimes: readonly number[],
  available: number,
): number | null {
  const next = hintTimes[available]
  return next === undefined ? null : Math.max(0, next * 60 - elapsedSeconds(slotSecondsLeft, slotMinutes))
}

/**
 * Hints available now.
 * @param byClock Hints unlocked by the slot clock.
 * @param animator Slot in which an animator gave hints, and how many (menu).
 * @param slot Current slot.
 * @param total Hints of the step.
 * @returns The most of clock and animator (animator only in the same slot), capped by `total`.
 * @example availableHints(1, { slot: 2, count: 2 }, 2, 3) // 2
 */
export function availableHints(
  byClock: number,
  animator: { slot: number | null; count: number },
  slot: number,
  total: number,
): number {
  // The max, not the sum: a hint given early is the same hint the clock unlocks later.
  const given = animator.slot === slot ? animator.count : 0
  return Math.min(total, Math.max(byClock, given))
}
