/**
 * @file Great hall of the haunted restaurant, drawn behind the game screens: the SVG frame and the
 * shared gradients; the pieces live in HallRoom, HallWindows, HallFurniture and HallSpirits.
 */
import { HallFurniture } from './HallFurniture'
import { HallRoom } from './HallRoom'
import { HallSpirits } from './HallSpirits'

/**
 * Gradients shared by every backdrop (the Candle needs `hall-wax`, `hall-flame` and `hall-halo`).
 * Ids are prefixed `hall-` so they never clash with the padlock's `lock-` ones.
 * @returns SVG defs.
 */
export function DecorGradients() {
  return (
    <defs>
      <linearGradient id="hall-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#120b07" /><stop offset=".5" stopColor="#2e1d13" /><stop offset="1" stopColor="#170f0a" />
      </linearGradient>
      <pattern id="hall-damask" width="54" height="72" patternUnits="userSpaceOnUse">
        <path d="M27 6 q10 12 0 24 q-10 -12 0 -24z M27 42 q10 12 0 24 q-10 -12 0 -24z M0 36 q10 -8 0 -16 M54 36 q-10 -8 0 -16"
          fill="none" stroke="#4a3122" strokeWidth="1.4" opacity=".55" />
      </pattern>
      <linearGradient id="hall-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2c1b10" /><stop offset="1" stopColor="#060403" />
      </linearGradient>
      <linearGradient id="hall-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#233548" /><stop offset=".7" stopColor="#101a26" /><stop offset="1" stopColor="#0a1018" />
      </linearGradient>
      <radialGradient id="hall-moon" cx=".4" cy=".38" r=".62">
        <stop offset="0" stopColor="#f4f7f2" /><stop offset=".7" stopColor="#c9d6d8" /><stop offset="1" stopColor="#8fa4ad" />
      </radialGradient>
      <radialGradient id="hall-moonhalo" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#cfe0e6" stopOpacity=".45" /><stop offset="1" stopColor="#cfe0e6" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="hall-moonbeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#bcd3dc" stopOpacity=".16" /><stop offset="1" stopColor="#bcd3dc" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="hall-curtain" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3a0e0c" /><stop offset=".35" stopColor="#7a211b" /><stop offset=".6" stopColor="#4d1411" />
        <stop offset="1" stopColor="#6b1c17" />
      </linearGradient>
      <linearGradient id="hall-brass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5e421d" /><stop offset=".45" stopColor="#c99d52" /><stop offset=".55" stopColor="#e2bf78" />
        <stop offset="1" stopColor="#4a3317" />
      </linearGradient>
      <linearGradient id="hall-cloth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e3d8bf" /><stop offset="1" stopColor="#8a7d63" />
      </linearGradient>
      <linearGradient id="hall-wax" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#c9ad7a" /><stop offset=".45" stopColor="#f3e3c0" /><stop offset="1" stopColor="#b8995f" />
      </linearGradient>
      <radialGradient id="hall-flame" cx=".5" cy=".7" r=".6">
        <stop offset="0" stopColor="#fff6d2" /><stop offset=".45" stopColor="#ffcf6a" /><stop offset="1" stopColor="#f2a541" stopOpacity=".2" />
      </radialGradient>
      <radialGradient id="hall-halo" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#f2a541" stopOpacity=".42" /><stop offset="1" stopColor="#f2a541" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="hall-ghost" cx=".45" cy=".3" r=".75">
        <stop offset="0" stopColor="#f1f7f6" /><stop offset=".7" stopColor="#c7d8d8" stopOpacity=".7" />
        <stop offset="1" stopColor="#a9c1c2" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="hall-mist" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#c9d4d8" stopOpacity=".16" /><stop offset="1" stopColor="#c9d4d8" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="hall-fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9d4d8" stopOpacity="0" /><stop offset="1" stopColor="#c9d4d8" stopOpacity=".2" />
      </linearGradient>
      <radialGradient id="hall-vignette" cx=".5" cy=".45" r=".75">
        <stop offset=".45" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".8" />
      </radialGradient>
    </defs>
  )
}

/**
 * The great hall, filling the screen behind the game (cropped at the sides on narrow screens).
 * @returns Decorative SVG, hidden from screen readers.
 */
export function HallBackdrop() {
  return (
    <svg className="backdrop hall-backdrop" viewBox="0 0 810 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <DecorGradients />
      <HallRoom />
      <HallFurniture />
      <HallSpirits />
    </svg>
  )
}
