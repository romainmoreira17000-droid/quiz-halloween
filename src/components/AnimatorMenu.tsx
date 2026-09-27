/** @file Animator menu, opened with the animator code from the reset window: help a group at any time. */
import { useEffect, useRef, useState } from 'react'
import type { QuizStep } from '../config/types'

/** Props of AnimatorMenu. Each action is given only when it makes sense on the current screen. */
export interface AnimatorMenuProps {
  /** Steps of the quiz, for the answers. */
  steps: readonly QuizStep[]
  /** Padlock code, in the order of the dials. */
  code: readonly number[]
  /** Title of the challenge on screen, when its digit is still to find. */
  challengeTitle?: string
  /** Gives the digit of the challenge on screen. */
  onSolve?(): void
  /** Ends the keyboard block after a wrong answer. */
  onUnblock?(): void
  /** Makes the hint of the challenge on screen available now. */
  onShowHint?(): void
  onClose(): void
}

/**
 * Window with the possible actions, and the answers behind a button (the children may be looking).
 * An action closes the menu: the animator sees its effect on the screen at once.
 * @param props See AnimatorMenuProps.
 * @returns The menu over the current screen.
 */
export function AnimatorMenu({ steps, code, challengeTitle, onSolve, onUnblock, onShowHint, onClose }: AnimatorMenuProps) {
  const close = useRef<HTMLButtonElement>(null)
  const [showAnswers, setShowAnswers] = useState(false)
  useEffect(() => { close.current?.focus() }, [])
  const run = (action: () => void) => () => { action(); onClose() }
  const nothing = !onSolve && !onUnblock && !onShowHint
  return (
    <div className="reset-overlay">
      <div className="reset-dialog animator-menu" role="dialog" aria-modal="true" aria-labelledby="animator-title"
        onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
        <h2 id="animator-title">Menu animateur</h2>
        {nothing && <p>Rien à débloquer sur cet écran.</p>}
        {onSolve && <button type="button" className="seal-button" onClick={run(onSolve)}>Valider l’épreuve « {challengeTitle} »</button>}
        {onUnblock && <button type="button" className="ghost-button" onClick={run(onUnblock)}>Débloquer la saisie</button>}
        {onShowHint && <button type="button" className="ghost-button" onClick={run(onShowHint)}>Montrer l’indice</button>}
        {showAnswers ? (
          <>
            <ol className="animator-answers" aria-label="Solutions">
              {steps.map((step, i) => (
                <li key={i}><span>{i + 1}. {step.title}</span><b>{step.answer.value}</b><span>→ {step.digit}</span></li>
              ))}
            </ol>
            <p className="animator-code">Code du cadenas : {code.join(' ')}</p>
          </>
        ) : (
          <button type="button" className="ghost-button" onClick={() => setShowAnswers(true)}>Voir les solutions</button>
        )}
        <button type="button" className="ghost-button" ref={close} onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
