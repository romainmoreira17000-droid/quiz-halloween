/**
 * @file Shared paint of the padlocks: bronze Halloween gradients (body, edge, bone, night sky, pumpkin, moon),
 * chain steel and pin gold. The rusty ids stay until every lock is bronze. Ids are all `lock-*`, the backdrops
 * keep `hall-*`, so both can live on one page.
 */

/**
 * Gradients and filters used by the padlock SVGs. Render it once inside each lock `<svg>`.
 * @returns A `<defs>` element.
 */
export function LockDefs() {
  return (
    <defs>
      <linearGradient id="lock-iron" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4b4540" /><stop offset=".35" stopColor="#2d2824" /><stop offset="1" stopColor="#151210" />
      </linearGradient>
      <linearGradient id="lock-rust" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5a2a12" /><stop offset=".45" stopColor="#a4521f" /><stop offset="1" stopColor="#3b1a0b" />
      </linearGradient>
      <linearGradient id="lock-bronze" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4a3012" /><stop offset=".3" stopColor="#a0712c" /><stop offset=".48" stopColor="#f3d27a" />
        <stop offset=".62" stopColor="#c9973f" /><stop offset="1" stopColor="#5a3d17" />
      </linearGradient>
      {/* Darker copy drawn a little lower: the edge of the lock, which gives it its thickness. */}
      <linearGradient id="lock-bronze-edge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6b4a1f" /><stop offset="1" stopColor="#2a1b0b" />
      </linearGradient>
      <linearGradient id="lock-bone" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f4ead2" /><stop offset="1" stopColor="#bfae8c" />
      </linearGradient>
      <linearGradient id="lock-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0d1633" /><stop offset=".6" stopColor="#27407a" /><stop offset="1" stopColor="#3a2a4a" />
      </linearGradient>
      <radialGradient id="lock-pumpkin" cx=".4" cy=".35" r=".7">
        <stop offset="0" stopColor="#ffb347" /><stop offset=".6" stopColor="#e0661b" /><stop offset="1" stopColor="#8a3208" />
      </radialGradient>
      <radialGradient id="lock-moon-glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#fbe9a8" stopOpacity=".6" /><stop offset="1" stopColor="#fbe9a8" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="lock-chain" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2a2622" /><stop offset=".5" stopColor="#8d8378" /><stop offset="1" stopColor="#3a2418" />
      </linearGradient>
      <linearGradient id="lock-blood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5e0707" /><stop offset=".6" stopColor="#8e0d0d" /><stop offset="1" stopColor="#b3141a" />
      </linearGradient>
      <linearGradient id="lock-pin" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8a6a2e" /><stop offset=".5" stopColor="#f0d28c" /><stop offset="1" stopColor="#8a6a2e" />
      </linearGradient>
      <radialGradient id="lock-glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#ffb347" stopOpacity=".9" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
      </radialGradient>
      {/* Noise thresholded into orange patches, kept only where the metal is: rust that eats the iron. */}
      <filter id="lock-rust-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".16 .22" numOctaves="3" seed="7" result="noise" />
        <feColorMatrix in="noise" type="matrix" result="patches"
          values="0 0 0 0 .5  0 0 0 0 .2  0 0 0 0 .07  3 0 0 0 -1.75" />
        <feComposite in="patches" in2="SourceGraphic" operator="in" result="rust" />
        <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="rust" /></feMerge>
      </filter>
    </defs>
  )
}
