/** @file Validates the answer of a step or of the entrance (`type_reponse` + `reponse`). */
import { MAX_ANSWER_LENGTH, normalizeAnswer } from '../game/answer'
import { isNonEmptyString, type RawObject } from './checks'
import type { AnswerKind, ExpectedAnswer } from './types'

// A Map, not an object literal: `type_reponse: toString` must not find an inherited key.
const KINDS = new Map<unknown, AnswerKind>([['chiffres', 'digits'], ['mots', 'letters']])

/** @returns The configured answer as text: YAML reads `reponse: 1832` as a number. */
function answerText(value: unknown): string | null {
  // Any number becomes text; a negative or decimal one then fails the digits check with a clear message.
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return isNonEmptyString(value) ? value.trim() : null
}

/** @returns The French error for a value the chosen keyboard cannot type, or null. */
function typingError(value: string, kind: AnswerKind): string | null {
  if (kind === 'digits') {
    return new RegExp(`^\\d{1,${MAX_ANSWER_LENGTH.digits}}$`).test(value)
      ? null : `« reponse » doit contenir uniquement des chiffres (${MAX_ANSWER_LENGTH.digits} au plus).`
  }
  const normalized = normalizeAnswer(value, 'letters')
  if (!/^[A-Z' -]+$/.test(normalized)) {
    return '« reponse » ne peut contenir que des lettres, des espaces, des apostrophes ou des tirets.'
  }
  return normalized.length > MAX_ANSWER_LENGTH.letters
    ? `« reponse » doit faire ${MAX_ANSWER_LENGTH.letters} caractères au plus.` : null
}

/**
 * Validates `type_reponse` and `reponse`, pushing French messages into `errors`.
 * @param raw Mapping of a step or of the entrance.
 * @param prefix Location prefix (e.g. "étape 2 : ").
 * @param errors Accumulator shared with the other validators.
 * @returns The expected answer, or null if it has at least one error.
 */
export function validateAnswer(raw: RawObject, prefix: string, errors: string[]): ExpectedAnswer | null {
  const kind = KINDS.get(raw.type_reponse)
  if (!kind) errors.push(`${prefix}« type_reponse » doit valoir « chiffres » ou « mots ».`)
  const value = answerText(raw.reponse)
  if (value === null) {
    errors.push(`${prefix}« reponse » est obligatoire et doit être un texte non vide.`)
    return null
  }
  if (!kind) return null
  const error = typingError(value, kind)
  if (error) {
    errors.push(prefix + error)
    return null
  }
  return { kind, value }
}
