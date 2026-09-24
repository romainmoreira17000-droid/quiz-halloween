/** @file Step screen: instruction on a parchment menu, the cutaway lock, typed answer, then the earned digit and a button to go on. */
import type { ReactNode } from 'react'
import type { QuizStep } from '../config/types'
import { AnswerZone } from './AnswerZone'
import { CutawayLock } from './CutawayLock'

/** Props of StepScreen. */
export interface StepScreenProps {
  /** In-game header (clock and candles). */
  header: ReactNode
  step: QuizStep
  /** 1-based number of this step. */
  stepNumber: number
  total: number
  /** Digits earned so far, in step order; this step is solved once it has its own. */
  foundDigits: number[]
  /** Wrong tries so far on this step. */
  wrongAttempts: number
  isLast: boolean
  /** Called with the typed answer. */
  onSubmit(text: string): void
  onNext(): void
}

/**
 * One challenge of the quiz.
 * @param props See StepScreenProps.
 * @returns The step screen.
 */
export function StepScreen(props: StepScreenProps) {
  const { header, step, stepNumber, total, foundDigits, wrongAttempts, isLast, onSubmit, onNext } = props
  const index = stepNumber - 1
  const solved = foundDigits.length > index
  return (
    <main className="screen step">
      {header}
      <section className="parchment">
        <p className="step-number">Étape {stepNumber} sur {total}</p>
        <h2>{step.title}</h2>
        <p className="instruction">{step.instruction}</p>
        {step.image && (
          <img className="step-image" src={`${import.meta.env.BASE_URL}images/${step.image}`} alt={`Image de l’étape : ${step.title}`} />
        )}
      </section>
      {/* Only the pin of this step falls: the earlier ones are already down. */}
      <CutawayLock total={total} foundDigits={foundDigits} fallingIndex={solved ? index : undefined} />
      {solved ? (
        <div className="answer-zone">
          <p className="found" role="status">Chiffre trouvé : <b>{foundDigits[index]}</b></p>
          <button type="button" className="seal-button" onClick={onNext}>{isLast ? 'Continuer' : 'Étape suivante'}</button>
        </div>
      ) : (
        <AnswerZone kind={step.answer.kind} wrongAttempts={wrongAttempts} onSubmit={onSubmit} />
      )}
    </main>
  )
}
