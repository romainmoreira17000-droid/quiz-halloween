/** @file New needs of the teams, at the top of the board, each until the animator taps « Vu ». */
import type { BoardAlert } from '../../game/boardAlerts'

/**
 * @param props.alerts Pending alerts (see useBoardAlerts).
 * @param props.onSeen Called with the key of the alert marked « Vu ».
 * @returns The list, or nothing without alerts.
 */
export function AlertBanner({ alerts, onSeen }: { alerts: readonly BoardAlert[]; onSeen(key: string): void }) {
  if (alerts.length === 0) return null
  // aria-live rather than role="alert": the board already has an alert for a failed « Nouvelle soirée ».
  return (
    <ul className="board-alerts" aria-label="Alertes" aria-live="assertive">
      {alerts.map((alert) => (
        <li key={alert.key}>
          <span>{alert.text}</span>
          <button type="button" className="ghost-button" onClick={() => onSeen(alert.key)}>Vu</button>
        </li>
      ))}
    </ul>
  )
}
