/** @file Solution of the challenge in play, hidden by default: a child may be looking at the animator's phone. */
import { useState } from 'react'
import type { CardSolution as Solution } from '../../game/boardCard'

/**
 * Mount it with `key` = challenge title, so it closes again when the team moves on.
 * @param props.solution Answer and digit of the challenge.
 * @returns A button, and the solution once asked.
 */
export function CardSolution({ solution }: { solution: Solution }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card-solution">
      <button type="button" className="ghost-button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Cacher la solution' : 'Voir la solution'}
      </button>
      {open && <p>Réponse : <b>{solution.answer}</b> · Chiffre : <b>{solution.digit}</b></p>}
    </div>
  )
}
