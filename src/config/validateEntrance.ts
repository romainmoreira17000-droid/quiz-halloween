/** @file Validates the optional `entree` section: the message read before entering the restaurant. */
import { isNonEmptyString, isObject, unknownKeyErrors } from './checks'
import type { EntranceConfig } from './types'
import { validateAnswer } from './validateAnswer'

const ENTRANCE_KEYS = ['titre', 'message', 'type_reponse', 'reponse'] as const
const PREFIX = 'entrée : '

/**
 * Validates the entrance section, pushing French messages into `errors`.
 * @param raw Value of `entree` in the YAML (undefined when absent).
 * @param errors Accumulator shared with the other validators.
 * @returns The entrance; undefined when the section is absent; null when it has an error.
 */
export function validateEntrance(raw: unknown, errors: string[]): EntranceConfig | null | undefined {
  if (raw === undefined) return undefined
  if (!isObject(raw)) {
    errors.push(`${PREFIX}doit contenir « message », « type_reponse » et « reponse ».`)
    return null
  }
  const before = errors.length
  if (raw.titre !== undefined && !isNonEmptyString(raw.titre)) errors.push(`${PREFIX}« titre » doit être un texte non vide.`)
  if (!isNonEmptyString(raw.message)) errors.push(`${PREFIX}« message » est obligatoire et doit être un texte non vide.`)
  const answer = validateAnswer(raw, PREFIX, errors)
  errors.push(...unknownKeyErrors(raw, ENTRANCE_KEYS, PREFIX))
  if (errors.length > before || answer === null) return null
  return {
    ...(raw.titre !== undefined && { title: raw.titre as string }),
    message: raw.message as string,
    answer,
  }
}
