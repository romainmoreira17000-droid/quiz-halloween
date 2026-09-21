/** @file One padlock dial: a digit between an up and a down arrow. */
import { turnDial } from '../game/padlock'

/** Props of Dial. */
export interface DialProps {
  /** 1-based position, used in the accessible names. */
  position: number
  /** Digit shown (0–9). */
  value: number
  /** Called with the new digit after a turn. */
  onChange(value: number): void
}

/**
 * One dial of the combination lock.
 * @param props See DialProps.
 * @returns The dial.
 */
export function Dial({ position, value, onChange }: DialProps) {
  const label = `Chiffre ${position}`
  return (
    <div className="dial">
      <button type="button" aria-label={`${label} : augmenter`} onClick={() => onChange(turnDial(value, 1))}>▲</button>
      <output aria-label={label}>{value}</output>
      <button type="button" aria-label={`${label} : diminuer`} onClick={() => onChange(turnDial(value, -1))}>▼</button>
    </div>
  )
}
