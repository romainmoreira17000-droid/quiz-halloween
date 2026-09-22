# Sprint 7 — Message d'entrée et réponses en chiffres ou en mots — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Children type the answer of a real-life challenge (digits or words) to earn a padlock digit, after an optional entrance message whose answer starts the clock.

**Architecture:** Pure answer logic in `src/game/answer.ts` (normalize + compare). Config gains `ExpectedAnswer` (kind + value) per step and an optional `entrance`; a shared `validateAnswer` checks both. The reducer gains an `entrance` status and an `enter` action; `answer` takes typed text and stores the step's `digit`. UI: `AnswerInput` holds the typed text and shows `Keypad` (digits, with Effacer/Valider) or `LetterKeyboard` (AZERTY); `EntranceScreen` is the new screen between home and step 1.

**Tech Stack:** Vite 8, React 19, TypeScript, Vitest 5 + Testing Library + jsdom, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-22-entree-et-reponses-design.md`. Issue #14. Branch `feat/entrance-and-text-answers`.

## Global Constraints

- 200 lines max per file; `@file` header + JSDoc on every export; comments in English explain *why*.
- Code and commits in English (Conventional Commits, `(#14)`); on-screen text and validator messages in French.
- No `any`. Explicit types on props and returns.
- Validator never stops at the first error; messages prefixed by location (`entrée : `, `étape 3 : `).
- Letters answers: case, accents and outer spaces ignored; inner runs of spaces count as one. Digits answers: exact, leading zeros count.
- Max typed length: 12 digits, 24 letters.
- Children's touch targets ≥ 88 px on the digit keypad; letter keys ≥ 64 px high on tablet.
- Wrong answer: rotating kind message + shake, no penalty.
- Clock starts when the entrance is solved (or on « Commencer » if there is no `entree`).
- Every commit ends with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Run unit tests with `npm run test:run`, types with `npm run typecheck`.

---

### Task 1: Answer types and answer comparison

**Files:**
- Modify: `src/config/types.ts`
- Modify: `src/game/answer.ts`
- Test: `src/game/answer.test.ts`

**Interfaces:**
- Produces (types.ts): `type AnswerKind = 'digits' | 'letters'`, `interface ExpectedAnswer { kind: AnswerKind; value: string }`.
- Produces (answer.ts): `MAX_ANSWER_LENGTH: Readonly<Record<AnswerKind, number>>`, `normalizeAnswer(text: string, kind: AnswerKind): string`, `isRightAnswer(typed: string, expected: ExpectedAnswer): boolean`, `appendToAnswer(current: string, char: string, kind: AnswerKind): string`.
- The old `isCorrectAnswer(step, digit)` stays until Task 3 deletes it.

- [ ] **Step 1: Add the types** — append to `src/config/types.ts` (before `QuizStep`):

```ts
/** How children type an answer: keypad digits or AZERTY letters. */
export type AnswerKind = 'digits' | 'letters'

/** Answer expected from the children, as written in quiz.yaml (compared after normalization). */
export interface ExpectedAnswer { kind: AnswerKind; value: string }
```

- [ ] **Step 2: Write the failing tests** — append to `src/game/answer.test.ts` (keep the existing `isCorrectAnswer` block for now; add the new import names to the import line):

```ts
import { appendToAnswer, isCorrectAnswer, isRightAnswer, MAX_ANSWER_LENGTH, normalizeAnswer } from './answer'

describe('normalizeAnswer', () => {
  it('ignores case, accents and outer spaces for letters, and squeezes inner spaces', () => {
    expect(normalizeAnswer('  Fantôme   du  chef ', 'letters')).toBe('FANTOME DU CHEF')
  })
  it('turns typographic apostrophes into plain ones', () => {
    expect(normalizeAnswer('Toile d’araignée', 'letters')).toBe("TOILE D'ARAIGNEE")
  })
  it('only trims digits, keeping leading zeros', () => {
    expect(normalizeAnswer(' 0472 ', 'digits')).toBe('0472')
  })
})

describe('isRightAnswer', () => {
  const word = { kind: 'letters', value: 'Fantôme' } as const
  const code = { kind: 'digits', value: '0472' } as const
  it('accepts a word typed without accent, in capitals', () => {
    expect(isRightAnswer('FANTOME', word)).toBe(true)
  })
  it('rejects another word', () => {
    expect(isRightAnswer('FANTOMES', word)).toBe(false)
  })
  it('requires leading zeros on codes', () => {
    expect(isRightAnswer('0472', code)).toBe(true)
    expect(isRightAnswer('472', code)).toBe(false)
  })
  it('never accepts an empty answer', () => {
    expect(isRightAnswer('   ', { kind: 'letters', value: ' ' })).toBe(false)
  })
})

describe('appendToAnswer', () => {
  it('adds a character', () => {
    expect(appendToAnswer('CHA', 'T', 'letters')).toBe('CHAT')
  })
  it('stops at the maximum length', () => {
    const full = '1'.repeat(MAX_ANSWER_LENGTH.digits)
    expect(appendToAnswer(full, '2', 'digits')).toBe(full)
    expect(MAX_ANSWER_LENGTH).toEqual({ digits: 12, letters: 24 })
  })
  it('refuses a leading space or two spaces in a row', () => {
    expect(appendToAnswer('', ' ', 'letters')).toBe('')
    expect(appendToAnswer('TARTE ', ' ', 'letters')).toBe('TARTE ')
  })
})
```

- [ ] **Step 3: Run to verify it fails** — `npm run test:run -- src/game/answer.test.ts` → FAIL (`normalizeAnswer` is not exported).

- [ ] **Step 4: Implement** — replace `src/game/answer.ts` with:

```ts
/** @file Answer checks: normalizing what children type and comparing it with the expected answer. */
import type { AnswerKind, ExpectedAnswer, QuizStep } from '../config/types'

/** Longest answer the children can type, per keyboard. */
export const MAX_ANSWER_LENGTH: Readonly<Record<AnswerKind, number>> = { digits: 12, letters: 24 }

/**
 * Puts an answer in the form used for comparison.
 * Letters: capitals, no accents, plain apostrophes, trimmed, one space between words — children
 * should never fail on a missing accent. Digits: trimmed only, leading zeros count.
 * @param text Typed or configured answer.
 * @param kind Keyboard of the answer.
 * @returns The normalized answer.
 */
export function normalizeAnswer(text: string, kind: AnswerKind): string {
  if (kind === 'digits') return text.trim()
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[’‘]/g, "'")
    .toUpperCase().trim().replace(/\s+/g, ' ')
}

/**
 * @param typed What the children typed.
 * @param expected Answer from quiz.yaml.
 * @returns True when both match after normalization (an empty answer never matches).
 */
export function isRightAnswer(typed: string, expected: ExpectedAnswer): boolean {
  const normalized = normalizeAnswer(typed, expected.kind)
  return normalized.length > 0 && normalized === normalizeAnswer(expected.value, expected.kind)
}

/**
 * Adds one key press to the typed answer.
 * @param current Answer typed so far.
 * @param char Pressed character (a digit, a letter, "'", "-" or " ").
 * @param kind Keyboard in use.
 * @returns The new answer; unchanged when full, or for a leading or doubled space.
 */
export function appendToAnswer(current: string, char: string, kind: AnswerKind): string {
  if (current.length >= MAX_ANSWER_LENGTH[kind]) return current
  if (char === ' ' && (current === '' || current.endsWith(' '))) return current
  return current + char
}

/**
 * Tells whether a keypad digit solves a step. Removed in Task 3.
 * @param step The current step.
 * @param digit Digit pressed (0–9).
 * @returns True when the digit is the step's solution.
 */
export function isCorrectAnswer(step: QuizStep, digit: number): boolean {
  return step.solution === digit
}
```

- [ ] **Step 5: Run to verify it passes** — `npm run test:run -- src/game/answer.test.ts` → PASS; `npm run typecheck` → OK.

- [ ] **Step 6: Commit**

```bash
git add src/config/types.ts src/game/answer.ts src/game/answer.test.ts
git commit -m "feat: add letters and digits answer comparison (#14)"
```

---

### Task 2: Validators for an answer and for the entrance

**Files:**
- Create: `src/config/validateAnswer.ts`, `src/config/validateEntrance.ts`
- Modify: `src/config/types.ts`
- Test: `src/config/validateAnswer.test.ts`, `src/config/validateEntrance.test.ts`

**Interfaces:**
- Consumes: `normalizeAnswer`, `MAX_ANSWER_LENGTH` (Task 1).
- Produces: `validateAnswer(raw: RawObject, prefix: string, errors: string[]): ExpectedAnswer | null`; `validateEntrance(raw: unknown, errors: string[]): EntranceConfig | null | undefined` (undefined = section absent, null = invalid); `interface EntranceConfig { title?: string; message: string; answer: ExpectedAnswer }` in types.ts.

- [ ] **Step 1: Add the type** — in `src/config/types.ts`, after `ExpectedAnswer`:

```ts
/** Optional message read before entering the restaurant; its answer starts the clock. */
export interface EntranceConfig { title?: string; message: string; answer: ExpectedAnswer }
```

- [ ] **Step 2: Write the failing tests** — `src/config/validateAnswer.test.ts`:

```ts
/** @file Tests for the answer part of a step or of the entrance. */
import { validateAnswer } from './validateAnswer'

function run(raw: Record<string, unknown>) {
  const errors: string[] = []
  return { answer: validateAnswer(raw, 'étape 2 : ', errors), errors }
}

describe('validateAnswer', () => {
  it('maps a digits answer', () => {
    expect(run({ type_reponse: 'chiffres', reponse: '0472' })).toEqual({ answer: { kind: 'digits', value: '0472' }, errors: [] })
  })
  it('accepts a YAML number as digits text', () => {
    expect(run({ type_reponse: 'chiffres', reponse: 1832 }).answer).toEqual({ kind: 'digits', value: '1832' })
  })
  it('maps a letters answer with accents, spaces and apostrophes, trimmed', () => {
    expect(run({ type_reponse: 'mots', reponse: " Toile d'araignée " }).answer)
      .toEqual({ kind: 'letters', value: "Toile d'araignée" })
  })
  it.each(['lettres', 3, undefined, 'toString'])('rejects type_reponse %j', (type_reponse) => {
    expect(run({ type_reponse, reponse: 'x' }).errors)
      .toEqual(['étape 2 : « type_reponse » doit valoir « chiffres » ou « mots ».'])
  })
  it.each(['', '   ', undefined, true])('rejects reponse %j', (reponse) => {
    expect(run({ type_reponse: 'mots', reponse }).errors)
      .toEqual(['étape 2 : « reponse » est obligatoire et doit être un texte non vide.'])
  })
  it.each(['12a', '1 2', '1234567890123', -4])('rejects digits reponse %j', (reponse) => {
    expect(run({ type_reponse: 'chiffres', reponse }).errors)
      .toEqual(['étape 2 : « reponse » doit contenir uniquement des chiffres (12 au plus).'])
  })
  it.each(['R2D2', 'ŒUF', 'oui!'])('rejects letters that the keyboard cannot type: %j', (reponse) => {
    expect(run({ type_reponse: 'mots', reponse }).errors)
      .toEqual(['étape 2 : « reponse » ne peut contenir que des lettres, des espaces, des apostrophes ou des tirets.'])
  })
  it('rejects letters longer than 24 characters', () => {
    expect(run({ type_reponse: 'mots', reponse: 'A'.repeat(25) }).errors)
      .toEqual(['étape 2 : « reponse » doit faire 24 caractères au plus.'])
  })
  it('reports type and reponse together', () => {
    expect(run({}).errors).toEqual([
      'étape 2 : « type_reponse » doit valoir « chiffres » ou « mots ».',
      'étape 2 : « reponse » est obligatoire et doit être un texte non vide.',
    ])
  })
})
```

`src/config/validateEntrance.test.ts`:

```ts
/** @file Tests for the optional entrance section. */
import { validateEntrance } from './validateEntrance'

function run(raw: unknown) {
  const errors: string[] = []
  return { entrance: validateEntrance(raw, errors), errors }
}
const valid = { titre: 'Une lettre', message: 'Entrez si vous osez.', type_reponse: 'mots', reponse: 'Fantôme' }

describe('validateEntrance', () => {
  it('is undefined when the section is absent', () => {
    expect(run(undefined)).toEqual({ entrance: undefined, errors: [] })
  })
  it('maps a valid entrance', () => {
    expect(run(valid).entrance).toEqual({
      title: 'Une lettre', message: 'Entrez si vous osez.', answer: { kind: 'letters', value: 'Fantôme' },
    })
  })
  it('leaves out a missing title', () => {
    const { titre: _titre, ...rest } = valid
    expect(run(rest).entrance).toEqual({ message: 'Entrez si vous osez.', answer: { kind: 'letters', value: 'Fantôme' } })
  })
  it('collects every error at once', () => {
    const { entrance, errors } = run({ titre: '', message: 4, type_reponse: 'mots', reponse: '', mesage: 'x' })
    expect(entrance).toBeNull()
    expect(errors).toEqual([
      'entrée : « titre » doit être un texte non vide.',
      'entrée : « message » est obligatoire et doit être un texte non vide.',
      'entrée : « reponse » est obligatoire et doit être un texte non vide.',
      "entrée : « mesage » n'est pas un paramètre connu.",
    ])
  })
  it('rejects a non-object section', () => {
    expect(run('bonjour').errors).toEqual(['entrée : doit contenir « message », « type_reponse » et « reponse ».'])
  })
})
```

- [ ] **Step 3: Run to verify they fail** — `npm run test:run -- src/config/validateAnswer.test.ts src/config/validateEntrance.test.ts` → FAIL (modules not found).

- [ ] **Step 4: Implement** — `src/config/validateAnswer.ts`:

```ts
/** @file Validates the answer of a step or of the entrance (`type_reponse` + `reponse`). */
import { MAX_ANSWER_LENGTH, normalizeAnswer } from '../game/answer'
import { isNonEmptyString, type RawObject } from './checks'
import type { AnswerKind, ExpectedAnswer } from './types'

// A Map, not an object literal: `type_reponse: toString` must not find an inherited key.
const KINDS = new Map<unknown, AnswerKind>([['chiffres', 'digits'], ['mots', 'letters']])

/** @returns The configured answer as text: YAML reads `reponse: 1832` as a number. */
function answerText(value: unknown): string | null {
  // Any number becomes text; a negative or decimal one then fails the digits check with a clear message.
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return isNonEmptyString(value) ? value.trim() : null
}

/** @returns The French error for a value the chosen keyboard cannot type, or null. */
function typingError(value: string, kind: AnswerKind): string | null {
  if (kind === 'digits') {
    return new RegExp(`^\\d{1,${MAX_ANSWER_LENGTH.digits}}$`).test(value)
      ? null : `« reponse » doit contenir uniquement des chiffres (${MAX_ANSWER_LENGTH.digits} au plus).`
  }
  const normalized = normalizeAnswer(value, 'letters')
  if (!/^[A-Z' -]+$/.test(normalized)) {
    return '« reponse » ne peut contenir que des lettres, des espaces, des apostrophes ou des tirets.'
  }
  return normalized.length > MAX_ANSWER_LENGTH.letters
    ? `« reponse » doit faire ${MAX_ANSWER_LENGTH.letters} caractères au plus.` : null
}

/**
 * Validates `type_reponse` and `reponse`, pushing French messages into `errors`.
 * @param raw Mapping of a step or of the entrance.
 * @param prefix Location prefix (e.g. "étape 2 : ").
 * @param errors Accumulator shared with the other validators.
 * @returns The expected answer, or null if it has at least one error.
 */
export function validateAnswer(raw: RawObject, prefix: string, errors: string[]): ExpectedAnswer | null {
  const kind = KINDS.get(raw.type_reponse)
  if (!kind) errors.push(`${prefix}« type_reponse » doit valoir « chiffres » ou « mots ».`)
  const value = answerText(raw.reponse)
  if (value === null) {
    errors.push(`${prefix}« reponse » est obligatoire et doit être un texte non vide.`)
    return null
  }
  if (!kind) return null
  const error = typingError(value, kind)
  if (error) {
    errors.push(prefix + error)
    return null
  }
  return { kind, value }
}
```

`true` is neither a number nor a string → "obligatoire" message, as tested; `-4` becomes `'-4'` and fails the digits check.

`src/config/validateEntrance.ts`:

```ts
/** @file Validates the optional `entree` section: the message read before entering the restaurant. */
import { isNonEmptyString, isObject, unknownKeyErrors } from './checks'
import type { EntranceConfig } from './types'
import { validateAnswer } from './validateAnswer'

const ENTRANCE_KEYS = ['titre', 'message', 'type_reponse', 'reponse'] as const
const PREFIX = 'entrée : '

/**
 * Validates the entrance section, pushing French messages into `errors`.
 * @param raw Value of `entree` in the YAML (undefined when absent).
 * @param errors Accumulator shared with the other validators.
 * @returns The entrance; undefined when the section is absent; null when it has an error.
 */
export function validateEntrance(raw: unknown, errors: string[]): EntranceConfig | null | undefined {
  if (raw === undefined) return undefined
  if (!isObject(raw)) {
    errors.push(`${PREFIX}doit contenir « message », « type_reponse » et « reponse ».`)
    return null
  }
  const before = errors.length
  if (raw.titre !== undefined && !isNonEmptyString(raw.titre)) errors.push(`${PREFIX}« titre » doit être un texte non vide.`)
  if (!isNonEmptyString(raw.message)) errors.push(`${PREFIX}« message » est obligatoire et doit être un texte non vide.`)
  const answer = validateAnswer(raw, PREFIX, errors)
  errors.push(...unknownKeyErrors(raw, ENTRANCE_KEYS, PREFIX))
  if (errors.length > before || answer === null) return null
  return {
    ...(raw.titre !== undefined && { title: raw.titre as string }),
    message: raw.message as string,
    answer,
  }
}
```

- [ ] **Step 5: Run to verify they pass** — same command → PASS; `npm run typecheck` → OK.

- [ ] **Step 6: Commit**

```bash
git add src/config/types.ts src/config/validateAnswer.ts src/config/validateAnswer.test.ts src/config/validateEntrance.ts src/config/validateEntrance.test.ts
git commit -m "feat: validate typed answers and the entrance section (#14)"
```

---

### Task 3: Switch steps to `reponse` + `chiffre`

Replaces `QuizStep.solution` with `answer` + `digit` everywhere, adds `entrance` to `QuizConfig`, rewrites `quiz.yaml` with fictive challenges. The reducer's `answer` action now takes text. The UI keeps the old one-tap keypad for one task (a digit tap sends `String(digit)`); Task 5 replaces it.

**Files:**
- Modify: `src/config/types.ts`, `src/config/validateStep.ts`, `src/config/validateQuiz.ts`, `src/game/answer.ts`, `src/game/padlock.ts`, `src/game/progress.ts`, `src/hooks/useGameProgress.ts`, `src/components/Game.tsx`, `quiz.yaml`
- Tests: `src/config/validateStep.test.ts`, `src/config/validateQuiz.test.ts`, `src/config/parseQuiz.test.ts`, `src/config/images.test.ts`, `src/game/answer.test.ts`, `src/game/padlock.test.ts`, `src/game/progress.test.ts`, `src/game/fingerprint.test.ts`, `src/hooks/useGameProgress.test.ts`, `src/components/Game.test.tsx`, `src/components/StepScreen.test.tsx`, `src/components/PadlockScreen.test.tsx`, `src/App.test.tsx`

**Interfaces:**
- Consumes: `validateAnswer`, `validateEntrance`, `isRightAnswer` (Tasks 1–2).
- Produces: `QuizStep { title: string; instruction: string; image?: string; answer: ExpectedAnswer; digit: number }`; `QuizConfig.entrance?: EntranceConfig`; `GameAction` `{ type: 'answer'; text: string }`; `GameProgress.answer(text: string): void`.

- [ ] **Step 1: Types** — in `src/config/types.ts` replace the `QuizStep` declaration and add `entrance` to `QuizConfig`:

```ts
/** One challenge: an instruction, the answer children type, and the padlock digit it earns. */
export interface QuizStep { title: string; instruction: string; image?: string; answer: ExpectedAnswer; digit: number }
```

```ts
  padlock: PadlockConfig
  /** `entree` section, absent when the game starts directly on step 1. */
  entrance?: EntranceConfig
```

- [ ] **Step 2: Update test fixtures to the new shape** (they fail to typecheck until Step 4). Every fixture step `{ title, instruction, solution: N }` becomes `{ title, instruction, answer: { kind: 'digits', value: 'N' }, digit: N }`. Exact edits:
  - `src/game/padlock.test.ts`: steps become
    ```ts
    const steps = [
      { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
      { title: 'B', instruction: 'b', answer: { kind: 'digits', value: '7' }, digit: 7 },
      { title: 'C', instruction: 'c', answer: { kind: 'digits', value: '0' }, digit: 0 },
    ] as const
    ```
    and rename test text `'takes the solutions in step order by default'` → `'takes the step digits in step order by default'`.
  - `src/config/images.test.ts`: `solution: 1` → `answer: { kind: 'digits', value: '1' }, digit: 1`; `solution: 2` → `answer: { kind: 'digits', value: '2' }, digit: 2`.
  - `src/game/fingerprint.test.ts`: fixture step → `{ title: 'A', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 }`; last test becomes
    ```ts
    it('changes when a digit changes', () => {
      const changed = { ...config, steps: [{ ...config.steps[0], digit: 5 }] }
      expect(quizFingerprint(changed)).not.toBe(quizFingerprint(config))
    })
    ```
  - `src/App.test.tsx`: step → `{ title: 'A', instruction: 'a', answer: { kind: 'digits', value: '1' }, digit: 1 }`.
  - `src/components/PadlockScreen.test.tsx`: steps → `[{ title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 }, { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 }]`.
  - `src/components/StepScreen.test.tsx`: `step: { title: 'Le chaudron', instruction: 'Combien d’yeux ?', answer: { kind: 'digits', value: '7' }, digit: 7 }`.
  - `src/components/Game.test.tsx`: steps → `[{ title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 }, { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 }]` (the one-tap keypad still solves them in this task).
  - `src/hooks/useGameProgress.test.ts`: step → `{ title: 'A', instruction: 'a', answer: { kind: 'digits', value: '3' }, digit: 3 }`; `result.current.answer(3)` → `result.current.answer('3')` (twice); the "another quiz" test uses `{ ...config.steps[0], digit: 7 }`.
  - `src/game/answer.test.ts`: delete the old `describe('isCorrectAnswer', …)` block, its `step` constant, and `isCorrectAnswer` from the import.
  - `src/game/progress.test.ts`: steps become
    ```ts
    const steps = [
      { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '14' }, digit: 4 },
      { title: 'B', instruction: 'b', answer: { kind: 'letters', value: 'Fantôme' }, digit: 0 },
    ] as const
    ```
    and every `{ type: 'answer', digit: X }` becomes text: wrong tries `{ type: 'answer', text: '1' }` / `{ type: 'answer', text: '2' }`; the right answer on step A `{ type: 'answer', text: '14' }`; the ignored press after solving `{ type: 'answer', text: '14' }`; the right answer on step B `{ type: 'answer', text: 'fantome' }`; "ignores answers outside of the playing status" uses `{ type: 'answer', text: '14' }`. Expected states are unchanged (`foundDigits: [4]`, then `[4, 0]`): they now prove that the stored digit is `step.digit`, not the typed text.

- [ ] **Step 3: Write the failing validator tests** — replace `src/config/validateStep.test.ts` with:

```ts
/** @file Tests for single-step validation. */
import { validateStep } from './validateStep'

const valid = { titre: 'La crypte', consigne: 'Comptez les chauves-souris.', type_reponse: 'chiffres', reponse: '13', chiffre: 4 }

function run(raw: unknown) {
  const errors: string[] = []
  return { step: validateStep(raw, 3, errors), errors }
}

describe('validateStep', () => {
  it('maps a valid step to English keys', () => {
    expect(run({ ...valid, image: 'crypte.png' }).step).toEqual({
      title: 'La crypte', instruction: 'Comptez les chauves-souris.', image: 'crypte.png',
      answer: { kind: 'digits', value: '13' }, digit: 4,
    })
  })
  it.each([0, 9])('accepts boundary chiffre %i', (chiffre) => {
    expect(run({ ...valid, chiffre }).errors).toEqual([])
  })
  it.each([10, -1, 4.5, '4', null, undefined])('rejects chiffre %s', (chiffre) => {
    expect(run({ ...valid, chiffre }).errors)
      .toEqual(['étape 3 : « chiffre » doit être un chiffre entier entre 0 et 9.'])
  })
  it('explains that solution was replaced', () => {
    expect(run({ ...valid, solution: 4 }).errors).toEqual([
      'étape 3 : « solution » a été remplacée par « reponse » (ce que tapent les enfants) et « chiffre » (le chiffre gagné).',
    ])
  })
  it('collects every error at once', () => {
    const { step, errors } = run({ titre: '', consigne: 12, type_reponse: 'mots', reponse: 'R2D2', chiffre: 'x', image: 3, chifre: 4 })
    expect(step).toBeNull()
    expect(errors).toEqual([
      'étape 3 : « titre » est obligatoire et doit être un texte non vide.',
      'étape 3 : « consigne » est obligatoire et doit être un texte non vide.',
      'étape 3 : « reponse » ne peut contenir que des lettres, des espaces, des apostrophes ou des tirets.',
      'étape 3 : « chiffre » doit être un chiffre entier entre 0 et 9.',
      'étape 3 : « image » doit être un nom de fichier.',
      "étape 3 : « chifre » n'est pas un paramètre connu.",
    ])
  })
  it('rejects a non-object step', () => {
    expect(run('coucou').errors)
      .toEqual(['étape 3 : doit contenir « titre », « consigne », « type_reponse », « reponse » et « chiffre ».'])
  })
})
```

In `src/config/validateQuiz.test.ts`:
- `step(n)` returns `{ titre: \`Étape ${n}\`, consigne: \`Consigne ${n}\`, type_reponse: 'chiffres', reponse: String(n), chiffre: n % 10 }`.
- The typed-config expectation maps steps to `({ title: \`Étape ${n}\`, instruction: \`Consigne ${n}\`, answer: { kind: 'digits', value: String(n) }, digit: n })`.
- In "collects errors from every level at once", the bad step becomes `{ titre: 'x', consigne: 'y', type_reponse: 'chiffres', reponse: '1', chiffre: 12 }` and its expected message `'étape 6 : « chiffre » doit être un chiffre entier entre 0 et 9.'`; add `entree: 'x'` to that raw object and insert `'entrée : doit contenir « message », « type_reponse » et « reponse ».'` right after the `« intro »` message.
- Add:
  ```ts
  it('adds the entrance to the config', () => {
    const entree = { message: 'Entrez.', type_reponse: 'mots', reponse: 'Fantôme' }
    const result = validateQuiz({ ...validRaw(), entree })
    expect(result.ok && result.config.entrance)
      .toEqual({ message: 'Entrez.', answer: { kind: 'letters', value: 'Fantôme' } })
  })
  it('has no entrance when the section is absent', () => {
    const result = validateQuiz(validRaw())
    expect(result.ok && 'entrance' in result.config).toBe(false)
  })
  ```

In `src/config/parseQuiz.test.ts`, the YAML becomes
`'titre: Test\nduree_minutes: 10\nnombre_etapes: 1\netapes:\n  - titre: A\n    consigne: B\n    type_reponse: chiffres\n    reponse: "0"\n    chiffre: 0\n'`
and the assertion `expect(result.ok && result.config.steps[0].digit).toBe(0)`.

- [ ] **Step 4: Run to verify they fail** — `npm run test:run` → FAIL (validateStep still expects `solution`; type errors in fixtures).

- [ ] **Step 5: Implement the config** — replace `src/config/validateStep.ts` with:

```ts
/** @file Validates one quiz step (a real-life challenge) from the YAML and maps it to a QuizStep. */
import { isIntInRange, isNonEmptyString, isObject, unknownKeyErrors } from './checks'
import type { QuizStep } from './types'
import { validateAnswer } from './validateAnswer'

const STEP_KEYS = ['titre', 'consigne', 'image', 'type_reponse', 'reponse', 'chiffre'] as const

/**
 * Validates a raw step, pushing French messages into `errors`.
 * @param raw Value found in the YAML `etapes` list.
 * @param stepNumber 1-based position, used in messages.
 * @param errors Accumulator shared with the other validators.
 * @returns The typed step, or null if it has at least one error.
 */
export function validateStep(raw: unknown, stepNumber: number, errors: string[]): QuizStep | null {
  const prefix = `étape ${stepNumber} : `
  if (!isObject(raw)) {
    errors.push(`${prefix}doit contenir « titre », « consigne », « type_reponse », « reponse » et « chiffre ».`)
    return null
  }
  const before = errors.length
  if (!isNonEmptyString(raw.titre)) errors.push(`${prefix}« titre » est obligatoire et doit être un texte non vide.`)
  if (!isNonEmptyString(raw.consigne)) errors.push(`${prefix}« consigne » est obligatoire et doit être un texte non vide.`)
  const answer = validateAnswer(raw, prefix, errors)
  if (!isIntInRange(raw.chiffre, 0, 9)) errors.push(`${prefix}« chiffre » doit être un chiffre entier entre 0 et 9.`)
  if (raw.image !== undefined && !isNonEmptyString(raw.image)) errors.push(`${prefix}« image » doit être un nom de fichier.`)
  // Quizzes written before sprint 7 use `solution`: explain the new keys instead of "unknown key".
  if (raw.solution !== undefined) {
    errors.push(`${prefix}« solution » a été remplacée par « reponse » (ce que tapent les enfants) et « chiffre » (le chiffre gagné).`)
  }
  errors.push(...unknownKeyErrors(raw, [...STEP_KEYS, 'solution'], prefix))
  if (errors.length > before || answer === null) return null
  return {
    title: raw.titre as string,
    instruction: raw.consigne as string,
    ...(raw.image !== undefined && { image: raw.image as string }),
    answer,
    digit: raw.chiffre as number,
  }
}
```

In `src/config/validateQuiz.ts`:
- import `validateEntrance` from `./validateEntrance`;
- `ROOT_KEYS` gains `'entree'`: `['titre', 'intro', 'duree_minutes', 'nombre_etapes', 'entree', 'etapes', 'cadenas'] as const`;
- right after the `intro` check add `const entrance = validateEntrance(raw.entree, errors)`;
- the failure test becomes `if (errors.length > 0 || padlock === null || entrance === null) return { ok: false, errors }`;
- the config object gains, after `padlock,`: `...(entrance && { entrance }),`.

- [ ] **Step 6: Implement the game side**
  - `src/game/answer.ts`: delete `isCorrectAnswer` and its JSDoc; drop `QuizStep` from the type import.
  - `src/game/padlock.ts`: JSDoc line `Code that opens the padlock: the step solutions taken in the configured order.` → `…: the step digits taken in the configured order.`; `@example` comment → `// [digit of step 3, of step 1, of step 2]`; body → `return order.map((stepNumber) => steps[stepNumber - 1].digit)`.
  - `src/game/progress.ts`: import `isRightAnswer` instead of `isCorrectAnswer`; the action becomes `{ type: 'answer'; text: string }`; the `answer` case becomes
    ```ts
      case 'answer': {
        if (state.status !== 'playing' || isCurrentStepSolved(state)) return state
        const step = steps[state.stepIndex]
        return isRightAnswer(action.text, step.answer)
          ? { ...state, foundDigits: [...state.foundDigits, step.digit], wrongAttempts: 0 }
          : { ...state, wrongAttempts: state.wrongAttempts + 1 }
      }
    ```
    and the `foundDigits` field comment becomes `/** Digits earned on solved steps, in step order. */`.
  - `src/hooks/useGameProgress.ts`: `answer(digit: number)` → `answer(text: string)` with JSDoc `/** Submits the typed answer of the current step. */`; implementation `answer: (text) => dispatch({ type: 'answer', text })`.
  - `src/components/Game.tsx`: `onDigit={answer}` → `onDigit={(digit) => answer(String(digit))}` (temporary until Task 5).

- [ ] **Step 7: Rewrite `quiz.yaml`** — keep the header comments; replace the step rules comment, add `entree`, and use fictive challenges whose digits keep the old code (4, 7, 2, 9, 0, 5 → padlock code 2 4 5 7 0 9):

```yaml
# Message d'entrée, lu devant la porte du restaurant. Section facultative.
# Sa bonne réponse fait entrer les enfants dans la salle et démarre le compteur.
# Sans cette section, le compteur démarre dès « Commencer ».
#   titre         facultatif, texte non vide (par défaut : « Le message d'entrée »)
#   message       obligatoire, texte non vide ; « | » permet d'écrire sur plusieurs lignes
#   type_reponse  obligatoire : chiffres (pavé numérique) ou mots (clavier de lettres)
#   reponse       obligatoire, ce que les enfants doivent taper (voir les règles plus bas)
entree:
  titre: "Une lettre sous la porte"
  message: |
    Chers visiteurs,
    le fantôme du chef a verrouillé son restaurant.
    Qui suis-je ? Je traverse les murs et je fais « Bouh ! ».
  type_reponse: mots
  reponse: "Fantôme"

# Liste des étapes (une étape = une épreuve), dans l'ordre où les enfants les jouent.
# Chaque étape commence par « - » et contient :
#   titre         obligatoire, texte non vide
#   consigne      obligatoire, texte non vide (ce que les enfants doivent faire)
#   image         facultatif, nom d'un fichier placé dans public/images/
#   type_reponse  obligatoire : chiffres ou mots
#   reponse       obligatoire, la bonne réponse de l'épreuve :
#                   - chiffres : uniquement des chiffres, 12 au plus ; mettre des guillemets
#                     pour garder un 0 au début ("0472")
#                   - mots : lettres, espaces, apostrophes ou tirets, 24 caractères au plus ;
#                     majuscules et accents ne comptent pas
#   chiffre       obligatoire, le chiffre (0 à 9) gagné pour le cadenas final
etapes:
  - titre: "La crypte"
    consigne: "Comptez toutes les chauves-souris en papier cachées dans la salle."
    type_reponse: chiffres
    reponse: "13"
    chiffre: 4

  - titre: "Le chaudron"
    consigne: "Goûtez la potion les yeux bandés. Quel animal la sorcière a-t-elle mis dedans ?"
    type_reponse: mots
    reponse: "Crapaud"
    chiffre: 7

  - titre: "La bibliothèque"
    consigne: "Le code du coffre à livres est écrit à l'envers sur le miroir."
    type_reponse: chiffres
    reponse: "0472"
    chiffre: 2

  - titre: "Le cimetière"
    consigne: "Additionnez les années gravées sur les trois tombes à citrouille."
    type_reponse: chiffres
    reponse: "1832"
    chiffre: 9

  - titre: "Le grenier"
    consigne: "Qu'a tissé l'araignée géante au-dessus de la malle ?"
    type_reponse: mots
    reponse: "Toile d'araignée"
    chiffre: 0

  - titre: "La porte de la cuisine"
    consigne: "Quel légume orange le chef creuse-t-il pour Halloween ?"
    type_reponse: mots
    reponse: "Citrouille"
    chiffre: 5
```

`nombre_etapes: 6`, `cadenas` (ordre `[3, 1, 6, 2, 5, 4]`, indice, titre, message) stay as they are. The `cadenas.ordre` comment `chiffre de l'étape 3, puis de l'étape 1…` stays true.

- [ ] **Step 8: Run everything** — `npm run test:run` → PASS; `npm run typecheck` → OK; `npm run valider` → « quiz.yaml est valide » (or the script's success line). `grep -rn "solution" src` must only show `validateStep.ts`, `validateStep.test.ts` and `checks.test.ts` (the unknown-key example). Playwright specs are rewritten in Task 7 and are expected to fail until then.

- [ ] **Step 9: Commit**

```bash
git add -A src quiz.yaml
git commit -m "feat: replace step solution with typed answer and earned digit (#14)"
```

---

### Task 4: Answer keyboards and `AnswerInput`

**Files:**
- Modify: `src/components/Keypad.tsx`, `src/components/Keypad.test.tsx`, `src/styles/controls.css`, `src/main.tsx`
- Create: `src/components/LetterKeyboard.tsx`, `src/components/LetterKeyboard.test.tsx`, `src/components/AnswerInput.tsx`, `src/components/AnswerInput.test.tsx`, `src/styles/keyboard.css`

**Interfaces:**
- Consumes: `appendToAnswer`, `normalizeAnswer` (Task 1), `AnswerKind`.
- Produces: `interface AnswerKeysProps { onKey(char: string): void; onErase(): void; onSubmit(): void; canSubmit: boolean }` (exported from `Keypad.tsx`); `Keypad(props: AnswerKeysProps)`; `LetterKeyboard(props: AnswerKeysProps)`; `AnswerInput({ kind, onSubmit }: { kind: AnswerKind; onSubmit(text: string): void })`.
- Button names used by tests: digits `'0'`…`'9'`, letters `'A'`…`'Z'`, `'Apostrophe'`, `'Tiret'`, `'Espace'`, `'Effacer'`, `'Valider'`. Typed text: `getByLabelText('Réponse tapée')`.
- Until Task 5 wires it, `StepScreen` must keep compiling: in this task change `StepScreen`'s keypad line to `<Keypad onKey={(c) => onDigit(Number(c))} onErase={() => {}} onSubmit={() => {}} canSubmit={false} />` (temporary, replaced in Task 5; a digit tap still answers). In `src/components/StepScreen.test.tsx`, the first test's `toHaveLength(10)` becomes `toHaveLength(12)` (Effacer and Valider added).

- [ ] **Step 1: Write the failing tests** — replace `src/components/Keypad.test.tsx`:

```tsx
/** @file Tests for the digit keypad. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Keypad, type AnswerKeysProps } from './Keypad'

const props = (): AnswerKeysProps => ({ onKey: vi.fn(), onErase: vi.fn(), onSubmit: vi.fn(), canSubmit: true })

describe('Keypad', () => {
  it('shows 1 to 9, then Effacer, 0 and Valider', () => {
    render(<Keypad {...props()} />)
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent))
      .toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Effacer', '0', 'Valider'])
  })
  it('sends digits as text, erases and submits', async () => {
    const p = props()
    render(<Keypad {...p} />)
    await userEvent.click(screen.getByRole('button', { name: '0' }))
    await userEvent.click(screen.getByRole('button', { name: 'Effacer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(p.onKey).toHaveBeenCalledWith('0')
    expect(p.onErase).toHaveBeenCalledOnce()
    expect(p.onSubmit).toHaveBeenCalledOnce()
  })
  it('disables Valider when there is nothing to submit', () => {
    render(<Keypad {...props()} canSubmit={false} />)
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
  })
})
```

`src/components/LetterKeyboard.test.tsx`:

```tsx
/** @file Tests for the AZERTY letter keyboard. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnswerKeysProps } from './Keypad'
import { LetterKeyboard } from './LetterKeyboard'

const props = (): AnswerKeysProps => ({ onKey: vi.fn(), onErase: vi.fn(), onSubmit: vi.fn(), canSubmit: true })

describe('LetterKeyboard', () => {
  it('lays out the 26 letters in AZERTY order, with apostrophe, dash, space, erase and submit', () => {
    render(<LetterKeyboard {...props()} />)
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent)
    expect(names).toEqual([...'AZERTYUIOPQSDFGHJKLMWXCVBN', 'Apostrophe', 'Tiret', 'Espace', 'Effacer', 'Valider'])
  })
  it('sends letters, apostrophe, dash and space as characters', async () => {
    const p = props()
    render(<LetterKeyboard {...p} />)
    for (const name of ['Q', 'Apostrophe', 'Tiret', 'Espace']) await userEvent.click(screen.getByRole('button', { name, exact: true }))
    expect(p.onKey.mock.calls).toEqual([['Q'], ["'"], ['-'], [' ']])
  })
  it('erases, submits, and disables Valider when empty', async () => {
    const p = props()
    const { rerender } = render(<LetterKeyboard {...p} />)
    await userEvent.click(screen.getByRole('button', { name: 'Effacer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(p.onErase).toHaveBeenCalledOnce()
    expect(p.onSubmit).toHaveBeenCalledOnce()
    rerender(<LetterKeyboard {...p} canSubmit={false} />)
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
  })
})
```

`src/components/AnswerInput.test.tsx`:

```tsx
/** @file Tests for the typed answer and its keyboard. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnswerInput } from './AnswerInput'

const typed = () => screen.getByLabelText('Réponse tapée')
const press = (name: string) => userEvent.click(screen.getByRole('button', { name, exact: true }))

describe('AnswerInput', () => {
  it('uses the keypad for digits and submits the typed code', async () => {
    const onSubmit = vi.fn()
    render(<AnswerInput kind="digits" onSubmit={onSubmit} />)
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
    for (const d of ['0', '4', '7', '9']) await press(d)
    await press('Effacer')
    await press('2')
    expect(typed()).toHaveTextContent('0472')
    await press('Valider')
    expect(onSubmit).toHaveBeenCalledWith('0472')
  })
  it('uses the letter keyboard for words', async () => {
    const onSubmit = vi.fn()
    render(<AnswerInput kind="letters" onSubmit={onSubmit} />)
    for (const k of ['C', 'H', 'A', 'T']) await press(k)
    await press('Valider')
    expect(onSubmit).toHaveBeenCalledWith('CHAT')
  })
  it('keeps Valider disabled for spaces only', async () => {
    render(<AnswerInput kind="letters" onSubmit={vi.fn()} />)
    await press('Espace')
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
  })
  it('stops at 12 digits', async () => {
    render(<AnswerInput kind="digits" onSubmit={vi.fn()} />)
    for (let i = 0; i < 14; i++) await press('1')
    expect(typed()).toHaveTextContent('1'.repeat(12))
  })
})
```

- [ ] **Step 2: Run to verify they fail** — `npm run test:run -- src/components/Keypad.test.tsx src/components/LetterKeyboard.test.tsx src/components/AnswerInput.test.tsx` → FAIL.

- [ ] **Step 3: Implement** — replace `src/components/Keypad.tsx`:

```tsx
/** @file Digit keypad of wax-seal buttons, phone layout: 1–9, then Effacer, 0, Valider. */

/** Props shared by both answer keyboards. */
export interface AnswerKeysProps {
  /** Called with the pressed character. */
  onKey(char: string): void
  onErase(): void
  onSubmit(): void
  /** False while the typed answer is empty (Valider is then disabled). */
  canSubmit: boolean
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Keypad for answers made of digits.
 * @param props See AnswerKeysProps.
 * @returns The keypad.
 */
export function Keypad({ onKey, onErase, onSubmit, canSubmit }: AnswerKeysProps) {
  return (
    <div className="keypad">
      {DIGITS.map((d) => <button key={d} type="button" onClick={() => onKey(d)}>{d}</button>)}
      <button type="button" className="key-erase" aria-label="Effacer" onClick={onErase}>⌫</button>
      <button type="button" onClick={() => onKey('0')}>0</button>
      <button type="button" className="key-submit" disabled={!canSubmit} onClick={onSubmit}>Valider</button>
    </div>
  )
}
```

`src/components/LetterKeyboard.tsx`:

```tsx
/** @file AZERTY letter keyboard drawn in the app: the system keyboard would hide half the screen. */
import type { AnswerKeysProps } from './Keypad'

const ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', "WXCVBN'-"]
/** Spoken names for the two keys whose glyph alone is unclear. */
const LABELS: Readonly<Record<string, string>> = { "'": 'Apostrophe', '-': 'Tiret' }

/**
 * Keyboard for answers made of words.
 * @param props See AnswerKeysProps.
 * @returns The keyboard.
 */
export function LetterKeyboard({ onKey, onErase, onSubmit, canSubmit }: AnswerKeysProps) {
  return (
    <div className="letter-keyboard">
      {ROWS.map((row) => (
        <div key={row} className="key-row">
          {[...row].map((c) => <button key={c} type="button" aria-label={LABELS[c]} onClick={() => onKey(c)}>{c}</button>)}
        </div>
      ))}
      <div className="key-row">
        <button type="button" className="key-space" onClick={() => onKey(' ')}>Espace</button>
        <button type="button" className="key-erase" aria-label="Effacer" onClick={onErase}>⌫</button>
        <button type="button" className="key-submit" disabled={!canSubmit} onClick={onSubmit}>Valider</button>
      </div>
    </div>
  )
}
```

`src/components/AnswerInput.tsx`:

```tsx
/** @file Typed answer display plus the keyboard matching the answer kind. */
import { useState } from 'react'
import type { AnswerKind } from '../config/types'
import { appendToAnswer, normalizeAnswer } from '../game/answer'
import { Keypad, type AnswerKeysProps } from './Keypad'
import { LetterKeyboard } from './LetterKeyboard'

/** Props of AnswerInput. */
export interface AnswerInputProps {
  kind: AnswerKind
  /** Called with the typed text when Valider is pressed. */
  onSubmit(text: string): void
}

/**
 * Lets children type an answer. The parent remounts it (React key) after a wrong answer,
 * which clears the typed text.
 * @param props See AnswerInputProps.
 * @returns The typed answer and its keyboard.
 */
export function AnswerInput({ kind, onSubmit }: AnswerInputProps) {
  const [text, setText] = useState('')
  const canSubmit = normalizeAnswer(text, kind).length > 0
  const keys: AnswerKeysProps = {
    onKey: (char) => setText((current) => appendToAnswer(current, char, kind)),
    onErase: () => setText((current) => current.slice(0, -1)),
    onSubmit: () => { if (canSubmit) onSubmit(text) },
    canSubmit,
  }
  return (
    <div className="answer-input">
      {/* A no-break space keeps the line height while nothing is typed. */}
      <output className={`typed typed--${kind}`} aria-label="Réponse tapée">{text || ' '}</output>
      {kind === 'digits' ? <Keypad {...keys} /> : <LetterKeyboard {...keys} />}
    </div>
  )
}
```

Apply the temporary `StepScreen` keypad line from the Interfaces block.

- [ ] **Step 4: Styles** — in `src/styles/controls.css`:
  - `--key: 124px;` → `--key: 112px;` (four rows now);
  - delete the rule `.keypad button:last-child { grid-column: 2; }` and its comment;
  - add after the `.keypad button` rule:
    ```css
    .keypad .key-submit { font-family: var(--title-font); font-size: 26px; font-weight: 400; }
    .keypad .key-erase, .letter-keyboard .key-erase { background: #3a2a1e; }
    button:disabled { opacity: .4; }
    ```
  Create `src/styles/keyboard.css`:
    ```css
    /** @file Typed answer line and the AZERTY letter keyboard (wooden keys). */
    .answer-input { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .typed {
      min-width: 6em; padding: 0 16px 6px;
      border-bottom: 3px solid var(--bronze);
      font-family: var(--title-font); font-size: 52px; letter-spacing: .12em;
      font-variant-numeric: lining-nums; white-space: pre;
    }
    .typed--digits { font-family: var(--text-font); font-weight: 700; }

    .letter-keyboard { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .key-row { display: flex; gap: 8px; }
    .letter-keyboard button {
      width: 66px; height: 70px; border-radius: 10px;
      font-family: var(--title-font); font-size: 34px;
      background: linear-gradient(#4a3526, #2e2016);
      border: 1px solid #6b5138;
      box-shadow: 0 4px 8px rgb(0 0 0 / .6);
    }
    .letter-keyboard button:active { transform: translateY(3px); box-shadow: 0 1px 3px rgb(0 0 0 / .6); }
    .letter-keyboard .key-space { width: 280px; font-size: 26px; }
    .letter-keyboard .key-erase { width: 110px; }
    .letter-keyboard .key-submit {
      width: 180px; font-size: 26px; color: #2b1d12;
      background: linear-gradient(#e6c27a, #a7792f);
    }

    @media (max-width: 600px) {
      .typed { font-size: 36px; }
      .key-row { gap: 4px; }
      .letter-keyboard button { width: 32px; height: 52px; font-size: 22px; border-radius: 6px; }
      .letter-keyboard .key-space { width: 130px; font-size: 18px; }
      .letter-keyboard .key-erase { width: 56px; }
      .letter-keyboard .key-submit { width: 100px; font-size: 18px; }
    }
    ```
  In `src/main.tsx`, add `import './styles/keyboard.css'` after `./styles/controls.css`.

- [ ] **Step 5: Run to verify** — `npm run test:run` → PASS (whole suite); `npm run typecheck` → OK.

- [ ] **Step 6: Commit**

```bash
git add src/components/Keypad.tsx src/components/Keypad.test.tsx src/components/LetterKeyboard.tsx src/components/LetterKeyboard.test.tsx src/components/AnswerInput.tsx src/components/AnswerInput.test.tsx src/components/StepScreen.tsx src/components/StepScreen.test.tsx src/styles/controls.css src/styles/keyboard.css src/main.tsx
git commit -m "feat: add digit keypad with submit and AZERTY letter keyboard (#14)"
```

---

### Task 5: Steps use the typed answer

**Files:**
- Modify: `src/components/StepScreen.tsx`, `src/components/StepScreen.test.tsx`, `src/components/Game.tsx`, `src/components/Game.test.tsx`, `src/game/messages.ts`

**Interfaces:**
- Consumes: `AnswerInput` (Task 4), `GameProgress.answer(text)` (Task 3).
- Produces: `StepScreenProps.onSubmit(text: string): void` (replaces `onDigit`).

- [ ] **Step 1: Write the failing tests** — in `src/components/StepScreen.test.tsx`:
  - `base`: `onDigit: () => {}` → `onSubmit: () => {}`;
  - first test: add `expect(screen.getByLabelText('Réponse tapée')).toBeInTheDocument()`;
  - replace the "sends keypad digits" test with:
    ```tsx
    it('submits the typed code', async () => {
      const onSubmit = vi.fn()
      render(<StepScreen {...base} onSubmit={onSubmit} />)
      await userEvent.click(screen.getByRole('button', { name: '1' }))
      await userEvent.click(screen.getByRole('button', { name: '3' }))
      await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
      expect(onSubmit).toHaveBeenCalledWith('13')
    })
    it('shows the letter keyboard for a words answer', () => {
      render(<StepScreen {...base} step={{ ...base.step, answer: { kind: 'letters', value: 'Crapaud' } }} />)
      expect(screen.getByRole('button', { name: 'Espace' })).toBeInTheDocument()
    })
    ```
  In `src/components/Game.test.tsx`, first test: replace `await user.click(screen.getByRole('button', { name: '1' }))` by clicks on `'1'` then `'Valider'`; replace the click on `'4'` by clicks on `'4'` then `'Valider'`; replace the click on `'0'` by `'0'` then `'Valider'`. Second test: replace `fireEvent.click(screen.getByRole('button', { name: '4' }))` by `fireEvent.click(screen.getByRole('button', { name: '4' }))` then `fireEvent.click(screen.getByRole('button', { name: 'Valider' }))`.

- [ ] **Step 2: Run to verify they fail** — `npm run test:run -- src/components/StepScreen.test.tsx src/components/Game.test.tsx` → FAIL.

- [ ] **Step 3: Implement** — in `src/components/StepScreen.tsx`:
  - file header → `/** @file Step screen: challenge instruction, typed answer, then the earned digit and a button to go on. */`;
  - import `AnswerInput` from `./AnswerInput` instead of `Keypad`;
  - props: replace `onDigit(digit: number): void` with `/** Called with the typed answer. */ onSubmit(text: string): void`; the `foundDigit` comment becomes `/** Digit earned on this step, undefined while unsolved. */`;
  - destructure `onSubmit` instead of `onDigit`;
  - replace the keypad line with `<AnswerInput kind={step.answer.kind} onSubmit={onSubmit} />` and extend the existing comment above the zone: `// Changing key on each wrong try remounts the zone: replays the shake and clears the typed answer.`

  In `src/components/Game.tsx`: `onDigit={(digit) => answer(String(digit))}` → `onSubmit={answer}`.

  In `src/game/messages.ts`: `'Pas tout à fait. Relisez bien l’énigme !'` → `'Pas tout à fait. Vérifiez votre réponse !'` (children now answer a real challenge, not a riddle).

- [ ] **Step 4: Run to verify** — `npm run test:run` → PASS; `npm run typecheck` → OK.

- [ ] **Step 5: Commit**

```bash
git add src/components/StepScreen.tsx src/components/StepScreen.test.tsx src/components/Game.tsx src/components/Game.test.tsx src/game/messages.ts
git commit -m "feat: answer steps with a typed code or word (#14)"
```

---

### Task 6: Entrance status, save and screen

**Files:**
- Modify: `src/game/progress.ts`, `src/game/progress.test.ts`, `src/game/restore.ts`, `src/game/restore.test.ts`, `src/hooks/useGameProgress.ts`, `src/hooks/useGameProgress.test.ts`, `src/components/Game.tsx`, `src/components/Game.test.tsx`, `src/styles/screens.css`
- Create: `src/components/EntranceScreen.tsx`, `src/components/EntranceScreen.test.tsx`

**Interfaces:**
- Consumes: `EntranceConfig` (Task 2), `AnswerInput` (Task 4), `isRightAnswer`.
- Produces: `GameStatus` gains `'entrance'`; `GameAction` gains `{ type: 'enter'; text: string; now: number }`; `createGameReducer(steps, code, entranceAnswer?: ExpectedAnswer)`; `GameProgress.enter(text: string): void`; `EntranceScreen({ entrance, wrongAttempts, onSubmit })`; `DEFAULT_ENTRANCE_TITLE = 'Le message d’entrée'`.

- [ ] **Step 1: Write the failing reducer and restore tests** — append to `src/game/progress.test.ts` (inside the `describe`), with a second reducer at the top of the file:

```ts
const withEntrance = createGameReducer(steps, [0, 4], { kind: 'letters', value: 'Fantôme' })
const atEntrance: GameState = { ...initialGameState, status: 'entrance' }
```

```ts
  it('goes to the entrance first when there is one, without starting the clock', () => {
    expect(withEntrance(initialGameState, { type: 'start', now: 1000 })).toEqual(atEntrance)
  })
  it('counts wrong entrance answers', () => {
    expect(withEntrance(atEntrance, { type: 'enter', text: 'chat', now: 2000 })).toEqual({ ...atEntrance, wrongAttempts: 1 })
  })
  it('starts the clock when the entrance is solved', () => {
    const wrong = withEntrance(atEntrance, { type: 'enter', text: 'chat', now: 2000 })
    expect(withEntrance(wrong, { type: 'enter', text: 'fantome', now: 3000 })).toEqual({ ...playing, startedAt: 3000 })
  })
  it('ignores enter outside of the entrance', () => {
    expect(withEntrance(playing, { type: 'enter', text: 'fantome', now: 3000 })).toBe(playing)
    expect(reduce(atEntrance, { type: 'enter', text: 'fantome', now: 3000 })).toBe(atEntrance)
  })
  it('ignores step answers at the entrance', () => {
    expect(withEntrance(atEntrance, { type: 'answer', text: '14' })).toBe(atEntrance)
  })
```

(`reduce` has no entrance answer: `enter` must return the same state.)

In `src/game/restore.test.ts` add:

```ts
  it('restores the entrance screen', () => {
    const entrance = { status: 'entrance', stepIndex: 0, foundDigits: [], startedAt: null, finishedAt: null, wrongAttempts: 2 }
    expect(restoreGameState(entrance, 2)).toEqual({ ...entrance, wrongAttempts: 0 })
  })
```

and in the `it.each` rejection table:

```ts
    ['entrance with a start time', { status: 'entrance', stepIndex: 0, foundDigits: [], startedAt: 1000, finishedAt: null }],
    ['entrance with digits', { status: 'entrance', stepIndex: 0, foundDigits: [4], startedAt: null, finishedAt: null }],
    ['entrance on step 2', { status: 'entrance', stepIndex: 1, foundDigits: [], startedAt: null, finishedAt: null }],
```

- [ ] **Step 2: Run to verify they fail** — `npm run test:run -- src/game` → FAIL.

- [ ] **Step 3: Implement the reducer** — in `src/game/progress.ts`:
  - header → `/** @file Game state machine: home → entrance (optional) → playing (step by step) → padlock → won. Pure, so it can be saved and restored. */`;
  - import `ExpectedAnswer` with `QuizStep`;
  - `export type GameStatus = 'home' | 'entrance' | 'playing' | 'padlock' | 'won'`;
  - `startedAt` comment → `/** Start timestamp in ms, null until the group is in the room. */`;
  - `GameAction` gains `| { type: 'enter'; text: string; now: number }`;
  - `createGameReducer(steps: readonly QuizStep[], code: readonly number[], entranceAnswer?: ExpectedAnswer)`, JSDoc `@param entranceAnswer Answer of the entrance message, if the quiz has one.`;
  - cases:
    ```ts
      case 'start':
        if (state.status !== 'home') return state
        // With an entrance message the clock waits until the group is in the room.
        return entranceAnswer ? { ...state, status: 'entrance' } : { ...state, status: 'playing', startedAt: action.now }
      case 'enter':
        if (state.status !== 'entrance' || !entranceAnswer) return state
        return isRightAnswer(action.text, entranceAnswer)
          ? { ...state, status: 'playing', startedAt: action.now, wrongAttempts: 0 }
          : { ...state, wrongAttempts: state.wrongAttempts + 1 }
    ```

  In `src/game/restore.ts`:
  - import `initialGameState` (value) with the types from `./progress`;
  - `const RESUMABLE: readonly string[] = ['entrance', 'playing', 'padlock', 'won']`;
  - right after the `RESUMABLE` check:
    ```ts
      // The entrance comes before any progress: nothing else may be set.
      if (status === 'entrance') {
        const fresh = stepIndex === 0 && Array.isArray(foundDigits) && foundDigits.length === 0
          && startedAt === null && finishedAt === null
        return fresh ? { ...initialGameState, status: 'entrance' } : null
      }
    ```

- [ ] **Step 4: Run the game tests** — `npm run test:run -- src/game` → PASS.

- [ ] **Step 5: Write the failing screen and hook tests** — `src/components/EntranceScreen.test.tsx`:

```tsx
/** @file Tests for the entrance message screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntranceScreen, DEFAULT_ENTRANCE_TITLE } from './EntranceScreen'
import { WRONG_ANSWER_MESSAGES } from '../game/messages'

const entrance = { title: 'Une lettre', message: 'Qui suis-je ?', answer: { kind: 'letters', value: 'Fantôme' } } as const

describe('EntranceScreen', () => {
  it('shows the title, the message and the letter keyboard, without clock', () => {
    render(<EntranceScreen entrance={entrance} wrongAttempts={0} onSubmit={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Une lettre' })).toBeInTheDocument()
    expect(screen.getByText('Qui suis-je ?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Espace' })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })
  it('uses a default title', () => {
    const { title: _title, ...untitled } = entrance
    render(<EntranceScreen entrance={untitled} wrongAttempts={0} onSubmit={vi.fn()} />)
    expect(screen.getByRole('heading', { name: DEFAULT_ENTRANCE_TITLE })).toBeInTheDocument()
  })
  it('submits the typed answer', async () => {
    const onSubmit = vi.fn()
    render(<EntranceScreen entrance={entrance} wrongAttempts={0} onSubmit={onSubmit} />)
    for (const k of ['B', 'O', 'U', 'H']) await userEvent.click(screen.getByRole('button', { name: k, exact: true }))
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(onSubmit).toHaveBeenCalledWith('BOUH')
  })
  it('shakes and shows a kind message after a wrong answer', () => {
    const { container } = render(<EntranceScreen entrance={entrance} wrongAttempts={1} onSubmit={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent(WRONG_ANSWER_MESSAGES[0])
    expect(container.querySelector('.shake')).not.toBeNull()
  })
})
```

In `src/hooks/useGameProgress.test.ts` add:

```ts
  it('starts the clock only once the entrance is solved', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T14:00:00Z'))
    const withEntrance: QuizConfig = { ...config, entrance: { message: 'm', answer: { kind: 'letters', value: 'Bouh' } } }
    const { result } = renderHook(() => useGameProgress(withEntrance))
    act(() => result.current.start())
    expect(result.current.state).toMatchObject({ status: 'entrance', startedAt: null })
    vi.setSystemTime(new Date('2026-10-31T14:05:00Z'))
    act(() => result.current.enter('bouh'))
    expect(result.current.state).toMatchObject({ status: 'playing', startedAt: Date.parse('2026-10-31T14:05:00Z') })
  })
```

In `src/components/Game.test.tsx` add a test:

```tsx
  it('shows the entrance message before the first step and starts the clock on the right answer', async () => {
    const user = userEvent.setup()
    render(<Game config={{ ...config, entrance: { message: 'Qui suis-je ?', answer: { kind: 'letters', value: 'Bouh' } } }} />)
    await user.click(screen.getByRole('button', { name: 'Commencer' }))
    expect(screen.getByText('Qui suis-je ?')).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    for (const k of ['B', 'O', 'U', 'H']) await user.click(screen.getByRole('button', { name: k, exact: true }))
    await user.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('90:00')
  })
```

- [ ] **Step 6: Run to verify they fail** — `npm run test:run` → FAIL (EntranceScreen missing, `enter` missing).

- [ ] **Step 7: Implement** — `src/components/EntranceScreen.tsx`:

```tsx
/** @file Entrance screen: the message read before entering the haunted restaurant, and its answer. */
import type { EntranceConfig } from '../config/types'
import { wrongAnswerMessage } from '../game/messages'
import { AnswerInput } from './AnswerInput'

/** Title shown when quiz.yaml has no `entree.titre`. */
export const DEFAULT_ENTRANCE_TITLE = 'Le message d’entrée'

/** Props of EntranceScreen. */
export interface EntranceScreenProps {
  entrance: EntranceConfig
  /** Wrong tries so far. */
  wrongAttempts: number
  /** Called with the typed answer. */
  onSubmit(text: string): void
}

/**
 * Message in front of the restaurant door; no clock yet.
 * @param props See EntranceScreenProps.
 * @returns The entrance screen.
 */
export function EntranceScreen({ entrance, wrongAttempts, onSubmit }: EntranceScreenProps) {
  return (
    <main className="screen entrance">
      <h2>{entrance.title ?? DEFAULT_ENTRANCE_TITLE}</h2>
      <p className="entrance-message">{entrance.message}</p>
      {/* Changing key on each wrong try remounts the zone: replays the shake and clears the typed answer. */}
      <div key={wrongAttempts} className={wrongAttempts > 0 ? 'answer-zone shake' : 'answer-zone'}>
        {wrongAttempts > 0 && <p className="wrong-answer" role="alert">{wrongAnswerMessage(wrongAttempts)}</p>}
        <AnswerInput kind={entrance.answer.kind} onSubmit={onSubmit} />
      </div>
    </main>
  )
}
```

`src/styles/screens.css`, after the Step block:

```css
/* Entrance: the message keeps the line breaks written in quiz.yaml. */
.entrance h2 { margin: 40px 0 24px; }
.entrance-message { font-size: 34px; line-height: 1.45; max-width: 19em; white-space: pre-line; font-style: italic; }
```

and in the phone media query add `.entrance-message { font-size: 24px; }`.

`src/hooks/useGameProgress.ts`:
- `GameProgress` gains `/** Submits the answer of the entrance message; the right one starts the clock. */ enter(text: string): void` and the `start` comment becomes `/** Leaves the home screen: to the entrance message, or straight to step 1 with the clock. */`;
- `const reducer = useMemo(() => createGameReducer(steps, code, config.entrance?.answer), [steps, code, config.entrance])`;
- returned object gains `enter: (text) => dispatch({ type: 'enter', text, now: Date.now() }),`.

`src/components/Game.tsx`:
- import `EntranceScreen`;
- destructure `enter` too in `currentScreen`;
- before the home check:
  ```tsx
  if (status === 'entrance' && config.entrance) {
    return <EntranceScreen entrance={config.entrance} wrongAttempts={state.wrongAttempts} onSubmit={enter} />
  }
  ```

- [ ] **Step 8: Run to verify** — `npm run test:run` → PASS; `npm run typecheck` → OK; `npm run lint` → no new error.

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat: add entrance message that starts the clock (#14)"
```

---

### Task 7: End-to-end paths and documentation

**Files:**
- Modify: `e2e/game.spec.ts`, `e2e/save-and-reset.spec.ts`, `README.md`, `CLAUDE.md`
- Create: `e2e/typing.ts` (helper)

**Interfaces:**
- Consumes: sample `quiz.yaml` (Task 3): entrance « Fantôme »; steps (answer → digit) 13→4, Crapaud→7, 0472→2, 1832→9, Toile d'araignée→0, Citrouille→5; padlock code 2 4 5 7 0 9; titles « Une lettre sous la porte », « La crypte ».
- Produces: `typeAnswer(page: Page, text: string): Promise<void>` — taps each key then Valider.

- [ ] **Step 1: Helper** — `e2e/typing.ts`:

```ts
/** @file Types an answer on the in-app keypad or letter keyboard, then taps Valider. */
import type { Page } from '@playwright/test'

const KEY_NAMES: Readonly<Record<string, string>> = { ' ': 'Espace', "'": 'Apostrophe', '-': 'Tiret' }

/**
 * @param page Playwright page showing an answer keyboard.
 * @param text Answer in capitals (letters) or digits.
 */
export async function typeAnswer(page: Page, text: string): Promise<void> {
  for (const char of text) await page.getByRole('button', { name: KEY_NAMES[char] ?? char, exact: true }).click()
  await page.getByRole('button', { name: 'Valider', exact: true }).click()
}

/** Taps « Commencer » then solves the entrance message of the sample quiz. */
export async function enterRestaurant(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await typeAnswer(page, 'FANTOME')
}
```

- [ ] **Step 2: Rewrite `e2e/game.spec.ts`**

```ts
/** @file Critical paths of a game on a tablet: entrance, every challenge, padlock, and time running out. */
import { test, expect } from '@playwright/test'
import { enterRestaurant, typeAnswer } from './typing'

// Sample quiz.yaml: what the children type on each step, and the digit it earns.
const STEPS = [['13', 4], ['CRAPAUD', 7], ['0472', 2], ['1832', 9], ["TOILE D'ARAIGNEE", 0], ['CITROUILLE', 5]] as const

test('a group enters the restaurant, solves every challenge, then opens the padlock', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Une lettre sous la porte' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveCount(0)
  await typeAnswer(page, 'CHAT')
  await expect(page.getByRole('alert')).toBeVisible()
  await typeAnswer(page, 'FANTOME')

  await expect(page.getByRole('heading', { name: 'La crypte' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveText('90:00')
  await typeAnswer(page, '12')
  await expect(page.getByRole('alert')).toBeVisible()

  for (const [i, [answer, digit]] of STEPS.entries()) {
    await expect(page.getByText(`Étape ${i + 1} sur 6`)).toBeVisible()
    await typeAnswer(page, answer)
    await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
    await page.getByRole('button', { name: i === STEPS.length - 1 ? 'Continuer' : 'Étape suivante' }).click()
  }

  // Padlock code of the sample quiz: steps in order 3, 1, 6, 2, 5, 4.
  const CODE = [2, 4, 5, 7, 0, 9]
  await expect(page.getByRole('heading', { name: 'La porte du restaurant hanté' })).toBeVisible()
  for (const [i, digit] of CODE.entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
    await expect(page.getByLabel(`Chiffre ${i + 1}`, { exact: true })).toHaveText(String(digit))
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('heading', { name: 'La salle du restaurant hanté est ouverte !' })).toBeVisible()
  await expect(page.getByText(/^Temps : \d+ min \d{2} s$/)).toBeVisible()
})

test('the clock goes red and negative once time is up, and the game goes on', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await enterRestaurant(page)

  const clock = page.getByRole('timer')
  await expect(clock).toHaveText('90:00')
  await page.clock.fastForward('01:31:00')
  await expect(clock).toHaveText('-01:00')
  await expect(clock).toHaveClass(/clock--overtime/)

  await typeAnswer(page, '13')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 4')
})
```

Note: the old wrong-padlock-code check is dropped from this path to keep it short; it stays covered by `Game.test.tsx`.

- [ ] **Step 3: Update `e2e/save-and-reset.spec.ts`** — import `{ enterRestaurant, typeAnswer }` from `./typing`; in both tests replace `await page.getByRole('button', { name: 'Commencer', exact: true }).click()` + `await page.getByRole('button', { name: '4', exact: true }).click()` with `await enterRestaurant(page)` + `await typeAnswer(page, '13')`. Add:

```ts
test('the entrance message is still there after a reload, with no clock', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Une lettre sous la porte' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Une lettre sous la porte' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveCount(0)
})
```

- [ ] **Step 4: Run e2e** — stop any `vite preview` on port 4173 first (known pitfall), then `npm run test:e2e` → all PASS.

- [ ] **Step 5: Docs**
  - `README.md`: in the game description, step 1 becomes « Accueil, puis message d'entrée (facultatif) : la bonne réponse fait entrer dans le restaurant et démarre le compteur » ; step description becomes « Chaque étape est une épreuve réelle : les enfants tapent la bonne réponse (code en chiffres ou mot, sur un pavé ou un clavier de lettres dessinés dans l'appli) et gagnent le chiffre de l'étape » ; the YAML table gets a row `entree` (non : `message`, `type_reponse`, `reponse`, `titre` facultatif) and the `etapes` row lists `titre`, `consigne`, `type_reponse` (`chiffres` | `mots`), `reponse`, `chiffre` (0 à 9), `image` ; the error example `étape 1 : « solution » doit être…` becomes `étape 1 : « chiffre » doit être un chiffre entier entre 0 et 9.`
  - `CLAUDE.md`: « But » paragraph → épreuves réelles, réponse tapée (chiffres ou mots) qui donne un chiffre, message d'entrée qui démarre le compteur ; in « Structure », `src/game/` mentions `answer (normalisation chiffres/mots)` and `src/components/` mentions `EntranceScreen, AnswerInput, Keypad, LetterKeyboard` ; in « Pièges connus » add:
    - « **Réponses** : en `mots`, majuscules/accents/espaces autour ignorés (`normalizeAnswer`) ; en `chiffres`, les zéros de tête comptent et YAML lit `reponse: 0472` comme le nombre 472 → guillemets obligatoires pour un 0 initial. »
    - « **Saisie** : `AnswerInput` est un `<output>` (rôle `status`) : il n'est jamais affiché en même temps que « Chiffre trouvé », sinon `getByRole('status')` deviendrait ambigu. Le texte tapé s'efface après une mauvaise réponse (remontage par `key`). »
    - « **Entrée** : statut `entrance` avant `playing`, `startedAt` à null ; le compteur démarre à la bonne réponse. »

- [ ] **Step 6: Full verification** — `npm run typecheck && npm run test:run && npm run valider && npm run build` → all OK.

- [ ] **Step 7: Commit**

```bash
git add e2e README.md CLAUDE.md
git commit -m "test: cover entrance and typed answers end to end, update docs (#14)"
```

---

## After the tasks (sprint closing, not part of the tasks)

- Check in the browser (Playwright, 810×1080 and 360 px, fresh context): entrance, one digits step, one words step, letter keyboard fits on the phone width.
- `relecteur-code` agent review, then PR `Closes #14` (French description, screenshots).
