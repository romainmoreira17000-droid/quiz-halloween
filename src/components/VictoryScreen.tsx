/** @file Victory: the haunted door opens, then the victory message and where every team meets. */
import type { ReactNode } from 'react'
import { HauntedDoor } from './HauntedDoor'

/** Message shown when quiz.yaml has no `cadenas.message_victoire`. */
export const DEFAULT_VICTORY_MESSAGE = 'Le cadenas est ouvert !'

/** Props of VictoryScreen. */
export interface VictoryScreenProps {
  /** In-game header (candles only: every team finishes at the same time). */
  header: ReactNode
  /** `cadenas.message_victoire`, if any. */
  message?: string
}

/**
 * Last screen of the game.
 * @param props See VictoryScreenProps.
 * @returns The victory screen.
 */
export function VictoryScreen({ header, message = DEFAULT_VICTORY_MESSAGE }: VictoryScreenProps) {
  return (
    <main className="screen victory">
      {header}
      <HauntedDoor />
      <div className="victory-text">
        <h2>{message}</h2>
        <p className="meeting-point">Rendez-vous à la porte du restaurant !</p>
      </div>
    </main>
  )
}
