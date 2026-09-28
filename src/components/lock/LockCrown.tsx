/**
 * @file Top of the Halloween padlocks, in the 300-wide viewBox of the locks: the bronze shackle (drawn behind the
 * body) and the crown drawn over the body's top edge (bat wings and a lit pumpkin). Motion in lock.css.
 */

/** Props of LockShackle. */
export interface LockShackleProps {
  /** Class the screen animates (cutaway-shackle, victory-lock-shackle, ...). */
  className: string
  /** Where the legs end; longer legs stay hidden in the body once the shackle springs up. */
  legBottom?: number
}

/**
 * The bronze shackle. Draw it before the body, which hides its legs.
 * @param props See LockShackleProps.
 * @returns An SVG group.
 */
export function LockShackle({ className, legBottom = 104 }: LockShackleProps) {
  const d = `M100 ${legBottom} V66 a50 50 0 0 1 100 0 V${legBottom}`
  return (
    <g className={className}>
      <path d={d} fill="none" stroke="#2a1b0b" strokeWidth="20" />
      <path d={d} fill="none" stroke="url(#lock-bronze)" strokeWidth="14" />
      <path d="M96 70 a54 54 0 0 1 40 -48" fill="none" stroke="#fff3c4" strokeOpacity=".45" strokeWidth="2" />
    </g>
  )
}

/** Left wing; the right one is its mirror image. */
const WING = 'M136 96 Q112 72 64 78 Q78 88 74 100 Q88 94 94 106 Q104 98 112 108 Q122 100 136 104 Z'

/**
 * Bat wings and pumpkin on top of the body. Draw it after the body.
 * @returns An SVG group.
 */
export function LockCrown() {
  return (
    <g className="lock-crown">
      {['left', 'right'].map((side) => (
        <path key={side} className="lock-wing" d={WING} fill="#24150f" stroke="url(#lock-bronze)" strokeWidth="2"
          transform={side === 'right' ? 'translate(300 0) scale(-1 1)' : undefined} />
      ))}
      {/* Invisible until a right answer or the victory lights it (lock.css). */}
      <circle className="lock-flare" cx="150" cy="88" r="30" fill="url(#lock-glow)" />
      <rect x="147" y="68" width="6" height="8" rx="2" fill="#3f5a1e" />
      <ellipse cx="150" cy="89" rx="17" ry="14" fill="url(#lock-pumpkin)" />
      <ellipse cx="150" cy="89" rx="7" ry="14" fill="none" stroke="#8a3208" strokeOpacity=".6" />
      <g className="lock-pumpkin-face">
        <path className="lock-eye lock-eye--pumpkin" d="M141 86 l4 -6 l4 6 z" fill="#ffd36b" />
        <path className="lock-eye lock-eye--pumpkin" d="M151 86 l4 -6 l4 6 z" fill="#ffd36b" />
        <path d="M141 93 l3 3 l3 -2 l3 3 l3 -3 l3 2 l3 -3 q-9 8 -18 0 z" fill="#ffd36b" />
      </g>
    </g>
  )
}
