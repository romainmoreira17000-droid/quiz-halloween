/** @file Animator board switch: `?animateur` in the address, so the tablets never show it by accident. */

/**
 * Whether the app was opened as the animator board.
 * @param search Query string of the address (`window.location.search`).
 * @returns True when it has an `animateur` parameter, with or without a value.
 */
export function isBoardMode(search: string): boolean {
  return new URLSearchParams(search).has('animateur')
}
