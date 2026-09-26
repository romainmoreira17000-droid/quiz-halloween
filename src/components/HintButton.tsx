/** @file « Indice » button of a challenge: greyed with its countdown, then opens the hint in a window. */
import { useEffect, useRef, useState } from 'react'
import { formatClock } from '../game/time'

/** Props of HintButton. */
export interface HintButtonProps {
  /** `indice` of the step. */
  hint: string
  /** Seconds before the hint unlocks in this slot; 0 once available. */
  secondsLeft: number
}

/**
 * Hint on demand, free, readable as often as the group wants.
 * @param props See HintButtonProps.
 * @returns The button, and the window while it is open.
 */
export function HintButton({ hint, secondsLeft }: HintButtonProps) {
  const [open, setOpen] = useState(false)
  const ready = secondsLeft <= 0
  return (
    <>
      <button type="button" className="hint-button" disabled={!ready} onClick={() => setOpen(true)}>
        {ready ? 'Voir l’indice' : `Indice dans ${formatClock(secondsLeft)}`}
      </button>
      {open && <HintDialog hint={hint} onClose={() => setOpen(false)} />}
    </>
  )
}

/** Window over the screen (the step screen has no free line for the text); « Fermer » focused, Escape closes. */
function HintDialog({ hint, onClose }: { hint: string; onClose(): void }) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => { close.current?.focus() }, [])
  return (
    <div className="hint-overlay">
      <div className="hint-dialog" role="dialog" aria-modal="true" aria-labelledby="hint-title"
        onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
        <h2 id="hint-title">Indice</h2>
        <p className="hint-text">{hint}</p>
        <button type="button" className="seal-button" ref={close} onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
