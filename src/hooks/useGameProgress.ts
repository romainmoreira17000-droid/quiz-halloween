/** @file Game progress of the tablet's team, saved in localStorage so a reload loses nothing. */
import { useEffect, useMemo, useReducer } from 'react'
import type { QuizConfig } from '../config/types'
import { quizFingerprint } from '../game/fingerprint'
import { isPadlockCode, padlockCode } from '../game/padlock'
import { gamePhase } from '../game/phase'
import { createGameReducer, earnsDigit, initialGameState, type GameState } from '../game/progress'
import { clearGame, loadGame, saveGame } from '../services/savedGame'

/** Game state and the actions the screens can trigger. */
export interface GameProgress {
  state: GameState
  /** Leaves the home screen: to the entrance message, or straight into the first slot. */
  start(): void
  /** Submits the answer of the entrance message; the right one starts the clock. */
  enter(text: string): void
  /** Submits the answer typed for `challenge` (the one on screen); true when it earns the digit, so the caller plays the clack inside the tap. */
  answer(challenge: number, text: string): boolean
  /** Records the digit of a missed challenge, once an animator typed the code. */
  giveDigit(challenge: number, code: string): void
  /** Tries a padlock code; true when it opens (the caller plays the sound inside the tap). */
  unlock(code: number[]): boolean
  /** Goes back to the home screen (same team) and deletes the saved game. */
  reset(): void
}

/**
 * Holds the progress of one team's game, resumed from and saved to localStorage.
 * @param config Validated quiz.
 * @param teamIndex 0-based team of the tablet.
 * @returns The state and its actions.
 */
export function useGameProgress(config: QuizConfig, teamIndex: number): GameProgress {
  const fingerprint = useMemo(() => quizFingerprint(config), [config])
  const code = useMemo(() => padlockCode(config.steps, config.padlock.order), [config])
  const reducer = useMemo(() => createGameReducer(config, teamIndex), [config, teamIndex])
  const [state, dispatch] = useReducer(reducer, null, () => {
    const loaded = loadGame(fingerprint, config.stepCount)
    // A quiz edited to remove its entrance must not resume stuck on 'entrance': the reducer no
    // longer has an action that leaves that status, so « Commencer » would silently do nothing.
    if (loaded?.status === 'entrance' && !config.entrance) return initialGameState(config.stepCount)
    return loaded ?? initialGameState(config.stepCount)
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
    answer: (challenge, text) => {
      const action = { type: 'answer', challenge, text, now: Date.now() } as const
      dispatch(action)
      return earnsDigit(state, config, teamIndex, action)
    },
    giveDigit: (challenge, animatorCode) => dispatch({ type: 'giveDigit', challenge, code: animatorCode, now: Date.now() }),
    unlock: (entered) => {
      const now = Date.now()
      dispatch({ type: 'unlock', code: entered, now })
      // Same checks as the reducer: the caller needs the answer now, inside the tap.
      return gamePhase(state, config, teamIndex, now).kind === 'padlock' && isPadlockCode(code, entered)
    },
    reset: () => dispatch({ type: 'reset' }),
  }
}
