/** @file 0–9 keypad of wax-seal buttons, laid out like a phone (0 under 8). */

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

/** Props of Keypad. */
export interface KeypadProps { onDigit(digit: number): void }

/**
 * Ten big digit buttons.
 * @param props.onDigit Called with the pressed digit.
 * @returns The keypad.
 */
export function Keypad({ onDigit }: KeypadProps) {
  return (
    <div className="keypad">
      {DIGITS.map((d) => <button key={d} type="button" onClick={() => onDigit(d)}>{d}</button>)}
    </div>
  )
}
