/** @file Remembers the evening code of the remote board on this device, under its own key so a game reset keeps it. */

/** localStorage key of the evening code. */
export const EVENING_CODE_KEY = 'quiz-halloween:evening-code'

// Every access is wrapped, like savedTeam: a refused storage only means typing the code again.

/**
 * Reads the evening code of this device.
 * @returns The code, or null (none saved, storage refused).
 */
export function loadEveningCode(): string | null {
  try {
    return localStorage.getItem(EVENING_CODE_KEY) || null
  } catch {
    return null
  }
}

/**
 * Saves the evening code, without the spaces a phone keyboard adds; an empty code turns the remote board off.
 * @param code Code as typed.
 */
export function saveEveningCode(code: string): void {
  const trimmed = code.trim()
  try {
    if (trimmed === '') localStorage.removeItem(EVENING_CODE_KEY)
    else localStorage.setItem(EVENING_CODE_KEY, trimmed)
  } catch { /* see above */ }
}
