/** @file Discreet reset icon: only a 3-second press triggers it, so children do not restart the game by accident. */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

/** How long the icon must be held. Keep in sync with the ring animation in reset.css. */
export const RESET_HOLD_MS = 3000

/** Props of ResetButton. */
export interface ResetButtonProps {
  /** Called once the icon has been held for RESET_HOLD_MS. */
  onLongPress(): void
}

const isPressKey = (event: KeyboardEvent) => event.key === 'Enter' || event.key === ' '

/**
 * Small pale icon, bottom left; a ring fills up while it is held.
 * @param props See ResetButtonProps.
 * @returns The reset button.
 */
export function ResetButton({ onLongPress }: ResetButtonProps) {
  const timer = useRef<number | null>(null)
  const [holding, setHolding] = useState(false)
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])

  const begin = () => {
    if (timer.current !== null) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      setHolding(false)
      onLongPress()
    }, RESET_HOLD_MS)
  }
  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }

  return (
    <button type="button" className={holding ? 'reset-button reset-button--holding' : 'reset-button'}
      aria-label="Recommencer la partie (appui long)"
      // Main button only: a held right click must not restart the game.
      onPointerDown={(event) => { if (event.button === 0) begin() }}
      onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      // A key released elsewhere (focus moved away) never sends keyup here.
      onBlur={stop}
      onKeyDown={(event) => { if (isPressKey(event) && !event.repeat) begin() }}
      onKeyUp={(event) => { if (isPressKey(event)) stop() }}
      // A long press on a tablet would otherwise open the copy/share menu.
      onContextMenu={(event) => event.preventDefault()}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="reset-ring" cx="32" cy="32" r="29" pathLength={100} />
        <path d="M20 32a12 12 0 1 0 3.5-8.5" />
        <path d="M23.5 16v7.5H16" />
      </svg>
    </button>
  )
}
