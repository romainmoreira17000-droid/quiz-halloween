/**
 * @file Front of the haunted restaurant, drawn behind the entrance screen: night sky and moon, stone
 * façade with lit windows, the door (RestaurantDoor), bats, fog and the vignette.
 */
import { DecorGradients } from './HallBackdrop'
import { RestaurantDoor } from './RestaurantDoor'

/** Stars of the night sky, above the roof. */
const STARS = [[60, 40], [150, 90], [250, 30], [340, 70], [470, 36], [560, 96], [760, 150], [30, 120]]
/** Bats flying across the moon. */
const BATS = [[610, 60, 1], [700, 120, 0.8], [540, 130, 0.6]]

/** Gradients only the front needs (the shared ones come from DecorGradients). */
function FrontGradients() {
  return (
    <defs>
      <pattern id="front-stones" width="96" height="48" patternUnits="userSpaceOnUse">
        <rect width="96" height="48" fill="#2f2822" />
        <path d="M0 0 H96 M0 24 H96 M0 48 H96 M48 0 V24 M0 24 V48 M96 24 V48" stroke="#16110d" strokeWidth="2" />
        <rect x="4" y="4" width="38" height="16" fill="#3a322b" opacity=".6" />
        <rect x="52" y="28" width="40" height="16" fill="#352d26" opacity=".6" />
      </pattern>
      <linearGradient id="front-wood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#24120a" /><stop offset=".5" stopColor="#4a2a16" /><stop offset="1" stopColor="#24120a" />
      </linearGradient>
      <radialGradient id="front-pumpkin" cx=".4" cy=".35" r=".7">
        <stop offset="0" stopColor="#f59a3c" /><stop offset=".7" stopColor="#c8601c" /><stop offset="1" stopColor="#7a3510" />
      </radialGradient>
      <linearGradient id="front-window" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffcf6a" stopOpacity=".7" /><stop offset="1" stopColor="#c8601c" stopOpacity=".5" />
      </linearGradient>
    </defs>
  )
}

/** A small arched window of the upper floor, lit from inside. */
function LitWindow({ x }: { x: number }) {
  return (
    <g>
      <circle cx={x + 34} cy="300" r="70" fill="url(#hall-halo)" />
      <path d={`M${x} 360 V270 a34 34 0 0 1 68 0 V360z`} fill="url(#front-window)" stroke="#16110d" strokeWidth="6" />
      <path d={`M${x + 34} 236 V360 M${x} 300 H${x + 68}`} stroke="#16110d" strokeWidth="4" />
    </g>
  )
}

/**
 * The restaurant front, filling the screen behind the entrance (cropped at the sides on narrow screens).
 * @returns Decorative SVG, hidden from screen readers.
 */
export function RestaurantFront() {
  return (
    <svg className="backdrop restaurant-front" viewBox="0 0 810 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <DecorGradients />
      <FrontGradients />
      <rect width="810" height="1080" fill="url(#hall-sky)" />
      {STARS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#e8eef0" opacity=".7" />)}
      <circle cx="680" cy="84" r="110" fill="url(#hall-moonhalo)" />
      <circle cx="680" cy="84" r="52" fill="url(#hall-moon)" />
      {BATS.map(([x, y, s]) => (
        <path key={x} transform={`translate(${x} ${y}) scale(${s})`}
          d="M0 0 q-14 -12 -30 -6 q10 4 12 12 q6 -6 10 0 q4 -4 8 -2 q4 -2 8 2 q4 -6 10 0 q2 -8 12 -12 q-16 -6 -30 6z" fill="#070504" />
      ))}
      {/* Façade and the eave of the roof. */}
      <rect y="170" width="810" height="910" fill="url(#front-stones)" />
      <path d="M-10 150 H820 L810 180 H0z" fill="#120c08" />
      <path d="M0 180 H810" stroke="#3a322b" strokeWidth="3" />
      <LitWindow x={30} />
      <LitWindow x={712} />
      {/* Moonlight washing the stones from the top right. */}
      <rect y="170" width="810" height="910" fill="url(#hall-moonbeam)" />
      <RestaurantDoor />
      <ellipse className="hall-fog" cx="250" cy="1050" rx="420" ry="90" fill="url(#hall-mist)" />
      <ellipse className="hall-fog hall-fog--back" cx="600" cy="1020" rx="380" ry="80" fill="url(#hall-mist)" opacity=".8" />
      <rect y="900" width="810" height="180" fill="url(#hall-fog)" />
      {/* Dims the scene so the letter and keys stay the brightest things. */}
      <rect width="810" height="1080" fill="#000" opacity=".3" />
      <rect width="810" height="1080" fill="url(#hall-vignette)" />
    </svg>
  )
}
