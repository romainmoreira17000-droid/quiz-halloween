/** @file « Passer à l'épreuve suivante » (« Passer au cadenas » on the final) of the animator menu, with its confirmation step. */
import { useState } from 'react'

/** Props of SkipNext. */
export interface SkipNextProps {
  /** Runs the skip (and closes the menu). */
  onSkip(): void
  /** Where the skip leads, after « Passer » (« au cadenas » on the final). */
  target?: string
}

/**
 * Button that asks once more before skipping: a skip on one tablet only would send its group into a room
 * another group is still in, for the rest of the game.
 * @param props See SkipNextProps.
 * @returns The button, or the warning with the confirmation and cancel buttons.
 */
export function SkipNext({ onSkip, target = 'à l’épreuve suivante' }: SkipNextProps) {
  const [confirming, setConfirming] = useState(false)
  if (!confirming) {
    return <button type="button" className="ghost-button" onClick={() => setConfirming(true)}>Passer {target}</button>
  }
  return (
    <>
      <p className="animator-warning">À faire sur toutes les tablettes, sinon les équipes se croisent.</p>
      <button type="button" className="seal-button" onClick={onSkip}>Oui, passer {target}</button>
      {/* Takes the question back only: « Fermer » would close the whole menu. */}
      <button type="button" className="ghost-button" onClick={() => setConfirming(false)}>Annuler</button>
    </>
  )
}
