/** @file Top of the animator board: the start most tablets agree on and when the teams change challenge. */
import type { BoardClock } from '../../game/boardClock'
import { formatClock } from '../../game/time'

/**
 * Shared clock of the evening.
 * @param props.clock See boardClock, null without a game in progress.
 * @param props.stepCount Number of challenges.
 * @returns The header.
 */
export function BoardHeader({ clock, stepCount }: { clock: BoardClock | null; stepCount: number }) {
  return (
    <header className="board-header">
      <h1>Suivi des équipes</h1>
      {clock === null ? <p>Aucune partie en cours.</p> : (
        <p>
          Départ {clock.start} · Temps écoulé {formatClock(clock.elapsedSeconds)}
          {clock.slot === null || clock.secondsLeft === null
            ? ' · Toutes les épreuves sont finies'
            : <> · Épreuve {clock.slot + 1}/{stepCount} · Changement d’épreuve dans <b>{formatClock(clock.secondsLeft)}</b></>}
        </p>
      )}
    </header>
  )
}
