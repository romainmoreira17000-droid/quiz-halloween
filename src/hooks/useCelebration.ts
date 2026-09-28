/** @file Shows the « Bravo ! » celebration for a moment when a challenge gets solved while its screen is open. */
import { useEffect, useState } from 'react'

/**
 * Delay before the celebration, so the children first see the pin fall with its « clac » and the lock jolt on
 * its chain (pin-fall and lock-jolt in lock.css, done at 1.5 s): the opaque celebration would hide them.
 */
export const CELEBRATION_DELAY_MS = 1500
/** How long the celebration stays on screen; keep in step with the `celebrate-*` animations of celebration.css. */
export const CELEBRATION_MS = 3000

/**
 * Tracks the celebration of one challenge screen.
 * Only a change from "not solved" to "solved" celebrates: a screen that opens already solved
 * (tablet reloaded while waiting) stays quiet.
 * @param solved Whether the challenge of the screen has its digit.
 * @returns `shown`, true while the celebration is on screen, and `dismiss` to close it early.
 */
export function useCelebration(solved: boolean): { shown: boolean; dismiss(): void } {
  // Solved state when the screen opened; a digit is never taken back, so `solved` flips at most once.
  const [solvedAtOpen] = useState(solved)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (solvedAtOpen || !solved) return
    const show = setTimeout(() => setShown(true), CELEBRATION_DELAY_MS)
    const hide = setTimeout(() => setShown(false), CELEBRATION_DELAY_MS + CELEBRATION_MS)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [solved, solvedAtOpen])
  return { shown, dismiss: () => setShown(false) }
}
