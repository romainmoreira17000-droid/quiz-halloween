/** @file Final padlock: expected code and dial arithmetic. */
import type { QuizStep } from '../config/types'

/**
 * Code that opens the padlock: the step digits taken in the configured order.
 * @param steps Steps of the quiz, in play order.
 * @param order 1-based step numbers (validated `cadenas.ordre`, default 1..N).
 * @returns One digit per dial.
 * @example padlockCode(steps, [3, 1, 2]) // [digit of step 3, of step 1, of step 2]
 */
export function padlockCode(steps: readonly QuizStep[], order: readonly number[]): number[] {
  return order.map((stepNumber) => steps[stepNumber - 1].digit)
}

/**
 * @param expected Code that opens the padlock.
 * @param entered Digits shown on the dials.
 * @returns true if both have the same digits in the same order.
 */
export function isPadlockCode(expected: readonly number[], entered: readonly number[]): boolean {
  return expected.length === entered.length && expected.every((digit, i) => digit === entered[i])
}

/**
 * Turns a dial one notch, like a real combination lock (9 goes round to 0 and back).
 * @param digit Current digit (0–9).
 * @param delta +1 for ▲, -1 for ▼.
 * @returns The new digit.
 */
export function turnDial(digit: number, delta: 1 | -1): number {
  return (digit + delta + 10) % 10
}

/** Angle between two neighbouring digits on a dial drum (10 faces). */
export const DRUM_STEP_DEG = 36

/**
 * Next angle of a dial drum, kept cumulative so that it always rolls the short way:
 * 9 → 0 keeps going forward instead of spinning back through every digit.
 * @param angle Current drum angle, in degrees (digit × 36 plus whole turns).
 * @param from Digit shown now (0–9).
 * @param to Digit to show (0–9).
 * @returns The new angle; forward on a tie (5 notches).
 * @example rollDrum(324, 9, 0) // 360
 */
export function rollDrum(angle: number, from: number, to: number): number {
  const forward = (((to - from) % 10) + 10) % 10
  const notches = forward > 5 ? forward - 10 : forward
  return angle + notches * DRUM_STEP_DEG
}
