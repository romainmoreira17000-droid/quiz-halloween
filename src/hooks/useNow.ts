/** @file Current time, refreshed twice a second while the game runs: the slot, its clocks and the screen follow from it. */
import { useEffect, useState } from 'react'

/** Half a second, so the display never lags more than that behind the real time. */
const TICK_MS = 500

/**
 * Ticking Date.now().
 * @param running False on screens without a clock (home, entrance, victory): no timer runs then.
 * @returns A timestamp in ms, at most TICK_MS old while running (it may predate a start that just happened).
 */
export function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [running])
  return now
}
