/** @file Confirmation window before restarting the game, with the animator code once a game is under way. */
import { useEffect, useRef, useState } from 'react'
import { isAnimatorCode } from '../game/answer'
import { AnswerZone } from './AnswerZone'

/** Props of ResetDialog. */
export interface ResetDialogProps {
  onCancel(): void
  onConfirm(): void
  /** When given, a third button sets the tablet up for another team (the animator code is asked next). */
  onChangeTeam?(): void
  /** When given (a game is under way), « Recommencer » asks for this code before restarting. */
  animatorCode?: string
}

/**
 * In-game window (not window.confirm, which looks foreign and tiny on a tablet).
 * "Annuler" gets the focus and Escape cancels: the safe choice is the default one.
 * @param props See ResetDialogProps.
 * @returns The confirmation window over the current screen.
 */
export function ResetDialog({ onCancel, onConfirm, onChangeTeam, animatorCode }: ResetDialogProps) {
  const cancel = useRef<HTMLButtonElement>(null)
  // A restart during the evening puts the team's slots out of step with the others: an adult confirms it.
  const [askingCode, setAskingCode] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const confirm = () => { if (animatorCode === undefined) onConfirm(); else setAskingCode(true) }
  const submit = (text: string) => {
    if (animatorCode !== undefined && isAnimatorCode(text, animatorCode)) onConfirm()
    else setWrongAttempts((count) => count + 1)
  }
  useEffect(() => { cancel.current?.focus() }, [])
  return (
    <div className="reset-overlay">
      <div className="reset-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title"
        onKeyDown={(event) => { if (event.key === 'Escape') onCancel() }}>
        <h2 id="reset-title">Recommencer la partie ?</h2>
        <p>La progression du groupe sera effacée.</p>
        {askingCode && (
          <>
            <p>Code animateur :</p>
            <AnswerZone kind="digits" secret wrongAttempts={wrongAttempts} wrongMessage="Ce n’est pas le code animateur." onSubmit={submit} />
          </>
        )}
        <div className="reset-actions">
          <button type="button" className="ghost-button" ref={cancel} onClick={onCancel}>Annuler</button>
          {!askingCode && <button type="button" className="seal-button" onClick={confirm}>Recommencer</button>}
        </div>
        {onChangeTeam && !askingCode && (
          <button type="button" className="ghost-button change-team" onClick={onChangeTeam}>Changer d’équipe</button>
        )}
      </div>
    </div>
  )
}
