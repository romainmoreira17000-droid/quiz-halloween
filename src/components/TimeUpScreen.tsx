/** @file Shown when a slot ended without its digit: an animator types the code, the tablet shows the digit, then the group goes on. */
import { useState, type ReactNode } from 'react'
import type { QuizStep } from '../config/types'
import { isAnimatorCode } from '../game/answer'
import { AnswerZone } from './AnswerZone'

/** Props of TimeUpScreen. */
export interface TimeUpScreenProps {
  /** In-game header (clocks and candles). */
  header: ReactNode
  /** Challenge whose slot ended without its digit. */
  step: QuizStep
  /** `code_animateur` from quiz.yaml. */
  animatorCode: string
  /** Called on « Continuer », once the digit was shown, with the code the animator typed. */
  onUnlock(code: string): void
}

/**
 * « Temps écoulé : appelez un animateur ».
 * @param props See TimeUpScreenProps.
 * @returns The screen; the parent remounts it (React key) for each missed challenge.
 */
export function TimeUpScreen({ header, step, animatorCode, onUnlock }: TimeUpScreenProps) {
  // Only set once the right code was typed: the digit stays on screen until « Continuer ».
  const [code, setCode] = useState<string | null>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const submit = (text: string) => {
    if (isAnimatorCode(text, animatorCode)) setCode(text)
    else setWrongAttempts((count) => count + 1)
  }
  return (
    <main className="screen time-up">
      {header}
      <section className="parchment">
        <h2>Temps écoulé : appelez un animateur</h2>
        <p className="instruction">Épreuve : {step.title}</p>
      </section>
      {code === null ? (
        <AnswerZone kind="digits" secret wrongAttempts={wrongAttempts} wrongMessage="Ce n’est pas le code animateur." onSubmit={submit} />
      ) : (
        <div className="answer-zone">
          <p className="found" role="status">Chiffre de l’épreuve : <b>{step.digit}</b></p>
          <button type="button" className="seal-button" onClick={() => onUnlock(code)}>Continuer</button>
        </div>
      )}
    </main>
  )
}
