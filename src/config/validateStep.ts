/** @file Validates one quiz step from the YAML and maps it to a QuizStep. */
import { isIntInRange, isNonEmptyString, isObject, unknownKeyErrors } from './checks'
import type { QuizStep } from './types'

const STEP_KEYS = ['titre', 'consigne', 'image', 'solution'] as const

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
    errors.push(`${prefix}doit contenir « titre », « consigne » et « solution ».`)
    return null
  }
  const before = errors.length
  if (!isNonEmptyString(raw.titre)) errors.push(`${prefix}« titre » est obligatoire et doit être un texte non vide.`)
  if (!isNonEmptyString(raw.consigne)) errors.push(`${prefix}« consigne » est obligatoire et doit être un texte non vide.`)
  if (!isIntInRange(raw.solution, 0, 9)) errors.push(`${prefix}« solution » doit être un chiffre entier entre 0 et 9.`)
  if (raw.image !== undefined && !isNonEmptyString(raw.image)) errors.push(`${prefix}« image » doit être un nom de fichier.`)
  errors.push(...unknownKeyErrors(raw, STEP_KEYS, prefix))
  if (errors.length > before) return null
  return {
    title: raw.titre as string,
    instruction: raw.consigne as string,
    solution: raw.solution as number,
    ...(raw.image !== undefined && { image: raw.image as string }),
  }
}
