/** @file Checks a game state read back from storage, so a damaged or tampered save can never break the game. */
import { initialGameState, type GameState } from './progress'

const RESUMABLE: readonly string[] = ['entrance', 'playing', 'won']

const isTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
// A slot number or a hint count: a whole number, 0 or more.
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0
const isDigit = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9

/**
 * Turns a value read from storage back into a game state, if it is a coherent one.
 * @param value Parsed JSON (anything).
 * @param stepCount Number of challenges of the current quiz.
 * @returns The state (wrong tries cleared, block kept), or null when there is nothing usable to resume.
 */
export function restoreGameState(value: unknown, stepCount: number): GameState | null {
  if (typeof value !== 'object' || value === null) return null
  const { status, digits, startedAt, finishedAt, blockedUntil, hintSlot = null } = value as Record<string, unknown>
  if (typeof status !== 'string' || !RESUMABLE.includes(status)) return null
  // A save without the field comes from an older game format: nothing to resume.
  if (blockedUntil !== null && !isTime(blockedUntil)) return null
  // Missing is fine (saved before the animator menu): games under way on the evening must survive the update.
  if (hintSlot !== null && !isCount(hintSlot)) return null
  const { hintCount = hintSlot !== null ? 1 : 0 } = value as Record<string, unknown>
  // Missing too before sprint 14: an animator could then show the single hint, so a set slot means one hint.
  if (!isCount(hintCount)) return null
  if (!Array.isArray(digits) || digits.length !== stepCount || !digits.every((d) => d === null || isDigit(d))) return null
  const known = digits as (number | null)[]
  const fresh = { ...initialGameState(stepCount), digits: known }
  // The entrance comes before any progress: nothing else may be set.
  if (status === 'entrance') {
    return known.every((d) => d === null) && startedAt === null && finishedAt === null ? { ...fresh, status: 'entrance' } : null
  }
  if (!isTime(startedAt)) return null
  if (status === 'playing') return finishedAt === null ? { ...fresh, status: 'playing', startedAt, blockedUntil, hintSlot, hintCount: hintSlot === null ? 0 : hintCount } : null
  return isTime(finishedAt) && known.every(isDigit) ? { ...fresh, status: 'won', startedAt, finishedAt } : null
}
