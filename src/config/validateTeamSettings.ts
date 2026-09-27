/** @file Validates the game settings of the escape game: team names, slot length, hint times, block time and animator code. */
import { isIntInRange, isNonEmptyString, type RawObject } from './checks'

/** Team settings, once validated. */
export interface TeamSettings { teams: string[]; slotMinutes: number; hintTimes: number[]; blockSeconds: number; animatorCode: string }

// Digits only, kept as text: a leading zero is part of the code.
const ANIMATOR_CODE = /^\d{4,8}$/

const HINT_EXAMPLE = '(exemple : [5, 8, 11])'

/**
 * @param raw Value of `indices_apres_minutes`.
 * @param slotMinutes Valid slot length, or null when it is wrong (the times are then not compared to it).
 * @returns French messages about the hint times: list shape first, then order, then the slot bound.
 */
function hintTimeErrors(raw: unknown, slotMinutes: number | null): string[] {
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every((m) => isIntInRange(m, 0, Number.MAX_SAFE_INTEGER))) {
    return [`« indices_apres_minutes » doit être une liste de nombres entiers, 0 ou plus ${HINT_EXAMPLE}.`]
  }
  const times = raw as number[]
  if (times.some((m, i) => i > 0 && m <= times[i - 1])) {
    return [`« indices_apres_minutes » : les minutes doivent aller en croissant, sans doublon ${HINT_EXAMPLE}.`]
  }
  // The slot clock restarts at every change of room: a later hint would never show.
  const late = slotMinutes === null ? undefined : times.find((m) => m >= slotMinutes)
  return late === undefined ? []
    : [`« indices_apres_minutes » : ${late} doit être plus petit que « duree_epreuve_minutes » (${slotMinutes}) : sinon l'indice n'arrive jamais.`]
}

/** @returns French messages about the `equipes` list. */
function teamErrors(raw: unknown, stepCount: number | null): string[] {
  if (!Array.isArray(raw)) return ['« equipes » est obligatoire et doit être une liste de noms.']
  const errors: string[] = []
  raw.forEach((name, i) => {
    if (!isNonEmptyString(name)) errors.push(`« equipes » : l'équipe n° ${i + 1} doit avoir un nom.`)
  })
  const names = raw.filter(isNonEmptyString).map((name) => name.trim())
  new Set(names.filter((name, i) => names.indexOf(name) !== i))
    .forEach((name) => errors.push(`« equipes » : « ${name} » apparaît plusieurs fois.`))
  // The rotation gives each team a different first challenge: with more teams than challenges two
  // teams would share a room, with fewer a room would stay empty every slot.
  if (stepCount !== null && raw.length !== stepCount) {
    errors.push(`« equipes » contient ${raw.length} équipe(s) alors que « nombre_etapes » vaut ${stepCount} : il faut une équipe par épreuve.`)
  }
  return errors
}

/**
 * Validates the game settings found at the root of the quiz, pushing French messages into `errors`.
 * @param raw Root mapping of the YAML.
 * @param stepCount Validated `nombre_etapes`, or null when it is invalid (the team count is then not checked).
 * @param errors Accumulator shared with the other validators.
 * @returns The settings (team names trimmed), or null if at least one is wrong.
 */
export function validateTeamSettings(raw: RawObject, stepCount: number | null, errors: string[]): TeamSettings | null {
  const before = errors.length
  errors.push(...teamErrors(raw.equipes, stepCount))
  const slotOk = isIntInRange(raw.duree_epreuve_minutes, 1, Number.MAX_SAFE_INTEGER)
  if (!slotOk) errors.push('« duree_epreuve_minutes » doit être un nombre entier supérieur à 0.')
  errors.push(...hintTimeErrors(raw.indices_apres_minutes, slotOk ? (raw.duree_epreuve_minutes as number) : null))
  if (!isIntInRange(raw.blocage_secondes, 0, Number.MAX_SAFE_INTEGER)) {
    errors.push('« blocage_secondes » doit être un nombre entier supérieur ou égal à 0 (0 = pas de blocage).')
  }
  if (typeof raw.code_animateur !== 'string' || !ANIMATOR_CODE.test(raw.code_animateur)) {
    errors.push('« code_animateur » doit contenir de 4 à 8 chiffres.')
  }
  // Quizzes written before sprint 9 have a total duration: explain the new key instead of "unknown key".
  if (raw.duree_minutes !== undefined) {
    errors.push("« duree_minutes » a été remplacée par « duree_epreuve_minutes » : la durée d'une épreuve, en minutes.")
  }
  // Quizzes written before sprint 14 have a single hint delay.
  if (raw.indice_apres_minutes !== undefined) {
    errors.push(`« indice_apres_minutes » a été remplacée par « indices_apres_minutes » : une liste de minutes, une par indice ${HINT_EXAMPLE}.`)
  }
  if (errors.length > before) return null
  return {
    teams: (raw.equipes as string[]).map((name) => name.trim()),
    slotMinutes: raw.duree_epreuve_minutes as number,
    hintTimes: raw.indices_apres_minutes as number[],
    blockSeconds: raw.blocage_secondes as number,
    animatorCode: raw.code_animateur as string,
  }
}
