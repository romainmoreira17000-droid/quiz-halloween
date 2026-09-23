/** @file What haunts the great hall, over the furniture: a drifting ghost, cobwebs, bats, floor fog and the vignette. */

/** Cobweb anchored in a top corner; `flip` mirrors it for the right corner. */
function Cobweb({ flip = false }: { flip?: boolean }) {
  return (
    <g transform={flip ? 'translate(810 0) scale(-1 1)' : undefined} fill="none" stroke="#c9d4d8" strokeOpacity=".28" strokeWidth="1.2">
      <path d="M0 26 L150 26 M0 26 L0 170 M0 26 L128 110 M0 26 L70 150 M0 26 L150 60" />
      <path d="M40 26 q-6 18 -40 30 M84 26 q-10 40 -84 64 M128 26 q-14 64 -128 100" />
      <path d="M24 42 q10 8 12 20 M52 58 q14 10 16 30" />
      <circle cx="66" cy="84" r="3" fill="#0a0706" stroke="none" />
      <path d="M66 84 V26" strokeOpacity=".2" />
    </g>
  )
}

/** Bats sleeping upside down from the moulding. */
const BATS = [180, 604]

/**
 * The spirits and the final lighting.
 * @returns An SVG group.
 */
export function HallSpirits() {
  return (
    <g>
      <Cobweb />
      <Cobweb flip />
      {BATS.map((x) => (
        <path key={x} d={`M${x} 34 v6 q-8 2 -12 12 q6 -2 8 2 q2 -6 4 -2 q2 -4 4 2 q2 -4 8 -2 q-4 -10 -12 -12z`} fill="#070504" />
      ))}
      {/* The ghost drifts in front of the moonlit window. */}
      <g className="hall-ghost">
        <path d="M680 470 q34 -66 68 0 v86 l-11 -13 -11 13 -12 -13 -12 13 -11 -13 -11 13z" fill="url(#hall-ghost)" />
        <ellipse cx="702" cy="486" rx="5" ry="7" fill="#1a120c" />
        <ellipse cx="726" cy="486" rx="5" ry="7" fill="#1a120c" />
        <ellipse cx="714" cy="508" rx="6" ry="8" fill="#1a120c" opacity=".8" />
        <path d="M684 500 q-18 8 -24 26 M744 500 q18 8 24 26" stroke="#dfe8ea" strokeOpacity=".5" strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* Low fog over the floor, in two layers that slide slowly. */}
      <ellipse className="hall-fog" cx="260" cy="1030" rx="420" ry="110" fill="url(#hall-mist)" />
      <ellipse className="hall-fog hall-fog--back" cx="600" cy="990" rx="380" ry="90" fill="url(#hall-mist)" opacity=".8" />
      <rect y="860" width="810" height="220" fill="url(#hall-fog)" />
      {/* Darkens the edges and dims the whole room so the parchment and keys stay the brightest things. */}
      <rect width="810" height="1080" fill="#000" opacity=".3" />
      <rect width="810" height="1080" fill="url(#hall-vignette)" />
    </g>
  )
}
