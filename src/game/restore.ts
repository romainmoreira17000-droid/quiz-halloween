/** @file Checks a game state read back from storage, so a damaged or tampered save can never break the game. */
import { initialGameState, type GameState } from './progress'

const RESUMABLE: readonly string[] = ['entrance', 'playing', 'won']

const isTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isDigit = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9

/**
 * Turns a value read from storage back into a game state, if it is a coherent one.
 * @param value Parsed JSON (anything).
 * @param stepCount Number of challenges of the current quiz.
 * @returns The state (wrong tries cleared), or null when there is nothing usable to resume.
 */
export function restoreGameState(value: unknown, stepCount: number): GameState | null {
  if (typeof value !== 'object' || value === null) return null
  const { status, digits, startedAt, finishedAt } = value as Record<string, unknown>
  if (typeof status !== 'string' || !RESUMABLE.includes(status)) return null
  if (!Array.isArray(digits) || digits.length !== stepCount || !digits.every((d) => d === null || isDigit(d))) return null
  const known = digits as (number | null)[]
  const fresh = { ...initialGameState(stepCount), digits: known }
  // The entrance comes before any progress: nothing else may be set.
  if (status === 'entrance') {
    return known.every((d) => d === null) && startedAt === null && finishedAt === null ? { ...fresh, status: 'entrance' } : null
  }
  if (!isTime(startedAt)) return null
  if (status === 'playing') return finishedAt === null ? { ...fresh, status: 'playing', startedAt } : null
  return isTime(finishedAt) && known.every(isDigit) ? { ...fresh, status: 'won', startedAt, finishedAt } : null
}
