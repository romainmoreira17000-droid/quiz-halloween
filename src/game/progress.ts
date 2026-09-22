/** @file Game state machine: home → entrance (optional) → playing (step by step) → padlock → won. Pure, so it can be saved and restored. */
import type { ExpectedAnswer, QuizStep } from '../config/types'
import { isRightAnswer } from './answer'
import { isPadlockCode } from './padlock'

/** Which part of the game is shown. */
export type GameStatus = 'home' | 'entrance' | 'playing' | 'padlock' | 'won'

/** Whole game progress. */
export interface GameState {
  status: GameStatus
  /** 0-based index of the current step. */
  stepIndex: number
  /** Digits earned on solved steps, in step order. */
  foundDigits: number[]
  /** Start timestamp in ms, null until the group is in the room. */
  startedAt: number | null
  /** Timestamp in ms when the padlock opened (freezes the clock), null before. */
  finishedAt: number | null
  /** Wrong tries on the current step, or wrong codes on the padlock (drives the message and the shake). */
  wrongAttempts: number
}

/** Player actions. `now` is passed in so the reducer stays pure. */
export type GameAction =
  | { type: 'start'; now: number } | { type: 'enter'; text: string; now: number }
  | { type: 'answer'; text: string } | { type: 'next' }
  | { type: 'unlock'; code: number[]; now: number } | { type: 'reset' }

/** State before the game starts. */
export const initialGameState: GameState = {
  status: 'home', stepIndex: 0, foundDigits: [], startedAt: null, finishedAt: null, wrongAttempts: 0,
}

/**
 * Tells whether the current step already has its digit.
 * @param state Game state.
 * @returns True once the current step's answer was found.
 */
export function isCurrentStepSolved(state: GameState): boolean {
  return state.foundDigits.length > state.stepIndex
}

/**
 * Builds the reducer for a given quiz. Invalid actions return the same state object.
 * @param steps Steps of the quiz, in play order.
 * @param code Code that opens the padlock (see padlockCode).
 * @param entranceAnswer Answer of the entrance message, if the quiz has one.
 * @returns A reducer usable with useReducer.
 */
export function createGameReducer(steps: readonly QuizStep[], code: readonly number[], entranceAnswer?: ExpectedAnswer) {
  return (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'start':
        if (state.status !== 'home') return state
        // With an entrance message the clock waits until the group is in the room.
        return entranceAnswer ? { ...state, status: 'entrance' } : { ...state, status: 'playing', startedAt: action.now }
      case 'enter':
        if (state.status !== 'entrance' || !entranceAnswer) return state
        return isRightAnswer(action.text, entranceAnswer)
          ? { ...state, status: 'playing', startedAt: action.now, wrongAttempts: 0 }
          : { ...state, wrongAttempts: state.wrongAttempts + 1 }
      case 'answer': {
        if (state.status !== 'playing' || isCurrentStepSolved(state)) return state
        const step = steps[state.stepIndex]
        return isRightAnswer(action.text, step.answer)
          ? { ...state, foundDigits: [...state.foundDigits, step.digit], wrongAttempts: 0 }
          : { ...state, wrongAttempts: state.wrongAttempts + 1 }
      }
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
      case 'reset':
        return initialGameState
    }
  }
}
