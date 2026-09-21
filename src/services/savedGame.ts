/** @file Keeps the game progress in the tablet's localStorage, so a reload in the middle of a game loses nothing. */
import type { GameState } from '../game/progress'
import { restoreGameState } from '../game/restore'

/** localStorage key of the saved game. */
export const STORAGE_KEY = 'quiz-halloween:progress'

/** What is written: the state, tagged with the quiz it belongs to. */
interface SavedGame { fingerprint: string; state: GameState }

// Every access is wrapped: private browsing or a full storage must never break the game,
// it only loses the resume after a reload.

/**
 * Reads the saved game of this quiz.
 * @param fingerprint Fingerprint of the current quiz (see quizFingerprint).
 * @param stepCount Number of steps of the current quiz.
 * @returns The state to resume, or null (nothing saved, other quiz, damaged save, storage refused).
 */
export function loadGame(fingerprint: string, stepCount: number): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const saved: unknown = JSON.parse(raw)
    if (typeof saved !== 'object' || saved === null) return null
    const { fingerprint: savedFor, state } = saved as Record<string, unknown>
    return savedFor === fingerprint ? restoreGameState(state, stepCount) : null
  } catch {
    return null
  }
}

/**
 * Saves the game of this quiz.
 * @param fingerprint Fingerprint of the current quiz.
 * @param state State to save.
 */
export function saveGame(fingerprint: string, state: GameState): void {
  const saved: SavedGame = { fingerprint, state }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)) } catch { /* see above */ }
}

/** Deletes the saved game. */
export function clearGame(): void {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* see above */ }
}
