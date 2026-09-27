/**
 * @file Shared paint of the rusty padlocks (step screen lock and final lock): iron and rust gradients,
 * a noise filter that eats the metal with rust, chain steel and blood. Ids are all `lock-*`, the backdrops
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
        <stop offset="0" stopColor="#f2a541" stopOpacity=".5" /><stop offset="1" stopColor="#f2a541" stopOpacity="0" />
      </radialGradient>
      {/* Noise thresholded into orange patches, kept only where the metal is: rust that eats the iron. */}
      <filter id="lock-rust-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".06 .1" numOctaves="3" seed="7" result="noise" />
        <feColorMatrix in="noise" type="matrix" result="patches"
          values="0 0 0 0 .56  0 0 0 0 .25  0 0 0 0 .09  2.6 0 0 0 -1" />
        <feComposite in="patches" in2="SourceGraphic" operator="in" result="rust" />
        <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="rust" /></feMerge>
      </filter>
    </defs>
  )
}
