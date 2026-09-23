/** @file The two tall arched windows of the great hall: night sky, moon, dead tree, red curtains and moonbeams. */

/** Props of one window. */
interface HallWindowProps {
  /** Left edge of the glass. */
  x: number
  /** Draws the full moon in this window. */
  moon?: boolean
  /** Draws the dead tree branches in this window. */
  tree?: boolean
}

const TOP = 420
const BOTTOM = 650
const WIDTH = 140

/** Stars scattered in the glass, relative to its left edge. */
const STARS = [[22, 380], [104, 368], [58, 452], [118, 470], [30, 520], [86, 548]]

/** One arched window with its curtains. */
function HallWindow({ x, moon = false, tree = false }: HallWindowProps) {
  const r = WIDTH / 2
  const glass = `M${x} ${BOTTOM} V${TOP} a${r} ${r} 0 0 1 ${WIDTH} 0 V${BOTTOM} Z`
  return (
    <g>
      <path d={glass} fill="url(#hall-sky)" />
      {STARS.map(([sx, sy]) => <circle key={`${sx}-${sy}`} cx={x + sx} cy={sy} r="1.3" fill="#e9f0f2" opacity=".7" />)}
      {moon && (
        <g>
          <circle cx={x + 80} cy={TOP - 20} r="62" fill="url(#hall-moonhalo)" />
          <circle cx={x + 80} cy={TOP - 20} r="30" fill="url(#hall-moon)" />
          <circle cx={x + 72} cy={TOP - 27} r="5" fill="#9fb0b5" opacity=".35" />
          <circle cx={x + 90} cy={TOP - 10} r="3.5" fill="#9fb0b5" opacity=".3" />
          {/* A thin cloud crossing the moon. */}
          <path d={`M${x + 30} ${TOP - 4} q20 -10 40 -2 q18 -8 38 2 q10 4 20 0`} fill="none" stroke="#3b4d5e" strokeWidth="7"
            strokeLinecap="round" opacity=".8" />
        </g>
      )}
      {tree && (
        <path d={`M${x + 8} ${BOTTOM} q14 -70 6 -120 q-4 -30 -18 -52 M${x + 14} ${BOTTOM - 80} q30 -26 58 -30 M${x + 12} ${BOTTOM - 130}
          q-10 -24 4 -48 M${x + 50} ${BOTTOM - 106} q16 -14 34 -12 M${x + 16} ${BOTTOM - 40} q40 -8 70 -40`}
          fill="none" stroke="#070a0e" strokeWidth="4" strokeLinecap="round" />
      )}
      {/* Mullions and transom, then the stone frame and sill. */}
      <path d={`M${x + r} ${TOP - r} V${BOTTOM} M${x} ${TOP + 90} H${x + WIDTH}`} stroke="#2a1c12" strokeWidth="7" />
      <path d={glass} fill="none" stroke="#3b2a1d" strokeWidth="12" />
      <path d={glass} fill="none" stroke="#6b5138" strokeWidth="2" opacity=".6" />
      <rect x={x - 16} y={BOTTOM} width={WIDTH + 32} height="14" rx="3" fill="#3b2a1d" />
      {/* Heavy velvet curtains, tied back. */}
      <path d={`M${x - 26} ${TOP - 96} H${x + 26} q-8 120 -2 180 q-14 30 -2 66 q-14 30 6 92 H${x - 30} Z`} fill="url(#hall-curtain)" />
      <path d={`M${x + WIDTH + 26} ${TOP - 96} H${x + WIDTH - 26} q8 120 2 180 q14 30 2 66 q14 30 -6 92 H${x + WIDTH + 30} Z`}
        fill="url(#hall-curtain)" />
      <rect x={x - 44} y={TOP - 104} width={WIDTH + 88} height="14" rx="7" fill="url(#hall-brass)" />
    </g>
  )
}

/**
 * Both windows and the moonlight falling on the floor.
 * @returns An SVG group.
 */
export function HallWindows() {
  return (
    <g>
      <polygon points="645,650 785,650 620,1080 330,1080" fill="url(#hall-moonbeam)" />
      <polygon points="25,650 165,650 420,1080 160,1080" fill="url(#hall-moonbeam)" opacity=".6" />
      <HallWindow x={25} tree />
      <HallWindow x={645} moon />
    </g>
  )
}
