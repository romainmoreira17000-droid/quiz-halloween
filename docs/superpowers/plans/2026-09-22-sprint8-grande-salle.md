# Sprint 8 — Décor de la grande salle et cadenas en coupe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The game screens take place in the great hall of the haunted restaurant: instruction on a parchment menu, a big cutaway padlock whose pins drop one by one, and the entrance in front of the restaurant door.

**Architecture:** Decorative SVG backdrops (`src/components/decor/`) are fixed behind the screens, chosen by `Game` from the game status. A new `CutawayLock` component draws one pin per step from `foundDigits`; `StepScreen` shows it between the parchment and the answer zone. A short synthesised « clac » (`playPinSound`) is played inside the tap that submits a right answer, so `answer()` now returns whether the answer was right (same pattern as `unlock()`).

**Tech Stack:** Vite 8, React 19, TypeScript, Vitest 5 + Testing Library + jsdom, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-22-entree-et-reponses-design.md`, section « Décor (sprint 8) ». Mockups: `.superpowers/brainstorm/5095-1790067937/content/salle-epreuve.html` (not versioned) and option A of `cadenas-interieur.html`. Issue #15. Branch `feat/haunted-hall`.

## Global Constraints

- 200 lines max per file; `@file` header + JSDoc on every export; comments in English explain *why*.
- Code and commits in English (Conventional Commits, `(#15)`); on-screen text in French.
- No `any`. Explicit types on props and returns.
- Theme « Manoir à la bougie »: palette of `base.css` (`--soot`, `--wall`, `--wax`, `--amber`, `--bronze`, `--seal`), fonts IM Fell English SC (titles) and Alegreya (text), bundled (no Google Fonts).
- Digits always `font-variant-numeric: lining-nums`.
- Animations: base styles = final state, keyframes = starting state (`both`), so `prefers-reduced-motion` (global rule in `base.css`) shows the end directly.
- Decor is decorative: `aria-hidden="true"`, never announced. The lock is one `role="img"` with a French `aria-label` (never a `status`: `getByRole('status')` must stay unique for « Chiffre trouvé »).
- Sound only started inside a tap handler; never throws without Web Audio.
- Tablet 810×1080 first: a digits step with a 2-line instruction must fit without scrolling. Phone 360 px: may scroll, never scrolls sideways.
- Digit keys stay ≥ 88 px; letter keys ≥ 64 px high on tablet.
- Every commit ends with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Unit tests `npm run test:run`, types `npm run typecheck`, lint `npm run lint`, e2e `npm run test:e2e` (stop any `vite preview` on port 4173 first).

## File map

| File | Role |
|---|---|
| `src/services/sound.ts` | + `playPinSound()` (short metallic clac) |
| `src/hooks/useGameProgress.ts` | `answer()` returns `boolean` |
| `src/components/Game.tsx` | plays the clac; picks the backdrop |
| `src/components/CutawayLock.tsx` (new) | cutaway padlock SVG |
| `src/styles/lock.css` (new) | pin fall, slot glow, shackle release |
| `src/components/StepScreen.tsx` | parchment + lock; `foundDigits` prop |
| `src/styles/screens.css`, `keyboard.css`, `controls.css` | step layout on the hall, fixes |
| `src/components/decor/HallBackdrop.tsx` (new) | great hall: svg frame + gradients |
| `src/components/decor/HallRoom.tsx` (new) | walls, windows, moon, portraits, wainscot, floor |
| `src/components/decor/HallFurniture.tsx` (new) | chandelier, long table, candelabras, chairs |
| `src/components/decor/HallSpirits.tsx` (new) | ghost, cobweb, fog, vignette |
| `src/components/decor/RestaurantFront.tsx` (new) | entrance: façade, double door, lanterns, sign |
| `src/styles/decor.css` (new) | backdrop placement, flames, ghost drift |
| `src/components/EntranceScreen.tsx` | message on a letter |

---

### Task 1: « Clac » when a pin drops

**Files:**
- Modify: `src/services/sound.ts`, `src/services/sound.test.ts`
- Modify: `src/hooks/useGameProgress.ts` (+ its test if present, else `src/components/Game.test.tsx`)
- Modify: `src/components/Game.tsx`, `src/components/Game.test.tsx`

**Interfaces:**
- Produces: `playPinSound(createContext?: AudioContextFactory): void`; `GameProgress.answer(text: string): boolean` (true only when it earns the current step's digit).

- [ ] **Step 1: failing tests**

In `sound.test.ts`:
```ts
describe('playPinSound', () => {
  it('does nothing without Web Audio', () => {
    expect(() => playPinSound(() => null)).not.toThrow()
  })
  it('plays one short square clack, then releases the context', () => {
    const { ctx, close, oscillators } = fakeContext()
    playPinSound(() => ctx)
    expect(oscillators.map((o) => o.type)).toEqual(['square'])
    oscillators[0].onended?.()
    expect(close).toHaveBeenCalledOnce()
  })
})
```
In `Game.test.tsx`, mock `playPinSound` too (`vi.mock('../services/sound', () => ({ playVictorySound: vi.fn(), playPinSound: vi.fn() }))`) and add:
```ts
it('plays the pin clack on a right answer only', async () => {
  const user = userEvent.setup()
  render(<Game config={config} />)
  await user.click(screen.getByRole('button', { name: 'Commencer' }))
  await user.click(screen.getByRole('button', { name: '1' }))
  await user.click(screen.getByRole('button', { name: 'Valider' }))
  expect(playPinSound).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: '4' }))
  await user.click(screen.getByRole('button', { name: 'Valider' }))
  expect(playPinSound).toHaveBeenCalledOnce()
})
```
(`vi.clearAllMocks()` in an `afterEach` if the file does not already reset mocks.)

- [ ] **Step 2: run** `npm run test:run -- sound Game` → FAIL (`playPinSound` not exported).

- [ ] **Step 3: implement**

`sound.ts` (update the `@file` header: « Victory sound … and the pin clack »):
```ts
/**
 * Plays the short clack of a pin dropping in the padlock. Must be called inside the tap handler.
 * Silent (never throws) when audio is unavailable.
 * @param createContext Audio context factory, replaced in tests.
 */
export function playPinSound(createContext: AudioContextFactory = browserContext): void {
  const ctx = openContext(createContext)
  if (!ctx) return
  const t = ctx.currentTime
  // Lands when the pin hits the bottom of its slot (pin-fall in lock.css: 0.45 s).
  const clack = tone(ctx, 'square', t + 0.4, t + 0.47, 0.16)
  clack.frequency.setValueAtTime(1200, t + 0.4)
  clack.frequency.exponentialRampToValueAtTime(500, t + 0.47)
  clack.onended = () => void ctx.close()
}
```
`useGameProgress.ts`: update the JSDoc of `answer` (« returns true when it earns the step's digit, so the caller can play the clack in the tap handler ») and:
```ts
answer: (text) => {
  dispatch({ type: 'answer', text })
  // Same check as the reducer, needed now: sound must start inside the tap.
  return state.status === 'playing' && !isCurrentStepSolved(state) && isRightAnswer(text, steps[state.stepIndex].answer)
},
```
(imports: `isRightAnswer` from `../game/answer`, `isCurrentStepSolved` from `../game/progress`).

`Game.tsx`, in the step branch:
```tsx
const submit = (text: string) => { if (answer(text)) playPinSound() }
```
and pass `onSubmit={submit}`.

- [ ] **Step 4: run** `npm run test:run` → all green; `npm run typecheck` → ok.
- [ ] **Step 5: commit** `feat: play a clack when a pin drops (#15)`.

---

### Task 2: Cutaway padlock

**Files:**
- Create: `src/components/CutawayLock.tsx`, `src/components/CutawayLock.test.tsx`, `src/styles/lock.css`
- Modify: `src/main.tsx` (import `./styles/lock.css` after `padlock.css`)

**Interfaces:**
- Produces: `CutawayLock({ total, foundDigits, fallingIndex? }: CutawayLockProps)`. `total` ≥ 1 pins; `foundDigits[i]` is shown under pin `i`, which is down; `fallingIndex` = pin that animates its fall now (the one just earned); the shackle is released when `foundDigits.length === total`.

- [ ] **Step 1: failing tests** (`CutawayLock.test.tsx`)
```tsx
/** @file Tests for the cutaway padlock. */
import { render, screen } from '@testing-library/react'
import { CutawayLock } from './CutawayLock'

describe('CutawayLock', () => {
  it('draws one pin per step, none down at the start', () => {
    const { container } = render(<CutawayLock total={6} foundDigits={[]} />)
    expect(screen.getByRole('img', { name: 'Cadenas : 0 goupille tombée sur 6' })).toBeInTheDocument()
    expect(container.querySelectorAll('.lock-pin')).toHaveLength(6)
    expect(container.querySelectorAll('.lock-pin--down')).toHaveLength(0)
  })
  it('drops the pins of the found digits and writes the digits under them', () => {
    const { container } = render(<CutawayLock total={6} foundDigits={[4, 7, 0]} fallingIndex={2} />)
    expect(screen.getByRole('img', { name: 'Cadenas : 3 goupilles tombées sur 6' })).toBeInTheDocument()
    expect(container.querySelectorAll('.lock-pin--down')).toHaveLength(3)
    expect(container.querySelectorAll('.lock-pin--falling')).toHaveLength(1)
    expect([...container.querySelectorAll('.lock-digit')].map((t) => t.textContent)).toEqual(['4', '7', '0', '·', '·', '·'])
  })
  it('releases the shackle once every pin is down', () => {
    const { container } = render(<CutawayLock total={2} foundDigits={[1, 2]} />)
    expect(screen.getByRole('img', { name: 'Cadenas ouvert : toutes les goupilles sont tombées' })).toBeInTheDocument()
    expect(container.querySelector('.cutaway-lock--open')).not.toBeNull()
  })
})
```
- [ ] **Step 2: run** `npm run test:run -- CutawayLock` → FAIL (module missing).
- [ ] **Step 3: implement** `CutawayLock.tsx`
```tsx
/** @file Big padlock seen in cross-section: one pin per step drops when its digit is found; the shackle frees itself at the end. */

/** Props of CutawayLock. */
export interface CutawayLockProps {
  /** Number of steps, i.e. pins. */
  total: number
  /** Digits found so far, in step order: their pins are down. */
  foundDigits: number[]
  /** Pin that falls right now (the digit just earned); the others are drawn already down. */
  fallingIndex?: number
}

/** Inner chamber of the lock body, in viewBox units. */
const CHAMBER = { x: 44, y: 122, width: 212, height: 78 }

/** @returns The French description read by screen readers. */
function lockLabel(total: number, down: number): string {
  if (down >= total) return 'Cadenas ouvert : toutes les goupilles sont tombées'
  return `Cadenas : ${down} ${down > 1 ? 'goupilles tombées' : 'goupille tombée'} sur ${total}`
}

/**
 * The padlock of the great hall.
 * @param props See CutawayLockProps.
 * @returns An SVG image of the lock.
 */
export function CutawayLock({ total, foundDigits, fallingIndex }: CutawayLockProps) {
  const down = foundDigits.length
  const open = down >= total
  const pitch = CHAMBER.width / total
  const pinWidth = Math.min(22, pitch - 8)
  const fontSize = Math.min(30, pitch * 0.9)
  const pinClass = (i: number) =>
    i >= down ? 'lock-pin' : i === fallingIndex ? 'lock-pin lock-pin--down lock-pin--falling' : 'lock-pin lock-pin--down'
  return (
    <svg className={open ? 'cutaway-lock cutaway-lock--open' : 'cutaway-lock'} viewBox="0 0 300 250" role="img" aria-label={lockLabel(total, down)}>
      <defs>…gradients lockSteel, lockBrass, lockPin, lockGlow (from the mockup)…</defs>
      <ellipse cx="150" cy="160" rx="150" ry="100" fill="url(#lockGlow)" />
      <path className="lock-shackle" d="M78 116 V72 a72 72 0 0 1 144 0 V116" fill="none" stroke="url(#lockSteel)" strokeWidth="24" />
      <rect x="30" y="108" width="240" height="136" rx="22" fill="#2b2119" stroke="url(#lockBrass)" strokeWidth="8" />
      <rect {...CHAMBER} rx="6" fill="#0f0a07" />
      {Array.from({ length: total }, (_, i) => {
        const x = CHAMBER.x + pitch * i
        const found = i < down
        return (
          <g key={i}>
            {found && <rect className="lock-slot-glow" x={x} y={CHAMBER.y} width={pitch} height={CHAMBER.height} fill="#f2a541" />}
            <rect className={pinClass(i)} x={x + (pitch - pinWidth) / 2} y={CHAMBER.y + 4} width={pinWidth} height="40" rx="4" fill="url(#lockPin)" />
            <text className={found ? 'lock-digit lock-digit--found' : 'lock-digit'} x={x + pitch / 2} y="232" fontSize={fontSize} textAnchor="middle">
              {found ? foundDigits[i] : '·'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
```
The `<defs>` copies `steel`, `brass`, `pinG` and `glow` from the mockup under the ids above (unique ids: the hall backdrop has its own).

`lock.css`:
```css
/** @file Cutaway padlock: pins that drop, lit slots, shackle that frees itself. Base = final state. */
.cutaway-lock { width: 320px; height: auto; overflow: visible; }
.lock-pin { transition: none; }
.lock-pin--down { transform: translateY(30px); }
/* 0.45 s: matches the clack of playPinSound (sound.ts). */
.lock-pin--falling { animation: pin-fall .45s cubic-bezier(.5, 0, 1, .6) both; }
@keyframes pin-fall { from { transform: translateY(0); } }
.lock-slot-glow { opacity: .35; }
.lock-pin--falling ~ .lock-slot-glow, .lock-slot-glow:has(+ .lock-pin--falling) { animation: slot-light .6s .4s both; }
@keyframes slot-light { from { opacity: 0; } }
.lock-digit { fill: #6b5a4a; font-family: var(--title-font); font-variant-numeric: lining-nums; }
.lock-digit--found { fill: #f5c46b; }
/* The shackle rises out of the body, then swings on its left leg. */
.cutaway-lock--open .lock-shackle {
  transform: translateY(-26px) rotate(-18deg); transform-box: view-box; transform-origin: 78px 116px;
  animation: shackle-release .9s .5s both;
}
@keyframes shackle-release { from { transform: none; } 50% { transform: translateY(-26px); } }
@media (max-width: 600px) { .cutaway-lock { width: 240px; } }
```
- [ ] **Step 4: run** `npm run test:run -- CutawayLock` → PASS; typecheck ok.
- [ ] **Step 5: commit** `feat: add the cutaway padlock (#15)`.

---

### Task 3: Step screen on a parchment, with the lock

**Files:**
- Modify: `src/components/StepScreen.tsx`, `src/components/StepScreen.test.tsx`, `src/components/Game.tsx`
- Modify: `src/styles/screens.css`, `src/styles/controls.css`, `src/styles/keyboard.css`

**Interfaces:**
- Consumes: `CutawayLock` (Task 2).
- Changes: `StepScreenProps.foundDigit: number | undefined` → `foundDigits: number[]` (all digits found so far); the current step is solved when `foundDigits.length >= stepNumber`.

- [ ] **Step 1: tests** — in `StepScreen.test.tsx` replace `foundDigit: undefined` by `foundDigits: [4]` (step 2 unsolved), `foundDigit: 7` by `foundDigits: [4, 7]`; replace the `queryByRole('img')` assertion by
```ts
expect(screen.getByRole('img', { name: 'Cadenas : 1 goupille tombée sur 6' })).toBeInTheDocument()
```
and add: solved step 2 → `getByRole('img', { name: 'Cadenas : 2 goupilles tombées sur 6' })`, `getByRole('status')` has text `Chiffre trouvé : 7`. The image test now looks for `getByRole('img', { name: 'Image de l’étape : Le chaudron' })`.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** — markup:
```tsx
<main className="screen step">
  {header}
  <section className="parchment">
    <p className="step-number">Étape {stepNumber} sur {total}</p>
    <h2>{step.title}</h2>
    <p className="instruction">{step.instruction}</p>
    {step.image && <img … />}
  </section>
  <CutawayLock total={total} foundDigits={foundDigits} fallingIndex={solved ? stepNumber - 1 : undefined} />
  {solved ? (found zone, unchanged, digit = foundDigits[stepNumber - 1]) : <AnswerZone … />}
</main>
```
`Game.tsx` passes `foundDigits={state.foundDigits}`.

CSS (`screens.css`, step part rewritten; tablet budget for 1080 px: padding 20 + header 72 + parchment ≈ 200 + lock 250 + typed 60 + keypad 394 + bottom 40 ≈ 1036):
```css
.parchment {
  width: 100%; max-width: 690px; margin-top: 8px; padding: 14px 32px 18px;
  color: #2b1d12; border-radius: 6px;
  background: radial-gradient(ellipse at 50% 40%, #efdcae, #d3b77f 75%, #a8854d);
  box-shadow: 0 8px 20px rgb(0 0 0 / .7), inset 0 0 22px rgb(90 55 20 / .55);
}
.parchment h2 { margin: 2px 0 6px; font-size: 48px; color: #2b1d12; text-shadow: none; }
.step-number { font-family: var(--title-font); font-size: 20px; color: var(--seal); letter-spacing: .08em; }
.instruction { font-size: 28px; line-height: 1.3; }
.step-image { max-height: 200px; margin-top: 10px; }
.step .cutaway-lock { width: 300px; margin-top: 8px; }
.step .answer-zone { margin-top: 0; padding-top: 0; gap: 12px; }
/* Tablet: the reset icon sits bottom left, clear of the centred keyboards, so the free strip can shrink. */
@media (min-width: 601px) { .screen.step { padding-top: 20px; padding-bottom: 40px; } }
```
`controls.css`: `.keypad { --key: 88px; --key-gap: 14px; }` (tablet), buttons `font-size: 48px` (phone unchanged: already 88 px).
`keyboard.css`: `.letter-keyboard button { line-height: 1; padding-bottom: 6px; overflow: hidden; }` — the tail of « Q » in IM Fell English SC must stay inside its key (check visually; adjust `padding-bottom` until it does).
Phone (`max-width: 600px`): `.parchment { padding: 10px 16px 14px; } .parchment h2 { font-size: 34px; } .instruction { font-size: 22px; }`.
- [ ] **Step 4: run** `npm run test:run` → green (fix `Game.test.tsx` if it relied on the old markup); typecheck.
- [ ] **Step 5: quick visual check** — `npm run dev`, Playwright 810×1080: crypte step (digits) fits without scroll (`document.documentElement.scrollHeight <= 1080`); step with letters too; « Q » inside its key.
- [ ] **Step 6: commit** `feat: show the step on a parchment above the cutaway lock (#15)`.

---

### Task 4: Great hall backdrop

**Files:**
- Create: `src/components/decor/HallBackdrop.tsx`, `HallRoom.tsx`, `HallFurniture.tsx`, `HallSpirits.tsx`, `HallBackdrop.test.tsx`, `src/styles/decor.css`
- Modify: `src/components/Game.tsx`, `src/components/Game.test.tsx`, `src/main.tsx`, `src/styles/base.css`

**Interfaces:**
- Produces: `HallBackdrop(): JSX.Element` — `<svg className="backdrop hall-backdrop" aria-hidden="true" viewBox="0 0 810 1080" preserveAspectRatio="xMidYMid slice">` with `<defs>` (gradients `hall-*` ids) then `<HallRoom/> <HallFurniture/> <HallSpirits/>` (each returns a `<g>`).
- `Game` renders the backdrop before the screen: `HallBackdrop` for `playing`, `padlock`, `won`; `RestaurantFront` for `entrance` (Task 5); nothing on `home`.

- [ ] **Step 1: failing tests**
`HallBackdrop.test.tsx`:
```tsx
it('draws the hall as pure decoration', () => {
  const { container } = render(<HallBackdrop />)
  const svg = container.querySelector('svg.hall-backdrop')
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  expect(svg?.querySelectorAll('.hall-flame').length).toBeGreaterThanOrEqual(5)
  expect(svg?.querySelector('.hall-ghost')).not.toBeNull()
})
```
`Game.test.tsx`: after « Commencer » (quiz without entrance) `container.querySelector('.hall-backdrop')` is present; on home it is absent.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** — start from the `room` symbol of the mockup, split by file, and enrich it (the spec asks for a finished look, not a sketch): stone texture with a subtle pattern on the walls, moonlight shaft from the windows (translucent gradient polygon), portrait frames with a bevel, cloth folds on the table, plates and goblets, drips of wax, chandelier chains, one candle flame per `<ellipse className="hall-flame">` with a halo. `decor.css`:
```css
/** @file Decorative backdrops: fixed behind the screens; gentle candle flicker and a drifting ghost. */
.backdrop { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
.screen { z-index: 1; }
.hall-flame { transform-box: fill-box; transform-origin: 50% 90%; animation: flicker 2.6s ease-in-out infinite; }
.hall-flame:nth-of-type(2n) { animation-duration: 3.1s; animation-delay: -1s; }
.hall-flame:nth-of-type(3n) { animation-duration: 2.2s; animation-delay: -.6s; }
/* Base = resting place; the drift only exists as animation, so reduced motion shows it still. */
.hall-ghost { opacity: .45; animation: ghost-drift 14s ease-in-out infinite; }
@keyframes ghost-drift { 0%, 100% { transform: translate(0, 0); opacity: .45; } 50% { transform: translate(-60px, -14px); opacity: .2; } }
```
(`flicker` keyframes already exist in `screens.css`.) The vignette keeps the screens readable: the text areas (parchment, keypad) must keep contrast ≥ the current look.
- [ ] **Step 4: run** tests + typecheck + lint → green; visual check 810×1080 and 360×800.
- [ ] **Step 5: commit** `feat: draw the great hall of the haunted restaurant behind the game (#15)`.

---

### Task 5: Entrance in front of the restaurant door

**Files:**
- Create: `src/components/decor/RestaurantFront.tsx`, `RestaurantFront.test.tsx` (+ `RestaurantDoor.tsx` if the file passes 200 lines)
- Modify: `src/components/EntranceScreen.tsx`, `src/components/Game.tsx`, `src/styles/screens.css`, `src/styles/decor.css`

**Interfaces:**
- Produces: `RestaurantFront()` — same frame as the hall (`className="backdrop restaurant-front"`, `aria-hidden`): night sky and moon, stone façade, arched double door in dark wood with iron straps and a glow under it, two wall lanterns (`.hall-flame`), hanging sign « Restaurant » (text in the SVG, decorative), steps, fog, bats silhouettes.

- [ ] **Step 1: failing tests** — `RestaurantFront` renders an `aria-hidden` svg `.restaurant-front`; `Game.test.tsx`: on the entrance screen `.restaurant-front` is present and `.hall-backdrop` absent.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** — `EntranceScreen`: title, then `<section className="letter"><p className="entrance-message">…</p></section>`, then the answer zone. `.letter`: parchment colours (reuse the `.parchment` background and shadow via a shared selector `.parchment, .letter`), slightly rotated (`rotate(-1.5deg)`), wax seal drawn with `::after` (radial gradient `--seal`), dark ink text. Title keeps the wax colour with a stronger shadow so it reads over the façade.
- [ ] **Step 4: run** tests + typecheck + lint; visual check 810×1080 (letter keyboard fits) and 360.
- [ ] **Step 5: commit** `feat: set the entrance in front of the restaurant door (#15)`.

---

### Task 6: Verification and docs

**Files:**
- Modify: e2e specs if the markup change broke them; `CLAUDE.md`; `ETAT.md`

- [ ] **Step 1:** `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run valider`, `npm run build`, `npm run test:e2e` → all green, outputs shown.
- [ ] **Step 2:** Playwright visual pass, fresh browser, 810×1080 and 360×800: home, entrance, digits step, pin falling, letters step, last step (shackle frees), padlock, victory. No horizontal scroll; tablet digits step without vertical scroll. Screenshots kept in the scratchpad for the PR.
- [ ] **Step 3:** `CLAUDE.md`: structure (`src/components/decor/`, `CutawayLock`, `lock.css`, `decor.css`), traps (backdrops `position: fixed` z-index 0 under `.screen` z-index 1; `answer()` returns a boolean for the clack; pin-fall 0.45 s = clack timing in `sound.ts`).
- [ ] **Step 4:** `ETAT.md` updated; commit `docs: document the haunted hall decor (#15)`.
- [ ] **Step 5:** `relecteur-code` review, fixes, then PR (Closes #15).
