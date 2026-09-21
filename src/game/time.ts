/**
 * @file Countdown and duration arithmetic, always derived from timestamps so sleep/reload stays exact.
 */

const pad = (n: number) => String(n).padStart(2, '0')

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
  return `${seconds < 0 ? '-' : ''}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/**
 * Time the group took, frozen when the padlock opened.
 * @param startedAt Start timestamp in ms.
 * @param finishedAt Timestamp in ms when the right code was entered.
 * @returns Whole seconds, rounded down like the clock.
 */
export function elapsedSeconds(startedAt: number, finishedAt: number): number {
  return Math.floor((finishedAt - startedAt) / 1000)
}

/**
 * Formats a duration for the victory screen.
 * @param seconds Whole seconds (≥ 0).
 * @returns For example "42 min 15 s", or "1 h 05 min 03 s" past one hour.
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = `min ${pad(seconds % 60)} s`
  return hours > 0 ? `${hours} h ${pad(minutes)} ${rest}` : `${minutes} ${rest}`
}
