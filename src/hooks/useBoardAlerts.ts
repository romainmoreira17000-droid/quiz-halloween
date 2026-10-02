/** @file Alerts of the animator board: a new need rings once and stays in the banner until « Vu » or until it is over. */
import { useEffect, useRef, useState } from 'react'
import { activeAlerts, newAlerts, type BoardAlert } from '../game/boardAlerts'
import type { TeamCardView } from '../game/boardCard'

/** Options of useBoardAlerts. */
export interface BoardAlertsOptions {
  /** The board has read the database at least once (before, every card is blank). */
  ready: boolean
  /** See activeAlerts. */
  online: boolean
  /** Rings and vibrates; called once per change that brings new needs. */
  onNew(): void
}

/** What the board shows of the alerts. */
export interface BoardAlerts {
  /** New needs not marked « Vu », oldest first. */
  pending: BoardAlert[]
  /** Teams with a need right now (red card), seen or not. */
  alertTeams: ReadonlySet<string>
  /** Marks an alert « Vu ». */
  dismiss(key: string): void
}

/**
 * Follows the needs of the teams from one render to the next.
 * @param cards Cards of the board.
 * @param options See BoardAlertsOptions.
 * @returns See BoardAlerts.
 */
export function useBoardAlerts(cards: readonly TeamCardView[], options: BoardAlertsOptions): BoardAlerts {
  const active = activeAlerts(cards, options.online)
  // The cards are rebuilt every second (clock): only a change of needs is worth an update.
  const signature = active.map((alert) => alert.key).join('\n')
  const previous = useRef<BoardAlert[] | null>(null)
  const latest = useRef({ active, onNew: options.onNew })
  const [pending, setPending] = useState<BoardAlert[]>([])
  // Declared first, so it runs before the effect below in the same commit.
  useEffect(() => { latest.current = { active, onNew: options.onNew } })
  useEffect(() => {
    if (!options.ready) return
    const now = latest.current.active
    const fresh = newAlerts(previous.current, now)
    previous.current = now
    setPending((list) => [...list.filter((alert) => now.some((still) => still.key === alert.key)), ...fresh])
    if (fresh.length > 0) latest.current.onNew()
  }, [signature, options.ready])
  return {
    pending,
    alertTeams: new Set(active.map((alert) => alert.team)),
    dismiss: (key) => setPending((list) => list.filter((alert) => alert.key !== key)),
  }
}
