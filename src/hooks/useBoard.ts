/** @file Reads the remote board every 5 s while the page is visible (a phone in a pocket spends no battery on it). */
import { useEffect, useState } from 'react'
import type { BoardSnapshot } from '../game/boardSnapshot'
import type { BoardCallResult } from '../game/syncStatus'
import { boardApi, type BoardApi } from '../services/board'

/** Delay between two reads; the clocks of the cards tick on the phone in between. */
export const POLL_MS = 5_000

/** What the board knows. */
export interface BoardFeed {
  /** Last good answer, kept through failures. */
  snapshot: BoardSnapshot | null
  /** Result of the last read, null before the first answer. */
  last: BoardCallResult | null
  /** Phone time of the last good read, in ms. */
  okAt: number | null
}

/**
 * Keeps reading the board. Mount it again (React `key`) for another code.
 * @param code Evening code.
 * @param api Board calls (a fake in tests).
 * @returns See BoardFeed.
 */
export function useBoard(code: string, api: BoardApi = boardApi): BoardFeed {
  const [feed, setFeed] = useState<BoardFeed>({ snapshot: null, last: null, okAt: null })
  useEffect(() => {
    let cancelled = false
    let busy = false
    const read = async () => {
      // One read at a time (a slow one can outlast POLL_MS), and none while hidden:
      // visibilitychange reads again on return.
      if (busy || document.hidden) return
      busy = true
      try {
        const { result, snapshot } = await api.read(code)
        if (cancelled) return
        setFeed((previous) => (result === 'ok' ? { snapshot, last: result, okAt: Date.now() } : { ...previous, last: result }))
      } finally {
        busy = false
      }
    }
    void read()
    const id = setInterval(() => void read(), POLL_MS)
    const onVisible = () => { if (!document.hidden) void read() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [code, api])
  return feed
}
