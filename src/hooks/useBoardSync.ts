/** @file Sends the tablet's game to the remote board: at every change, every 30 s, and when the network comes back. */
import { useEffect, useRef, useState } from 'react'
import { createLatestSender } from '../game/latestSender'
import { afterPush, type SyncStatus } from '../game/syncStatus'
import { boardApi, type BoardApi } from '../services/board'

/** Heartbeat: the board turns a card orange after two missed ones. */
export const HEARTBEAT_MS = 30_000

/** What the tablet sends. */
export interface BoardSyncInput {
  team: string
  fingerprint: string
  /** Game state; a new object means a change (useReducer keeps the same one otherwise). */
  state: unknown
  /** Evening code, null: remote board off. */
  code: string | null
}

interface Payload { team: string; fingerprint: string; state: unknown; code: string }

/**
 * Keeps the remote board up to date with this tablet. Failures never reach the game.
 * @param input See BoardSyncInput.
 * @param api Board calls (a fake in tests).
 * @returns Status for the animator menu.
 */
export function useBoardSync({ team, fingerprint, state, code }: BoardSyncInput, api: BoardApi = boardApi): SyncStatus {
  const active = api.enabled && code !== null
  const [status, setStatus] = useState<SyncStatus>({ kind: 'pending' })
  const [send] = useState(() => createLatestSender<Payload>(async (p) => {
    const result = await api.push(p.code, p.team, p.fingerprint, p.state)
    setStatus((previous) => afterPush(previous, result, Date.now()))
  }))
  const latest = useRef<Payload | null>(null)
  useEffect(() => {
    latest.current = active && code !== null ? { team, fingerprint, state, code } : null
    if (latest.current) send(latest.current)
  }, [active, team, fingerprint, state, code, send])
  useEffect(() => {
    if (!active) return
    const resend = () => { if (latest.current) send(latest.current) }
    const id = setInterval(resend, HEARTBEAT_MS)
    window.addEventListener('online', resend)
    return () => { clearInterval(id); window.removeEventListener('online', resend) }
  }, [active, send])
  return active ? status : { kind: 'off' }
}
