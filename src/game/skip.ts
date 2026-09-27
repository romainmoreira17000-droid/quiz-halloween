/** @file Test mode: jumping to the next slot without waiting, by moving the start time back. */

/**
 * Start time that puts `now` on the first millisecond of the next slot. Everything else (rotation, clocks,
 * « Temps écoulé », padlock) is derived from the start time, so this is the whole skip.
 * @param startedAt Current start timestamp in ms.
 * @param now Current timestamp in ms.
 * @param slotMinutes Length of one slot.
 * @returns The new start timestamp in ms, earlier than `startedAt`.
 * @example startForNextSlot(0, 4 * 60_000, 15) // -660_000: now is 15:00 into the game
 */
export function startForNextSlot(startedAt: number, now: number, slotMinutes: number): number {
  const slotMs = slotMinutes * 60_000
  const elapsed = Math.max(0, now - startedAt)
  return startedAt - (slotMs - (elapsed % slotMs))
}
