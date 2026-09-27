/**
 * @file Game state machine of one team: home → entrance (optional) → playing → won. It records facts only
 * (answers, digits given by an animator, padlock opened); the clock decides the screen (see phase.ts).
 * Pure, so it can be saved and restored.
 */
import type { QuizConfig } from '../config/types'
import { isAnimatorCode, isRightAnswer } from './answer'
import { blockEnd, blockSecondsLeft } from './block'
import { availableHints, hintsUnlockedByClock } from './hints'
import { isPadlockCode, padlockCode } from './padlock'
import { gamePhase, type GameStatus } from './phase'
import { startForNextSlot } from './skip'
import { slotTiming } from './time'

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
  /** End of the keyboard block after a wrong answer to a challenge (ms), null when free. Saved: a reload keeps it. */
  blockedUntil: number | null
  /** Slot in which an animator gave hints early (animator menu), null otherwise. A new slot hides them again. */
  hintSlot: number | null
  /** Hints the animator gave in `hintSlot` (menu), 0 otherwise. */
  hintCount: number
}

/** Player actions. `now` is passed in so the reducer stays pure; each one is checked against the phase at `now`. */
export type GameAction =
  | { type: 'start'; now: number } | { type: 'enter'; text: string; now: number }
  | { type: 'answer'; challenge: number; text: string; now: number }
  | { type: 'giveDigit'; challenge: number; code: string; now: number }
  | { type: 'unlock'; code: number[]; now: number } | { type: 'reset' }
  /** Test mode only (see testMode.ts): ends the current slot now. */
  | { type: 'skipSlot'; now: number }
  /** Animator menu (the code is checked when it opens): never changes the time, so the rotation stays in step. */
  | { type: 'animatorSolve'; challenge: number; now: number } | { type: 'unblock'; now: number }
  | { type: 'showHint'; challenge: number; now: number }

/**
 * State before the game starts.
 * @param stepCount Number of challenges.
 * @returns The home state, with no digit.
 */
export function initialGameState(stepCount: number): GameState {
  return {
    status: 'home', digits: Array.from({ length: stepCount }, () => null),
    startedAt: null, finishedAt: null, wrongAttempts: 0, wrongSlot: null, blockedUntil: null, hintSlot: null, hintCount: 0,
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
 * @returns True when that challenge is on screen, not found yet, not blocked, and the text is its answer.
 */
export function earnsDigit(
  state: GameState, config: QuizConfig, teamIndex: number, answer: { challenge: number; text: string; now: number },
): boolean {
  const phase = gamePhase(state, config, teamIndex, answer.now)
  return phase.kind === 'challenge' && phase.challenge === answer.challenge
    && blockSecondsLeft(state.blockedUntil, answer.now) === 0
    && isRightAnswer(answer.text, config.steps[answer.challenge].answer)
}

/**
 * Hints of the challenge available now, unlocked by the slot clock or given by an animator in this slot.
 * @param state Game state.
 * @param config Validated quiz.
 * @param challenge 0-based challenge on screen.
 * @param slot Slot on screen.
 * @param now Current timestamp in ms.
 * @returns Between 0 and the number of hints of the step.
 */
export function hintsAvailable(state: GameState, config: QuizConfig, challenge: number, slot: number, now: number): number {
  const total = config.steps[challenge].hints?.length ?? 0
  if (state.startedAt === null) return 0
  const { secondsLeft } = slotTiming(state.startedAt, now, config.slotMinutes)
  const byClock = hintsUnlockedByClock(secondsLeft, config.slotMinutes, config.hintTimes)
  return availableHints(byClock, { slot: state.hintSlot, count: state.hintCount }, slot, total)
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
        if (phase.kind !== 'challenge' || phase.challenge !== action.challenge || state.startedAt === null) return state
        // A tap while blocked is neither a new wrong try nor a right one: the group must wait.
        if (blockSecondsLeft(state.blockedUntil, action.now) > 0) return state
        return earnsDigit(state, config, teamIndex, action)
          ? { ...withDigit(state, action.challenge, config.steps[action.challenge].digit), wrongAttempts: 0, blockedUntil: null }
          : { ...countWrong(state, phase.slot), blockedUntil: blockEnd(state.startedAt, action.now, config.slotMinutes, config.blockSeconds) }
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
      case 'animatorSolve': {
        const phase = gamePhase(state, config, teamIndex, action.now)
        if (phase.kind !== 'challenge' || phase.challenge !== action.challenge) return state
        return { ...withDigit(state, action.challenge, config.steps[action.challenge].digit), wrongAttempts: 0, blockedUntil: null }
      }
      case 'unblock':
        return blockSecondsLeft(state.blockedUntil, action.now) > 0 ? { ...state, blockedUntil: null } : state
      case 'showHint': {
        const phase = gamePhase(state, config, teamIndex, action.now)
        if (phase.kind !== 'challenge' || phase.challenge !== action.challenge) return state
        // One more hint than on screen now, whether the clock or the animator unlocked those.
        const shown = hintsAvailable(state, config, action.challenge, phase.slot, action.now)
        if (shown >= (config.steps[action.challenge].hints?.length ?? 0)) return state
        return { ...state, hintSlot: phase.slot, hintCount: shown + 1 }
      }
      case 'skipSlot': {
        // Not on « Temps écoulé »: the animator code is still needed there, as on the evening.
        const kind = gamePhase(state, config, teamIndex, action.now).kind
        if ((kind !== 'challenge' && kind !== 'waiting') || state.startedAt === null) return state
        // The block is an absolute time: once the start moves back it would follow the group into the next room.
        return { ...state, startedAt: startForNextSlot(state.startedAt, action.now, config.slotMinutes), blockedUntil: null }
      }
    }
  }
}
