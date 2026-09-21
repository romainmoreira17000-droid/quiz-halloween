/** @file Game state machine: home → playing (step by step) → padlock → won. Pure, so sprint 6 can persist it. */
import type { QuizStep } from '../config/types'
import { isCorrectAnswer } from './answer'
import { isPadlockCode } from './padlock'

/** Which part of the game is shown. */
export type GameStatus = 'home' | 'playing' | 'padlock' | 'won'

/** Whole game progress. */
export interface GameState {
  status: GameStatus
  /** 0-based index of the current step. */
  stepIndex: number
  /** Digits of solved steps, in step order. */
  foundDigits: number[]
  /** Start timestamp in ms, null before "Commencer". */
  startedAt: number | null
  /** Timestamp in ms when the padlock opened (freezes the clock), null before. */
  finishedAt: number | null
  /** Wrong tries on the current step, or wrong codes on the padlock (drives the message and the shake). */
  wrongAttempts: number
}

/** Player actions. `now` is passed in so the reducer stays pure. */
export type GameAction =
  | { type: 'start'; now: number } | { type: 'answer'; digit: number } | { type: 'next' }
  | { type: 'unlock'; code: number[]; now: number }

/** State before the game starts. */
export const initialGameState: GameState = {
  status: 'home', stepIndex: 0, foundDigits: [], startedAt: null, finishedAt: null, wrongAttempts: 0,
}

/**
 * Tells whether the current step already has its digit.
 * @param state Game state.
 * @returns True once the right digit was pressed on the current step.
 */
export function isCurrentStepSolved(state: GameState): boolean {
  return state.foundDigits.length > state.stepIndex
}

/**
 * Builds the reducer for a given quiz. Invalid actions return the same state object.
 * @param steps Steps of the quiz, in play order.
 * @param code Code that opens the padlock (see padlockCode).
 * @returns A reducer usable with useReducer.
 */
export function createGameReducer(steps: readonly QuizStep[], code: readonly number[]) {
  return (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'start':
        return state.status === 'home' ? { ...state, status: 'playing', startedAt: action.now } : state
      case 'answer':
        if (state.status !== 'playing' || isCurrentStepSolved(state)) return state
        return isCorrectAnswer(steps[state.stepIndex], action.digit)
          ? { ...state, foundDigits: [...state.foundDigits, action.digit], wrongAttempts: 0 }
          : { ...state, wrongAttempts: state.wrongAttempts + 1 }
      case 'next':
        if (state.status !== 'playing' || !isCurrentStepSolved(state)) return state
        return state.stepIndex + 1 >= steps.length
          ? { ...state, status: 'padlock' }
          : { ...state, stepIndex: state.stepIndex + 1, wrongAttempts: 0 }
      case 'unlock':
        if (state.status !== 'padlock') return state
        return isPadlockCode(code, action.code)
          ? { ...state, status: 'won', finishedAt: action.now, wrongAttempts: 0 }
          : { ...state, wrongAttempts: state.wrongAttempts + 1 }
    }
  }
}
