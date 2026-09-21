/** @file Victory: the haunted door opens, then the victory message and the time taken. */
import type { ReactNode } from 'react'
import { formatDuration } from '../game/time'
import { HauntedDoor } from './HauntedDoor'

/** Message shown when quiz.yaml has no `cadenas.message_victoire`. */
export const DEFAULT_VICTORY_MESSAGE = 'Le cadenas est ouvert !'

/** Props of VictoryScreen. */
export interface VictoryScreenProps {
  /** In-game header, with the clock frozen. */
  header: ReactNode
  /** `cadenas.message_victoire`, if any. */
  message?: string
  /** Time the group took. */
  elapsedSeconds: number
}

/**
 * Last screen of the game.
 * @param props See VictoryScreenProps.
 * @returns The victory screen.
 */
export function VictoryScreen({ header, message = DEFAULT_VICTORY_MESSAGE, elapsedSeconds }: VictoryScreenProps) {
  return (
    <main className="screen victory">
      {header}
      <HauntedDoor />
      <div className="victory-text">
        <h2>{message}</h2>
        <p className="final-time">Temps : {formatDuration(elapsedSeconds)}</p>
      </div>
    </main>
  )
}
