/**
 * @file Bone-and-web ornaments of the Halloween padlocks: bones, skull, cobweb and glowing keyhole.
 * Paint comes from LockDefs; eyes carry `lock-eye` so a wrong code can turn them red (lock.css).
 */

/** Props of Bone. */
export interface BoneProps {
  /** Centre line of the bone. */
  x: number
  /** Top end. */
  y: number
  /** Distance between both ends. */
  length: number
}

/**
 * An upright bone, as on the sides of the padlock in cadenas.jpeg.
 * @param props See BoneProps.
 * @returns An SVG group.
 */
export function Bone({ x, y, length }: BoneProps) {
  const knobs = [y, y + length].flatMap((cy) => [x - 3.5, x + 3.5].map((cx) => ({ cx, cy })))
  return (
    <g className="lock-bone" fill="url(#lock-bone)" stroke="#5c4a36" strokeWidth="1">
      <rect x={x - 3} y={y} width="6" height={length} rx="3" />
      {knobs.map(({ cx, cy }) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" />)}
    </g>
  )
}

/** Props of Skull. */
export interface SkullProps {
  cx: number
  cy: number
  /** Radius of the head. */
  r: number
}

/**
 * The skull hanging under the padlock.
 * @param props See SkullProps.
 * @returns An SVG group whose eyes can turn red.
 */
export function Skull({ cx, cy, r }: SkullProps) {
  return (
    <g className="lock-skull">
      <circle cx={cx} cy={cy} r={r} fill="url(#lock-bone)" stroke="#5c4a36" strokeWidth="1" />
      <rect x={cx - r * 0.55} y={cy + r * 0.5} width={r * 1.1} height={r * 0.7} rx={r * 0.2}
        fill="url(#lock-bone)" stroke="#5c4a36" strokeWidth="1" />
      <circle className="lock-eye lock-eye--skull" cx={cx - r * 0.38} cy={cy} r={r * 0.28} fill="#1a0f08" />
      <circle className="lock-eye lock-eye--skull" cx={cx + r * 0.38} cy={cy} r={r * 0.28} fill="#1a0f08" />
      <path d={`M${cx} ${cy + r * 0.3} l${-r * 0.15} ${r * 0.3} h${r * 0.3} z`} fill="#1a0f08" />
    </g>
  )
}

/** Props of Cobweb. */
export interface CobwebProps {
  /** Corner the web hangs from. */
  x: number
  y: number
  /** Length of its threads. */
  size: number
  /** True for a right-hand corner: the web opens towards the left. */
  flip?: boolean
}

/** Directions of the threads, from the corner (unit square). */
const RAYS = [[1, 0], [0.92, 0.4], [0.4, 0.92], [0, 1]] as const
/** Rings across the threads, as fractions of their length. */
const RINGS = [0.35, 0.65, 0.95] as const

/**
 * A cobweb in a corner of the padlock.
 * @param props See CobwebProps.
 * @returns An SVG group.
 */
export function Cobweb({ x, y, size, flip = false }: CobwebProps) {
  return (
    <g className="lock-cobweb" transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}
      fill="none" stroke="#e8dcc0" strokeOpacity=".55" strokeWidth=".8">
      {RAYS.map(([dx, dy]) => <line key={`${dx}-${dy}`} x1="0" y1="0" x2={dx * size} y2={dy * size} />)}
      {RINGS.map((t) => <polyline key={t} points={RAYS.map(([dx, dy]) => `${dx * size * t},${dy * size * t}`).join(' ')} />)}
    </g>
  )
}

/** Props of Keyhole. */
export interface KeyholeProps {
  /** Centre of the round part. */
  cx: number
  cy: number
}

/**
 * The glowing keyhole under the window.
 * @param props See KeyholeProps.
 * @returns An SVG path.
 */
export function Keyhole({ cx, cy }: KeyholeProps) {
  return (
    <path className="lock-keyhole" fill="#ffb347"
      d={`M${cx} ${cy - 5} a3.5 3.5 0 0 1 2 6.4 l1.5 5.6 h-7 l1.5 -5.6 a3.5 3.5 0 0 1 2 -6.4 Z`} />
  )
}
