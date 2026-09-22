/** @file Answer checks: normalizing what children type and comparing it with the expected answer. */
import type { AnswerKind, ExpectedAnswer } from '../config/types'

/** Longest answer the children can type, per keyboard. */
export const MAX_ANSWER_LENGTH: Readonly<Record<AnswerKind, number>> = { digits: 12, letters: 24 }

/**
 * Puts an answer in the form used for comparison.
 * Letters: capitals, no accents, plain apostrophes, trimmed, one space between words — children
 * should never fail on a missing accent. Digits: trimmed only, leading zeros count.
 * @param text Typed or configured answer.
 * @param kind Keyboard of the answer.
 * @returns The normalized answer.
 */
export function normalizeAnswer(text: string, kind: AnswerKind): string {
  if (kind === 'digits') return text.trim()
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[’‘]/g, "'")
    .toUpperCase().trim().replace(/\s+/g, ' ')
}

/**
 * @param typed What the children typed.
 * @param expected Answer from quiz.yaml.
 * @returns True when both match after normalization (an empty answer never matches).
 */
export function isRightAnswer(typed: string, expected: ExpectedAnswer): boolean {
  const normalized = normalizeAnswer(typed, expected.kind)
  return normalized.length > 0 && normalized === normalizeAnswer(expected.value, expected.kind)
}

/**
 * Adds one key press to the typed answer.
 * @param current Answer typed so far.
 * @param char Pressed character (a digit, a letter, "'", "-" or " ").
 * @param kind Keyboard in use.
 * @returns The new answer; unchanged when full, or for a leading or doubled space.
 */
export function appendToAnswer(current: string, char: string, kind: AnswerKind): string {
  if (current.length >= MAX_ANSWER_LENGTH[kind]) return current
  if (char === ' ' && (current === '' || current.endsWith(' '))) return current
  return current + char
}
