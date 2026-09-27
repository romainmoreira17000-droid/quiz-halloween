/** @file Start time of the game as a time of day, for the animator who lines a tablet up with the others. */

const pad = (n: number) => String(n).padStart(2, '0')
/** How far back a time read as yesterday may be: a game night, not a whole day. */
const MAX_YESTERDAY_MS = 12 * 60 * 60_000

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
 * @returns The start timestamp (today, or yesterday up to 12 hours back), or null when the text is not a time
 *   or the time is still to come (a game cannot start in the future: its clock would count up from before « Commencer »).
 */
export function startAtTimeOfDay(text: string, now: number): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(text)
  if (!match) return null
  const [hours, minutes] = [Number(match[1]), Number(match[2])]
  if (hours > 23 || minutes > 59) return null
  const start = new Date(now)
  start.setHours(hours, minutes, 0, 0)
  if (start.getTime() <= now) return start.getTime()
  // A later time is yesterday's when the evening went past midnight (23:50 typed at 00:10); further back
  // than that, it is a typo (21:00 typed at 20:00 would put the start 23 hours ago).
  start.setDate(start.getDate() - 1)
  return now - start.getTime() <= MAX_YESTERDAY_MS ? start.getTime() : null
}
