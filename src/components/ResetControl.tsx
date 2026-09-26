/** @file Reset icon shown on every screen, with its confirmation window. */
import { useState } from 'react'
import { ResetButton } from './ResetButton'
import { ResetDialog } from './ResetDialog'

/** Props of ResetControl. */
export interface ResetControlProps {
  /** Restarts the game (called only after the confirmation). */
  onReset(): void
  /** When given, a third button sets the tablet up for another team (the animator code is asked next). */
  onChangeTeam?(): void
  /** See ResetDialogProps.animatorCode. */
  animatorCode?: string
}

/**
 * Long press on the icon, then confirmation.
 * @param props See ResetControlProps.
 * @returns The icon, and the window while asking.
 */
export function ResetControl({ onReset, onChangeTeam, animatorCode }: ResetControlProps) {
  const [asking, setAsking] = useState(false)
  return (
    <>
      <ResetButton onLongPress={() => setAsking(true)} />
      {asking && (
        <ResetDialog animatorCode={animatorCode} onCancel={() => setAsking(false)} onConfirm={() => { setAsking(false); onReset() }}
          onChangeTeam={onChangeTeam && (() => { setAsking(false); onChangeTeam() })} />
      )}
    </>
  )
}
