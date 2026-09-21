/** @file Validates the whole quiz document and builds the typed QuizConfig. */
import { isIntInRange, isNonEmptyString, isObject, unknownKeyErrors } from './checks'
import { validatePadlock } from './validatePadlock'
import { validateStep } from './validateStep'
import type { QuizStep, ValidationResult } from './types'

const ROOT_KEYS = ['titre', 'intro', 'duree_minutes', 'nombre_etapes', 'etapes', 'cadenas'] as const

/**
 * Validates a parsed YAML document against every rule of the spec.
 * Never stops at the first problem so the animator can fix everything in one go.
 * @param raw Parsed YAML (any shape).
 * @returns The typed config, or the full list of French error messages.
 */
export function validateQuiz(raw: unknown): ValidationResult {
  if (!isObject(raw)) return { ok: false, errors: ['Le fichier doit contenir des paramètres sous la forme « clé: valeur ».'] }
  const errors: string[] = []
  if (!isNonEmptyString(raw.titre)) errors.push('« titre » est obligatoire et doit être un texte non vide.')
  if (raw.intro !== undefined && typeof raw.intro !== 'string') errors.push('« intro » doit être un texte.')
  if (!isIntInRange(raw.duree_minutes, 1, Number.MAX_SAFE_INTEGER)) {
    errors.push('« duree_minutes » doit être un nombre entier supérieur à 0.')
  }
  const countOk = isIntInRange(raw.nombre_etapes, 1, Number.MAX_SAFE_INTEGER)
  if (!countOk) errors.push('« nombre_etapes » doit être un nombre entier supérieur ou égal à 1.')

  const steps: (QuizStep | null)[] = []
  if (!Array.isArray(raw.etapes)) {
    errors.push('« etapes » est obligatoire et doit être une liste.')
  } else {
    if (countOk && raw.etapes.length !== raw.nombre_etapes) {
      errors.push(`« etapes » contient ${raw.etapes.length} étape(s) alors que « nombre_etapes » vaut ${raw.nombre_etapes}.`)
    }
    raw.etapes.forEach((item, i) => steps.push(validateStep(item, i + 1, errors)))
  }
  // Without a valid count, the step list length is the best guess for the padlock check.
  const stepCount = countOk ? (raw.nombre_etapes as number) : steps.length
  const padlock = validatePadlock(raw.cadenas, stepCount, errors)
  errors.push(...unknownKeyErrors(raw, ROOT_KEYS, ''))

  if (errors.length > 0 || padlock === null) return { ok: false, errors }
  return { ok: true, config: {
    title: raw.titre as string,
    ...(raw.intro !== undefined && { intro: raw.intro as string }),
    durationMinutes: raw.duree_minutes as number,
    stepCount,
    steps: steps as QuizStep[],
    padlock,
  } }
}
