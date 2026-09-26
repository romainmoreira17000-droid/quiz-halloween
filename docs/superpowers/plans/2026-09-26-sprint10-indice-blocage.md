# Sprint 10 — Indice et blocage après mauvaise réponse — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On each challenge, a « Indice » button on the parchment unlocks `indice_apres_minutes` into the slot and opens the hint in a window; a wrong answer blocks the keyboard for `blocage_secondes` with « Nouvelle réponse possible dans 00:42 », a block that survives a reload and ends with the slot.

**Architecture:** Same rule as sprint 9: time is derived, never counted. The reducer stores one new fact, `blockedUntil` (timestamp, capped at the end of the slot), computed by pure helpers in `src/game/block.ts`; the hint delay is a pure function of the slot clock (`secondsBeforeHint` in `src/game/time.ts`). `TeamGame` turns both into seconds for `StepScreen`, which shows a `HintButton` (button + window) on the parchment and passes the block to `AnswerZone` → `AnswerInput` (keys disabled, countdown in the typed-answer line, so the screen height does not change).

**Tech Stack:** Vite 8, React 19, TypeScript, Vitest 5 + Testing Library + jsdom, Playwright (`page.clock`).

**Spec:** `docs/superpowers/specs/2026-09-24-escape-game-design.md` (Décisions « Indice » et « Mauvaise réponse », Format du YAML, Parcours 3). Issue #22. Branch `feat/hint-and-block` (already created from `main`).

## Decisions taken while planning (not in the spec)

- **Hint UI (Romain's choice, 2026-09-26):** small button on the bottom edge of the parchment; greyed « Indice dans 03:00 » until available, then « Voir l’indice »; it opens a window (« Indice », the text, « Fermer ») that can be reopened at will. The button straddles the parchment's bottom edge (`position: absolute`) so the step screen keeps its exact height.
- **Block countdown in the typed-answer line:** nothing can be typed while blocked, so the `<output>` shows « Nouvelle réponse possible dans 00:42 » (clock format `mm:ss` like every other clock) and every key is disabled. The kind message (alert) stays above. No extra line.
- **The block ends with the slot:** `blockedUntil = min(now + blocage, end of the slot)`, so the next challenge always starts free.
- **Block only on challenges:** not on the entrance, the animator code, nor the padlock (spec: « Mauvaise réponse » of a challenge).
- **No hint on the waiting, « Temps écoulé » and padlock screens.** A step without `indice` has no button.
- **Save:** `blockedUntil` is saved and restored (only for `playing`); a save without it is rejected (it can only come from sprint 9, whose fingerprint differs anyway).
- **Validator placement:** `indice_apres_minutes` and `blocage_secondes` join `validateTeamSettings` (root-level game settings, next to `duree_epreuve_minutes` they are compared with).

## Global Constraints

- 200 lines max per file; `@file` header + JSDoc on every export (`@param`, `@returns`); comments in English explain *why*.
- Code and commits in English (Conventional Commits, `(#22)`); on-screen text in French, typographic apostrophe `’` in UI strings (validator messages keep the straight `'` like the existing ones).
- No `any`. Explicit types on props and service returns.
- Time is always **derived from timestamps and `Date.now()`**, never counted down in memory.
- Digits always `font-variant-numeric: lining-nums`.
- `getByRole('status')` must stay unique on a screen.
- Playwright: `exact: true` on « Commencer »; `page.clock.fastForward` takes `mm:ss`.
- Tablet 810×1080 first: a challenge screen fits without scrolling (`e2e/layout.spec.ts`). Phone: may scroll, never sideways.
- Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Checks: `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run valider`, `npm run test:e2e` (stop any `vite preview` on port 4173 first).
- After each task: tick the task in `ETAT.md`, write the next concrete action, commit it with the task.

## Review Focus

1. **Wrong answer in the last seconds of a slot** → the block stops at the slot change; the next challenge is free at once (Task 2: `blockEnd` capped test, reducer test « a block never outlives its slot »).
2. **Reload or tablet asleep during a block** → still blocked with the right countdown (Task 2: restore keeps `blockedUntil`; hook test « keeps the block after a reload »).
3. **Tap on Valider while blocked** (the screen clock lags up to 0.5 s) → ignored, never counted as a new wrong try nor a right one (Task 2: « ignores every answer while blocked »; `earnsDigit` false while blocked, so no clack).
4. **`blocage_secondes: 0` and `indice_apres_minutes: 0`** → no block at all; hint available from the first second (Task 2 tests; Task 4 « ready at once »).
5. **Step without `indice`** → no hint button, the screen is exactly as in sprint 9 (Task 4 StepScreen test).

---

### Task 1: YAML keys `indice_apres_minutes`, `blocage_secondes` and the step `indice`

**Files:**
- Modify: `src/config/types.ts`, `src/config/validateTeamSettings.ts`, `src/config/validateStep.ts`, `src/config/validateQuiz.ts`
- Test: `src/config/validateTeamSettings.test.ts`, `src/config/validateStep.test.ts`, `src/config/validateQuiz.test.ts`
- Modify (fixtures only, add the two new config fields): `src/App.test.tsx`, `src/components/Game.test.tsx`, `src/components/TeamGame.test.tsx`, `src/config/images.test.ts`, `src/game/fingerprint.test.ts`, `src/game/progress.test.ts`, `src/hooks/useGameProgress.test.ts`
- Modify: `quiz.yaml`, `README.md` (table of keys)

**Interfaces:**
- Produces: `QuizConfig.hintAfterMinutes: number`, `QuizConfig.blockSeconds: number`, `QuizStep.hint?: string`; `TeamSettings` gains the same two numbers.

- [ ] **Step 1: failing tests**

`src/config/validateTeamSettings.test.ts`: change `valid` and the first test, add the new cases at the end of the `describe`:

```ts
const valid = {
  equipes: ['Sorcières', 'Zombies'], duree_epreuve_minutes: 15, indice_apres_minutes: 10, blocage_secondes: 60, code_animateur: '2710',
}
```

```ts
  it('returns the settings', () => {
    expect(run(valid)).toEqual({
      settings: { teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintAfterMinutes: 10, blockSeconds: 60, animatorCode: '2710' },
      errors: [],
    })
  })
```

```ts
  it.each([0, 14])('accepts indice_apres_minutes %j', (indice_apres_minutes) => {
    expect(run({ ...valid, indice_apres_minutes }).errors).toEqual([])
  })
  it.each([-1, 2.5, '10', undefined])('rejects indice_apres_minutes %j', (indice_apres_minutes) => {
    expect(run({ ...valid, indice_apres_minutes }).errors)
      .toEqual(['« indice_apres_minutes » doit être un nombre entier supérieur ou égal à 0.'])
  })
  it('needs the hint before the end of the slot', () => {
    expect(run({ ...valid, indice_apres_minutes: 15 }).errors)
      .toEqual(["« indice_apres_minutes » (15) doit être plus petit que « duree_epreuve_minutes » (15) : sinon l'indice n'arrive jamais."])
  })
  it('skips the hint-vs-slot check when the slot length is wrong', () => {
    expect(run({ ...valid, duree_epreuve_minutes: 0, indice_apres_minutes: 20 }).errors)
      .toEqual(['« duree_epreuve_minutes » doit être un nombre entier supérieur à 0.'])
  })
  it('accepts blocage_secondes 0 (no block)', () => {
    expect(run({ ...valid, blocage_secondes: 0 }).settings?.blockSeconds).toBe(0)
  })
  it.each([-1, 1.5, '60', undefined])('rejects blocage_secondes %j', (blocage_secondes) => {
    expect(run({ ...valid, blocage_secondes }).errors)
      .toEqual(['« blocage_secondes » doit être un nombre entier supérieur ou égal à 0 (0 = pas de blocage).'])
  })
```

`src/config/validateStep.test.ts`: add

```ts
  it('adds the hint when there is one', () => {
    expect(run({ ...valid, indice: 'Sous le chaudron.' }).step?.hint).toBe('Sous le chaudron.')
    expect(run(valid).step).not.toHaveProperty('hint')
  })
  it.each(['', '  ', 3])('rejects indice %j', (indice) => {
    expect(run({ ...valid, indice }).errors).toEqual(['étape 3 : « indice » doit être un texte non vide.'])
  })
```

`src/config/validateQuiz.test.ts`: in `validRaw`, add `indice_apres_minutes: 10, blocage_secondes: 60` after `duree_epreuve_minutes: 15`; in the expected config of « returns a typed config for a valid quiz », add `hintAfterMinutes: 10, blockSeconds: 60` after `slotMinutes: 15`.

- [ ] **Step 2: run, expect failures**

Run: `npx vitest run src/config`
Expected: FAIL — the new validateTeamSettings/validateStep cases, and validateQuiz (« indice_apres_minutes » n'est pas un paramètre connu).

- [ ] **Step 3: implementation**

`src/config/types.ts` — `QuizStep` and `QuizConfig`:

```ts
/** One challenge: an instruction, the answer children type, the padlock digit it earns, and an optional hint. */
export interface QuizStep {
  title: string; instruction: string; image?: string; answer: ExpectedAnswer; digit: number
  /** `indice`: shown on demand once `hintAfterMinutes` of the slot are over; no hint button without it. */
  hint?: string
}
```

In `QuizConfig`, after `slotMinutes`:

```ts
  /** Minutes into each slot before the hint button unlocks (always below slotMinutes). */
  hintAfterMinutes: number
  /** Seconds the keyboard stays blocked after a wrong answer to a challenge (0 = never). */
  blockSeconds: number
```

`src/config/validateTeamSettings.ts`:
- `@file`: `/** @file Validates the game settings of the escape game: team names, slot length, hint delay, block time and animator code. */`
- `export interface TeamSettings { teams: string[]; slotMinutes: number; hintAfterMinutes: number; blockSeconds: number; animatorCode: string }`
- Replace the `duree_epreuve_minutes` check and add the two new ones:

```ts
  const slotOk = isIntInRange(raw.duree_epreuve_minutes, 1, Number.MAX_SAFE_INTEGER)
  if (!slotOk) errors.push('« duree_epreuve_minutes » doit être un nombre entier supérieur à 0.')
  if (!isIntInRange(raw.indice_apres_minutes, 0, Number.MAX_SAFE_INTEGER)) {
    errors.push('« indice_apres_minutes » doit être un nombre entier supérieur ou égal à 0.')
  } else if (slotOk && raw.indice_apres_minutes >= (raw.duree_epreuve_minutes as number)) {
    // The slot clock restarts at every change of room: a later hint would never show.
    errors.push(`« indice_apres_minutes » (${raw.indice_apres_minutes}) doit être plus petit que « duree_epreuve_minutes » (${raw.duree_epreuve_minutes as number}) : sinon l'indice n'arrive jamais.`)
  }
  if (!isIntInRange(raw.blocage_secondes, 0, Number.MAX_SAFE_INTEGER)) {
    errors.push('« blocage_secondes » doit être un nombre entier supérieur ou égal à 0 (0 = pas de blocage).')
  }
```

- Return value:

```ts
  return {
    teams: (raw.equipes as string[]).map((name) => name.trim()),
    slotMinutes: raw.duree_epreuve_minutes as number,
    hintAfterMinutes: raw.indice_apres_minutes as number,
    blockSeconds: raw.blocage_secondes as number,
    animatorCode: raw.code_animateur as string,
  }
```

`src/config/validateStep.ts`:
- `const STEP_KEYS = ['titre', 'consigne', 'image', 'type_reponse', 'reponse', 'chiffre', 'indice'] as const`
- After the `image` check: `if (raw.indice !== undefined && !isNonEmptyString(raw.indice)) errors.push(`${prefix}« indice » doit être un texte non vide.`)`
- In the returned object, after `digit`: `...(raw.indice !== undefined && { hint: raw.indice as string }),`

`src/config/validateQuiz.ts`: `ROOT_KEYS` becomes

```ts
const ROOT_KEYS = [
  'titre', 'intro', 'equipes', 'duree_epreuve_minutes', 'indice_apres_minutes', 'blocage_secondes', 'code_animateur',
  'nombre_etapes', 'entree', 'etapes', 'cadenas',
] as const
```

Fixtures (type errors otherwise): in each `QuizConfig` literal of `src/App.test.tsx`, `src/components/Game.test.tsx`, `src/components/TeamGame.test.tsx`, `src/game/fingerprint.test.ts`, `src/game/progress.test.ts`, `src/hooks/useGameProgress.test.ts`, add `hintAfterMinutes: 10, blockSeconds: 0` right after `slotMinutes: 15`; in `src/config/images.test.ts` (slot of 10 min) add `hintAfterMinutes: 5, blockSeconds: 0`. `blockSeconds: 0` keeps the existing wrong-then-right sequences valid; blocks get their own tests (Tasks 2–3).

- [ ] **Step 4: run, expect green**

Run: `npx vitest run src/config && npm run typecheck`
Expected: PASS, no type error.

- [ ] **Step 5: `quiz.yaml` and README**

`quiz.yaml`, after the `duree_epreuve_minutes: 15` block:

```yaml
# Minutes après le début de chaque épreuve avant que le bouton « Indice » s'active.
# Obligatoire, nombre entier, 0 ou plus, et plus petit que duree_epreuve_minutes.
indice_apres_minutes: 10

# Après une mauvaise réponse à une épreuve, la saisie est bloquée pendant ce nombre de
# secondes : les enfants doivent chercher au lieu de tenter au hasard. Obligatoire,
# nombre entier, 0 ou plus (0 = pas de blocage). Le blocage s'arrête toujours au
# changement de salle.
blocage_secondes: 60
```

In the step comment block, after the `chiffre` line:

```yaml
#   indice        facultatif, texte non vide : l'indice que les enfants peuvent lire au bout
#                 de « indice_apres_minutes » ; sans indice, pas de bouton « Indice »
```

Add an `indice:` line (after `chiffre:`) to steps 1 to 5; step 6 stays without (it shows the optional case):

```yaml
    indice: "Regardez aussi derrière les rideaux et sous les tables."      # La crypte
    indice: "Un animal vert qui fait « croa »."                            # Le chaudron
    indice: "Lisez le miroir... dans un autre miroir."                     # La bibliothèque
    indice: "Il y a trois années : posez l'addition sur une feuille."      # Le cimetière
    indice: "Elle est faite de fils et attrape les mouches."               # Le grenier
```

(the `# La crypte`… comments are only for this plan, do not copy them.)

`README.md`, table of root keys: add after the `duree_epreuve_minutes` row

```markdown
| `indice_apres_minutes` | oui | entier ≥ 0 et plus petit que `duree_epreuve_minutes` : minutes avant que le bouton « Indice » s'active |
| `blocage_secondes` | oui | entier ≥ 0 : saisie bloquée après une mauvaise réponse (0 = jamais) |
```

and, in the step keys table (or list), the row `| `indice` | non | texte non vide, lu sur demande au bout de `indice_apres_minutes` ; sans indice, pas de bouton |`.

Run: `npm run valider`
Expected: `✅ quiz.yaml est valide (6 étapes, 6 équipes, 15 min par épreuve).`

- [ ] **Step 6: commit**

```bash
git add -A src quiz.yaml README.md ETAT.md
git commit -m "feat: add the hint delay, block time and step hint keys (#22)"
```

---

### Task 2: Block and hint timing (pure logic, state, save)

**Files:**
- Create: `src/game/block.ts`, `src/game/block.test.ts`
- Modify: `src/game/time.ts`, `src/game/time.test.ts`, `src/game/progress.ts`, `src/game/progress.test.ts`, `src/game/restore.ts`, `src/game/restore.test.ts`, `src/hooks/useGameProgress.test.ts`

**Interfaces:**
- Consumes: `QuizConfig.blockSeconds`, `QuizConfig.slotMinutes` (Task 1).
- Produces:
  - `blockEnd(startedAt: number, now: number, slotMinutes: number, blockSeconds: number): number | null`
  - `blockSecondsLeft(blockedUntil: number | null, now: number): number`
  - `secondsBeforeHint(slotSecondsLeft: number, slotMinutes: number, hintAfterMinutes: number): number` (in `time.ts`)
  - `GameState.blockedUntil: number | null` (initial `null`)

- [ ] **Step 1: failing tests**

`src/game/block.test.ts`:

```ts
/** @file Tests for the keyboard block after a wrong answer. */
import { blockEnd, blockSecondsLeft } from './block'

const MIN = 60_000

describe('blockEnd', () => {
  it('blocks for the configured time', () => {
    expect(blockEnd(0, 2 * MIN, 15, 60)).toBe(3 * MIN)
  })
  it('never outlives the slot: the next challenge starts free', () => {
    expect(blockEnd(0, 14.5 * MIN, 15, 60)).toBe(15 * MIN)
    expect(blockEnd(0, 29.9 * MIN, 15, 60)).toBe(30 * MIN)
  })
  it('does not block with blocage_secondes 0', () => {
    expect(blockEnd(0, 2 * MIN, 15, 0)).toBeNull()
  })
})

describe('blockSecondsLeft', () => {
  it('counts whole seconds up, so 00:00 is never shown while blocked', () => {
    expect(blockSecondsLeft(60_000, 0)).toBe(60)
    expect(blockSecondsLeft(60_000, 59_001)).toBe(1)
    expect(blockSecondsLeft(60_000, 60_000)).toBe(0)
    expect(blockSecondsLeft(60_000, 90_000)).toBe(0)
    expect(blockSecondsLeft(null, 0)).toBe(0)
  })
})
```

`src/game/time.test.ts`, add (import `secondsBeforeHint` with the others):

```ts
describe('secondsBeforeHint', () => {
  it('counts down from the hint delay at the start of a slot', () => {
    expect(secondsBeforeHint(900, 15, 10)).toBe(600)
    expect(secondsBeforeHint(301, 15, 10)).toBe(1)
  })
  it('is 0 once the hint is available, and from the start with a delay of 0', () => {
    expect(secondsBeforeHint(300, 15, 10)).toBe(0)
    expect(secondsBeforeHint(12, 15, 10)).toBe(0)
    expect(secondsBeforeHint(900, 15, 0)).toBe(0)
  })
})
```

`src/game/progress.test.ts`:
- first test: expected home state gains `blockedUntil: null`:
  `expect(home).toEqual({ status: 'home', digits: [null, null], startedAt: null, finishedAt: null, wrongAttempts: 0, wrongSlot: null, blockedUntil: null })`
- import `blockSecondsLeft` is not needed; add a blocking reducer and tests:

```ts
// Same quiz with a one-minute block.
const blocking = createGameReducer({ ...config, blockSeconds: 60 }, 1)

describe('blocking after a wrong answer', () => {
  it('blocks the keyboard until one minute after a wrong answer', () => {
    const wrong = blocking(playing, { type: 'answer', challenge: 1, text: 'chat', now: MIN })
    expect(wrong).toEqual({ ...playing, wrongAttempts: 1, wrongSlot: 0, blockedUntil: 2 * MIN })
  })
  it('ignores every answer while blocked, right or wrong', () => {
    const wrong = blocking(playing, { type: 'answer', challenge: 1, text: 'chat', now: MIN })
    expect(blocking(wrong, { type: 'answer', challenge: 1, text: 'loup', now: MIN + 30_000 })).toBe(wrong)
    expect(blocking(wrong, { type: 'answer', challenge: 1, text: 'fantome', now: 2 * MIN - 1 })).toBe(wrong)
    expect(earnsDigit(wrong, { ...config, blockSeconds: 60 }, 1, { challenge: 1, text: 'fantome', now: 2 * MIN - 1 })).toBe(false)
  })
  it('accepts answers again once the block is over, and clears it on the right one', () => {
    const wrong = blocking(playing, { type: 'answer', challenge: 1, text: 'chat', now: MIN })
    expect(blocking(wrong, { type: 'answer', challenge: 1, text: 'fantome', now: 2 * MIN }))
      .toEqual({ ...playing, digits: [null, 0], wrongAttempts: 0, wrongSlot: 0, blockedUntil: null })
  })
  it('a block never outlives its slot', () => {
    const late = blocking(playing, { type: 'answer', challenge: 1, text: 'chat', now: 14.5 * MIN })
    expect(late.blockedUntil).toBe(15 * MIN)
  })
  it('does not block the entrance nor the padlock', () => {
    const blockingEntrance = createGameReducer({ ...config, blockSeconds: 60, entrance: { message: 'm', answer: { kind: 'letters', value: 'Bouh' } } }, 1)
    expect(blockingEntrance(atEntrance, { type: 'enter', text: 'chat', now: 0 }).blockedUntil).toBeNull()
    expect(blocking(allFound, { type: 'unlock', code: [4, 0], now: 30 * MIN }).blockedUntil).toBeNull()
  })
})
```

(The existing « counts wrong answers… » test keeps passing: its reducer uses `blockSeconds: 0`, so `blockedUntil` stays `null` and `{ ...playing, wrongAttempts: 2, wrongSlot: 0 }` still matches because `playing` carries `blockedUntil: null`.)

`src/game/restore.test.ts`:
- add `blockedUntil: null` to the `won` and `entrance` fixtures, and `blockedUntil: 90_000` to `playing`;
- `cleared` stays `{ wrongAttempts: 0, wrongSlot: null }`; the first test becomes « restores a game in progress with its block, without the wrong tries » (same assertion: `blockedUntil` 90 000 is kept);
- in « restores the victory and the entrance » nothing changes (their `blockedUntil` is `null`);
- add to the rejected table:

```ts
    ['a sprint 9 save (no block)', { status: 'playing', digits: [null, 0], startedAt: 1000, finishedAt: null, wrongAttempts: 0, wrongSlot: null }],
    ['block as text', { ...playing, blockedUntil: '90000' }],
```

`src/hooks/useGameProgress.test.ts`: add `blockedUntil: null` to the `stuck` fixture, and add:

```ts
  it('keeps the block after a reload', () => {
    const blockingConfig = { ...config, blockSeconds: 60 }
    const first = renderHook(() => useGameProgress(blockingConfig, 1))
    act(() => first.result.current.start())
    act(() => { first.result.current.answer(1, '9') })
    first.unmount()
    at(0.5)
    const again = renderHook(() => useGameProgress(blockingConfig, 1))
    expect(again.result.current.state.blockedUntil).toBe(START + MIN)
    let right = true
    act(() => { right = again.result.current.answer(1, '8') })
    expect(right).toBe(false)
    expect(again.result.current.state.digits).toEqual([null, null])
  })
```

- [ ] **Step 2: run, expect failures**

Run: `npx vitest run src/game src/hooks`
Expected: FAIL — `./block` not found, `secondsBeforeHint` not exported, `blockedUntil` missing.

- [ ] **Step 3: implementation**

`src/game/block.ts`:

```ts
/** @file Keyboard block after a wrong answer: when it ends and how long is left, derived from timestamps. */

/**
 * End of the block started by a wrong answer at `now`.
 * @param startedAt Start timestamp of the game in ms.
 * @param now Time of the wrong answer in ms.
 * @param slotMinutes Length of one slot.
 * @param blockSeconds `blocage_secondes` (0 = no block).
 * @returns Timestamp in ms, capped at the end of the slot (the next challenge starts free), or null without block.
 * @example blockEnd(0, 14.5 * 60_000, 15, 60) // 15 * 60_000
 */
export function blockEnd(startedAt: number, now: number, slotMinutes: number, blockSeconds: number): number | null {
  if (blockSeconds === 0) return null
  const slotMs = slotMinutes * 60_000
  const slotEnd = startedAt + (Math.floor(Math.max(0, now - startedAt) / slotMs) + 1) * slotMs
  return Math.min(now + blockSeconds * 1000, slotEnd)
}

/**
 * Seconds before a new answer is accepted.
 * @param blockedUntil End of the block in ms, or null.
 * @param now Current timestamp in ms.
 * @returns Whole seconds, rounded up (never shows 00:00 while still blocked); 0 when free.
 */
export function blockSecondsLeft(blockedUntil: number | null, now: number): number {
  return blockedUntil === null ? 0 : Math.max(0, Math.ceil((blockedUntil - now) / 1000))
}
```

`src/game/time.ts`, append:

```ts
/**
 * Seconds before the hint button unlocks in the current slot.
 * @param slotSecondsLeft Seconds left in the slot (`slotTiming(...).secondsLeft`).
 * @param slotMinutes Length of one slot.
 * @param hintAfterMinutes `indice_apres_minutes`.
 * @returns Seconds to wait, 0 once the hint is available.
 * @example secondsBeforeHint(900, 15, 10) // 600: first second of the slot
 */
export function secondsBeforeHint(slotSecondsLeft: number, slotMinutes: number, hintAfterMinutes: number): number {
  return Math.max(0, hintAfterMinutes * 60 - (slotMinutes * 60 - slotSecondsLeft))
}
```

`src/game/progress.ts`:
- import: `import { blockEnd, blockSecondsLeft } from './block'`
- `GameState`, after `wrongSlot`:

```ts
  /** End of the keyboard block after a wrong answer to a challenge (ms), null when free. Saved: a reload keeps it. */
  blockedUntil: number | null
```

- `initialGameState` adds `blockedUntil: null`.
- `earnsDigit` returns `false` while blocked: add `&& blockSecondsLeft(state.blockedUntil, answer.now) === 0` to its condition, and to its `@returns`: « …not blocked, … ».
- `case 'answer'`:

```ts
      case 'answer': {
        const phase = gamePhase(state, config, teamIndex, action.now)
        if (phase.kind !== 'challenge' || phase.challenge !== action.challenge || state.startedAt === null) return state
        // A tap while blocked is neither a new wrong try nor a right one: the group must wait.
        if (blockSecondsLeft(state.blockedUntil, action.now) > 0) return state
        return earnsDigit(state, config, teamIndex, action)
          ? { ...withDigit(state, action.challenge, config.steps[action.challenge].digit), wrongAttempts: 0, blockedUntil: null }
          : { ...countWrong(state, phase.slot), blockedUntil: blockEnd(state.startedAt, action.now, config.slotMinutes, config.blockSeconds) }
      }
```

`src/game/restore.ts`:
- destructure `blockedUntil` too: `const { status, digits, startedAt, finishedAt, blockedUntil } = value as Record<string, unknown>`
- after the `RESUMABLE` check: `if (blockedUntil !== null && !isTime(blockedUntil)) return null` with the comment `// A save without the field comes from an older game format: nothing to resume.`
- the `playing` return becomes `{ ...fresh, status: 'playing', startedAt, blockedUntil }` (the block survives a reload; the other statuses keep `null` from `fresh`).
- `@returns`: « The state (wrong tries cleared, block kept), or null… »

- [ ] **Step 4: run, expect green**

Run: `npx vitest run src/game src/hooks && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: commit**

```bash
git add src/game src/hooks ETAT.md
git commit -m "feat: block answers after a wrong try and time the hint (#22)"
```

---

### Task 3: Blocked keyboard on the challenge screen

**Files:**
- Modify: `src/components/Keypad.tsx`, `src/components/LetterKeyboard.tsx`, `src/components/AnswerInput.tsx`, `src/components/AnswerZone.tsx`, `src/components/StepScreen.tsx`, `src/components/TeamGame.tsx`, `src/styles/keyboard.css`
- Test: `src/components/AnswerInput.test.tsx`, `src/components/AnswerZone.test.tsx`, `src/components/StepScreen.test.tsx`, `src/components/TeamGame.test.tsx`

**Interfaces:**
- Consumes: `blockSecondsLeft`, `GameState.blockedUntil` (Task 2).
- Produces: `AnswerKeysProps.disabled?: boolean`; `AnswerInputProps.blockedMessage?: string`; `AnswerZoneProps.blockedSeconds?: number`; `StepScreenProps.blockSecondsLeft: number` (required; Task 4 adds `hintSecondsLeft` next to it).

- [ ] **Step 1: failing tests**

`src/components/AnswerInput.test.tsx`, add:

```ts
  it('shows the block message instead of the typed answer and disables every key', async () => {
    const onSubmit = vi.fn()
    render(<AnswerInput kind="letters" onSubmit={onSubmit} blockedMessage="Nouvelle réponse possible dans 00:42" />)
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('Nouvelle réponse possible dans 00:42')
    for (const name of ['A', 'Espace', 'Effacer', 'Valider']) expect(screen.getByRole('button', { name })).toBeDisabled()
  })
```

(If `AnswerInput.test.tsx` imports differ, reuse its existing `render`/`screen` imports.)

`src/components/AnswerZone.test.tsx`, add:

```ts
  it('counts down the block with the clock format', () => {
    render(<AnswerZone kind="digits" wrongAttempts={1} blockedSeconds={42} onSubmit={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('Nouvelle réponse possible dans 00:42')
    expect(screen.getByRole('button', { name: '1' })).toBeDisabled()
  })
  it('is free with no block left', () => {
    render(<AnswerZone kind="digits" wrongAttempts={1} blockedSeconds={0} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: '1' })).toBeEnabled()
  })
```

`src/components/StepScreen.test.tsx`: `base` gains `blockSecondsLeft: 0`; add:

```ts
  it('blocks the keyboard after a wrong answer', () => {
    render(<StepScreen {...base} wrongAttempts={1} blockSecondsLeft={59} />)
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('Nouvelle réponse possible dans 00:59')
    expect(screen.getByRole('button', { name: '7' })).toBeDisabled()
  })
```

`src/components/TeamGame.test.tsx`, add (uses the file's `renderZombies`, `press`, `type`, `wait` helpers):

```ts
  it('blocks the keyboard for a minute after a wrong answer, then accepts the right one', () => {
    renderZombies({ blockSeconds: 60 })
    press('Commencer')
    type('9')
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('Nouvelle réponse possible dans 01:00')
    expect(screen.getByRole('button', { name: '0' })).toBeDisabled()
    wait(1)
    type('0')
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 0')
  })
```

- [ ] **Step 2: run, expect failures**

Run: `npx vitest run src/components`
Expected: FAIL (props unknown to TypeScript are still rendered by Vitest: the assertions on the message and the disabled keys fail).

- [ ] **Step 3: implementation**

`src/components/Keypad.tsx`: `AnswerKeysProps` gains

```ts
  /** Every key disabled (keyboard blocked after a wrong answer). */
  disabled?: boolean
```

The component takes `disabled = false`; every `<button>` gets `disabled={disabled}`, and Valider `disabled={disabled || !canSubmit}`. Same in `src/components/LetterKeyboard.tsx` (letters, Espace, Effacer, Valider).

`src/components/AnswerInput.tsx`:
- props: 

```ts
  /** While set, the keyboard is blocked and this text replaces the typed answer (e.g. « Nouvelle réponse possible dans 00:42 »). */
  blockedMessage?: string
```

- signature `({ kind, onSubmit, secret = false, blockedMessage })`; `const keys: AnswerKeysProps = { …, disabled: blockedMessage !== undefined }`;
- output:

```tsx
      <output className={`typed typed--${blockedMessage === undefined ? kind : 'blocked'}`} aria-label="Réponse tapée">
        {blockedMessage ?? ((secret ? '•'.repeat(text.length) : text) || ' ')}
      </output>
```

`src/components/AnswerZone.tsx`:
- import `formatClock` from `'../game/time'`;
- props:

```ts
  /** Seconds before a new answer is accepted (0 or absent = free). */
  blockedSeconds?: number
```

- pass to `AnswerInput`: `blockedMessage={blockedSeconds ? `Nouvelle réponse possible dans ${formatClock(blockedSeconds)}` : undefined}`.
- `@file` becomes `Wrong-answer feedback zone shared by the step and entrance screens: shake, kind message, block countdown and the typed answer.`

`src/components/StepScreen.tsx`: prop

```ts
  /** Seconds before a new answer is accepted after a wrong one (0 = free). */
  blockSecondsLeft: number
```

destructure it and pass `blockedSeconds={blockSecondsLeft}` to `AnswerZone`.

`src/components/TeamGame.tsx`: `import { blockSecondsLeft } from '../game/block'`; in the `challenge`/`waiting` case pass `blockSecondsLeft={blockSecondsLeft(state.blockedUntil, at)}` to `StepScreen`.

`src/styles/keyboard.css`, after `.typed--digits`:

```css
/* Block countdown in the typed-answer line: a sentence, not a code, so plain text size and wrapping. */
.typed--blocked {
  font-family: var(--text-font); font-weight: 700; font-size: 26px; letter-spacing: 0;
  white-space: normal; text-align: center; color: var(--amber);
}
```

(inside the existing `@media (max-width: 600px)` block of that file add `.typed--blocked { font-size: 20px; }`.)

- [ ] **Step 4: run, expect green**

Run: `npx vitest run && npm run typecheck`
Expected: PASS (whole suite).

- [ ] **Step 5: commit**

```bash
git add src/components src/styles ETAT.md
git commit -m "feat: block the keyboard with a countdown after a wrong answer (#22)"
```

---

### Task 4: Hint button and window

**Files:**
- Create: `src/components/HintButton.tsx`, `src/components/HintButton.test.tsx`, `src/styles/hint.css`
- Modify: `src/components/StepScreen.tsx`, `src/components/StepScreen.test.tsx`, `src/components/TeamGame.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `QuizStep.hint`, `QuizConfig.hintAfterMinutes` (Task 1), `secondsBeforeHint` (Task 2).
- Produces: `HintButton({ hint: string; secondsLeft: number })`; `StepScreenProps.hintSecondsLeft: number`.

- [ ] **Step 1: failing tests**

`src/components/HintButton.test.tsx`:

```tsx
/** @file Tests for the hint button and its window. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HintButton } from './HintButton'

describe('HintButton', () => {
  it('stays greyed with its countdown until the hint is available', () => {
    render(<HintButton hint="Sous le chaudron." secondsLeft={180} />)
    expect(screen.getByRole('button', { name: 'Indice dans 03:00' })).toBeDisabled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('opens the hint in a window, closed by « Fermer » or Escape, and reopens at will', async () => {
    render(<HintButton hint="Sous le chaudron." secondsLeft={0} />)
    await userEvent.click(screen.getByRole('button', { name: 'Voir l’indice' }))
    expect(screen.getByRole('dialog', { name: 'Indice' })).toHaveTextContent('Sous le chaudron.')
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Voir l’indice' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

`src/components/StepScreen.test.tsx`: `base` gains `hintSecondsLeft: 0`; the first test asserts `expect(screen.getAllByRole('button')).toHaveLength(12)` — keep it (the `base.step` has no hint); add:

```ts
  it('shows no hint button without a hint', () => {
    render(<StepScreen {...base} />)
    expect(screen.queryByRole('button', { name: /indice/i })).not.toBeInTheDocument()
  })
  it('shows the hint button on the parchment, with its countdown', () => {
    render(<StepScreen {...base} step={{ ...base.step, hint: 'Sous le chaudron.' }} hintSecondsLeft={125} />)
    expect(screen.getByRole('button', { name: 'Indice dans 02:05' })).toBeDisabled()
  })
  it('hides the hint once the digit is found', () => {
    render(<StepScreen {...base} step={{ ...base.step, hint: 'Sous le chaudron.' }} digits={[4, 7, null, null, null, null]} />)
    expect(screen.queryByRole('button', { name: /indice/i })).not.toBeInTheDocument()
  })
```

`src/components/TeamGame.test.tsx`: give the Zombies' first challenge a hint and add:

```ts
  it('unlocks the hint ten minutes into the slot', () => {
    const steps = [config.steps[0], { ...config.steps[1], hint: 'Sous la malle.' }]
    renderZombies({ steps })
    press('Commencer')
    expect(screen.getByRole('button', { name: 'Indice dans 10:00' })).toBeDisabled()
    wait(10)
    press('Voir l’indice')
    expect(screen.getByRole('dialog', { name: 'Indice' })).toHaveTextContent('Sous la malle.')
  })
```

- [ ] **Step 2: run, expect failures**

Run: `npx vitest run src/components`
Expected: FAIL — `./HintButton` not found; StepScreen hint tests fail.

- [ ] **Step 3: implementation**

`src/components/HintButton.tsx`:

```tsx
/** @file « Indice » button of a challenge: greyed with its countdown, then opens the hint in a window. */
import { useEffect, useRef, useState } from 'react'
import { formatClock } from '../game/time'

/** Props of HintButton. */
export interface HintButtonProps {
  /** `indice` of the step. */
  hint: string
  /** Seconds before the hint unlocks in this slot; 0 once available. */
  secondsLeft: number
}

/**
 * Hint on demand, free, readable as often as the group wants.
 * @param props See HintButtonProps.
 * @returns The button, and the window while it is open.
 */
export function HintButton({ hint, secondsLeft }: HintButtonProps) {
  const [open, setOpen] = useState(false)
  const ready = secondsLeft <= 0
  return (
    <>
      <button type="button" className="hint-button" disabled={!ready} onClick={() => setOpen(true)}>
        {ready ? 'Voir l’indice' : `Indice dans ${formatClock(secondsLeft)}`}
      </button>
      {open && <HintDialog hint={hint} onClose={() => setOpen(false)} />}
    </>
  )
}

/** Window over the screen (the step screen has no free line for the text); « Fermer » focused, Escape closes. */
function HintDialog({ hint, onClose }: { hint: string; onClose(): void }) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => { close.current?.focus() }, [])
  return (
    <div className="hint-overlay">
      <div className="hint-dialog" role="dialog" aria-modal="true" aria-labelledby="hint-title"
        onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
        <h2 id="hint-title">Indice</h2>
        <p className="hint-text">{hint}</p>
        <button type="button" className="seal-button" ref={close} onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
```

`src/styles/hint.css`:

```css
/** @file Hint button straddling the bottom edge of the parchment, and the hint window. */
/* The button hangs half outside the parchment, in the gap above the lock: the step screen keeps its height. */
.parchment { position: relative; }
.hint-button {
  position: absolute; right: 20px; bottom: -32px;
  min-height: 52px; padding: 0 22px; border-radius: 26px;
  font-family: var(--text-font); font-weight: 700; font-size: 22px; font-variant-numeric: lining-nums;
  color: var(--wax); background: radial-gradient(circle at 35% 30%, var(--seal-light), var(--seal) 60%, #5a150f);
  box-shadow: 0 6px 14px rgb(0 0 0 / .55);
}
/* Greyed but readable: the global disabled opacity would fade the countdown on the parchment. */
.hint-button:disabled { opacity: 1; background: #4a3b2c; color: #cdb98f; }

.hint-overlay {
  position: fixed; inset: 0; z-index: 30;
  display: flex; padding: 16px; overflow-y: auto;
  background: rgb(10 6 4 / .82);
}
.hint-dialog {
  margin: auto; width: 100%; max-width: 600px;
  display: grid; gap: 24px; justify-items: center; padding: 36px 32px;
  border-radius: 24px; background: var(--wall);
  box-shadow: 0 20px 60px rgb(0 0 0 / .6);
  text-align: center;
}
.hint-dialog h2 { font-size: 56px; }
.hint-text { font-size: 32px; line-height: 1.4; }

@media (max-width: 600px) {
  .hint-button { right: 12px; font-size: 18px; min-height: 48px; bottom: -30px; }
  .hint-dialog { padding: 28px 16px; }
  .hint-dialog h2 { font-size: 40px; }
  .hint-text { font-size: 24px; }
}
```

`src/main.tsx`: add `import './styles/hint.css'` after `import './styles/reset.css'`.

`src/components/StepScreen.tsx`:
- import `HintButton`;
- prop

```ts
  /** Seconds before the hint unlocks (0 = available); unused when the step has no hint. */
  hintSecondsLeft: number
```

- inside `<section className="parchment">`, after the image: `{step.hint && !solved && <HintButton hint={step.hint} secondsLeft={hintSecondsLeft} />}`
- `@file`: `Challenge screen: instruction on a parchment menu (with its hint button), the cutaway lock, typed answer, then the earned digit and the time before the change of room.`

`src/components/TeamGame.tsx`: import `secondsBeforeHint` from `'../game/time'` (same import line as `remainingSeconds, slotTiming`) and pass `hintSecondsLeft={secondsBeforeHint(timing.secondsLeft, slotMinutes, config.hintAfterMinutes)}` to `StepScreen`.

- [ ] **Step 4: run, expect green**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: commit**

```bash
git add src/components src/styles src/main.tsx ETAT.md
git commit -m "feat: add the hint button and window on each challenge (#22)"
```

---

### Task 5: Parcours e2e, layout, browser check and documentation

**Files:**
- Create: `e2e/hint-and-block.spec.ts`
- Modify: `e2e/game.spec.ts`, `e2e/layout.spec.ts`, `CLAUDE.md`, `ETAT.md`, `README.md`
- Modify (only if the checks fail): `src/styles/hint.css`, `src/styles/screens.css`

**Interfaces:**
- Consumes: the whole sprint; sample `quiz.yaml` (Zombies start on « Le chaudron », hint « Un animal vert qui fait « croa ». »).

- [ ] **Step 1: e2e**

`e2e/game.spec.ts`: the wrong try of slot 1 now blocks the keyboard for a minute. After `await expect(page.getByRole('alert')).toBeVisible()` (right after `typeAnswer(page, 'CHAT')`), add:

```ts
  await expect(page.getByLabel('Réponse tapée')).toHaveText(/^Nouvelle réponse possible dans (01:00|00:5\d)$/)
  await page.clock.fastForward('01:00')
```

`e2e/hint-and-block.spec.ts`:

```ts
/** @file A team is blocked for a minute after a wrong answer, then reads its hint ten minutes into the slot. */
import { test, expect } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

test('a wrong answer blocks the keyboard for a minute and the hint unlocks after ten minutes', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Le chaudron' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Indice dans (10:00|09:5\d)$/ })).toBeDisabled()

  await typeAnswer(page, 'CHAT')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Réponse tapée')).toHaveText(/^Nouvelle réponse possible dans (01:00|00:5\d)$/)
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeDisabled()
  await page.clock.fastForward('01:00')
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeEnabled()

  await page.clock.fastForward('09:00')
  await page.getByRole('button', { name: 'Voir l’indice' }).click()
  const dialog = page.getByRole('dialog', { name: 'Indice' })
  await expect(dialog).toContainText('Un animal vert qui fait « croa ».')
  await dialog.getByRole('button', { name: 'Fermer' }).click()
  await expect(dialog).toHaveCount(0)

  await typeAnswer(page, 'CRAPAUD')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 7')
  await expect(page.getByRole('button', { name: /indice/i })).toHaveCount(0)
})
```

`e2e/layout.spec.ts`: inside the loop, after the heading check, add
`await expect(page.getByRole('button', { name: /^Indice dans/ })).toBeVisible()`
(both « La crypte » and « Le chaudron » have a hint: the screen must still fit with the button).

Run: `npm run test:e2e`
Expected: all pass (10 tests). If `layout.spec` overflows by N px: lower `.step .cutaway-lock { margin-top }` in `screens.css` (40px) by N but keep it ≥ 34px so the button (32px outside the parchment) never touches the lock; if that is not enough, reduce `.parchment` bottom padding from 18px to 12px. Record the values in CLAUDE.md (« Hauteur de l'écran d'étape »).

- [ ] **Step 2: browser check**

With a fresh Playwright context (the service worker may serve an old build), take screenshots at 810×1080 and 390×844 of: a challenge with the greyed hint button, the block countdown (digits and letters keyboards), the hint window, a challenge without hint (« La porte de la cuisine », team Momies at slot 0). Check: button readable on the parchment and not over the instruction text nor the lock, countdown readable and on one or two lines, window readable, no sideways scroll. Fix what looks wrong (CSS only) as its own `style: … (#22)` commit, rerun `npm run test:e2e`.

- [ ] **Step 3: documentation**

`CLAUDE.md`:
- « But »: add « un indice par épreuve (bouton débloqué à `indice_apres_minutes`) ; une mauvaise réponse bloque la saisie `blocage_secondes` ».
- « Structure »: `src/game/` gains `block` (blocage après mauvaise réponse); `src/components/` gains `HintButton` (bouton + fenêtre d'indice); `src/styles/` gains `hint`.
- « Pièges connus », add:
  - **Blocage** : `blockedUntil` (timestamp) dans l'état sauvegardé, plafonné à la fin du créneau (`blockEnd`) ; le réducteur ignore toute réponse pendant le blocage (ni bonne ni mauvaise) et `earnsDigit` renvoie false (pas de « clac »). Le décompte remplace la réponse tapée dans l'`<output>` (pas de ligne en plus). Seulement sur les épreuves.
  - **Indice** : `secondsBeforeHint` dérivé du chrono du créneau ; bouton en `position: absolute` à cheval sur le bas du parchemin (`hint.css`), pour ne pas allonger l'écran d'étape. Pas d'indice sur l'attente, « Temps écoulé » ni le cadenas.
  - **e2e** : après une mauvaise réponse à une épreuve, `page.clock.fastForward('01:00')` avant de retaper.
- Sauvegarde : the `state` list gains `blockedUntil`.

`README.md`, « Déroulé d'une partie », step 3: add « Mauvaise réponse : l'écran tremble, un message d'encouragement s'affiche et la saisie est bloquée une minute (« Nouvelle réponse possible dans 00:42 »). Au bout de 10 minutes, le bouton « Voir l'indice » du parchemin montre l'indice de l'épreuve. »

`ETAT.md`: sprint 10 done on the branch, next action = review (`relecteur-code`) then PR `Closes #22`; copy this plan's « Decisions taken while planning » in « Décisions prises ».

- [ ] **Step 4: final verification**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run valider && npm run test:e2e` → all green; paste the summary lines in the PR description.

- [ ] **Step 5: commit** `docs: document the hint and the block (#22)` (e2e files in the same commit).
