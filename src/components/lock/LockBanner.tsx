/** @file Dark ribbon arched over the padlock window, with "HAPPY HALLOWEEN" glowing orange along it (as in cadenas.jpeg). */

/** Props of LockBanner. */
export interface LockBannerProps {
  /** Height of the ribbon's ends; its middle rises 11 units higher. */
  y: number
}

/**
 * The glowing banner. One per SVG (`lock-banner-arc`).
 * @param props See LockBannerProps.
 * @returns An SVG group.
 */
export function LockBanner({ y }: LockBannerProps) {
  const d = `M70 ${y + 8} Q150 ${y - 14} 230 ${y + 8}`
  return (
    <g className="lock-banner">
      <path id="lock-banner-arc" d={d} fill="none" />
      <path d={d} fill="none" stroke="url(#lock-bronze)" strokeWidth="19" strokeLinecap="round" />
      {/* Dark ribbon: orange text on the gold bronze would not read. */}
      <path d={d} fill="none" stroke="#2a1508" strokeWidth="15" strokeLinecap="round" />
      <text className="lock-banner-text" fontSize="12.5" fontWeight="800" letterSpacing="1" fill="#ffb347" dy="4.5">
        <textPath href="#lock-banner-arc" startOffset="50%" textAnchor="middle">HAPPY HALLOWEEN</textPath>
      </text>
    </g>
  )
}
