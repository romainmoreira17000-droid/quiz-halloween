# Sprint 14 — Indices progressifs (issue #41) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** up to N hints per challenge (N = length of `indices_apres_minutes`), unlocked one by one by the slot clock
or by the animator menu (one more per tap), all visible in the animator's solutions.

**Architecture:** pure unlock rules in a new `src/game/hints.ts`; the reducer keeps `hintSlot` and gains `hintCount`
(hints given by the animator in that slot); the number available is `min(total, max(byClock, byAnimator))`. The UI
keeps a single hint button (no extra line on the step screen); its window lists the available hints.

**Tech Stack:** Vite + React 19 + TypeScript, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-27-indices-progressifs-design.md`

## Global Constraints

- Files ≤ 200 lines; `@file` header and JSDoc on exports; comments in English, UI text in French.
- Typographic apostrophe `’` in UI strings (`Voir l’indice`), as the existing code.
- YAML keys in French, config fields in English: `indices_apres_minutes` → `hintTimes: number[]`, step `indices` →
  `hints?: string[]` (**absent** when the step has no hint, like the old `hint?`, so step fixtures stay valid).
- The padlock `indice` (`PadlockConfig.hint`) is untouched.
- The animator menu never changes the time.
- The step screen must still fit 810×1080 without scrolling (`e2e/layout.spec.ts`).

## Review Focus

1. Animator gave hint 1, then the clock unlocks hint 1 too → still 1 available, not 2 (max, not sum). → Task 1.
2. Animator hints do not follow the group into the next room (`hintSlot` ≠ slot → 0 from the animator). → Task 1.
3. Times not strictly increasing (`[8, 5]`, `[5, 5]`), empty list, or a step with more hints than times → French
   error, publication blocked. → Task 2.
4. Save written before this sprint (`hintSlot: 1`, no `hintCount`) → resumes with 1 hint shown. → Task 3.
5. All hints available → no « Indice suivant » line, no animator button. → Tasks 4 and 5.

---

### Task 1: Unlock rules (`src/game/hints.ts`)

**Files:** Create `src/game/hints.ts`, `src/game/hints.test.ts`.

**Interfaces — Produces:**
```ts
/** Hints the slot clock has unlocked (0..hintTimes.length). */
export function hintsUnlockedByClock(slotSecondsLeft: number, slotMinutes: number, hintTimes: readonly number[]): number
/** Seconds before hint n° `available + 1` unlocks by the clock; null when no time is left for it. */
export function secondsBeforeNextHint(slotSecondsLeft: number, slotMinutes: number, hintTimes: readonly number[], available: number): number | null
/** Hints available now: the most of clock and animator (same slot only), capped by the step's total. */
export function availableHints(byClock: number, animator: { slot: number | null; count: number }, slot: number, total: number): number
```

- [ ] **Step 1: failing tests** (`hints.test.ts`)
```ts
import { availableHints, hintsUnlockedByClock, secondsBeforeNextHint } from './hints'
const TIMES = [5, 8, 11]
describe('hintsUnlockedByClock', () => {
  it('unlocks each hint at its minute of the slot', () => {
    expect(hintsUnlockedByClock(900, 15, TIMES)).toBe(0)
    expect(hintsUnlockedByClock(601, 15, TIMES)).toBe(0)
    expect(hintsUnlockedByClock(600, 15, TIMES)).toBe(1)
    expect(hintsUnlockedByClock(420, 15, TIMES)).toBe(2)
    expect(hintsUnlockedByClock(240, 15, TIMES)).toBe(3)
    expect(hintsUnlockedByClock(900, 15, [0])).toBe(1)
  })
})
describe('secondsBeforeNextHint', () => {
  it('counts down to the next hint, null when none is left', () => {
    expect(secondsBeforeNextHint(900, 15, TIMES, 0)).toBe(300)
    expect(secondsBeforeNextHint(600, 15, TIMES, 1)).toBe(180)
    expect(secondsBeforeNextHint(240, 15, TIMES, 3)).toBeNull()
  })
  it('counts to the hint after those given early by an animator', () => {
    expect(secondsBeforeNextHint(900, 15, TIMES, 2)).toBe(660)
  })
  it('is 0, never negative, when the clock is already past that time', () => {
    expect(secondsBeforeNextHint(100, 15, TIMES, 1)).toBe(0)
  })
})
describe('availableHints', () => {
  it('takes the most of clock and animator, not the sum', () => {
    expect(availableHints(1, { slot: 2, count: 1 }, 2, 3)).toBe(1)
    expect(availableHints(1, { slot: 2, count: 2 }, 2, 3)).toBe(2)
  })
  it('forgets the animator hints of another slot', () => {
    expect(availableHints(0, { slot: 1, count: 3 }, 2, 3)).toBe(0)
  })
  it('never exceeds the hints of the step', () => {
    expect(availableHints(3, { slot: null, count: 0 }, 0, 1)).toBe(1)
    expect(availableHints(2, { slot: null, count: 0 }, 0, 0)).toBe(0)
  })
})
```
- [ ] **Step 2:** `npx vitest run src/game/hints.test.ts` → FAIL (module not found).
- [ ] **Step 3: implementation**
```ts
/** @file Progressive hints: when each hint of a challenge unlocks, by the slot clock or by an animator. */

const elapsedSeconds = (slotSecondsLeft: number, slotMinutes: number) => slotMinutes * 60 - slotSecondsLeft

export function hintsUnlockedByClock(slotSecondsLeft: number, slotMinutes: number, hintTimes: readonly number[]): number {
  const elapsed = elapsedSeconds(slotSecondsLeft, slotMinutes)
  return hintTimes.filter((minutes) => minutes * 60 <= elapsed).length
}

export function secondsBeforeNextHint(slotSecondsLeft: number, slotMinutes: number, hintTimes: readonly number[], available: number): number | null {
  const next = hintTimes[available]
  return next === undefined ? null : Math.max(0, next * 60 - elapsedSeconds(slotSecondsLeft, slotMinutes))
}

export function availableHints(byClock: number, animator: { slot: number | null; count: number }, slot: number, total: number): number {
  // The max, not the sum: a hint given early is the same hint the clock unlocks later.
  const given = animator.slot === slot ? animator.count : 0
  return Math.min(total, Math.max(byClock, given))
}
```
(with JSDoc `@param`/`@returns`/`@example` on each export.)
- [ ] **Step 4:** run → PASS.
- [ ] **Step 5:** `git commit -m "feat: add progressive hint unlock rules (#41)"`

### Task 2: Configuration (`indices_apres_minutes`, `indices`)

**Files:** Modify `src/config/types.ts`, `validateTeamSettings.ts`, `validateStep.ts`, `validateQuiz.ts` (+ their
tests, `parseQuiz.test.ts`), every test fixture with `hintAfterMinutes` (see grep below), `quiz.yaml`.

**Interfaces — Produces:** `QuizConfig.hintTimes: number[]` (replaces `hintAfterMinutes`); `QuizStep.hints?: string[]`
(replaces `hint?`, absent when none); `TeamSettings.hintTimes: number[]`.

- [ ] **Step 1: failing tests**
  - `validateTeamSettings.test.ts`: `valid` uses `indices_apres_minutes: [5, 8, 11]`; expected settings
    `hintTimes: [5, 8, 11]`. Replace the `indice_apres_minutes` tests with:
```ts
it.each([[[0]], [[5, 8, 11]], [[14]]])('accepts indices_apres_minutes %j', (indices_apres_minutes) => {
  expect(run({ ...valid, indices_apres_minutes }).errors).toEqual([])
})
it.each([[[]], [10], [[-1]], [[2.5]], [['5']], [undefined]])('rejects indices_apres_minutes %j', (indices_apres_minutes) => {
  expect(run({ ...valid, indices_apres_minutes }).errors)
    .toEqual(['« indices_apres_minutes » doit être une liste de nombres entiers, 0 ou plus (exemple : [5, 8, 11]).'])
})
it.each([[[8, 5]], [[5, 5]]])('needs increasing times %j', (indices_apres_minutes) => {
  expect(run({ ...valid, indices_apres_minutes }).errors)
    .toEqual(['« indices_apres_minutes » : les minutes doivent aller en croissant, sans doublon (exemple : [5, 8, 11]).'])
})
it('needs every hint before the end of the slot', () => {
  expect(run({ ...valid, indices_apres_minutes: [5, 15] }).errors)
    .toEqual(["« indices_apres_minutes » : 15 doit être plus petit que « duree_epreuve_minutes » (15) : sinon l'indice n'arrive jamais."])
})
it('skips the hint-vs-slot check when the slot length is wrong', () => {
  expect(run({ ...valid, duree_epreuve_minutes: 0, indices_apres_minutes: [20] }).errors)
    .toEqual(['« duree_epreuve_minutes » doit être un nombre entier supérieur à 0.'])
})
it('explains the old single hint delay', () => {
  const { indices_apres_minutes: _dropped, ...old } = valid
  expect(run({ ...old, indice_apres_minutes: 10 }).errors).toContain(
    '« indice_apres_minutes » a été remplacée par « indices_apres_minutes » : une liste de minutes, une par indice (exemple : [5, 8, 11]).')
})
```
    (keep the exact shape of the existing `run` helper; the old-key test uses `toContain` because the missing new key
    also reports its own error.)
  - `validateStep.test.ts`: replace the `indice` tests with:
```ts
it('adds the hints when there are some', () => {
  expect(run({ ...valid, indices: ['Sous le chaudron.', 'Derrière'] }).step?.hints).toEqual(['Sous le chaudron.', 'Derrière'])
  expect(run(valid).step).not.toHaveProperty('hints')
  expect(run({ ...valid, indices: [] }).step).not.toHaveProperty('hints')
})
it.each([['Sous le chaudron.'], [['']], [['  ']], [[3]]])('rejects indices %j', (indices) => {
  expect(run({ ...valid, indices }).errors).toEqual(['étape 3 : « indices » doit être une liste de textes non vides.'])
})
it('explains the old single hint', () => {
  expect(run({ ...valid, indice: 'Sous le chaudron.' }).errors).toEqual([
    'étape 3 : « indice » a été remplacée par « indices », une liste (exemple : indices: ["premier indice", "deuxième indice"]).'])
})
```
  - `validateQuiz.test.ts`: `validRaw` uses `indices_apres_minutes: [10]`, expected config `hintTimes: [10]`; add:
```ts
it('refuses a step with more hints than hint times', () => {
  const raw = validRaw()
  raw.etapes[1] = { ...raw.etapes[1], indices: ['a', 'b'] }
  expect(validateQuiz(raw)).toEqual({ ok: false, errors: [
    'étape 2 : 2 indices mais seulement 1 horaire(s) dans « indices_apres_minutes ».'] })
})
```
    (adapt the typing of `raw.etapes` to the helper already in the file.)
  - `parseQuiz.test.ts` `HEAD`: `indices_apres_minutes: [5]`.
- [ ] **Step 2:** `npx vitest run src/config` → FAIL.
- [ ] **Step 3: implementation**
  - `types.ts`: `hints?: string[]` with doc « `indices`: unlocked one by one at `hintTimes`; no hint button without
    them »; `hintTimes: number[]` with doc « `indices_apres_minutes`: minute of the slot at which hint n° i unlocks
    (strictly increasing, all below slotMinutes) ».
  - `validateTeamSettings.ts`: new helper `hintTimeErrors(raw.indices_apres_minutes, slotOk ? slotMinutes : null)`
    returning the messages above in this order: not a non-empty list of integers ≥ 0 → the list message only;
    else not strictly increasing → the order message; else one « doit être plus petit » message for the first time
    ≥ slot (only when the slot is valid). Old key `indice_apres_minutes` → « remplacée par » message (same pattern as
    `duree_minutes`). Return `hintTimes`.
  - `validateStep.ts`: `STEP_KEYS` swaps `'indice'` for `'indices'`; allowed extra key `'indice'` gets the « remplacée »
    message (same pattern as `solution`); `indices` must be an array of non-empty strings; map to `hints` only when
    non-empty.
  - `validateQuiz.ts`: `ROOT_KEYS` swaps `'indice_apres_minutes'` for `'indices_apres_minutes'`, adds
    `'indice_apres_minutes'` to the allowed extras (it has its own message); after steps and settings are
    valid, for each step with `hints.length > settings.hintTimes.length` push
    `étape ${i + 1} : ${n} indices mais seulement ${t} horaire(s) dans « indices_apres_minutes ».`
  - Fixtures: `grep -rln "hintAfterMinutes" src` then replace `hintAfterMinutes: N` with `hintTimes: [N]`
    (`sed -i -E 's/hintAfterMinutes: ([0-9]+)/hintTimes: [\1]/'`). Step fixtures with `hint: '...'` inside a
    **step** (not `padlock`) become `hints: ['...']`: `src/game/animator.test.ts`,
    `src/components/TeamAnimatorMenu.test.tsx`, `StepScreen.test.tsx`, `TeamGame.test.tsx` — check each with
    `grep -n "hint:" src -r`.
  - `quiz.yaml`: replace the `indice_apres_minutes` block with `indices_apres_minutes: [5, 8, 11]` and its comment
    (« Minutes après le début de chaque épreuve où s'active chaque indice : le 1er à 5 min, le 2e à 8 min… Obligatoire,
    nombres entiers en croissant, plus petits que duree_epreuve_minutes. Une épreuve a au plus autant d'indices que
    d'horaires. »). Step doc comment: `indices` facultatif, liste de textes. Steps: galerie
    `indices: ["Regardez aussi derrière les rideaux et sous les tables."]`; table hantée
    `indices: ["Un animal qui vit près des mares.", "Il est vert et saute.", "Il fait « croa »."]`; others keep their
    single hint as a one-item list; last step still without hint.
- [ ] **Step 4:** `npx vitest run src/config` → PASS; `npm run valider` → OK. (Other suites fail until Tasks 3–5;
  `npm run typecheck` shows the remaining `hint`/`hintAfterMinutes` uses to fix there.)
- [ ] **Step 5:** `git commit -m "feat: configure progressive hints in quiz.yaml (#41)"`

### Task 3: State, reducer and restore

**Files:** Modify `src/game/progress.ts`, `src/game/restore.ts`, `src/game/animator.test.ts`, `src/game/restore.test.ts`.

**Interfaces — Consumes:** Task 1 `availableHints`, `hintsUnlockedByClock`; `slotTiming` from `time.ts`.
**Produces:**
```ts
GameState.hintCount: number   // hints given by the animator in hintSlot (0 when hintSlot is null)
/** Hints of the challenge available now (clock or animator). */
export function hintsAvailable(state: GameState, config: QuizConfig, challenge: number, slot: number, now: number): number
```
`hintShown` is removed (replaced by `hintsAvailable`). Action `showHint { challenge, now }` keeps its shape: « one more
hint ».

- [ ] **Step 1: failing tests** — `animator.test.ts` (fixture step B: `hints: ['Bouh', 'Hou', 'Ouh']`, config
  `hintTimes: [5, 8, 11]`):
```ts
describe('showHint', () => {
  it('gives one more hint on each tap, for the rest of the slot', () => {
    const one = reduce(playing, { type: 'showHint', challenge: 1, now: MIN })
    expect(one).toEqual({ ...playing, hintSlot: 0, hintCount: 1 })
    const two = reduce(one, { type: 'showHint', challenge: 1, now: MIN })
    expect(hintsAvailable(two, config, 1, 0, MIN)).toBe(2)
    expect(hintsAvailable(two, config, 1, 1, 16 * MIN)).toBe(0)
  })
  it('counts from the hints the clock already unlocked', () => {
    // 9 minutes in: the clock gave 2 hints, the animator gives the third.
    expect(reduce(playing, { type: 'showHint', challenge: 1, now: 9 * MIN })).toEqual({ ...playing, hintSlot: 0, hintCount: 3 })
  })
  it('ignores a tap once every hint is out, a challenge without hint, another challenge, or another screen', () => {
    const all = { ...playing, hintSlot: 0, hintCount: 3 }
    expect(reduce(all, { type: 'showHint', challenge: 1, now: MIN })).toBe(all)
    const zombiesOnA = { ...playing, digits: [null, 0] }
    expect(reduce(zombiesOnA, { type: 'showHint', challenge: 0, now: 16 * MIN })).toBe(zombiesOnA)
    expect(reduce(playing, { type: 'showHint', challenge: 0, now: MIN })).toBe(playing)
    expect(reduce(home, { type: 'showHint', challenge: 1, now: 0 })).toBe(home)
  })
})
```
  `restore.test.ts`: fixtures gain `hintCount` (`playing`: `hintSlot: 1, hintCount: 2`; others `hintCount: 0`); add:
```ts
it('restores a sprint 13 save (one hint shown, no count) with that hint', () => {
  const { hintCount: _dropped, ...older } = playing
  expect(restoreGameState(older, 2)).toEqual({ ...playing, ...cleared, hintCount: 1 })
})
```
  keep the sprint 12 test (no `hintSlot`, no `hintCount` → `hintSlot: null, hintCount: 0`); add rejections
  `['hint count as text', { ...playing, hintCount: '1' }]`, `['negative hint count', { ...playing, hintCount: -1 }]`.
- [ ] **Step 2:** `npx vitest run src/game` → FAIL.
- [ ] **Step 3: implementation**
  - `initialGameState`: `hintCount: 0`. Field doc: « Hints the animator gave in `hintSlot` (menu), 0 otherwise. »
  - `hintsAvailable`:
```ts
export function hintsAvailable(state: GameState, config: QuizConfig, challenge: number, slot: number, now: number): number {
  const total = config.steps[challenge].hints?.length ?? 0
  if (state.startedAt === null) return 0
  const { secondsLeft } = slotTiming(state.startedAt, now, config.slotMinutes)
  const byClock = hintsUnlockedByClock(secondsLeft, config.slotMinutes, config.hintTimes)
  return availableHints(byClock, { slot: state.hintSlot, count: state.hintCount }, slot, total)
}
```
  - Reducer `showHint`:
```ts
case 'showHint': {
  const phase = gamePhase(state, config, teamIndex, action.now)
  if (phase.kind !== 'challenge' || phase.challenge !== action.challenge) return state
  const shown = hintsAvailable(state, config, action.challenge, phase.slot, action.now)
  if (shown >= (config.steps[action.challenge].hints?.length ?? 0)) return state
  return { ...state, hintSlot: phase.slot, hintCount: shown + 1 }
}
```
  - `restore.ts`: read `hintCount`; missing → `hintSlot !== null ? 1 : 0` (comment: saves from sprint 13 showed one
    hint); present but not an integer ≥ 0 → null; pass it with `hintSlot` for `playing`.
  - `progress.ts` must stay ≤ 200 lines.
- [ ] **Step 4:** `npx vitest run src/game` → PASS.
- [ ] **Step 5:** `git commit -m "feat: let the animator give one more hint at a time (#41)"`

### Task 4: Hint button and window

**Files:** Modify `src/components/HintButton.tsx`, `HintButton.test.tsx`, `src/styles/hint.css`.

**Interfaces — Produces:**
```ts
export interface HintButtonProps {
  /** `indices` of the step (at least one). */
  hints: readonly string[]
  /** Hints available now (0..hints.length). */
  available: number
  /** Seconds before the next hint, null when none is left to come. */
  secondsToNext: number | null
}
```

- [ ] **Step 1: failing tests**
```ts
const HINTS = ['Sous le chaudron.', 'Près du feu.', 'Dans la marmite.']
it('stays greyed with its countdown until the first hint', () => {
  render(<HintButton hints={HINTS} available={0} secondsToNext={180} />)
  expect(screen.getByRole('button', { name: 'Indice dans 03:00' })).toBeDisabled()
})
it('shows the available hints, numbered, and the time before the next one', async () => {
  render(<HintButton hints={HINTS} available={1} secondsToNext={170} />)
  await userEvent.click(screen.getByRole('button', { name: 'Voir l’indice (1/3)' }))
  const dialog = screen.getByRole('dialog', { name: 'Indices' })
  expect(within(dialog).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Sous le chaudron.'])
  expect(dialog).toHaveTextContent('Indice suivant dans 02:50')
})
it('updates the open window when a new hint arrives, without a next line once all are out', async () => {
  const { rerender } = render(<HintButton hints={HINTS} available={2} secondsToNext={100} />)
  await userEvent.click(screen.getByRole('button', { name: 'Voir les indices (2/3)' }))
  rerender(<HintButton hints={HINTS} available={3} secondsToNext={null} />)
  const dialog = screen.getByRole('dialog', { name: 'Indices' })
  expect(within(dialog).getAllByRole('listitem')).toHaveLength(3)
  expect(dialog).not.toHaveTextContent('Indice suivant')
})
it('keeps the single-hint wording', async () => {
  render(<HintButton hints={['Sous le chaudron.']} available={1} secondsToNext={null} />)
  await userEvent.click(screen.getByRole('button', { name: 'Voir l’indice' }))
  expect(screen.getByRole('dialog', { name: 'Indice' })).toHaveTextContent('Sous le chaudron.')
})
```
  Keep the existing « Fermer / Escape / reopen » test, adapted to the new props.
- [ ] **Step 2:** `npx vitest run src/components/HintButton.test.tsx` → FAIL.
- [ ] **Step 3: implementation** — label: `available === 0` → `Indice dans ${formatClock(secondsToNext ?? 0)}`
  (disabled); one hint in the step → `Voir l’indice`; else `available === 1` → `Voir l’indice (1/n)`, more →
  `Voir les indices (k/n)`. Dialog title `Indice` when the step has one hint, `Indices` otherwise; `<ol className="hint-list">`
  of `hints.slice(0, available)`; then `<p className="hint-next">Indice suivant dans …</p>` when `secondsToNext !== null`
  and `available < hints.length`. CSS: `.hint-list` (left-aligned, numbered, `font-size: 30px`, gap 16px; 22px on phone),
  `.hint-next` (smaller, `color: var(--amber)`, `font-variant-numeric: lining-nums`). The single-hint case may keep
  the `<ol>` with one item.
- [ ] **Step 4:** run → PASS.
- [ ] **Step 5:** `git commit -m "feat: list the unlocked hints in the hint window (#41)"`

### Task 5: Wiring (step screen, game, animator menu)

**Files:** Modify `src/components/StepScreen.tsx`, `TeamGame.tsx`, `TeamAnimatorMenu.tsx`, `AnimatorMenu.tsx`,
`src/styles/animator.css`, `src/game/time.ts` (remove `secondsBeforeHint` and its tests in `time.test.ts`), and the
tests `StepScreen.test.tsx`, `TeamGame.test.tsx`, `TeamAnimatorMenu.test.tsx`, `AnimatorMenu.test.tsx`.

**Interfaces — Consumes:** Task 3 `hintsAvailable`; Task 1 `secondsBeforeNextHint`; Task 4 `HintButtonProps`.
**Produces:** `StepScreenProps.hintSecondsLeft` replaced by `hintsAvailable: number` and
`secondsToNextHint: number | null`. `AnimatorMenuProps.onShowHint` replaced by
`nextHint?: { number: number; total: number; onShow(): void }`.

- [ ] **Step 1: failing tests**
  - `AnimatorMenu.test.tsx`: steps get `hints: ['Sous la dalle', 'Derrière']` on La crypte;
    « offers only the possible actions » passes `nextHint={{ number: 2, total: 3, onShow }}` and clicks
    `Débloquer l’indice suivant (2/3)`; the regex `/Valider|Débloquer|indice/` stays. Solutions test:
```ts
expect(within(list).getByRole('list', { name: 'Indices de La crypte' })).toHaveTextContent('Sous la dalleDerrière')
```
  - `TeamAnimatorMenu.test.tsx` (step Le grenier `hints: ['Sous le lit', 'Sous l’oreiller']`, `hintTimes: [10, 12]`):
    press `Débloquer l’indice suivant (1/2)` → button `Voir l’indice (1/2)` enabled; open menu again → button
    `Débloquer l’indice suivant (2/2)`; press → `Voir les indices (2/2)`; open again → no `Débloquer l’indice` button.
  - `StepScreen.test.tsx` / `TeamGame.test.tsx`: replace `hintSecondsLeft` props and `Indice dans 10:00` expectations
    with the new props/labels (`TeamGame` with `hintTimes: [10]` still shows `Indice dans 10:00`).
- [ ] **Step 2:** `npx vitest run src/components` → FAIL.
- [ ] **Step 3: implementation**
  - `StepScreen`: `{step.hints && !solved && <HintButton hints={step.hints} available={hintsAvailable} secondsToNext={secondsToNextHint} />}`.
  - `TeamGame` (`challenge`/`waiting` case):
```ts
const shown = hintsAvailable(state, config, phase.challenge, phase.slot, at)
const toNext = secondsBeforeNextHint(timing.secondsLeft, slotMinutes, config.hintTimes, shown)
```
    passed as `hintsAvailable={shown} secondsToNextHint={toNext}`.
  - `TeamAnimatorMenu`: `const total = step.hints?.length ?? 0`, `const shown = hintsAvailable(state, config, challenge, slot, now)`;
    `nextHint={shown < total ? { number: shown + 1, total, onShow: () => progress.showHint(challenge) } : undefined}`.
  - `AnimatorMenu`: button `Débloquer l’indice suivant ({number}/{total})` running `nextHint.onShow`; `nothing` uses
    `!nextHint`; in the solutions, under each `li`, when `step.hints`:
    `<ol className="animator-hints" aria-label={`Indices de ${step.title}`}>{step.hints.map(...)}</ol>`;
    CSS `.animator-hints { grid-column: 1 / -1; margin: 0; padding-left: 28px; font-size: 18px; opacity: .85 }`.
  - Remove `secondsBeforeHint` from `time.ts` / `time.test.ts` (no user left: `grep -rn secondsBeforeHint src`).
- [ ] **Step 4:** `npm run test:run` and `npm run typecheck` → all green.
- [ ] **Step 5:** `git commit -m "feat: show progressive hints on the step screen and in the animator menu (#41)"`

### Task 6: End-to-end

**Files:** Modify `e2e/hint-and-block.spec.ts`, `e2e/animator-menu.spec.ts`, `e2e/layout.spec.ts`.

- [ ] **Step 1:** `hint-and-block.spec.ts` (Zombies, La table hantée, 3 hints in the sample quiz):
```ts
await expect(page.getByRole('button', { name: /^Indice dans (05:00|04:5\d)$/ })).toBeDisabled()
// wrong answer + block + fastForward('01:00') unchanged
await page.clock.fastForward('04:00')
await page.getByRole('button', { name: 'Voir l’indice (1/3)' }).click()
const dialog = page.getByRole('dialog', { name: 'Indices' })
await expect(dialog.getByRole('listitem')).toHaveText(['Un animal qui vit près des mares.'])
await expect(dialog).toContainText(/Indice suivant dans (03:00|02:5\d)/)
await page.clock.fastForward('03:00')
await expect(dialog.getByRole('listitem')).toHaveCount(2)
await dialog.getByRole('button', { name: 'Fermer' }).click()
await page.clock.fastForward('03:00')
await page.getByRole('button', { name: 'Voir les indices (3/3)' }).click()
await expect(dialog.getByRole('listitem')).toHaveCount(3)
await expect(dialog).not.toContainText('Indice suivant')
await dialog.getByRole('button', { name: 'Fermer' }).click()
// then CRAPAUD → « Chiffre trouvé : 7 », no hint button (unchanged)
```
  Title: « … and the three hints unlock at 5, 8 and 11 minutes ».
- [ ] **Step 2:** `animator-menu.spec.ts`: `Montrer l’indice` → `Débloquer l’indice suivant (1/1)`; the dialog name
  stays `Indice` (galerie has one hint). `layout.spec.ts`: add a test with the Zombies, 11 minutes in (all 3 hints),
  `Voir les indices (3/3)` visible and no scrolling (install `page.clock` there only).
- [ ] **Step 3:** stop any `vite preview` on 4173, then `npm run test:e2e` → all green.
- [ ] **Step 4:** Playwright check by eye at 810×1080 and 390×844: step screen, window with 3 hints (screenshots).
- [ ] **Step 5:** `git commit -m "test: cover progressive hints end to end (#41)"`

### Task 7: Docs

**Files:** `CLAUDE.md` (Indice, Menu animateur, Sauvegarde pitfalls: `hintCount`, max not sum, old saves),
`README.md` (animator section, `indices_apres_minutes`), `ETAT.md`.

- [ ] Update, `npm run test:run && npm run typecheck && npm run build && npm run lint`, commit
  `docs: document progressive hints (#41)`.
