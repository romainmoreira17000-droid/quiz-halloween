/** @file Full-screen « Bravo ! » shown for a moment when a challenge is solved: the earned digit grows, bats fly off. */
import type { CSSProperties } from 'react'

/** Where a bat ends up, relative to the screen centre (px), and when it leaves (s). */
interface Flight { dx: number; dy: number; delay: number }

const BATS: Flight[] = [
  { dx: -340, dy: -300, delay: 0.2 }, { dx: 320, dy: -340, delay: 0.3 }, { dx: -380, dy: 60, delay: 0.5 },
  { dx: 360, dy: 20, delay: 0.6 }, { dx: -120, dy: -460, delay: 0.8 }, { dx: 160, dy: -440, delay: 0.9 },
]

/** @returns Inline style feeding the shared `fly-out` keyframes of victory.css. */
function flight({ dx, dy, delay }: Flight): CSSProperties {
  return { '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${delay}s` } as CSSProperties
}

/** Props of CelebrationOverlay. */
export interface CelebrationOverlayProps {
  /** Padlock digit just earned. */
  digit: number
  /** Called on a tap anywhere: the children may close it before it goes away on its own. */
  onDismiss(): void
}

/**
 * The celebration overlay (timing in celebration.css).
 * @param props See CelebrationOverlayProps.
 * @returns A dialog named « Bravo ! » covering the screen.
 */
export function CelebrationOverlay({ digit, onDismiss }: CelebrationOverlayProps) {
  return (
    <div className="celebration" role="dialog" aria-label="Bravo !" onClick={onDismiss}>
      <div className="celebration-bats" aria-hidden="true">
        {BATS.map((f, i) => (
          <svg key={i} className="bat" style={flight(f)} viewBox="0 0 64 24">
            <path d="M32 9L36 3L38 9Q48 2 64 6Q56 10 54 18Q48 14 42 19Q37 16 32 22Q27 16 22 19Q16 14 10 18Q8 10 0 6Q16 2 26 9L28 3Z" />
          </svg>
        ))}
      </div>
      <p className="celebration-title">Bravo !</p>
      <p className="celebration-digit">{digit}</p>
      <p className="celebration-text">Un chiffre de plus pour le cadenas</p>
    </div>
  )
}
