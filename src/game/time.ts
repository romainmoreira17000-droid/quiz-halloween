/** @file Countdown arithmetic, always derived from the start timestamp so sleep/reload stays exact. */

/**
 * Seconds left before the end of the game (negative once time is up).
 * @param startedAt Start timestamp in ms (Date.now()).
 * @param now Current timestamp in ms.
 * @param durationMinutes Game duration from quiz.yaml.
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
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${seconds < 0 ? '-' : ''}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}
