/** @file What the animator board reads from the database, checked field by field: the rows come from the network. */

/** One tablet's last news, as stored by push_team_state. */
export interface BoardEntry {
  team: string
  fingerprint: string
  /** Game state as sent by the tablet, unchecked here (see boardCard). */
  state: unknown
  /** Server time of the last news, in ms. */
  updatedAt: number
}

/** Answer of read_board, stamped with the phone's time when it arrived. */
export interface BoardSnapshot {
  /** Server time when it answered, in ms. */
  serverNow: number
  /** Phone time when the answer arrived, in ms: the silence of a tablet keeps counting between two reads. */
  receivedAt: number
  teams: BoardEntry[]
}

const isTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/**
 * Checks the answer of read_board.
 * @param data JSON returned by the function (anything).
 * @param receivedAt Phone time of the answer, in ms.
 * @returns The snapshot (malformed rows left out), or null when the answer itself is unusable.
 */
export function parseBoard(data: unknown, receivedAt: number): BoardSnapshot | null {
  if (typeof data !== 'object' || data === null) return null
  const { server_now: serverNow, teams } = data as Record<string, unknown>
  if (!isTime(serverNow) || !Array.isArray(teams)) return null
  const entries = teams.flatMap((row: unknown): BoardEntry[] => {
    if (typeof row !== 'object' || row === null) return []
    const { team, fingerprint, state, updated_at: updatedAt } = row as Record<string, unknown>
    return typeof team === 'string' && typeof fingerprint === 'string' && isTime(updatedAt)
      ? [{ team, fingerprint, state, updatedAt }] : []
  })
  return { serverNow, receivedAt, teams: entries }
}
