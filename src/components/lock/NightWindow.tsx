/**
 * @file Night sky seen through the padlock window, as in cadenas.jpeg: moon, a witch crossing it now and then
 * (lock.css), a castle and hills. Everything is clipped to the window; one window per page (`lock-window-clip`).
 */
import type { ChainBox } from './LockChains'

/** Props of NightWindow. */
export interface NightWindowProps {
  /** Rectangle of the window, in the SVG's units. */
  box: ChainBox
  /** `porthole`: rounded corners and a dark rim (SVG locks); `plain`: the HTML window of the final lock has its own border. */
  shape: 'porthole' | 'plain'
}

/** @returns A small witch on her broom, centred on (x, y). */
function witchPath(x: number, y: number): string {
  return `M${x - 14} ${y + 5} L${x + 12} ${y} l1 1.5 L${x - 13} ${y + 6.5} z `
    + `M${x - 4} ${y + 2} l4 -12 l4 12 z M${x - 6} ${y - 9} h12 l-6 -8 z`
}

/** @returns Castle silhouette standing on (x, y), about half as high as `height`. */
function castlePath(x: number, y: number, height: number): string {
  const s = height / 100
  return `M${x} ${y} v${-30 * s} h${8 * s} v${-12 * s} l${5 * s} ${-9 * s} l${5 * s} ${9 * s} v${12 * s} h${8 * s} `
    + `v${-22 * s} l${6 * s} ${-11 * s} l${6 * s} ${11 * s} v${22 * s} h${10 * s} v${30 * s} Z`
}

/**
 * The sky behind the pins or the dials.
 * @param props See NightWindowProps.
 * @returns An SVG group.
 */
export function NightWindow({ box, shape }: NightWindowProps) {
  const { x, y, width, height } = box
  const rx = shape === 'porthole' ? 30 : 0
  const moon = { cx: x + width * 0.74, cy: y + height * 0.32, r: height * 0.17 }
  const bottom = y + height
  return (
    <g className="lock-night">
      <clipPath id="lock-window-clip"><rect x={x} y={y} width={width} height={height} rx={rx} /></clipPath>
      <g clipPath="url(#lock-window-clip)">
        <rect x={x} y={y} width={width} height={height} fill="url(#lock-sky)" />
        <circle cx={moon.cx} cy={moon.cy} r={moon.r * 2.2} fill="url(#lock-moon-glow)" />
        <circle className="lock-moon" cx={moon.cx} cy={moon.cy} r={moon.r} fill="#fbe9a8" />
        <path className="lock-witch" d={witchPath(moon.cx, moon.cy)} fill="#120a14" />
        <path d={`M${x} ${bottom} Q${x + width * 0.3} ${y + height * 0.78} ${x + width * 0.6} ${y + height * 0.9} `
          + `T${x + width} ${y + height * 0.84} V${bottom} Z`} fill="#1b1026" />
        <path className="lock-castle" d={castlePath(x + width * 0.08, bottom, height)} fill="#120a14" />
      </g>
      {shape === 'porthole' && (
        <rect className="lock-window-rim" x={x} y={y} width={width} height={height} rx={rx}
          fill="none" stroke="#2a1b0b" strokeWidth="5" />
      )}
    </g>
  )
}
