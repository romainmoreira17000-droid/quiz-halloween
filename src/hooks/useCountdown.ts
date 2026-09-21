/** @file Live countdown, re-read from the real clock on every tick. */
import { useEffect, useState } from 'react'
import { remainingSeconds } from '../game/time'

/** Half a second, so the display never lags more than that behind the real time. */
const TICK_MS = 500

/**
 * Seconds left in the game, refreshed twice a second.
 * @param startedAt Start timestamp in ms, or null before the game starts.
 * @param durationMinutes Game duration from quiz.yaml.
 * @returns Seconds left; negative once time is up (the game keeps going).
 */
export function useCountdown(startedAt: number | null, durationMinutes: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (startedAt === null) return
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [startedAt])
  if (startedAt === null) return durationMinutes * 60
  // `now` may predate the start if this hook mounted before "Commencer".
  return remainingSeconds(startedAt, Math.max(now, startedAt), durationMinutes)
}
