/** @file In-memory game progress (sprint 6 will save it to the tablet's localStorage). */
import { useMemo, useReducer } from 'react'
import type { QuizStep } from '../config/types'
import { createGameReducer, initialGameState, type GameState } from '../game/progress'

/** Game state and the actions the screens can trigger. */
export interface GameProgress {
  state: GameState
  /** Starts the game and the countdown now. */
  start(): void
  /** Submits a keypad digit for the current step. */
  answer(digit: number): void
  /** Goes to the next step (or to the end) once the current one is solved. */
  next(): void
}

/**
 * Holds the progress of one game.
 * @param steps Steps of the quiz, in play order.
 * @returns The state and its actions.
 */
export function useGameProgress(steps: readonly QuizStep[]): GameProgress {
  const reducer = useMemo(() => createGameReducer(steps), [steps])
  const [state, dispatch] = useReducer(reducer, initialGameState)
  return {
    state,
    start: () => dispatch({ type: 'start', now: Date.now() }),
    answer: (digit) => dispatch({ type: 'answer', digit }),
    next: () => dispatch({ type: 'next' }),
  }
}
