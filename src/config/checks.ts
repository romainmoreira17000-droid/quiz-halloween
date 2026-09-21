/** @file Primitive type guards shared by the quiz validators. */

/** Generic YAML mapping. */
export type RawObject = Record<string, unknown>

/** @returns true if value is a plain (non-array, non-null) object. */
export function isObject(value: unknown): value is RawObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @returns true if value is a string with at least one non-blank character. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** @returns true if value is an integer between min and max (inclusive). */
export function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

/**
 * Lists keys not in `allowed` — usually a typo such as `solutions` for `solution`.
 * @param obj Mapping to inspect.
 * @param allowed Keys the mapping may contain.
 * @param prefix Location prefix prepended to each message (e.g. "étape 2 : ").
 * @returns One French message per unknown key.
 */
export function unknownKeyErrors(obj: RawObject, allowed: readonly string[], prefix: string): string[] {
  return Object.keys(obj)
    .filter((key) => !allowed.includes(key))
    .map((key) => `${prefix}« ${key} » n'est pas un paramètre connu.`)
}
