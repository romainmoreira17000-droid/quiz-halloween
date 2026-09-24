/** @file Final padlock: digits found, optional hint, one dial per step and an "Ouvrir" button. */
import { useState, type ReactNode } from 'react'
import type { QuizStep } from '../config/types'
import { wrongCodeMessage } from '../game/messages'
import { Dial } from './Dial'

/** Title shown when quiz.yaml has no `cadenas.titre`. */
export const DEFAULT_PADLOCK_TITLE = 'Le cadenas'

/** Props of PadlockScreen. */
export interface PadlockScreenProps {
  /** In-game header (clock and candles). */
  header: ReactNode
  /** `cadenas.titre`, if any. */
  title?: string
  /** Steps of the quiz, in play order (their titles are recalled). */
  steps: readonly QuizStep[]
  /** Digit per step; all known once the padlock shows. */
  foundDigits: readonly (number | null)[]
  /** `cadenas.indice`, if any. */
  hint?: string
  /** Wrong codes so far. */
  wrongAttempts: number
  /** Called with the digits shown on the dials. */
  onOpen(code: number[]): void
}

/**
 * The combination lock of the haunted room.
 * @param props See PadlockScreenProps.
 * @returns The padlock screen.
 */
export function PadlockScreen(props: PadlockScreenProps) {
  const { header, title = DEFAULT_PADLOCK_TITLE, steps, foundDigits, hint, wrongAttempts, onOpen } = props
  // Dial positions are local: they survive a wrong code (only the shake zone remounts).
  const [code, setCode] = useState(() => steps.map(() => 0))
  const setDigit = (index: number, digit: number) => setCode((current) => current.map((d, i) => (i === index ? digit : d)))
  return (
    <main className="screen padlock">
      {header}
      <h2>{title}</h2>
      <ul className="recap" aria-label="Chiffres trouvés">
        {steps.map((step, i) => <li key={i}><span>{step.title}</span><b>{foundDigits[i]}</b></li>)}
      </ul>
      {hint && <p className="hint">{hint}</p>}
      {/* Changing key on each wrong code remounts the zone, which replays the shake animation. */}
      <div key={wrongAttempts} className={wrongAttempts > 0 ? 'lock-zone shake' : 'lock-zone'}>
        {wrongAttempts > 0 && <p className="wrong-answer" role="alert">{wrongCodeMessage(wrongAttempts)}</p>}
        <div className="dials">
          {code.map((digit, i) => <Dial key={i} position={i + 1} value={digit} onChange={(d) => setDigit(i, d)} />)}
        </div>
      </div>
      <button type="button" className="seal-button open-button" onClick={() => onOpen(code)}>Ouvrir</button>
    </main>
  )
}
