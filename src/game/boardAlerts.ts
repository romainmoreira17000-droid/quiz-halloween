/** @file Which teams need an animator now, and which of those needs are new since the previous read of the board. */
import type { TeamCardView } from './boardCard'

/** Wrong answers in one slot after which a team probably needs help. */
export const ALERT_WRONG_ATTEMPTS = 3
/** Age of the last good read after which the board itself is stale: every tablet would look silent. */
export const BOARD_FRESH_MS = 15_000

/** timeUp: an animator must give the digit; silent: no news from the tablet; wrong: many wrong answers. */
export type AlertKind = 'timeUp' | 'silent' | 'wrong'

/** One need; `key` names it, so the same need rings only once. */
export interface BoardAlert { key: string; team: string; kind: AlertKind; text: string }

/**
 * Needs of every team right now.
 * @param cards Cards of the board (see boardCards).
 * @param online The board read the database lately; otherwise the silences are the phone's, not the tablets'.
 * @returns The alerts, team by team.
 */
export function activeAlerts(cards: readonly TeamCardView[], online: boolean): BoardAlert[] {
  return cards.flatMap((card) => {
    const alerts: BoardAlert[] = []
    const add = (kind: AlertKind, detail: string, text: string) =>
      alerts.push({ key: `${card.team}|${kind}|${detail}`, team: card.team, kind, text: `${card.team} : ${text}` })
    const title = card.challengeTitle ?? ''
    if (card.status === 'timeUp') add('timeUp', title, `Temps écoulé (${title})`)
    if (online && card.freshness === 'silent') add('silent', '', 'plus de nouvelles depuis 2 min')
    // Fixed text: the key stays the same while the count goes up, so the banner line does not change either.
    if (card.status === 'challenge' && card.wrongAttempts >= ALERT_WRONG_ATTEMPTS) {
      add('wrong', title, `${ALERT_WRONG_ATTEMPTS} mauvaises réponses (${title})`)
    }
    return alerts
  })
}

/**
 * Alerts that were not there at the previous read.
 * @param previous Alerts of the previous read, null before the first one (nothing rings on opening the board).
 * @param current Alerts now.
 * @returns The new ones.
 */
export function newAlerts(previous: readonly BoardAlert[] | null, current: readonly BoardAlert[]): BoardAlert[] {
  if (previous === null) return []
  return current.filter((alert) => !previous.some((old) => old.key === alert.key))
}
