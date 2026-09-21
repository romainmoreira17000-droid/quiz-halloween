/**
 * @file Decorative victory animation: the padlock springs open, the double door of the haunted
 * restaurant swings in, candlelight spills out, ghosts and bats escape. Pure markup; timing in victory.css.
 */
import type { CSSProperties } from 'react'

/** Where a flyer ends up, relative to the doorway centre (px), and when it leaves (s). */
interface Flight { dx: number; dy: number; delay: number }

const GHOSTS: Flight[] = [{ dx: -300, dy: -260, delay: 2.2 }, { dx: 280, dy: -300, delay: 2.6 }, { dx: 40, dy: -420, delay: 3 }]
const BATS: Flight[] = [
  { dx: -380, dy: -80, delay: 2 }, { dx: 360, dy: -140, delay: 2.3 },
  { dx: -200, dy: -380, delay: 2.8 }, { dx: 220, dy: -360, delay: 3.2 },
]

/** @returns Inline style feeding the shared `fly-out` keyframes. */
function flight({ dx, dy, delay }: Flight): CSSProperties {
  return { '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${delay}s` } as CSSProperties
}

/**
 * The haunted restaurant's door, opening.
 * @returns Decorative markup, hidden from screen readers.
 */
export function HauntedDoor() {
  return (
    <div className="haunted-door" aria-hidden="true">
      <div className="doorway">
        <div className="door-glow" />
        <div className="door door--left" />
        <div className="door door--right" />
      </div>
      <div className="lock"><span className="lock-shackle" /><span className="lock-body" /></div>
      {GHOSTS.map((f, i) => (
        <svg key={`g${i}`} className="ghost" style={flight(f)} viewBox="0 0 40 50">
          <path d="M20 2C9 2 2 11 2 22v26l6-5 6 5 6-5 6 5 6-5 6 5V22C38 11 31 2 20 2z" />
          <circle className="ghost-eye" cx="14" cy="20" r="3.5" />
          <circle className="ghost-eye" cx="26" cy="20" r="3.5" />
        </svg>
      ))}
      {BATS.map((f, i) => (
        <svg key={`b${i}`} className="bat" style={flight(f)} viewBox="0 0 64 24">
          <path d="M32 9L36 3L38 9Q48 2 64 6Q56 10 54 18Q48 14 42 19Q37 16 32 22Q27 16 22 19Q16 14 10 18Q8 10 0 6Q16 2 26 9L28 3Z" />
        </svg>
      ))}
    </div>
  )
}
