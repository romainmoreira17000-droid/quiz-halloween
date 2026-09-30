/** @file Asks for the evening code on the animator's phone. */
import { useState, type FormEvent } from 'react'

/**
 * Code form of the animator board.
 * @param props.refused Whether the last code was refused by the database.
 * @param props.onSubmit Called with the typed code.
 * @returns The form.
 */
export function BoardCodeForm({ refused, onSubmit }: { refused: boolean; onSubmit(code: string): void }) {
  const [code, setCode] = useState('')
  const submit = (event: FormEvent) => { event.preventDefault(); if (code.trim() !== '') onSubmit(code) }
  return (
    <form className="board-code" onSubmit={submit}>
      <h1>Suivi des équipes</h1>
      <label>
        Code de soirée
        <input type="text" value={code} autoComplete="off" autoCapitalize="characters" spellCheck={false}
          onChange={(event) => setCode(event.target.value)} />
      </label>
      {refused && <p className="board-error" role="alert">Code refusé.</p>}
      <button type="submit" className="seal-button">Ouvrir le tableau</button>
    </form>
  )
}
