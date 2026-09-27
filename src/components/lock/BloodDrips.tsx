/**
 * @file Blood running down a padlock: fixed drips, plus one drop that slowly beads under the first
 * drip and falls (motion in lock.css). Paint comes from LockDefs (`lock-blood`).
 */

/** One drip, from where it starts to how far it runs, in the lock's viewBox units. */
export interface Drip {
  x: number
  y: number
  length: number
}

/** Props of BloodDrips. */
export interface BloodDripsProps {
  /** The drips; the first one also sheds the beading drop. */
  drips: readonly Drip[]
}

const BULB = 3.5
/** Gap between the end of the drip and the centre of the drop hanging under it. */
const DROP_GAP = 5

/** @returns A drip path: thin where it starts, ending in a round bulb. */
function dripPath({ x, y, length }: Drip): string {
  const end = y + length
  return `M${x - 2} ${y} Q${x - 3} ${y + length * 0.6} ${x - BULB} ${end} a${BULB} ${BULB} 0 0 0 ${BULB * 2} 0 `
    + `Q${x + 3} ${y + length * 0.6} ${x + 2} ${y} Z`
}

/**
 * Blood on the lock, as pure decoration.
 * @param props See BloodDripsProps.
 * @returns An SVG group, hidden from screen readers.
 */
export function BloodDrips({ drips }: BloodDripsProps) {
  const first = drips[0]
  return (
    <g className="blood-drips" aria-hidden="true">
      {drips.map((drip) => (
        <path key={`${drip.x}-${drip.y}`} className="blood-drip" d={dripPath(drip)} fill="url(#lock-blood)" />
      ))}
      {first && <circle className="blood-drop" cx={first.x} cy={first.y + first.length + DROP_GAP} r="3" fill="url(#lock-blood)" />}
    </g>
  )
}
