/**
 * @file Countdown and slot arithmetic, always derived from timestamps so sleep/reload stays exact.
 */

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Seconds left before the end of the game (negative once time is up).
 * @param startedAt Start timestamp in ms (Date.now()).
 * @param now Current timestamp in ms.
 * @param durationMinutes Total game duration (slots × slot length).
 * @returns Whole seconds left; elapsed time is rounded down so the clock starts on "90:00".
 */
export function remainingSeconds(startedAt: number, now: number, durationMinutes: number): number {
  return durationMinutes * 60 - Math.floor((now - startedAt) / 1000)
}

/**
 * Formats seconds as "mm:ss", with a leading "-" when negative.
 * @param seconds Seconds left, possibly negative.
 * @returns For example "84:17" or "-02:05".
 */
export function formatClock(seconds: number): string {
  const abs = Math.abs(seconds)
  return `${seconds < 0 ? '-' : ''}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/** Where the game stands in its fixed-length slots. */
export interface SlotTiming {
  /** 0-based slot; equals the number of slots once they are all over. */
  slot: number
  /** Whole seconds left in the current slot. */
  secondsLeft: number
}

/**
 * Current slot of the rotation, derived from the start time like the clock (never counted in memory).
 * @param startedAt Start timestamp in ms (« Commencer »).
 * @param now Current timestamp in ms; a time before the start counts as the start.
 * @param slotMinutes Length of one slot.
 * @returns The slot and the seconds left in it; the first second of a slot shows the full "15:00".
 * @example slotTiming(0, 16 * 60_000, 15) // { slot: 1, secondsLeft: 840 }
 */
export function slotTiming(startedAt: number, now: number, slotMinutes: number): SlotTiming {
  const slotMs = slotMinutes * 60_000
  const elapsed = Math.max(0, now - startedAt)
  return { slot: Math.floor(elapsed / slotMs), secondsLeft: slotMinutes * 60 - Math.floor((elapsed % slotMs) / 1000) }
}

/**
 * Seconds before the hint button unlocks in the current slot.
 * @param slotSecondsLeft Seconds left in the slot (`slotTiming(...).secondsLeft`).
 * @param slotMinutes Length of one slot.
 * @param hintAfterMinutes `indice_apres_minutes`.
 * @returns Seconds to wait, 0 once the hint is available.
 * @example secondsBeforeHint(900, 15, 10) // 600: first second of the slot
 */
export function secondsBeforeHint(slotSecondsLeft: number, slotMinutes: number, hintAfterMinutes: number): number {
  return Math.max(0, hintAfterMinutes * 60 - (slotMinutes * 60 - slotSecondsLeft))
}
