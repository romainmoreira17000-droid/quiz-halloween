/** @file Which screen a team sees at a given time: decided by the clock, never by an action. */
import type { QuizConfig } from '../config/types'
import { challengeAt } from './rotation'
import { slotTiming } from './time'

/** Stored part of the game: slots, time up and padlock are derived from the time. */
export type GameStatus = 'home' | 'entrance' | 'playing' | 'won'

/** What the phase needs from the game state. */
export interface PhaseInput {
  status: GameStatus
  /** Start timestamp in ms, null before « Commencer » (or before the entrance answer). */
  startedAt: number | null
  /** Digit per challenge (index = challenge number - 1), null until found or given by an animator. */
  digits: readonly (number | null)[]
}

/** Screen to show; `slot` and `challenge` are 0-based. */
export type GamePhase =
  | { kind: 'home' } | { kind: 'entrance' } | { kind: 'won' }
  /** The challenge of the current slot, digit not found yet. */
  | { kind: 'challenge'; slot: number; challenge: number }
  /** Digit found: the group waits for the change of room. */
  | { kind: 'waiting'; slot: number; challenge: number }
  /** An earlier slot ended without its digit: an animator must give it before anything else. */
  | { kind: 'timeUp'; challenge: number }
  /** Every slot is over and every digit known. */
  | { kind: 'padlock' }

/**
 * Derives the screen from the stored state and the time.
 * @param state Status, start time and digits of the game.
 * @param config Number of challenges and slot length.
 * @param teamIndex 0-based team of the tablet.
 * @param now Current timestamp in ms.
 * @returns The phase; a missed challenge comes first (earliest in play order), then the current slot.
 */
export function gamePhase(
  state: PhaseInput, config: Pick<QuizConfig, 'stepCount' | 'slotMinutes'>, teamIndex: number, now: number,
): GamePhase {
  // Spelled out explicitly: a plain `{ kind: state.status }` does not narrow to the union above.
  if (state.status === 'home') return { kind: 'home' }
  if (state.status === 'entrance') return { kind: 'entrance' }
  if (state.status === 'won') return { kind: 'won' }
  // A playing save always has a start time (restoreGameState checks it); this keeps the type narrow.
  if (state.startedAt === null) return { kind: 'home' }
  const { stepCount } = config
  const { slot } = slotTiming(state.startedAt, now, config.slotMinutes)
  for (let past = 0; past < Math.min(slot, stepCount); past++) {
    const challenge = challengeAt(teamIndex, past, stepCount)
    if (state.digits[challenge] === null) return { kind: 'timeUp', challenge }
  }
  if (slot >= stepCount) return { kind: 'padlock' }
  const challenge = challengeAt(teamIndex, slot, stepCount)
  return state.digits[challenge] === null ? { kind: 'challenge', slot, challenge } : { kind: 'waiting', slot, challenge }
}
