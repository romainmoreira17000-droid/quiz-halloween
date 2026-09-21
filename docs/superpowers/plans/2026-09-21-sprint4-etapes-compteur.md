# Sprint 4 — Déroulé des étapes et compteur — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Children start the game, solve each step with a 0–9 keypad under a running countdown, and reach a provisional "all solved" screen, in the chosen "Manoir à la bougie" design.

**Architecture:** Pure game logic in `src/game/` (time, answer check, messages, reducer), two hooks in `src/hooks/` (`useCountdown` computes time from the start timestamp, `useGameProgress` wraps the reducer in memory — persistence comes in sprint 6), one component per screen in `src/components/` composed by `Game.tsx`. Styles ported from `docs/design/maquettes/commun.css` + `bougie.css` into `src/styles/`, fonts bundled with `@fontsource` so the game works offline.

**Tech Stack:** React 19, TypeScript, Vitest 5 + Testing Library + user-event, Playwright (`page.clock`), `@fontsource/alegreya`, `@fontsource/im-fell-english-sc`.

**Spec:** `docs/superpowers/specs/2026-09-21-quiz-halloween-design.md` (sections « Écrans », « Décisions ») + issue #4. Visual reference: `docs/design/maquettes/bougie.html` / `bougie.css` / `commun.css`.

## Global Constraints

- Code, identifiers, CSS class names, comments, commits in English; every text shown on screen in French.
- Max 200 lines per file; JSDoc `@file` on every module, JSDoc on every export; no `any`.
- Branch `feat/steps-and-countdown`; commits `feat: ... (#4)`; PR to `main` with `Closes #4`.
- Time is always computed from the start timestamp (`Date.now()`), never from an in-memory decrement.
- When time is up the game continues: clock shows `-mm:ss` in red.
- Wrong answer: unlimited tries, no penalty, shake + a kind message that changes on each wrong try.
- Progress is shown with candles (design choice), not pumpkins. No reset button and no localStorage in this sprint (sprint 6).
- Digits always use `font-variant-numeric: lining-nums` (otherwise 0 looks like the letter o).
- Keypad keys ≥ 88 px; `--key` drives both width and height. Background never pure white.
- After the last step: provisional `AllSolvedScreen` (replaced by the padlock in sprint 5).

---

### Task 1: Pure game logic — time, answer, messages

**Files:**
- Create: `src/game/time.ts`, `src/game/time.test.ts`
- Create: `src/game/answer.ts`, `src/game/answer.test.ts`
- Create: `src/game/messages.ts`, `src/game/messages.test.ts`

**Interfaces — Produces:**
```ts
// time.ts
export function remainingSeconds(startedAt: number, now: number, durationMinutes: number): number
export function formatClock(seconds: number): string          // 5400 → "90:00", -61 → "-01:01"
// answer.ts
export function isCorrectAnswer(step: QuizStep, digit: number): boolean
// messages.ts
export const WRONG_ANSWER_MESSAGES: readonly string[]
export function wrongAnswerMessage(attempt: number): string   // attempt ≥ 1
```

- [ ] **Step 1: Write the failing tests**

`src/game/time.test.ts`:
```ts
/** @file Tests for countdown arithmetic and clock formatting. */
import { formatClock, remainingSeconds } from './time'

const START = Date.UTC(2026, 9, 31, 14, 0, 0)

describe('remainingSeconds', () => {
  it('is the full duration at the start', () => {
    expect(remainingSeconds(START, START, 90)).toBe(5400)
  })
  it('drops whole seconds only', () => {
    expect(remainingSeconds(START, START + 999, 90)).toBe(5400)
    expect(remainingSeconds(START, START + 1000, 90)).toBe(5399)
  })
  it('goes negative once time is up', () => {
    expect(remainingSeconds(START, START + 91 * 60_000, 90)).toBe(-60)
  })
})

describe('formatClock', () => {
  it('pads minutes and seconds', () => {
    expect(formatClock(5400)).toBe('90:00')
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(0)).toBe('00:00')
  })
  it('keeps minutes above 99', () => {
    expect(formatClock(125 * 60)).toBe('125:00')
  })
  it('prefixes negative times with a minus sign', () => {
    expect(formatClock(-1)).toBe('-00:01')
    expect(formatClock(-61)).toBe('-01:01')
  })
})
```

`src/game/answer.test.ts`:
```ts
/** @file Tests for the answer check. */
import { isCorrectAnswer } from './answer'

const step = { title: 'La crypte', instruction: 'Comptez...', solution: 0 }

describe('isCorrectAnswer', () => {
  it('accepts the solution, including 0', () => {
    expect(isCorrectAnswer(step, 0)).toBe(true)
  })
  it('rejects any other digit', () => {
    expect(isCorrectAnswer(step, 9)).toBe(false)
  })
})
```

`src/game/messages.test.ts`:
```ts
/** @file Tests for the kind wrong-answer messages. */
import { WRONG_ANSWER_MESSAGES, wrongAnswerMessage } from './messages'

describe('wrongAnswerMessage', () => {
  it('starts with the first message', () => {
    expect(wrongAnswerMessage(1)).toBe(WRONG_ANSWER_MESSAGES[0])
  })
  it('never repeats the same message twice in a row', () => {
    for (let attempt = 1; attempt < 20; attempt++) {
      expect(wrongAnswerMessage(attempt + 1)).not.toBe(wrongAnswerMessage(attempt))
    }
  })
  it('cycles through every message', () => {
    const seen = new Set(Array.from({ length: WRONG_ANSWER_MESSAGES.length }, (_, i) => wrongAnswerMessage(i + 1)))
    expect(seen.size).toBe(WRONG_ANSWER_MESSAGES.length)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game`
Expected: FAIL — cannot resolve `./time`, `./answer`, `./messages`.

- [ ] **Step 3: Write minimal implementation**

`src/game/time.ts`:
```ts
/** @file Countdown arithmetic, always derived from the start timestamp so sleep/reload stays exact. */

/**
 * Seconds left before the end of the game (negative once time is up).
 * @param startedAt Start timestamp in ms (Date.now()).
 * @param now Current timestamp in ms.
 * @param durationMinutes Game duration from quiz.yaml.
 * @returns Whole seconds left; elapsed time is rounded down so the clock starts on "90:00".
 */
export function remainingSeconds(startedAt: number, now: number, durationMinutes: number): number {
  return durationMinutes * 60 - Math.floor((now - startedAt) / 1000)
}

/**
 * Formats seconds as "mm:ss", with a leading "-" when negative.
 * @param seconds Seconds left, possibly negative.
 * @returns For example "84:17" or "-02:05".
 */
export function formatClock(seconds: number): string {
  const abs = Math.abs(seconds)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${seconds < 0 ? '-' : ''}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}
```

`src/game/answer.ts`:
```ts
/** @file Answer check for one step. */
import type { QuizStep } from '../config/types'

/**
 * Tells whether a keypad digit solves a step.
 * @param step The current step.
 * @param digit Digit pressed (0–9).
 * @returns True when the digit is the step's solution.
 */
export function isCorrectAnswer(step: QuizStep, digit: number): boolean {
  return step.solution === digit
}
```

`src/game/messages.ts`:
```ts
/** @file Kind messages shown after a wrong answer (children aged 7–10, no penalty). */

/** Messages shown in turn, so a second wrong try visibly changes the screen. */
export const WRONG_ANSWER_MESSAGES: readonly string[] = [
  'Presque ! Cherchez encore.',
  'Les fantômes rigolent… Réessayez !',
  'Pas tout à fait. Relisez bien l’énigme !',
  'Courage, vous allez trouver !',
]

/**
 * Message for the n-th wrong try on a step.
 * @param attempt Wrong tries so far on this step (≥ 1).
 * @returns A message, cycling through the list.
 */
export function wrongAnswerMessage(attempt: number): string {
  return WRONG_ANSWER_MESSAGES[(attempt - 1) % WRONG_ANSWER_MESSAGES.length]
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/game
git commit -m "feat: add countdown, answer and message logic (#4)"
```

---

### Task 2: Game reducer and `useGameProgress`

**Files:**
- Create: `src/game/progress.ts`, `src/game/progress.test.ts`
- Create: `src/hooks/useGameProgress.ts`, `src/hooks/useGameProgress.test.ts`

**Interfaces:**
- Consumes: `isCorrectAnswer(step, digit)` from Task 1.
- Produces:
```ts
// progress.ts
export type GameStatus = 'home' | 'playing' | 'solved'
export interface GameState {
  status: GameStatus
  stepIndex: number        // 0-based index of the current step
  foundDigits: number[]    // digits of solved steps, in step order
  startedAt: number | null // ms timestamp, null before "Commencer"
  wrongAttempts: number    // wrong tries on the current step
}
export type GameAction = { type: 'start'; now: number } | { type: 'answer'; digit: number } | { type: 'next' }
export const initialGameState: GameState
export function isCurrentStepSolved(state: GameState): boolean
export function createGameReducer(steps: readonly QuizStep[]): (state: GameState, action: GameAction) => GameState
// useGameProgress.ts
export interface GameProgress { state: GameState; start(): void; answer(digit: number): void; next(): void }
export function useGameProgress(steps: readonly QuizStep[]): GameProgress
```

- [ ] **Step 1: Write the failing tests**

`src/game/progress.test.ts`:
```ts
/** @file Tests for the game state machine. */
import { createGameReducer, initialGameState, isCurrentStepSolved, type GameState } from './progress'

const steps = [
  { title: 'A', instruction: 'a', solution: 4 },
  { title: 'B', instruction: 'b', solution: 0 },
]
const reduce = createGameReducer(steps)
const playing: GameState = { ...initialGameState, status: 'playing', startedAt: 1000 }

describe('game reducer', () => {
  it('starts on the home screen', () => {
    expect(initialGameState).toEqual({ status: 'home', stepIndex: 0, foundDigits: [], startedAt: null, wrongAttempts: 0 })
  })
  it('records the start time', () => {
    expect(reduce(initialGameState, { type: 'start', now: 1000 })).toEqual(playing)
  })
  it('ignores a second start', () => {
    expect(reduce(playing, { type: 'start', now: 9999 })).toBe(playing)
  })
  it('counts wrong answers without other penalty', () => {
    const once = reduce(playing, { type: 'answer', digit: 1 })
    const twice = reduce(once, { type: 'answer', digit: 2 })
    expect(twice).toEqual({ ...playing, wrongAttempts: 2 })
  })
  it('stores the digit of a solved step and clears wrong tries', () => {
    const wrong = reduce(playing, { type: 'answer', digit: 1 })
    const right = reduce(wrong, { type: 'answer', digit: 4 })
    expect(right).toEqual({ ...playing, foundDigits: [4], wrongAttempts: 0 })
    expect(isCurrentStepSolved(right)).toBe(true)
  })
  it('ignores keypad presses once the step is solved', () => {
    const right = reduce(playing, { type: 'answer', digit: 4 })
    expect(reduce(right, { type: 'answer', digit: 7 })).toBe(right)
  })
  it('does not move on before the step is solved', () => {
    expect(reduce(playing, { type: 'next' })).toBe(playing)
  })
  it('moves to the next step', () => {
    const right = reduce(playing, { type: 'answer', digit: 4 })
    const next = reduce(right, { type: 'next' })
    expect(next).toEqual({ ...playing, stepIndex: 1, foundDigits: [4] })
    expect(isCurrentStepSolved(next)).toBe(false)
  })
  it('accepts 0 as a solution and ends after the last step', () => {
    let state = reduce(playing, { type: 'answer', digit: 4 })
    state = reduce(state, { type: 'next' })
    state = reduce(state, { type: 'answer', digit: 0 })
    state = reduce(state, { type: 'next' })
    expect(state).toEqual({ ...playing, status: 'solved', stepIndex: 1, foundDigits: [4, 0] })
  })
  it('ignores answers outside of the playing status', () => {
    expect(reduce(initialGameState, { type: 'answer', digit: 4 })).toBe(initialGameState)
  })
})
```

`src/hooks/useGameProgress.test.ts`:
```ts
/** @file Tests for the in-memory game progress hook. */
import { act, renderHook } from '@testing-library/react'
import { useGameProgress } from './useGameProgress'

const steps = [{ title: 'A', instruction: 'a', solution: 3 }]

describe('useGameProgress', () => {
  afterEach(() => vi.useRealTimers())

  it('starts with the current time and plays a step', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T14:00:00Z'))
    const { result } = renderHook(() => useGameProgress(steps))
    act(() => result.current.start())
    expect(result.current.state.startedAt).toBe(Date.parse('2026-10-31T14:00:00Z'))
    act(() => result.current.answer(3))
    act(() => result.current.next())
    expect(result.current.state.status).toBe('solved')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/progress.test.ts src/hooks`
Expected: FAIL — cannot resolve `./progress`, `./useGameProgress`.

- [ ] **Step 3: Write minimal implementation**

`src/game/progress.ts`:
```ts
/** @file Game state machine: home → playing (step by step) → solved. Pure, so sprint 6 can persist it. */
import type { QuizStep } from '../config/types'
import { isCorrectAnswer } from './answer'

/** Which part of the game is shown. */
export type GameStatus = 'home' | 'playing' | 'solved'

/** Whole game progress. */
export interface GameState {
  status: GameStatus
  /** 0-based index of the current step. */
  stepIndex: number
  /** Digits of solved steps, in step order. */
  foundDigits: number[]
  /** Start timestamp in ms, null before "Commencer". */
  startedAt: number | null
  /** Wrong tries on the current step (drives the message and the shake). */
  wrongAttempts: number
}

/** Player actions. `now` is passed in so the reducer stays pure. */
export type GameAction = { type: 'start'; now: number } | { type: 'answer'; digit: number } | { type: 'next' }

/** State before the game starts. */
export const initialGameState: GameState = { status: 'home', stepIndex: 0, foundDigits: [], startedAt: null, wrongAttempts: 0 }

/**
 * Tells whether the current step already has its digit.
 * @param state Game state.
 * @returns True once the right digit was pressed on the current step.
 */
export function isCurrentStepSolved(state: GameState): boolean {
  return state.foundDigits.length > state.stepIndex
}

/**
 * Builds the reducer for a given quiz. Invalid actions return the same state object.
 * @param steps Steps of the quiz, in play order.
 * @returns A reducer usable with useReducer.
 */
export function createGameReducer(steps: readonly QuizStep[]) {
  return (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'start':
        return state.status === 'home' ? { ...state, status: 'playing', startedAt: action.now } : state
      case 'answer':
        if (state.status !== 'playing' || isCurrentStepSolved(state)) return state
        return isCorrectAnswer(steps[state.stepIndex], action.digit)
          ? { ...state, foundDigits: [...state.foundDigits, action.digit], wrongAttempts: 0 }
          : { ...state, wrongAttempts: state.wrongAttempts + 1 }
      case 'next':
        if (state.status !== 'playing' || !isCurrentStepSolved(state)) return state
        return state.stepIndex + 1 >= steps.length
          ? { ...state, status: 'solved' }
          : { ...state, stepIndex: state.stepIndex + 1, wrongAttempts: 0 }
    }
  }
}
```

`src/hooks/useGameProgress.ts`:
```ts
/** @file In-memory game progress (sprint 6 will save it to the tablet's localStorage). */
import { useMemo, useReducer } from 'react'
import type { QuizStep } from '../config/types'
import { createGameReducer, initialGameState, type GameState } from '../game/progress'

/** Game state and the actions the screens can trigger. */
export interface GameProgress {
  state: GameState
  /** Starts the game and the countdown now. */
  start(): void
  /** Submits a keypad digit for the current step. */
  answer(digit: number): void
  /** Goes to the next step (or to the end) once the current one is solved. */
  next(): void
}

/**
 * Holds the progress of one game.
 * @param steps Steps of the quiz, in play order.
 * @returns The state and its actions.
 */
export function useGameProgress(steps: readonly QuizStep[]): GameProgress {
  const reducer = useMemo(() => createGameReducer(steps), [steps])
  const [state, dispatch] = useReducer(reducer, initialGameState)
  return {
    state,
    start: () => dispatch({ type: 'start', now: Date.now() }),
    answer: (digit) => dispatch({ type: 'answer', digit }),
    next: () => dispatch({ type: 'next' }),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game src/hooks`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/progress.ts src/game/progress.test.ts src/hooks
git commit -m "feat: add game progress state machine (#4)"
```

---

### Task 3: `useCountdown`

**Files:**
- Create: `src/hooks/useCountdown.ts`, `src/hooks/useCountdown.test.ts`

**Interfaces:**
- Consumes: `remainingSeconds` from Task 1.
- Produces: `export function useCountdown(startedAt: number | null, durationMinutes: number): number` (seconds left, negative when over).

- [ ] **Step 1: Write the failing test**

`src/hooks/useCountdown.test.ts`:
```ts
/** @file Tests for the countdown hook (fake clock). */
import { act, renderHook } from '@testing-library/react'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  let start: number
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T14:00:00Z'))
    start = Date.now()
  })
  afterEach(() => vi.useRealTimers())

  it('shows the full duration before the game starts', () => {
    const { result } = renderHook(() => useCountdown(null, 90))
    expect(result.current).toBe(5400)
  })
  it('counts down from the start time', () => {
    const { result } = renderHook(() => useCountdown(start, 90))
    expect(result.current).toBe(5400)
    act(() => { vi.advanceTimersByTime(61_000) })
    expect(result.current).toBe(5339)
  })
  it('keeps counting below zero', () => {
    const { result } = renderHook(() => useCountdown(start, 1))
    act(() => { vi.advanceTimersByTime(125_000) })
    expect(result.current).toBe(-65)
  })
  it('stays right after the tablet slept (clock jumps, timers did not run)', () => {
    const { result } = renderHook(() => useCountdown(start, 90))
    vi.setSystemTime(start + 30 * 60_000)
    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current).toBe(3600)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useCountdown.test.ts`
Expected: FAIL — cannot resolve `./useCountdown`.

- [ ] **Step 3: Write minimal implementation**

`src/hooks/useCountdown.ts`:
```ts
/** @file Live countdown, re-read from the real clock on every tick. */
import { useEffect, useState } from 'react'
import { remainingSeconds } from '../game/time'

/** Half a second, so the display never lags more than that behind the real time. */
const TICK_MS = 500

/**
 * Seconds left in the game, refreshed twice a second.
 * @param startedAt Start timestamp in ms, or null before the game starts.
 * @param durationMinutes Game duration from quiz.yaml.
 * @returns Seconds left; negative once time is up (the game keeps going).
 */
export function useCountdown(startedAt: number | null, durationMinutes: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (startedAt === null) return
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [startedAt])
  if (startedAt === null) return durationMinutes * 60
  // `now` may predate the start if this hook mounted before "Commencer".
  return remainingSeconds(startedAt, Math.max(now, startedAt), durationMinutes)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCountdown.ts src/hooks/useCountdown.test.ts
git commit -m "feat: add countdown hook computed from start time (#4)"
```

---

### Task 4: Candle theme styles and bundled fonts

No logic, so no unit test: verification is the build plus the font check added to e2e in Task 8.

**Files:**
- Create: `src/styles/base.css`, `src/styles/controls.css`, `src/styles/screens.css`
- Modify: `src/main.tsx` (imports), `vite.config.ts` (precache `woff2`, soot theme colour), `index.html` (theme colour)
- Delete: `src/index.css` (empty)

- [ ] **Step 1: Install the fonts**

Run: `npm install @fontsource/alegreya @fontsource/im-fell-english-sc`
Then check the Latin-only files exist:
`ls node_modules/@fontsource/alegreya/latin-500.css node_modules/@fontsource/alegreya/latin-700.css node_modules/@fontsource/im-fell-english-sc/latin-400.css`
Expected: the three files are listed. (Latin only covers French accents and keeps the offline cache small.)

- [ ] **Step 2: Write `src/styles/base.css`**

```css
/**
 * @file Base of the "Manoir à la bougie" theme: palette, fonts, page frame, screen layout.
 * The tablet is the only light in a dark room: cream text on soot, never pure white.
 */
:root {
  --soot: #1a120c;
  --wall: #2a1c12;
  --wax: #f1dcb0;
  --amber: #f2a541;
  --bronze: #c9a26b;
  --seal: #8b2a20;
  --seal-light: #b8483a;
  --ember: #e0562f;
  --title-font: "IM Fell English SC", Georgia, serif;
  --text-font: Alegreya, Georgia, serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; }
html, body { min-height: 100%; }
body {
  min-height: 100dvh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  background:
    radial-gradient(ellipse 75% 45% at 50% 8%, rgb(242 165 65 / .2), transparent 70%),
    radial-gradient(ellipse 120% 60% at 50% 110%, var(--wall), transparent 70%),
    var(--soot);
  color: var(--wax);
  font-family: var(--text-font);
  font-weight: 500;
}
p { text-wrap: pretty; }
/* touch-action: fast repeated taps on the keypad must not zoom the page. */
button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; touch-action: manipulation; }

h1, h2 { font-family: var(--title-font); font-weight: 400; }
h1 { font-size: 104px; line-height: .95; text-wrap: balance; text-shadow: 0 0 28px rgb(242 165 65 / .45); }
h2 { font-size: 68px; line-height: 1; text-shadow: 0 0 20px rgb(242 165 65 / .3); }

.screen {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 48px 48px;
  text-align: center;
}

:focus-visible { outline: 4px solid currentColor; outline-offset: 4px; }

/* Phones: animators may test on their own phone. */
@media (max-width: 600px) {
  .screen { padding: 16px 16px 32px; }
  h1 { font-size: 64px; }
  h2 { font-size: 44px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Write `src/styles/controls.css`**

```css
/** @file Shared controls: wax-seal buttons, keypad, header with clock and candle progress. */

/* Wax-seal buttons */
.keypad button, .seal-button {
  position: relative;
  color: var(--wax);
  background: radial-gradient(circle at 35% 30%, var(--seal-light), var(--seal) 55%, #5a150f);
  box-shadow: inset 0 -6px 0 rgb(0 0 0 / .25), 0 8px 18px rgb(0 0 0 / .55);
  text-shadow: 0 2px 0 rgb(0 0 0 / .35);
}
.keypad button:active, .seal-button:active {
  transform: translateY(3px);
  box-shadow: inset 0 -2px 0 rgb(0 0 0 / .25), 0 3px 8px rgb(0 0 0 / .5);
}
.keypad button::before, .seal-button::before {
  content: ""; position: absolute; inset: 12px;
  border: 2px dashed rgb(241 220 176 / .25);
  border-radius: inherit;
}
.seal-button {
  min-height: 104px; padding: 0 72px;
  border-radius: 56px 60px 54px 58px;
  font-family: var(--title-font); font-size: 48px;
}

/* Keypad: --key drives both width and height (never below 88px). */
.keypad {
  --key: 124px;
  --key-gap: 22px;
  display: grid;
  grid-template-columns: repeat(3, var(--key));
  gap: var(--key-gap);
  justify-content: center;
}
.keypad button {
  width: var(--key); height: var(--key);
  border-radius: 48% 52% 50% 50% / 52% 47% 53% 48%;
  font-size: 60px; font-weight: 700;
  font-variant-numeric: lining-nums;
}
/* Phone-style layout: 0 sits alone under the middle column. */
.keypad button:last-child { grid-column: 2; }

/* Header */
.game-header {
  align-self: stretch;
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
  min-height: 72px;
}
/* Keeps the candles centred until the reset button arrives (sprint 6). */
.header-spacer { width: 48px; }

.clock {
  min-width: 150px; text-align: left;
  font-size: 44px; font-weight: 700; color: var(--amber);
  font-variant-numeric: lining-nums tabular-nums;
}
.clock--overtime { color: var(--ember); text-shadow: 0 0 14px rgb(224 86 47 / .5); }

/* Candle progress: lit = solved, current = wick glowing, others = unlit wax. */
.candles { display: flex; gap: 14px; list-style: none; padding: 0; }
.candles li {
  position: relative; width: 18px; height: 46px; margin-top: 22px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(90deg, #cdb07c, var(--wax) 45%, #bfa06c);
  opacity: .4;
}
.candles li.lit, .candles li.current { opacity: 1; }
.candles li::before {
  content: ""; position: absolute; left: 50%; bottom: 100%;
  width: 12px; height: 20px; margin-left: -6px;
}
.candles li.lit::before {
  border-radius: 50% 50% 45% 45% / 62% 62% 38% 38%;
  background: radial-gradient(ellipse at 50% 70%, #fff3c4 0 20%, var(--amber) 65%, transparent 70%);
  box-shadow: 0 0 16px 6px rgb(242 165 65 / .35);
}
.candles li.current::before {
  width: 4px; height: 8px; margin-left: -2px;
  background: var(--ember); border-radius: 2px;
  box-shadow: 0 0 8px 2px rgb(224 86 47 / .6);
}

@media (max-width: 600px) {
  .keypad { --key: 88px; --key-gap: 16px; }
  .keypad button { font-size: 44px; }
  .seal-button { min-height: 88px; padding: 0 40px; font-size: 36px; }
  .clock { min-width: 0; font-size: 32px; }
  .candles { gap: 8px; }
  .candles li { width: 12px; height: 34px; }
}
```

- [ ] **Step 4: Write `src/styles/screens.css`**

```css
/** @file Screen-specific styles: home candle, step, answer feedback, all-solved recap. */

/* Home */
.home { justify-content: center; gap: 36px; }
.intro { font-size: 32px; line-height: 1.45; max-width: 19em; }
.duration { font-size: 24px; color: var(--bronze); }

.candle { display: flex; flex-direction: column; align-items: center; }
.flame {
  width: 34px; height: 62px;
  border-radius: 50% 50% 45% 45% / 62% 62% 38% 38%;
  background: radial-gradient(ellipse at 50% 72%, #fff3c4 0 18%, #ffc75a 40%, var(--amber) 70%, transparent 72%);
  box-shadow: 0 0 60px 26px rgb(242 165 65 / .28);
  transform-origin: 50% 90%;
  animation: flicker 2.6s ease-in-out infinite;
}
.wick { width: 3px; height: 10px; background: #2b1a0c; }
.wax {
  width: 52px; height: 150px;
  border-radius: 10px 10px 4px 4px;
  background: linear-gradient(90deg, #d9bf8e, var(--wax) 40%, #cdb07c);
}
@keyframes flicker {
  0%, 100% { transform: scale(1, 1) rotate(-1deg); }
  25% { transform: scale(1.04, .95) rotate(2deg); }
  55% { transform: scale(.96, 1.06) rotate(-2deg); }
  80% { transform: scale(1.02, .98) rotate(1deg); }
}

/* Step */
.step-number { margin-top: 28px; font-size: 26px; color: var(--bronze); }
.step h2 { margin: 6px 0 20px; }
.instruction { font-size: 36px; line-height: 1.45; max-width: 19em; }
.step-image { max-width: 100%; max-height: 280px; margin-top: 20px; border-radius: 12px; }
.answer-zone { margin-top: auto; padding-top: 24px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
.wrong-answer { font-size: 30px; color: var(--amber); }
.found { font-size: 40px; }
.found b { font-size: 72px; color: var(--amber); font-variant-numeric: lining-nums; }

.shake { animation: shake .45s ease-in-out; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-14px); }
  40% { transform: translateX(14px); }
  60% { transform: translateX(-9px); }
  80% { transform: translateX(9px); }
}

/* All solved (provisional until the padlock, sprint 5) */
.solved { gap: 26px; }
.solved h2 { margin-top: 12px; }
.solved p { font-size: 28px; color: var(--bronze); }
.recap {
  width: 100%; max-width: 690px;
  list-style: none; padding: 0;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 20px;
}
.recap li {
  display: flex; align-items: baseline; justify-content: space-between;
  padding: 8px 12px; border-bottom: 1px dashed rgb(241 220 176 / .25);
  font-size: 22px; text-align: left;
}
.recap b { font-size: 42px; font-weight: 700; color: var(--amber); font-variant-numeric: lining-nums; }

@media (max-width: 600px) {
  .intro { font-size: 24px; }
  .instruction { font-size: 26px; }
  .recap { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Wire styles and fonts**

`src/main.tsx` — replace `import './index.css'` with:
```ts
// Fonts are bundled (not Google Fonts) so the game works when the wifi drops.
import '@fontsource/alegreya/latin-500.css'
import '@fontsource/alegreya/latin-700.css'
import '@fontsource/im-fell-english-sc/latin-400.css'
import './styles/base.css'
import './styles/controls.css'
import './styles/screens.css'
```
Delete `src/index.css` (`git rm src/index.css`).

`vite.config.ts`:
- `workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webp,jpg,woff2}'] }` (fonts precached for offline play).
- `theme_color` and `background_color`: `'#1a120c'` (soot).

`index.html`: `<meta name="theme-color" content="#1a120c" />`.

- [ ] **Step 6: Verify the build**

Run: `npm run build && grep -c woff2 dist/sw.js`
Expected: build succeeds; count ≥ 1 (fonts listed in the precache manifest).
Run: `npm run test:run`
Expected: PASS (existing tests unaffected).

- [ ] **Step 7: Commit**

```bash
git add src/styles src/main.tsx vite.config.ts index.html package.json package-lock.json
git commit -m "feat: add candle-lit theme with bundled offline fonts (#4)"
```

---

### Task 5: Small components — Clock, CandleProgress, Keypad, GameHeader

**Files:**
- Create: `src/components/Clock.tsx`, `src/components/Clock.test.tsx`
- Create: `src/components/CandleProgress.tsx`, `src/components/CandleProgress.test.tsx`
- Create: `src/components/Keypad.tsx`, `src/components/Keypad.test.tsx`
- Create: `src/components/GameHeader.tsx`, `src/components/GameHeader.test.tsx`

**Interfaces:**
- Consumes: `formatClock` (Task 1), `useCountdown` (Task 3).
- Produces:
```ts
export function Clock(props: { seconds: number }): JSX.Element                       // role="timer"
export function CandleProgress(props: { total: number; solved: number; current: number | null }): JSX.Element
export function Keypad(props: { onDigit(digit: number): void }): JSX.Element          // buttons "1".."9","0"
export function GameHeader(props: { startedAt: number; durationMinutes: number; total: number; solved: number; current: number | null }): JSX.Element
```

- [ ] **Step 1: Write the failing tests**

`src/components/Clock.test.tsx`:
```tsx
/** @file Tests for the countdown display. */
import { render, screen } from '@testing-library/react'
import { Clock } from './Clock'

describe('Clock', () => {
  it('shows the time left in amber', () => {
    render(<Clock seconds={5057} />)
    expect(screen.getByRole('timer')).toHaveTextContent('84:17')
    expect(screen.getByRole('timer')).not.toHaveClass('clock--overtime')
  })
  it('is not red at exactly zero', () => {
    render(<Clock seconds={0} />)
    expect(screen.getByRole('timer')).not.toHaveClass('clock--overtime')
  })
  it('turns red and negative once time is up', () => {
    render(<Clock seconds={-125} />)
    expect(screen.getByRole('timer')).toHaveTextContent('-02:05')
    expect(screen.getByRole('timer')).toHaveClass('clock--overtime')
  })
})
```

`src/components/CandleProgress.test.tsx`:
```tsx
/** @file Tests for the candle progress bar. */
import { render, screen } from '@testing-library/react'
import { CandleProgress } from './CandleProgress'

describe('CandleProgress', () => {
  it('lights solved steps and marks the current one', () => {
    render(<CandleProgress total={4} solved={1} current={1} />)
    const candles = screen.getAllByRole('listitem')
    expect(candles.map((li) => li.className)).toEqual(['lit', 'current', '', ''])
    expect(screen.getByRole('list', { name: 'Étape 2 sur 4' })).toBeInTheDocument()
  })
  it('lights the current candle as soon as its step is solved', () => {
    render(<CandleProgress total={2} solved={2} current={1} />)
    expect(screen.getAllByRole('listitem').map((li) => li.className)).toEqual(['lit', 'lit'])
  })
  it('announces the end when there is no current step', () => {
    render(<CandleProgress total={2} solved={2} current={null} />)
    expect(screen.getByRole('list', { name: 'Toutes les étapes terminées' })).toBeInTheDocument()
  })
})
```

`src/components/Keypad.test.tsx`:
```tsx
/** @file Tests for the 0–9 keypad. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Keypad } from './Keypad'

describe('Keypad', () => {
  it('shows 1 to 9 then 0', () => {
    render(<Keypad onDigit={() => {}} />)
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])
  })
  it('sends the pressed digit, including 0', async () => {
    const onDigit = vi.fn()
    render(<Keypad onDigit={onDigit} />)
    await userEvent.click(screen.getByRole('button', { name: '0' }))
    await userEvent.click(screen.getByRole('button', { name: '7' }))
    expect(onDigit.mock.calls).toEqual([[0], [7]])
  })
})
```

`src/components/GameHeader.test.tsx`:
```tsx
/** @file Tests for the in-game header. */
import { render, screen } from '@testing-library/react'
import { GameHeader } from './GameHeader'

describe('GameHeader', () => {
  it('shows the live clock and the candles', () => {
    render(<GameHeader startedAt={Date.now()} durationMinutes={90} total={6} solved={0} current={0} />)
    expect(screen.getByRole('timer')).toHaveTextContent('90:00')
    expect(screen.getByRole('list', { name: 'Étape 1 sur 6' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components`
Expected: FAIL — the four new modules cannot be resolved (ConfigErrorScreen tests still pass).

- [ ] **Step 3: Write minimal implementation**

`src/components/Clock.tsx`:
```tsx
/** @file Countdown display: amber "mm:ss", red "-mm:ss" once time is up. */
import { formatClock } from '../game/time'

/** Props of Clock. */
export interface ClockProps { seconds: number }

/**
 * Shows the time left.
 * @param props.seconds Seconds left, negative when over.
 * @returns The clock.
 */
export function Clock({ seconds }: ClockProps) {
  const className = seconds < 0 ? 'clock clock--overtime' : 'clock'
  return <span role="timer" aria-label="Temps restant" className={className}>{formatClock(seconds)}</span>
}
```

`src/components/CandleProgress.tsx`:
```tsx
/** @file Progress as a row of candles: lit when solved, glowing wick on the current step. */

/** Props of CandleProgress. */
export interface CandleProgressProps {
  total: number
  /** Number of solved steps. */
  solved: number
  /** 0-based current step, or null when every step is done. */
  current: number | null
}

/**
 * Shows one candle per step.
 * @param props See CandleProgressProps.
 * @returns The candle list.
 */
export function CandleProgress({ total, solved, current }: CandleProgressProps) {
  const label = current === null ? 'Toutes les étapes terminées' : `Étape ${current + 1} sur ${total}`
  const candleClass = (i: number) => (i < solved ? 'lit' : i === current ? 'current' : '')
  return (
    <ol className="candles" aria-label={label}>
      {Array.from({ length: total }, (_, i) => <li key={i} className={candleClass(i)} />)}
    </ol>
  )
}
```

`src/components/Keypad.tsx`:
```tsx
/** @file 0–9 keypad of wax-seal buttons, laid out like a phone (0 under 8). */

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

/** Props of Keypad. */
export interface KeypadProps { onDigit(digit: number): void }

/**
 * Ten big digit buttons.
 * @param props.onDigit Called with the pressed digit.
 * @returns The keypad.
 */
export function Keypad({ onDigit }: KeypadProps) {
  return (
    <div className="keypad">
      {DIGITS.map((d) => <button key={d} type="button" onClick={() => onDigit(d)}>{d}</button>)}
    </div>
  )
}
```

`src/components/GameHeader.tsx`:
```tsx
/** @file In-game header: live countdown and candle progress. */
import { useCountdown } from '../hooks/useCountdown'
import { CandleProgress } from './CandleProgress'
import { Clock } from './Clock'

/** Props of GameHeader. */
export interface GameHeaderProps {
  startedAt: number
  durationMinutes: number
  total: number
  solved: number
  current: number | null
}

/**
 * Header shown on every in-game screen.
 * @param props See GameHeaderProps.
 * @returns The header.
 */
export function GameHeader({ startedAt, durationMinutes, total, solved, current }: GameHeaderProps) {
  const seconds = useCountdown(startedAt, durationMinutes)
  return (
    <header className="game-header">
      <Clock seconds={seconds} />
      <CandleProgress total={total} solved={solved} current={current} />
      <span className="header-spacer" aria-hidden="true" />
    </header>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "feat: add clock, candle progress, keypad and header (#4)"
```

---

### Task 6: Screens — HomeScreen, StepScreen, AllSolvedScreen

**Files:**
- Create: `src/components/HomeScreen.tsx`, `src/components/HomeScreen.test.tsx`
- Create: `src/components/StepScreen.tsx`, `src/components/StepScreen.test.tsx`
- Create: `src/components/AllSolvedScreen.tsx`, `src/components/AllSolvedScreen.test.tsx`

**Interfaces:**
- Consumes: `Keypad` (Task 5), `wrongAnswerMessage` (Task 1), `QuizStep`.
- Produces:
```ts
export function HomeScreen(props: { title: string; intro?: string; durationMinutes: number; onStart(): void }): JSX.Element
export interface StepScreenProps {
  header: ReactNode; step: QuizStep; stepNumber: number; total: number
  foundDigit: number | undefined; wrongAttempts: number; isLast: boolean
  onDigit(digit: number): void; onNext(): void
}
export function StepScreen(props: StepScreenProps): JSX.Element
export function AllSolvedScreen(props: { header: ReactNode; steps: readonly QuizStep[]; foundDigits: number[] }): JSX.Element
```

- [ ] **Step 1: Write the failing tests**

`src/components/HomeScreen.test.tsx`:
```tsx
/** @file Tests for the home screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from './HomeScreen'

describe('HomeScreen', () => {
  it('shows title, intro and duration', () => {
    render(<HomeScreen title="Le manoir hanté" intro="Bienvenue !" durationMinutes={90} onStart={() => {}} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Le manoir hanté' })).toBeInTheDocument()
    expect(screen.getByText('Bienvenue !')).toBeInTheDocument()
    expect(screen.getByText('Vous avez 90 minutes.')).toBeInTheDocument()
  })
  it('works without intro', () => {
    render(<HomeScreen title="T" durationMinutes={1} onStart={() => {}} />)
    expect(screen.getByText('Vous avez 1 minute.')).toBeInTheDocument()
  })
  it('starts the game', async () => {
    const onStart = vi.fn()
    render(<HomeScreen title="T" durationMinutes={90} onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: 'Commencer' }))
    expect(onStart).toHaveBeenCalledOnce()
  })
})
```

`src/components/StepScreen.test.tsx`:
```tsx
/** @file Tests for a step screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepScreen, type StepScreenProps } from './StepScreen'
import { WRONG_ANSWER_MESSAGES } from '../game/messages'

const base: StepScreenProps = {
  header: <header>entête</header>,
  step: { title: 'Le chaudron', instruction: 'Combien d’yeux ?', solution: 7 },
  stepNumber: 2, total: 6, foundDigit: undefined, wrongAttempts: 0, isLast: false,
  onDigit: () => {}, onNext: () => {},
}

describe('StepScreen', () => {
  it('shows the step and the keypad', () => {
    render(<StepScreen {...base} />)
    expect(screen.getByText('entête')).toBeInTheDocument()
    expect(screen.getByText('Étape 2 sur 6')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Le chaudron' })).toBeInTheDocument()
    expect(screen.getByText('Combien d’yeux ?')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(10)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
  it('shows the step image under the site base path', () => {
    render(<StepScreen {...base} step={{ ...base.step, image: 'chaudron.png' }} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/quiz-halloween/images/chaudron.png')
  })
  it('sends keypad digits', async () => {
    const onDigit = vi.fn()
    render(<StepScreen {...base} onDigit={onDigit} />)
    await userEvent.click(screen.getByRole('button', { name: '3' }))
    expect(onDigit).toHaveBeenCalledWith(3)
  })
  it('shakes and shows a kind message after a wrong answer', () => {
    const { container } = render(<StepScreen {...base} wrongAttempts={2} />)
    expect(screen.getByRole('alert')).toHaveTextContent(WRONG_ANSWER_MESSAGES[1])
    expect(container.querySelector('.shake')).not.toBeNull()
  })
  it('replaces the keypad with the found digit and a next button', async () => {
    const onNext = vi.fn()
    render(<StepScreen {...base} foundDigit={7} onNext={onNext} />)
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 7')
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Étape suivante' }))
    expect(onNext).toHaveBeenCalledOnce()
  })
  it('says "Continuer" after the last step', () => {
    render(<StepScreen {...base} foundDigit={7} isLast />)
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument()
  })
})
```

`src/components/AllSolvedScreen.test.tsx`:
```tsx
/** @file Tests for the provisional end screen. */
import { render, screen } from '@testing-library/react'
import { AllSolvedScreen } from './AllSolvedScreen'

describe('AllSolvedScreen', () => {
  it('lists each step with its digit', () => {
    const steps = [{ title: 'La crypte', instruction: 'a', solution: 4 }, { title: 'Le grenier', instruction: 'b', solution: 0 }]
    render(<AllSolvedScreen header={<header>entête</header>} steps={steps} foundDigits={[4, 0]} />)
    expect(screen.getByRole('heading', { name: 'Toutes les énigmes sont résolues !' })).toBeInTheDocument()
    expect(screen.getByText('entête')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['La crypte4', 'Le grenier0'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components`
Expected: FAIL — `HomeScreen`, `StepScreen`, `AllSolvedScreen` cannot be resolved.

- [ ] **Step 3: Write minimal implementation**

`src/components/HomeScreen.tsx`:
```tsx
/** @file Home screen: candle, title, intro and the "Commencer" button that starts the clock. */

/** Props of HomeScreen. */
export interface HomeScreenProps {
  title: string
  intro?: string
  durationMinutes: number
  onStart(): void
}

/**
 * First screen shown to the group.
 * @param props See HomeScreenProps.
 * @returns The home screen.
 */
export function HomeScreen({ title, intro, durationMinutes, onStart }: HomeScreenProps) {
  return (
    <main className="screen home">
      <div className="candle" aria-hidden="true"><span className="flame" /><span className="wick" /><span className="wax" /></div>
      <h1>{title}</h1>
      {intro && <p className="intro">{intro}</p>}
      <button type="button" className="seal-button" onClick={onStart}>Commencer</button>
      <p className="duration">Vous avez {durationMinutes} minute{durationMinutes > 1 ? 's' : ''}.</p>
    </main>
  )
}
```

`src/components/StepScreen.tsx`:
```tsx
/** @file Step screen: riddle, keypad, then the found digit and a button to go on. */
import type { ReactNode } from 'react'
import type { QuizStep } from '../config/types'
import { wrongAnswerMessage } from '../game/messages'
import { Keypad } from './Keypad'

/** Props of StepScreen. */
export interface StepScreenProps {
  /** In-game header (clock and candles). */
  header: ReactNode
  step: QuizStep
  /** 1-based number of this step. */
  stepNumber: number
  total: number
  /** Digit found on this step, undefined while unsolved. */
  foundDigit: number | undefined
  /** Wrong tries so far on this step. */
  wrongAttempts: number
  isLast: boolean
  onDigit(digit: number): void
  onNext(): void
}

/**
 * One riddle of the quiz.
 * @param props See StepScreenProps.
 * @returns The step screen.
 */
export function StepScreen(props: StepScreenProps) {
  const { header, step, stepNumber, total, foundDigit, wrongAttempts, isLast, onDigit, onNext } = props
  return (
    <main className="screen step">
      {header}
      <p className="step-number">Étape {stepNumber} sur {total}</p>
      <h2>{step.title}</h2>
      <p className="instruction">{step.instruction}</p>
      {step.image && (
        <img className="step-image" src={`${import.meta.env.BASE_URL}images/${step.image}`} alt={`Image de l’étape : ${step.title}`} />
      )}
      {foundDigit === undefined ? (
        // Changing key on each wrong try remounts the zone, which replays the shake animation.
        <div key={wrongAttempts} className={wrongAttempts > 0 ? 'answer-zone shake' : 'answer-zone'}>
          {wrongAttempts > 0 && <p className="wrong-answer" role="alert">{wrongAnswerMessage(wrongAttempts)}</p>}
          <Keypad onDigit={onDigit} />
        </div>
      ) : (
        <div className="answer-zone">
          <p className="found" role="status">Chiffre trouvé : <b>{foundDigit}</b></p>
          <button type="button" className="seal-button" onClick={onNext}>{isLast ? 'Continuer' : 'Étape suivante'}</button>
        </div>
      )}
    </main>
  )
}
```

`src/components/AllSolvedScreen.tsx`:
```tsx
/** @file Provisional end screen listing the digits found (replaced by the padlock in sprint 5). */
import type { ReactNode } from 'react'
import type { QuizStep } from '../config/types'

/** Props of AllSolvedScreen. */
export interface AllSolvedScreenProps {
  header: ReactNode
  steps: readonly QuizStep[]
  /** Digits found, in step order. */
  foundDigits: number[]
}

/**
 * Shown once every step is solved.
 * @param props See AllSolvedScreenProps.
 * @returns The end screen.
 */
export function AllSolvedScreen({ header, steps, foundDigits }: AllSolvedScreenProps) {
  return (
    <main className="screen solved">
      {header}
      <h2>Toutes les énigmes sont résolues !</h2>
      <p>Retenez bien vos chiffres : le coffre aux bonbons vous attend.</p>
      <ul className="recap">
        {steps.map((step, i) => <li key={i}><span>{step.title}</span><b>{foundDigits[i]}</b></li>)}
      </ul>
    </main>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components`
Expected: PASS. (If the image `src` test fails because Vitest does not apply `base`, check `import.meta.env.BASE_URL` in the test — vitest reads `vite.config.ts`, so it should be `/quiz-halloween/`.)

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "feat: add home, step and all-solved screens (#4)"
```

---

### Task 7: `Game` composition and `App` wiring

**Files:**
- Create: `src/components/Game.tsx`, `src/components/Game.test.tsx`
- Modify: `src/App.tsx` (render `<Game>`), `src/App.test.tsx` (unchanged assertions must still pass)

**Interfaces:**
- Consumes: `useGameProgress` (Task 2), `GameHeader` (Task 5), the three screens (Task 6).
- Produces: `export function Game(props: { config: QuizConfig }): JSX.Element`

- [ ] **Step 1: Write the failing test**

`src/components/Game.test.tsx`:
```tsx
/** @file Integration test: a full game in memory. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Game } from './Game'
import type { QuizConfig } from '../config/types'

const config: QuizConfig = {
  title: 'Le manoir hanté', durationMinutes: 90, stepCount: 2,
  steps: [{ title: 'La crypte', instruction: 'a', solution: 4 }, { title: 'Le grenier', instruction: 'b', solution: 0 }],
  padlock: { order: [1, 2] },
}

describe('Game', () => {
  it('plays from home to the end, with a wrong answer', async () => {
    const user = userEvent.setup()
    render(<Game config={config} />)
    await user.click(screen.getByRole('button', { name: 'Commencer' }))

    expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('90:00')
    await user.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '4' }))
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 4')
    await user.click(screen.getByRole('button', { name: 'Étape suivante' }))

    expect(screen.getByRole('heading', { name: 'Le grenier' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    expect(screen.getByRole('heading', { name: 'Toutes les énigmes sont résolues !' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Toutes les étapes terminées' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game.test.tsx`
Expected: FAIL — cannot resolve `./Game`.

- [ ] **Step 3: Write minimal implementation**

`src/components/Game.tsx`:
```tsx
/** @file Picks the screen to show from the game progress. */
import type { QuizConfig } from '../config/types'
import { useGameProgress } from '../hooks/useGameProgress'
import { AllSolvedScreen } from './AllSolvedScreen'
import { GameHeader } from './GameHeader'
import { HomeScreen } from './HomeScreen'
import { StepScreen } from './StepScreen'

/** Props of Game. */
export interface GameProps { config: QuizConfig }

/**
 * The whole game for a valid quiz.
 * @param props.config Validated quiz configuration.
 * @returns The current screen.
 */
export function Game({ config }: GameProps) {
  const { state, start, answer, next } = useGameProgress(config.steps)
  if (state.status === 'home' || state.startedAt === null) {
    return <HomeScreen title={config.title} intro={config.intro} durationMinutes={config.durationMinutes} onStart={start} />
  }
  const playing = state.status === 'playing'
  const header = (
    <GameHeader startedAt={state.startedAt} durationMinutes={config.durationMinutes}
      total={config.stepCount} solved={state.foundDigits.length} current={playing ? state.stepIndex : null} />
  )
  if (!playing) return <AllSolvedScreen header={header} steps={config.steps} foundDigits={state.foundDigits} />
  return (
    <StepScreen header={header} step={config.steps[state.stepIndex]} stepNumber={state.stepIndex + 1}
      total={config.stepCount} foundDigit={state.foundDigits[state.stepIndex]} wrongAttempts={state.wrongAttempts}
      isLast={state.stepIndex === config.stepCount - 1} onDigit={answer} onNext={next} />
  )
}
```

`src/App.tsx` — replace the `return (<main>…</main>)` with `return <Game config={quiz.config} />`, add `import { Game } from './components/Game'`, and update the `@file` line to: `/** @file Root component: shows the game, or the config errors if quiz.yaml is invalid. */` (unchanged wording, still accurate).

- [ ] **Step 4: Run all unit tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS; `App.test.tsx` still finds the `Le manoir hanté` heading (now on the home screen).

- [ ] **Step 5: Commit**

```bash
git add src/components/Game.tsx src/components/Game.test.tsx src/App.tsx
git commit -m "feat: wire the step-by-step game into the app (#4)"
```

---

### Task 8: End-to-end — full game, time up, offline fonts

**Files:**
- Create: `e2e/game.spec.ts`
- Modify: `e2e/home.spec.ts` (add font check)

- [ ] **Step 1: Write the e2e tests**

`e2e/game.spec.ts`:
```ts
/** @file Critical paths of a game on a tablet: full run with a mistake, and time running out. */
import { test, expect } from '@playwright/test'

// Solutions of the sample quiz.yaml, in step order.
const SOLUTIONS = [4, 7, 2, 9, 0, 5]

test('a group plays every step, with one wrong answer', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Commencer' }).click()

  await expect(page.getByRole('heading', { name: 'La crypte' })).toBeVisible()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()

  for (const [i, digit] of SOLUTIONS.entries()) {
    await expect(page.getByText(`Étape ${i + 1} sur 6`)).toBeVisible()
    await page.getByRole('button', { name: String(digit), exact: true }).click()
    await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
    await page.getByRole('button', { name: i === SOLUTIONS.length - 1 ? 'Continuer' : 'Étape suivante' }).click()
  }

  await expect(page.getByRole('heading', { name: 'Toutes les énigmes sont résolues !' })).toBeVisible()
})

test('the clock goes red and negative once time is up, and the game goes on', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await page.getByRole('button', { name: 'Commencer' }).click()

  const clock = page.getByRole('timer')
  await expect(clock).toHaveText('90:00')
  await page.clock.fastForward('91:00')
  await expect(clock).toHaveText('-01:00')
  await expect(clock).toHaveClass(/clock--overtime/)

  await page.getByRole('button', { name: '4', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 4')
})
```

`e2e/home.spec.ts` — add after the existing test:
```ts
test('bundled fonts are loaded (no Google Fonts needed offline)', async ({ page }) => {
  await page.goto('./')
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''))
  })
  expect(loaded).toEqual(expect.arrayContaining(['Alegreya', 'IM Fell English SC']))
})
```
(If the family names differ, read the `font-family` in `node_modules/@fontsource/*/latin-*.css` and use those exact names — e.g. fontsource may name it `IM Fell English SC`.)

- [ ] **Step 2: Run e2e**

Run: `npm run test:e2e`
Expected: PASS (4 tests). The home screen's H1 must be loaded before the check, which it is since the title uses IM Fell and the body uses Alegreya.

- [ ] **Step 3: Visual check in the browser (tablet 810×1080 and phone 390×844)**

With Playwright MCP on `npm run preview`: screenshot home, step 1, a wrong answer, a found digit, the end screen; check the keypad fits without scrolling at 810×1080, nothing overflows horizontally at 390 px, and 0 is not mistaken for o.

- [ ] **Step 4: Commit**

```bash
git add e2e
git commit -m "test: add e2e for full game, time up and offline fonts (#4)"
```

---

### Task 9: Docs, review, PR

**Files:**
- Modify: `CLAUDE.md` (structure: `src/styles/`, fonts via @fontsource, `woff2` in precache), `README.md` if it describes screens, `ETAT.md`

- [ ] **Step 1: Update docs** — add to CLAUDE.md « Pièges connus »: fonts are `@fontsource` Latin subsets imported in `main.tsx` and precached via `woff2` in `globPatterns`; digits must use `lining-nums`; `Game.tsx` is the only place that composes screens.
- [ ] **Step 2: Full verification** — `npm run typecheck && npm run lint && npm run test:run && npm run build && npm run test:e2e`; paste outputs.
- [ ] **Step 3: Review** — agent `relecteur-code`; address findings.
- [ ] **Step 4: ETAT.md** — tick steps, next action = merge by Romain; commit `docs: update sprint 4 status (#4)`.
- [ ] **Step 5: PR** — `git push -u origin feat/steps-and-countdown`, `gh pr create` in French with screenshots, `Closes #4`. Merge belongs to Romain.
