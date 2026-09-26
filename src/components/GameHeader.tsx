/** @file In-game header: time left for the challenge (big, with its number), candle progress, total time left (small). */
import { CandleProgress } from './CandleProgress'
import { Clock } from './Clock'

/** Props of GameHeader. Times are computed by the caller from the start time. */
export interface GameHeaderProps {
  /** 0-based slot, or null once every slot is over (padlock, victory): no clocks then. */
  slot: number | null
  /** Number of challenges (= slots). */
  total: number
  /** Challenges with a known digit. */
  solved: number
  /** Seconds left in the slot. */
  slotSeconds: number
  /** Seconds left in the whole game. */
  totalSeconds: number
}

/**
 * Header shown on every in-game screen.
 * @param props See GameHeaderProps.
 * @returns The header.
 */
export function GameHeader({ slot, total, solved, slotSeconds, totalSeconds }: GameHeaderProps) {
  // Spacers keep the candles centred when the clocks are gone.
  const spacer = <span className="header-spacer" aria-hidden="true" />
  return (
    <header className="game-header">
      {slot === null ? spacer : (
        <div className="slot-clock">
          <span className="slot-label">Épreuve {slot + 1}/{total}</span>
          <Clock seconds={slotSeconds} label="Temps restant pour l’épreuve" />
        </div>
      )}
      <CandleProgress total={total} solved={solved} current={slot} />
      {slot === null ? spacer : (
        <p className="total-clock">Total <Clock seconds={totalSeconds} label="Temps total restant" /></p>
      )}
    </header>
  )
}
