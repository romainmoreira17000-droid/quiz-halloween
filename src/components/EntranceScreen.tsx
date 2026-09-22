/** @file Entrance screen: the message read before entering the haunted restaurant, and its answer. */
import type { EntranceConfig } from '../config/types'
import { wrongAnswerMessage } from '../game/messages'
import { AnswerInput } from './AnswerInput'

/** Title shown when quiz.yaml has no `entree.titre`. */
export const DEFAULT_ENTRANCE_TITLE = 'Le message d’entrée'

/** Props of EntranceScreen. */
export interface EntranceScreenProps {
  entrance: EntranceConfig
  /** Wrong tries so far. */
  wrongAttempts: number
  /** Called with the typed answer. */
  onSubmit(text: string): void
}

/**
 * Message in front of the restaurant door; no clock yet.
 * @param props See EntranceScreenProps.
 * @returns The entrance screen.
 */
export function EntranceScreen({ entrance, wrongAttempts, onSubmit }: EntranceScreenProps) {
  return (
    <main className="screen entrance">
      <h2>{entrance.title ?? DEFAULT_ENTRANCE_TITLE}</h2>
      <p className="entrance-message">{entrance.message}</p>
      {/* Changing key on each wrong try remounts the zone: replays the shake and clears the typed answer. */}
      <div key={wrongAttempts} className={wrongAttempts > 0 ? 'answer-zone shake' : 'answer-zone'}>
        {wrongAttempts > 0 && <p className="wrong-answer" role="alert">{wrongAnswerMessage(wrongAttempts)}</p>}
        <AnswerInput kind={entrance.answer.kind} onSubmit={onSubmit} />
      </div>
    </main>
  )
}
