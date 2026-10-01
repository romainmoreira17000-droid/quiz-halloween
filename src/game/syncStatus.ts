/** @file Where the remote follow-up of a tablet stands, and the words the animator menu uses for it. */

/** What a call to the remote board gave: done, evening code refused, or anything else (network, server). */
export type BoardCallResult = 'ok' | 'refused' | 'failed'

/** Remote follow-up of a tablet. */
export type SyncStatus =
  /** No evening code, or no Supabase settings in the build. */
  | { kind: 'off' }
  /** First send not answered yet. */
  | { kind: 'pending' }
  | { kind: 'connected' }
  | { kind: 'refused' }
  /** Failing since `since` (ms, first failure of the run). */
  | { kind: 'failing'; since: number }

/**
 * Status after a send.
 * @param previous Status before.
 * @param result Result of the send.
 * @param now Tablet time, in ms.
 * @returns The new status; a run of failures keeps the time of its first one.
 */
export function afterPush(previous: SyncStatus, result: BoardCallResult, now: number): SyncStatus {
  // Same object when nothing changes, so the hook does not re-render after every heartbeat.
  if (result === 'ok') return previous.kind === 'connected' ? previous : { kind: 'connected' }
  if (result === 'refused') return previous.kind === 'refused' ? previous : { kind: 'refused' }
  return previous.kind === 'failing' ? previous : { kind: 'failing', since: now }
}

/**
 * Words of the « Suivi à distance » line of the animator menu.
 * @param status Status of the tablet.
 * @param now Tablet time, in ms.
 * @returns For example "connecté" or "hors ligne depuis 2 min".
 */
export function syncStatusLabel(status: SyncStatus, now: number): string {
  switch (status.kind) {
    case 'off': return 'désactivé'
    case 'pending': return 'connexion…'
    case 'connected': return 'connecté'
    case 'refused': return 'code de soirée refusé'
    case 'failing': {
      const minutes = Math.floor((now - status.since) / 60_000)
      return minutes < 1 ? 'hors ligne' : `hors ligne depuis ${minutes} min`
    }
  }
}
