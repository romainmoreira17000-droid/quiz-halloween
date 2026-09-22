# Sprint 6 — Sauvegarde et remise à zéro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the game progress in the tablet's localStorage (resume after a reload) and let an animator restart the game with a 3-second press on a discreet icon, then a confirmation.

**Architecture:** Pure pieces in `src/game/` (quiz fingerprint, check of a state read back from storage, `reset` action of the reducer), storage I/O in `src/services/savedGame.ts` (never throws), `useGameProgress` loads at mount and saves on each change. UI: `ResetButton` (long press + filling ring), `ResetDialog` (confirmation), `ResetControl` (glues both), rendered by `Game` on every screen.

**Tech Stack:** Vite 8, React 19, TypeScript, Vitest 5 + Testing Library + jsdom, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-21-quiz-halloween-design.md` (section « Sauvegarde et remise à zéro (sprint 6) »). Issue #6.

## Global Constraints

- 200 lines max per file; `@file` header + JSDoc on every export; comments in English explain *why*.
- Code and commits in English (Conventional Commits, `(#6)`); on-screen text in French.
- No `any`. Explicit types on props and service returns.
- Components never touch `localStorage` directly: only `src/services/savedGame.ts` does.
- Storage failures never throw and never show an error: the game falls back to the home screen.
- Touch targets ≥ 88 px for the children's controls; the reset icon is deliberately small (64 px) and pale.
- Animations: base style = final state, keyframes = starting state (`both`), so `prefers-reduced-motion` shows the end state.
- Every commit ends with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

### Task 1: Quiz fingerprint

**Files:**
- Create: `src/game/fingerprint.ts`
- Test: `src/game/fingerprint.test.ts`

**Interfaces:**
- Produces: `quizFingerprint(config: QuizConfig): string` — 8 lowercase hex chars.

- [ ] **Step 1: Write the failing test**

```ts
/** @file Tests for the quiz fingerprint. */
import type { QuizConfig } from '../config/types'
import { quizFingerprint } from './fingerprint'

const config: QuizConfig = {
  title: 'Le manoir', durationMinutes: 90, stepCount: 1,
  steps: [{ title: 'A', instruction: 'a', solution: 4 }], padlock: { order: [1] },
}

describe('quizFingerprint', () => {
  it('is 8 hexadecimal characters', () => {
    expect(quizFingerprint(config)).toMatch(/^[0-9a-f]{8}$/)
  })
  it('is the same for the same quiz', () => {
    expect(quizFingerprint(structuredClone(config))).toBe(quizFingerprint(config))
  })
  it('changes when a solution changes', () => {
    const changed = { ...config, steps: [{ ...config.steps[0], solution: 5 }] }
    expect(quizFingerprint(changed)).not.toBe(quizFingerprint(config))
  })
})
```

- [ ] **Step 2: Run it, expect FAIL** — `npx vitest run src/game/fingerprint.test.ts` (module not found).

- [ ] **Step 3: Implement**

```ts
/** @file Short fingerprint of a quiz, so a saved game is only resumed on the quiz it was played on. */
import type { QuizConfig } from '../config/types'

/**
 * Hashes the validated config (FNV-1a, 32 bits). Built from the config, not the YAML text,
 * so editing a comment in quiz.yaml does not throw away a game in progress.
 * @param config Validated quiz.
 * @returns 8 lowercase hexadecimal characters.
 */
export function quizFingerprint(config: QuizConfig): string {
  const text = JSON.stringify(config)
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
```

- [ ] **Step 4: Run it, expect PASS.**
- [ ] **Step 5: Commit** — `git add src/game/fingerprint*` ; `git commit -m "feat: add quiz fingerprint (#6)"`

---

### Task 2: Check a state read back from storage

**Files:**
- Create: `src/game/restore.ts`
- Test: `src/game/restore.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameStatus` from `src/game/progress.ts`.
- Produces: `restoreGameState(value: unknown, stepCount: number): GameState | null` — `null` for anything unusable and for the home status (nothing to resume); `wrongAttempts` always reset to 0.

- [ ] **Step 1: Write the failing test**

```ts
/** @file Tests for the check of a saved game state. */
import { restoreGameState } from './restore'

// Two-step quiz in every case.
const playing = { status: 'playing', stepIndex: 1, foundDigits: [4], startedAt: 1000, finishedAt: null, wrongAttempts: 3 }
const padlock = { status: 'padlock', stepIndex: 1, foundDigits: [4, 0], startedAt: 1000, finishedAt: null, wrongAttempts: 0 }
const won = { ...padlock, status: 'won', finishedAt: 5000 }

describe('restoreGameState', () => {
  it('restores a game in progress, without the wrong tries', () => {
    expect(restoreGameState(playing, 2)).toEqual({ ...playing, wrongAttempts: 0 })
  })
  it('restores a solved step waiting for "next"', () => {
    const solved = { ...playing, foundDigits: [4, 0] }
    expect(restoreGameState(solved, 2)).toEqual({ ...solved, wrongAttempts: 0 })
  })
  it('restores the padlock and the victory', () => {
    expect(restoreGameState(padlock, 2)).toEqual(padlock)
    expect(restoreGameState(won, 2)).toEqual(won)
  })
  it.each([
    ['nothing', null],
    ['text', 'playing'],
    ['home (nothing to resume)', { ...playing, status: 'home' }],
    ['unknown status', { ...playing, status: 'lost' }],
    ['step out of range', { ...playing, stepIndex: 2 }],
    ['negative step', { ...playing, stepIndex: -1 }],
    ['decimal step', { ...playing, stepIndex: 0.5 }],
    ['digit above 9', { ...playing, foundDigits: [12] }],
    ['digits not a list', { ...playing, foundDigits: '4' }],
    ['digits missing for the step', { ...playing, foundDigits: [] }],
    ['no start time', { ...playing, startedAt: null }],
    ['start time as text', { ...playing, startedAt: '1000' }],
    ['playing with an end time', { ...playing, finishedAt: 5000 }],
    ['padlock before all steps', { ...padlock, foundDigits: [4] }],
    ['victory without end time', { ...won, finishedAt: null }],
  ])('rejects %s', (_label, value) => {
    expect(restoreGameState(value, 2)).toBeNull()
  })
})
```

- [ ] **Step 2: Run it, expect FAIL** — `npx vitest run src/game/restore.test.ts`.

- [ ] **Step 3: Implement**

```ts
/** @file Checks a game state read back from storage, so a damaged or tampered save can never break the game. */
import type { GameState, GameStatus } from './progress'

const RESUMABLE: readonly string[] = ['playing', 'padlock', 'won']

const isTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isDigit = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9

/**
 * Turns a value read from storage back into a game state, if it is a coherent one.
 * @param value Parsed JSON (anything).
 * @param stepCount Number of steps of the current quiz.
 * @returns The state (wrong tries reset to 0), or null when there is nothing usable to resume.
 */
export function restoreGameState(value: unknown, stepCount: number): GameState | null {
  if (typeof value !== 'object' || value === null) return null
  const { status, stepIndex, foundDigits, startedAt, finishedAt } = value as Record<string, unknown>
  if (typeof status !== 'string' || !RESUMABLE.includes(status)) return null
  if (typeof stepIndex !== 'number' || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= stepCount) return null
  if (!Array.isArray(foundDigits) || !foundDigits.every(isDigit) || !isTime(startedAt)) return null
  const digits = foundDigits.filter(isDigit)
  const allSolved = stepIndex === stepCount - 1 && digits.length === stepCount
  const coherent =
    status === 'playing' ? finishedAt === null && (digits.length === stepIndex || digits.length === stepIndex + 1)
    : status === 'padlock' ? finishedAt === null && allSolved
    : isTime(finishedAt) && allSolved
  if (!coherent) return null
  return {
    status: status as GameStatus, stepIndex, foundDigits: digits, startedAt,
    finishedAt: isTime(finishedAt) ? finishedAt : null, wrongAttempts: 0,
  }
}
```

- [ ] **Step 4: Run it, expect PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat: check saved game state before resuming (#6)"`

---

### Task 3: Storage service

**Files:**
- Create: `src/services/savedGame.ts`
- Test: `src/services/savedGame.test.ts`
- Modify: `src/test/setup.ts` (clear localStorage after each test, so tests never leak a saved game into each other)

**Interfaces:**
- Consumes: `restoreGameState` (Task 2), `GameState`.
- Produces: `STORAGE_KEY = 'quiz-halloween:progress'`, `loadGame(fingerprint: string, stepCount: number): GameState | null`, `saveGame(fingerprint: string, state: GameState): void`, `clearGame(): void`. None of them throws.

- [ ] **Step 1: Add to `src/test/setup.ts`** (update its `@file` line to "adds jest-dom matchers and clears localStorage between tests"):

```ts
afterEach(() => localStorage.clear())
```

- [ ] **Step 2: Write the failing test**

```ts
/** @file Tests for the saved game in localStorage. */
import type { GameState } from '../game/progress'
import { clearGame, loadGame, saveGame, STORAGE_KEY } from './savedGame'

const state: GameState = {
  status: 'playing', stepIndex: 0, foundDigits: [4], startedAt: 1000, finishedAt: null, wrongAttempts: 0,
}

describe('saved game', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reads back what was saved for the same quiz', () => {
    saveGame('abcd1234', state)
    expect(loadGame('abcd1234', 2)).toEqual(state)
  })
  it('ignores a game saved for another quiz', () => {
    saveGame('abcd1234', state)
    expect(loadGame('ffff0000', 2)).toBeNull()
  })
  it('returns null when nothing is saved, or after clearing', () => {
    expect(loadGame('abcd1234', 2)).toBeNull()
    saveGame('abcd1234', state)
    clearGame()
    expect(loadGame('abcd1234', 2)).toBeNull()
  })
  it('ignores a damaged save', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadGame('abcd1234', 2)).toBeNull()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint: 'abcd1234', state: { status: 'won' } }))
    expect(loadGame('abcd1234', 2)).toBeNull()
  })
  it('never throws when the browser refuses storage', () => {
    const refuse = () => { throw new Error('denied') }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(refuse)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(refuse)
    expect(loadGame('abcd1234', 2)).toBeNull()
    expect(() => saveGame('abcd1234', state)).not.toThrow()
    expect(() => clearGame()).not.toThrow()
  })
})
```

- [ ] **Step 3: Run it, expect FAIL** — `npx vitest run src/services/savedGame.test.ts`.

- [ ] **Step 4: Implement**

```ts
/** @file Keeps the game progress in the tablet's localStorage, so a reload in the middle of a game loses nothing. */
import type { GameState } from '../game/progress'
import { restoreGameState } from '../game/restore'

/** localStorage key of the saved game. */
export const STORAGE_KEY = 'quiz-halloween:progress'

/** What is written: the state, tagged with the quiz it belongs to. */
interface SavedGame { fingerprint: string; state: GameState }

// Every access is wrapped: private browsing or a full storage must never break the game,
// it only loses the resume after a reload.

/**
 * Reads the saved game of this quiz.
 * @param fingerprint Fingerprint of the current quiz (see quizFingerprint).
 * @param stepCount Number of steps of the current quiz.
 * @returns The state to resume, or null (nothing saved, other quiz, damaged save, storage refused).
 */
export function loadGame(fingerprint: string, stepCount: number): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const saved: unknown = JSON.parse(raw)
    if (typeof saved !== 'object' || saved === null) return null
    const { fingerprint: savedFor, state } = saved as Record<string, unknown>
    return savedFor === fingerprint ? restoreGameState(state, stepCount) : null
  } catch {
    return null
  }
}

/**
 * Saves the game of this quiz.
 * @param fingerprint Fingerprint of the current quiz.
 * @param state State to save.
 */
export function saveGame(fingerprint: string, state: GameState): void {
  const saved: SavedGame = { fingerprint, state }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)) } catch { /* see above */ }
}

/** Deletes the saved game. */
export function clearGame(): void {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* see above */ }
}
```

- [ ] **Step 5: Run it, expect PASS; run `npm run test:run` (setup change), expect all green.**
- [ ] **Step 6: Commit** — `git commit -m "feat: save game progress in localStorage (#6)"`

---

### Task 4: `reset` action and persistence in `useGameProgress`

**Files:**
- Modify: `src/game/progress.ts` (action `reset`), `src/game/progress.test.ts`
- Modify: `src/hooks/useGameProgress.ts` (takes the config, loads, saves, `reset()`), `src/hooks/useGameProgress.test.ts`
- Modify: `src/components/Game.tsx:21` (call `useGameProgress(config)`)

**Interfaces:**
- Consumes: `quizFingerprint` (Task 1), `loadGame`/`saveGame`/`clearGame` (Task 3).
- Produces: `GameAction` gains `{ type: 'reset' }`; `useGameProgress(config: QuizConfig): GameProgress`; `GameProgress.reset(): void`.

- [ ] **Step 1: Failing reducer test** — add to `progress.test.ts`:

```ts
  it('goes back to the home screen from anywhere on reset', () => {
    expect(reduce(atPadlock, { type: 'reset' })).toEqual(initialGameState)
    expect(reduce(playing, { type: 'reset' })).toEqual(initialGameState)
  })
```

- [ ] **Step 2: Run, expect FAIL; implement** — in `progress.ts`, add `| { type: 'reset' }` to `GameAction`, and in the switch:

```ts
      case 'reset':
        return initialGameState
```

Update the `@file` line: "Pure, so it can be saved and restored." Run, expect PASS.

- [ ] **Step 3: Failing hook tests** — rewrite `useGameProgress.test.ts`:

```ts
/** @file Tests for the game progress hook, saved in localStorage. */
import { act, renderHook } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { STORAGE_KEY } from '../services/savedGame'
import { useGameProgress } from './useGameProgress'

const config: QuizConfig = {
  title: 'T', durationMinutes: 90, stepCount: 1,
  steps: [{ title: 'A', instruction: 'a', solution: 3 }], padlock: { order: [1] },
}

describe('useGameProgress', () => {
  afterEach(() => vi.useRealTimers())

  it('starts with the current time, plays a step and opens the padlock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T14:00:00Z'))
    const { result } = renderHook(() => useGameProgress(config))
    act(() => result.current.start())
    expect(result.current.state.startedAt).toBe(Date.parse('2026-10-31T14:00:00Z'))
    act(() => result.current.answer(3))
    act(() => result.current.next())
    expect(result.current.state.status).toBe('padlock')
    let opened = true
    act(() => { opened = result.current.unlock([1]) })
    expect(opened).toBe(false)
    vi.setSystemTime(new Date('2026-10-31T14:42:15Z'))
    act(() => { opened = result.current.unlock([3]) })
    expect(opened).toBe(true)
    expect(result.current.state).toMatchObject({ status: 'won', finishedAt: Date.parse('2026-10-31T14:42:15Z') })
  })

  it('resumes the saved game after a reload', () => {
    const first = renderHook(() => useGameProgress(config))
    act(() => first.result.current.start())
    act(() => first.result.current.answer(3))
    const saved = first.result.current.state
    first.unmount()
    const { result } = renderHook(() => useGameProgress(config))
    expect(result.current.state).toEqual(saved)
  })

  it('does not resume a game saved for another quiz', () => {
    const first = renderHook(() => useGameProgress(config))
    act(() => first.result.current.start())
    first.unmount()
    const changed = { ...config, steps: [{ ...config.steps[0], solution: 7 }] }
    const { result } = renderHook(() => useGameProgress(changed))
    expect(result.current.state.status).toBe('home')
  })

  it('goes back home and deletes the save on reset', () => {
    const { result } = renderHook(() => useGameProgress(config))
    act(() => result.current.start())
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    act(() => result.current.reset())
    expect(result.current.state.status).toBe('home')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
```

- [ ] **Step 4: Run, expect FAIL; implement** — `useGameProgress.ts`:

```ts
/** @file Game progress, saved in the tablet's localStorage so a reload loses nothing. */
import { useEffect, useMemo, useReducer } from 'react'
import type { QuizConfig } from '../config/types'
import { quizFingerprint } from '../game/fingerprint'
import { isPadlockCode, padlockCode } from '../game/padlock'
import { createGameReducer, initialGameState, type GameState } from '../game/progress'
import { clearGame, loadGame, saveGame } from '../services/savedGame'
```

Add to `GameProgress`:

```ts
  /** Goes back to the home screen and deletes the saved game. */
  reset(): void
```

Hook body (JSDoc `@param config Validated quiz.`):

```ts
export function useGameProgress(config: QuizConfig): GameProgress {
  const { steps, stepCount } = config
  const fingerprint = useMemo(() => quizFingerprint(config), [config])
  const code = useMemo(() => padlockCode(steps, config.padlock.order), [steps, config.padlock.order])
  const reducer = useMemo(() => createGameReducer(steps, code), [steps, code])
  const [state, dispatch] = useReducer(reducer, null, () => loadGame(fingerprint, stepCount) ?? initialGameState)
  useEffect(() => {
    // Home means "no game": nothing worth keeping, and it is how reset deletes the save.
    if (state.status === 'home') clearGame()
    else saveGame(fingerprint, state)
  }, [fingerprint, state])
  return {
    state,
    start: () => dispatch({ type: 'start', now: Date.now() }),
    answer: (digit) => dispatch({ type: 'answer', digit }),
    next: () => dispatch({ type: 'next' }),
    unlock: (entered) => { /* unchanged */ },
    reset: () => dispatch({ type: 'reset' }),
  }
}
```

In `Game.tsx`: `const { state, start, answer, next, unlock } = useGameProgress(config)`.

- [ ] **Step 5: Run `npm run test:run` and `npm run typecheck`, expect all green.**
- [ ] **Step 6: Commit** — `git commit -m "feat: resume saved game and add reset action (#6)"`

---

### Task 5: `ResetButton` (long press + ring)

**Files:**
- Create: `src/components/ResetButton.tsx`, `src/components/ResetButton.test.tsx`, `src/styles/reset.css`
- Modify: `src/main.tsx` (import `./styles/reset.css` after `victory.css`)

**Interfaces:**
- Produces: `RESET_HOLD_MS = 3000`; `ResetButton({ onLongPress }: { onLongPress(): void })`, accessible name « Recommencer la partie (appui long) »; class `reset-button--holding` while held.

- [ ] **Step 1: Failing test**

```tsx
/** @file Tests for the long-press reset button. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { RESET_HOLD_MS, ResetButton } from './ResetButton'

const NAME = 'Recommencer la partie (appui long)'

describe('ResetButton', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fires only after a 3-second press, and shows the ring while held', () => {
    const onLongPress = vi.fn()
    render(<ResetButton onLongPress={onLongPress} />)
    const button = screen.getByRole('button', { name: NAME })
    fireEvent.pointerDown(button)
    expect(button).toHaveClass('reset-button--holding')
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS - 1))
    expect(onLongPress).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onLongPress).toHaveBeenCalledOnce()
    expect(button).not.toHaveClass('reset-button--holding')
  })
  it('does nothing when released too early', () => {
    const onLongPress = vi.fn()
    render(<ResetButton onLongPress={onLongPress} />)
    const button = screen.getByRole('button', { name: NAME })
    fireEvent.pointerDown(button)
    act(() => vi.advanceTimersByTime(2000))
    fireEvent.pointerUp(button)
    expect(button).not.toHaveClass('reset-button--holding')
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
    expect(onLongPress).not.toHaveBeenCalled()
  })
  it('works with a key held down', () => {
    const onLongPress = vi.fn()
    render(<ResetButton onLongPress={onLongPress} />)
    fireEvent.keyDown(screen.getByRole('button', { name: NAME }), { key: 'Enter' })
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
    expect(onLongPress).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `ResetButton.tsx`**

```tsx
/** @file Discreet reset icon: only a 3-second press triggers it, so children do not restart the game by accident. */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

/** How long the icon must be held. Keep in sync with the ring animation in reset.css. */
export const RESET_HOLD_MS = 3000

/** Props of ResetButton. */
export interface ResetButtonProps {
  /** Called once the icon has been held for RESET_HOLD_MS. */
  onLongPress(): void
}

const isPressKey = (event: KeyboardEvent) => event.key === 'Enter' || event.key === ' '

/**
 * Small pale icon, bottom left; a ring fills up while it is held.
 * @param props See ResetButtonProps.
 * @returns The reset button.
 */
export function ResetButton({ onLongPress }: ResetButtonProps) {
  const timer = useRef<number | null>(null)
  const [holding, setHolding] = useState(false)
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])

  const begin = () => {
    if (timer.current !== null) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      setHolding(false)
      onLongPress()
    }, RESET_HOLD_MS)
  }
  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }

  return (
    <button type="button" className={holding ? 'reset-button reset-button--holding' : 'reset-button'}
      aria-label="Recommencer la partie (appui long)"
      onPointerDown={begin} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onKeyDown={(event) => { if (isPressKey(event) && !event.repeat) begin() }}
      onKeyUp={(event) => { if (isPressKey(event)) stop() }}
      // A long press on a tablet would otherwise open the copy/share menu.
      onContextMenu={(event) => event.preventDefault()}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="reset-ring" cx="32" cy="32" r="29" pathLength={100} />
        <path d="M20 32a12 12 0 1 0 3.5-8.5" />
        <path d="M23.5 16v7.5H16" />
      </svg>
    </button>
  )
}
```

- [ ] **Step 4: Create `src/styles/reset.css`**

```css
/**
 * @file Reset: pale icon bottom left with a ring filling up while held, and the confirmation window.
 * The icon stays small and faint on purpose: it is for the animator, not for the children.
 */
.reset-button {
  position: fixed; left: 12px; bottom: 12px; z-index: 20;
  width: 64px; height: 64px;
  color: var(--wax); opacity: .3;
  /* No scroll, selection or callout menu during the long press. */
  touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
}
.reset-button svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.reset-ring {
  stroke: var(--amber); stroke-width: 4;
  stroke-dasharray: 100; stroke-dashoffset: 100;
  transform: rotate(-90deg); transform-box: fill-box; transform-origin: center;
}
.reset-button--holding { opacity: 1; }
/* Base = full ring (final state); 3s = RESET_HOLD_MS in ResetButton.tsx. */
.reset-button--holding .reset-ring { stroke-dashoffset: 0; animation: reset-fill 3s linear both; }
@keyframes reset-fill { from { stroke-dashoffset: 100; } }
```

Add `import './styles/reset.css'` in `main.tsx` after `victory.css`.

- [ ] **Step 5: Run, expect PASS.**
- [ ] **Step 6: Commit** — `git commit -m "feat: add long-press reset button (#6)"`

---

### Task 6: `ResetDialog` and `ResetControl`

**Files:**
- Create: `src/components/ResetDialog.tsx`, `src/components/ResetDialog.test.tsx`
- Create: `src/components/ResetControl.tsx`, `src/components/ResetControl.test.tsx`
- Modify: `src/styles/reset.css` (append the dialog styles)

**Interfaces:**
- Consumes: `ResetButton`, `RESET_HOLD_MS` (Task 5).
- Produces: `ResetDialog({ onCancel, onConfirm })` — role `dialog` named « Recommencer la partie ? », buttons « Annuler » (focused) and « Recommencer »; `ResetControl({ onReset }: { onReset(): void })`.

- [ ] **Step 1: Failing tests**

`ResetDialog.test.tsx`:

```tsx
/** @file Tests for the reset confirmation window. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetDialog } from './ResetDialog'

describe('ResetDialog', () => {
  it('asks for confirmation, with "Annuler" focused', async () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(<ResetDialog onCancel={onCancel} onConfirm={onConfirm} />)
    expect(screen.getByRole('dialog', { name: 'Recommencer la partie ?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Recommencer' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
```

`ResetControl.test.tsx`:

```tsx
/** @file Tests for the reset icon + confirmation. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { RESET_HOLD_MS } from './ResetButton'
import { ResetControl } from './ResetControl'

function holdResetIcon() {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Recommencer la partie (appui long)' }))
  act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
}

describe('ResetControl', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('asks after a long press, and cancelling keeps the game', () => {
    const onReset = vi.fn()
    render(<ResetControl onReset={onReset} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    holdResetIcon()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onReset).not.toHaveBeenCalled()
  })
  it('resets once confirmed', () => {
    const onReset = vi.fn()
    render(<ResetControl onReset={onReset} />)
    holdResetIcon()
    fireEvent.click(screen.getByRole('button', { name: 'Recommencer' }))
    expect(onReset).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run both, expect FAIL.**

- [ ] **Step 3: Implement `ResetDialog.tsx`**

```tsx
/** @file Confirmation window before restarting the game. */
import { useEffect, useRef } from 'react'

/** Props of ResetDialog. */
export interface ResetDialogProps {
  onCancel(): void
  onConfirm(): void
}

/**
 * In-game window (not window.confirm, which looks foreign and tiny on a tablet).
 * "Annuler" gets the focus: the safe choice is the default one.
 * @param props See ResetDialogProps.
 * @returns The confirmation window over the current screen.
 */
export function ResetDialog({ onCancel, onConfirm }: ResetDialogProps) {
  const cancel = useRef<HTMLButtonElement>(null)
  useEffect(() => { cancel.current?.focus() }, [])
  return (
    <div className="reset-overlay">
      <div className="reset-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title">
        <h2 id="reset-title">Recommencer la partie ?</h2>
        <p>La progression du groupe sera effacée.</p>
        <div className="reset-actions">
          <button type="button" className="ghost-button" ref={cancel} onClick={onCancel}>Annuler</button>
          <button type="button" className="seal-button" onClick={onConfirm}>Recommencer</button>
        </div>
      </div>
    </div>
  )
}
```

`ResetControl.tsx`:

```tsx
/** @file Reset icon shown on every screen, with its confirmation window. */
import { useState } from 'react'
import { ResetButton } from './ResetButton'
import { ResetDialog } from './ResetDialog'

/** Props of ResetControl. */
export interface ResetControlProps {
  /** Restarts the game (called only after the confirmation). */
  onReset(): void
}

/**
 * Long press on the icon, then confirmation.
 * @param props See ResetControlProps.
 * @returns The icon, and the window while asking.
 */
export function ResetControl({ onReset }: ResetControlProps) {
  const [asking, setAsking] = useState(false)
  return (
    <>
      <ResetButton onLongPress={() => setAsking(true)} />
      {asking && (
        <ResetDialog onCancel={() => setAsking(false)} onConfirm={() => { setAsking(false); onReset() }} />
      )}
    </>
  )
}
```

- [ ] **Step 4: Append to `reset.css`**

```css
/* Confirmation window */
.reset-overlay {
  position: fixed; inset: 0; z-index: 30;
  display: grid; place-items: center; padding: 16px;
  background: rgb(10 6 4 / .82);
}
.reset-dialog {
  width: 100%; max-width: 600px;
  display: grid; gap: 28px; padding: 40px 32px;
  border-radius: 24px; background: var(--wall);
  box-shadow: 0 20px 60px rgb(0 0 0 / .6);
  text-align: center; font-size: 28px;
}
.reset-dialog h2 { font-size: 56px; }
.reset-actions { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
.reset-actions .seal-button { padding: 0 40px; }
.ghost-button {
  min-height: 104px; padding: 0 40px;
  border: 3px solid var(--bronze); border-radius: 56px 60px 54px 58px;
  font-family: var(--title-font); font-size: 48px;
}
@media (max-width: 600px) {
  .reset-dialog { padding: 28px 16px; font-size: 22px; }
  .reset-dialog h2 { font-size: 40px; }
}
```

- [ ] **Step 5: Run, expect PASS.**
- [ ] **Step 6: Commit** — `git commit -m "feat: add reset confirmation window (#6)"`

---

### Task 7: Wire the reset into `Game`

**Files:**
- Modify: `src/components/Game.tsx`, `src/components/Game.test.tsx`

**Interfaces:**
- Consumes: `useGameProgress(config)` with `reset` (Task 4), `ResetControl` (Task 6).

- [ ] **Step 1: Failing test** — add to `Game.test.tsx` (imports `act`, `fireEvent` from Testing Library and `RESET_HOLD_MS` from `./ResetButton`):

```tsx
  it('shows the reset icon on every screen and restarts after a long press + confirmation', () => {
    vi.useFakeTimers()
    render(<Game config={config} />)
    const icon = () => screen.getByRole('button', { name: 'Recommencer la partie (appui long)' })
    expect(icon()).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Commencer' }))
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    fireEvent.pointerDown(icon())
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
    fireEvent.click(screen.getByRole('button', { name: 'Recommencer' }))
    expect(screen.getByRole('button', { name: 'Commencer' })).toBeInTheDocument()
    vi.useRealTimers()
  })
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement** — in `Game.tsx`, move the current body into a non-exported `currentScreen(config: QuizConfig, progress: GameProgress): ReactNode` (same code, reading `progress.state`, `progress.start`…), and make `Game`:

```tsx
export function Game({ config }: GameProps) {
  const progress = useGameProgress(config)
  return (
    <>
      {currentScreen(config, progress)}
      <ResetControl onReset={progress.reset} />
    </>
  )
}
```

Imports: `type ReactNode` from 'react', `type GameProgress` from '../hooks/useGameProgress', `ResetControl`. Update `@file`: "Picks the screen to show from the game progress, with the reset icon on top."

- [ ] **Step 4: Run `npm run test:run` and `npm run typecheck`, expect all green.**
- [ ] **Step 5: Commit** — `git commit -m "feat: show reset control on every screen (#6)"`

---

### Task 8: e2e + visual check

**Files:**
- Create: `e2e/save-and-reset.spec.ts`

- [ ] **Step 1: Write the tests**

```ts
/** @file Critical paths of sprint 6: resume after a reload, and the animator's reset. */
import { test, expect } from '@playwright/test'

test('the game resumes at the same step after a reload', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await page.getByRole('button', { name: '4', exact: true }).click()
  await page.getByRole('button', { name: 'Étape suivante' }).click()
  await expect(page.getByText('Étape 2 sur 6')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Étape 2 sur 6')).toBeVisible()
  await expect(page.getByRole('timer')).toBeVisible()
})

test('a 3-second press on the reset icon, then confirming, restarts the game', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await page.getByRole('button', { name: '4', exact: true }).click()

  await page.getByRole('button', { name: 'Recommencer la partie (appui long)' }).hover()
  await page.mouse.down()
  await page.clock.runFor(3000)
  await page.mouse.up()
  const dialog = page.getByRole('dialog', { name: 'Recommencer la partie ?' })
  await dialog.getByRole('button', { name: 'Recommencer', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Commencer' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Commencer' })).toBeVisible()
})
```

- [ ] **Step 2: Stop any `vite preview` on port 4173, then `npm run test:e2e`, expect 6 passed.**
- [ ] **Step 3: Visual check with Playwright MCP** (build + `npm run preview`): tablet 810×1080 and phone 360×740 — icon bottom left, pale, not over the keypad or the "Ouvrir" button; ring while held; dialog readable; the icon over the victory animation. Screenshots in the scratchpad, never committed. Fix CSS if needed.
- [ ] **Step 4: Commit** — `git commit -m "test: e2e for resume and reset (#6)"`

---

### Task 9: Docs, full verification, review, PR

**Files:**
- Modify: `CLAUDE.md` (structure: `src/services/` gets `savedGame`; `src/game/` gets `fingerprint`, `restore`; stack line « La progression est gardée dans le localStorage » without "(sprint 6)"; pitfalls: save key `quiz-halloween:progress`, fingerprint on the validated config, `setup.ts` clears localStorage, ring duration = `RESET_HOLD_MS`)
- Modify: `README.md` (how an animator restarts: hold the icon bottom left for 3 s, then « Recommencer »)
- Modify: `ETAT.md`

- [ ] **Step 1: Update docs; commit** `docs: document save and reset (#6)`.
- [ ] **Step 2: Full verification, show outputs** — `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`; check every file stays ≤ 200 lines.
- [ ] **Step 3: `relecteur-code` agent (Sonnet)**, fix what matters.
- [ ] **Step 4: Push, open the PR** (French description, `Closes #6`), update `ETAT.md` with the PR number.
