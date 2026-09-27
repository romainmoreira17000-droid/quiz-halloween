/** @file « Départ de la partie » of the animator menu: lines a late or early tablet up with the others. */
import { useState, type FormEvent } from 'react'

/** Props of StartTime. */
export interface StartTimeProps {
  /** Start time now, "hh:mm". */
  value: string
  /** Tries a new start time ("hh:mm"); false when refused (still to come). */
  onSet(text: string): boolean
  /** Closes the menu once the time is changed, so the animator sees the right room at once. */
  onDone(): void
}

/**
 * Time field with the tablet's own time picker, and the button that applies it.
 * @param props See StartTimeProps.
 * @returns The labelled field, its button and, after a refused time, why.
 */
export function StartTime({ value, onSet, onDone }: StartTimeProps) {
  const [text, setText] = useState(value)
  const [refused, setRefused] = useState(false)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (onSet(text)) onDone()
    else setRefused(true)
  }
  return (
    <form className="animator-start" onSubmit={submit}>
      <label>
        Départ de la partie
        <input type="time" value={text} required onChange={(event) => { setText(event.target.value); setRefused(false) }} />
      </label>
      {refused && <p role="alert" className="animator-warning">Cette heure n’est pas encore passée.</p>}
      <button type="submit" className="ghost-button">Recaler l’heure de départ</button>
    </form>
  )
}
