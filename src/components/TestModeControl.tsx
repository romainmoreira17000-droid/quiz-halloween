/** @file Test mode (`?test`): a badge so nobody mistakes it for a real game, and the skip button. */

/** Props of TestModeControl. */
export interface TestModeControlProps {
  /** Ends the current slot now; without it (home, time up, padlock) only the badge shows. */
  onSkip?(): void
}

/**
 * Bottom right, facing the reset icon: it stays in the free strip at the bottom of the screens.
 * @param props See TestModeControlProps.
 * @returns The badge, and the skip button when skipping is possible.
 */
export function TestModeControl({ onSkip }: TestModeControlProps) {
  return (
    <div className="test-mode">
      <p className="test-mode-badge">Mode test</p>
      {onSkip && (
        <button type="button" className="test-mode-skip" onClick={onSkip}>
          Épreuve suivante <span aria-hidden="true">⏭</span>
        </button>
      )}
    </div>
  )
}
