/** @file Validates one quiz step (a real-life challenge) from the YAML and maps it to a QuizStep. */
import { isIntInRange, isNonEmptyString, isObject, unknownKeyErrors } from './checks'
import type { QuizStep } from './types'
import { validateAnswer } from './validateAnswer'

const STEP_KEYS = ['titre', 'consigne', 'image', 'type_reponse', 'reponse', 'chiffre'] as const

/**
 * Validates a raw step, pushing French messages into `errors`.
 * @param raw Value found in the YAML `etapes` list.
 * @param stepNumber 1-based position, used in messages.
 * @param errors Accumulator shared with the other validators.
 * @returns The typed step, or null if it has at least one error.
 */
export function validateStep(raw: unknown, stepNumber: number, errors: string[]): QuizStep | null {
  const prefix = `étape ${stepNumber} : `
  if (!isObject(raw)) {
    errors.push(`${prefix}doit contenir « titre », « consigne », « type_reponse », « reponse » et « chiffre ».`)
    return null
  }
  const before = errors.length
  if (!isNonEmptyString(raw.titre)) errors.push(`${prefix}« titre » est obligatoire et doit être un texte non vide.`)
  if (!isNonEmptyString(raw.consigne)) errors.push(`${prefix}« consigne » est obligatoire et doit être un texte non vide.`)
  const answer = validateAnswer(raw, prefix, errors)
  if (!isIntInRange(raw.chiffre, 0, 9)) errors.push(`${prefix}« chiffre » doit être un chiffre entier entre 0 et 9.`)
  if (raw.image !== undefined && !isNonEmptyString(raw.image)) errors.push(`${prefix}« image » doit être un nom de fichier.`)
  // Quizzes written before sprint 7 use `solution`: explain the new keys instead of "unknown key".
  if (raw.solution !== undefined) {
    errors.push(`${prefix}« solution » a été remplacée par « reponse » (ce que tapent les enfants) et « chiffre » (le chiffre gagné).`)
  }
  errors.push(...unknownKeyErrors(raw, [...STEP_KEYS, 'solution'], prefix))
  if (errors.length > before || answer === null) return null
  return {
    title: raw.titre as string,
    instruction: raw.consigne as string,
    ...(raw.image !== undefined && { image: raw.image as string }),
    answer,
    digit: raw.chiffre as number,
  }
}
