/** @file Challenge screen: instruction on a parchment menu (with its hint button), the cutaway lock, typed answer, then a « Bravo ! », the earned digit, the story of the room, the waiting message, the next challenge and the time before it. */
import type { ReactNode } from 'react'
import type { QuizStep } from '../config/types'
import { formatClock } from '../game/time'
import { useCelebration } from '../hooks/useCelebration'
import { AnswerZone } from './AnswerZone'
import { CelebrationOverlay } from './CelebrationOverlay'
import { CutawayLock } from './CutawayLock'
import { HintButton } from './HintButton'

/** Props of StepScreen. */
export interface StepScreenProps {
  /** In-game header (clocks and candles). */
  header: ReactNode
  step: QuizStep
  /** 0-based challenge number of this step. */
  challenge: number
  /** Digit per challenge, null while not found; this one is solved once it has its own. */
  digits: readonly (number | null)[]
  /** Wrong tries in this slot. */
  wrongAttempts: number
  /** Seconds before every group changes room (shown once the digit is found). */
  secondsLeft: number
  /** Words before the countdown once solved (see waitingLabel); null hides it (the final, before the padlock). */
  nextLabel: string | null
  /** Called when the « Bravo ! » is closed by a tap. */
  onCelebrationEnd?: () => void
  /** Seconds before a new answer is accepted after a wrong one (0 = free). */
  blockSecondsLeft: number
  /** Hints of the step unlocked now; unused when the step has no hint. */
  hintsAvailable: number
  /** Seconds before the next hint, null when none is left to come. */
  secondsToNextHint: number | null
  /** Title of the challenge of the next slot, announced once the digit is found; none before the padlock. */
  nextTitle?: string
  /** Message shown once the digit is found (`message_attente`), none when absent. */
  waitingMessage?: string
  /** Called with the typed answer. */
  onSubmit(text: string): void
}

/**
 * One challenge of the rotation.
 * @param props See StepScreenProps.
 * @returns The step screen.
 */
export function StepScreen(props: StepScreenProps) {
  const { header, step, challenge, digits, wrongAttempts, secondsLeft, nextLabel, blockSecondsLeft, hintsAvailable, secondsToNextHint, nextTitle, waitingMessage, onSubmit, onCelebrationEnd } = props
  const digit = digits[challenge]
  const solved = digit !== null
  const celebration = useCelebration(solved, onCelebrationEnd)
  return (
    <main className="screen step">
      {header}
      <section className="parchment">
        <h2>{step.title}</h2>
        <p className="instruction">{step.instruction}</p>
        {step.image && (
          <img className="step-image" src={`${import.meta.env.BASE_URL}images/${step.image}`} alt={`Image de l’étape : ${step.title}`} />
        )}
        {step.hints && !solved && <HintButton hints={step.hints} available={hintsAvailable} secondsToNext={secondsToNextHint} />}
      </section>
      {/* Only the pin of this challenge falls: the others are already down or still up. */}
      <CutawayLock total={digits.length} foundDigits={digits} fallingIndex={solved ? challenge : undefined} />
      {solved ? (
        <div className="answer-zone">
          <p className="found" role="status">Chiffre trouvé : <b>{digit}</b></p>
          {step.story && <p className="story">{step.story}</p>}
          {waitingMessage && <p className="waiting-message">{waitingMessage}</p>}
          {nextTitle && <p className="next-step"><span>Prochaine épreuve :</span> <b>{nextTitle}</b></p>}
          {nextLabel && <p className="next-room">{nextLabel} {formatClock(secondsLeft)}</p>}
        </div>
      ) : (
        <AnswerZone kind={step.answer.kind} wrongAttempts={wrongAttempts} blockedSeconds={blockSecondsLeft} onSubmit={onSubmit} />
      )}
      {celebration.shown && digit !== null && <CelebrationOverlay digit={digit} onDismiss={celebration.dismiss} />}
    </main>
  )
}
