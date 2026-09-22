/** @file Step screen: challenge instruction, typed answer, then the earned digit and a button to go on. */
import type { ReactNode } from 'react'
import type { QuizStep } from '../config/types'
import { AnswerZone } from './AnswerZone'

/** Props of StepScreen. */
export interface StepScreenProps {
  /** In-game header (clock and candles). */
  header: ReactNode
  step: QuizStep
  /** 1-based number of this step. */
  stepNumber: number
  total: number
  /** Digit earned on this step, undefined while unsolved. */
  foundDigit: number | undefined
  /** Wrong tries so far on this step. */
  wrongAttempts: number
  isLast: boolean
  /** Called with the typed answer. */
  onSubmit(text: string): void
  onNext(): void
}

/**
 * One riddle of the quiz.
 * @param props See StepScreenProps.
 * @returns The step screen.
 */
export function StepScreen(props: StepScreenProps) {
  const { header, step, stepNumber, total, foundDigit, wrongAttempts, isLast, onSubmit, onNext } = props
  return (
    <main className="screen step">
      {header}
      <p className="step-number">Étape {stepNumber} sur {total}</p>
      <h2>{step.title}</h2>
      <p className="instruction">{step.instruction}</p>
      {step.image && (
        <img className="step-image" src={`${import.meta.env.BASE_URL}images/${step.image}`} alt={`Image de l’étape : ${step.title}`} />
      )}
      {foundDigit === undefined ? (
        <AnswerZone kind={step.answer.kind} wrongAttempts={wrongAttempts} onSubmit={onSubmit} />
      ) : (
        <div className="answer-zone">
          <p className="found" role="status">Chiffre trouvé : <b>{foundDigit}</b></p>
          <button type="button" className="seal-button" onClick={onNext}>{isLast ? 'Continuer' : 'Étape suivante'}</button>
        </div>
      )}
    </main>
  )
}
