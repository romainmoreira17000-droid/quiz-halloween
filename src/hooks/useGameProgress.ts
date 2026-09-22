/** @file Game progress, saved in the tablet's localStorage so a reload loses nothing. */
import { useEffect, useMemo, useReducer } from 'react'
import type { QuizConfig } from '../config/types'
import { quizFingerprint } from '../game/fingerprint'
import { isPadlockCode, padlockCode } from '../game/padlock'
import { createGameReducer, initialGameState, type GameState } from '../game/progress'
import { clearGame, loadGame, saveGame } from '../services/savedGame'

/** Game state and the actions the screens can trigger. */
export interface GameProgress {
  state: GameState
  /** Leaves the home screen: to the entrance message, or straight to step 1 with the clock. */
  start(): void
  /** Submits the answer of the entrance message; the right one starts the clock. */
  enter(text: string): void
  /** Submits the typed answer of the current step. */
  answer(text: string): void
  /** Goes to the next step (or to the padlock) once the current one is solved. */
  next(): void
  /** Tries a padlock code; returns true when it opens (so the caller can play the sound in the tap handler). */
  unlock(code: number[]): boolean
  /** Goes back to the home screen and deletes the saved game. */
  reset(): void
}

/**
 * Holds the progress of one game, resumed from and saved to localStorage.
 * @param config Validated quiz.
 * @returns The state and its actions.
 */
export function useGameProgress(config: QuizConfig): GameProgress {
  const { steps, stepCount } = config
  const fingerprint = useMemo(() => quizFingerprint(config), [config])
  const code = useMemo(() => padlockCode(steps, config.padlock.order), [steps, config.padlock.order])
  const reducer = useMemo(() => createGameReducer(steps, code, config.entrance?.answer), [steps, code, config.entrance])
  const [state, dispatch] = useReducer(reducer, null, () => {
    const loaded = loadGame(fingerprint, stepCount)
    // A quiz edited to remove its entrance must not resume stuck on 'entrance': the reducer no
    // longer has an action that leaves that status, so "Commencer" would silently do nothing.
    if (loaded?.status === 'entrance' && !config.entrance) return initialGameState
    return loaded ?? initialGameState
  })
  useEffect(() => {
    // Home means "no game": nothing worth keeping, and it is how reset deletes the save.
    if (state.status === 'home') clearGame()
    else saveGame(fingerprint, state)
  }, [fingerprint, state])
  return {
    state,
    start: () => dispatch({ type: 'start', now: Date.now() }),
    enter: (text) => dispatch({ type: 'enter', text, now: Date.now() }),
    answer: (text) => dispatch({ type: 'answer', text }),
    next: () => dispatch({ type: 'next' }),
    unlock: (entered) => {
      dispatch({ type: 'unlock', code: entered, now: Date.now() })
      // Same check as the reducer (same helper, same code): the caller needs the answer now, inside the tap.
      return isPadlockCode(code, entered)
    },
    reset: () => dispatch({ type: 'reset' }),
  }
}
