/**
 * @file Little ghost hanging from the padlock chain, as in cadenas.jpeg. Two nested groups: the outer one is
 * jolted by a right answer or flies away at the victory, the inner one swings all the time (lock.css).
 */

/** Props of HangingGhost. */
export interface HangingGhostProps {
  /** Top of the ghost's head; its string starts 16 units higher. */
  x: number
  y: number
}

/**
 * The ghost charm.
 * @param props See HangingGhostProps.
 * @returns An SVG group.
 */
export function HangingGhost({ x, y }: HangingGhostProps) {
  return (
    // The position is an attribute on its own group: a CSS transform on the animated groups would replace it.
    <g transform={`translate(${x} ${y})`}>
      <g className="lock-hanging-ghost">
        <g className="lock-ghost-swing">
          <line x1="0" y1="-16" x2="0" y2="0" stroke="#9a8f84" strokeWidth="1.5" />
          <path d="M0 0 c-7 0 -10 5 -10 11 v12 l3 -3 l3 3 l4 -3 l4 3 l3 -3 l3 3 v-12 c0 -6 -3 -11 -10 -11 z"
            fill="#f4efe6" stroke="#9a8f84" strokeWidth=".8" />
          <circle cx="-3.5" cy="9" r="1.8" fill="#1a0f08" />
          <circle cx="3.5" cy="9" r="1.8" fill="#1a0f08" />
        </g>
      </g>
    </g>
  )
}
