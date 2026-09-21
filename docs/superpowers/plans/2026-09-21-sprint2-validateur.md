# Sprint 2 — Validateur YAML — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load `quiz.yaml`, validate it against the spec’s 10 rules (collecting every error, in French), expose a typed `QuizConfig`, and block builds on invalid config.

**Architecture:** Pure validation functions in `src/config/` (no I/O), a browser loader importing `quiz.yaml?raw`, and a Node CLI `scripts/valider.ts` (run with `tsx`) that adds the image-existence check and runs as `prebuild`. French YAML keys are mapped to English identifiers in the typed config.

**Tech Stack:** `yaml` 2.x, `tsx`, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-21-quiz-halloween-design.md` (section « Validateur »)

## Global Constraints

- Code/identifiers in English; every error message in French, prefixed with its location (`étape 3 : `, `cadenas : `).
- Max 200 lines per file, JSDoc `@file` + JSDoc on exports, no `any`.
- The validator never stops at the first error.
- Branch `feat/yaml-validator`, commits `feat: ... (#<issue>)`, PR to `main` with `Closes #<issue>`.

---

### Task 1: Types and primitive checks

**Files:** Create `src/config/types.ts`, `src/config/checks.ts`, `src/config/checks.test.ts`.

**Interfaces — Produces:**
```ts
// types.ts
export interface QuizStep { title: string; instruction: string; image?: string; solution: number }
export interface PadlockConfig { order: number[]; hint?: string }   // order always filled (default 1..N)
export interface QuizConfig {
  title: string; intro?: string; durationMinutes: number; stepCount: number
  steps: QuizStep[]; padlock: PadlockConfig
}
export type ValidationResult = { ok: true; config: QuizConfig } | { ok: false; errors: string[] }
// checks.ts
export type RawObject = Record<string, unknown>
export function isObject(value: unknown): value is RawObject
export function isNonEmptyString(value: unknown): value is string
export function isIntInRange(value: unknown, min: number, max: number): value is number
export function unknownKeyErrors(obj: RawObject, allowed: readonly string[], prefix: string): string[]
```

- [ ] **Step 1: Failing tests** — `src/config/checks.test.ts`:

```ts
/** @file Tests for primitive validation helpers. */
import { isObject, isNonEmptyString, isIntInRange, unknownKeyErrors } from './checks'

describe('isObject', () => {
  it('accepts plain objects only', () => {
    expect(isObject({ a: 1 })).toBe(true)
    expect(isObject([])).toBe(false)
    expect(isObject(null)).toBe(false)
    expect(isObject('x')).toBe(false)
  })
})

describe('isNonEmptyString', () => {
  it('rejects empty, blank and non-strings', () => {
    expect(isNonEmptyString('Bou')).toBe(true)
    expect(isNonEmptyString('')).toBe(false)
    expect(isNonEmptyString('   ')).toBe(false)
    expect(isNonEmptyString(4)).toBe(false)
  })
})

describe('isIntInRange', () => {
  it('accepts bounds and rejects floats, strings and out-of-range', () => {
    expect(isIntInRange(0, 0, 9)).toBe(true)
    expect(isIntInRange(9, 0, 9)).toBe(true)
    expect(isIntInRange(10, 0, 9)).toBe(false)
    expect(isIntInRange(-1, 0, 9)).toBe(false)
    expect(isIntInRange(4.5, 0, 9)).toBe(false)
    expect(isIntInRange('4', 0, 9)).toBe(false)
  })
})

describe('unknownKeyErrors', () => {
  it('reports each unknown key with its location prefix', () => {
    expect(unknownKeyErrors({ titre: 'a', solutions: 4 }, ['titre', 'solution'], 'étape 2 : '))
      .toEqual(["étape 2 : « solutions » n'est pas un paramètre connu."])
  })
})
```

- [ ] **Step 2:** `npm run test:run -- src/config/checks.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** `src/config/types.ts` (exactly the interfaces above, with `@file` and one-line JSDoc per type) and `src/config/checks.ts`:

```ts
/** @file Primitive type guards shared by the quiz validators. */

/** Generic YAML mapping. */
export type RawObject = Record<string, unknown>

/** @returns true if value is a plain (non-array, non-null) object. */
export function isObject(value: unknown): value is RawObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @returns true if value is a string with at least one non-blank character. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** @returns true if value is an integer between min and max (inclusive). */
export function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

/**
 * Lists keys not in `allowed` — usually a typo such as `solutions` for `solution`.
 * @param prefix Location prefix prepended to each message (e.g. "étape 2 : ").
 * @returns One French message per unknown key.
 */
export function unknownKeyErrors(obj: RawObject, allowed: readonly string[], prefix: string): string[] {
  return Object.keys(obj)
    .filter((key) => !allowed.includes(key))
    .map((key) => `${prefix}« ${key} » n'est pas un paramètre connu.`)
}
```

- [ ] **Step 4:** tests PASS. **Step 5:** `git commit -m "feat: add config types and primitive checks (#<issue>)"`

### Task 2: Step and padlock validators

**Files:** Create `src/config/validateStep.ts`, `src/config/validatePadlock.ts`, `src/config/validateStep.test.ts`, `src/config/validatePadlock.test.ts`.

**Interfaces — Produces:**
```ts
export function validateStep(raw: unknown, stepNumber: number, errors: string[]): QuizStep | null
export function validatePadlock(raw: unknown, stepCount: number, errors: string[]): PadlockConfig | null
```
Both push French messages into `errors` and return `null` if anything is wrong. `stepNumber` is 1-based.

- [ ] **Step 1: Failing tests** — `src/config/validateStep.test.ts`:

```ts
/** @file Tests for single-step validation. */
import { validateStep } from './validateStep'

const valid = { titre: 'La crypte', consigne: 'Comptez les chauves-souris.', solution: 4 }

function run(raw: unknown) {
  const errors: string[] = []
  return { step: validateStep(raw, 3, errors), errors }
}

describe('validateStep', () => {
  it('maps a valid step to English keys', () => {
    expect(run({ ...valid, image: 'crypte.png' }).step).toEqual({
      title: 'La crypte', instruction: 'Comptez les chauves-souris.', image: 'crypte.png', solution: 4,
    })
  })
  it.each([0, 9])('accepts boundary solution %i', (solution) => {
    expect(run({ ...valid, solution }).errors).toEqual([])
  })
  it.each([10, -1, 4.5, '4', null])('rejects solution %s', (solution) => {
    expect(run({ ...valid, solution }).errors)
      .toEqual(['étape 3 : « solution » doit être un chiffre entier entre 0 et 9.'])
  })
  it('rejects a missing solution', () => {
    const { titre, consigne } = valid
    expect(run({ titre, consigne }).errors)
      .toEqual(['étape 3 : « solution » doit être un chiffre entier entre 0 et 9.'])
  })
  it('collects every error at once', () => {
    const { step, errors } = run({ titre: '', consigne: 12, solution: 'x', image: 3, solutions: 4 })
    expect(step).toBeNull()
    expect(errors).toEqual([
      'étape 3 : « titre » est obligatoire et doit être un texte non vide.',
      'étape 3 : « consigne » est obligatoire et doit être un texte non vide.',
      'étape 3 : « solution » doit être un chiffre entier entre 0 et 9.',
      'étape 3 : « image » doit être un nom de fichier.',
      "étape 3 : « solutions » n'est pas un paramètre connu.",
    ])
  })
  it('rejects a non-object step', () => {
    expect(run('coucou').errors).toEqual(['étape 3 : doit contenir « titre », « consigne » et « solution ».'])
  })
})
```

`src/config/validatePadlock.test.ts`:
```ts
/** @file Tests for padlock configuration validation. */
import { validatePadlock } from './validatePadlock'

function run(raw: unknown, stepCount = 4) {
  const errors: string[] = []
  return { padlock: validatePadlock(raw, stepCount, errors), errors }
}
const ORDER_ERROR = "cadenas : « ordre » doit contenir chaque numéro d'étape de 1 à 4, une seule fois."

describe('validatePadlock', () => {
  it('defaults to step order when absent', () => {
    expect(run(undefined).padlock).toEqual({ order: [1, 2, 3, 4] })
  })
  it('defaults the order when only a hint is given', () => {
    expect(run({ indice: 'La crypte en premier' }).padlock)
      .toEqual({ order: [1, 2, 3, 4], hint: 'La crypte en premier' })
  })
  it('accepts a permutation', () => {
    expect(run({ ordre: [3, 1, 4, 2] }).padlock).toEqual({ order: [3, 1, 4, 2] })
  })
  it.each([
    [[1, 2, 3]], [[1, 2, 3, 4, 1]], [[1, 1, 2, 3]], [[0, 1, 2, 3]], [[1, 2, 3, 5]], ['1234'],
  ])('rejects order %j', (ordre) => {
    expect(run({ ordre }).errors).toEqual([ORDER_ERROR])
  })
  it('rejects a non-text hint and unknown keys', () => {
    expect(run({ indice: 5, ordr: [1] }).errors).toEqual([
      'cadenas : « indice » doit être un texte.',
      "cadenas : « ordr » n'est pas un paramètre connu.",
    ])
  })
  it('rejects a non-object padlock', () => {
    expect(run([1, 2]).errors).toEqual(['« cadenas » doit contenir « ordre » et/ou « indice ».'])
  })
})
```

- [ ] **Step 2:** run both → FAIL.

- [ ] **Step 3: Implement** `src/config/validateStep.ts`:

```ts
/** @file Validates one quiz step from the YAML and maps it to a QuizStep. */
import { isIntInRange, isNonEmptyString, isObject, unknownKeyErrors } from './checks'
import type { QuizStep } from './types'

const STEP_KEYS = ['titre', 'consigne', 'image', 'solution'] as const

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
    errors.push(`${prefix}doit contenir « titre », « consigne » et « solution ».`)
    return null
  }
  const before = errors.length
  if (!isNonEmptyString(raw.titre)) errors.push(`${prefix}« titre » est obligatoire et doit être un texte non vide.`)
  if (!isNonEmptyString(raw.consigne)) errors.push(`${prefix}« consigne » est obligatoire et doit être un texte non vide.`)
  if (!isIntInRange(raw.solution, 0, 9)) errors.push(`${prefix}« solution » doit être un chiffre entier entre 0 et 9.`)
  if (raw.image !== undefined && !isNonEmptyString(raw.image)) errors.push(`${prefix}« image » doit être un nom de fichier.`)
  errors.push(...unknownKeyErrors(raw, STEP_KEYS, prefix))
  if (errors.length > before) return null
  return {
    title: raw.titre as string,
    instruction: raw.consigne as string,
    solution: raw.solution as number,
    ...(raw.image !== undefined && { image: raw.image as string }),
  }
}
```

`src/config/validatePadlock.ts`:
```ts
/** @file Validates the optional `cadenas` section and fills in the default order. */
import { isIntInRange, isObject, unknownKeyErrors } from './checks'
import type { PadlockConfig } from './types'

const PADLOCK_KEYS = ['ordre', 'indice'] as const

/** @returns [1, 2, ..., stepCount]. */
function defaultOrder(stepCount: number): number[] {
  return Array.from({ length: stepCount }, (_, i) => i + 1)
}

/** @returns true if order holds each integer 1..stepCount exactly once. */
function isPermutation(order: unknown, stepCount: number): order is number[] {
  if (!Array.isArray(order) || order.length !== stepCount) return false
  if (!order.every((n) => isIntInRange(n, 1, stepCount))) return false
  return new Set(order).size === stepCount
}

/**
 * Validates the padlock section, pushing French messages into `errors`.
 * @param raw Value of `cadenas` in the YAML (may be undefined).
 * @param stepCount Number of steps, the length the order must have.
 * @returns The padlock config (order defaults to step order), or null on error.
 */
export function validatePadlock(raw: unknown, stepCount: number, errors: string[]): PadlockConfig | null {
  if (raw === undefined) return { order: defaultOrder(stepCount) }
  if (!isObject(raw)) {
    errors.push('« cadenas » doit contenir « ordre » et/ou « indice ».')
    return null
  }
  const before = errors.length
  const prefix = 'cadenas : '
  if (raw.ordre !== undefined && !isPermutation(raw.ordre, stepCount)) {
    errors.push(`${prefix}« ordre » doit contenir chaque numéro d'étape de 1 à ${stepCount}, une seule fois.`)
  }
  if (raw.indice !== undefined && typeof raw.indice !== 'string') errors.push(`${prefix}« indice » doit être un texte.`)
  errors.push(...unknownKeyErrors(raw, PADLOCK_KEYS, prefix))
  if (errors.length > before) return null
  return {
    order: (raw.ordre as number[] | undefined) ?? defaultOrder(stepCount),
    ...(raw.indice !== undefined && { hint: raw.indice as string }),
  }
}
```

- [ ] **Step 4:** PASS. **Step 5:** `git commit -m "feat: validate quiz steps and padlock section (#<issue>)"`

### Task 3: Whole-quiz validator and YAML parsing

**Files:** Create `src/config/validateQuiz.ts`, `src/config/parseQuiz.ts`, `src/config/validateQuiz.test.ts`, `src/config/parseQuiz.test.ts`.

**Interfaces — Consumes:** Tasks 1–2. **Produces:**
```ts
export function validateQuiz(raw: unknown): ValidationResult
export function parseQuizYaml(text: string): ValidationResult
```

- [ ] **Step 1: Failing tests** — `src/config/validateQuiz.test.ts`:

```ts
/** @file Tests for whole-quiz validation (count consistency, required fields, typos). */
import { validateQuiz } from './validateQuiz'

function step(n: number) {
  return { titre: `Étape ${n}`, consigne: `Consigne ${n}`, solution: n % 10 }
}
function validRaw(count = 6): Record<string, unknown> {
  return { titre: 'Le manoir hanté', duree_minutes: 90, nombre_etapes: count,
    etapes: Array.from({ length: count }, (_, i) => step(i + 1)) }
}
function errorsOf(raw: unknown): string[] {
  const result = validateQuiz(raw)
  return result.ok ? [] : result.errors
}

describe('validateQuiz', () => {
  it('returns a typed config for a valid quiz', () => {
    const result = validateQuiz({ ...validRaw(), intro: 'Bienvenue', cadenas: { indice: 'Chut' } })
    expect(result).toEqual({ ok: true, config: {
      title: 'Le manoir hanté', intro: 'Bienvenue', durationMinutes: 90, stepCount: 6,
      steps: [1, 2, 3, 4, 5, 6].map((n) => ({ title: `Étape ${n}`, instruction: `Consigne ${n}`, solution: n })),
      padlock: { order: [1, 2, 3, 4, 5, 6], hint: 'Chut' },
    } })
  })
  it('rejects fewer steps than nombre_etapes', () => {
    expect(errorsOf({ ...validRaw(), etapes: validRaw(5).etapes }))
      .toEqual(['« etapes » contient 5 étape(s) alors que « nombre_etapes » vaut 6.'])
  })
  it('rejects more steps than nombre_etapes', () => {
    expect(errorsOf({ ...validRaw(), etapes: validRaw(7).etapes }))
      .toEqual(['« etapes » contient 7 étape(s) alors que « nombre_etapes » vaut 6.'])
  })
  it.each([0, -5, 1.5, '90'])('rejects duree_minutes %j', (duree_minutes) => {
    expect(errorsOf({ ...validRaw(), duree_minutes }))
      .toEqual(['« duree_minutes » doit être un nombre entier supérieur à 0.'])
  })
  it.each([0, 2.5, 'six'])('rejects nombre_etapes %j', (nombre_etapes) => {
    expect(errorsOf({ ...validRaw(), nombre_etapes }))
      .toContain('« nombre_etapes » doit être un nombre entier supérieur ou égal à 1.')
  })
  it('accepts a single-step quiz', () => {
    expect(errorsOf(validRaw(1))).toEqual([])
  })
  it('collects errors from every level at once', () => {
    const raw = { ...validRaw(), titre: '', intro: 3, etapes: [...validRaw(5).etapes, { titre: 'x', consigne: 'y', solution: 12 }],
      cadenas: { ordre: [1, 1, 2, 3, 4, 5] }, extra: true }
    expect(errorsOf(raw)).toEqual([
      '« titre » est obligatoire et doit être un texte non vide.',
      '« intro » doit être un texte.',
      'étape 6 : « solution » doit être un chiffre entier entre 0 et 9.',
      "cadenas : « ordre » doit contenir chaque numéro d'étape de 1 à 6, une seule fois.",
      "« extra » n'est pas un paramètre connu.",
    ])
  })
  it('rejects a missing etapes list', () => {
    const raw = validRaw()
    delete raw.etapes
    expect(errorsOf(raw)).toEqual(['« etapes » est obligatoire et doit être une liste.'])
  })
  it('rejects a non-object document', () => {
    expect(errorsOf('bonjour')).toEqual(['Le fichier doit contenir des paramètres sous la forme « clé: valeur ».'])
  })
})
```

`src/config/parseQuiz.test.ts`:
```ts
/** @file Tests for YAML text parsing + validation. */
import { parseQuizYaml } from './parseQuiz'

describe('parseQuizYaml', () => {
  it('parses and validates a YAML document', () => {
    const text = 'titre: Test\nduree_minutes: 10\nnombre_etapes: 1\netapes:\n  - titre: A\n    consigne: B\n    solution: 0\n'
    const result = parseQuizYaml(text)
    expect(result.ok && result.config.steps[0].solution).toBe(0)
  })
  it('reports unreadable YAML in French', () => {
    const result = parseQuizYaml('titre: [oups')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]).toMatch(/^Le fichier YAML est illisible/)
  })
  it('reports an empty file', () => {
    expect(parseQuizYaml('')).toEqual({ ok: false,
      errors: ['Le fichier doit contenir des paramètres sous la forme « clé: valeur ».'] })
  })
})
```

- [ ] **Step 2:** `npm install yaml` then run → FAIL.

- [ ] **Step 3: Implement** `src/config/validateQuiz.ts`:

```ts
/** @file Validates the whole quiz document and builds the typed QuizConfig. */
import { isIntInRange, isNonEmptyString, isObject, unknownKeyErrors } from './checks'
import { validatePadlock } from './validatePadlock'
import { validateStep } from './validateStep'
import type { QuizStep, ValidationResult } from './types'

const ROOT_KEYS = ['titre', 'intro', 'duree_minutes', 'nombre_etapes', 'etapes', 'cadenas'] as const

/**
 * Validates a parsed YAML document against every rule of the spec.
 * Never stops at the first problem so the animator can fix everything in one go.
 * @param raw Parsed YAML (any shape).
 * @returns The typed config, or the full list of French error messages.
 */
export function validateQuiz(raw: unknown): ValidationResult {
  if (!isObject(raw)) return { ok: false, errors: ['Le fichier doit contenir des paramètres sous la forme « clé: valeur ».'] }
  const errors: string[] = []
  if (!isNonEmptyString(raw.titre)) errors.push('« titre » est obligatoire et doit être un texte non vide.')
  if (raw.intro !== undefined && typeof raw.intro !== 'string') errors.push('« intro » doit être un texte.')
  if (!isIntInRange(raw.duree_minutes, 1, Number.MAX_SAFE_INTEGER)) {
    errors.push('« duree_minutes » doit être un nombre entier supérieur à 0.')
  }
  const countOk = isIntInRange(raw.nombre_etapes, 1, Number.MAX_SAFE_INTEGER)
  if (!countOk) errors.push('« nombre_etapes » doit être un nombre entier supérieur ou égal à 1.')

  const steps: (QuizStep | null)[] = []
  if (!Array.isArray(raw.etapes)) {
    errors.push('« etapes » est obligatoire et doit être une liste.')
  } else {
    if (countOk && raw.etapes.length !== raw.nombre_etapes) {
      errors.push(`« etapes » contient ${raw.etapes.length} étape(s) alors que « nombre_etapes » vaut ${raw.nombre_etapes}.`)
    }
    raw.etapes.forEach((item, i) => steps.push(validateStep(item, i + 1, errors)))
  }
  // Without a valid count, the step list length is the best guess for the padlock check.
  const stepCount = countOk ? (raw.nombre_etapes as number) : steps.length
  const padlock = validatePadlock(raw.cadenas, stepCount, errors)
  errors.push(...unknownKeyErrors(raw, ROOT_KEYS, ''))

  if (errors.length > 0 || padlock === null) return { ok: false, errors }
  return { ok: true, config: {
    title: raw.titre as string,
    ...(raw.intro !== undefined && { intro: raw.intro as string }),
    durationMinutes: raw.duree_minutes as number,
    stepCount,
    steps: steps as QuizStep[],
    padlock,
  } }
}
```

`src/config/parseQuiz.ts`:
```ts
/** @file Parses the quiz YAML text, then validates it. */
import { parse } from 'yaml'
import { validateQuiz } from './validateQuiz'
import type { ValidationResult } from './types'

/**
 * Parses YAML text and validates the result.
 * @param text Content of quiz.yaml.
 * @returns The typed config, or French error messages (syntax errors included).
 */
export function parseQuizYaml(text: string): ValidationResult {
  let raw: unknown
  try {
    raw = parse(text)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return { ok: false, errors: [`Le fichier YAML est illisible : ${detail}`] }
  }
  return validateQuiz(raw)
}
```

- [ ] **Step 4:** PASS. **Step 5:** `git commit -m "feat: validate whole quiz and parse YAML (#<issue>)"`

### Task 4: Image check, CLI, sample quiz.yaml, prebuild

**Files:** Create `src/config/images.ts`, `src/config/images.test.ts`, `scripts/valider.ts`, `quiz.yaml`, `public/images/.gitkeep`. Modify `package.json`, `tsconfig.node.json` (add `"scripts"` to `include`).

**Interfaces — Produces:** `export function findMissingImages(config: QuizConfig, existing: ReadonlySet<string>): string[]`

- [ ] **Step 1: Failing test** — `src/config/images.test.ts`:

```ts
/** @file Tests for the image existence check. */
import { findMissingImages } from './images'
import type { QuizConfig } from './types'

const config: QuizConfig = {
  title: 'T', durationMinutes: 10, stepCount: 2, padlock: { order: [1, 2] },
  steps: [
    { title: 'A', instruction: 'a', solution: 1, image: 'crypte.png' },
    { title: 'B', instruction: 'b', solution: 2, image: 'absent.png' },
  ],
}

describe('findMissingImages', () => {
  it('reports only images that are not in the folder', () => {
    expect(findMissingImages(config, new Set(['crypte.png'])))
      .toEqual(["étape 2 : l'image « absent.png » est introuvable dans public/images/."])
  })
})
```

- [ ] **Step 2:** FAIL. **Step 3: Implement** `src/config/images.ts`:

```ts
/** @file Checks that every image referenced by the quiz exists (used by the Node CLI). */
import type { QuizConfig } from './types'

/**
 * @param config Validated quiz.
 * @param existing File names present in public/images/.
 * @returns One French message per missing image.
 */
export function findMissingImages(config: QuizConfig, existing: ReadonlySet<string>): string[] {
  return config.steps.flatMap((step, i) =>
    step.image && !existing.has(step.image)
      ? [`étape ${i + 1} : l'image « ${step.image} » est introuvable dans public/images/.`]
      : [])
}
```

- [ ] **Step 4:** PASS.

- [ ] **Step 5: CLI** — `npm install -D tsx`, then `scripts/valider.ts`:

```ts
/** @file CLI: validates quiz.yaml and its images. Exit code 1 on error (blocks the build). */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { parseQuizYaml } from '../src/config/parseQuiz'
import { findMissingImages } from '../src/config/images'

const result = parseQuizYaml(readFileSync('quiz.yaml', 'utf8'))
const images = existsSync('public/images') ? new Set(readdirSync('public/images')) : new Set<string>()
const errors = result.ok ? findMissingImages(result.config, images) : result.errors

if (errors.length > 0) {
  console.error(`❌ quiz.yaml contient ${errors.length} erreur(s) :`)
  errors.forEach((message) => console.error(`  - ${message}`))
  process.exit(1)
}
if (result.ok) console.log(`✅ quiz.yaml est valide (${result.config.stepCount} étapes, ${result.config.durationMinutes} min).`)
```

`npm pkg set scripts.valider="tsx scripts/valider.ts" scripts.prebuild="npm run valider"`

- [ ] **Step 6: Sample `quiz.yaml`** — fully commented in French (one comment line per key explaining rules), `titre: "Le manoir hanté"`, `duree_minutes: 90`, `nombre_etapes: 6`, six fictional steps (no image), `cadenas.ordre: [3, 1, 6, 2, 5, 4]`, `cadenas.indice` text. Run `npm run valider` → ✅. Temporarily set a solution to `12` → ❌ with the message, exit code 1; revert.

- [ ] **Step 7:** `git commit -m "feat: add quiz.yaml, validation CLI and prebuild check (#<issue>)"`

### Task 5: Wire the config into the app

**Files:** Create `src/config/loadQuiz.ts`, `src/components/ConfigErrorScreen.tsx`, `src/components/ConfigErrorScreen.test.tsx`. Modify `src/App.tsx`, `src/App.test.tsx`, `e2e/home.spec.ts`.

**Interfaces — Produces:** `export const quizResult: ValidationResult` ; `App({ quiz }: { quiz?: ValidationResult })` ; `ConfigErrorScreen({ errors }: { errors: string[] })`.

- [ ] **Step 1: Failing tests** — `src/App.test.tsx` becomes:

```tsx
/** @file Tests for the root component's config handling. */
import { render, screen } from '@testing-library/react'
import App from './App'
import type { ValidationResult } from './config/types'

const ok: ValidationResult = { ok: true, config: {
  title: 'Le manoir hanté', durationMinutes: 90, stepCount: 1,
  steps: [{ title: 'A', instruction: 'a', solution: 1 }], padlock: { order: [1] } } }

describe('App', () => {
  it('shows the quiz title from the config', () => {
    render(<App quiz={ok} />)
    expect(screen.getByRole('heading', { name: 'Le manoir hanté' })).toBeInTheDocument()
  })
  it('lists config errors instead of the game', () => {
    render(<App quiz={{ ok: false, errors: ['étape 2 : oups', 'étape 4 : aïe'] }} />)
    expect(screen.getByRole('heading', { name: 'Le quiz est mal configuré' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['étape 2 : oups', 'étape 4 : aïe'])
  })
})
```

- [ ] **Step 2:** FAIL. **Step 3: Implement** `src/config/loadQuiz.ts`:

```ts
/** @file Loads quiz.yaml into the bundle at build time and validates it. */
import quizText from '../../quiz.yaml?raw'
import { parseQuizYaml } from './parseQuiz'
import type { ValidationResult } from './types'

/** Validation result of the bundled quiz.yaml. */
export const quizResult: ValidationResult = parseQuizYaml(quizText)
```

`src/components/ConfigErrorScreen.tsx`:
```tsx
/** @file Screen shown when quiz.yaml is invalid (only reachable in dev: builds are blocked). */

/** Props of ConfigErrorScreen. */
export interface ConfigErrorScreenProps { errors: string[] }

/**
 * Lists every configuration error so the animator can fix quiz.yaml.
 * @returns The error screen.
 */
export function ConfigErrorScreen({ errors }: ConfigErrorScreenProps) {
  return (
    <main>
      <h1>Le quiz est mal configuré</h1>
      <p>Corrige ces points dans quiz.yaml :</p>
      <ul>{errors.map((message) => <li key={message}>{message}</li>)}</ul>
    </main>
  )
}
```
Plus `ConfigErrorScreen.test.tsx` (renders one `<li>` per error).

`src/App.tsx`:
```tsx
/** @file Root component: shows the game, or the config errors if quiz.yaml is invalid. */
import { ConfigErrorScreen } from './components/ConfigErrorScreen'
import { quizResult } from './config/loadQuiz'
import type { ValidationResult } from './config/types'

/** Props of App (injectable for tests). */
export interface AppProps { quiz?: ValidationResult }

/**
 * Root of the application.
 * @param props.quiz Validation result; defaults to the bundled quiz.yaml.
 * @returns The current screen.
 */
export default function App({ quiz = quizResult }: AppProps) {
  if (!quiz.ok) return <ConfigErrorScreen errors={quiz.errors} />
  return (
    <main>
      <h1>{quiz.config.title}</h1>
    </main>
  )
}
```

`e2e/home.spec.ts`: expect heading `Le manoir hanté`.

- [ ] **Step 4:** `npm run typecheck && npm run test:run && npm run build && npm run test:e2e` all green.
- [ ] **Step 5:** `git commit -m "feat: load validated quiz config into the app (#<issue>)"`

### Task 6: Close the sprint

- [ ] Update `CLAUDE.md` (config module, `npm run valider`), `README.md` (section « Modifier le quiz » : every key, rules, example error output), `ETAT.md` (next: sprint 3 design mockups).
- [ ] Run agent `relecteur-code`, fix findings, then `gh pr create` (French description, `Closes #<issue>`), wait for green CI. Merge only with Romain’s go.
