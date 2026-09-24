/** @file Wrong-answer feedback zone shared by the step and entrance screens: shake, kind message, and the typed answer. */
import type { AnswerKind } from '../config/types'
import { wrongAnswerMessage } from '../game/messages'
import { AnswerInput } from './AnswerInput'

/** Props of AnswerZone. */
export interface AnswerZoneProps {
  kind: AnswerKind
  /** Wrong tries so far. */
  wrongAttempts: number
  /** Called with the typed answer. */
  onSubmit(text: string): void
  /** Replaces the children's kind messages (e.g. « Ce n’est pas le code animateur. »). */
  wrongMessage?: string
  /** See AnswerInputProps.secret. */
  secret?: boolean
}

/**
 * Typed-answer zone: shakes and shows a kind message after a wrong try, otherwise just the keyboard.
 * @param props See AnswerZoneProps.
 * @returns The answer zone.
 */
export function AnswerZone({ kind, wrongAttempts, onSubmit, wrongMessage, secret }: AnswerZoneProps) {
  return (
    // Changing key on each wrong try remounts the zone: replays the shake and clears the typed answer.
    <div key={wrongAttempts} className={wrongAttempts > 0 ? 'answer-zone shake' : 'answer-zone'}>
      {wrongAttempts > 0 && <p className="wrong-answer" role="alert">{wrongMessage ?? wrongAnswerMessage(wrongAttempts)}</p>}
      <AnswerInput kind={kind} onSubmit={onSubmit} secret={secret} />
    </div>
  )
}
