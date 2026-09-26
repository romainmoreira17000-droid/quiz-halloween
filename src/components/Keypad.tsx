/** @file Digit keypad of wax-seal buttons, phone layout: 1–9, then Effacer, 0, Valider. */

/** Props shared by both answer keyboards. */
export interface AnswerKeysProps {
  /** Called with the pressed character. */
  onKey(char: string): void
  onErase(): void
  onSubmit(): void
  /** False while the typed answer is empty (Valider is then disabled). */
  canSubmit: boolean
  /** Every key disabled (keyboard blocked after a wrong answer). */
  disabled?: boolean
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Keypad for answers made of digits.
 * @param props See AnswerKeysProps.
 * @returns The keypad.
 */
export function Keypad({ onKey, onErase, onSubmit, canSubmit, disabled = false }: AnswerKeysProps) {
  return (
    <div className="keypad">
      {DIGITS.map((d) => <button key={d} type="button" disabled={disabled} onClick={() => onKey(d)}>{d}</button>)}
      <button type="button" className="key-erase" aria-label="Effacer" disabled={disabled} onClick={onErase}>⌫</button>
      <button type="button" disabled={disabled} onClick={() => onKey('0')}>0</button>
      <button type="button" className="key-submit" disabled={disabled || !canSubmit} onClick={onSubmit}>Valider</button>
    </div>
  )
}
