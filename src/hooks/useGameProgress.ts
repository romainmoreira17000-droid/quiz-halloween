/** @file In-memory game progress (sprint 6 will save it to the tablet's localStorage). */
import { useMemo, useReducer } from 'react'
import type { QuizStep } from '../config/types'
import { isPadlockCode, padlockCode } from '../game/padlock'
import { createGameReducer, initialGameState, type GameState } from '../game/progress'

/** Game state and the actions the screens can trigger. */
export interface GameProgress {
  state: GameState
  /** Starts the game and the countdown now. */
  start(): void
  /** Submits a keypad digit for the current step. */
  answer(digit: number): void
  /** Goes to the next step (or to the padlock) once the current one is solved. */
  next(): void
  /** Tries a padlock code; returns true when it opens (so the caller can play the sound in the tap handler). */
  unlock(code: number[]): boolean
}

/**
 * Holds the progress of one game.
 * @param steps Steps of the quiz, in play order.
 * @param order Padlock order (1-based step numbers).
 * @returns The state and its actions.
 */
export function useGameProgress(steps: readonly QuizStep[], order: readonly number[]): GameProgress {
  const code = useMemo(() => padlockCode(steps, order), [steps, order])
  const reducer = useMemo(() => createGameReducer(steps, code), [steps, code])
  const [state, dispatch] = useReducer(reducer, initialGameState)
  return {
    state,
    start: () => dispatch({ type: 'start', now: Date.now() }),
    answer: (digit) => dispatch({ type: 'answer', digit }),
    next: () => dispatch({ type: 'next' }),
    unlock: (entered) => {
      dispatch({ type: 'unlock', code: entered, now: Date.now() })
      // Same check as the reducer (same helper, same code): the caller needs the answer now, inside the tap.
      return isPadlockCode(code, entered)
    },
  }
}
