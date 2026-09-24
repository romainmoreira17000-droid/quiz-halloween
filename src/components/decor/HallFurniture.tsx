/** @file Furniture of the great hall: candle chandelier, long banquet table with candelabras, plates and goblets, chairs. */
import { Candle } from './Candle'

/** Chandelier candles: x and the height of their base on the ring. */
const CHANDELIER = [[255, 96], [305, 108], [355, 115], [405, 118], [455, 115], [505, 108], [555, 96]]

/** Places set on the far side of the table. */
const PLATES = [190, 290, 520, 620]

/** Scalloped hem of the hanging tablecloth, drawn right to left from (740, 960) to (70, 960). */
const HEM = `M740 960 ${Array.from({ length: 17 }, () => `q${-670 / 34} 14 ${-670 / 17} 0`).join(' ')}`

/**
 * The furniture, between the room and the spirits.
 * @returns An SVG group.
 */
export function HallFurniture() {
  return (
    <g>
      {/* Chandelier: chain, two brass rings, a crown of candles. */}
      <ellipse cx="405" cy="110" rx="260" ry="120" fill="url(#hall-halo)" />
      <path d="M405 0 V60" stroke="#3b2a1d" strokeWidth="5" strokeDasharray="7 3" />
      <path d="M245 98 q160 60 320 0" fill="none" stroke="url(#hall-brass)" strokeWidth="8" strokeLinecap="round" />
      <path d="M300 84 q105 40 210 0" fill="none" stroke="url(#hall-brass)" strokeWidth="5" strokeLinecap="round" />
      <path d="M405 60 L300 86 M405 60 L510 86 M405 60 V120" stroke="url(#hall-brass)" strokeWidth="3" />
      <path d="M405 124 l-8 16 l8 10 l8 -10z" fill="url(#hall-brass)" />
      {CHANDELIER.map(([x, y]) => <Candle key={x} x={x} y={y} height={18} size={0.8} />)}

      {/* Chairs behind the table, high backs. */}
      <g fill="#0d0907" stroke="#24170f" strokeWidth="2">
        <path d="M112 700 q18 -26 36 0 v120 h-36z" /><path d="M662 700 q18 -26 36 0 v120 h-36z" />
        <path d="M236 716 q16 -22 32 0 v90 h-32z" /><path d="M542 716 q16 -22 32 0 v90 h-32z" />
      </g>

      {/* Long table seen from the front, with its cloth hanging down. */}
      <path d="M130 800 H680 L740 880 H70 Z" fill="url(#hall-cloth)" />
      <path d={`M70 880 H740 V960 ${HEM.slice('M740 960'.length)} Z`} fill="#8a7e64" />
      {/* Folds of the hanging cloth. */}
      <path d="M190 884 V970 M320 884 V970 M490 884 V970 M620 884 V970" stroke="#6a604b" strokeWidth="3" opacity=".6" />
      <path d="M70 880 H740" stroke="#efe6d0" strokeWidth="2" opacity=".6" />
      {PLATES.map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="836" rx="30" ry="9" fill="#d9d2c2" stroke="#8d8570" />
          <ellipse cx={x} cy="836" rx="18" ry="5" fill="#bfb6a2" />
          <path d={`M${x + 42} 818 q-8 -2 -8 -14 h16 q0 12 -8 14 v14 h6 h-12 h6z`} fill="url(#hall-brass)" />
        </g>
      ))}

      {/* Two tall candelabras on the table, three candles each. */}
      {[112, 698].map((x) => (
        <g key={x}>
          <path d={`M${x} 860 V790 M${x - 30} 790 q30 30 60 0 M${x - 34} 870 h68 l-14 -10 h-40z`} fill="none"
            stroke="url(#hall-brass)" strokeWidth="6" strokeLinecap="round" />
          <Candle x={x - 30} y={790} height={34} />
          <Candle x={x} y={782} height={44} />
          <Candle x={x + 30} y={790} height={34} />
        </g>
      ))}
    </g>
  )
}
