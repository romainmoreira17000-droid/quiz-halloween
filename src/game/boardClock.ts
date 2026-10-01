/** @file Shared clock of the animator board: the start most tablets agree on, and where the rotation stands. */
import type { QuizConfig } from '../config/types'
import { timeOfDay } from './startTime'
import { slotTiming } from './time'

/** A tablet whose start differs by more than this from the others is shown as out of step. */
export const OFFSET_TOLERANCE_MS = 60_000

/** Header of the board. */
export interface BoardClock {
  /** Reference start, "hh:mm". */
  start: string
  /** Whole seconds since the reference start. */
  elapsedSeconds: number
  /** 0-based slot, null once every slot is over. */
  slot: number | null
  /** Seconds before the next change of challenge, null once every slot is over. */
  secondsLeft: number | null
}

/**
 * Start most tablets agree on: the median, the lower one of the middle two, so one late tablet does not move it.
 * @param starts Start timestamps (ms) of the games in progress.
 * @returns The reference start, or null without any game in progress.
 * @example referenceStart([3000, 1000, 1000]) // 1000
 */
export function referenceStart(starts: readonly number[]): number | null {
  if (starts.length === 0) return null
  const sorted = [...starts].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) / 2)]
}

/**
 * How far a tablet's start is from the others.
 * @param start Start of that tablet, in ms.
 * @param reference Reference start, in ms.
 * @returns Rounded minutes (positive: started later), or null within OFFSET_TOLERANCE_MS.
 */
export function startOffsetMinutes(start: number, reference: number): number | null {
  const gap = start - reference
  return Math.abs(gap) > OFFSET_TOLERANCE_MS ? Math.round(gap / 60_000) : null
}

/**
 * Where the rotation stands for the reference start.
 * @param start Reference start, in ms.
 * @param now Phone time, in ms.
 * @param config Number of challenges and slot length.
 * @returns See BoardClock.
 */
export function boardClock(start: number, now: number, config: Pick<QuizConfig, 'stepCount' | 'slotMinutes'>): BoardClock {
  const timing = slotTiming(start, now, config.slotMinutes)
  const over = timing.slot >= config.stepCount
  return {
    start: timeOfDay(start),
    elapsedSeconds: Math.max(0, Math.floor((now - start) / 1000)),
    slot: over ? null : timing.slot,
    secondsLeft: over ? null : timing.secondsLeft,
  }
}
