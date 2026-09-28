# Cadenas Halloween (sprint 20) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rusty look of the three padlocks with the bronze Halloween style of `images-sources/cadenas.jpeg`, add a 3D jolt on each right answer and a 3D "plunge into the lock" at the victory.

**Architecture:** Small SVG building blocks in `src/components/lock/` (paint, ornaments, crown, banner, night window, hanging ghost, body) shared by `CutawayLock` (step screen), `FinalLock` (dials) and `VictoryLock`. All motion is CSS (`perspective`, `rotateX/Y`, `translateZ`, `scale`), triggered by classes derived from existing state (`fallingIndex`, `open`, `wrongAttempts`, victory screen). No new game state.

**Tech Stack:** React 19 + TypeScript, SVG, CSS animations, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-28-cadenas-halloween-design.md`

## Global Constraints

- Issue #57, branch `feat/halloween-padlock`; commits in Conventional Commits, English, ending with `(#57)` and the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` line.
- 200 lines max per file; `@file` JSDoc header on every file; JSDoc on every export; comments explain *why*.
- Banner text is fixed: `HAPPY HALLOWEEN` (not in `quiz.yaml`).
- SVG ids of the locks are all `lock-*` (decor keeps `hall-*`).
- `CutawayLock` keeps `viewBox="0 0 300 250"` and its CSS width (190 px on tablet, 240 px on phone, 300 px otherwise): the step screen must not scroll on 810×1080 (`e2e/layout.spec.ts`).
- Screen-reader texts unchanged (`lockLabel`, `role="img"`, decoration `aria-hidden="true"`, `<output class="dial-value">`).
- Animation rule: base styles = final state, keyframes = starting state (`both`); `prefers-reduced-motion` (base.css kills every animation) must show the end state. Decoration never catches taps (`pointer-events: none`).
- Digits always `font-variant-numeric: lining-nums`.
- Victory timeline (spec): turn 0–0.6 s, keyhole flare 0.5–1.5 s, shackle + chains 0.9 s, plunge 1.2–2.4 s, sky fades 2.2–2.8 s, doors 2.4–4.4 s, glow from 2.8 s, flyers 3.4–7 s, text 5.6 s. Sound: clack 0.9 s, creak 2.4–4.4 s, moan 3.6–5.8 s.
- Tests: `npm run test:run`, `npm run typecheck`, `npm run lint`; e2e with `npm run test:e2e` after stopping any `vite preview` on port 4173.

## Review Focus

- Phone 360 px, final padlock with 6 dials: no horizontal scroll (the new bronze frame must not widen the row) → e2e in Task 8.
- Reduced motion on the victory screen: the plunge layer is invisible and the victory text is readable at once → e2e in Task 8.
- The full-screen plunge layer must never block a tap after the victory (↺ reset icon) → `pointer-events: none` checked in the same e2e.
- The jolt runs only while a pin falls (solved step screen), never on an unsolved one → unit test in Task 5.
- The red eyes only after a wrong code, not on first display of the padlock → unit test in Task 6.

---

### Task 1: Bronze paint and small ornaments

**Files:**
- Modify: `src/components/lock/LockDefs.tsx`
- Modify: `src/components/lock/LockDefs.test.tsx`
- Create: `src/components/lock/Ornaments.tsx`
- Create: `src/components/lock/Ornaments.test.tsx`

**Interfaces:**
- Produces: gradient ids `lock-bronze`, `lock-bronze-edge`, `lock-bone`, `lock-sky`, `lock-pumpkin`, `lock-moon-glow` (plus existing `lock-chain`, `lock-pin`, `lock-glow`; `lock-iron`, `lock-rust`, `lock-rust-grain`, `lock-blood` stay until Task 7).
- Produces: `Bone({ x, y, length })`, `Skull({ cx, cy, r })`, `Cobweb({ x, y, size, flip? })`, `Keyhole({ cx, cy })` — SVG groups/paths. Eyes carry class `lock-eye` (+ `lock-eye--skull`).

- [ ] **Step 1: Write the failing tests**

`src/components/lock/LockDefs.test.tsx` — add this test inside the `describe`:

```tsx
  it('defines the bronze Halloween paint, all with lock-* ids', () => {
    const { container } = render(<svg><LockDefs /></svg>)
    const ids = [...container.querySelectorAll('defs [id]')].map((node) => node.id)
    expect(ids).toEqual(expect.arrayContaining([
      'lock-bronze', 'lock-bronze-edge', 'lock-bone', 'lock-sky', 'lock-pumpkin', 'lock-moon-glow', 'lock-glow', 'lock-pin',
    ]))
    expect(ids.every((id) => id.startsWith('lock-'))).toBe(true)
  })
```

`src/components/lock/Ornaments.test.tsx`:

```tsx
/** @file Tests for the bone-and-web ornaments of the Halloween padlocks. */
import { render } from '@testing-library/react'
import { Bone, Cobweb, Keyhole, Skull } from './Ornaments'

describe('Bone', () => {
  it('draws a shaft with two knobs at each end', () => {
    const { container } = render(<svg><Bone x={40} y={100} length={50} /></svg>)
    const bone = container.querySelector('g.lock-bone')
    expect(bone?.querySelector('rect')).toHaveAttribute('height', '50')
    const knobs = [...(bone?.querySelectorAll('circle') ?? [])].map((c) => c.getAttribute('cy'))
    expect(knobs).toEqual(['100', '100', '150', '150'])
  })
})

describe('Skull', () => {
  it('has two eyes that can turn red', () => {
    const { container } = render(<svg><Skull cx={150} cy={240} r={8} /></svg>)
    expect(container.querySelectorAll('g.lock-skull .lock-eye.lock-eye--skull')).toHaveLength(2)
  })
})

describe('Cobweb', () => {
  it('spins four threads and three rings from its corner', () => {
    const { container } = render(<svg><Cobweb x={36} y={102} size={24} /></svg>)
    const web = container.querySelector('g.lock-cobweb')
    expect(web).toHaveAttribute('transform', 'translate(36 102) scale(1 1)')
    expect(web?.querySelectorAll('line')).toHaveLength(4)
    expect(web?.querySelectorAll('polyline')).toHaveLength(3)
  })
  it('mirrors itself for the right-hand corner', () => {
    const { container } = render(<svg><Cobweb x={264} y={102} size={24} flip /></svg>)
    expect(container.querySelector('g.lock-cobweb')).toHaveAttribute('transform', 'translate(264 102) scale(-1 1)')
  })
})

describe('Keyhole', () => {
  it('draws a glowing keyhole', () => {
    const { container } = render(<svg><Keyhole cx={150} cy={232} /></svg>)
    expect(container.querySelector('path.lock-keyhole')).toHaveAttribute('d', expect.stringMatching(/^M150 227 /))
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/lock/LockDefs.test.tsx src/components/lock/Ornaments.test.tsx`
Expected: FAIL (missing ids; `./Ornaments` not found).

- [ ] **Step 3: Implement**

`src/components/lock/LockDefs.tsx` — update the `@file` header to "Shared paint of the padlocks: bronze Halloween gradients (body, edge, bone, night sky, pumpkin, moon), chain steel and pin gold. The rusty ids stay until every lock is bronze." and add inside `<defs>`, before `lock-chain`:

```tsx
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
```

Also change `lock-glow` to a stronger orange (it now also paints the flares):

```tsx
      <radialGradient id="lock-glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#ffb347" stopOpacity=".9" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
      </radialGradient>
```

`src/components/lock/Ornaments.tsx`:

```tsx
/**
 * @file Bone-and-web ornaments of the Halloween padlocks: bones, skull, cobweb and glowing keyhole.
 * Paint comes from LockDefs; eyes carry `lock-eye` so a wrong code can turn them red (lock.css).
 */

/** Props of Bone. */
export interface BoneProps {
  /** Centre line of the bone. */
  x: number
  /** Top end. */
  y: number
  /** Distance between both ends. */
  length: number
}

/**
 * An upright bone, as on the sides of the padlock in cadenas.jpeg.
 * @param props See BoneProps.
 * @returns An SVG group.
 */
export function Bone({ x, y, length }: BoneProps) {
  const knobs = [y, y + length].flatMap((cy) => [x - 3.5, x + 3.5].map((cx) => ({ cx, cy })))
  return (
    <g className="lock-bone" fill="url(#lock-bone)" stroke="#5c4a36" strokeWidth="1">
      <rect x={x - 3} y={y} width="6" height={length} rx="3" />
      {knobs.map(({ cx, cy }) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" />)}
    </g>
  )
}

/** Props of Skull. */
export interface SkullProps {
  cx: number
  cy: number
  /** Radius of the head. */
  r: number
}

/**
 * The skull hanging under the padlock.
 * @param props See SkullProps.
 * @returns An SVG group whose eyes can turn red.
 */
export function Skull({ cx, cy, r }: SkullProps) {
  return (
    <g className="lock-skull">
      <circle cx={cx} cy={cy} r={r} fill="url(#lock-bone)" stroke="#5c4a36" strokeWidth="1" />
      <rect x={cx - r * 0.55} y={cy + r * 0.5} width={r * 1.1} height={r * 0.7} rx={r * 0.2}
        fill="url(#lock-bone)" stroke="#5c4a36" strokeWidth="1" />
      <circle className="lock-eye lock-eye--skull" cx={cx - r * 0.38} cy={cy} r={r * 0.28} fill="#1a0f08" />
      <circle className="lock-eye lock-eye--skull" cx={cx + r * 0.38} cy={cy} r={r * 0.28} fill="#1a0f08" />
      <path d={`M${cx} ${cy + r * 0.3} l${-r * 0.15} ${r * 0.3} h${r * 0.3} z`} fill="#1a0f08" />
    </g>
  )
}

/** Props of Cobweb. */
export interface CobwebProps {
  /** Corner the web hangs from. */
  x: number
  y: number
  /** Length of its threads. */
  size: number
  /** True for a right-hand corner: the web opens towards the left. */
  flip?: boolean
}

/** Directions of the threads, from the corner (unit square). */
const RAYS = [[1, 0], [0.92, 0.4], [0.4, 0.92], [0, 1]] as const
/** Rings across the threads, as fractions of their length. */
const RINGS = [0.35, 0.65, 0.95] as const

/**
 * A cobweb in a corner of the padlock.
 * @param props See CobwebProps.
 * @returns An SVG group.
 */
export function Cobweb({ x, y, size, flip = false }: CobwebProps) {
  return (
    <g className="lock-cobweb" transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}
      fill="none" stroke="#e8dcc0" strokeOpacity=".55" strokeWidth=".8">
      {RAYS.map(([dx, dy]) => <line key={`${dx}-${dy}`} x1="0" y1="0" x2={dx * size} y2={dy * size} />)}
      {RINGS.map((t) => <polyline key={t} points={RAYS.map(([dx, dy]) => `${dx * size * t},${dy * size * t}`).join(' ')} />)}
    </g>
  )
}

/** Props of Keyhole. */
export interface KeyholeProps {
  /** Centre of the round part. */
  cx: number
  cy: number
}

/**
 * The glowing keyhole under the window.
 * @param props See KeyholeProps.
 * @returns An SVG path.
 */
export function Keyhole({ cx, cy }: KeyholeProps) {
  return (
    <path className="lock-keyhole" fill="#ffb347"
      d={`M${cx} ${cy - 5} a3.5 3.5 0 0 1 2 6.4 l1.5 5.6 h-7 l1.5 -5.6 a3.5 3.5 0 0 1 2 -6.4 Z`} />
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/lock/LockDefs.test.tsx src/components/lock/Ornaments.test.tsx`
Expected: PASS (the old rust test still passes: the rusty ids are kept).

- [ ] **Step 5: Commit**

```bash
git add src/components/lock/LockDefs.tsx src/components/lock/LockDefs.test.tsx src/components/lock/Ornaments.tsx src/components/lock/Ornaments.test.tsx
git commit -m "feat: add bronze paint and bone-and-web ornaments for the padlocks (#57)"
```

---

### Task 2: Crown (shackle, pumpkin, bat wings) and hanging ghost

**Files:**
- Create: `src/components/lock/LockCrown.tsx`
- Create: `src/components/lock/LockCrown.test.tsx`
- Create: `src/components/lock/HangingGhost.tsx`
- Create: `src/components/lock/HangingGhost.test.tsx`

**Interfaces:**
- Consumes: paint ids of Task 1.
- Produces: `LockShackle({ className, legBottom? = 104 })` (group with the given class, legs from y 66 to `legBottom` at x 100 and 200); `LockCrown()` (group `.lock-crown`: two `.lock-wing`, one `.lock-flare` at (150, 88), pumpkin with `.lock-pumpkin-face` holding two `.lock-eye.lock-eye--pumpkin`); `HangingGhost({ x, y })` (outer `<g transform>` → `.lock-hanging-ghost` → `.lock-ghost-swing`; the string starts 16 units above `y`). All in the 300-wide viewBox coordinates of the locks.

- [ ] **Step 1: Write the failing tests**

`src/components/lock/LockCrown.test.tsx`:

```tsx
/** @file Tests for the crown of the Halloween padlocks: shackle, pumpkin, bat wings. */
import { render } from '@testing-library/react'
import { LockCrown, LockShackle } from './LockCrown'

describe('LockShackle', () => {
  it('draws a bronze shackle whose legs go down to the body, with the class given', () => {
    const { container } = render(<svg><LockShackle className="cutaway-shackle" /></svg>)
    const paths = container.querySelectorAll('g.cutaway-shackle path')
    expect(paths[0]).toHaveAttribute('d', 'M100 104 V66 a50 50 0 0 1 100 0 V104')
    expect(paths[1]).toHaveAttribute('stroke', 'url(#lock-bronze)')
  })
  it('can have long legs, kept inside the body once it springs up', () => {
    const { container } = render(<svg><LockShackle className="victory-lock-shackle" legBottom={140} /></svg>)
    expect(container.querySelector('g.victory-lock-shackle path')).toHaveAttribute('d', 'M100 140 V66 a50 50 0 0 1 100 0 V140')
  })
})

describe('LockCrown', () => {
  it('has two bat wings, a flare and a lit pumpkin face with two eyes', () => {
    const { container } = render(<svg><LockCrown /></svg>)
    const crown = container.querySelector('g.lock-crown')
    expect(crown?.querySelectorAll('.lock-wing')).toHaveLength(2)
    expect(crown?.querySelector('.lock-flare')).not.toBeNull()
    expect(crown?.querySelectorAll('.lock-pumpkin-face .lock-eye.lock-eye--pumpkin')).toHaveLength(2)
  })
})
```

`src/components/lock/HangingGhost.test.tsx`:

```tsx
/** @file Tests for the little ghost hanging from the padlock chain. */
import { render } from '@testing-library/react'
import { HangingGhost } from './HangingGhost'

describe('HangingGhost', () => {
  it('hangs at the given point, with a group to jolt and a group that swings', () => {
    const { container } = render(<svg><HangingGhost x={252} y={66} /></svg>)
    const anchor = container.querySelector('g[transform="translate(252 66)"]')
    expect(anchor?.querySelector('.lock-hanging-ghost .lock-ghost-swing line')).toHaveAttribute('y1', '-16')
    expect(anchor?.querySelectorAll('.lock-ghost-swing circle')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/lock/LockCrown.test.tsx src/components/lock/HangingGhost.test.tsx`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`src/components/lock/LockCrown.tsx`:

```tsx
/**
 * @file Top of the Halloween padlocks, in the 300-wide viewBox of the locks: the bronze shackle (drawn behind the
 * body) and the crown drawn over the body's top edge (bat wings and a lit pumpkin). Motion in lock.css.
 */

/** Props of LockShackle. */
export interface LockShackleProps {
  /** Class the screen animates (cutaway-shackle, victory-lock-shackle, ...). */
  className: string
  /** Where the legs end; longer legs stay hidden in the body once the shackle springs up. */
  legBottom?: number
}

/**
 * The bronze shackle. Draw it before the body, which hides its legs.
 * @param props See LockShackleProps.
 * @returns An SVG group.
 */
export function LockShackle({ className, legBottom = 104 }: LockShackleProps) {
  const d = `M100 ${legBottom} V66 a50 50 0 0 1 100 0 V${legBottom}`
  return (
    <g className={className}>
      <path d={d} fill="none" stroke="#2a1b0b" strokeWidth="20" />
      <path d={d} fill="none" stroke="url(#lock-bronze)" strokeWidth="14" />
      <path d="M96 70 a54 54 0 0 1 40 -48" fill="none" stroke="#fff3c4" strokeOpacity=".45" strokeWidth="2" />
    </g>
  )
}

/** Left wing; the right one is its mirror image. */
const WING = 'M136 96 Q112 72 64 78 Q78 88 74 100 Q88 94 94 106 Q104 98 112 108 Q122 100 136 104 Z'

/**
 * Bat wings and pumpkin on top of the body. Draw it after the body.
 * @returns An SVG group.
 */
export function LockCrown() {
  return (
    <g className="lock-crown">
      {['left', 'right'].map((side) => (
        <path key={side} className="lock-wing" d={WING} fill="#24150f" stroke="url(#lock-bronze)" strokeWidth="2"
          transform={side === 'right' ? 'translate(300 0) scale(-1 1)' : undefined} />
      ))}
      {/* Invisible until a right answer or the victory lights it (lock.css). */}
      <circle className="lock-flare" cx="150" cy="88" r="30" fill="url(#lock-glow)" />
      <rect x="147" y="68" width="6" height="8" rx="2" fill="#3f5a1e" />
      <ellipse cx="150" cy="89" rx="17" ry="14" fill="url(#lock-pumpkin)" />
      <ellipse cx="150" cy="89" rx="7" ry="14" fill="none" stroke="#8a3208" strokeOpacity=".6" />
      <g className="lock-pumpkin-face">
        <path className="lock-eye lock-eye--pumpkin" d="M141 86 l4 -6 l4 6 z" fill="#ffd36b" />
        <path className="lock-eye lock-eye--pumpkin" d="M151 86 l4 -6 l4 6 z" fill="#ffd36b" />
        <path d="M141 93 l3 3 l3 -2 l3 3 l3 -3 l3 2 l3 -3 q-9 8 -18 0 z" fill="#ffd36b" />
      </g>
    </g>
  )
}
```

`src/components/lock/HangingGhost.tsx`:

```tsx
/**
 * @file Little ghost hanging from the padlock chain, as in cadenas.jpeg. Two nested groups: the outer one is
 * jolted by a right answer or flies away at the victory, the inner one swings all the time (lock.css).
 */

/** Props of HangingGhost. */
export interface HangingGhostProps {
  /** Top of the ghost's head; its string starts 16 units higher. */
  x: number
  y: number
}

/**
 * The ghost charm.
 * @param props See HangingGhostProps.
 * @returns An SVG group.
 */
export function HangingGhost({ x, y }: HangingGhostProps) {
  return (
    // The position is an attribute on its own group: a CSS transform on the animated groups would replace it.
    <g transform={`translate(${x} ${y})`}>
      <g className="lock-hanging-ghost">
        <g className="lock-ghost-swing">
          <line x1="0" y1="-16" x2="0" y2="0" stroke="#9a8f84" strokeWidth="1.5" />
          <path d="M0 0 c-7 0 -10 5 -10 11 v12 l3 -3 l3 3 l4 -3 l4 3 l3 -3 l3 3 v-12 c0 -6 -3 -11 -10 -11 z"
            fill="#f4efe6" stroke="#9a8f84" strokeWidth=".8" />
          <circle cx="-3.5" cy="9" r="1.8" fill="#1a0f08" />
          <circle cx="3.5" cy="9" r="1.8" fill="#1a0f08" />
        </g>
      </g>
    </g>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/lock/LockCrown.test.tsx src/components/lock/HangingGhost.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/lock/LockCrown.tsx src/components/lock/LockCrown.test.tsx src/components/lock/HangingGhost.tsx src/components/lock/HangingGhost.test.tsx
git commit -m "feat: add the padlock crown and its hanging ghost (#57)"
```

---

### Task 3: Night window and "HAPPY HALLOWEEN" banner

**Files:**
- Create: `src/components/lock/NightWindow.tsx`
- Create: `src/components/lock/NightWindow.test.tsx`
- Create: `src/components/lock/LockBanner.tsx`
- Create: `src/components/lock/LockBanner.test.tsx`

**Interfaces:**
- Consumes: paint ids of Task 1 (`lock-sky`, `lock-moon-glow`).
- Produces: `NightWindow({ box: { x, y, width, height }, shape: 'porthole' | 'plain' })` — group `.lock-night` with clipPath `#lock-window-clip`, moon `.lock-moon`, witch `.lock-witch`, castle `.lock-castle`; `porthole` adds a dark rim `.lock-window-rim` and rounds corners (rx 30). `LockBanner({ y })` — group `.lock-banner`, arc `#lock-banner-arc` from (70, y+8) to (230, y+8), text `.lock-banner-text` "HAPPY HALLOWEEN".

- [ ] **Step 1: Write the failing tests**

`src/components/lock/NightWindow.test.tsx`:

```tsx
/** @file Tests for the night sky seen through the padlock window. */
import { render } from '@testing-library/react'
import { NightWindow } from './NightWindow'

const BOX = { x: 48, y: 128, width: 204, height: 100 }

describe('NightWindow', () => {
  it('clips a sky with a moon, a witch and a castle to a round-cornered porthole with a rim', () => {
    const { container } = render(<svg><NightWindow box={BOX} shape="porthole" /></svg>)
    expect(container.querySelector('clipPath#lock-window-clip rect')).toHaveAttribute('rx', '30')
    const sky = container.querySelector('g[clip-path="url(#lock-window-clip)"]')
    expect(sky?.querySelector('rect')).toHaveAttribute('fill', 'url(#lock-sky)')
    expect(sky?.querySelector('.lock-moon')).not.toBeNull()
    expect(sky?.querySelector('.lock-witch')).not.toBeNull()
    expect(sky?.querySelector('.lock-castle')).not.toBeNull()
    expect(container.querySelector('.lock-window-rim')).not.toBeNull()
  })
  it('fills a plain rectangle, without rim, for the HTML window of the final lock', () => {
    const { container } = render(<svg><NightWindow box={BOX} shape="plain" /></svg>)
    expect(container.querySelector('clipPath#lock-window-clip rect')).toHaveAttribute('rx', '0')
    expect(container.querySelector('.lock-window-rim')).toBeNull()
  })
  it('puts the moon inside the window', () => {
    const { container } = render(<svg><NightWindow box={BOX} shape="porthole" /></svg>)
    const moon = container.querySelector('.lock-moon')
    const cx = Number(moon?.getAttribute('cx'))
    const cy = Number(moon?.getAttribute('cy'))
    expect(cx).toBeGreaterThan(BOX.x)
    expect(cx).toBeLessThan(BOX.x + BOX.width)
    expect(cy).toBeGreaterThan(BOX.y)
    expect(cy).toBeLessThan(BOX.y + BOX.height)
  })
})
```

`src/components/lock/LockBanner.test.tsx`:

```tsx
/** @file Tests for the glowing banner of the padlock. */
import { render } from '@testing-library/react'
import { LockBanner } from './LockBanner'

describe('LockBanner', () => {
  it('writes HAPPY HALLOWEEN along an arc', () => {
    const { container } = render(<svg><LockBanner y={116} /></svg>)
    expect(container.querySelector('path#lock-banner-arc')).toHaveAttribute('d', 'M70 124 Q150 102 230 124')
    const text = container.querySelector('text.lock-banner-text textPath')
    expect(text).toHaveTextContent('HAPPY HALLOWEEN')
    expect(text).toHaveAttribute('href', '#lock-banner-arc')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/lock/NightWindow.test.tsx src/components/lock/LockBanner.test.tsx`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`src/components/lock/NightWindow.tsx`:

```tsx
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
```

`src/components/lock/LockBanner.tsx`:

```tsx
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/lock/NightWindow.test.tsx src/components/lock/LockBanner.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/lock/NightWindow.tsx src/components/lock/NightWindow.test.tsx src/components/lock/LockBanner.tsx src/components/lock/LockBanner.test.tsx
git commit -m "feat: add the padlock night window and HAPPY HALLOWEEN banner (#57)"
```

---

### Task 4: Shared bronze body

**Files:**
- Create: `src/components/lock/HalloweenLockBody.tsx`
- Create: `src/components/lock/HalloweenLockBody.test.tsx`

**Interfaces:**
- Consumes: `Bone`, `Cobweb`, `Keyhole`, `Skull` (Task 1), `LockBanner`, `NightWindow` (Task 3).
- Produces: `LOCK_BODY_PATH: string`, `LOCK_WINDOW = { x: 48, y: 128, width: 204, height: 100 }`, `HalloweenLockBody({ children? })` — group `.lock-body` (edge, face `.lock-body-face`, cobwebs, bones, banner, window, children drawn over the sky, keyhole flare `.lock-flare`, keyhole, skull), in the `0 0 300 250` viewBox.

- [ ] **Step 1: Write the failing test**

`src/components/lock/HalloweenLockBody.test.tsx`:

```tsx
/** @file Tests for the bronze body shared by the SVG padlocks. */
import { render } from '@testing-library/react'
import { HalloweenLockBody, LOCK_BODY_PATH } from './HalloweenLockBody'

describe('HalloweenLockBody', () => {
  it('draws a thick bronze body with webs, bones, banner, night window, keyhole and skull', () => {
    const { container } = render(<svg><HalloweenLockBody /></svg>)
    const body = container.querySelector('g.lock-body')
    const outlines = [...(body?.querySelectorAll(`path[d="${LOCK_BODY_PATH}"]`) ?? [])]
    expect(outlines.map((p) => p.getAttribute('fill'))).toEqual(['url(#lock-bronze-edge)', 'url(#lock-bronze)'])
    expect(body?.querySelectorAll('.lock-cobweb')).toHaveLength(2)
    expect(body?.querySelectorAll('.lock-bone')).toHaveLength(2)
    expect(body?.querySelector('.lock-banner')).toHaveTextContent('HAPPY HALLOWEEN')
    expect(body?.querySelector('.lock-night .lock-window-rim')).not.toBeNull()
    expect(body?.querySelector('.lock-keyhole')).not.toBeNull()
    expect(body?.querySelector('.lock-flare')).not.toBeNull()
    expect(body?.querySelector('.lock-skull')).not.toBeNull()
  })
  it('draws its children over the sky, under the keyhole', () => {
    const { container } = render(<svg><HalloweenLockBody><rect className="pins" /></HalloweenLockBody></svg>)
    const order = [...container.querySelectorAll('.lock-night, .pins, .lock-keyhole')].map((n) => n.getAttribute('class'))
    expect(order).toEqual(['lock-night', 'pins', 'lock-keyhole'])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/lock/HalloweenLockBody.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/components/lock/HalloweenLockBody.tsx`:

```tsx
/**
 * @file Bronze body shared by the SVG padlocks (step screen and victory), in their `0 0 300 250` viewBox:
 * an edge drawn lower for the thickness, cobwebs, bones, the HAPPY HALLOWEEN banner, the night window
 * (children are drawn over its sky), a glowing keyhole and a skull. Draw LockShackle before it, LockCrown after.
 */
import type { ReactNode } from 'react'
import { LockBanner } from './LockBanner'
import { NightWindow } from './NightWindow'
import { Bone, Cobweb, Keyhole, Skull } from './Ornaments'

/** Outline of the body: straight sides, a crowned top, a rounded point at the bottom. */
export const LOCK_BODY_PATH = 'M58 98 Q150 84 242 98 Q268 102 268 128 V200 Q268 238 150 248 Q32 238 32 200 V128 Q32 102 58 98 Z'
/** The window, wide enough for the pins of six challenges with readable digits. */
export const LOCK_WINDOW = { x: 48, y: 128, width: 204, height: 100 }
/** Thickness of the lock, shown by the edge under the face. */
const EDGE = 6

/** Props of HalloweenLockBody. */
export interface HalloweenLockBodyProps {
  /** What the window shows over its sky (the pins of the step screen). */
  children?: ReactNode
}

/**
 * The bronze body of the padlock.
 * @param props See HalloweenLockBodyProps.
 * @returns An SVG group.
 */
export function HalloweenLockBody({ children }: HalloweenLockBodyProps) {
  return (
    <g className="lock-body">
      <path d={LOCK_BODY_PATH} transform={`translate(0 ${EDGE})`} fill="url(#lock-bronze-edge)" />
      <path className="lock-body-face" d={LOCK_BODY_PATH} fill="url(#lock-bronze)" stroke="#3a2610" strokeWidth="2" />
      <path d="M40 126 Q42 106 66 102" fill="none" stroke="#fff3c4" strokeOpacity=".5" strokeWidth="2" />
      <Cobweb x={36} y={102} size={24} />
      <Cobweb x={264} y={102} size={24} flip />
      <Bone x={39} y={146} length={56} />
      <Bone x={261} y={146} length={56} />
      <LockBanner y={116} />
      <NightWindow box={LOCK_WINDOW} shape="porthole" />
      {children}
      {/* Invisible until a right answer or the victory lights it (lock.css). */}
      <circle className="lock-flare" cx="150" cy="233" r="18" fill="url(#lock-glow)" />
      <Keyhole cx={150} cy={232} />
      <Skull cx={150} cy={248} r={7} />
    </g>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/lock/HalloweenLockBody.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/lock/HalloweenLockBody.tsx src/components/lock/HalloweenLockBody.test.tsx
git commit -m "feat: add the shared bronze padlock body (#57)"
```

---

### Task 5: Step screen lock in bronze, with ambience and the jolt

**Files:**
- Modify: `src/components/CutawayLock.tsx` (rewrite of the markup and geometry)
- Modify: `src/components/CutawayLock.test.tsx`
- Modify: `src/styles/lock.css` (rewrite)

**Interfaces:**
- Consumes: `LockDefs`, `LockChains`, `LockShackle`, `LockCrown`, `HangingGhost`, `HalloweenLockBody`.
- Produces: SVG classes `cutaway-lock`, `cutaway-lock--open`, `cutaway-lock--jolt` (while `fallingIndex` is set); CSS keyframes `lock-flare`, `ghost-swing`, `pumpkin-flicker`, `witch-fly`, `eyes-red` (used by Tasks 6 and 7), and `.final-lock--alarmed .lock-eye` rule (used by Task 6).

- [ ] **Step 1: Update the tests (failing)**

In `src/components/CutawayLock.test.tsx`, replace the test `'wears rusty iron, crossed chains and blood at the keyhole while shut'` by:

```tsx
  it('wears the bronze Halloween look: shackle, crown, banner, night window, chains and hanging ghost', () => {
    const { container } = render(<CutawayLock total={6} foundDigits={[4]} />)
    expect(container.querySelector('.cutaway-shackle')).not.toBeNull()
    expect(container.querySelector('.lock-crown .lock-pumpkin-face')).not.toBeNull()
    expect(container.querySelector('.lock-body .lock-banner')).toHaveTextContent('HAPPY HALLOWEEN')
    expect(container.querySelector('.lock-night')).not.toBeNull()
    expect(container.querySelectorAll('.lock-chain')).toHaveLength(2)
    expect(container.querySelector('.lock-chains--fallen')).toBeNull()
    expect(container.querySelector('.lock-hanging-ghost')).not.toBeNull()
    expect(container.querySelector('.blood-drip')).toBeNull()
    expect(container.querySelector('[filter="url(#lock-rust-grain)"]')).toBeNull()
  })
  it('jolts on its chain only while a pin is falling', () => {
    const { container, rerender } = render(<CutawayLock total={6} foundDigits={[4]} />)
    expect(container.querySelector('.cutaway-lock--jolt')).toBeNull()
    rerender(<CutawayLock total={6} foundDigits={[4]} fallingIndex={0} />)
    expect(container.querySelector('svg')).toHaveClass('cutaway-lock', 'cutaway-lock--jolt')
  })
  it('jolts and opens together when the last pin falls', () => {
    const { container } = render(<CutawayLock total={2} foundDigits={[1, 2]} fallingIndex={1} />)
    expect(container.querySelector('svg')).toHaveClass('cutaway-lock--open', 'cutaway-lock--jolt')
  })
  it('keeps the digits inside the window', () => {
    const { container } = render(<CutawayLock total={6} foundDigits={[1, 2, 3, 4, 5, 6]} />)
    for (const digit of container.querySelectorAll('.lock-digit')) {
      const x = Number(digit.getAttribute('x'))
      const y = Number(digit.getAttribute('y'))
      expect(x).toBeGreaterThan(48)
      expect(x).toBeLessThan(252)
      expect(y).toBeLessThanOrEqual(228)
    }
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/CutawayLock.test.tsx`
Expected: FAIL on the look, jolt and window tests.

- [ ] **Step 3: Implement `CutawayLock.tsx`**

Replace the `@file` header, the imports, the geometry constants and the component (keep `lockLabel`, `isFound`, `pinClass` and `CutawayLockProps` as they are):

```tsx
/**
 * @file Bronze Halloween padlock seen in cross-section, on the step screen: one pin per step drops below the
 * shear line when its digit is found; the lock then jolts on its chain and its pumpkin flares; once every pin
 * is down the shackle frees itself and the chains fall. Motion lives in lock.css, paint in LockDefs.
 */
import { HalloweenLockBody } from './lock/HalloweenLockBody'
import { HangingGhost } from './lock/HangingGhost'
import { LockChains } from './lock/LockChains'
import { LockCrown, LockShackle } from './lock/LockCrown'
import { LockDefs } from './lock/LockDefs'
```

```tsx
/** Pin chamber, inside the night window (LOCK_WINDOW of HalloweenLockBody). */
const CHAMBER = { x: 58, y: 134, width: 184, height: 60 }
/** Where the pins must go below for the shackle to move. */
const SHEAR_LINE_Y = 166
const PIN_HEIGHT = 26
/** Baseline of the digits, on a dark plate: the night sky would swallow them. */
const DIGIT_Y = 221
const DIGIT_PLATE = { x: 58, y: 197, width: 184, height: 30 }
/** The chains cross behind the lock: only their ends show, around the shackle and under the body. */
const CHAIN_BOX = { x: 2, y: 24, width: 296, height: 222 }
```

```tsx
/** @returns Class names of the lock: open once every pin is down, jolting while a pin falls. */
function lockClass(open: boolean, jolt: boolean): string {
  return ['cutaway-lock', open && 'cutaway-lock--open', jolt && 'cutaway-lock--jolt'].filter(Boolean).join(' ')
}

/**
 * The padlock of the step screen.
 * @param props See CutawayLockProps.
 * @returns An SVG image of the lock, described in French for screen readers.
 */
export function CutawayLock({ total, foundDigits, fallingIndex }: CutawayLockProps) {
  const down = foundDigits.filter(isFound).length
  const open = down >= total
  const pitch = CHAMBER.width / total
  // Pins stay readable with few steps and never touch each other with many.
  const pinWidth = Math.max(4, Math.min(20, pitch - 8))
  const fontSize = Math.min(28, pitch * 0.92)
  return (
    <svg className={lockClass(open, fallingIndex !== undefined)} viewBox="0 0 300 250"
      role="img" aria-label={lockLabel(total, down)}>
      <LockDefs />
      <ellipse cx="150" cy="160" rx="150" ry="95" fill="url(#lock-glow)" opacity=".35" />
      <LockChains box={CHAIN_BOX} fallen={open} />
      <LockShackle className="cutaway-shackle" />
      <HalloweenLockBody>
        {/* Translucent: the moon and the castle show behind the pins. */}
        <rect {...CHAMBER} rx="6" fill="#0f0a07" fillOpacity=".35" />
        <rect {...DIGIT_PLATE} rx="6" fill="#0f0a07" fillOpacity=".85" />
        {Array.from({ length: total }, (_, i) => {
          const x = CHAMBER.x + pitch * i
          const digit = foundDigits[i]
          const found = isFound(digit)
          return (
            <g key={i}>
              {found && <rect className="lock-slot-glow" x={x} y={CHAMBER.y} width={pitch} height={CHAMBER.height} fill="#f2a541" />}
              <rect className={pinClass(found, i === fallingIndex)} x={x + (pitch - pinWidth) / 2} y={CHAMBER.y + 4}
                width={pinWidth} height={PIN_HEIGHT} rx={Math.min(4, pinWidth / 2)} fill="url(#lock-pin)" />
              <text className={found ? 'lock-digit lock-digit--found' : 'lock-digit'} x={x + pitch / 2} y={DIGIT_Y}
                fontSize={fontSize} textAnchor="middle">
                {found ? digit : '·'}
              </text>
            </g>
          )
        })}
        <line x1={CHAMBER.x} y1={SHEAR_LINE_Y} x2={CHAMBER.x + CHAMBER.width} y2={SHEAR_LINE_Y}
          stroke="#f3d27a" strokeOpacity=".45" strokeDasharray="4 4" />
        <rect {...CHAMBER} rx="6" fill="none" stroke="#000" strokeOpacity=".6" strokeWidth="2" />
      </HalloweenLockBody>
      <LockCrown />
      <HangingGhost x={252} y={66} />
    </svg>
  )
}
```

Remove the old `SHACKLE`, `RIVETS`, `KEYHOLE`, `DRIPS` constants and the `BloodDrips` import.

- [ ] **Step 4: Rewrite `src/styles/lock.css`**

```css
/**
 * @file Bronze Halloween padlocks: cutaway pins, shackle release, chains, ambience (pumpkin, ghost, witch),
 * jolt on a right answer, red eyes on a wrong code. Base styles = final state, keyframes = starting state,
 * so reduced motion (base.css) shows the end at once and freezes the ambience.
 */
.cutaway-lock { width: 300px; height: auto; overflow: visible; }
/* The chains and the ghost spill out of the viewBox: they must never catch a tap meant for the keypad. */
.cutaway-lock * { pointer-events: none; }
.lock-pin { transform-box: view-box; }
/* 26 = PIN_HEIGHT of CutawayLock.tsx: a found pin sits just under the shear line. */
.lock-pin--down { transform: translateY(26px); }
/* 0.45 s: the clack of playPinSound (sound.ts) lands at the end of this fall. */
.lock-pin--falling { animation: pin-fall .45s cubic-bezier(.55, 0, 1, .45) both; }
@keyframes pin-fall { from { transform: translateY(0); } }

.lock-slot-glow { opacity: .3; }
.lock-slot-glow:has(+ .lock-pin--falling) { animation: slot-light .6s .4s both; }
@keyframes slot-light { from { opacity: 0; } }

/* Text font: the title font only has old-style digits. */
.lock-digit { fill: #8a7a6a; font-family: var(--text-font); font-weight: 700; font-variant-numeric: lining-nums; }
.lock-digit--found { fill: #ffd36b; }

/* The shackle rises out of the body, then swings on its left leg. */
.cutaway-lock--open .cutaway-shackle {
  transform: translateY(-24px) rotate(-16deg);
  transform-box: view-box; transform-origin: 100px 98px;
  animation: shackle-release .9s .5s both;
}
@keyframes shackle-release {
  from { transform: none; }
  50% { transform: translateY(-24px); }
}

/* Right answer: once the pin lands (0.4 s), the lock tips forward on its chain and swings back, the ghost
   bounces, the pumpkin and the keyhole flare. Transforms never change the layout: the screen does not move. */
.cutaway-lock--jolt { transform-origin: 50% 8%; animation: lock-jolt 1.5s .4s ease-out both; }
.cutaway-lock--jolt .lock-flare { animation: lock-flare 1s .4s both; }
.cutaway-lock--jolt .lock-hanging-ghost { animation: ghost-jolt 1.5s .4s ease-out both; }
@keyframes lock-jolt {
  0% { transform: none; }
  12% { transform: perspective(700px) rotateX(22deg) rotate(-5deg); }
  32% { transform: perspective(700px) rotateX(-10deg) rotate(4deg); }
  55% { transform: perspective(700px) rotateX(5deg) rotate(-2deg); }
  78% { transform: perspective(700px) rotateX(-2deg) rotate(1deg); }
  100% { transform: none; }
}
@keyframes ghost-jolt { 15% { transform: rotate(28deg); } 40% { transform: rotate(-18deg); } 65% { transform: rotate(8deg); } }

/* Flares (pumpkin, keyhole): off at rest, lit for a moment by a right answer or the victory. */
.lock-flare { opacity: 0; }
@keyframes lock-flare { 30%, 60% { opacity: 1; } }

@media (max-width: 600px) {
  .cutaway-lock { width: 240px; }
}

/* Chains (LockChains): they drop away once the lock opens, each swinging to its own side. */
.lock-chain { transform-box: view-box; transform-origin: 150px 150px; }
.lock-chains--fallen .lock-chain { opacity: 0; animation: chain-fall .8s .3s cubic-bezier(.5, 0, 1, .5) both; }
.lock-chains--fallen .lock-chain--left { transform: translate(-20px, 180px) rotate(-25deg); }
.lock-chains--fallen .lock-chain--right { transform: translate(20px, 180px) rotate(25deg); }
@keyframes chain-fall { from { transform: none; opacity: 1; } 80% { opacity: 1; } }

/* Ambience, discreet so that the children keep their eyes on the riddle. */
.lock-pumpkin-face { animation: pumpkin-flicker 3.2s ease-in-out infinite; }
@keyframes pumpkin-flicker { 20% { opacity: .75; } 23% { opacity: .95; } 50% { opacity: .8; } 72% { opacity: .7; } }
/* The ghost hangs from the top of its string. */
.lock-hanging-ghost, .lock-ghost-swing { transform-box: fill-box; transform-origin: 50% 0; }
.lock-ghost-swing { animation: ghost-swing 4s ease-in-out infinite; }
@keyframes ghost-swing { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
/* At rest the witch sits in front of the moon; every 12 s she crosses it (the window clips her out of sight). */
.lock-witch { animation: witch-fly 12s linear infinite; }
@keyframes witch-fly { 0% { transform: translateX(-320px); } 25%, 100% { transform: translateX(320px); } }
.lock-keyhole { filter: drop-shadow(0 0 3px #ff8a1f); }
.lock-banner-text { font-family: var(--text-font); filter: drop-shadow(0 0 2px #ff7a1a); }

/* Wrong code at the final padlock: the eyes of the pumpkin and the skull burn red for a second. */
.final-lock--alarmed .lock-eye { animation: eyes-red 1s both; }
@keyframes eyes-red { 0%, 70% { fill: #ff2a1a; } }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/CutawayLock.test.tsx src/components/StepScreen.test.tsx`
Expected: PASS (the pin tests are unchanged: pins stay within x 44–256).

- [ ] **Step 6: Check the step screen still fits the tablet**

Stop any `vite preview` on port 4173, then run: `npx playwright test e2e/layout.spec.ts` (the `test:e2e` script builds first: use `npm run test:e2e -- e2e/layout.spec.ts`).
Expected: PASS (same viewBox and width, so the same height).

- [ ] **Step 7: Look at it**

Run `npm run build && npx vite preview --port 4173` in the background, open `http://localhost:4173/quiz-halloween/` with the Playwright browser at 810×1080, set the tablet up (code 2710, team Zombies), tap « Commencer », type `CRAPAUD` and Valider; take screenshots right after (jolt) and after 2 s. Also at 360×740. Check: digits readable, banner readable, skull not covering the answer zone, nothing overlaps badly. Adjust coordinates (in `HalloweenLockBody.tsx`, `LockCrown.tsx`, `CutawayLock.tsx`) if needed, re-run the tests. Stop the preview server.

- [ ] **Step 8: Commit**

```bash
git add src/components/CutawayLock.tsx src/components/CutawayLock.test.tsx src/styles/lock.css
git commit -m "feat: dress the step screen padlock in bronze and jolt it on a right answer (#57)"
```

---

### Task 6: Final padlock in bronze, red eyes on a wrong code

**Files:**
- Modify: `src/components/lock/FinalLock.tsx` (rewrite)
- Modify: `src/components/lock/FinalLock.test.tsx`
- Modify: `src/components/PadlockScreen.tsx:52`
- Modify: `src/components/PadlockScreen.test.tsx`
- Modify: `src/styles/padlock.css` (final lock section and its phone rules)

**Interfaces:**
- Consumes: `LockDefs`, `LockChains`, `LockShackle`, `LockCrown`, `HangingGhost`, `NightWindow`, `Bone`, `Cobweb`, `Skull`; `.final-lock--alarmed .lock-eye` rule of Task 5.
- Produces: `FinalLock({ children, alarmed? = false })`; classes `final-lock`, `final-lock--alarmed`, `final-lock-crown`, `final-lock-body`, `final-lock-banner`, `final-lock-window`, `final-lock-sky`.

- [ ] **Step 1: Update the tests (failing)**

`src/components/lock/FinalLock.test.tsx` — replace the file's test by:

```tsx
/** @file Tests for the bronze frame of the final padlock. */
import { render, screen } from '@testing-library/react'
import { FinalLock } from './FinalLock'

describe('FinalLock', () => {
  it('puts the dials in a night window of a bronze body under a chained crown, all drawn as decoration', () => {
    const { container } = render(<FinalLock><button type="button">molette</button></FinalLock>)
    expect(container.querySelector('.final-lock-window')).toContainElement(screen.getByRole('button', { name: 'molette' }))
    for (const svg of container.querySelectorAll('svg')) expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.final-lock-crown .lock-chains')).not.toBeNull()
    expect(container.querySelector('.final-lock-crown .lock-pumpkin-face')).not.toBeNull()
    expect(container.querySelector('.final-lock-sky .lock-night')).not.toBeNull()
    expect(container.querySelector('.final-lock-banner')).toHaveTextContent('HAPPY HALLOWEEN')
    expect(container.querySelector('.final-lock-banner')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.lock-skull')).not.toBeNull()
    expect(container.querySelector('.blood-drip')).toBeNull()
  })
  it('is calm by default and alarmed on demand', () => {
    const { container, rerender } = render(<FinalLock><i /></FinalLock>)
    expect(container.querySelector('.final-lock--alarmed')).toBeNull()
    rerender(<FinalLock alarmed><i /></FinalLock>)
    expect(container.querySelector('.final-lock')).toHaveClass('final-lock--alarmed')
  })
})
```

`src/components/PadlockScreen.test.tsx` — add inside the `describe`:

```tsx
  it('turns the eyes of the lock red only after a wrong code', () => {
    const { container, rerender } = render(<PadlockScreen {...props} />)
    expect(container.querySelector('.final-lock--alarmed')).toBeNull()
    rerender(<PadlockScreen {...props} wrongAttempts={1} />)
    expect(container.querySelector('.final-lock--alarmed')).not.toBeNull()
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/lock/FinalLock.test.tsx src/components/PadlockScreen.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `FinalLock.tsx`**

```tsx
/**
 * @file Frame of the final padlock, in the bronze Halloween style: chained shackle, pumpkin and bat wings above
 * (SVG), then an HTML bronze body (it grows with the number of dials) with the HAPPY HALLOWEEN banner and a
 * night-sky window holding the dials, cobwebs, bones and a skull. Styles in padlock.css, motion in lock.css.
 */
import type { ReactNode } from 'react'
import { HangingGhost } from './HangingGhost'
import { LockChains } from './LockChains'
import { LockCrown, LockShackle } from './LockCrown'
import { LockDefs } from './LockDefs'
import { NightWindow } from './NightWindow'
import { Bone, Cobweb, Skull } from './Ornaments'

/** Props of FinalLock. */
export interface FinalLockProps {
  /** What the window holds: the dials. */
  children: ReactNode
  /** True after a wrong code: the eyes of the pumpkin and the skull burn red for a moment. */
  alarmed?: boolean
}

/** The chains cross behind the shackle and hang past its legs. */
const CHAIN_BOX = { x: 0, y: 6, width: 300, height: 104 }
/** Sky drawn wider than tall, then cropped to the window (`slice`) whatever the number of dials. */
const SKY = { x: 0, y: 0, width: 400, height: 140 }

/**
 * The great padlock that the dials open.
 * @param props See FinalLockProps.
 * @returns The lock, with its children in the window.
 */
export function FinalLock({ children, alarmed = false }: FinalLockProps) {
  return (
    <div className={alarmed ? 'final-lock final-lock--alarmed' : 'final-lock'}>
      <svg className="final-lock-crown" viewBox="0 0 300 110" aria-hidden="true">
        {/* The only LockDefs of the screen: the sky and the ornaments below point to these ids too. */}
        <LockDefs />
        <LockChains box={CHAIN_BOX} />
        <LockShackle className="final-lock-shackle" />
        <LockCrown />
        <HangingGhost x={236} y={48} />
      </svg>
      <div className="final-lock-body">
        <svg className="final-lock-web final-lock-web--left" viewBox="0 0 30 30" aria-hidden="true"><Cobweb x={0} y={0} size={28} /></svg>
        <svg className="final-lock-web final-lock-web--right" viewBox="0 0 30 30" aria-hidden="true"><Cobweb x={30} y={0} size={28} flip /></svg>
        <p className="final-lock-banner" aria-hidden="true">HAPPY HALLOWEEN</p>
        <div className="final-lock-window">
          <svg className="final-lock-sky" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <NightWindow box={SKY} shape="plain" />
          </svg>
          {children}
        </div>
        <svg className="final-lock-bone final-lock-bone--left" viewBox="0 0 12 70" aria-hidden="true"><Bone x={6} y={5} length={60} /></svg>
        <svg className="final-lock-bone final-lock-bone--right" viewBox="0 0 12 70" aria-hidden="true"><Bone x={6} y={5} length={60} /></svg>
        <svg className="final-lock-skull" viewBox="0 0 24 26" aria-hidden="true"><Skull cx={12} cy={11} r={9} /></svg>
      </div>
    </div>
  )
}
```

`src/components/PadlockScreen.tsx` — replace `<FinalLock>` by:

```tsx
        <FinalLock alarmed={wrongAttempts > 0}>
```

(The zone around it is remounted on each wrong code — `key={wrongAttempts}` — so the red eyes replay each time.)

- [ ] **Step 4: Update `src/styles/padlock.css`**

Replace the comment above `.dials` by: `/* Six dials on one row on the tablet: 6 × 96 + 5 × 12 = 636 px, + window 2 × (12 + 4) + body 2 × (14 + 2) = 700 px, within the 714 px of the screen. */`, change `.dial`'s comment to `/* above the night sky */`, and replace the whole `/* Final lock (FinalLock) ... */` block (from `.final-lock {` to `.final-lock-blood {...}`) by:

```css
/* Final lock (FinalLock): crown (shackle, pumpkin, wings) over a bronze body whose night window holds the dials. */
.final-lock { display: flex; flex-direction: column; align-items: center; }
.final-lock svg { pointer-events: none; overflow: visible; }
/* The pumpkin overlaps the top of the body, as in cadenas.jpeg. */
.final-lock-crown { position: relative; z-index: 1; width: 300px; height: auto; margin-bottom: -22px; }
.final-lock-body {
  position: relative; padding: 18px 14px 36px;
  border: 2px solid #3a2610; border-radius: 40px 40px 50% 50% / 40px 40px 70px 70px;
  background: linear-gradient(135deg, #4a3012, #a0712c 30%, #f3d27a 48%, #c9973f 62%, #5a3d17);
  /* The flat dark shadow under the body is its thickness. */
  box-shadow: 0 8px 0 #2a1b0b, 0 16px 30px rgb(0 0 0 / .6), inset 0 2px 0 rgb(255 243 196 / .5);
}
.final-lock-banner {
  width: fit-content; margin: 0 auto 10px; padding: 2px 22px; border-radius: 999px;
  background: #2a1508; border: 2px solid #1a0d05;
  font-family: var(--text-font); font-size: 24px; font-weight: 800; letter-spacing: .08em;
  color: #ffb347; text-shadow: 0 0 8px #ff7a1a;
}
.final-lock-window {
  position: relative; overflow: hidden; padding: 12px;
  border: 4px solid #2a1b0b; border-radius: 32px; box-shadow: inset 0 0 18px rgb(0 0 0 / .8);
}
.final-lock-sky { position: absolute; inset: 0; width: 100%; height: 100%; }
.final-lock-web { position: absolute; top: 6px; width: 44px; height: 44px; }
.final-lock-web--left { left: 6px; }
.final-lock-web--right { right: 6px; }
.final-lock-bone { position: absolute; top: 50%; width: 14px; height: 80px; margin-top: -24px; }
.final-lock-bone--left { left: 0; }
.final-lock-bone--right { right: 0; }
.final-lock-skull { position: absolute; left: 50%; bottom: -18px; width: 40px; height: 44px; margin-left: -20px; }
.open-button { margin-top: auto; }
```

In the `@media (max-width: 600px)` block, replace `.final-lock-body { padding: 16px 8px 20px; }` and the dials comment by:

```css
  /* Six dials and the lock body must fit one row in the 328 px of a 360 px phone:
     6 × 48 + 5 × 4 = 308 px, + window border 2 × 2 + body 2 × (6 + 1) = 326 px. */
  .final-lock-crown { width: 200px; margin-bottom: -15px; }
  .final-lock-body { padding: 12px 6px 26px; border-width: 1px; }
  .final-lock-banner { font-size: 15px; padding: 1px 14px; margin-bottom: 6px; }
  .final-lock-window { padding: 6px 0; border-width: 2px; border-radius: 20px; }
  /* No room for the bones beside six dials on a phone. */
  .final-lock-bone { display: none; }
  .final-lock-web { width: 26px; height: 26px; top: 4px; }
  .final-lock-skull { width: 28px; height: 30px; margin-left: -14px; bottom: -12px; }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/lock/FinalLock.test.tsx src/components/PadlockScreen.test.tsx src/components/Dial.test.tsx`
Expected: PASS.

- [ ] **Step 6: Look at it**

With a fresh build and preview, reach the padlock (clock installed: set up Zombies, « Commencer », then 6 × { fast-forward 15:00, type 2710 on « Temps écoulé », « Continuer » }). Screenshot at 810×1080 and 360×740; type a wrong code and screenshot at +0.3 s (red eyes). Check: 6 dials on one row, no horizontal scroll on the phone, banner readable, skull not over the « Ouvrir » button. Adjust `padlock.css` if needed. Stop the preview.

- [ ] **Step 7: Commit**

```bash
git add src/components/lock/FinalLock.tsx src/components/lock/FinalLock.test.tsx src/components/PadlockScreen.tsx src/components/PadlockScreen.test.tsx src/styles/padlock.css
git commit -m "feat: dress the final padlock in bronze and redden its eyes on a wrong code (#57)"
```

---

### Task 7: Victory — the plunge into the lock, sound in time, rust removed

**Files:**
- Modify: `src/components/lock/VictoryLock.tsx` (rewrite)
- Modify: `src/components/lock/VictoryLock.test.tsx`
- Modify: `src/components/HauntedDoor.tsx`
- Modify: `src/components/HauntedDoor.test.tsx`
- Modify: `src/styles/victory.css`
- Modify: `src/services/sound.ts`, `src/services/sound.test.ts`
- Modify: `src/components/lock/LockDefs.tsx`, `src/components/lock/LockDefs.test.tsx` (drop the rusty ids)
- Delete: `src/components/lock/BloodDrips.tsx`, `src/components/lock/BloodDrips.test.tsx`

**Interfaces:**
- Consumes: `LockDefs`, `LockChains`, `LockShackle`, `LockCrown`, `HangingGhost`, `HalloweenLockBody`, `LOCK_BODY_PATH`; keyframes `lock-flare` (lock.css).
- Produces: `VictoryLock()` → `div.victory-lock-3d[aria-hidden]` holding `svg.victory-lock-back` and `svg.victory-lock`; `HauntedDoor` wraps it in `div.victory-plunge`.

- [ ] **Step 1: Update the tests (failing)**

`src/components/lock/VictoryLock.test.tsx`:

```tsx
/** @file Tests for the bronze padlock the victory screen plunges into. */
import { render } from '@testing-library/react'
import { LOCK_BODY_PATH } from './HalloweenLockBody'
import { VictoryLock } from './VictoryLock'

describe('VictoryLock', () => {
  it('draws a bronze lock with a thickness behind it, whose shackle springs and chains fall, as decoration', () => {
    const { container } = render(<VictoryLock />)
    const root = container.querySelector('.victory-lock-3d')
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root?.querySelector('svg.victory-lock-back path')).toHaveAttribute('d', LOCK_BODY_PATH)
    const svg = root?.querySelector('svg.victory-lock')
    expect(svg?.querySelector('#lock-bronze')).not.toBeNull()
    expect(svg?.querySelector('.victory-lock-shackle')).not.toBeNull()
    expect(svg?.querySelector('.lock-chains--fallen')).not.toBeNull()
    expect(svg?.querySelector('.lock-night')).not.toBeNull()
    expect(svg?.querySelector('.lock-hanging-ghost')).not.toBeNull()
    expect(svg?.querySelector('.blood-drip')).toBeNull()
  })
})
```

`src/components/HauntedDoor.test.tsx` — replace `expect(container.querySelector('.victory-lock')).not.toBeNull()` by:

```tsx
    expect(container.querySelector('.victory-plunge .victory-lock')).not.toBeNull()
```

`src/services/sound.test.ts` — add inside `describe('playVictorySound')`:

```tsx
  it('clacks as the shackle springs (0.9 s), creaks with the doors (2.4 s), moans with the ghosts (3.6 s)', () => {
    const { ctx, oscillators } = fakeContext()
    playVictorySound(() => ctx)
    const starts = (type: string) => oscillators.filter((o) => o.type === type).map((o) => o.start.mock.calls[0]?.[0])
    expect(starts('square')).toEqual([0.9])
    expect(starts('sawtooth')).toEqual([2.4])
    expect(starts('sine')).toContain(3.6)
  })
```

`src/components/lock/LockDefs.test.tsx` — replace the old rust test by:

```tsx
  it('has no rust nor blood left', () => {
    const { container } = render(<svg><LockDefs /></svg>)
    const ids = [...container.querySelectorAll('defs [id]')].map((node) => node.id)
    for (const id of ['lock-iron', 'lock-rust', 'lock-rust-grain', 'lock-blood']) expect(ids).not.toContain(id)
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/lock src/components/HauntedDoor.test.tsx src/services/sound.test.ts`
Expected: FAIL on VictoryLock, HauntedDoor, sound timing and LockDefs.

- [ ] **Step 3: Implement**

`src/components/lock/VictoryLock.tsx`:

```tsx
/**
 * @file Bronze padlock of the victory screen: it turns to face the children, its keyhole flares, its shackle
 * springs up and its chains fall, then the screen plunges into its night window. The same outline pushed back
 * in 3D gives it a thickness while it turns. Motion in victory.css.
 */
import { HalloweenLockBody, LOCK_BODY_PATH } from './HalloweenLockBody'
import { HangingGhost } from './HangingGhost'
import { LockChains } from './LockChains'
import { LockCrown, LockShackle } from './LockCrown'
import { LockDefs } from './LockDefs'

/** Same box as the step screen lock: the `chain-fall` pivot of lock.css is set for it. */
const CHAIN_BOX = { x: 2, y: 24, width: 296, height: 222 }

/**
 * The padlock that opens when the right code is dialled.
 * @returns Decorative markup, hidden from screen readers.
 */
export function VictoryLock() {
  return (
    <div className="victory-lock-3d" aria-hidden="true">
      <svg className="victory-lock-back" viewBox="0 0 300 250"><path d={LOCK_BODY_PATH} fill="#2a1b0b" /></svg>
      <svg className="victory-lock" viewBox="0 0 300 250">
        <LockDefs />
        {/* Long legs hidden behind the body: they stay engaged in it once the shackle has sprung up. */}
        <LockShackle className="victory-lock-shackle" legBottom={140} />
        <HalloweenLockBody />
        <LockCrown />
        {/* In front of the body, wrapped round it; already fallen, so they drop as soon as the victory screen shows. */}
        <LockChains box={CHAIN_BOX} fallen />
        <HangingGhost x={252} y={66} />
      </svg>
    </div>
  )
}
```

`src/components/HauntedDoor.tsx`:
- header: `@file Decorative victory animation: the bronze padlock turns, opens and the view plunges into its window, then the double door of the haunted restaurant swings in, candlelight spills out, ghosts and bats escape. Pure markup; timing in victory.css.`
- delays shifted by 1.4 s:

```tsx
const GHOSTS: Flight[] = [{ dx: -300, dy: -260, delay: 3.6 }, { dx: 280, dy: -300, delay: 4 }, { dx: 40, dy: -420, delay: 4.4 }]
const BATS: Flight[] = [
  { dx: -380, dy: -80, delay: 3.4 }, { dx: 360, dy: -140, delay: 3.7 },
  { dx: -200, dy: -380, delay: 4.2 }, { dx: 220, dy: -360, delay: 4.6 },
]
```

- replace `<div className="lock"><VictoryLock /></div>` by:

```tsx
      {/* Full-screen layer above the door: the lock grows until its night sky fills the screen. */}
      <div className="victory-plunge"><VictoryLock /></div>
```

`src/services/sound.ts` — in `playVictorySound`:

```ts
  // Lock clack as the shackle springs up.
  const clack = tone(ctx, 'square', t + 0.9, t + 0.98, 0.2)
  clack.frequency.setValueAtTime(880, t + 0.9)
  // Hinge creak while the doors swing (2.4 s → 4.4 s): a raspy sawtooth whose pitch drifts.
  const creak = tone(ctx, 'sawtooth', t + 2.4, t + 4.4, 0.12, { rate: 18, depth: 30 })
  creak.frequency.setValueAtTime(80, t + 2.4)
  creak.frequency.linearRampToValueAtTime(150, t + 3.2)
  creak.frequency.linearRampToValueAtTime(100, t + 3.8)
  creak.frequency.linearRampToValueAtTime(170, t + 4.4)
  // Ghost moan as the ghosts escape.
  const moan = tone(ctx, 'sine', t + 3.6, t + 5.8, 0.18, { rate: 5, depth: 12 })
  moan.frequency.setValueAtTime(300, t + 3.6)
  moan.frequency.linearRampToValueAtTime(520, t + 4.6)
  moan.frequency.linearRampToValueAtTime(260, t + 5.8)
```

`src/styles/victory.css`:
- header timeline line: `Timeline: lock turns 0–0.6 s, keyhole flare 0.5–1.5 s, shackle and chains 0.9–1.8 s, plunge 1.2–2.4 s, sky fades 2.2–2.8 s, doors 2.4–4.4 s, glow from 2.8 s, flyers 3.4–7 s, text from 5.6 s (sound.ts matches).` and `(≈ 5.5 s)` in the first line.
- `.door-glow` animation delay `1.4s` → `2.8s`; both `.door--*` delays `1s` → `2.4s`; `.victory-text` delay `4.2s` → `5.6s`.
- replace the `/* VictoryLock: ... */` block (`.lock`, `.victory-lock`, `.victory-lock-shackle`) by:

```css
/* The plunge (VictoryLock): a full-screen layer above the door. The lock turns to face the children, flares,
   springs open, then grows around its window until the night sky fills the screen and fades onto the door. */
.victory-plunge {
  position: fixed; inset: 0; z-index: 3; pointer-events: none;
  display: flex; align-items: center; justify-content: center; perspective: 900px;
}
.victory-lock-3d {
  position: relative; width: 300px; transform-style: preserve-3d;
  /* Centre of the window (y 178 of the 250-high viewBox): the zoom dives into it. */
  transform-origin: 50% 71%;
  opacity: 0; transform: scale(14);
  animation: lock-plunge 2.8s ease-in-out both;
}
.victory-lock, .victory-lock-back { display: block; width: 100%; height: auto; overflow: visible; }
.victory-lock { position: relative; }
/* The same outline, pushed back: seen as the thickness of the lock while it turns. */
.victory-lock-back { position: absolute; inset: 0; transform: translateZ(-16px); }
.victory-lock-shackle {
  transform-box: view-box; transform-origin: 100px 98px;
  transform: translateY(-30px) rotate(-14deg);
  animation: shackle-closed .4s cubic-bezier(.2, 1.6, .5, 1) .9s both;
}
.victory-lock .lock-flare { animation: lock-flare 1s .5s both; }
.victory-lock .lock-chains--fallen .lock-chain { animation-delay: 1s; }
.victory-lock .lock-hanging-ghost { opacity: 0; transform: translate(40px, -160px); animation: ghost-away 1s 1s ease-in both; }
```

- in the keyframes: remove `@keyframes lock-fall`, add:

```css
/* 2.8 s: turn 0–0.6 s (21 %), hold until 1.2 s (43 %), plunge until 2.4 s (86 %), fade from 2.2 s (79 %). */
@keyframes lock-plunge {
  0% { opacity: 0; transform: rotateY(-35deg) scale(.9); }
  10% { opacity: 1; }
  21% { transform: rotateY(0) scale(1); }
  43% { transform: scale(1); }
  79% { opacity: 1; }
  86% { transform: scale(14); }
  100% { opacity: 0; transform: scale(14); }
}
@keyframes ghost-away { from { opacity: 1; transform: none; } }
```

- in the `@media (max-width: 600px)` block replace `.lock { width: 140px; margin-left: -70px; }` by `.victory-lock-3d { width: 240px; }`.

`src/components/lock/LockDefs.tsx` — delete the `lock-iron`, `lock-rust`, `lock-blood` gradients and the `lock-rust-grain` filter (with its comment); update the `@file` header: drop "The rusty ids stay until every lock is bronze."

Delete `src/components/lock/BloodDrips.tsx` and `src/components/lock/BloodDrips.test.tsx`; remove the `/* Blood (BloodDrips) ... */` block if any is left in CSS (`grep -rn "blood" src` must only find nothing).

- [ ] **Step 4: Run all the unit tests, types and lint**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: all PASS, no reference to `BloodDrips`, `lock-rust` or `.lock ` left (`grep -rn "BloodDrips\|lock-rust\|lock-iron\|blood" src` → nothing).

- [ ] **Step 5: Look at it**

With a fresh build and preview and a new browser context, reach the padlock as in Task 6, dial the code 8 6 5 7 0 9 (Zombies), tap « Ouvrir » and take screenshots at 0.3, 0.9, 1.8, 2.5, 3.5 and 6 s (`page.clock.runFor`). Check: the lock turns showing its thickness, opens, dives into the sky, the doors then open, the text is readable. Also at 360×740. Tune `victory.css` if needed. Stop the preview.

- [ ] **Step 6: Commit**

```bash
git add -A src/components/lock src/components/HauntedDoor.tsx src/components/HauntedDoor.test.tsx src/styles/victory.css src/services/sound.ts src/services/sound.test.ts
git commit -m "feat: plunge into the bronze padlock at the victory and drop the rusty look (#57)"
```

---

### Task 8: e2e safety nets, docs and final check

**Files:**
- Create: `e2e/halloween-lock.spec.ts`
- Modify: `CLAUDE.md` (structure `src/components/lock/`, pitfalls « Cadenas rouillés », victory timings)
- Modify: `ETAT.md`

- [ ] **Step 1: Write the e2e tests**

`e2e/halloween-lock.spec.ts`:

```ts
/** @file The bronze padlocks: the final lock fits a phone, and the victory plunge never hides the text nor blocks a tap. */
import { test, expect, type Page } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

/** Zombies miss every challenge: an animator gives each digit on « Temps écoulé », then the padlock shows. */
async function reachPadlock(page: Page): Promise<void> {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  for (let slot = 0; slot < 6; slot++) {
    await page.clock.fastForward('15:00')
    await expect(page.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeVisible()
    await typeAnswer(page, '2710')
    await page.getByRole('button', { name: 'Continuer' }).click()
  }
  await expect(page.getByRole('heading', { name: 'La porte du restaurant hanté' })).toBeVisible()
}

/** Dials the code of the sample quiz and opens. */
async function openPadlock(page: Page): Promise<void> {
  for (const [i, digit] of [8, 6, 5, 7, 0, 9].entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
}

test('the final padlock and its six dials fit a 360 px phone without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await reachPadlock(page)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('with reduced motion, the victory shows its text at once and the plunge layer is gone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await reachPadlock(page)
  await openPadlock(page)
  await expect(page.getByRole('heading', { name: 'La salle du restaurant hanté est ouverte !' })).toBeVisible()
  const layer = page.locator('.victory-lock-3d')
  await expect(layer).toHaveCSS('opacity', '0')
  await expect(page.locator('.victory-plunge')).toHaveCSS('pointer-events', 'none')
})
```

- [ ] **Step 2: Run the whole e2e suite**

Stop any `vite preview` on port 4173, then run: `npm run test:e2e`
Expected: all PASS (including `layout.spec.ts`, `game.spec.ts`, the two new tests). If `reachPadlock` does not reach « Temps écoulé » on the first slot, check `game.spec.ts` (the first missed challenge shows « Temps écoulé » one slot later) and adapt the loop — do not weaken the assertions.

- [ ] **Step 3: Update `CLAUDE.md`**

- Structure line of `src/components/lock/`: `cadenas Halloween en bronze : LockDefs (dégradés bronze, os, ciel, citrouille ; ids `lock-*`), Ornaments (Bone, Skull, Cobweb, Keyhole), LockCrown (LockShackle + ailes et citrouille), LockBanner (« HAPPY HALLOWEEN »), NightWindow (ciel, lune, sorcière, château), HangingGhost, HalloweenLockBody (corps partagé), LockChains, FinalLock (cadre HTML du cadenas final), VictoryLock (cadenas de la plongée)`.
- Replace the pitfall « **Cadenas rouillés** » by « **Cadenas Halloween** (sprint 20, style de `images-sources/cadenas.jpeg`) » keeping its still-true content (ids `lock-*`, one `LockDefs` per screen, `CutawayLock` 190 px, dial drums), and adding: `NightWindow` = un seul par page (`lock-window-clip`) ; bonne réponse = `cutaway-lock--jolt` tant que `fallingIndex` est donné (rejoué au rechargement d'un écran trouvé, comme la chute de goupille) ; mauvais code = `final-lock--alarmed` (yeux rouges) ; victoire = `.victory-plunge` plein écran (`pointer-events: none`) : pivot 0–0,6 s, anse 0,9 s, plongée 1,2–2,4 s, portes 2,4 s, texte 5,6 s, calés sur `sound.ts` ; l'ouverture n'a toujours pas d'état de partie. Replace `.victory-lock-shackle` note accordingly.
- In « Animations de victoire », keep the rule, it still applies.

- [ ] **Step 4: Update `ETAT.md`**

Sprint en cours: sprint 20, all steps done except the PR; prochaine action: relecture (`relecteur-code`) then `gh pr create`. Add decision lines if coordinates or timings changed during the visual checks.

- [ ] **Step 5: Final check**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run build`
Expected: all green; build under the 2 MB precache limit.

- [ ] **Step 6: Commit**

```bash
git add e2e/halloween-lock.spec.ts CLAUDE.md ETAT.md
git commit -m "test: guard the bronze padlocks on phone and with reduced motion (#57)"
```
