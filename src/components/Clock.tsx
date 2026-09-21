/** @file Countdown display: amber "mm:ss", red "-mm:ss" once time is up. */
import { formatClock } from '../game/time'

/** Props of Clock. */
export interface ClockProps { seconds: number }

/**
 * Shows the time left.
 * @param props.seconds Seconds left, negative when over.
 * @returns The clock.
 */
export function Clock({ seconds }: ClockProps) {
  const className = seconds < 0 ? 'clock clock--overtime' : 'clock'
  return <span role="timer" aria-label="Temps restant" className={className}>{formatClock(seconds)}</span>
}
