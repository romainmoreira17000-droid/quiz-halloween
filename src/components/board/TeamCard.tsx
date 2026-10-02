/** @file One team on the animator board: where it is, its clock, its digits and what needs an animator. */
import type { CardStatus, TeamCardView } from '../../game/boardCard'
import { timeOfDay } from '../../game/startTime'
import { formatClock } from '../../game/time'
import { CardHints } from './CardHints'
import { CardSolution } from './CardSolution'
import { plural } from './plural'
import { TeamDigits } from './TeamDigits'

const STATUS: Record<CardStatus, string> = {
  unseen: 'Aucune nouvelle', otherVersion: 'Version différente', home: 'Pas commencé', entrance: 'Devant l’entrée',
  challenge: 'En épreuve', waiting: 'Chiffre trouvé, attente', timeUp: 'Temps écoulé', padlock: 'Au cadenas', won: 'Victoire',
}

/**
 * Card of one team.
 * @param props.view What to show (see boardCards).
 * @param props.alert The team needs an animator: red card.
 * @returns An article named after the team.
 */
export function TeamCard({ view, alert = false }: { view: TeamCardView; alert?: boolean }) {
  const status = view.status === 'won' && view.finishedAt !== null ? `Victoire à ${timeOfDay(view.finishedAt)}` : STATUS[view.status]
  const alerts = [
    view.blockedSeconds > 0 && `Bloquée ${formatClock(view.blockedSeconds)}`,
    view.wrongAttempts > 0 && plural(view.wrongAttempts, 'mauvaise réponse', 'mauvaises réponses'),
    view.offsetMinutes !== null && `Décalée de ${Math.abs(view.offsetMinutes)} min`,
  ].filter((alert): alert is string => typeof alert === 'string')
  return (
    <article className={`team-card team-card--${view.freshness ?? 'unseen'} team-card--${view.status}${alert ? ' team-card--alert' : ''}`} aria-label={view.team}>
      <header className="team-card-head">
        <h2>{view.team}</h2>
        {view.silentSeconds !== null && (
          <span className="team-card-news">{view.freshness === 'fresh' ? 'à l’instant' : `il y a ${Math.floor(view.silentSeconds / 60)} min`}</span>
        )}
      </header>
      <p className="team-card-status">{status}</p>
      {view.challengeTitle && (
        <p className="team-card-challenge">
          <span>{view.challengeTitle}</span>
          {view.slotSecondsLeft !== null && <b>{formatClock(view.slotSecondsLeft)}</b>}
        </p>
      )}
      <TeamDigits track={view.track} />
      {view.hints && <CardHints shown={view.hints.shown} total={view.hints.total} texts={view.hintTexts} />}
      {view.solution && <CardSolution key={view.challengeTitle ?? ''} solution={view.solution} />}
      {alerts.length > 0 && <ul className="team-card-alerts">{alerts.map((alert) => <li key={alert}>{alert}</li>)}</ul>}
    </article>
  )
}
