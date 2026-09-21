/** @file Validates the optional `cadenas` section (order, hint, title, victory message) and fills in the default order. */
import { isIntInRange, isNonEmptyString, isObject, unknownKeyErrors } from './checks'
import type { PadlockConfig } from './types'

const PADLOCK_KEYS = ['ordre', 'indice', 'titre', 'message_victoire'] as const

/** @returns [1, 2, ..., stepCount]. */
function defaultOrder(stepCount: number): number[] {
  return Array.from({ length: stepCount }, (_, i) => i + 1)
}

/** @returns true if order holds each integer 1..stepCount exactly once. */
function isPermutation(order: unknown, stepCount: number): order is number[] {
  if (!Array.isArray(order) || order.length !== stepCount) return false
  if (!order.every((n) => isIntInRange(n, 1, stepCount))) return false
  return new Set(order).size === stepCount
}

/**
 * Validates the padlock section, pushing French messages into `errors`.
 * @param raw Value of `cadenas` in the YAML (may be undefined).
 * @param stepCount Number of steps, the length the order must have.
 * @param errors Accumulator shared with the other validators.
 * @returns The padlock config (order defaults to step order), or null on error.
 */
export function validatePadlock(raw: unknown, stepCount: number, errors: string[]): PadlockConfig | null {
  if (raw === undefined) return { order: defaultOrder(stepCount) }
  if (!isObject(raw)) {
    errors.push('« cadenas » doit contenir des paramètres : « ordre », « indice », « titre » ou « message_victoire ».')
    return null
  }
  const before = errors.length
  const prefix = 'cadenas : '
  if (raw.ordre !== undefined && !isPermutation(raw.ordre, stepCount)) {
    errors.push(`${prefix}« ordre » doit contenir chaque numéro d'étape de 1 à ${stepCount}, une seule fois.`)
  }
  if (raw.indice !== undefined && typeof raw.indice !== 'string') errors.push(`${prefix}« indice » doit être un texte.`)
  for (const key of ['titre', 'message_victoire'] as const) {
    if (raw[key] !== undefined && !isNonEmptyString(raw[key])) errors.push(`${prefix}« ${key} » doit être un texte non vide.`)
  }
  errors.push(...unknownKeyErrors(raw, PADLOCK_KEYS, prefix))
  if (errors.length > before) return null
  return {
    order: (raw.ordre as number[] | undefined) ?? defaultOrder(stepCount),
    ...(raw.indice !== undefined && { hint: raw.indice as string }),
    ...(raw.titre !== undefined && { title: raw.titre as string }),
    ...(raw.message_victoire !== undefined && { victoryMessage: raw.message_victoire as string }),
  }
}
