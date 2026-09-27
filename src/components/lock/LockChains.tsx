/**
 * @file Two rusty chains crossed over a padlock. They hang there while the lock is shut and fall once it
 * opens (`lock-chains--fallen`, motion in lock.css). Paint comes from LockDefs (`lock-chain`).
 */

/** Rectangle the chains are stretched across, in the lock's viewBox units. */
export interface ChainBox {
  x: number
  y: number
  width: number
  height: number
}

/** Props of LockChains. */
export interface LockChainsProps {
  /** Rectangle the two chains cross, corner to corner. */
  box: ChainBox
  /** True once the lock is open: the chains drop away. */
  fallen?: boolean
}

const LINK_LENGTH = 9
/** Links overlap a little, like a real chain. */
const LINK_STEP = 13

interface Link { cx: number, cy: number, face: boolean }

/** @returns The links of a straight chain from one point to another, alternately seen flat and edge-on. */
function linksBetween(x1: number, y1: number, x2: number, y2: number): Link[] {
  const count = Math.max(2, Math.floor(Math.hypot(x2 - x1, y2 - y1) / LINK_STEP) + 1)
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    return { cx: x1 + (x2 - x1) * t, cy: y1 + (y2 - y1) * t, face: i % 2 === 0 }
  })
}

/**
 * Chains crossed in an X over a padlock, as pure decoration.
 * @param props See LockChainsProps.
 * @returns An SVG group, hidden from screen readers.
 */
export function LockChains({ box, fallen = false }: LockChainsProps) {
  // Inset by a link so that no link sticks out of the box.
  const left = box.x + LINK_LENGTH
  const right = box.x + box.width - LINK_LENGTH
  const top = box.y + LINK_LENGTH
  const bottom = box.y + box.height - LINK_LENGTH
  const chains = [[left, top, right, bottom], [right, top, left, bottom]]
  return (
    <g className={fallen ? 'lock-chains lock-chains--fallen' : 'lock-chains'} aria-hidden="true">
      {chains.map(([x1, y1, x2, y2], index) => {
        const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
        return (
          <g key={index} className={`lock-chain lock-chain--${index === 0 ? 'left' : 'right'}`}>
            {linksBetween(x1, y1, x2, y2).map(({ cx, cy, face }, i) => (
              <ellipse key={i} className="lock-chain-link" cx={cx} cy={cy} rx={LINK_LENGTH} ry={face ? 5 : 2}
                transform={`rotate(${angle} ${cx} ${cy})`} fill="none" stroke="url(#lock-chain)" strokeWidth={face ? 3 : 4} />
            ))}
          </g>
        )
      })}
    </g>
  )
}
