/** @file « Passer à l'épreuve suivante » of the animator menu, with its confirmation step. */
import { useState } from 'react'

/** Props of SkipNext. */
export interface SkipNextProps {
  /** Runs the skip (and closes the menu). */
  onSkip(): void
}

/**
 * Button that asks once more before skipping: a skip on one tablet only would send its group into a room
 * another group is still in, for the rest of the game.
 * @param props See SkipNextProps.
 * @returns The button, or the warning and the confirmation button.
 */
export function SkipNext({ onSkip }: SkipNextProps) {
  const [confirming, setConfirming] = useState(false)
  if (!confirming) {
    return <button type="button" className="ghost-button" onClick={() => setConfirming(true)}>Passer à l’épreuve suivante</button>
  }
  return (
    <>
      <p className="animator-warning">À faire sur toutes les tablettes, sinon les équipes se croisent.</p>
      <button type="button" className="seal-button" onClick={onSkip}>Oui, passer à l’épreuve suivante</button>
    </>
  )
}
