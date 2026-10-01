/** @file « Nouvelle soirée »: empties the board, after a confirmation (the tablets still playing come back within 30 s). */
import { useState } from 'react'

/**
 * Button and its confirmation.
 * @param props.onConfirm Empties the board.
 * @returns The button, or the confirmation.
 */
export function NewEvening({ onConfirm }: { onConfirm(): void }) {
  const [asking, setAsking] = useState(false)
  if (!asking) return <button type="button" className="ghost-button" onClick={() => setAsking(true)}>Nouvelle soirée</button>
  return (
    <div className="board-confirm">
      <p>Effacer le suivi de toutes les équipes ? Les tablettes encore en jeu réapparaîtront dans les 30 secondes.</p>
      <button type="button" className="seal-button" onClick={() => { setAsking(false); onConfirm() }}>Effacer le tableau</button>
      <button type="button" className="ghost-button" onClick={() => setAsking(false)}>Annuler</button>
    </div>
  )
}
