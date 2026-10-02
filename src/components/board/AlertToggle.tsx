/** @file « Activer les alertes »: phones only allow sound after a tap, and the same tap keeps the screen on. */
import type { WakeLockStatus } from '../../hooks/useWakeLock'

/**
 * @param props.enabled The alerts are on.
 * @param props.wakeLock See useWakeLock.
 * @param props.onEnable Turns them on; called inside the tap (sound allowed).
 * @returns The button, or the state of the alerts.
 */
export function AlertToggle({ enabled, wakeLock, onEnable }: { enabled: boolean; wakeLock: WakeLockStatus; onEnable(): void }) {
  if (!enabled) return <button type="button" className="seal-button board-alert-toggle" onClick={onEnable}>Activer les alertes</button>
  return <p className="board-alert-state">Alertes activées{wakeLock === 'unavailable' ? ' · Garde l’écran allumé' : ''}</p>
}
