/** @file Checks a game state read back from storage, so a damaged or tampered save can never break the game. */
import type { GameState, GameStatus } from './progress'

const RESUMABLE: readonly string[] = ['playing', 'padlock', 'won']

const isTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isDigit = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9

/**
 * Turns a value read from storage back into a game state, if it is a coherent one.
 * @param value Parsed JSON (anything).
 * @param stepCount Number of steps of the current quiz.
 * @returns The state (wrong tries reset to 0), or null when there is nothing usable to resume.
 */
export function restoreGameState(value: unknown, stepCount: number): GameState | null {
  if (typeof value !== 'object' || value === null) return null
  const { status, stepIndex, foundDigits, startedAt, finishedAt } = value as Record<string, unknown>
  if (typeof status !== 'string' || !RESUMABLE.includes(status)) return null
  if (typeof stepIndex !== 'number' || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= stepCount) return null
  if (!Array.isArray(foundDigits) || !foundDigits.every(isDigit) || !isTime(startedAt)) return null
  const digits = foundDigits.filter(isDigit)
  const allSolved = stepIndex === stepCount - 1 && digits.length === stepCount
  const coherent =
    status === 'playing' ? finishedAt === null && (digits.length === stepIndex || digits.length === stepIndex + 1)
    : status === 'padlock' ? finishedAt === null && allSolved
    : isTime(finishedAt) && allSolved
  if (!coherent) return null
  return {
    status: status as GameStatus, stepIndex, foundDigits: digits, startedAt,
    finishedAt: isTime(finishedAt) ? finishedAt : null, wrongAttempts: 0,
  }
}
