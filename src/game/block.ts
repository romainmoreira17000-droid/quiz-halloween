/** @file Keyboard block after a wrong answer: when it ends and how long is left, derived from timestamps. */

/**
 * End of the block started by a wrong answer at `now`.
 * @param startedAt Start timestamp of the game in ms.
 * @param now Time of the wrong answer in ms.
 * @param slotMinutes Length of one slot.
 * @param blockSeconds `blocage_secondes` (0 = no block).
 * @returns Timestamp in ms, capped at the end of the slot (the next challenge starts free), or null without block.
 * @example blockEnd(0, 14.5 * 60_000, 15, 60) // 15 * 60_000
 */
export function blockEnd(startedAt: number, now: number, slotMinutes: number, blockSeconds: number): number | null {
  if (blockSeconds === 0) return null
  const slotMs = slotMinutes * 60_000
  const slotEnd = startedAt + (Math.floor(Math.max(0, now - startedAt) / slotMs) + 1) * slotMs
  return Math.min(now + blockSeconds * 1000, slotEnd)
}

/**
 * Seconds before a new answer is accepted.
 * @param blockedUntil End of the block in ms, or null.
 * @param now Current timestamp in ms.
 * @returns Whole seconds, rounded up (never shows 00:00 while still blocked); 0 when free.
 */
export function blockSecondsLeft(blockedUntil: number | null, now: number): number {
  return blockedUntil === null ? 0 : Math.max(0, Math.ceil((blockedUntil - now) / 1000))
}
