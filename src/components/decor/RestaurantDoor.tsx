/**
 * @file The restaurant's way in, drawn over the façade: stone arch, double oak door with iron straps and a
 * warm glow under it, front steps, a wall lantern, the hanging sign and two carved pumpkins.
 * The letter and the keyboard cover the middle of the screen, so the small pieces sit in the strips that
 * stay visible on a tablet: between the letter and the keyboard (y 540–660) and below the keyboard.
 */
import { Candle } from './Candle'

/** Centre of the door arch (the leaves meet on x = 405). */
const CX = 405
const ARCH_Y = 400
/** Stones of the arch, every 15°, from the left foot to the right one. */
const VOUSSOIRS = Array.from({ length: 13 }, (_, i) => (Math.PI * i) / 12)

/** A lantern hung on the wall at (x, top of its cap), a candle burning behind its glass. */
function Lantern({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 50} ${y - 10} h28 q22 0 22 10`} fill="none" stroke="#1a120c" strokeWidth="6" />
      <path d={`M${x - 24} ${y + 20} L${x} ${y} L${x + 24} ${y + 20}z`} fill="#1a120c" />
      <rect x={x - 20} y={y + 20} width="40" height="62" fill="#f2a541" opacity=".22" />
      <Candle x={x} y={y + 76} height={22} size={0.8} />
      <path d={`M${x - 20} ${y + 20} v62 M${x + 20} ${y + 20} v62 M${x} ${y + 20} v62`} stroke="#1a120c" strokeWidth="3" />
      <rect x={x - 24} y={y + 80} width="48" height="8" fill="#1a120c" />
    </g>
  )
}

/** A carved pumpkin sitting on the ground at the foot of the steps, grinning with candlelight. */
function Pumpkin({ x }: { x: number }) {
  return (
    <g>
      {/* The candle inside is only seen as a flickering glow around the pumpkin. */}
      <circle className="hall-flame" cx={x} cy="1022" r="46" fill="url(#hall-halo)" />
      <ellipse cx={x} cy="1030" rx="32" ry="24" fill="url(#front-pumpkin)" />
      <path d={`M${x - 12} 1010 q-4 20 0 42 M${x + 12} 1010 q4 20 0 42`} fill="none" stroke="#7a3510" strokeWidth="2" />
      <path d={`M${x} 1007 q2 -8 7 -12`} stroke="#3d4a1c" strokeWidth="4" fill="none" />
      <path d={`M${x - 16} 1023 l6 -8 l6 8z M${x + 4} 1023 l6 -8 l6 8z`} fill="#ffcf6a" />
      <path d={`M${x - 18} 1034 q18 14 36 0 l-6 2 l-3 -3 l-4 4 l-5 -4 l-5 4 l-4 -4 l-3 3z`} fill="#ffcf6a" />
    </g>
  )
}

/**
 * Door, steps, lanterns, sign and pumpkins.
 * @returns An SVG group.
 */
export function RestaurantDoor() {
  const door = `M215 900 V${ARCH_Y} A190 190 0 0 1 595 ${ARCH_Y} V900z`
  return (
    <g>
      <clipPath id="front-door-clip"><path d={door} /></clipPath>
      {/* Stone arch around the door. */}
      <path d={`M181 900 V${ARCH_Y} A224 224 0 0 1 629 ${ARCH_Y} V900z`} fill="#4a4038" />
      {VOUSSOIRS.map((a) => (
        <line key={a} x1={CX - Math.cos(a) * 190} y1={ARCH_Y - Math.sin(a) * 190}
          x2={CX - Math.cos(a) * 224} y2={ARCH_Y - Math.sin(a) * 224} stroke="#221c17" strokeWidth="3" />
      ))}
      <path d={`M181 ${ARCH_Y} V900 M629 ${ARCH_Y} V900`} stroke="#221c17" strokeWidth="3" />
      {/* Oak leaves: planks, iron straps with rivets, ring knockers, keyhole. */}
      <g className="restaurant-door" clipPath="url(#front-door-clip)">
        <path d={door} fill="url(#front-wood)" />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={234 + i * 38} y1="190" x2={234 + i * 38} y2="900" stroke="#1c0e06" strokeWidth="2" opacity=".7" />
        ))}
        <line x1={CX} y1="190" x2={CX} y2="900" stroke="#0d0603" strokeWidth="6" />
        {[330, 560, 790].map((y) => (
          <g key={y}>
            <rect x="215" y={y} width="380" height="18" fill="#1d1a18" />
            {[232, 290, 348, 462, 520, 578].map((x) => <circle key={x} cx={x} cy={y + 9} r="4" fill="#5d5650" />)}
          </g>
        ))}
        <circle cx="378" cy="640" r="16" fill="none" stroke="url(#hall-brass)" strokeWidth="6" />
        <circle cx="432" cy="640" r="16" fill="none" stroke="url(#hall-brass)" strokeWidth="6" />
        <path d="M424 690 a6 6 0 1 1 6 0 l3 16 h-12z" fill="#0d0603" />
      </g>
      {/* Candlelight leaking under the door onto the steps. */}
      <rect x="215" y="894" width="380" height="6" fill="#ffcf6a" opacity=".85" />
      <ellipse cx={CX} cy="912" rx="230" ry="40" fill="url(#hall-halo)" />
      <path d="M165 900 h480 v35 h-480z" fill="#3b332c" />
      <path d="M140 935 h530 v35 h-530z" fill="#302923" />
      <path d="M115 970 h580 v35 h-580z" fill="#262019" />
      <path d="M165 900 h480 M140 935 h530 M115 970 h580" stroke="#6a5d50" strokeWidth="2" opacity=".6" />
      <Pumpkin x={196} />
      <Pumpkin x={614} />
      <Lantern x={112} y={552} />
      {/* Hanging sign on an iron bracket; the text is decoration, the screen shows the real title. */}
      <path d="M810 548 H650 M690 548 l-40 40" stroke="#1a120c" strokeWidth="7" fill="none" />
      <path d="M672 548 v24 M788 548 v24" stroke="#1a120c" strokeWidth="3" />
      <rect x="652" y="572" width="156" height="58" rx="6" fill="url(#front-wood)" stroke="url(#hall-brass)" strokeWidth="3" />
      <text x="730" y="610" textAnchor="middle" fontFamily="IM Fell English SC, Georgia, serif" fontSize="26" fill="#e2bf78">
        Restaurant
      </text>
    </g>
  )
}
