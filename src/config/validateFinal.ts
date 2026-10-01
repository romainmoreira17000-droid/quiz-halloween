/** @file Validates the `finale` flag of the steps: at most one final challenge, played by every team together. */
import { isObject } from './checks'

/** @returns « 1, 3 et 4 » for [1, 3, 4]. */
function frenchList(numbers: number[]): string {
  return `${numbers.slice(0, -1).join(', ')} et ${numbers[numbers.length - 1]}`
}

/**
 * Finds the final challenge, pushing French messages into `errors`.
 * @param rawSteps Value of `etapes` (a wrong shape is reported by validateQuiz, not here).
 * @param errors Accumulator shared with the other validators.
 * @returns 0-based final step, or undefined when there is none or several.
 */
export function validateFinal(rawSteps: unknown, errors: string[]): number | undefined {
  if (!Array.isArray(rawSteps)) return undefined
  const finals: number[] = []
  rawSteps.forEach((raw, i) => {
    if (!isObject(raw) || raw.finale === undefined) return
    if (typeof raw.finale !== 'boolean') errors.push(`étape ${i + 1} : « finale » doit valoir true ou false.`)
    // Its hints, if any, unlock like the other challenges': at the same minutes, on every tablet at once.
    if (raw.finale === true) finals.push(i)
  })
  if (finals.length > 1) {
    errors.push(`« finale » : une seule étape peut être la finale (étapes ${frenchList(finals.map((i) => i + 1))}).`)
    return undefined
  }
  return finals[0]
}
