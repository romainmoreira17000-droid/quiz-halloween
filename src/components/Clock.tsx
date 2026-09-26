/** @file Countdown display: amber "mm:ss", red "-mm:ss" once time is up. */
import { formatClock } from '../game/time'

/** Props of Clock. */
export interface ClockProps {
  seconds: number
  /** Accessible name, e.g. "Temps total restant". */
  label: string
}

/**
 * Shows the time left.
 * @param props.seconds Seconds left, negative when over.
 * @param props.label Accessible name (a clock can count a slot or the whole game).
 * @returns The clock.
 */
export function Clock({ seconds, label }: ClockProps) {
  const className = seconds < 0 ? 'clock clock--overtime' : 'clock'
  return <span role="timer" aria-label={label} className={className}>{formatClock(seconds)}</span>
}
