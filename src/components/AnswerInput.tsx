/** @file Typed answer display plus the keyboard matching the answer kind. */
import { useState } from 'react'
import type { AnswerKind } from '../config/types'
import { appendToAnswer, normalizeAnswer } from '../game/answer'
import { Keypad, type AnswerKeysProps } from './Keypad'
import { LetterKeyboard } from './LetterKeyboard'

/** Props of AnswerInput. */
export interface AnswerInputProps {
  kind: AnswerKind
  /** Called with the typed text when Valider is pressed. */
  onSubmit(text: string): void
  /** Shows dots instead of the typed digits (animator code typed in front of the children). */
  secret?: boolean
}

/**
 * Lets children type an answer. The parent remounts it (React key) after a wrong answer,
 * which clears the typed text.
 * @param props See AnswerInputProps.
 * @returns The typed answer and its keyboard.
 */
export function AnswerInput({ kind, onSubmit, secret = false }: AnswerInputProps) {
  const [text, setText] = useState('')
  const canSubmit = normalizeAnswer(text, kind).length > 0
  const keys: AnswerKeysProps = {
    onKey: (char) => setText((current) => appendToAnswer(current, char, kind)),
    onErase: () => setText((current) => current.slice(0, -1)),
    onSubmit: () => { if (canSubmit) onSubmit(text) },
    canSubmit,
  }
  return (
    <div className="answer-input">
      {/* A no-break space keeps the line height while nothing is typed. */}
      <output className={`typed typed--${kind}`} aria-label="Réponse tapée">{(secret ? '•'.repeat(text.length) : text) || ' '}</output>
      {kind === 'digits' ? <Keypad {...keys} /> : <LetterKeyboard {...keys} />}
    </div>
  )
}
