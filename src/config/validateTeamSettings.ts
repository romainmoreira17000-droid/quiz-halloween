/** @file Validates the game settings of the escape game: team names, slot length, hint delay, block time and animator code. */
import { isIntInRange, isNonEmptyString, type RawObject } from './checks'

/** Team settings, once validated. */
export interface TeamSettings { teams: string[]; slotMinutes: number; hintAfterMinutes: number; blockSeconds: number; animatorCode: string }

// Digits only, kept as text: a leading zero is part of the code.
const ANIMATOR_CODE = /^\d{4,8}$/

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
  if (!isIntInRange(raw.indice_apres_minutes, 0, Number.MAX_SAFE_INTEGER)) {
    errors.push('« indice_apres_minutes » doit être un nombre entier supérieur ou égal à 0.')
  } else if (slotOk && raw.indice_apres_minutes >= (raw.duree_epreuve_minutes as number)) {
    // The slot clock restarts at every change of room: a later hint would never show.
    errors.push(`« indice_apres_minutes » (${raw.indice_apres_minutes}) doit être plus petit que « duree_epreuve_minutes » (${raw.duree_epreuve_minutes as number}) : sinon l'indice n'arrive jamais.`)
  }
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
  if (errors.length > before) return null
  return {
    teams: (raw.equipes as string[]).map((name) => name.trim()),
    slotMinutes: raw.duree_epreuve_minutes as number,
    hintAfterMinutes: raw.indice_apres_minutes as number,
    blockSeconds: raw.blocage_secondes as number,
    animatorCode: raw.code_animateur as string,
  }
}
