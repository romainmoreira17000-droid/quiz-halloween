/** @file Animator menu, opened with the animator code from the reset window: help a group at any time. */
import { useEffect, useRef, useState } from 'react'
import type { QuizStep } from '../config/types'
import { SkipNext } from './SkipNext'
import { StartTime } from './StartTime'

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
  /** Next hint of the challenge on screen, while one is left: its number, the step's hint count, and the unlock. */
  nextHint?: { number: number; total: number; onShow(): void }
  /** Starts the next slot now (giving the digit on screen if needed), after a confirmation tap. */
  onSkip?(): void
  /** Start time of a game in progress ("hh:mm") and how to change it (false when refused). */
  start?: { value: string; onSet(text: string): boolean }
  onClose(): void
}

/**
 * Window with the possible actions, and the answers behind a button (the children may be looking).
 * An action closes the menu: the animator sees its effect on the screen at once.
 * @param props See AnimatorMenuProps.
 * @returns The menu over the current screen.
 */
export function AnimatorMenu({ steps, code, challengeTitle, onSolve, onUnblock, nextHint, onSkip, start, onClose }: AnimatorMenuProps) {
  const close = useRef<HTMLButtonElement>(null)
  const [showAnswers, setShowAnswers] = useState(false)
  useEffect(() => { close.current?.focus() }, [])
  const run = (action: () => void) => () => { action(); onClose() }
  const nothing = !onSolve && !onUnblock && !nextHint && !onSkip
  return (
    <div className="reset-overlay">
      <div className="reset-dialog animator-menu" role="dialog" aria-modal="true" aria-labelledby="animator-title"
        onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
        <h2 id="animator-title">Menu animateur</h2>
        {nothing && <p>Rien à débloquer sur cet écran.</p>}
        {onSolve && <button type="button" className="seal-button" onClick={run(onSolve)}>Valider l’épreuve « {challengeTitle} »</button>}
        {onUnblock && <button type="button" className="ghost-button" onClick={run(onUnblock)}>Débloquer la saisie</button>}
        {nextHint && (
          <button type="button" className="ghost-button" onClick={run(nextHint.onShow)}>
            Débloquer l’indice suivant ({nextHint.number}/{nextHint.total})
          </button>
        )}
        {onSkip && <SkipNext onSkip={run(onSkip)} />}
        {start && <StartTime value={start.value} onSet={start.onSet} onDone={onClose} />}
        {showAnswers ? (
          <>
            <ol className="animator-answers" aria-label="Solutions">
              {steps.map((step, i) => (
                <li key={i}>
                  <span>{i + 1}. {step.title}</span><b>{step.answer.value}</b><span>→ {step.digit}</span>
                  {step.hints && (
                    <ol className="animator-hints" aria-label={`Indices de ${step.title}`}>
                      {step.hints.map((hint, j) => <li key={j}>{hint}</li>)}
                    </ol>
                  )}
                </li>
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
