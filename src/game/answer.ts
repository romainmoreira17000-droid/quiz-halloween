/** @file Answer check for one step. */
import type { QuizStep } from '../config/types'

/**
 * Tells whether a keypad digit solves a step.
 * @param step The current step.
 * @param digit Digit pressed (0–9).
 * @returns True when the digit is the step's solution.
 */
export function isCorrectAnswer(step: QuizStep, digit: number): boolean {
  return step.solution === digit
}
