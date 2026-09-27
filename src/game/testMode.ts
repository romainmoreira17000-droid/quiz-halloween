/** @file Test mode switch: `?test` in the address, so children cannot turn it on by tapping around. */

/**
 * Whether the app was opened in test mode.
 * @param search Query string of the address (`window.location.search`).
 * @returns True when it has a `test` parameter, with or without a value.
 */
export function isTestMode(search: string): boolean {
  return new URLSearchParams(search).has('test')
}
