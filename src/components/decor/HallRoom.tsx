/** @file Walls of the great hall: damask wallpaper, crown moulding, windows, haunted portraits, wainscot and floor. */
import { HallWindows } from './HallWindows'

/** Oval portraits hung between the windows and the padlock; their eyes glow. */
const PORTRAITS = [
  { cx: 232, eyes: '#f2a541', head: 'M232 500 q-20 4 -18 30 q2 22 18 26 q16 -4 18 -26 q2 -26 -18 -30z' },
  { cx: 578, eyes: '#9ce0c8', head: 'M578 498 q-22 8 -18 34 q4 22 18 24 q14 -2 18 -24 q4 -26 -18 -34z M562 510 l-8 -18 l14 10z M594 510 l8 -18 l-14 10z' },
]

/** X of each wainscot panel. */
const PANELS = [14, 176, 338, 500, 662]

/** Floor planks converge towards the middle of the far wall. */
const PLANKS = [-300, -120, 40, 200, 405, 610, 770, 930, 1110]

/**
 * The room itself, before the furniture.
 * @returns An SVG group.
 */
export function HallRoom() {
  return (
    <g>
      <rect width="810" height="1080" fill="url(#hall-wall)" />
      <rect width="810" height="660" fill="url(#hall-damask)" />
      <rect width="810" height="26" fill="#1a110b" />
      <path d="M0 26 H810 M0 34 H810" stroke="#4a3526" strokeWidth="3" />
      <HallWindows />
      {PORTRAITS.map(({ cx, eyes, head }) => (
        <g key={cx}>
          <line x1={cx} y1="440" x2={cx} y2="482" stroke="#2a1c12" strokeWidth="2" />
          <ellipse cx={cx} cy="528" rx="30" ry="40" fill="#1d130c" stroke="url(#hall-brass)" strokeWidth="7" />
          <ellipse cx={cx} cy="528" rx="24" ry="34" fill="#2a2019" />
          <path d={head} fill="#3b2e24" />
          <path d={`M${cx - 22} 566 q22 -14 44 0 v8 h-44z`} fill="#241a13" />
          <g className="hall-eyes" fill={eyes}>
            <circle cx={cx - 7} cy="522" r="2.6" /><circle cx={cx + 7} cy="522" r="2.6" />
          </g>
        </g>
      ))}
      {/* Wainscot */}
      <rect y="660" width="810" height="112" fill="#1a110b" />
      <path d="M0 660 H810 M0 772 H810" stroke="#3b2a1d" strokeWidth="6" />
      <g fill="none" stroke="#2f2117" strokeWidth="3">
        {PANELS.map((x) => <rect key={x} x={x} y="676" width="134" height="80" rx="3" />)}
      </g>
      {/* Floor */}
      <rect y="775" width="810" height="305" fill="url(#hall-floor)" />
      <g stroke="#140c07" strokeWidth="2">
        {PLANKS.map((x) => <line key={x} x1={405 + (x - 405) * 0.35} y1="775" x2={x} y2="1080" />)}
        <path d="M0 850 H810 M0 950 H810" strokeWidth="1.5" opacity=".6" />
      </g>
    </g>
  )
}
