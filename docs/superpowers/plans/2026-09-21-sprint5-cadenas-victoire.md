# Sprint 5 — Cadenas et victoire : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Once every riddle is solved, the group turns N dials to the right code, which opens the padlock of the haunted restaurant's room (door animation + synthesised sound + victory message and time taken).

**Architecture:** Pure logic in `src/game/` (expected code, dial arithmetic, duration format, wrong-code messages); the game reducer gains `padlock` and `won` statuses, an `unlock` action and a `finishedAt` timestamp that freezes the clock. New screens `PadlockScreen` (with `Dial`) and `VictoryScreen` (with the CSS-only `HauntedDoor`). Sound is synthesised with Web Audio in `src/services/sound.ts`, started inside the "Ouvrir" tap handler (tablets only allow sound started by a gesture).

**Tech Stack:** Vite 8, React 19, TypeScript, Vitest 5 + Testing Library + jsdom, Playwright (tablet 810×1080).

**Spec:** `docs/superpowers/specs/2026-09-21-quiz-halloween-design.md` + decisions of issue #5 (validated in conversation on 2026-09-21).

## Global Constraints

- Story: the padlock opens **la salle du restaurant hanté** (not a candy chest).
- New optional YAML keys under `cadenas`: `titre`, `message_victoire` (non-empty text). Defaults when absent: title « Le cadenas », message « Le cadenas est ouvert ! ».
- Dials start at 0; ▲/▼ wrap 9 ↔ 0. Wrong code: shake + rotating message, no penalty, dials keep their positions.
- Right code: clock frozen (`finishedAt`), animation ≈ 5 s, then message + « Temps : 42 min 15 s » (« 1 h 05 min 03 s » past one hour).
- `prefers-reduced-motion`: final state shown at once. CSS base styles are the END state of every animation, keyframes only describe the start (`both` fill), so the global `animation: none` rule in `base.css` shows the end state.
- Sound: Web Audio only, no audio file. Must never throw (jsdom has no `AudioContext`).
- UI text in French, code/comments/commits in English, Conventional Commits with `(#5)`.
- ≤ 200 lines per file, `@file` header, JSDoc on every export, no `any`.
- Digits always `font-variant-numeric: lining-nums`. Buttons ≥ 88 px on the tablet (dial arrows are a full dial wide and ≥ 64 px tall).
- Never commit on `main` (branch `feat/padlock-victory`).

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/config/types.ts` | modify | `PadlockConfig` gets `title?`, `victoryMessage?` |
| `src/config/validatePadlock.ts` (+ test) | modify | validate `titre`, `message_victoire` |
| `quiz.yaml` | modify | restaurant story, new keys documented |
| `src/game/padlock.ts` (+ test) | create | `padlockCode`, `isPadlockCode`, `turnDial` |
| `src/game/time.ts` (+ test) | modify | `elapsedSeconds`, `formatDuration` |
| `src/game/messages.ts` (+ test) | modify | `WRONG_CODE_MESSAGES`, `wrongCodeMessage` |
| `src/game/progress.ts` (+ test) | modify | statuses `padlock`/`won`, `unlock`, `finishedAt` |
| `src/hooks/useGameProgress.ts` (+ test) | modify | `order` param, `unlock(code): boolean` |
| `src/hooks/useCountdown.ts` (+ test) | modify | `finishedAt` freezes the value |
| `src/components/GameHeader.tsx` (+ test) | modify | pass `finishedAt` |
| `src/components/Dial.tsx` (+ test) | create | one dial |
| `src/components/PadlockScreen.tsx` (+ test) | create | padlock screen |
| `src/styles/padlock.css` | create | recap, hint, dials |
| `src/services/sound.ts` (+ test) | create | `playVictorySound` |
| `src/components/HauntedDoor.tsx` (+ test) | create | decorative animation markup |
| `src/components/VictoryScreen.tsx` (+ test) | create | victory screen |
| `src/styles/victory.css` | create | animation |
| `src/components/Game.tsx` (+ test) | modify | wiring |
| `src/components/AllSolvedScreen.tsx` (+ test) | delete | replaced |
| `src/styles/screens.css` | modify | drop the provisional recap styles |
| `src/main.tsx` | modify | import the two new stylesheets |
| `e2e/game.spec.ts` | modify | full run to victory |
| `CLAUDE.md`, `README.md`, spec, `ETAT.md` | modify | docs |

---

### Task 1: YAML keys `titre` and `message_victoire`

**Files:** Modify `src/config/types.ts`, `src/config/validatePadlock.ts`, `src/config/validatePadlock.test.ts`, `quiz.yaml`, `docs/superpowers/specs/2026-09-21-quiz-halloween-design.md`

**Interfaces:** Produces `PadlockConfig { order: number[]; hint?: string; title?: string; victoryMessage?: string }`.

- [ ] **Step 1: Failing tests** — in `validatePadlock.test.ts`, replace the last test's expected message and add:

```ts
  it('reads the padlock title and victory message', () => {
    expect(run({ titre: 'La porte du restaurant', message_victoire: 'Entrez !' }).padlock)
      .toEqual({ order: [1, 2, 3, 4], title: 'La porte du restaurant', victoryMessage: 'Entrez !' })
  })
  it.each([[''], ['   '], [5]])('rejects title and victory message %j', (value) => {
    expect(run({ titre: value, message_victoire: value }).errors).toEqual([
      'cadenas : « titre » doit être un texte non vide.',
      'cadenas : « message_victoire » doit être un texte non vide.',
    ])
  })
  it('rejects a non-object padlock', () => {
    expect(run([1, 2]).errors)
      .toEqual(['« cadenas » doit contenir des paramètres : « ordre », « indice », « titre » ou « message_victoire ».'])
  })
```

- [ ] **Step 2:** `npx vitest run src/config/validatePadlock.test.ts` → FAIL (unknown keys, old message).

- [ ] **Step 3: Implement.** `types.ts`:

```ts
/** Final padlock: order in which step digits are entered (always filled, default 1..N) and optional texts. */
export interface PadlockConfig { order: number[]; hint?: string; title?: string; victoryMessage?: string }
```

`validatePadlock.ts`: import `isNonEmptyString`; `PADLOCK_KEYS = ['ordre', 'indice', 'titre', 'message_victoire'] as const`; non-object message `'« cadenas » doit contenir des paramètres : « ordre », « indice », « titre » ou « message_victoire ».'`; after the `indice` check:

```ts
  for (const key of ['titre', 'message_victoire'] as const) {
    if (raw[key] !== undefined && !isNonEmptyString(raw[key])) errors.push(`${prefix}« ${key} » doit être un texte non vide.`)
  }
```

and the return:

```ts
  return {
    order: (raw.ordre as number[] | undefined) ?? defaultOrder(stepCount),
    ...(raw.indice !== undefined && { hint: raw.indice as string }),
    ...(raw.titre !== undefined && { title: raw.titre as string }),
    ...(raw.message_victoire !== undefined && { victoryMessage: raw.message_victoire as string }),
  }
```

Update the `@file`/JSDoc wording if it mentions only order/hint.

- [ ] **Step 4:** `npx vitest run src/config` → PASS.

- [ ] **Step 5: `quiz.yaml`.** Intro: `"Des fantômes ont verrouillé la salle du restaurant hanté. Résolvez les énigmes pour trouver le code du cadenas !"`. Under `cadenas`, after `indice`, add (commented like the rest):

```yaml
  # Titre de l'écran du cadenas. Facultatif, texte non vide
  # (par défaut : « Le cadenas »).
  titre: "La porte du restaurant hanté"

  # Message affiché quand le cadenas s'ouvre. Facultatif, texte non vide
  # (par défaut : « Le cadenas est ouvert ! »).
  message_victoire: "La salle du restaurant hanté est ouverte !"
```

Also update the step 6 title comment if needed (« La porte du coffre » → « La porte de la cuisine », consigne unchanged). Run `npm run valider` → ✅.

- [ ] **Step 6: Spec.** In the YAML block of the spec add the two keys; rule 8 becomes « `cadenas.indice` : texte si présent ; `cadenas.titre` et `cadenas.message_victoire` : texte non vide si présents. » Victory line: « ouverture du cadenas puis de la porte du restaurant hanté (grincement synthétisé), fantômes et chauves-souris, message de victoire et temps mis ».

- [ ] **Step 7: Commit** `feat: add padlock title and victory message to quiz.yaml (#5)`.

---

### Task 2: Pure logic — code, dials, duration, wrong-code messages

**Files:** Create `src/game/padlock.ts`, `src/game/padlock.test.ts`; modify `src/game/time.ts`, `src/game/time.test.ts`, `src/game/messages.ts`, `src/game/messages.test.ts`

**Interfaces — Produces:**
- `padlockCode(steps: readonly QuizStep[], order: readonly number[]): number[]`
- `isPadlockCode(expected: readonly number[], entered: readonly number[]): boolean`
- `turnDial(digit: number, delta: 1 | -1): number`
- `elapsedSeconds(startedAt: number, finishedAt: number): number`
- `formatDuration(seconds: number): string`
- `WRONG_CODE_MESSAGES: readonly string[]`, `wrongCodeMessage(attempt: number): string`

- [ ] **Step 1: Failing tests.** `padlock.test.ts`:

```ts
/** @file Tests for the padlock code and dial arithmetic. */
import { isPadlockCode, padlockCode, turnDial } from './padlock'

const steps = [
  { title: 'A', instruction: 'a', solution: 4 },
  { title: 'B', instruction: 'b', solution: 7 },
  { title: 'C', instruction: 'c', solution: 0 },
]

describe('padlockCode', () => {
  it('takes the solutions in step order by default', () => {
    expect(padlockCode(steps, [1, 2, 3])).toEqual([4, 7, 0])
  })
  it('follows the configured order', () => {
    expect(padlockCode(steps, [3, 1, 2])).toEqual([0, 4, 7])
  })
})

describe('isPadlockCode', () => {
  it('accepts the same digits in the same order', () => {
    expect(isPadlockCode([0, 4, 7], [0, 4, 7])).toBe(true)
  })
  it.each([[[4, 0, 7]], [[0, 4]], [[0, 4, 7, 1]]])('rejects %j', (entered) => {
    expect(isPadlockCode([0, 4, 7], entered)).toBe(false)
  })
})

describe('turnDial', () => {
  it.each([[0, 1, 1], [8, 1, 9], [9, 1, 0], [0, -1, 9], [5, -1, 4]] as const)('%i %i → %i', (digit, delta, expected) => {
    expect(turnDial(digit, delta)).toBe(expected)
  })
})
```

Append to `time.test.ts` (import the two new functions):

```ts
describe('elapsedSeconds', () => {
  it('rounds down to whole seconds', () => {
    expect(elapsedSeconds(1_000, 2_536_999)).toBe(2535)
  })
})

describe('formatDuration', () => {
  it.each([
    [0, '0 min 00 s'], [45, '0 min 45 s'], [2535, '42 min 15 s'], [3599, '59 min 59 s'],
    [3600, '1 h 00 min 00 s'], [3903, '1 h 05 min 03 s'],
  ])('%i s → %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })
})
```

Append to `messages.test.ts` (import `WRONG_CODE_MESSAGES`, `wrongCodeMessage`):

```ts
describe('wrongCodeMessage', () => {
  it('cycles and never repeats twice in a row', () => {
    const shown = [1, 2, 3, 4].map(wrongCodeMessage)
    expect(shown.slice(0, 3)).toEqual(WRONG_CODE_MESSAGES)
    expect(shown[3]).toBe(WRONG_CODE_MESSAGES[0])
    expect(new Set(shown.slice(0, 3)).size).toBe(3)
  })
})
```

- [ ] **Step 2:** `npx vitest run src/game` → FAIL (missing exports).

- [ ] **Step 3: Implement.** `src/game/padlock.ts`:

```ts
/** @file Final padlock: expected code and dial arithmetic. */
import type { QuizStep } from '../config/types'

/**
 * Code that opens the padlock: the step solutions taken in the configured order.
 * @param steps Steps of the quiz, in play order.
 * @param order 1-based step numbers (validated `cadenas.ordre`, default 1..N).
 * @returns One digit per dial.
 * @example padlockCode(steps, [3, 1, 2]) // [solution of step 3, of step 1, of step 2]
 */
export function padlockCode(steps: readonly QuizStep[], order: readonly number[]): number[] {
  return order.map((stepNumber) => steps[stepNumber - 1].solution)
}

/**
 * @param expected Code that opens the padlock.
 * @param entered Digits shown on the dials.
 * @returns true if both have the same digits in the same order.
 */
export function isPadlockCode(expected: readonly number[], entered: readonly number[]): boolean {
  return expected.length === entered.length && expected.every((digit, i) => digit === entered[i])
}

/**
 * Turns a dial one notch, like a real combination lock (9 goes round to 0 and back).
 * @param digit Current digit (0–9).
 * @param delta +1 for ▲, -1 for ▼.
 * @returns The new digit.
 */
export function turnDial(digit: number, delta: 1 | -1): number {
  return (digit + delta + 10) % 10
}
```

`time.ts`: move `pad` to module level (`const pad = (n: number) => String(n).padStart(2, '0')`, used by `formatClock`), then add:

```ts
/**
 * Time the group took, frozen when the padlock opened.
 * @param startedAt Start timestamp in ms.
 * @param finishedAt Timestamp in ms when the right code was entered.
 * @returns Whole seconds, rounded down like the clock.
 */
export function elapsedSeconds(startedAt: number, finishedAt: number): number {
  return Math.floor((finishedAt - startedAt) / 1000)
}

/**
 * Formats a duration for the victory screen.
 * @param seconds Whole seconds (≥ 0).
 * @returns For example "42 min 15 s", or "1 h 05 min 03 s" past one hour.
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = `min ${pad(seconds % 60)} s`
  return hours > 0 ? `${hours} h ${pad(minutes)} ${rest}` : `${minutes} ${rest}`
}
```

Update the `@file` of `time.ts`: « Countdown and duration arithmetic… ».

`messages.ts`: extract a private helper and add the padlock list:

```ts
/** @returns The message for the n-th wrong try (≥ 1), cycling through the list. */
function cycle(messages: readonly string[], attempt: number): string {
  return messages[(attempt - 1) % messages.length]
}

/** Messages shown in turn after a wrong padlock code. */
export const WRONG_CODE_MESSAGES: readonly string[] = [
  'Le cadenas ne bouge pas… Essayez un autre ordre !',
  'Toujours fermé ! Quel chiffre vient en premier ?',
  'Les fantômes gardent la porte… Réessayez !',
]

/**
 * Message for the n-th wrong padlock code.
 * @param attempt Wrong codes so far (≥ 1).
 * @returns A message, cycling through the list.
 */
export function wrongCodeMessage(attempt: number): string {
  return cycle(WRONG_CODE_MESSAGES, attempt)
}
```

`wrongAnswerMessage` becomes `return cycle(WRONG_ANSWER_MESSAGES, attempt)`. `@file`: « Kind messages shown after a wrong answer or a wrong padlock code… ».

- [ ] **Step 4:** `npx vitest run src/game` → PASS.
- [ ] **Step 5: Commit** `feat: add padlock code, dial and duration helpers (#5)`.

---

### Task 3: Game state — padlock, unlock, frozen clock

**Files:** Modify `src/game/progress.ts`, `src/game/progress.test.ts`, `src/hooks/useGameProgress.ts`, `src/hooks/useGameProgress.test.ts`, `src/hooks/useCountdown.ts`, `src/hooks/useCountdown.test.ts`, `src/components/GameHeader.tsx`, `src/components/GameHeader.test.tsx`, `src/components/Game.tsx`

**Interfaces:**
- Consumes: `padlockCode`, `isPadlockCode` (Task 2).
- Produces:
  - `GameStatus = 'home' | 'playing' | 'padlock' | 'won'`
  - `GameState` gains `finishedAt: number | null`
  - `GameAction` gains `{ type: 'unlock'; code: number[]; now: number }`
  - `createGameReducer(steps: readonly QuizStep[], code: readonly number[])` (`code` = expected padlock code)
  - `useGameProgress(steps, order: readonly number[])` returns `GameProgress` with `unlock(code: number[]): boolean` (true when it opened)
  - `useCountdown(startedAt, durationMinutes, finishedAt: number | null = null)`
  - `GameHeaderProps.finishedAt?: number | null`

- [ ] **Step 1: Failing tests.** `progress.test.ts`: reducer built with `createGameReducer(steps, [0, 4])`; `initialGameState` expectation gains `finishedAt: null`; the "ends after the last step" test now expects `status: 'padlock'`. Add:

```ts
const atPadlock: GameState = { ...playing, status: 'padlock', stepIndex: 1, foundDigits: [4, 0] }

  it('counts wrong codes without other penalty', () => {
    const once = reduce(atPadlock, { type: 'unlock', code: [4, 0], now: 5000 })
    expect(once).toEqual({ ...atPadlock, wrongAttempts: 1 })
  })
  it('opens with the right code and freezes the time', () => {
    const wrong = reduce(atPadlock, { type: 'unlock', code: [4, 0], now: 5000 })
    expect(reduce(wrong, { type: 'unlock', code: [0, 4], now: 9000 }))
      .toEqual({ ...atPadlock, status: 'won', finishedAt: 9000, wrongAttempts: 0 })
  })
  it('ignores unlock outside of the padlock', () => {
    expect(reduce(playing, { type: 'unlock', code: [0, 4], now: 9000 })).toBe(playing)
    const won = reduce(atPadlock, { type: 'unlock', code: [0, 4], now: 9000 })
    expect(reduce(won, { type: 'unlock', code: [0, 4], now: 12000 })).toBe(won)
  })
```

`useGameProgress.test.ts`: call `useGameProgress(steps, [1])`, expect `'padlock'` after `next`, then:

```ts
    let opened = true
    act(() => { opened = result.current.unlock([1]) })
    expect(opened).toBe(false)
    vi.setSystemTime(new Date('2026-10-31T14:42:15Z'))
    act(() => { opened = result.current.unlock([3]) })
    expect(opened).toBe(true)
    expect(result.current.state).toMatchObject({ status: 'won', finishedAt: Date.parse('2026-10-31T14:42:15Z') })
```

`useCountdown.test.ts`:

```ts
  it('freezes once the game is finished', () => {
    const { result } = renderHook(() => useCountdown(start, 90, start + 125_000))
    expect(result.current).toBe(5275)
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(result.current).toBe(5275)
  })
```

`GameHeader.test.tsx`:

```ts
  it('shows the frozen time once finished', () => {
    const start = Date.now() - 600_000
    render(<GameHeader startedAt={start} finishedAt={start + 125_000} durationMinutes={90} total={6} solved={6} current={null} />)
    expect(screen.getByRole('timer')).toHaveTextContent('87:55')
  })
```

- [ ] **Step 2:** `npx vitest run src/game src/hooks src/components/GameHeader.test.tsx` → FAIL.

- [ ] **Step 3: Implement.** `progress.ts` (`@file`: home → playing → padlock → won):

```ts
import { isPadlockCode } from './padlock'

export type GameStatus = 'home' | 'playing' | 'padlock' | 'won'
// GameState: add
  /** Timestamp in ms when the padlock opened (freezes the clock), null before. */
  finishedAt: number | null
  /** Wrong tries on the current step, or wrong codes on the padlock (drives the message and the shake). */
  wrongAttempts: number
export type GameAction =
  | { type: 'start'; now: number } | { type: 'answer'; digit: number } | { type: 'next' }
  | { type: 'unlock'; code: number[]; now: number }
export const initialGameState: GameState = {
  status: 'home', stepIndex: 0, foundDigits: [], startedAt: null, finishedAt: null, wrongAttempts: 0,
}
```

`createGameReducer(steps: readonly QuizStep[], code: readonly number[])` (JSDoc `@param code Code that opens the padlock (see padlockCode).`); in `next`, `status: 'padlock'` instead of `'solved'`; new case:

```ts
      case 'unlock':
        if (state.status !== 'padlock') return state
        return isPadlockCode(code, action.code)
          ? { ...state, status: 'won', finishedAt: action.now, wrongAttempts: 0 }
          : { ...state, wrongAttempts: state.wrongAttempts + 1 }
```

`useGameProgress.ts`:

```ts
import { isPadlockCode, padlockCode } from '../game/padlock'
  /** Tries a padlock code; returns true when it opens (so the caller can play the sound in the tap handler). */
  unlock(code: number[]): boolean

/**
 * @param steps Steps of the quiz, in play order.
 * @param order Padlock order (1-based step numbers).
 */
export function useGameProgress(steps: readonly QuizStep[], order: readonly number[]): GameProgress {
  const code = useMemo(() => padlockCode(steps, order), [steps, order])
  const reducer = useMemo(() => createGameReducer(steps, code), [steps, code])
  ...
    unlock: (entered) => {
      dispatch({ type: 'unlock', code: entered, now: Date.now() })
      return isPadlockCode(code, entered)
    },
```

`useCountdown.ts`: third param `finishedAt: number | null = null` (JSDoc « Timestamp when the padlock opened: the value stops there. »). Effect: `if (startedAt === null || finishedAt !== null) return`, deps `[startedAt, finishedAt]`. Before the live return: `if (finishedAt !== null) return remainingSeconds(startedAt, finishedAt, durationMinutes)`.

`GameHeader.tsx`: `finishedAt?: number | null` in props (doc « Set once the padlock opened: freezes the clock. »), passed to `useCountdown(startedAt, durationMinutes, finishedAt ?? null)`.

`Game.tsx`: `useGameProgress(config.steps, config.padlock.order)` (everything else unchanged for now: non-playing statuses still show `AllSolvedScreen`).

- [ ] **Step 4:** `npm run test:run` → all PASS (Game.test still ends on the provisional screen). `npm run typecheck` → OK.
- [ ] **Step 5: Commit** `feat: add padlock and won states with a frozen clock (#5)`.

---

### Task 4: Dial and PadlockScreen

**Files:** Create `src/components/Dial.tsx`, `Dial.test.tsx`, `PadlockScreen.tsx`, `PadlockScreen.test.tsx`, `src/styles/padlock.css`; modify `src/main.tsx`

**Interfaces:**
- Consumes: `turnDial`, `wrongCodeMessage` (Task 2).
- Produces: `Dial({ position: number; value: number; onChange(value: number): void })`; `PadlockScreen(props: PadlockScreenProps)` with `{ header: ReactNode; title?: string; steps: readonly QuizStep[]; foundDigits: number[]; hint?: string; wrongAttempts: number; onOpen(code: number[]): void }`; `DEFAULT_PADLOCK_TITLE = 'Le cadenas'`. Accessible names: dial value `Chiffre N`, arrows `Chiffre N : augmenter` / `Chiffre N : diminuer`, recap list `Chiffres trouvés`.

- [ ] **Step 1: Failing tests.** `Dial.test.tsx`:

```tsx
/** @file Tests for one padlock dial. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dial } from './Dial'

describe('Dial', () => {
  it('shows its digit and turns both ways, wrapping around', async () => {
    const onChange = vi.fn()
    render(<Dial position={2} value={9} onChange={onChange} />)
    expect(screen.getByLabelText('Chiffre 2')).toHaveTextContent('9')
    await userEvent.click(screen.getByRole('button', { name: 'Chiffre 2 : augmenter' }))
    await userEvent.click(screen.getByRole('button', { name: 'Chiffre 2 : diminuer' }))
    expect(onChange.mock.calls).toEqual([[0], [8]])
  })
})
```

`PadlockScreen.test.tsx`:

```tsx
/** @file Tests for the padlock screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PadlockScreen, type PadlockScreenProps } from './PadlockScreen'

const steps = [{ title: 'La crypte', instruction: 'a', solution: 4 }, { title: 'Le grenier', instruction: 'b', solution: 0 }]
const props: PadlockScreenProps = {
  header: <header>entête</header>, steps, foundDigits: [4, 0], wrongAttempts: 0, onOpen: vi.fn(),
}

describe('PadlockScreen', () => {
  it('recalls each step with its digit and shows one dial per step, at 0', () => {
    render(<PadlockScreen {...props} />)
    expect(screen.getByRole('heading', { name: 'Le cadenas' })).toBeInTheDocument()
    expect(screen.getByText('entête')).toBeInTheDocument()
    const recap = screen.getByRole('list', { name: 'Chiffres trouvés' })
    expect([...recap.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['La crypte4', 'Le grenier0'])
    expect(screen.getByLabelText('Chiffre 1')).toHaveTextContent('0')
    expect(screen.getByLabelText('Chiffre 2')).toHaveTextContent('0')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('shows the configured title and hint', () => {
    render(<PadlockScreen {...props} title="La porte du restaurant" hint="Le grenier d’abord" />)
    expect(screen.getByRole('heading', { name: 'La porte du restaurant' })).toBeInTheDocument()
    expect(screen.getByText('Le grenier d’abord')).toBeInTheDocument()
  })
  it('sends the dial digits when "Ouvrir" is pressed', async () => {
    const onOpen = vi.fn()
    render(<PadlockScreen {...props} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Chiffre 2 : diminuer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))
    expect(onOpen).toHaveBeenCalledWith([0, 9])
  })
  it('keeps the dials and shows a message after a wrong code', async () => {
    const { rerender } = render(<PadlockScreen {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Chiffre 1 : augmenter' }))
    rerender(<PadlockScreen {...props} wrongAttempts={1} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Le cadenas ne bouge pas')
    expect(screen.getByLabelText('Chiffre 1')).toHaveTextContent('1')
  })
})
```

- [ ] **Step 2:** `npx vitest run src/components/Dial.test.tsx src/components/PadlockScreen.test.tsx` → FAIL.

- [ ] **Step 3: Implement.** `Dial.tsx`:

```tsx
/** @file One padlock dial: a digit between an up and a down arrow. */
import { turnDial } from '../game/padlock'

/** Props of Dial. */
export interface DialProps {
  /** 1-based position, used in the accessible names. */
  position: number
  value: number
  onChange(value: number): void
}

/**
 * One dial of the combination lock.
 * @param props See DialProps.
 * @returns The dial.
 */
export function Dial({ position, value, onChange }: DialProps) {
  const label = `Chiffre ${position}`
  return (
    <div className="dial">
      <button type="button" aria-label={`${label} : augmenter`} onClick={() => onChange(turnDial(value, 1))}>▲</button>
      <output aria-label={label}>{value}</output>
      <button type="button" aria-label={`${label} : diminuer`} onClick={() => onChange(turnDial(value, -1))}>▼</button>
    </div>
  )
}
```

`PadlockScreen.tsx`:

```tsx
/** @file Final padlock: digits found, optional hint, one dial per step and an "Ouvrir" button. */
import { useState, type ReactNode } from 'react'
import type { QuizStep } from '../config/types'
import { wrongCodeMessage } from '../game/messages'
import { Dial } from './Dial'

/** Title shown when quiz.yaml has no `cadenas.titre`. */
export const DEFAULT_PADLOCK_TITLE = 'Le cadenas'

/** Props of PadlockScreen. */
export interface PadlockScreenProps {
  /** In-game header (clock and candles). */
  header: ReactNode
  /** `cadenas.titre`, if any. */
  title?: string
  steps: readonly QuizStep[]
  /** Digits found, in step order. */
  foundDigits: number[]
  /** `cadenas.indice`, if any. */
  hint?: string
  /** Wrong codes so far. */
  wrongAttempts: number
  /** Called with the digits shown on the dials. */
  onOpen(code: number[]): void
}

/**
 * The combination lock of the haunted room.
 * @param props See PadlockScreenProps.
 * @returns The padlock screen.
 */
export function PadlockScreen(props: PadlockScreenProps) {
  const { header, title = DEFAULT_PADLOCK_TITLE, steps, foundDigits, hint, wrongAttempts, onOpen } = props
  // Dial positions are local: they survive a wrong code (only the shake zone remounts).
  const [code, setCode] = useState(() => steps.map(() => 0))
  const setDigit = (index: number, digit: number) => setCode((current) => current.map((d, i) => (i === index ? digit : d)))
  return (
    <main className="screen padlock">
      {header}
      <h2>{title}</h2>
      <ul className="recap" aria-label="Chiffres trouvés">
        {steps.map((step, i) => <li key={i}><span>{step.title}</span><b>{foundDigits[i]}</b></li>)}
      </ul>
      {hint && <p className="hint">{hint}</p>}
      {/* Changing key on each wrong code remounts the zone, which replays the shake animation. */}
      <div key={wrongAttempts} className={wrongAttempts > 0 ? 'lock-zone shake' : 'lock-zone'}>
        {wrongAttempts > 0 && <p className="wrong-answer" role="alert">{wrongCodeMessage(wrongAttempts)}</p>}
        <div className="dials">
          {code.map((digit, i) => <Dial key={i} position={i + 1} value={digit} onChange={(d) => setDigit(i, d)} />)}
        </div>
      </div>
      <button type="button" className="seal-button open-button" onClick={() => onOpen(code)}>Ouvrir</button>
    </main>
  )
}
```

`src/styles/padlock.css` (move `.recap` rules here from `screens.css`, keep them identical):

```css
/** @file Padlock screen: recap of the digits found, hint, combination dials. */
.padlock { gap: 22px; }
.padlock h2 { margin-top: 8px; }

.recap { /* moved verbatim from screens.css */ }
.recap li { /* idem */ }
.recap b { /* idem */ }

.hint { font-size: 26px; color: var(--bronze); max-width: 24em; }
.hint::before { content: "« "; }
.hint::after { content: " »"; }

.lock-zone { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.dials { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; }
.dial {
  display: flex; flex-direction: column; align-items: stretch;
  padding: 4px; border-radius: 18px;
  background: linear-gradient(#3b2817, #20150c);
  border: 2px solid #6b4a28;
}
/* Arrows span the whole dial: easy to hit for small fingers. */
.dial button { min-height: 64px; font-size: 32px; color: var(--amber); }
.dial button:active { transform: translateY(2px); }
.dial output {
  width: 92px; height: 104px; line-height: 104px;
  font-size: 68px; font-weight: 700; font-variant-numeric: lining-nums;
  background: #110b06; border-radius: 10px;
  box-shadow: inset 0 10px 14px rgb(0 0 0 / .6), inset 0 -10px 14px rgb(0 0 0 / .6);
}
.open-button { margin-top: auto; }

@media (max-width: 600px) {
  .recap { grid-template-columns: 1fr; }
  .hint { font-size: 20px; }
  .dials { gap: 8px; }
  .dial button { min-height: 52px; font-size: 24px; }
  .dial output { width: 44px; height: 64px; line-height: 64px; font-size: 40px; }
}
```

In `screens.css` remove the whole « All solved » block and its `.recap` media rule (the file keeps home + step). `main.tsx`: `import './styles/padlock.css'` after `screens.css`.

- [ ] **Step 4:** `npx vitest run src/components` → PASS (AllSolvedScreen still exists and still passes).
- [ ] **Step 5: Commit** `feat: add padlock screen with combination dials (#5)`.

---

### Task 5: Victory sound (Web Audio)

**Files:** Create `src/services/sound.ts`, `src/services/sound.test.ts`

**Interfaces — Produces:** `type AudioContextFactory = () => AudioContext | null`; `playVictorySound(createContext?: AudioContextFactory): void` (never throws; timeline: lock clack at 0.2 s, door creak 1 → 3 s, ghost moan 2.2 → 4.4 s, matching `victory.css`).

- [ ] **Step 1: Failing test** `sound.test.ts`:

```ts
/** @file Tests for the synthesised victory sound (fake Web Audio context). */
import { playVictorySound } from './sound'

function fakeParam() {
  return { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
}

function fakeContext() {
  const oscillators: { type: string; start: ReturnType<typeof vi.fn>; onended: (() => void) | null }[] = []
  const ctx = {
    currentTime: 0,
    destination: {},
    close: vi.fn(() => Promise.resolve()),
    createGain: () => ({ gain: fakeParam(), connect: vi.fn() }),
    createOscillator: () => {
      const osc = { type: 'sine', frequency: fakeParam(), connect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null }
      oscillators.push(osc)
      return osc
    },
  }
  return { ctx: ctx as unknown as AudioContext, close: ctx.close, oscillators }
}

describe('playVictorySound', () => {
  it('does nothing without Web Audio', () => {
    expect(() => playVictorySound(() => null)).not.toThrow()
  })
  it('does nothing when the browser refuses to create the context', () => {
    expect(() => playVictorySound(() => { throw new Error('blocked') })).not.toThrow()
  })
  it('plays a clack, a creak and a moan, then releases the audio context', () => {
    const { ctx, close, oscillators } = fakeContext()
    playVictorySound(() => ctx)
    const types = oscillators.filter((o) => o.start.mock.calls.length > 0).map((o) => o.type)
    expect(types).toEqual(expect.arrayContaining(['square', 'sawtooth', 'sine']))
    oscillators.find((o) => o.onended)?.onended?.()
    expect(close).toHaveBeenCalledOnce()
  })
  it('stays silent in jsdom with the default context', () => {
    expect(() => playVictorySound()).not.toThrow()
  })
})
```

- [ ] **Step 2:** `npx vitest run src/services` → FAIL (module missing).

- [ ] **Step 3: Implement** `src/services/sound.ts`:

```ts
/**
 * @file Victory sound (lock clack, door creak, ghost moan), synthesised with Web Audio:
 * no audio file to host or license, and it works offline. Timings match victory.css.
 */

/** Creates the audio context; null when the browser has no Web Audio (e.g. jsdom). */
export type AudioContextFactory = () => AudioContext | null

const browserContext: AudioContextFactory = () => (typeof AudioContext === 'undefined' ? null : new AudioContext())

/** Gain that rises to `level`, holds, then fades out, so notes never click. */
function envelope(ctx: AudioContext, start: number, end: number, level: number): GainNode {
  const length = end - start
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(level, start + Math.min(0.05, length / 4))
  gain.gain.setValueAtTime(level, end - Math.min(0.3, length / 2))
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  gain.connect(ctx.destination)
  return gain
}

/** Oscillator wired to an envelope, with an optional wobble on its pitch. */
function tone(
  ctx: AudioContext, type: OscillatorType, start: number, end: number, level: number,
  wobble?: { rate: number; depth: number },
): OscillatorNode {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.connect(envelope(ctx, start, end, level))
  if (wobble) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = wobble.rate
    const depth = ctx.createGain()
    depth.gain.value = wobble.depth
    lfo.connect(depth)
    depth.connect(osc.frequency)
    lfo.start(start)
    lfo.stop(end)
  }
  osc.start(start)
  osc.stop(end)
  return osc
}

/** @returns A new context, or null if Web Audio is missing or blocked. */
function openContext(createContext: AudioContextFactory): AudioContext | null {
  try {
    return createContext()
  } catch {
    return null
  }
}

/**
 * Plays the victory sound. Must be called inside the tap handler: tablets only allow
 * sound started by a user gesture. Silent (never throws) when audio is unavailable.
 * @param createContext Audio context factory, replaced in tests.
 */
export function playVictorySound(createContext: AudioContextFactory = browserContext): void {
  const ctx = openContext(createContext)
  if (!ctx) return
  const t = ctx.currentTime
  // Lock clack as the shackle springs up.
  const clack = tone(ctx, 'square', t + 0.2, t + 0.28, 0.2)
  clack.frequency.setValueAtTime(880, t + 0.2)
  // Hinge creak while the doors swing (1 s → 3 s): a raspy sawtooth whose pitch drifts.
  const creak = tone(ctx, 'sawtooth', t + 1, t + 3, 0.12, { rate: 18, depth: 30 })
  creak.frequency.setValueAtTime(80, t + 1)
  creak.frequency.linearRampToValueAtTime(150, t + 1.8)
  creak.frequency.linearRampToValueAtTime(100, t + 2.4)
  creak.frequency.linearRampToValueAtTime(170, t + 3)
  // Ghost moan as the ghosts escape.
  const moan = tone(ctx, 'sine', t + 2.2, t + 4.4, 0.18, { rate: 5, depth: 12 })
  moan.frequency.setValueAtTime(300, t + 2.2)
  moan.frequency.linearRampToValueAtTime(520, t + 3.2)
  moan.frequency.linearRampToValueAtTime(260, t + 4.4)
  // Browsers cap the number of open contexts: release this one when done.
  moan.onended = () => void ctx.close()
}
```

- [ ] **Step 4:** `npx vitest run src/services` → PASS; `npm run typecheck` → OK.
- [ ] **Step 5: Commit** `feat: add synthesised victory sound (#5)`.

---

### Task 6: HauntedDoor and VictoryScreen

**Files:** Create `src/components/HauntedDoor.tsx`, `HauntedDoor.test.tsx`, `VictoryScreen.tsx`, `VictoryScreen.test.tsx`, `src/styles/victory.css`; modify `src/main.tsx`

**Interfaces:**
- Consumes: `formatDuration` (Task 2).
- Produces: `HauntedDoor()` (decorative, `aria-hidden`); `VictoryScreen({ header: ReactNode; message?: string; elapsedSeconds: number })`; `DEFAULT_VICTORY_MESSAGE = 'Le cadenas est ouvert !'`.

- [ ] **Step 1: Failing tests.** `HauntedDoor.test.tsx`:

```tsx
/** @file Tests for the decorative victory animation markup. */
import { render } from '@testing-library/react'
import { HauntedDoor } from './HauntedDoor'

describe('HauntedDoor', () => {
  it('is hidden from screen readers and has two doors, a lock, ghosts and bats', () => {
    const { container } = render(<HauntedDoor />)
    const root = container.firstElementChild
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('.door')).toHaveLength(2)
    expect(container.querySelector('.lock')).not.toBeNull()
    expect(container.querySelectorAll('.ghost')).toHaveLength(3)
    expect(container.querySelectorAll('.bat')).toHaveLength(4)
  })
})
```

`VictoryScreen.test.tsx`:

```tsx
/** @file Tests for the victory screen. */
import { render, screen } from '@testing-library/react'
import { VictoryScreen } from './VictoryScreen'

describe('VictoryScreen', () => {
  it('shows the configured message and the time taken', () => {
    render(<VictoryScreen header={<header>entête</header>} message="La salle est ouverte !" elapsedSeconds={2535} />)
    expect(screen.getByRole('heading', { name: 'La salle est ouverte !' })).toBeInTheDocument()
    expect(screen.getByText('Temps : 42 min 15 s')).toBeInTheDocument()
    expect(screen.getByText('entête')).toBeInTheDocument()
  })
  it('falls back to a neutral message', () => {
    render(<VictoryScreen header={null} elapsedSeconds={3903} />)
    expect(screen.getByRole('heading', { name: 'Le cadenas est ouvert !' })).toBeInTheDocument()
    expect(screen.getByText('Temps : 1 h 05 min 03 s')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2:** run both → FAIL.

- [ ] **Step 3: Implement.** `HauntedDoor.tsx`:

```tsx
/**
 * @file Decorative victory animation: the padlock springs open, the double door of the haunted
 * restaurant swings in, candlelight spills out, ghosts and bats escape. Pure markup; timing in victory.css.
 */
import type { CSSProperties } from 'react'

/** Where a flyer ends up, relative to the doorway centre (px), and when it leaves (s). */
interface Flight { dx: number; dy: number; delay: number }

const GHOSTS: Flight[] = [{ dx: -300, dy: -260, delay: 2.2 }, { dx: 280, dy: -300, delay: 2.6 }, { dx: 40, dy: -420, delay: 3 }]
const BATS: Flight[] = [
  { dx: -380, dy: -80, delay: 2 }, { dx: 360, dy: -140, delay: 2.3 },
  { dx: -200, dy: -380, delay: 2.8 }, { dx: 220, dy: -360, delay: 3.2 },
]

/** @returns Inline style feeding the shared `fly-out` keyframes. */
function flight({ dx, dy, delay }: Flight): CSSProperties {
  return { '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${delay}s` } as CSSProperties
}

/**
 * The haunted restaurant's door, opening.
 * @returns Decorative markup, hidden from screen readers.
 */
export function HauntedDoor() {
  return (
    <div className="haunted-door" aria-hidden="true">
      <div className="doorway">
        <div className="door-glow" />
        <div className="door door--left" />
        <div className="door door--right" />
      </div>
      <div className="lock"><span className="lock-shackle" /><span className="lock-body" /></div>
      {GHOSTS.map((f, i) => (
        <svg key={`g${i}`} className="ghost" style={flight(f)} viewBox="0 0 40 50">
          <path d="M20 2C9 2 2 11 2 22v26l6-5 6 5 6-5 6 5 6-5 6 5V22C38 11 31 2 20 2z" />
          <circle className="ghost-eye" cx="14" cy="20" r="3.5" />
          <circle className="ghost-eye" cx="26" cy="20" r="3.5" />
        </svg>
      ))}
      {BATS.map((f, i) => (
        <svg key={`b${i}`} className="bat" style={flight(f)} viewBox="0 0 64 24">
          <path d="M32 9L36 3L38 9Q48 2 64 6Q56 10 54 18Q48 14 42 19Q37 16 32 22Q27 16 22 19Q16 14 10 18Q8 10 0 6Q16 2 26 9L28 3Z" />
        </svg>
      ))}
    </div>
  )
}
```

`VictoryScreen.tsx`:

```tsx
/** @file Victory: the haunted door opens, then the victory message and the time taken. */
import type { ReactNode } from 'react'
import { formatDuration } from '../game/time'
import { HauntedDoor } from './HauntedDoor'

/** Message shown when quiz.yaml has no `cadenas.message_victoire`. */
export const DEFAULT_VICTORY_MESSAGE = 'Le cadenas est ouvert !'

/** Props of VictoryScreen. */
export interface VictoryScreenProps {
  /** In-game header, with the clock frozen. */
  header: ReactNode
  /** `cadenas.message_victoire`, if any. */
  message?: string
  /** Time the group took. */
  elapsedSeconds: number
}

/**
 * Last screen of the game.
 * @param props See VictoryScreenProps.
 * @returns The victory screen.
 */
export function VictoryScreen({ header, message = DEFAULT_VICTORY_MESSAGE, elapsedSeconds }: VictoryScreenProps) {
  return (
    <main className="screen victory">
      {header}
      <HauntedDoor />
      <div className="victory-text">
        <h2>{message}</h2>
        <p className="final-time">Temps : {formatDuration(elapsedSeconds)}</p>
      </div>
    </main>
  )
}
```

`src/styles/victory.css`:

```css
/**
 * @file Victory animation (≈ 5 s). Base styles are the END state and keyframes only describe the
 * start (fill `both`): with reduced motion, base.css removes animations and the end state shows at once.
 * Timeline: lock 0–1.4 s, doors 1–3 s, glow 1.4–3 s, flyers 2–5.8 s, text from 4.2 s (sound.ts matches).
 */
.victory { gap: 24px; overflow: hidden; }

.haunted-door { position: relative; width: 380px; height: 480px; margin-top: 24px; flex-shrink: 0; }
.doorway {
  position: absolute; inset: 0; overflow: hidden;
  border-radius: 190px 190px 8px 8px;
  border: 10px solid #3b2817;
  box-shadow: 0 0 0 4px #6b4a28, 0 20px 40px rgb(0 0 0 / .6);
  background: #0d0805;
  perspective: 900px;
}
.door-glow {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 60%, #fff3c4, var(--amber) 35%, rgb(242 165 65 / .2) 70%, transparent);
  animation: fade-in 1.6s ease-out 1.4s both;
}
.door {
  position: absolute; top: 0; bottom: 0; width: 50%;
  background: repeating-linear-gradient(90deg, #4a2e18 0 34px, #34200f 34px 38px);
  box-shadow: inset 0 0 30px rgb(0 0 0 / .6);
}
/* Doors swing inwards, into the room (away from the children). */
.door--left { left: 0; transform-origin: left center; transform: rotateY(80deg); animation: door-closed 2s ease-in-out 1s both; }
.door--right { right: 0; transform-origin: right center; transform: rotateY(-80deg); animation: door-closed 2s ease-in-out 1s both; }

.lock {
  position: absolute; left: 50%; top: 52%; width: 72px; margin-left: -36px;
  opacity: 0; transform: translateY(80px) rotate(25deg);
  animation: lock-fall 1.4s ease-in both;
}
.lock-shackle {
  display: block; width: 44px; height: 44px; margin: 0 auto -12px;
  border: 9px solid var(--bronze); border-bottom: 0; border-radius: 22px 22px 0 0;
  transform: translateY(-22px);
  animation: shackle-closed .5s ease-out .2s both;
}
.lock-body {
  display: block; height: 58px; border-radius: 10px;
  background: linear-gradient(#d9b57a, var(--bronze) 50%, #8a6a3c);
  box-shadow: 0 6px 14px rgb(0 0 0 / .5);
}

.ghost, .bat { position: absolute; left: 50%; top: 50%; opacity: 0; animation: fly-out 2.6s ease-out both; }
.ghost { width: 90px; margin: -56px 0 0 -45px; fill: var(--wax); filter: drop-shadow(0 0 12px rgb(241 220 176 / .6)); }
.ghost-eye { fill: var(--soot); }
.bat { width: 80px; margin: -15px 0 0 -40px; fill: #3a2312; filter: drop-shadow(0 0 6px rgb(242 165 65 / .7)); animation-duration: 1.8s; }

.victory-text { display: flex; flex-direction: column; align-items: center; gap: 12px; animation: rise-in .8s ease-out 4.2s both; }
.victory h2 { font-size: 56px; max-width: 12em; text-wrap: balance; }
.final-time { font-size: 34px; color: var(--amber); font-variant-numeric: lining-nums; }

@keyframes fade-in { from { opacity: 0; } }
@keyframes door-closed { from { transform: rotateY(0); } }
@keyframes shackle-closed { from { transform: none; } }
@keyframes lock-fall { 0%, 55% { opacity: 1; transform: none; } }
@keyframes rise-in { from { opacity: 0; transform: translateY(20px); } }
@keyframes fly-out {
  from { opacity: 0; transform: translate(0, 0) scale(.2); }
  15%, 80% { opacity: 1; }
  to { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.1); }
}

@media (max-width: 600px) {
  .haunted-door { width: 260px; height: 330px; }
  .doorway { border-radius: 130px 130px 6px 6px; }
  .victory h2 { font-size: 36px; }
  .final-time { font-size: 26px; }
}
```

`main.tsx`: `import './styles/victory.css'` after `padlock.css`.

- [ ] **Step 4:** `npx vitest run src/components` → PASS.
- [ ] **Step 5: Commit** `feat: add victory screen with haunted door animation (#5)`.

---

### Task 7: Wire everything in Game, remove the provisional screen

**Files:** Modify `src/components/Game.tsx`, `src/components/Game.test.tsx`; delete `src/components/AllSolvedScreen.tsx`, `src/components/AllSolvedScreen.test.tsx`

**Interfaces — Consumes:** `useGameProgress(...).unlock(code): boolean` (Task 3), `PadlockScreen` (Task 4), `playVictorySound` (Task 5), `VictoryScreen` (Task 6), `elapsedSeconds` (Task 2).

- [ ] **Step 1: Failing test.** In `Game.test.tsx`: add at the top

```tsx
import { playVictorySound } from '../services/sound'
vi.mock('../services/sound', () => ({ playVictorySound: vi.fn() }))
```

set `padlock: { order: [2, 1] }` (code = [0, 4]) and replace the two final expectations with:

```tsx
    expect(screen.getByRole('heading', { name: 'Le cadenas' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Toutes les étapes terminées' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ouvrir' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(playVictorySound).not.toHaveBeenCalled()

    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Chiffre 2 : augmenter' }))
    await user.click(screen.getByRole('button', { name: 'Ouvrir' }))
    expect(playVictorySound).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: 'Le cadenas est ouvert !' })).toBeInTheDocument()
    expect(screen.getByText(/^Temps : \d+ min \d{2} s$/)).toBeInTheDocument()
```

Rename the test to `'plays from home to the victory, with a wrong answer and a wrong code'`.

- [ ] **Step 2:** `npx vitest run src/components/Game.test.tsx` → FAIL.

- [ ] **Step 3: Implement** `Game.tsx`:

```tsx
/** @file Picks the screen to show from the game progress. */
import type { QuizConfig } from '../config/types'
import { elapsedSeconds } from '../game/time'
import { useGameProgress } from '../hooks/useGameProgress'
import { playVictorySound } from '../services/sound'
import { GameHeader } from './GameHeader'
import { HomeScreen } from './HomeScreen'
import { PadlockScreen } from './PadlockScreen'
import { StepScreen } from './StepScreen'
import { VictoryScreen } from './VictoryScreen'

/** Props of Game. */
export interface GameProps { config: QuizConfig }

/**
 * The whole game for a valid quiz.
 * @param props.config Validated quiz configuration.
 * @returns The current screen.
 */
export function Game({ config }: GameProps) {
  const { state, start, answer, next, unlock } = useGameProgress(config.steps, config.padlock.order)
  const { status, startedAt, finishedAt } = state
  if (status === 'home' || startedAt === null) {
    return <HomeScreen title={config.title} intro={config.intro} durationMinutes={config.durationMinutes} onStart={start} />
  }
  const header = (
    <GameHeader startedAt={startedAt} finishedAt={finishedAt} durationMinutes={config.durationMinutes}
      total={config.stepCount} solved={state.foundDigits.length} current={status === 'playing' ? state.stepIndex : null} />
  )
  if (status === 'won' && finishedAt !== null) {
    return <VictoryScreen header={header} message={config.padlock.victoryMessage} elapsedSeconds={elapsedSeconds(startedAt, finishedAt)} />
  }
  if (status === 'padlock') {
    // The sound starts inside the tap handler: tablets only allow sound started by a gesture.
    const open = (code: number[]) => { if (unlock(code)) playVictorySound() }
    return (
      <PadlockScreen header={header} title={config.padlock.title} steps={config.steps} foundDigits={state.foundDigits}
        hint={config.padlock.hint} wrongAttempts={state.wrongAttempts} onOpen={open} />
    )
  }
  return (
    <StepScreen header={header} step={config.steps[state.stepIndex]} stepNumber={state.stepIndex + 1}
      total={config.stepCount} foundDigit={state.foundDigits[state.stepIndex]} wrongAttempts={state.wrongAttempts}
      isLast={state.stepIndex === config.stepCount - 1} onDigit={answer} onNext={next} />
  )
}
```

Delete `AllSolvedScreen.tsx` and its test (`git rm`). `grep -rn "AllSolved\|solved'" src` → nothing left except `solved=` prop of GameHeader.

- [ ] **Step 4:** `npm run test:run`, `npm run typecheck`, `npm run lint` → all green.
- [ ] **Step 5: Commit** `feat: show padlock then victory after the last step (#5)`.

---

### Task 8: End-to-end run and visual check

**Files:** Modify `e2e/game.spec.ts`

- [ ] **Step 1: Update the full-run test.** Rename to `'a group plays every step, then opens the padlock after one wrong code'`. After the steps loop, replace the old heading expectation with:

```ts
  // Padlock code of the sample quiz: steps in order 3, 1, 6, 2, 5, 4.
  const CODE = [2, 4, 5, 7, 0, 9]
  await expect(page.getByRole('heading', { name: 'La porte du restaurant hanté' })).toBeVisible()
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('alert')).toBeVisible()

  for (const [i, digit] of CODE.entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
    await expect(page.getByLabel(`Chiffre ${i + 1}`, { exact: true })).toHaveText(String(digit))
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('heading', { name: 'La salle du restaurant hanté est ouverte !' })).toBeVisible()
  await expect(page.getByText(/^Temps : \d+ min \d{2} s$/)).toBeVisible()
```

- [ ] **Step 2:** `npm run test:e2e` → 4 tests PASS.

- [ ] **Step 3: Visual check (Playwright MCP, on `npm run dev`).** Script a run to the padlock (sessionless: play the 6 steps), then capture:
  1. padlock screen at 810×1080: no vertical scroll, 6 dials on one row, button visible;
  2. padlock at 390×844: no horizontal overflow (`document.documentElement.scrollWidth <= 390`), dials on one row;
  3. victory at 0.5 s, 2 s, 3.5 s and 6 s (door, lock, ghosts, text) at 810×1080;
  4. victory with `browser_emulate_media({ reducedMotion: 'reduce' })`: text visible immediately, doors open, no ghosts.
  Fix CSS if needed (re-run unit tests after any change). Screenshots go in the scratchpad, not in the repo. The sound itself is checked by Romain on the real tablet (Pages site), iPad silent switch mutes Web Audio.

- [ ] **Step 4: Commit** `test: cover the padlock and victory in e2e (#5)` (plus `style:`/`fix:` commits if the check found issues).

---

### Task 9: Docs, review, PR

**Files:** Modify `CLAUDE.md`, `README.md`, `ETAT.md`

- [ ] **Step 1: Docs.**
  - `CLAUDE.md`: structure lines — `src/game/` adds `padlock`; add `src/services/ sound (Web Audio synthétisé)`; `src/styles/` adds `padlock, victory`. Pitfalls: « **Animations de victoire** : styles de base = état final, keyframes = état de départ (`both`), pour que `prefers-reduced-motion` montre directement la fin. Timings alignés avec `sound.ts`. » and « **Son** : lancé dans le gestionnaire du tap « Ouvrir » (sinon bloqué par la tablette) ; muet si l'iPad est en mode silencieux. »
  - `README.md`: step 4 of the game flow → « Après la dernière étape, le cadenas : N molettes à régler dans l'ordre de `cadenas.ordre`. Le bon code ouvre la porte du restaurant hanté (animation + son) et affiche le temps mis. » Table: add `cadenas.titre` | non | texte non vide (par défaut « Le cadenas ») and `cadenas.message_victoire` | non | texte non vide (par défaut « Le cadenas est ouvert ! »).
- [ ] **Step 2: Full verification**, output shown: `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`. `find src -name '*.ts*' -o -name '*.css' | xargs wc -l` → nothing > 200.
- [ ] **Step 3:** commit `docs: document padlock, victory and sound (#5)`; update `ETAT.md` and commit.
- [ ] **Step 4: Review** with the `relecteur-code` agent (Sonnet); apply the fixes worth applying; commit.
- [ ] **Step 5:** `git push -u origin feat/padlock-victory`, `gh pr create` (description in French: contexte, changements, comment tester — including « écouter le son sur la tablette, mode silencieux désactivé » — captures, `Closes #5`). Update `ETAT.md` with the PR number, commit, push. Hand the link to Romain; he merges.
