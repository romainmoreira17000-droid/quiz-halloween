/**
 * @file Game state machine of one team: home → entrance (optional) → playing → won. It records facts only
 * (answers, digits given by an animator, padlock opened); the clock decides the screen (see phase.ts).
 * Pure, so it can be saved and restored.
 */
import type { QuizConfig } from '../config/types'
import { isAnimatorCode, isRightAnswer } from './answer'
import { isPadlockCode, padlockCode } from './padlock'
import { gamePhase, type GameStatus } from './phase'

export type { GameStatus }

/** Whole game progress of the tablet's team. */
export interface GameState {
  status: GameStatus
  /** Digit per challenge (index = challenge number - 1): found by the group or given by an animator; null before. */
  digits: (number | null)[]
  /** Start timestamp in ms, null until the group is in the room. */
  startedAt: number | null
  /** Timestamp in ms when the padlock opened, null before. */
  finishedAt: number | null
  /** Wrong tries in `wrongSlot` (drives the message and the shake). */
  wrongAttempts: number
  /** Slot of those tries: null at the entrance, stepCount at the padlock. A new slot starts from zero. */
  wrongSlot: number | null
}

/** Player actions. `now` is passed in so the reducer stays pure; each one is checked against the phase at `now`. */
export type GameAction =
  | { type: 'start'; now: number } | { type: 'enter'; text: string; now: number }
  | { type: 'answer'; challenge: number; text: string; now: number }
  | { type: 'giveDigit'; challenge: number; code: string; now: number }
  | { type: 'unlock'; code: number[]; now: number } | { type: 'reset' }

/**
 * State before the game starts.
 * @param stepCount Number of challenges.
 * @returns The home state, with no digit.
 */
export function initialGameState(stepCount: number): GameState {
  return {
    status: 'home', digits: Array.from({ length: stepCount }, () => null),
    startedAt: null, finishedAt: null, wrongAttempts: 0, wrongSlot: null,
  }
}

/**
 * Wrong tries to show now: those of an earlier slot no longer count.
 * @param state Game state.
 * @param slot Current slot (null at the entrance, stepCount at the padlock).
 * @returns Number of wrong tries in that slot.
 */
export function wrongAttemptsIn(state: GameState, slot: number | null): number {
  return state.wrongSlot === slot ? state.wrongAttempts : 0
}

/**
 * The one rule for a right answer, shared by the reducer and useGameProgress (which needs it inside the tap, for the clack).
 * @param state Game state.
 * @param config Validated quiz.
 * @param teamIndex 0-based team of the tablet.
 * @param answer Challenge the children answered (the one they saw), typed text and time.
 * @returns True when that challenge is on screen, not found yet, and the text is its answer.
 */
export function earnsDigit(
  state: GameState, config: QuizConfig, teamIndex: number, answer: { challenge: number; text: string; now: number },
): boolean {
  const phase = gamePhase(state, config, teamIndex, answer.now)
  return phase.kind === 'challenge' && phase.challenge === answer.challenge
    && isRightAnswer(answer.text, config.steps[answer.challenge].answer)
}

function withDigit(state: GameState, challenge: number, digit: number): GameState {
  return { ...state, digits: state.digits.map((d, i) => (i === challenge ? digit : d)) }
}

function countWrong(state: GameState, slot: number | null): GameState {
  return { ...state, wrongAttempts: wrongAttemptsIn(state, slot) + 1, wrongSlot: slot }
}

/**
 * Builds the reducer for a quiz and a team. Invalid actions return the same state object.
 * @param config Validated quiz.
 * @param teamIndex 0-based team of the tablet (drives the rotation).
 * @returns A reducer usable with useReducer.
 */
export function createGameReducer(config: QuizConfig, teamIndex: number) {
  const code = padlockCode(config.steps, config.padlock.order)
  return (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'start':
        if (state.status !== 'home') return state
        // With an entrance message the clock waits until the group is in the room.
        return config.entrance ? { ...state, status: 'entrance' } : { ...state, status: 'playing', startedAt: action.now }
      case 'enter':
        if (state.status !== 'entrance' || !config.entrance) return state
        return isRightAnswer(action.text, config.entrance.answer)
          ? { ...state, status: 'playing', startedAt: action.now, wrongAttempts: 0, wrongSlot: null }
          : countWrong(state, null)
      case 'answer': {
        const phase = gamePhase(state, config, teamIndex, action.now)
        if (phase.kind !== 'challenge' || phase.challenge !== action.challenge) return state
        return earnsDigit(state, config, teamIndex, action)
          ? { ...withDigit(state, action.challenge, config.steps[action.challenge].digit), wrongAttempts: 0 }
          : countWrong(state, phase.slot)
      }
      case 'giveDigit': {
        const phase = gamePhase(state, config, teamIndex, action.now)
        if (phase.kind !== 'timeUp' || phase.challenge !== action.challenge) return state
        if (!isAnimatorCode(action.code, config.animatorCode)) return state
        return withDigit(state, action.challenge, config.steps[action.challenge].digit)
      }
      case 'unlock':
        if (gamePhase(state, config, teamIndex, action.now).kind !== 'padlock') return state
        return isPadlockCode(code, action.code)
          ? { ...state, status: 'won', finishedAt: action.now, wrongAttempts: 0 }
          : countWrong(state, config.stepCount)
      case 'reset':
        return initialGameState(config.stepCount)
    }
  }
}
