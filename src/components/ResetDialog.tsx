/** @file Confirmation window before restarting the game. */
import { useEffect, useRef } from 'react'

/** Props of ResetDialog. */
export interface ResetDialogProps {
  onCancel(): void
  onConfirm(): void
}

/**
 * In-game window (not window.confirm, which looks foreign and tiny on a tablet).
 * "Annuler" gets the focus and Escape cancels: the safe choice is the default one.
 * @param props See ResetDialogProps.
 * @returns The confirmation window over the current screen.
 */
export function ResetDialog({ onCancel, onConfirm }: ResetDialogProps) {
  const cancel = useRef<HTMLButtonElement>(null)
  useEffect(() => { cancel.current?.focus() }, [])
  return (
    <div className="reset-overlay">
      <div className="reset-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title"
        onKeyDown={(event) => { if (event.key === 'Escape') onCancel() }}>
        <h2 id="reset-title">Recommencer la partie ?</h2>
        <p>La progression du groupe sera effacée.</p>
        <div className="reset-actions">
          <button type="button" className="ghost-button" ref={cancel} onClick={onCancel}>Annuler</button>
          <button type="button" className="seal-button" onClick={onConfirm}>Recommencer</button>
        </div>
      </div>
    </div>
  )
}
