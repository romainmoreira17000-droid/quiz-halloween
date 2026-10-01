/** @file Keeps the final challenge on screen during its « Bravo ! », although the clock already says padlock. */
import { useEffect, useState } from 'react'
import type { GamePhase } from '../game/phase'
import { CELEBRATION_DELAY_MS, CELEBRATION_MS } from './useCelebration'

/** @returns A key that changes only when the screen changes (phase objects are new on every render). */
function phaseKey(phase: GamePhase): string {
  return phase.kind === 'challenge' || phase.kind === 'waiting' || phase.kind === 'timeUp' ? `${phase.kind}:${phase.challenge}` : phase.kind
}

/**
 * Holds the final challenge screen while its pin falls and its « Bravo ! » shows: a found final opens the padlock at
 * once (gamePhase), which would unmount the step screen and its celebration.
 * @param phase Phase derived from the clock.
 * @param finalStep Final challenge of the quiz, if any.
 * @param inFinalSlot Whether the clock is still in the final's slot (false after « Passer à l'épreuve suivante »,
 *   which gives the digit without any « Bravo ! »).
 * @returns `held` while the final screen must stay, and `release` to show the padlock early (« Bravo ! » tapped).
 */
export function useFinaleHold(phase: GamePhase, finalStep: number | undefined, inFinalSlot: boolean): { held: boolean; release(): void } {
  const key = phaseKey(phase)
  const [previous, setPrevious] = useState(key)
  const [held, setHeld] = useState(false)
  // Checked during render, not in an effect: one frame of padlock would unmount the step screen and its « Bravo ! ».
  if (key !== previous) {
    setPrevious(key)
    if (finalStep !== undefined && previous === `challenge:${finalStep}` && key === 'padlock' && inFinalSlot) setHeld(true)
  }
  useEffect(() => {
    if (!held) return
    const timer = setTimeout(() => setHeld(false), CELEBRATION_DELAY_MS + CELEBRATION_MS)
    return () => clearTimeout(timer)
  }, [held])
  return { held, release: () => setHeld(false) }
}
