/** @file Keeps the animator's screen on: a sleeping phone pauses the page, so the board stops reading and ringing. */
import { useEffect, useState } from 'react'

/** off: not asked; on: the screen stays on; unavailable: the animator must keep it on by hand. */
export type WakeLockStatus = 'off' | 'on' | 'unavailable'

/**
 * Asks the phone to keep the screen on while `wanted`, again each time the page comes back (the lock is lost when
 * the page is hidden).
 * @param wanted The alerts are on.
 * @returns See WakeLockStatus.
 */
export function useWakeLock(wanted: boolean): WakeLockStatus {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [status, setStatus] = useState<'off' | 'on' | 'refused'>('off')
  useEffect(() => {
    if (!wanted || !supported) return
    let cancelled = false
    let sentinel: WakeLockSentinel | null = null
    const request = () => {
      if (document.hidden) return
      navigator.wakeLock.request('screen').then(
        (lock) => { if (cancelled) void lock.release(); else { sentinel = lock; setStatus('on') } },
        () => { if (!cancelled) setStatus('refused') },
      )
    }
    request()
    const onVisible = () => { if (!document.hidden) request() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVisible); void sentinel?.release() }
  }, [wanted, supported])
  if (!wanted) return 'off'
  return !supported || status === 'refused' ? 'unavailable' : status
}
