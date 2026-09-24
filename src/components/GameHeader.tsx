/** @file In-game header: live countdown and candle progress. */
import { useCountdown } from '../hooks/useCountdown'
import { CandleProgress } from './CandleProgress'
import { Clock } from './Clock'

/** Props of GameHeader. */
export interface GameHeaderProps {
  startedAt: number
  /** Set once the padlock opened: freezes the clock. */
  finishedAt?: number | null
  durationMinutes: number
  total: number
  solved: number
  current: number | null
}

/**
 * Header shown on every in-game screen.
 * @param props See GameHeaderProps.
 * @returns The header.
 */
export function GameHeader({ startedAt, finishedAt, durationMinutes, total, solved, current }: GameHeaderProps) {
  const seconds = useCountdown(startedAt, durationMinutes, finishedAt ?? null)
  return (
    <header className="game-header">
      {/* Replaced by the slot/total clocks in Task 5, once the rotation lands. */}
      <Clock seconds={seconds} label="Temps restant" />
      <CandleProgress total={total} solved={solved} current={current} />
      <span className="header-spacer" aria-hidden="true" />
    </header>
  )
}
