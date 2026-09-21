/** @file Progress as a row of candles: lit when solved, glowing wick on the current step. */

/** Props of CandleProgress. */
export interface CandleProgressProps {
  total: number
  /** Number of solved steps. */
  solved: number
  /** 0-based current step, or null when every step is done. */
  current: number | null
}

/**
 * Shows one candle per step.
 * @param props See CandleProgressProps.
 * @returns The candle list.
 */
export function CandleProgress({ total, solved, current }: CandleProgressProps) {
  const label = current === null ? 'Toutes les étapes terminées' : `Étape ${current + 1} sur ${total}`
  const candleClass = (i: number) => (i < solved ? 'lit' : i === current ? 'current' : '')
  return (
    <ol className="candles" aria-label={label}>
      {Array.from({ length: total }, (_, i) => <li key={i} className={candleClass(i)} />)}
    </ol>
  )
}
