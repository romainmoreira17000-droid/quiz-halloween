/** @file « Indice » button of a challenge: greyed with its countdown, then opens the unlocked hints in a window. */
import { useEffect, useRef, useState } from 'react'
import { formatClock } from '../game/time'

/** Props of HintButton. */
export interface HintButtonProps {
  /** `indices` of the step (at least one). */
  hints: readonly string[]
  /** Hints available now (0..hints.length). */
  available: number
  /** Seconds before the next hint, null when none is left to come. */
  secondsToNext: number | null
}

/** @returns The button text: countdown before the first hint, then how many are unlocked out of the step's. */
function buttonLabel(total: number, available: number, secondsToNext: number | null): string {
  if (available === 0) return `Indice dans ${formatClock(secondsToNext ?? 0)}`
  if (total === 1) return 'Voir l’indice'
  return available === 1 ? `Voir l’indice (1/${total})` : `Voir les indices (${available}/${total})`
}

/**
 * Hints on demand, free, readable as often as the group wants; the open window follows new hints.
 * @param props See HintButtonProps.
 * @returns The button, and the window while it is open.
 */
export function HintButton({ hints, available, secondsToNext }: HintButtonProps) {
  const [open, setOpen] = useState(false)
  const next = available < hints.length ? secondsToNext : null
  return (
    <>
      <button type="button" className="hint-button" disabled={available === 0} onClick={() => setOpen(true)}>
        {buttonLabel(hints.length, available, secondsToNext)}
      </button>
      {open && (
        <HintDialog title={hints.length === 1 ? 'Indice' : 'Indices'} hints={hints.slice(0, available)}
          secondsToNext={next} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

interface HintDialogProps { title: string; hints: readonly string[]; secondsToNext: number | null; onClose(): void }

/** Window over the screen (the step screen has no free line for the text); « Fermer » focused, Escape closes. */
function HintDialog({ title, hints, secondsToNext, onClose }: HintDialogProps) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => { close.current?.focus() }, [])
  return (
    <div className="hint-overlay">
      <div className="hint-dialog" role="dialog" aria-modal="true" aria-labelledby="hint-title"
        onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
        <h2 id="hint-title">{title}</h2>
        <ol className="hint-list">{hints.map((hint, i) => <li key={i}>{hint}</li>)}</ol>
        {secondsToNext !== null && <p className="hint-next">Indice suivant dans {formatClock(secondsToNext)}</p>}
        <button type="button" className="seal-button" ref={close} onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
