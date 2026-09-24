/** @file One wax candle with a flickering flame and its halo, shared by the decor pieces (SVG, no text). */

/** Props of Candle, in the viewBox units of the parent SVG. */
export interface CandleProps {
  /** Centre of the candle. */
  x: number
  /** Bottom of the wax stick. */
  y: number
  /** Height of the wax stick. */
  height: number
  /** Scales the flame and halo (1 = table candle). */
  size?: number
}

/**
 * A lit candle. Uses the `hall-wax`, `hall-flame` and `hall-halo` gradients, which every backdrop defines.
 * @param props See CandleProps.
 * @returns An SVG group.
 */
export function Candle({ x, y, height, size = 1 }: CandleProps) {
  const top = y - height
  const w = 10 * size
  return (
    <g>
      <circle cx={x} cy={top - 10 * size} r={34 * size} fill="url(#hall-halo)" />
      <rect x={x - w / 2} y={top} width={w} height={height} rx={2 * size} fill="url(#hall-wax)" />
      {/* A drip of melted wax down one side. */}
      <path d={`M${x - w / 2} ${top + 2} q${w * 0.2} ${height * 0.35} 0 ${height * 0.45} q${-w * 0.25} -${height * 0.1} 0 -${height * 0.45}`}
        fill="#f4e6c8" opacity=".7" />
      <line x1={x} y1={top} x2={x} y2={top - 4 * size} stroke="#2b1a0c" strokeWidth={1.4 * size} />
      <ellipse className="hall-flame" cx={x} cy={top - 11 * size} rx={4.5 * size} ry={10 * size} fill="url(#hall-flame)" />
    </g>
  )
}
