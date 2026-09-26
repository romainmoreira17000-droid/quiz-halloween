/** @file AZERTY letter keyboard drawn in the app: the system keyboard would hide half the screen. */
import type { AnswerKeysProps } from './Keypad'

const ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', "WXCVBN'-"]
/** The title font draws a long tail on Q: its key shifts the glyph left to keep it inside. */
const keyClass = (c: string) => (c === 'Q' ? 'key-q' : undefined)
/** Spoken names for the two keys whose glyph alone is unclear. */
const LABELS: Readonly<Record<string, string>> = { "'": 'Apostrophe', '-': 'Tiret' }

/**
 * Keyboard for answers made of words.
 * @param props See AnswerKeysProps.
 * @returns The keyboard.
 */
export function LetterKeyboard({ onKey, onErase, onSubmit, canSubmit, disabled = false }: AnswerKeysProps) {
  return (
    <div className="letter-keyboard">
      {ROWS.map((row) => (
        <div key={row} className="key-row">
          {[...row].map((c) => <button key={c} type="button" className={keyClass(c)} aria-label={LABELS[c]} disabled={disabled} onClick={() => onKey(c)}>{c}</button>)}
        </div>
      ))}
      <div className="key-row">
        <button type="button" className="key-space" disabled={disabled} onClick={() => onKey(' ')}>Espace</button>
        <button type="button" className="key-erase" aria-label="Effacer" disabled={disabled} onClick={onErase}>⌫</button>
        <button type="button" className="key-submit" disabled={disabled || !canSubmit} onClick={onSubmit}>Valider</button>
      </div>
    </div>
  )
}
