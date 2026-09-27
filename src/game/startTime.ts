/** @file Start time of the game as a time of day, for the animator who lines a tablet up with the others. */

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Time of day of a timestamp, in the tablet's time zone.
 * @param timestamp Time in ms.
 * @returns "hh:mm", the format of `<input type="time">`.
 * @example timeOfDay(startedAt) // "20:02"
 */
export function timeOfDay(timestamp: number): string {
  const date = new Date(timestamp)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Timestamp of a time of day typed by an animator, today.
 * @param text "hh:mm", as given by `<input type="time">`.
 * @param now Current timestamp in ms.
 * @returns The start timestamp, or null when the text is not a time or the time is still to come
 *   (a game cannot start in the future: its clock would count up from before « Commencer »).
 */
export function startAtTimeOfDay(text: string, now: number): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(text)
  if (!match) return null
  const [hours, minutes] = [Number(match[1]), Number(match[2])]
  if (hours > 23 || minutes > 59) return null
  const start = new Date(now)
  start.setHours(hours, minutes, 0, 0)
  return start.getTime() <= now ? start.getTime() : null
}
