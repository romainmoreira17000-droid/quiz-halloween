/**
 * @file One padlock dial: a 3D drum of ten digits between an up and a down arrow. The drum is drawn for the
 * eye only; the digit itself stays in an `<output>` for screen readers and tests. Rolling motion in padlock.css.
 */
import { useState, type CSSProperties } from 'react'
import { DRUM_STEP_DEG, rollDrum, turnDial } from '../game/padlock'

/** Props of Dial. */
export interface DialProps {
  /** 1-based position, used in the accessible names. */
  position: number
  /** Digit shown (0–9). */
  value: number
  /** Called with the new digit after a turn. */
  onChange(value: number): void
}

const FACES = Array.from({ length: 10 }, (_, digit) => digit)

/**
 * One dial of the combination lock.
 * @param props See DialProps.
 * @returns The dial.
 */
export function Dial({ position, value, onChange }: DialProps) {
  const label = `Chiffre ${position}`
  // The angle is cumulative (not value × 36) so that 9 → 0 rolls on instead of spinning back.
  const [drum, setDrum] = useState({ digit: value, angle: value * DRUM_STEP_DEG })
  if (drum.digit !== value) setDrum({ digit: value, angle: rollDrum(drum.angle, drum.digit, value) })
  return (
    <div className="dial">
      <button type="button" aria-label={`${label} : augmenter`} onClick={() => onChange(turnDial(value, 1))}>▲</button>
      <div className="dial-window">
        <output className="dial-value" aria-label={label}>{value}</output>
        <div className="dial-drum" aria-hidden="true" style={{ '--drum-angle': `${drum.angle}deg` } as CSSProperties}>
          {FACES.map((digit) => (
            <span key={digit} className="dial-face" style={{ '--face-angle': `${digit * DRUM_STEP_DEG}deg` } as CSSProperties}>
              {digit}
            </span>
          ))}
        </div>
      </div>
      <button type="button" aria-label={`${label} : diminuer`} onClick={() => onChange(turnDial(value, -1))}>▼</button>
    </div>
  )
}
