/** @file Animator window behind the reset icon: restart (animator code once a game is under way), change team, animator menu. */
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
  /** When given, a « Menu animateur » button opens the menu once `code` is typed (always asked: it shows the answers). */
  menu?: { code: string; onOpen(): void }
}

/** What the animator code is being asked for, if anything. */
type Asking = null | 'reset' | 'menu'

/**
 * In-game window (not window.confirm, which looks foreign and tiny on a tablet).
 * "Annuler" gets the focus and Escape cancels: the safe choice is the default one.
 * @param props See ResetDialogProps.
 * @returns The confirmation window over the current screen.
 */
export function ResetDialog({ onCancel, onConfirm, onChangeTeam, animatorCode, menu }: ResetDialogProps) {
  const cancel = useRef<HTMLButtonElement>(null)
  // A restart during the evening puts the team's slots out of step with the others: an adult confirms it.
  const [asking, setAsking] = useState<Asking>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const confirm = () => { if (animatorCode === undefined) onConfirm(); else setAsking('reset') }
  const submit = (text: string) => {
    if (asking === 'menu' && menu && isAnimatorCode(text, menu.code)) menu.onOpen()
    else if (asking === 'reset' && animatorCode !== undefined && isAnimatorCode(text, animatorCode)) onConfirm()
    else setWrongAttempts((count) => count + 1)
  }
  useEffect(() => { cancel.current?.focus() }, [])
  return (
    <div className="reset-overlay">
      <div className="reset-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title"
        onKeyDown={(event) => { if (event.key === 'Escape') onCancel() }}>
        <h2 id="reset-title">{asking === 'menu' ? 'Menu animateur' : 'Recommencer la partie ?'}</h2>
        {asking !== 'menu' && <p>La progression du groupe sera effacée.</p>}
        {asking !== null && (
          <>
            <p>Code animateur :</p>
            <AnswerZone kind="digits" secret wrongAttempts={wrongAttempts} wrongMessage="Ce n’est pas le code animateur." onSubmit={submit} />
          </>
        )}
        <div className="reset-actions">
          <button type="button" className="ghost-button" ref={cancel} onClick={onCancel}>Annuler</button>
          {asking === null && <button type="button" className="seal-button" onClick={confirm}>Recommencer</button>}
        </div>
        {onChangeTeam && asking === null && (
          <button type="button" className="ghost-button dialog-extra" onClick={onChangeTeam}>Changer d’équipe</button>
        )}
        {menu && asking === null && (
          <button type="button" className="ghost-button dialog-extra" onClick={() => setAsking('menu')}>Menu animateur</button>
        )}
      </div>
    </div>
  )
}
