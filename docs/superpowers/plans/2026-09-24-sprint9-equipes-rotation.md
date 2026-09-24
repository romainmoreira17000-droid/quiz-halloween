# Sprint 9 — Équipes, rotation des épreuves et chrono par épreuve — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Six teams play the same evening, each on its own tablet: an animator sets the team, every team plays the six challenges in a shifted order on 15-minute slots computed from « Commencer », a missed challenge is unlocked by the animator code, and the last slot leads to the padlock and « Rendez-vous à la porte du restaurant ! ».

**Architecture:** The clock decides everything. A pure `gamePhase(state, config, teamIndex, now)` (`src/game/phase.ts`) derives the screen (challenge, waiting, time up, padlock…) from `startedAt`, the digits found **per challenge** and the rotation `(team + slot) mod N` (`src/game/rotation.ts`); slot changes are never actions. The reducer (`src/game/progress.ts`) only records facts (start, right/wrong answer, digit given by an animator, padlock opened) and checks each action against the phase at the action's `now`. The team lives outside the game state, in its own localStorage key (`src/services/savedTeam.ts`, `useTeam`), so a reset keeps it; `Game` becomes a gate (setup screen, then `TeamGame`).

**Tech Stack:** Vite 8, React 19, TypeScript, Vitest 5 + Testing Library + jsdom, Playwright (`page.clock`).

**Spec:** `docs/superpowers/specs/2026-09-24-escape-game-design.md` (sprint 9 part). Evening scenario: `docs/scenario-soiree.md`. Issue #19. Branch `feat/team-rotation`.

**Prerequisite:** PR #20 (spec + this plan) merged by Romain. Then:
`git checkout main && git pull && git checkout -b feat/team-rotation`.

## Decisions taken while planning (not in the spec)

- **Sprint 9 YAML keys only:** `equipes`, `duree_epreuve_minutes`, `code_animateur`. `indice_apres_minutes`, `blocage_secondes` and the step `indice` arrive in sprint 10 with the features that use them (an unused required key would only annoy Romain).
- **No `teamIndex` nor « unlocked by animator » list in the game state:** the team has its own storage key; a digit given by an animator is stored like a found one (nothing displays the difference). Choosing a team always starts a fresh game (`useTeam.choose` deletes the save), so a game can never resume under another team.
- **Wrong tries carry their slot** (`wrongSlot`): the message of a wrong try in slot 2 must not follow the group into slot 3.
- **An answer names its challenge** (`{ type: 'answer', challenge, … }`): a tap landing just after the slot changed is ignored instead of being checked against the next challenge.
- **Animator code shown as dots** when typed (setup and « Temps écoulé » screens): the children are watching.
- **Header:** « Épreuve 3/6 » + slot clock (big), candles, total clock (small). No clock on the padlock and victory screens (every team finishes at the same time, so the victory shows the meeting point, not a time). The parchment loses its « Étape 2 sur 6 » line (now in the header), which keeps the step screen inside 810×1080.
- **Entrance (`entree`)** stays supported by the code (unit tests) but leaves the sample `quiz.yaml` (Task 5), as the spec says.

## Global Constraints

- 200 lines max per file; `@file` header + JSDoc on every export (`@param`, `@returns`); comments in English explain *why*.
- Code and commits in English (Conventional Commits, `(#19)`); on-screen text in French, typographic apostrophe `’` in UI strings (validator messages keep the straight `'` like the existing ones).
- No `any`. Explicit types on props and service returns.
- Time is always **derived from `startedAt` and `Date.now()`**, never counted down in memory.
- Every localStorage access goes through `src/services/` and is wrapped in `try/catch` (never throws).
- Digits always `font-variant-numeric: lining-nums`.
- `getByRole('status')` must stay unique on a screen (« Chiffre trouvé », « Chiffre de l’épreuve »).
- Playwright: `exact: true` on « Commencer »; `page.clock.fastForward` takes `mm:ss` (or `hh:mm:ss` past 59 min).
- Tablet 810×1080 first: a challenge screen fits without scrolling. Phone: may scroll, never sideways.
- Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Checks: `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run test:e2e` (stop any `vite preview` on port 4173 first, see CLAUDE.md).
- After each task: tick the task in `ETAT.md`, write the next concrete action, commit it with the task.

## Review Focus

1. **`code_animateur: 0427` written without quotes** → YAML reads the number 427; the tablet must still expect `0427` (test in Task 1, `parseQuiz.test.ts`).
2. **Tablet asleep or reloaded across several slot changes** → it must show « Temps écoulé » for the earliest missed challenge, then the challenge of the current slot, never a skipped one (tests in Task 2 `phase.test.ts` « 44 min », Task 5 `useGameProgress.test.ts` reload at 40 min).
3. **Animator code typed in front of the children** → digits shown as dots (tests in Task 3 `AnswerInput.test.tsx`, `TeamSetupScreen.test.tsx`; Task 4 `TimeUpScreen.test.tsx`).
4. **Answer tapped just as the slot changes** → ignored, never checked against the next challenge (test in Task 5 `progress.test.ts` « ignores an answer for a challenge that is not on screen »).
5. **Taller header on the step screen** → still no scroll at 810×1080, digits and letters keyboards (e2e in Task 6 `layout.spec.ts`).

## File map

| File | Role |
|---|---|
| `src/config/types.ts` | `QuizConfig`: − `durationMinutes`, + `teams`, `slotMinutes`, `animatorCode` |
| `src/config/validateTeamSettings.ts` (new) | `equipes`, `duree_epreuve_minutes`, `code_animateur`, migration message for `duree_minutes` |
| `src/config/validateQuiz.ts`, `parseQuiz.ts` | wire the new keys; keep `code_animateur` as written |
| `src/game/time.ts` | + `slotTiming`; − `elapsedSeconds`, `formatDuration` (Task 5) |
| `src/game/rotation.ts` (new) | `challengeAt(team, slot, count)` |
| `src/game/phase.ts` (new) | `gamePhase(...)`: which screen, from the clock |
| `src/game/answer.ts` | + `isAnimatorCode` |
| `src/game/progress.ts`, `restore.ts` | new state (digits per challenge), actions, restore checks |
| `src/services/savedTeam.ts` (new) | team key in localStorage |
| `src/hooks/useTeam.ts` (new) | team of the tablet |
| `src/hooks/useNow.ts` (new, replaces `useCountdown.ts`) | ticking `Date.now()` |
| `src/hooks/useGameProgress.ts` | `(config, teamIndex)`, `answer(challenge, text)`, `giveDigit` |
| `src/components/Game.tsx` | gate: setup screen or `TeamGame` |
| `src/components/TeamGame.tsx` (new, from old `Game.tsx`) | picks the screen from the phase |
| `src/components/TeamSetupScreen.tsx` (new) | animator code, then team buttons |
| `src/components/TimeUpScreen.tsx` (new) | « Temps écoulé : appelez un animateur » |
| `src/components/HomeScreen.tsx`, `GameHeader.tsx`, `Clock.tsx`, `StepScreen.tsx`, `VictoryScreen.tsx`, `PadlockScreen.tsx`, `CutawayLock.tsx`, `AnswerZone.tsx`, `AnswerInput.tsx`, `ResetDialog.tsx`, `ResetControl.tsx` | adapted |
| `quiz.yaml`, `README.md`, `scripts/valider.ts` | new keys |
| `e2e/*` | setup, rotation, animator unlock, layout |

---

### Task 1: New quiz keys (`equipes`, `duree_epreuve_minutes`, `code_animateur`)

**Files:**
- Create: `src/config/validateTeamSettings.ts`, `src/config/validateTeamSettings.test.ts`
- Modify: `src/config/types.ts`, `src/config/validateQuiz.ts`, `src/config/validateQuiz.test.ts`, `src/config/parseQuiz.ts`, `src/config/parseQuiz.test.ts`
- Modify (fixtures only): `src/App.test.tsx`, `src/components/Game.test.tsx`, `src/config/images.test.ts`, `src/game/fingerprint.test.ts`, `src/hooks/useGameProgress.test.ts`
- Modify: `src/components/Game.tsx` (temporary bridge), `scripts/valider.ts`, `quiz.yaml`, `README.md`

**Interfaces:**
- Produces: `QuizConfig.teams: string[]`, `QuizConfig.slotMinutes: number`, `QuizConfig.animatorCode: string` (`durationMinutes` removed). `validateTeamSettings(raw: RawObject, stepCount: number | null, errors: string[]): TeamSettings | null` with `TeamSettings = { teams: string[]; slotMinutes: number; animatorCode: string }`.

- [ ] **Step 1: failing tests for the team settings validator**

`src/config/validateTeamSettings.test.ts`:

```ts
/** @file Tests for the team settings: team names, slot length and animator code. */
import { validateTeamSettings } from './validateTeamSettings'

const valid = { equipes: ['Sorcières', 'Zombies'], duree_epreuve_minutes: 15, code_animateur: '2710' }

function run(raw: Record<string, unknown>, stepCount: number | null = 2) {
  const errors: string[] = []
  const settings = validateTeamSettings(raw, stepCount, errors)
  return { settings, errors }
}

describe('validateTeamSettings', () => {
  it('returns the settings', () => {
    expect(run(valid)).toEqual({
      settings: { teams: ['Sorcières', 'Zombies'], slotMinutes: 15, animatorCode: '2710' }, errors: [],
    })
  })
  it('trims team names', () => {
    expect(run({ ...valid, equipes: [' Sorcières ', 'Zombies'] }).settings?.teams).toEqual(['Sorcières', 'Zombies'])
  })
  it('requires the team list', () => {
    const raw: Record<string, unknown> = { ...valid }
    delete raw.equipes
    expect(run(raw).errors).toEqual(['« equipes » est obligatoire et doit être une liste de noms.'])
  })
  it('rejects an empty team name', () => {
    expect(run({ ...valid, equipes: ['Sorcières', ' '] }).errors)
      .toEqual(["« equipes » : l'équipe n° 2 doit avoir un nom."])
  })
  it('rejects a name used twice', () => {
    expect(run({ ...valid, equipes: ['Zombies', ' Zombies'] }).errors)
      .toEqual(['« equipes » : « Zombies » apparaît plusieurs fois.'])
  })
  it('needs one team per step', () => {
    expect(run(valid, 3).errors)
      .toEqual(['« equipes » contient 2 équipe(s) alors que « nombre_etapes » vaut 3 : il faut une équipe par épreuve.'])
  })
  it('skips the count check without a valid step count', () => {
    expect(run(valid, null).errors).toEqual([])
  })
  it.each([0, -1, 2.5, '15', undefined])('rejects duree_epreuve_minutes %j', (duree_epreuve_minutes) => {
    expect(run({ ...valid, duree_epreuve_minutes }).errors)
      .toEqual(['« duree_epreuve_minutes » doit être un nombre entier supérieur à 0.'])
  })
  it.each(['123', '123456789', '12a4', '', 2710, undefined])('rejects code_animateur %j', (code_animateur) => {
    expect(run({ ...valid, code_animateur }).errors).toEqual(['« code_animateur » doit contenir de 4 à 8 chiffres.'])
  })
  it('accepts an 8-digit code with a leading zero', () => {
    expect(run({ ...valid, code_animateur: '01234567' }).settings?.animatorCode).toBe('01234567')
  })
  it('explains that duree_minutes was replaced', () => {
    expect(run({ ...valid, duree_minutes: 90 }).errors)
      .toEqual(["« duree_minutes » a été remplacée par « duree_epreuve_minutes » : la durée d'une épreuve, en minutes."])
  })
})
```

Run: `npx vitest run src/config/validateTeamSettings.test.ts` → FAIL (module not found).

- [ ] **Step 2: implement the validator**

`src/config/validateTeamSettings.ts`:

```ts
/** @file Validates the team settings of the escape game: team names, slot length and animator code. */
import { isIntInRange, isNonEmptyString, type RawObject } from './checks'

/** Team settings, once validated. */
export interface TeamSettings { teams: string[]; slotMinutes: number; animatorCode: string }

// Digits only, kept as text: a leading zero is part of the code.
const ANIMATOR_CODE = /^\d{4,8}$/

/** @returns French messages about the `equipes` list. */
function teamErrors(raw: unknown, stepCount: number | null): string[] {
  if (!Array.isArray(raw)) return ['« equipes » est obligatoire et doit être une liste de noms.']
  const errors: string[] = []
  raw.forEach((name, i) => {
    if (!isNonEmptyString(name)) errors.push(`« equipes » : l'équipe n° ${i + 1} doit avoir un nom.`)
  })
  const names = raw.filter(isNonEmptyString).map((name) => name.trim())
  new Set(names.filter((name, i) => names.indexOf(name) !== i))
    .forEach((name) => errors.push(`« equipes » : « ${name} » apparaît plusieurs fois.`))
  // The rotation gives each team a different first challenge: with more teams than challenges two
  // teams would share a room, with fewer a room would stay empty every slot.
  if (stepCount !== null && raw.length !== stepCount) {
    errors.push(`« equipes » contient ${raw.length} équipe(s) alors que « nombre_etapes » vaut ${stepCount} : il faut une équipe par épreuve.`)
  }
  return errors
}

/**
 * Validates the team settings found at the root of the quiz, pushing French messages into `errors`.
 * @param raw Root mapping of the YAML.
 * @param stepCount Validated `nombre_etapes`, or null when it is invalid (the team count is then not checked).
 * @param errors Accumulator shared with the other validators.
 * @returns The settings (team names trimmed), or null if at least one is wrong.
 */
export function validateTeamSettings(raw: RawObject, stepCount: number | null, errors: string[]): TeamSettings | null {
  const before = errors.length
  errors.push(...teamErrors(raw.equipes, stepCount))
  if (!isIntInRange(raw.duree_epreuve_minutes, 1, Number.MAX_SAFE_INTEGER)) {
    errors.push('« duree_epreuve_minutes » doit être un nombre entier supérieur à 0.')
  }
  if (typeof raw.code_animateur !== 'string' || !ANIMATOR_CODE.test(raw.code_animateur)) {
    errors.push('« code_animateur » doit contenir de 4 à 8 chiffres.')
  }
  // Quizzes written before sprint 9 have a total duration: explain the new key instead of "unknown key".
  if (raw.duree_minutes !== undefined) {
    errors.push("« duree_minutes » a été remplacée par « duree_epreuve_minutes » : la durée d'une épreuve, en minutes.")
  }
  if (errors.length > before) return null
  return {
    teams: (raw.equipes as string[]).map((name) => name.trim()),
    slotMinutes: raw.duree_epreuve_minutes as number,
    animatorCode: raw.code_animateur as string,
  }
}
```

Run the test → PASS.

- [ ] **Step 3: failing tests for the whole quiz and the parser**

In `src/config/validateQuiz.test.ts`:
- Add after `steps()`:
  ```ts
  function teams(count: number) {
    return Array.from({ length: count }, (_, i) => `Équipe ${i + 1}`)
  }
  ```
- `validRaw` becomes:
  ```ts
  function validRaw(count = 6): Record<string, unknown> {
    return { titre: 'Le manoir hanté', equipes: teams(count), duree_epreuve_minutes: 15, code_animateur: '2710', nombre_etapes: count, etapes: steps(count) }
  }
  ```
- In « returns a typed config for a valid quiz », replace `durationMinutes: 90,` by `teams: teams(6), slotMinutes: 15, animatorCode: '2710',`.
- Delete the tests « rejects duree_minutes %j » and « rejects missing duree_minutes and nombre_etapes », and add:
  ```ts
  it('rejects a missing nombre_etapes without complaining about the team count', () => {
    const raw = validRaw()
    delete raw.nombre_etapes
    expect(errorsOf(raw)).toEqual(['« nombre_etapes » doit être un nombre entier supérieur ou égal à 1.'])
  })
  it('requires the team settings', () => {
    const raw = validRaw()
    delete raw.equipes
    delete raw.duree_epreuve_minutes
    delete raw.code_animateur
    expect(errorsOf(raw)).toEqual([
      '« equipes » est obligatoire et doit être une liste de noms.',
      '« duree_epreuve_minutes » doit être un nombre entier supérieur à 0.',
      '« code_animateur » doit contenir de 4 à 8 chiffres.',
    ])
  })
  it('explains duree_minutes once, without calling it unknown', () => {
    expect(errorsOf({ ...validRaw(), duree_minutes: 90 }))
      .toEqual(["« duree_minutes » a été remplacée par « duree_epreuve_minutes » : la durée d'une épreuve, en minutes."])
  })
  ```

In `src/config/parseQuiz.test.ts`, add at the top of the `describe` a shared header and use it in the three texts that start with `'titre: Test\nduree_minutes: 10\n`:

```ts
// Minimal valid root keys; each test appends `etapes`.
const HEAD = 'titre: Test\nequipes: [A]\nduree_epreuve_minutes: 10\ncode_animateur: "2710"\nnombre_etapes: 1\n'
```

so that, for example, the first text becomes
`HEAD + 'etapes:\n  - titre: A\n    consigne: B\n    type_reponse: chiffres\n    reponse: "0"\n    chiffre: 0\n'`. Then add:

```ts
it('keeps a leading zero from an unquoted animator code', () => {
  const text = HEAD.replace('code_animateur: "2710"', 'code_animateur: 0427')
    + 'etapes:\n  - titre: A\n    consigne: B\n    type_reponse: chiffres\n    reponse: "1"\n    chiffre: 1\n'
  const result = parseQuizYaml(text)
  expect(result.ok && result.config.animatorCode).toBe('0427')
})
```

Run: `npx vitest run src/config` → FAIL (types and validator not wired).

- [ ] **Step 4: wire the keys**

`src/config/types.ts`, in `QuizConfig`, replace `durationMinutes: number` by:

```ts
  /** Team names, in rotation order: team i starts on challenge i + 1. As many as steps. */
  teams: string[]
  /** Length of one slot in minutes: every team changes room at the same time. */
  slotMinutes: number
  /** Code animators type to set up a tablet or give the digit of a missed challenge (digits, kept as text). */
  animatorCode: string
```

`src/config/validateQuiz.ts`:

```ts
/** @file Validates the whole quiz document and builds the typed QuizConfig. */
import { isIntInRange, isNonEmptyString, isObject, unknownKeyErrors } from './checks'
import { validateEntrance } from './validateEntrance'
import { validatePadlock } from './validatePadlock'
import { validateStep } from './validateStep'
import { validateTeamSettings } from './validateTeamSettings'
import type { QuizStep, ValidationResult } from './types'

const ROOT_KEYS = [
  'titre', 'intro', 'equipes', 'duree_epreuve_minutes', 'code_animateur', 'nombre_etapes', 'entree', 'etapes', 'cadenas',
] as const

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
  const entrance = validateEntrance(raw.entree, errors)
  const countOk = isIntInRange(raw.nombre_etapes, 1, Number.MAX_SAFE_INTEGER)
  if (!countOk) errors.push('« nombre_etapes » doit être un nombre entier supérieur ou égal à 1.')
  const settings = validateTeamSettings(raw, countOk ? (raw.nombre_etapes as number) : null, errors)

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
  // `duree_minutes` already has its own "replaced by" message.
  errors.push(...unknownKeyErrors(raw, [...ROOT_KEYS, 'duree_minutes'], ''))

  if (errors.length > 0 || padlock === null || entrance === null || settings === null) return { ok: false, errors }
  return { ok: true, config: {
    title: raw.titre as string,
    ...(raw.intro !== undefined && { intro: raw.intro as string }),
    ...settings,
    stepCount,
    steps: steps as QuizStep[],
    padlock,
    ...(entrance && { entrance }),
  } }
}
```

`src/config/parseQuiz.ts`: rename `keepNumericAnswersAsWritten` to `keepCodesAsWritten`, update its JSDoc (« every `reponse` and `code_animateur` value… a leading zero is part of an answer or of the animator code »), add above it

```ts
/** Keys whose value is typed on the keypad: their YAML source text is the value, never a number. */
const TEXT_KEYS: readonly unknown[] = ['reponse', 'code_animateur']
```

and replace the key test by `if (!isPair(pair) || !isScalar(pair.key) || !TEXT_KEYS.includes(pair.key.value)) return`. Update the call in `parseQuizYaml`.

- [ ] **Step 5: fix the fixtures, the bridge and the CLI**

Replace `durationMinutes: …` in the test fixtures (teams count = `stepCount`):
- `src/App.test.tsx`, `src/game/fingerprint.test.ts`, `src/hooks/useGameProgress.test.ts` (1 step): `teams: ['Sorcières'], slotMinutes: 15, animatorCode: '2710'`.
- `src/config/images.test.ts` (2 steps): `teams: ['Sorcières', 'Zombies'], slotMinutes: 10, animatorCode: '2710'`.
- `src/components/Game.test.tsx` (2 steps): `teams: ['Sorcières', 'Zombies'], slotMinutes: 45, animatorCode: '2710'` with the comment `// 2 × 45 min: the clock still shows 90:00 until the rotation (Task 5).`

`src/components/Game.tsx` (bridge, removed in Task 5): in `currentScreen`, add `const durationMinutes = config.stepCount * config.slotMinutes` as first line and use `durationMinutes={durationMinutes}` for `HomeScreen` and `GameHeader`.

`scripts/valider.ts`, last line:

```ts
if (result.ok) {
  const { stepCount, teams, slotMinutes } = result.config
  console.log(`✅ quiz.yaml est valide (${stepCount} étapes, ${teams.length} équipes, ${slotMinutes} min par épreuve).`)
}
```

`quiz.yaml`: replace the `duree_minutes` block (comment + key) by:

```yaml
# Noms des équipes, dans l'ordre de rotation. Obligatoire.
# Il faut autant d'équipes que d'étapes (nombre_etapes) : chaque équipe fait toutes les
# épreuves en commençant par une épreuve différente (la 1re équipe par l'épreuve 1, la 2e
# par l'épreuve 2...). Noms non vides et tous différents.
# Un animateur choisit l'équipe de chaque tablette avant la soirée.
equipes: ["Sorcières", "Zombies", "Fantômes", "Loups-garous", "Squelettes", "Momies"]

# Durée d'une épreuve, en minutes. Obligatoire, nombre entier supérieur à 0.
# Toutes les équipes changent de salle en même temps. Durée totale de la partie :
# nombre_etapes × duree_epreuve_minutes.
duree_epreuve_minutes: 15

# Code animateur : sert à régler l'équipe d'une tablette et à donner le chiffre d'une
# épreuve pas trouvée à temps. Obligatoire, de 4 à 8 chiffres. Ne jamais le dire devant
# les enfants. Attention : ce fichier est public, comme les réponses.
code_animateur: "2710"
```

and in the comment above `etapes`, replace « dans l'ordre où les enfants les jouent » by « numérotées dans l'ordre (la 1re est l'épreuve 1) ; chaque équipe les joue dans son ordre de rotation ».

`README.md`, in the quiz table, replace the `duree_minutes` row by:

```md
| `equipes` | oui | liste de noms non vides et différents, autant que `nombre_etapes` |
| `duree_epreuve_minutes` | oui | nombre entier supérieur à 0 (durée d'un créneau) |
| `code_animateur` | oui | 4 à 8 chiffres ; ne jamais le dire devant les enfants |
```

- [ ] **Step 6: verify**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run valider`
Expected: all green, `✅ quiz.yaml est valide (6 étapes, 6 équipes, 15 min par épreuve).` Then `npm run test:e2e` (clock still 90:00 through the bridge) → PASS.

- [ ] **Step 7: commit** `feat: add teams, slot length and animator code to the quiz (#19)`.

---

### Task 2: Slots, rotation and phase (pure logic)

**Files:**
- Modify: `src/game/time.ts`, `src/game/time.test.ts`
- Create: `src/game/rotation.ts`, `src/game/rotation.test.ts`, `src/game/phase.ts`, `src/game/phase.test.ts`

**Interfaces:**
- Consumes: `QuizConfig.stepCount`, `QuizConfig.slotMinutes` (Task 1).
- Produces:
  - `slotTiming(startedAt: number, now: number, slotMinutes: number): SlotTiming` with `SlotTiming = { slot: number; secondsLeft: number }`.
  - `challengeAt(teamIndex: number, slot: number, count: number): number`.
  - `type GameStatus = 'home' | 'entrance' | 'playing' | 'won'`, `interface PhaseInput { status: GameStatus; startedAt: number | null; digits: readonly (number | null)[] }`,
    `type GamePhase = { kind: 'home' } | { kind: 'entrance' } | { kind: 'won' } | { kind: 'challenge'; slot: number; challenge: number } | { kind: 'waiting'; slot: number; challenge: number } | { kind: 'timeUp'; challenge: number } | { kind: 'padlock' }`,
    `gamePhase(state: PhaseInput, config: Pick<QuizConfig, 'stepCount' | 'slotMinutes'>, teamIndex: number, now: number): GamePhase`. `slot` and `challenge` are 0-based.

- [ ] **Step 1: failing tests**

Append to `src/game/time.test.ts` (and add `slotTiming` to its import):

```ts
describe('slotTiming', () => {
  const MIN = 60_000
  it('shows the full slot at the start', () => {
    expect(slotTiming(1000, 1000, 15)).toEqual({ slot: 0, secondsLeft: 900 })
  })
  it('counts down inside a slot', () => {
    expect(slotTiming(0, 16 * MIN, 15)).toEqual({ slot: 1, secondsLeft: 840 })
  })
  it('shows 1 second left just before the change, then the full next slot', () => {
    expect(slotTiming(0, 15 * MIN - 1, 15)).toEqual({ slot: 0, secondsLeft: 1 })
    expect(slotTiming(0, 15 * MIN, 15)).toEqual({ slot: 1, secondsLeft: 900 })
  })
  it('keeps counting slots after the last one', () => {
    expect(slotTiming(0, 91 * MIN, 15).slot).toBe(6)
  })
  it('treats a time before the start as the start', () => {
    expect(slotTiming(5000, 1000, 15)).toEqual({ slot: 0, secondsLeft: 900 })
  })
})
```

`src/game/rotation.test.ts`:

```ts
/** @file Tests for the rotation of the teams across the challenges. */
import { challengeAt } from './rotation'

const SIX = [0, 1, 2, 3, 4, 5]

describe('challengeAt', () => {
  it('matches the rotation table of the spec for the Zombies', () => {
    expect(SIX.map((slot) => challengeAt(1, slot, 6) + 1)).toEqual([2, 3, 4, 5, 6, 1])
  })
  it('never puts two teams on the same challenge in a slot', () => {
    for (const slot of SIX) expect(new Set(SIX.map((team) => challengeAt(team, slot, 6))).size).toBe(6)
  })
  it('gives every challenge to every team', () => {
    for (const team of SIX) expect(new Set(SIX.map((slot) => challengeAt(team, slot, 6))).size).toBe(6)
  })
})
```

`src/game/phase.test.ts`:

```ts
/** @file Tests for the screen decided by the clock. */
import { gamePhase, type PhaseInput } from './phase'

const MIN = 60_000
const rules = { stepCount: 3, slotMinutes: 15 }
const none = [null, null, null]
const playing = (digits: (number | null)[]): PhaseInput => ({ status: 'playing', startedAt: 0, digits })
// Team 1 of 3 plays challenges 1, 2, then 0 (0-based).
const at = (digits: (number | null)[], minutes: number) => gamePhase(playing(digits), rules, 1, minutes * MIN)

describe('gamePhase', () => {
  it.each(['home', 'entrance', 'won'] as const)('passes the %s status through', (status) => {
    expect(gamePhase({ status, startedAt: status === 'won' ? 0 : null, digits: none }, rules, 1, 0)).toEqual({ kind: status })
  })
  it('starts on the team’s own challenge', () => {
    expect(at(none, 0)).toEqual({ kind: 'challenge', slot: 0, challenge: 1 })
  })
  it('waits for the next room once the digit is found', () => {
    expect(at([null, 5, null], 14)).toEqual({ kind: 'waiting', slot: 0, challenge: 1 })
  })
  it('moves to the next challenge when the slot ends', () => {
    expect(at([null, 5, null], 15)).toEqual({ kind: 'challenge', slot: 1, challenge: 2 })
  })
  it('asks for an animator when a slot ended without its digit', () => {
    expect(at(none, 15)).toEqual({ kind: 'timeUp', challenge: 1 })
  })
  it('asks for the earliest missed challenge first, even several slots later', () => {
    expect(at(none, 44)).toEqual({ kind: 'timeUp', challenge: 1 })
    expect(at([null, 5, null], 44)).toEqual({ kind: 'timeUp', challenge: 2 })
  })
  it('goes to the padlock after the last slot', () => {
    expect(at([7, 5, 3], 45)).toEqual({ kind: 'padlock' })
  })
  it('asks for an animator before the padlock if the last challenge was missed', () => {
    expect(at([null, 5, 3], 45)).toEqual({ kind: 'timeUp', challenge: 0 })
  })
  it('treats a time before the start as the start', () => {
    expect(gamePhase(playing(none), rules, 1, -5000)).toEqual({ kind: 'challenge', slot: 0, challenge: 1 })
  })
})
```

Run: `npx vitest run src/game` → FAIL.

- [ ] **Step 2: implement**

Append to `src/game/time.ts`:

```ts
/** Where the game stands in its fixed-length slots. */
export interface SlotTiming {
  /** 0-based slot; equals the number of slots once they are all over. */
  slot: number
  /** Whole seconds left in the current slot. */
  secondsLeft: number
}

/**
 * Current slot of the rotation, derived from the start time like the clock (never counted in memory).
 * @param startedAt Start timestamp in ms (« Commencer »).
 * @param now Current timestamp in ms; a time before the start counts as the start.
 * @param slotMinutes Length of one slot.
 * @returns The slot and the seconds left in it; the first second of a slot shows the full "15:00".
 * @example slotTiming(0, 16 * 60_000, 15) // { slot: 1, secondsLeft: 840 }
 */
export function slotTiming(startedAt: number, now: number, slotMinutes: number): SlotTiming {
  const slotMs = slotMinutes * 60_000
  const elapsed = Math.max(0, now - startedAt)
  return { slot: Math.floor(elapsed / slotMs), secondsLeft: slotMinutes * 60 - Math.floor((elapsed % slotMs) / 1000) }
}
```

`src/game/rotation.ts`:

```ts
/** @file Rotation of the teams across the challenges: never two teams on the same challenge in the same slot. */

/**
 * Challenge a team plays during a slot: each team starts one challenge further than the previous team.
 * @param teamIndex 0-based team, in quiz.yaml order.
 * @param slot 0-based slot.
 * @param count Number of challenges (equal to the number of teams).
 * @returns 0-based challenge.
 * @example challengeAt(1, 5, 6) // 0: the Zombies end on challenge 1
 */
export function challengeAt(teamIndex: number, slot: number, count: number): number {
  return (teamIndex + slot) % count
}
```

`src/game/phase.ts`:

```ts
/** @file Which screen a team sees at a given time: decided by the clock, never by an action. */
import type { QuizConfig } from '../config/types'
import { challengeAt } from './rotation'
import { slotTiming } from './time'

/** Stored part of the game: slots, time up and padlock are derived from the time. */
export type GameStatus = 'home' | 'entrance' | 'playing' | 'won'

/** What the phase needs from the game state. */
export interface PhaseInput {
  status: GameStatus
  /** Start timestamp in ms, null before « Commencer » (or before the entrance answer). */
  startedAt: number | null
  /** Digit per challenge (index = challenge number - 1), null until found or given by an animator. */
  digits: readonly (number | null)[]
}

/** Screen to show; `slot` and `challenge` are 0-based. */
export type GamePhase =
  | { kind: 'home' } | { kind: 'entrance' } | { kind: 'won' }
  /** The challenge of the current slot, digit not found yet. */
  | { kind: 'challenge'; slot: number; challenge: number }
  /** Digit found: the group waits for the change of room. */
  | { kind: 'waiting'; slot: number; challenge: number }
  /** An earlier slot ended without its digit: an animator must give it before anything else. */
  | { kind: 'timeUp'; challenge: number }
  /** Every slot is over and every digit known. */
  | { kind: 'padlock' }

/**
 * Derives the screen from the stored state and the time.
 * @param state Status, start time and digits of the game.
 * @param config Number of challenges and slot length.
 * @param teamIndex 0-based team of the tablet.
 * @param now Current timestamp in ms.
 * @returns The phase; a missed challenge comes first (earliest in play order), then the current slot.
 */
export function gamePhase(
  state: PhaseInput, config: Pick<QuizConfig, 'stepCount' | 'slotMinutes'>, teamIndex: number, now: number,
): GamePhase {
  if (state.status !== 'playing') return { kind: state.status }
  // A playing save always has a start time (restoreGameState checks it); this keeps the type narrow.
  if (state.startedAt === null) return { kind: 'home' }
  const { stepCount } = config
  const { slot } = slotTiming(state.startedAt, now, config.slotMinutes)
  for (let past = 0; past < Math.min(slot, stepCount); past++) {
    const challenge = challengeAt(teamIndex, past, stepCount)
    if (state.digits[challenge] === null) return { kind: 'timeUp', challenge }
  }
  if (slot >= stepCount) return { kind: 'padlock' }
  const challenge = challengeAt(teamIndex, slot, stepCount)
  return state.digits[challenge] === null ? { kind: 'challenge', slot, challenge } : { kind: 'waiting', slot, challenge }
}
```

Run: `npx vitest run src/game` → PASS. `npm run typecheck && npm run lint` → green.

- [ ] **Step 3: commit** `feat: derive the slot, rotation and screen from the clock (#19)`.

---

### Task 3: Team of the tablet (setup screen, home screen, change of team)

**Files:**
- Create: `src/services/savedTeam.ts` (+ `.test.ts`), `src/hooks/useTeam.ts` (+ `.test.ts`), `src/components/TeamSetupScreen.tsx` (+ `.test.tsx`)
- Move: `src/components/Game.tsx` → `src/components/TeamGame.tsx`, `src/components/Game.test.tsx` → `src/components/TeamGame.test.tsx` (`git mv`)
- Create: new `src/components/Game.tsx` (+ new `Game.test.tsx`)
- Modify: `src/game/answer.ts` (+ test), `src/components/AnswerInput.tsx`, `AnswerZone.tsx`, `HomeScreen.tsx`, `ResetDialog.tsx`, `ResetControl.tsx` (+ their tests), `src/App.test.tsx`, `src/styles/screens.css`, `src/styles/reset.css`
- Modify: `e2e/typing.ts`, `e2e/home.spec.ts`, `e2e/game.spec.ts`, `e2e/save-and-reset.spec.ts`

**Interfaces:**
- Consumes: `QuizConfig.teams`, `animatorCode`, `slotMinutes` (Task 1); `clearGame()` from `savedGame.ts`.
- Produces:
  - `TEAM_KEY = 'quiz-halloween:team'`, `loadTeam(teams: readonly string[]): number | null`, `saveTeam(name: string): void`, `clearTeam(): void`.
  - `useTeam(teams: readonly string[]): TabletTeam` with `TabletTeam = { teamIndex: number | null; choose(index: number): void; forget(): void }`.
  - `isAnimatorCode(typed: string, animatorCode: string): boolean`.
  - `AnswerZoneProps` + `wrongMessage?: string`, `secret?: boolean`; `AnswerInputProps` + `secret?: boolean`.
  - `TeamSetupScreen({ teams, animatorCode, onChoose(index) })`.
  - `HomeScreenProps = { title; intro?; teamName: string; challengeCount: number; slotMinutes: number; onStart() }`.
  - `ResetDialogProps` / `ResetControlProps` + `onChangeTeam?(): void`.
  - `TeamGame({ config, teamIndex, onChangeTeam })` (still the old sequential gameplay until Task 5).
  - e2e helper `setUpTablet(page: Page, team: string): Promise<void>`.

- [ ] **Step 1: failing tests for storage, hook and code check**

`src/services/savedTeam.test.ts`:

```ts
/** @file Tests for the team saved on the tablet. */
import { clearTeam, loadTeam, saveTeam, TEAM_KEY } from './savedTeam'

const TEAMS = ['Sorcières', 'Zombies']

describe('saved team', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reads back the saved team', () => {
    saveTeam('Zombies')
    expect(loadTeam(TEAMS)).toBe(1)
  })
  it('has no team at first, or after clearing', () => {
    expect(loadTeam(TEAMS)).toBeNull()
    saveTeam('Zombies')
    clearTeam()
    expect(loadTeam(TEAMS)).toBeNull()
  })
  it('forgets a team that quiz.yaml no longer has', () => {
    localStorage.setItem(TEAM_KEY, 'Vampires')
    expect(loadTeam(TEAMS)).toBeNull()
  })
  it('never throws when the browser refuses storage', () => {
    const refuse = () => { throw new Error('denied') }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(refuse)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(refuse)
    expect(loadTeam(TEAMS)).toBeNull()
    expect(() => saveTeam('Zombies')).not.toThrow()
    expect(() => clearTeam()).not.toThrow()
  })
})
```

`src/hooks/useTeam.test.ts`:

```ts
/** @file Tests for the team of the tablet. */
import { act, renderHook } from '@testing-library/react'
import { STORAGE_KEY } from '../services/savedGame'
import { TEAM_KEY } from '../services/savedTeam'
import { useTeam } from './useTeam'

const TEAMS = ['Sorcières', 'Zombies']

describe('useTeam', () => {
  it('has no team on a new tablet, then keeps the chosen one after a reload', () => {
    const first = renderHook(() => useTeam(TEAMS))
    expect(first.result.current.teamIndex).toBeNull()
    act(() => first.result.current.choose(1))
    expect(first.result.current.teamIndex).toBe(1)
    first.unmount()
    expect(renderHook(() => useTeam(TEAMS)).result.current.teamIndex).toBe(1)
  })
  it('starts the chosen team on a fresh game', () => {
    localStorage.setItem(STORAGE_KEY, '{"fingerprint":"x","state":{}}')
    const { result } = renderHook(() => useTeam(TEAMS))
    act(() => result.current.choose(0))
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
  it('forgets the team', () => {
    localStorage.setItem(TEAM_KEY, 'Zombies')
    const { result } = renderHook(() => useTeam(TEAMS))
    act(() => result.current.forget())
    expect(result.current.teamIndex).toBeNull()
    expect(localStorage.getItem(TEAM_KEY)).toBeNull()
  })
})
```

Append to `src/game/answer.test.ts` (import `isAnimatorCode`):

```ts
describe('isAnimatorCode', () => {
  it('accepts only the exact code, leading zero included', () => {
    expect(isAnimatorCode('0427', '0427')).toBe(true)
    expect(isAnimatorCode('427', '0427')).toBe(false)
    expect(isAnimatorCode('', '0427')).toBe(false)
  })
})
```

Run → FAIL.

- [ ] **Step 2: implement storage, hook and code check**

`src/services/savedTeam.ts`:

```ts
/** @file Remembers which team plays on this tablet, under its own localStorage key so a game reset keeps it. */

/** localStorage key of the tablet's team (the team name, as written in quiz.yaml). */
export const TEAM_KEY = 'quiz-halloween:team'

// Every access is wrapped, like savedGame: a refused storage only means asking for the team again.

/**
 * Reads the team of this tablet.
 * @param teams Team names of the current quiz.
 * @returns Its index, or null (none saved, team renamed or removed from quiz.yaml, storage refused).
 */
export function loadTeam(teams: readonly string[]): number | null {
  try {
    const index = teams.indexOf(localStorage.getItem(TEAM_KEY) ?? '')
    return index === -1 ? null : index
  } catch {
    return null
  }
}

/**
 * Saves the team of this tablet. The name, not the index: reordering quiz.yaml must not swap teams.
 * @param name Team name from quiz.yaml.
 */
export function saveTeam(name: string): void {
  try { localStorage.setItem(TEAM_KEY, name) } catch { /* see above */ }
}

/** Forgets the team of this tablet. */
export function clearTeam(): void {
  try { localStorage.removeItem(TEAM_KEY) } catch { /* see above */ }
}
```

`src/hooks/useTeam.ts`:

```ts
/** @file Team playing on the tablet: read once from localStorage, set by an animator. */
import { useState } from 'react'
import { clearGame } from '../services/savedGame'
import { clearTeam, loadTeam, saveTeam } from '../services/savedTeam'

/** Team of the tablet and the animator's actions. */
export interface TabletTeam {
  /** 0-based team in quiz.yaml order, null until an animator sets the tablet up. */
  teamIndex: number | null
  /** Sets the team; its game always starts fresh, so no save can resume under another team. */
  choose(index: number): void
  /** Forgets the team: the setup screen (animator code) comes back. */
  forget(): void
}

/**
 * Holds the team of the tablet.
 * @param teams Team names of the quiz.
 * @returns The team and its actions.
 */
export function useTeam(teams: readonly string[]): TabletTeam {
  const [teamIndex, setTeamIndex] = useState(() => loadTeam(teams))
  return {
    teamIndex,
    choose: (index) => { clearGame(); saveTeam(teams[index]); setTeamIndex(index) },
    forget: () => { clearTeam(); setTeamIndex(null) },
  }
}
```

In `src/game/answer.ts`, append:

```ts
/**
 * @param typed Code typed on the keypad.
 * @param animatorCode `code_animateur` from quiz.yaml.
 * @returns True when it is the animator code (same rule as a digits answer: leading zeros count).
 */
export function isAnimatorCode(typed: string, animatorCode: string): boolean {
  return isRightAnswer(typed, { kind: 'digits', value: animatorCode })
}
```

Run → PASS.

- [ ] **Step 3: failing tests for the screens**

`src/components/AnswerInput.test.tsx`, add:

```tsx
it('shows dots instead of a secret code, and still submits the digits', async () => {
  const onSubmit = vi.fn()
  render(<AnswerInput kind="digits" secret onSubmit={onSubmit} />)
  await press('2')
  await press('7')
  expect(typed()).toHaveTextContent('••')
  await press('Valider')
  expect(onSubmit).toHaveBeenCalledWith('27')
})
```

`src/components/AnswerZone.test.tsx`, add:

```tsx
it('can replace the children’s messages', () => {
  render(<AnswerZone kind="digits" wrongAttempts={1} wrongMessage="Code faux." onSubmit={vi.fn()} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Code faux.')
})
```

`src/components/TeamSetupScreen.test.tsx`:

```tsx
/** @file Tests for the tablet setup screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamSetupScreen } from './TeamSetupScreen'

const TEAMS = ['Sorcières', 'Zombies']
const press = (name: string) => userEvent.click(screen.getByRole('button', { name }))
async function typeCode(code: string) {
  for (const digit of code) await press(digit)
  await press('Valider')
}

describe('TeamSetupScreen', () => {
  it('asks for the animator code first, shown as dots', async () => {
    render(<TeamSetupScreen teams={TEAMS} animatorCode="2710" onChoose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Réglage de la tablette' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Zombies' })).not.toBeInTheDocument()
    await press('2')
    await press('7')
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('••')
  })
  it('refuses a wrong code', async () => {
    render(<TeamSetupScreen teams={TEAMS} animatorCode="2710" onChoose={vi.fn()} />)
    await typeCode('1111')
    expect(screen.getByRole('alert')).toHaveTextContent('Ce n’est pas le code animateur.')
    expect(screen.queryByRole('button', { name: 'Zombies' })).not.toBeInTheDocument()
  })
  it('lists the teams once the code is right, and gives back the chosen one', async () => {
    const onChoose = vi.fn()
    render(<TeamSetupScreen teams={TEAMS} animatorCode="2710" onChoose={onChoose} />)
    await typeCode('2710')
    expect(screen.getByText('Quelle équipe joue sur cette tablette ?')).toBeInTheDocument()
    await press('Zombies')
    expect(onChoose).toHaveBeenCalledWith(1)
  })
})
```

`src/components/HomeScreen.test.tsx` — replace the whole `describe`:

```tsx
describe('HomeScreen', () => {
  it('shows the team, title, intro and the rhythm of the evening', () => {
    render(<HomeScreen title="Le manoir hanté" intro="Bienvenue !" teamName="Momies" challengeCount={6} slotMinutes={15} onStart={() => {}} />)
    expect(screen.getByText('Équipe des Momies')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Le manoir hanté' })).toBeInTheDocument()
    expect(screen.getByText('Bienvenue !')).toBeInTheDocument()
    expect(screen.getByText('6 épreuves de 15 minutes.')).toBeInTheDocument()
  })
  it('works without intro, in the singular', () => {
    render(<HomeScreen title="T" teamName="Momies" challengeCount={1} slotMinutes={1} onStart={() => {}} />)
    expect(screen.getByText('1 épreuve de 1 minute.')).toBeInTheDocument()
  })
  it('starts the game', async () => {
    const onStart = vi.fn()
    render(<HomeScreen title="T" teamName="Momies" challengeCount={6} slotMinutes={15} onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: 'Commencer' }))
    expect(onStart).toHaveBeenCalledOnce()
  })
})
```

`src/components/ResetDialog.test.tsx`, add:

```tsx
it('offers to change the team only when asked to', async () => {
  const { rerender } = render(<ResetDialog onCancel={vi.fn()} onConfirm={vi.fn()} />)
  expect(screen.queryByRole('button', { name: 'Changer d’équipe' })).not.toBeInTheDocument()
  const onChangeTeam = vi.fn()
  rerender(<ResetDialog onCancel={vi.fn()} onConfirm={vi.fn()} onChangeTeam={onChangeTeam} />)
  await userEvent.click(screen.getByRole('button', { name: 'Changer d’équipe' }))
  expect(onChangeTeam).toHaveBeenCalledOnce()
})
```

`src/components/ResetControl.test.tsx`, add:

```tsx
it('changes the team from the window, which closes', () => {
  const onChangeTeam = vi.fn()
  render(<ResetControl onReset={vi.fn()} onChangeTeam={onChangeTeam} />)
  holdResetIcon()
  fireEvent.click(screen.getByRole('button', { name: 'Changer d’équipe' }))
  expect(onChangeTeam).toHaveBeenCalledOnce()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
```

Run → FAIL.

- [ ] **Step 4: implement the screens**

`src/components/AnswerInput.tsx`: add to the props

```ts
  /** Shows dots instead of the typed digits (animator code typed in front of the children). */
  secret?: boolean
```

destructure `secret = false`, and render the output as
`{(secret ? '•'.repeat(text.length) : text) || '\u00a0'}` (keep the existing comment about the no-break space).

`src/components/AnswerZone.tsx`: add to the props

```ts
  /** Replaces the children's kind messages (e.g. « Ce n’est pas le code animateur. »). */
  wrongMessage?: string
  /** See AnswerInputProps.secret. */
  secret?: boolean
```

destructure them, show `{wrongMessage ?? wrongAnswerMessage(wrongAttempts)}` in the alert and pass `secret={secret}` to `AnswerInput`.

`src/components/TeamSetupScreen.tsx`:

```tsx
/** @file Tablet setup, done by an animator before the evening: animator code, then the team playing on it. */
import { useState } from 'react'
import { isAnimatorCode } from '../game/answer'
import { AnswerZone } from './AnswerZone'

/** Props of TeamSetupScreen. */
export interface TeamSetupScreenProps {
  /** Team names, in quiz.yaml order. */
  teams: readonly string[]
  /** `code_animateur` from quiz.yaml. */
  animatorCode: string
  /** Called with the 0-based chosen team. */
  onChoose(index: number): void
}

/**
 * Asks for the animator code (shown as dots), then one big button per team.
 * @param props See TeamSetupScreenProps.
 * @returns The setup screen.
 */
export function TeamSetupScreen({ teams, animatorCode, onChoose }: TeamSetupScreenProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const submit = (text: string) => {
    if (isAnimatorCode(text, animatorCode)) setUnlocked(true)
    else setWrongAttempts((count) => count + 1)
  }
  return (
    <main className="screen team-setup">
      <h1>Réglage de la tablette</h1>
      {unlocked ? (
        <>
          <p className="setup-question">Quelle équipe joue sur cette tablette ?</p>
          <ul className="team-list">
            {teams.map((name, i) => (
              <li key={name}><button type="button" className="seal-button team-button" onClick={() => onChoose(i)}>{name}</button></li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="setup-question">Code animateur</p>
          <AnswerZone kind="digits" secret wrongAttempts={wrongAttempts} wrongMessage="Ce n’est pas le code animateur." onSubmit={submit} />
        </>
      )}
    </main>
  )
}
```

`src/components/HomeScreen.tsx`:

```tsx
/** @file Home screen: team of the tablet, title, intro and the « Commencer » button every team taps together at the signal. */

/** Props of HomeScreen. */
export interface HomeScreenProps {
  title: string
  intro?: string
  /** Team playing on this tablet. */
  teamName: string
  challengeCount: number
  slotMinutes: number
  onStart(): void
}

/** @returns For example "6 épreuves" or "1 minute". */
const count = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

/**
 * First screen shown to the group.
 * @param props See HomeScreenProps.
 * @returns The home screen.
 */
export function HomeScreen({ title, intro, teamName, challengeCount, slotMinutes, onStart }: HomeScreenProps) {
  return (
    <main className="screen home">
      <div className="candle" aria-hidden="true"><span className="flame" /><span className="wick" /><span className="wax" /></div>
      <p className="team-name">Équipe des {teamName}</p>
      <h1>{title}</h1>
      {intro && <p className="intro">{intro}</p>}
      <button type="button" className="seal-button" onClick={onStart}>Commencer</button>
      <p className="duration">{count(challengeCount, 'épreuve')} de {count(slotMinutes, 'minute')}.</p>
    </main>
  )
}
```

`src/components/ResetDialog.tsx`: add to the props

```ts
  /** When given, a third button sets the tablet up for another team (the animator code is asked next). */
  onChangeTeam?(): void
```

and after the `reset-actions` div:

```tsx
        {onChangeTeam && (
          <button type="button" className="ghost-button change-team" onClick={onChangeTeam}>Changer d’équipe</button>
        )}
```

`src/components/ResetControl.tsx`: add `onChangeTeam?(): void` to the props (same JSDoc), and pass
`onChangeTeam={onChangeTeam && (() => { setAsking(false); onChangeTeam() })}` to `ResetDialog`.

Styles — `src/styles/screens.css`, after the Home block:

```css
/* Team of the tablet, above the title. */
.team-name { font-family: var(--title-font); font-size: 36px; color: var(--amber); }

/* Tablet setup (animators only): code, then one big button per team. */
.team-setup { justify-content: center; gap: 28px; }
.setup-question { font-size: 32px; }
.team-list {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px;
  width: 100%; max-width: 640px; padding: 0; list-style: none;
}
.team-button { width: 100%; padding: 0 16px; }
```

and in its `@media (max-width: 600px)` block: `.team-list { grid-template-columns: 1fr; }` and `.team-name { font-size: 28px; }`.
`src/styles/reset.css`: `.change-team { margin-top: 20px; min-height: 80px; font-size: 32px; }`.

Run the component tests → PASS.

- [ ] **Step 5: failing tests for the gate**

`git mv src/components/Game.test.tsx src/components/TeamGame.test.tsx`, then in it: import `TeamGame` from `./TeamGame` instead of `Game`, change the `@file` line to « Integration tests: one team's game, and the animator's reset », and replace every `<Game config={X} />` by `<TeamGame config={X} teamIndex={0} onChangeTeam={() => {}} />`.

New `src/components/Game.test.tsx`:

```tsx
/** @file Tests for the tablet entry: team setup first, then the team's game. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { TEAM_KEY } from '../services/savedTeam'
import { Game } from './Game'
import { RESET_HOLD_MS } from './ResetButton'

const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 },
  ],
  padlock: { order: [1, 2] },
}
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

describe('Game', () => {
  afterEach(() => vi.useRealTimers())

  it('asks an animator to set up the team, then shows its home screen', () => {
    render(<Game config={config} />)
    expect(screen.getByRole('heading', { name: 'Réglage de la tablette' })).toBeInTheDocument()
    for (const digit of '2710') press(digit)
    press('Valider')
    press('Zombies')
    expect(screen.getByText('Équipe des Zombies')).toBeInTheDocument()
  })
  it('goes straight to the home screen once the tablet has a team', () => {
    localStorage.setItem(TEAM_KEY, 'Zombies')
    render(<Game config={config} />)
    expect(screen.getByText('Équipe des Zombies')).toBeInTheDocument()
  })
  it('asks for the team again after « Changer d’équipe »', () => {
    vi.useFakeTimers()
    localStorage.setItem(TEAM_KEY, 'Zombies')
    render(<Game config={config} />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Recommencer la partie (appui long)' }))
    act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
    press('Changer d’équipe')
    expect(screen.getByRole('heading', { name: 'Réglage de la tablette' })).toBeInTheDocument()
  })
})
```

`src/App.test.tsx`: rename the first test to « shows the tablet setup of the configured quiz » and expect `screen.getByRole('heading', { name: 'Réglage de la tablette' })`.

Run → FAIL.

- [ ] **Step 6: implement the gate**

`git mv src/components/Game.tsx src/components/TeamGame.tsx`, then in `TeamGame.tsx`:
- `@file`: « One team's game: picks the screen and its backdrop from the progress, with the reset icon on top. »
- Replace `GameProps`/`Game` by:
  ```tsx
  /** Props of TeamGame. */
  export interface TeamGameProps {
    config: QuizConfig
    /** 0-based team playing on this tablet. */
    teamIndex: number
    /** Called from the reset window to set the tablet up for another team. */
    onChangeTeam(): void
  }

  /**
   * The game of the tablet's team.
   * @param props See TeamGameProps.
   * @returns The current screen, with the reset icon.
   */
  export function TeamGame({ config, teamIndex, onChangeTeam }: TeamGameProps) {
    const progress = useGameProgress(config)
    return (
      <>
        {backdrop(progress.state.status)}
        {currentScreen(config, teamIndex, progress)}
        <ResetControl onReset={progress.reset} onChangeTeam={onChangeTeam} />
      </>
    )
  }
  ```
- `currentScreen(config: QuizConfig, teamIndex: number, { … }: GameProgress)`; the home screen becomes
  `<HomeScreen title={config.title} intro={config.intro} teamName={config.teams[teamIndex]} challengeCount={config.stepCount} slotMinutes={config.slotMinutes} onStart={start} />`
  (the `durationMinutes` bridge stays only for `GameHeader`).

New `src/components/Game.tsx`:

```tsx
/** @file Tablet entry: an animator sets the team first, then that team's game runs. */
import type { QuizConfig } from '../config/types'
import { useTeam } from '../hooks/useTeam'
import { TeamGame } from './TeamGame'
import { TeamSetupScreen } from './TeamSetupScreen'

/** Props of Game. */
export interface GameProps { config: QuizConfig }

/**
 * The whole game for a valid quiz.
 * @param props.config Validated quiz configuration.
 * @returns The setup screen until the tablet has a team, then the team's game.
 */
export function Game({ config }: GameProps) {
  const { teamIndex, choose, forget } = useTeam(config.teams)
  if (teamIndex === null) {
    return <TeamSetupScreen teams={config.teams} animatorCode={config.animatorCode} onChoose={choose} />
  }
  return <TeamGame config={config} teamIndex={teamIndex} onChangeTeam={forget} />
}
```

Run: `npm run test:run && npm run typecheck && npm run lint` → green.

- [ ] **Step 7: e2e**

`e2e/typing.ts`, append:

```ts
/**
 * Sets the tablet up as an animator would: animator code of the sample quiz, then the team.
 * @param page Playwright page showing the setup screen.
 * @param team Team name from quiz.yaml.
 */
export async function setUpTablet(page: Page, team: string): Promise<void> {
  await typeAnswer(page, '2710')
  await page.getByRole('button', { name: team, exact: true }).click()
}
```

`e2e/home.spec.ts`: first test becomes « a new tablet shows the setup screen » expecting `page.getByRole('heading', { name: 'Réglage de la tablette' })`.

`e2e/game.spec.ts` and `e2e/save-and-reset.spec.ts`: import `setUpTablet` and add `await setUpTablet(page, 'Sorcières')` right after each `page.goto('./')` (the Sorcières play challenges 1 to 6 in order, which the old sequential gameplay still does). Append to `save-and-reset.spec.ts`:

```ts
async function holdResetIcon(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Recommencer la partie (appui long)' }).hover()
  await page.mouse.down()
  await page.clock.runFor(3000)
  await page.mouse.up()
}

test('a reset keeps the team of the tablet', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Momies')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await holdResetIcon(page)
  await page.getByRole('dialog', { name: 'Recommencer la partie ?' })
    .getByRole('button', { name: 'Recommencer', exact: true }).click()
  await expect(page.getByText('Équipe des Momies')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Équipe des Momies')).toBeVisible()
})

test('changing the team asks for the animator code again', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Momies')
  await holdResetIcon(page)
  await page.getByRole('button', { name: 'Changer d’équipe' }).click()
  await expect(page.getByRole('heading', { name: 'Réglage de la tablette' })).toBeVisible()
  await setUpTablet(page, 'Fantômes')
  await expect(page.getByText('Équipe des Fantômes')).toBeVisible()
})
```

(import `type Page` from `@playwright/test`; the existing reset test can use `holdResetIcon` too.)

Run: `npm run test:e2e` → PASS.

- [ ] **Step 8: commit** `feat: set the team of each tablet with the animator code (#19)`.

---

### Task 4: Standalone pieces for the rotation screens

**Files:**
- Modify: `src/components/Clock.tsx` (+ test), `src/components/GameHeader.tsx` (pass the label), `src/components/CutawayLock.tsx` (+ test), `src/components/PadlockScreen.tsx`
- Create: `src/components/TimeUpScreen.tsx` (+ `.test.tsx`)
- Modify: `src/styles/screens.css`

**Interfaces:**
- Consumes: `AnswerZone` `secret` / `wrongMessage`, `isAnimatorCode` (Task 3).
- Produces:
  - `ClockProps = { seconds: number; label: string }` (accessible name of the `timer`).
  - `CutawayLockProps.foundDigits: readonly (number | null)[]` — a pin is down when its entry is a digit (null or missing = up), in any order.
  - `PadlockScreenProps.foundDigits: readonly (number | null)[]`.
  - `TimeUpScreen({ header: ReactNode; step: QuizStep; animatorCode: string; onUnlock(code: string): void })`.

- [ ] **Step 1: failing tests**

`src/components/Clock.test.tsx`: pass `label="Temps restant"` in the three renders and add:

```tsx
it('is named after what it counts', () => {
  render(<Clock seconds={60} label="Temps total restant" />)
  expect(screen.getByRole('timer', { name: 'Temps total restant' })).toHaveTextContent('01:00')
})
```

`src/components/CutawayLock.test.tsx`, add:

```tsx
it('drops the pins of the challenges found, in any order', () => {
  const { container } = render(<CutawayLock total={6} foundDigits={[null, 7, null, null, 2, null]} fallingIndex={4} />)
  expect(screen.getByRole('img', { name: 'Cadenas : 2 goupilles tombées sur 6' })).toBeInTheDocument()
  const pins = [...container.querySelectorAll('.lock-pin')].map((pin) => pin.getAttribute('class'))
  expect(pins).toEqual([
    'lock-pin', 'lock-pin lock-pin--down', 'lock-pin', 'lock-pin',
    'lock-pin lock-pin--down lock-pin--falling', 'lock-pin',
  ])
  expect([...container.querySelectorAll('.lock-digit')].map((d) => d.textContent)).toEqual(['·', '7', '·', '·', '2', '·'])
})
```

(`screen` must be imported if the file does not import it yet.)

`src/components/TimeUpScreen.test.tsx`:

```tsx
/** @file Tests for the « Temps écoulé » screen. */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { QuizStep } from '../config/types'
import { TimeUpScreen } from './TimeUpScreen'

const step: QuizStep = { title: 'La bibliothèque', instruction: 'x', answer: { kind: 'digits', value: '0472' }, digit: 2 }
const press = (name: string) => userEvent.click(screen.getByRole('button', { name }))
async function typeCode(code: string) {
  for (const digit of code) await press(digit)
  await press('Valider')
}

describe('TimeUpScreen', () => {
  it('calls for an animator and hides the code being typed', async () => {
    render(<TimeUpScreen header={<header>entête</header>} step={step} animatorCode="2710" onUnlock={vi.fn()} />)
    expect(screen.getByText('entête')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeInTheDocument()
    expect(screen.getByText('Épreuve : La bibliothèque')).toBeInTheDocument()
    await press('2')
    await press('7')
    expect(screen.getByLabelText('Réponse tapée')).toHaveTextContent('••')
  })
  it('refuses a wrong code', async () => {
    render(<TimeUpScreen header={null} step={step} animatorCode="2710" onUnlock={vi.fn()} />)
    await typeCode('1111')
    expect(screen.getByRole('alert')).toHaveTextContent('Ce n’est pas le code animateur.')
  })
  it('shows the digit once the code is right, then goes on with that code', async () => {
    const onUnlock = vi.fn()
    render(<TimeUpScreen header={null} step={step} animatorCode="2710" onUnlock={onUnlock} />)
    await typeCode('2710')
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre de l’épreuve : 2')
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument()
    await press('Continuer')
    expect(onUnlock).toHaveBeenCalledWith('2710')
  })
})
```

Run → FAIL.

- [ ] **Step 2: implement**

`src/components/Clock.tsx`: add `label: string` to `ClockProps` (JSDoc: « Accessible name, e.g. "Temps total restant". »), document `@param props.label`, and use `aria-label={label}`. In `GameHeader.tsx` pass `label="Temps restant"` (replaced in Task 5).

`src/components/CutawayLock.tsx`:
- `foundDigits` JSDoc/type: `/** Digit per step (index = step number - 1); null or missing while not found. Found pins are down. */ foundDigits: readonly (number | null)[]`.
- Add `const isFound = (digit: number | null | undefined): digit is number => digit !== null && digit !== undefined` (comment: « Challenges are found in rotation order, so any pin can be down. »).
- `pinClass(found: boolean, falling: boolean)`: `if (!found) return 'lock-pin'`, then the down / falling classes as today.
- In the component: `const down = foundDigits.filter(isFound).length`; per pin `const digit = foundDigits[i]`, `const found = isFound(digit)`, `className={pinClass(found, i === fallingIndex)}`, and `{found ? digit : '·'}`.

`src/components/PadlockScreen.tsx`: `foundDigits: readonly (number | null)[]` with JSDoc « Digit per step; all known once the padlock shows. »

`src/components/TimeUpScreen.tsx`:

```tsx
/** @file Shown when a slot ended without its digit: an animator types the code, the tablet shows the digit, then the group goes on. */
import { useState, type ReactNode } from 'react'
import type { QuizStep } from '../config/types'
import { isAnimatorCode } from '../game/answer'
import { AnswerZone } from './AnswerZone'

/** Props of TimeUpScreen. */
export interface TimeUpScreenProps {
  /** In-game header (clocks and candles). */
  header: ReactNode
  /** Challenge whose slot ended without its digit. */
  step: QuizStep
  /** `code_animateur` from quiz.yaml. */
  animatorCode: string
  /** Called on « Continuer », once the digit was shown, with the code the animator typed. */
  onUnlock(code: string): void
}

/**
 * « Temps écoulé : appelez un animateur ».
 * @param props See TimeUpScreenProps.
 * @returns The screen; the parent remounts it (React key) for each missed challenge.
 */
export function TimeUpScreen({ header, step, animatorCode, onUnlock }: TimeUpScreenProps) {
  // Only set once the right code was typed: the digit stays on screen until « Continuer ».
  const [code, setCode] = useState<string | null>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const submit = (text: string) => {
    if (isAnimatorCode(text, animatorCode)) setCode(text)
    else setWrongAttempts((count) => count + 1)
  }
  return (
    <main className="screen time-up">
      {header}
      <section className="parchment">
        <h2>Temps écoulé : appelez un animateur</h2>
        <p className="instruction">Épreuve : {step.title}</p>
      </section>
      {code === null ? (
        <AnswerZone kind="digits" secret wrongAttempts={wrongAttempts} wrongMessage="Ce n’est pas le code animateur." onSubmit={submit} />
      ) : (
        <div className="answer-zone">
          <p className="found" role="status">Chiffre de l’épreuve : <b>{step.digit}</b></p>
          <button type="button" className="seal-button" onClick={() => onUnlock(code)}>Continuer</button>
        </div>
      )}
    </main>
  )
}
```

`src/styles/screens.css`: `.time-up .parchment h2 { font-size: 40px; }` (the title is long) and in the phone block `.time-up .parchment h2 { font-size: 30px; }`.

Run: `npm run test:run && npm run typecheck && npm run lint` → green.

- [ ] **Step 3: commit** `feat: add the time-up screen and per-challenge lock pins (#19)`.

---

### Task 5: Play the rotation (state, hook, screens, e2e)

This is the switch: the old sequential state (`stepIndex`, `next`, `padlock` status) is replaced in one go, so the app only compiles again at Step 9. Commit once, at the end, when everything is green.

**Files:**
- Modify: `src/game/progress.ts`, `progress.test.ts`, `restore.ts`, `restore.test.ts`, `src/services/savedGame.test.ts`
- Create: `src/hooks/useNow.ts` (+ test); Delete: `src/hooks/useCountdown.ts`, `useCountdown.test.ts`
- Modify: `src/hooks/useGameProgress.ts` (+ test)
- Modify: `src/game/time.ts` (+ test): delete `elapsedSeconds`, `formatDuration`
- Modify: `src/components/GameHeader.tsx`, `StepScreen.tsx`, `VictoryScreen.tsx`, `TeamGame.tsx` (+ tests), `src/styles/controls.css`, `screens.css`, `victory.css`
- Modify: `quiz.yaml`, `e2e/typing.ts`, `e2e/game.spec.ts`, `e2e/save-and-reset.spec.ts`

**Interfaces:**
- Consumes: `gamePhase`, `GamePhase`, `GameStatus`, `slotTiming`, `challengeAt` (Task 2); `TimeUpScreen`, `Clock.label`, `CutawayLock`/`PadlockScreen` nullable digits (Task 4); `HomeScreen`, `ResetControl.onChangeTeam` (Task 3).
- Produces:
  - `GameState = { status: GameStatus; digits: (number | null)[]; startedAt: number | null; finishedAt: number | null; wrongAttempts: number; wrongSlot: number | null }`.
  - `GameAction = start{now} | enter{text, now} | answer{challenge, text, now} | giveDigit{challenge, code, now} | unlock{code: number[], now} | reset`.
  - `initialGameState(stepCount: number): GameState`, `createGameReducer(config: QuizConfig, teamIndex: number)`, `earnsDigit(state, config, teamIndex, { challenge, text, now }): boolean`, `wrongAttemptsIn(state, slot: number | null): number`.
  - `useNow(running: boolean): number`.
  - `useGameProgress(config, teamIndex): GameProgress` with `answer(challenge, text): boolean`, `giveDigit(challenge, code): void`, `unlock(code): boolean`, `start`, `enter`, `reset`.
  - `GameHeaderProps = { slot: number | null; total: number; solved: number; slotSeconds: number; totalSeconds: number }`.
  - `StepScreenProps = { header; step; challenge: number; digits: readonly (number | null)[]; wrongAttempts; secondsLeft: number; isLastSlot: boolean; onSubmit(text) }`.
  - `VictoryScreenProps = { header; message? }`.

- [ ] **Step 1: reducer — failing tests**

Replace `src/game/progress.test.ts`:

```ts
/** @file Tests for the game state machine of one team. */
import type { QuizConfig } from '../config/types'
import { createGameReducer, earnsDigit, initialGameState, wrongAttemptsIn, type GameState } from './progress'

const MIN = 60_000
const config: QuizConfig = {
  title: 'T', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '14' }, digit: 4 },
    { title: 'B', instruction: 'b', answer: { kind: 'letters', value: 'Fantôme' }, digit: 0 },
  ],
  padlock: { order: [2, 1] },
}
// The Zombies (team 1) play B (challenge 1) during slot 0, then A (challenge 0) during slot 1.
const reduce = createGameReducer(config, 1)
const withEntrance = createGameReducer({ ...config, entrance: { message: 'm', answer: { kind: 'letters', value: 'Bouh' } } }, 1)
const home = initialGameState(2)
const playing: GameState = { ...home, status: 'playing', startedAt: 0 }
const allFound: GameState = { ...playing, digits: [4, 0] }
const atEntrance: GameState = { ...home, status: 'entrance' }

describe('game reducer', () => {
  it('starts on the home screen, with no digit', () => {
    expect(home).toEqual({ status: 'home', digits: [null, null], startedAt: null, finishedAt: null, wrongAttempts: 0, wrongSlot: null })
  })
  it('records the start time, once', () => {
    expect(reduce(home, { type: 'start', now: 0 })).toEqual(playing)
    expect(reduce(playing, { type: 'start', now: 5 })).toBe(playing)
  })
  it('stores the digit of the challenge on screen', () => {
    expect(reduce(playing, { type: 'answer', challenge: 1, text: 'fantome', now: MIN })).toEqual({ ...playing, digits: [null, 0] })
  })
  it('counts wrong answers in the current slot, and clears them on the right one', () => {
    const once = reduce(playing, { type: 'answer', challenge: 1, text: 'chat', now: MIN })
    const twice = reduce(once, { type: 'answer', challenge: 1, text: 'loup', now: 2 * MIN })
    expect(twice).toEqual({ ...playing, wrongAttempts: 2, wrongSlot: 0 })
    expect(wrongAttemptsIn(twice, 0)).toBe(2)
    expect(reduce(twice, { type: 'answer', challenge: 1, text: 'Fantôme', now: 3 * MIN }).wrongAttempts).toBe(0)
  })
  it('forgets the wrong tries of an earlier slot', () => {
    const wrongInSlot0 = reduce(playing, { type: 'answer', challenge: 1, text: 'chat', now: MIN })
    expect(wrongAttemptsIn(wrongInSlot0, 1)).toBe(0)
    const helped = reduce(wrongInSlot0, { type: 'giveDigit', challenge: 1, code: '2710', now: 16 * MIN })
    expect(reduce(helped, { type: 'answer', challenge: 0, text: '99', now: 17 * MIN })).toMatchObject({ wrongAttempts: 1, wrongSlot: 1 })
  })
  it('ignores an answer for a challenge that is not on screen', () => {
    // Tapped just as the slot changed: it must not be checked against the next challenge.
    expect(reduce(playing, { type: 'answer', challenge: 1, text: 'fantome', now: 15 * MIN }).digits).toEqual([null, null])
    expect(reduce(playing, { type: 'answer', challenge: 0, text: '14', now: MIN })).toBe(playing)
  })
  it('ignores answers once the digit is found, and outside of a game', () => {
    const solved = { ...playing, digits: [null, 0] }
    expect(reduce(solved, { type: 'answer', challenge: 1, text: 'fantome', now: 2 * MIN })).toBe(solved)
    expect(reduce(home, { type: 'answer', challenge: 1, text: 'fantome', now: MIN })).toBe(home)
  })
  it('gives the digit of a missed challenge with the animator code', () => {
    expect(reduce(playing, { type: 'giveDigit', challenge: 1, code: '2710', now: 15 * MIN })).toEqual({ ...playing, digits: [null, 0] })
  })
  it('refuses to give a digit with a wrong code, too early, or for another challenge', () => {
    expect(reduce(playing, { type: 'giveDigit', challenge: 1, code: '1111', now: 15 * MIN })).toBe(playing)
    expect(reduce(playing, { type: 'giveDigit', challenge: 1, code: '2710', now: MIN })).toBe(playing)
    expect(reduce(playing, { type: 'giveDigit', challenge: 0, code: '2710', now: 15 * MIN })).toBe(playing)
  })
  it('keeps the padlock closed before the last slot ends', () => {
    expect(reduce(allFound, { type: 'unlock', code: [0, 4], now: 29 * MIN })).toBe(allFound)
  })
  it('opens the padlock with the right code and freezes the time', () => {
    const wrong = reduce(allFound, { type: 'unlock', code: [4, 0], now: 30 * MIN })
    expect(wrong).toEqual({ ...allFound, wrongAttempts: 1, wrongSlot: 2 })
    expect(reduce(wrong, { type: 'unlock', code: [0, 4], now: 31 * MIN }))
      .toEqual({ ...wrong, status: 'won', finishedAt: 31 * MIN, wrongAttempts: 0 })
  })
  it('goes back home from anywhere on reset', () => {
    expect(reduce(allFound, { type: 'reset' })).toEqual(home)
  })
  it('goes to the entrance first when there is one, without starting the clock', () => {
    expect(withEntrance(home, { type: 'start', now: 0 })).toEqual(atEntrance)
  })
  it('counts wrong entrance answers, then starts the clock on the right one', () => {
    const wrong = withEntrance(atEntrance, { type: 'enter', text: 'chat', now: 0 })
    expect(wrong).toEqual({ ...atEntrance, wrongAttempts: 1 })
    expect(wrongAttemptsIn(wrong, null)).toBe(1)
    expect(withEntrance(wrong, { type: 'enter', text: 'bouh', now: 3000 })).toEqual({ ...playing, startedAt: 3000 })
  })
  it('ignores enter outside of the entrance', () => {
    expect(withEntrance(playing, { type: 'enter', text: 'bouh', now: 0 })).toBe(playing)
    expect(reduce(atEntrance, { type: 'enter', text: 'bouh', now: 0 })).toBe(atEntrance)
  })
})

describe('earnsDigit', () => {
  it('is true only for the right answer to the challenge on screen', () => {
    expect(earnsDigit(playing, config, 1, { challenge: 1, text: 'Fantôme', now: MIN })).toBe(true)
    expect(earnsDigit(playing, config, 1, { challenge: 1, text: 'chat', now: MIN })).toBe(false)
    expect(earnsDigit(playing, config, 1, { challenge: 0, text: '14', now: MIN })).toBe(false)
  })
})
```

Run: `npx vitest run src/game/progress.test.ts` → FAIL.

- [ ] **Step 2: reducer — implement**

Replace `src/game/progress.ts`:

```ts
/**
 * @file Game state machine of one team: home → entrance (optional) → playing → won. It records facts only
 * (answers, digits given by an animator, padlock opened); the clock decides the screen (see phase.ts).
 * Pure, so it can be saved and restored.
 */
import type { QuizConfig } from '../config/types'
import { isAnimatorCode, isRightAnswer } from './answer'
import { isPadlockCode, padlockCode } from './padlock'
import { gamePhase, type GameStatus } from './phase'

export type { GameStatus }

/** Whole game progress of the tablet's team. */
export interface GameState {
  status: GameStatus
  /** Digit per challenge (index = challenge number - 1): found by the group or given by an animator; null before. */
  digits: (number | null)[]
  /** Start timestamp in ms, null until the group is in the room. */
  startedAt: number | null
  /** Timestamp in ms when the padlock opened, null before. */
  finishedAt: number | null
  /** Wrong tries in `wrongSlot` (drives the message and the shake). */
  wrongAttempts: number
  /** Slot of those tries: null at the entrance, stepCount at the padlock. A new slot starts from zero. */
  wrongSlot: number | null
}

/** Player actions. `now` is passed in so the reducer stays pure; each one is checked against the phase at `now`. */
export type GameAction =
  | { type: 'start'; now: number } | { type: 'enter'; text: string; now: number }
  | { type: 'answer'; challenge: number; text: string; now: number }
  | { type: 'giveDigit'; challenge: number; code: string; now: number }
  | { type: 'unlock'; code: number[]; now: number } | { type: 'reset' }

/**
 * State before the game starts.
 * @param stepCount Number of challenges.
 * @returns The home state, with no digit.
 */
export function initialGameState(stepCount: number): GameState {
  return {
    status: 'home', digits: Array.from({ length: stepCount }, () => null),
    startedAt: null, finishedAt: null, wrongAttempts: 0, wrongSlot: null,
  }
}

/**
 * Wrong tries to show now: those of an earlier slot no longer count.
 * @param state Game state.
 * @param slot Current slot (null at the entrance, stepCount at the padlock).
 * @returns Number of wrong tries in that slot.
 */
export function wrongAttemptsIn(state: GameState, slot: number | null): number {
  return state.wrongSlot === slot ? state.wrongAttempts : 0
}

/**
 * The one rule for a right answer, shared by the reducer and useGameProgress (which needs it inside the tap, for the clack).
 * @param state Game state.
 * @param config Validated quiz.
 * @param teamIndex 0-based team of the tablet.
 * @param answer Challenge the children answered (the one they saw), typed text and time.
 * @returns True when that challenge is on screen, not found yet, and the text is its answer.
 */
export function earnsDigit(
  state: GameState, config: QuizConfig, teamIndex: number, answer: { challenge: number; text: string; now: number },
): boolean {
  const phase = gamePhase(state, config, teamIndex, answer.now)
  return phase.kind === 'challenge' && phase.challenge === answer.challenge
    && isRightAnswer(answer.text, config.steps[answer.challenge].answer)
}

function withDigit(state: GameState, challenge: number, digit: number): GameState {
  return { ...state, digits: state.digits.map((d, i) => (i === challenge ? digit : d)) }
}

function countWrong(state: GameState, slot: number | null): GameState {
  return { ...state, wrongAttempts: wrongAttemptsIn(state, slot) + 1, wrongSlot: slot }
}

/**
 * Builds the reducer for a quiz and a team. Invalid actions return the same state object.
 * @param config Validated quiz.
 * @param teamIndex 0-based team of the tablet (drives the rotation).
 * @returns A reducer usable with useReducer.
 */
export function createGameReducer(config: QuizConfig, teamIndex: number) {
  const code = padlockCode(config.steps, config.padlock.order)
  return (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'start':
        if (state.status !== 'home') return state
        // With an entrance message the clock waits until the group is in the room.
        return config.entrance ? { ...state, status: 'entrance' } : { ...state, status: 'playing', startedAt: action.now }
      case 'enter':
        if (state.status !== 'entrance' || !config.entrance) return state
        return isRightAnswer(action.text, config.entrance.answer)
          ? { ...state, status: 'playing', startedAt: action.now, wrongAttempts: 0, wrongSlot: null }
          : countWrong(state, null)
      case 'answer': {
        const phase = gamePhase(state, config, teamIndex, action.now)
        if (phase.kind !== 'challenge' || phase.challenge !== action.challenge) return state
        return earnsDigit(state, config, teamIndex, action)
          ? { ...withDigit(state, action.challenge, config.steps[action.challenge].digit), wrongAttempts: 0 }
          : countWrong(state, phase.slot)
      }
      case 'giveDigit': {
        const phase = gamePhase(state, config, teamIndex, action.now)
        if (phase.kind !== 'timeUp' || phase.challenge !== action.challenge) return state
        if (!isAnimatorCode(action.code, config.animatorCode)) return state
        return withDigit(state, action.challenge, config.steps[action.challenge].digit)
      }
      case 'unlock':
        if (gamePhase(state, config, teamIndex, action.now).kind !== 'padlock') return state
        return isPadlockCode(code, action.code)
          ? { ...state, status: 'won', finishedAt: action.now, wrongAttempts: 0 }
          : countWrong(state, config.stepCount)
      case 'reset':
        return initialGameState(config.stepCount)
    }
  }
}
```

Run the progress test → PASS (the app does not compile yet: expected until Step 9).

- [ ] **Step 3: restore — failing tests, then implement**

Replace `src/game/restore.test.ts`:

```ts
/** @file Tests for the check of a saved game state. */
import { restoreGameState } from './restore'

// Two-challenge quiz in every case.
const playing = { status: 'playing', digits: [null, 0], startedAt: 1000, finishedAt: null, wrongAttempts: 3, wrongSlot: 0 }
const won = { status: 'won', digits: [4, 0], startedAt: 1000, finishedAt: 5000, wrongAttempts: 0, wrongSlot: 2 }
const entrance = { status: 'entrance', digits: [null, null], startedAt: null, finishedAt: null, wrongAttempts: 2, wrongSlot: null }
const cleared = { wrongAttempts: 0, wrongSlot: null }

describe('restoreGameState', () => {
  it('restores a game in progress, without the wrong tries', () => {
    expect(restoreGameState(playing, 2)).toEqual({ ...playing, ...cleared })
  })
  it('restores the victory and the entrance', () => {
    expect(restoreGameState(won, 2)).toEqual({ ...won, ...cleared })
    expect(restoreGameState(entrance, 2)).toEqual({ ...entrance, ...cleared })
  })
  it.each([
    ['nothing', null],
    ['text', 'playing'],
    ['home (nothing to resume)', { ...playing, status: 'home' }],
    ['a sprint 8 save', { status: 'padlock', stepIndex: 1, foundDigits: [4, 0], startedAt: 1000, finishedAt: null }],
    ['digits not a list', { ...playing, digits: '4' }],
    ['too few digits', { ...playing, digits: [0] }],
    ['digit above 9', { ...playing, digits: [12, null] }],
    ['decimal digit', { ...playing, digits: [0.5, null] }],
    ['no start time', { ...playing, startedAt: null }],
    ['start time as text', { ...playing, startedAt: '1000' }],
    ['playing with an end time', { ...playing, finishedAt: 5000 }],
    ['victory with a missing digit', { ...won, digits: [null, 0] }],
    ['victory without end time', { ...won, finishedAt: null }],
    ['entrance with a start time', { ...entrance, startedAt: 1000 }],
    ['entrance with a digit', { ...entrance, digits: [4, null] }],
  ])('rejects %s', (_label, value) => {
    expect(restoreGameState(value, 2)).toBeNull()
  })
})
```

Replace `src/game/restore.ts`:

```ts
/** @file Checks a game state read back from storage, so a damaged or tampered save can never break the game. */
import { initialGameState, type GameState } from './progress'

const RESUMABLE: readonly string[] = ['entrance', 'playing', 'won']

const isTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isDigit = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9

/**
 * Turns a value read from storage back into a game state, if it is a coherent one.
 * @param value Parsed JSON (anything).
 * @param stepCount Number of challenges of the current quiz.
 * @returns The state (wrong tries cleared), or null when there is nothing usable to resume.
 */
export function restoreGameState(value: unknown, stepCount: number): GameState | null {
  if (typeof value !== 'object' || value === null) return null
  const { status, digits, startedAt, finishedAt } = value as Record<string, unknown>
  if (typeof status !== 'string' || !RESUMABLE.includes(status)) return null
  if (!Array.isArray(digits) || digits.length !== stepCount || !digits.every((d) => d === null || isDigit(d))) return null
  const known = digits as (number | null)[]
  const fresh = { ...initialGameState(stepCount), digits: known }
  // The entrance comes before any progress: nothing else may be set.
  if (status === 'entrance') {
    return known.every((d) => d === null) && startedAt === null && finishedAt === null ? { ...fresh, status: 'entrance' } : null
  }
  if (!isTime(startedAt)) return null
  if (status === 'playing') return finishedAt === null ? { ...fresh, status: 'playing', startedAt } : null
  return isTime(finishedAt) && known.every(isDigit) ? { ...fresh, status: 'won', startedAt, finishedAt } : null
}
```

In `src/services/savedGame.test.ts`, the fixture becomes
`const state: GameState = { status: 'playing', digits: [4, null], startedAt: 1000, finishedAt: null, wrongAttempts: 0, wrongSlot: null }`.

Run: `npx vitest run src/game src/services` → PASS.

- [ ] **Step 4: `useNow` replaces `useCountdown`**

`src/hooks/useNow.test.ts`:

```ts
/** @file Tests for the ticking current time. */
import { act, renderHook } from '@testing-library/react'
import { useNow } from './useNow'

describe('useNow', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0) })
  afterEach(() => vi.useRealTimers())

  it('follows the real time while running', () => {
    const { result } = renderHook(() => useNow(true))
    expect(result.current).toBe(0)
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current).toBe(1000)
  })
  it('does not tick when stopped', () => {
    const { result } = renderHook(() => useNow(false))
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current).toBe(0)
  })
})
```

`src/hooks/useNow.ts`:

```ts
/** @file Current time, refreshed twice a second while the game runs: the slot, its clocks and the screen follow from it. */
import { useEffect, useState } from 'react'

/** Half a second, so the display never lags more than that behind the real time. */
const TICK_MS = 500

/**
 * Ticking Date.now().
 * @param running False on screens without a clock (home, entrance, victory): no timer runs then.
 * @returns A timestamp in ms, at most TICK_MS old while running (it may predate a start that just happened).
 */
export function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [running])
  return now
}
```

`git rm src/hooks/useCountdown.ts src/hooks/useCountdown.test.ts`.
In `src/game/time.ts` delete `elapsedSeconds` and `formatDuration` (and their tests in `time.test.ts`): the victory no longer shows a time.

Run: `npx vitest run src/hooks/useNow.test.ts src/game/time.test.ts` → PASS.

- [ ] **Step 5: `useGameProgress` — failing tests, then implement**

Replace `src/hooks/useGameProgress.test.ts`:

```ts
/** @file Tests for the game progress hook, saved in localStorage. */
import { act, renderHook } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { quizFingerprint } from '../game/fingerprint'
import { STORAGE_KEY } from '../services/savedGame'
import { useGameProgress } from './useGameProgress'

const MIN = 60_000
const START = Date.parse('2026-10-31T20:15:00+01:00')
const config: QuizConfig = {
  title: 'T', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '3' }, digit: 3 },
    { title: 'B', instruction: 'b', answer: { kind: 'digits', value: '8' }, digit: 8 },
  ],
  padlock: { order: [2, 1] },
}
/** Sets the clock `minutes` after « Commencer ». */
const at = (minutes: number) => vi.setSystemTime(START + minutes * MIN)
// The Zombies (team 1) play B (challenge 1), then A (challenge 0).
const zombies = () => renderHook(() => useGameProgress(config, 1))

describe('useGameProgress', () => {
  beforeEach(() => { vi.useFakeTimers(); at(0) })
  afterEach(() => vi.useRealTimers())

  it('tells whether an answer earns the digit of the challenge on screen', () => {
    const { result } = zombies()
    let right = true
    act(() => { right = result.current.answer(1, '8') })
    expect(right).toBe(false) // still on the home screen
    act(() => result.current.start())
    act(() => { right = result.current.answer(0, '3') })
    expect(right).toBe(false) // not this team's challenge now
    act(() => { right = result.current.answer(1, '9') })
    expect(right).toBe(false)
    act(() => { right = result.current.answer(1, '8') })
    expect(right).toBe(true)
    expect(result.current.state.digits).toEqual([null, 8])
    act(() => { right = result.current.answer(1, '8') })
    expect(right).toBe(false)
  })
  it('plays the rotation up to the victory', () => {
    const { result } = zombies()
    act(() => result.current.start())
    expect(result.current.state.startedAt).toBe(START)
    act(() => { result.current.answer(1, '8') })
    at(15)
    act(() => { result.current.answer(0, '3') })
    let opened = true
    at(29)
    act(() => { opened = result.current.unlock([8, 3]) })
    expect(opened).toBe(false) // the padlock comes after the last slot
    at(30)
    act(() => { opened = result.current.unlock([3, 8]) })
    expect(opened).toBe(false)
    act(() => { opened = result.current.unlock([8, 3]) })
    expect(opened).toBe(true)
    expect(result.current.state).toMatchObject({ status: 'won', finishedAt: START + 30 * MIN })
  })
  it('gives the digit of a missed challenge once the animator code is typed', () => {
    const { result } = zombies()
    act(() => result.current.start())
    at(15)
    act(() => result.current.giveDigit(1, '2710'))
    expect(result.current.state.digits).toEqual([null, 8])
  })
  it('resumes the saved game after a reload, even several slots later', () => {
    const first = zombies()
    act(() => first.result.current.start())
    act(() => { first.result.current.answer(1, '8') })
    const saved = first.result.current.state
    first.unmount()
    at(40)
    expect(zombies().result.current.state).toEqual(saved)
  })
  it('does not resume a game saved for another quiz', () => {
    const first = zombies()
    act(() => first.result.current.start())
    first.unmount()
    const changed = { ...config, steps: [{ ...config.steps[0], digit: 7 }, config.steps[1]] }
    expect(renderHook(() => useGameProgress(changed, 1)).result.current.state.status).toBe('home')
  })
  it('goes back home and deletes the save on reset', () => {
    const { result } = zombies()
    act(() => result.current.start())
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    act(() => result.current.reset())
    expect(result.current.state.status).toBe('home')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
  it('starts the clock only once the entrance is solved', () => {
    const withEntrance: QuizConfig = { ...config, entrance: { message: 'm', answer: { kind: 'letters', value: 'Bouh' } } }
    const { result } = renderHook(() => useGameProgress(withEntrance, 1))
    act(() => result.current.start())
    expect(result.current.state).toMatchObject({ status: 'entrance', startedAt: null })
    at(5)
    act(() => result.current.enter('bouh'))
    expect(result.current.state).toMatchObject({ status: 'playing', startedAt: START + 5 * MIN })
  })
  it('ignores a stuck entrance save when the quiz no longer has an entrance', () => {
    const stuck = { status: 'entrance', digits: [null, null], startedAt: null, finishedAt: null, wrongAttempts: 0, wrongSlot: null }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint: quizFingerprint(config), state: stuck }))
    const { result } = zombies()
    expect(result.current.state.status).toBe('home')
    act(() => result.current.start())
    expect(result.current.state.status).toBe('playing')
  })
})
```

Replace `src/hooks/useGameProgress.ts`:

```ts
/** @file Game progress of the tablet's team, saved in localStorage so a reload loses nothing. */
import { useEffect, useMemo, useReducer } from 'react'
import type { QuizConfig } from '../config/types'
import { quizFingerprint } from '../game/fingerprint'
import { isPadlockCode, padlockCode } from '../game/padlock'
import { gamePhase } from '../game/phase'
import { createGameReducer, earnsDigit, initialGameState, type GameState } from '../game/progress'
import { clearGame, loadGame, saveGame } from '../services/savedGame'

/** Game state and the actions the screens can trigger. */
export interface GameProgress {
  state: GameState
  /** Leaves the home screen: to the entrance message, or straight into the first slot. */
  start(): void
  /** Submits the answer of the entrance message; the right one starts the clock. */
  enter(text: string): void
  /** Submits the answer typed for `challenge` (the one on screen); true when it earns the digit, so the caller plays the clack inside the tap. */
  answer(challenge: number, text: string): boolean
  /** Records the digit of a missed challenge, once an animator typed the code. */
  giveDigit(challenge: number, code: string): void
  /** Tries a padlock code; true when it opens (the caller plays the sound inside the tap). */
  unlock(code: number[]): boolean
  /** Goes back to the home screen (same team) and deletes the saved game. */
  reset(): void
}

/**
 * Holds the progress of one team's game, resumed from and saved to localStorage.
 * @param config Validated quiz.
 * @param teamIndex 0-based team of the tablet.
 * @returns The state and its actions.
 */
export function useGameProgress(config: QuizConfig, teamIndex: number): GameProgress {
  const fingerprint = useMemo(() => quizFingerprint(config), [config])
  const code = useMemo(() => padlockCode(config.steps, config.padlock.order), [config])
  const reducer = useMemo(() => createGameReducer(config, teamIndex), [config, teamIndex])
  const [state, dispatch] = useReducer(reducer, null, () => {
    const loaded = loadGame(fingerprint, config.stepCount)
    // A quiz edited to remove its entrance must not resume stuck on 'entrance': the reducer no
    // longer has an action that leaves that status, so « Commencer » would silently do nothing.
    if (loaded?.status === 'entrance' && !config.entrance) return initialGameState(config.stepCount)
    return loaded ?? initialGameState(config.stepCount)
  })
  useEffect(() => {
    // Home means "no game": nothing worth keeping, and it is how reset deletes the save.
    if (state.status === 'home') clearGame()
    else saveGame(fingerprint, state)
  }, [fingerprint, state])
  return {
    state,
    start: () => dispatch({ type: 'start', now: Date.now() }),
    enter: (text) => dispatch({ type: 'enter', text, now: Date.now() }),
    answer: (challenge, text) => {
      const action = { type: 'answer', challenge, text, now: Date.now() } as const
      dispatch(action)
      return earnsDigit(state, config, teamIndex, action)
    },
    giveDigit: (challenge, animatorCode) => dispatch({ type: 'giveDigit', challenge, code: animatorCode, now: Date.now() }),
    unlock: (entered) => {
      const now = Date.now()
      dispatch({ type: 'unlock', code: entered, now })
      // Same checks as the reducer: the caller needs the answer now, inside the tap.
      return gamePhase(state, config, teamIndex, now).kind === 'padlock' && isPadlockCode(code, entered)
    },
    reset: () => dispatch({ type: 'reset' }),
  }
}
```

Run: `npx vitest run src/hooks` → PASS.

- [ ] **Step 6: header, step and victory screens — failing tests, then implement**

Replace `src/components/GameHeader.test.tsx`:

```tsx
/** @file Tests for the in-game header. */
import { render, screen } from '@testing-library/react'
import { GameHeader } from './GameHeader'

describe('GameHeader', () => {
  it('shows the slot, its time left in big and the total time in small', () => {
    render(<GameHeader slot={2} total={6} solved={2} slotSeconds={767} totalSeconds={3467} />)
    expect(screen.getByText('Épreuve 3/6')).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveTextContent('12:47')
    expect(screen.getByRole('timer', { name: 'Temps total restant' })).toHaveTextContent('57:47')
    expect(screen.getByRole('list', { name: 'Étape 3 sur 6' })).toBeInTheDocument()
  })
  it('shows only the candles once every slot is over', () => {
    render(<GameHeader slot={null} total={6} solved={6} slotSeconds={0} totalSeconds={0} />)
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Toutes les étapes terminées' })).toBeInTheDocument()
  })
})
```

Replace `src/components/GameHeader.tsx`:

```tsx
/** @file In-game header: time left for the challenge (big, with its number), candle progress, total time left (small). */
import { CandleProgress } from './CandleProgress'
import { Clock } from './Clock'

/** Props of GameHeader. Times are computed by the caller from the start time. */
export interface GameHeaderProps {
  /** 0-based slot, or null once every slot is over (padlock, victory): no clocks then. */
  slot: number | null
  /** Number of challenges (= slots). */
  total: number
  /** Challenges with a known digit. */
  solved: number
  /** Seconds left in the slot. */
  slotSeconds: number
  /** Seconds left in the whole game. */
  totalSeconds: number
}

/**
 * Header shown on every in-game screen.
 * @param props See GameHeaderProps.
 * @returns The header.
 */
export function GameHeader({ slot, total, solved, slotSeconds, totalSeconds }: GameHeaderProps) {
  // Spacers keep the candles centred when the clocks are gone.
  const spacer = <span className="header-spacer" aria-hidden="true" />
  return (
    <header className="game-header">
      {slot === null ? spacer : (
        <div className="slot-clock">
          <span className="slot-label">Épreuve {slot + 1}/{total}</span>
          <Clock seconds={slotSeconds} label="Temps restant pour l’épreuve" />
        </div>
      )}
      <CandleProgress total={total} solved={solved} current={slot} />
      {slot === null ? spacer : (
        <p className="total-clock">Total <Clock seconds={totalSeconds} label="Temps total restant" /></p>
      )}
    </header>
  )
}
```

`src/components/StepScreen.test.tsx`: `base` becomes

```tsx
const base: StepScreenProps = {
  header: <header>entête</header>,
  step: { title: 'Le chaudron', instruction: 'Combien d’yeux ?', answer: { kind: 'digits', value: '7' }, digit: 7 },
  challenge: 1, digits: [4, null, null, null, null, null], wrongAttempts: 0, secondsLeft: 252, isLastSlot: false,
  onSubmit: () => {},
}
```

In « shows the step and the keypad » remove the `'Étape 2 sur 6'` line and add `expect(screen.queryByText(/Étape \d sur/)).not.toBeInTheDocument()`. Replace the last two tests by:

```tsx
it('drops the pin, shows the found digit and the time before the next room', () => {
  const { container } = render(<StepScreen {...base} digits={[4, 7, null, null, null, null]} />)
  expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 7')
  expect(screen.getByText('Changement de salle dans 04:12')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Cadenas : 2 goupilles tombées sur 6' })).toBeInTheDocument()
  expect(container.querySelectorAll('.lock-pin')[1]).toHaveClass('lock-pin--falling')
  expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument()
})
it('announces the padlock during the last slot', () => {
  render(<StepScreen {...base} digits={[4, 7, 1, 2, 0, 9]} isLastSlot />)
  expect(screen.getByText('Le cadenas final dans 04:12')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Cadenas ouvert/ })).toBeInTheDocument()
})
```

Replace `src/components/StepScreen.tsx`:

```tsx
/** @file Challenge screen: instruction on a parchment menu, the cutaway lock, typed answer, then the earned digit and the time before the change of room. */
import type { ReactNode } from 'react'
import type { QuizStep } from '../config/types'
import { formatClock } from '../game/time'
import { AnswerZone } from './AnswerZone'
import { CutawayLock } from './CutawayLock'

/** Props of StepScreen. */
export interface StepScreenProps {
  /** In-game header (clocks and candles). */
  header: ReactNode
  step: QuizStep
  /** 0-based challenge number of this step. */
  challenge: number
  /** Digit per challenge, null while not found; this one is solved once it has its own. */
  digits: readonly (number | null)[]
  /** Wrong tries in this slot. */
  wrongAttempts: number
  /** Seconds before every group changes room (shown once the digit is found). */
  secondsLeft: number
  /** Last slot: the padlock comes next, not another room. */
  isLastSlot: boolean
  /** Called with the typed answer. */
  onSubmit(text: string): void
}

/**
 * One challenge of the rotation.
 * @param props See StepScreenProps.
 * @returns The step screen.
 */
export function StepScreen(props: StepScreenProps) {
  const { header, step, challenge, digits, wrongAttempts, secondsLeft, isLastSlot, onSubmit } = props
  const digit = digits[challenge]
  const solved = digit !== null
  return (
    <main className="screen step">
      {header}
      <section className="parchment">
        <h2>{step.title}</h2>
        <p className="instruction">{step.instruction}</p>
        {step.image && (
          <img className="step-image" src={`${import.meta.env.BASE_URL}images/${step.image}`} alt={`Image de l’étape : ${step.title}`} />
        )}
      </section>
      {/* Only the pin of this challenge falls: the others are already down or still up. */}
      <CutawayLock total={digits.length} foundDigits={digits} fallingIndex={solved ? challenge : undefined} />
      {solved ? (
        <div className="answer-zone">
          <p className="found" role="status">Chiffre trouvé : <b>{digit}</b></p>
          <p className="next-room">{isLastSlot ? 'Le cadenas final dans' : 'Changement de salle dans'} {formatClock(secondsLeft)}</p>
        </div>
      ) : (
        <AnswerZone kind={step.answer.kind} wrongAttempts={wrongAttempts} onSubmit={onSubmit} />
      )}
    </main>
  )
}
```

Replace `src/components/VictoryScreen.test.tsx`:

```tsx
/** @file Tests for the victory screen. */
import { render, screen } from '@testing-library/react'
import { VictoryScreen } from './VictoryScreen'

describe('VictoryScreen', () => {
  it('shows the configured message and sends the group to the restaurant door', () => {
    render(<VictoryScreen header={<header>entête</header>} message="La salle est ouverte !" />)
    expect(screen.getByRole('heading', { name: 'La salle est ouverte !' })).toBeInTheDocument()
    expect(screen.getByText('Rendez-vous à la porte du restaurant !')).toBeInTheDocument()
    expect(screen.getByText('entête')).toBeInTheDocument()
  })
  it('falls back to a neutral message', () => {
    render(<VictoryScreen header={null} />)
    expect(screen.getByRole('heading', { name: 'Le cadenas est ouvert !' })).toBeInTheDocument()
  })
})
```

`src/components/VictoryScreen.tsx`: `@file` « Victory: the haunted door opens, then the victory message and where every team meets. »; remove `elapsedSeconds` (prop, JSDoc, import of `formatDuration`) and replace the time paragraph by
`<p className="meeting-point">Rendez-vous à la porte du restaurant !</p>`. In `src/styles/victory.css` rename `.final-time` to `.meeting-point` (two places).

Styles — `src/styles/controls.css`, after `.clock--overtime`:

```css
/* Slot clock (big) with its number above; total clock (small) on the right. */
.slot-clock { display: flex; flex-direction: column; align-items: flex-start; min-width: 150px; }
.slot-label {
  font-family: var(--text-font); font-variant: small-caps lining-nums; font-weight: 700;
  font-size: 20px; letter-spacing: .06em; color: var(--bronze);
}
.total-clock { min-width: 150px; text-align: right; font-size: 18px; color: var(--bronze); }
.total-clock .clock { min-width: 0; font-size: 26px; }
```

and in its phone block: `.slot-clock, .total-clock { min-width: 0; }`, `.slot-label { font-size: 16px; }`, `.total-clock { font-size: 14px; }`, `.total-clock .clock { font-size: 20px; }`.
`src/styles/screens.css`: delete the three `.step-number` rules (no longer used) and add
`.next-room { font-size: 28px; color: var(--amber); font-variant-numeric: lining-nums; }`.

Run: `npx vitest run src/components/GameHeader.test.tsx src/components/StepScreen.test.tsx src/components/VictoryScreen.test.tsx` → PASS.

- [ ] **Step 7: `TeamGame` — failing tests**

Replace `src/components/TeamGame.test.tsx`:

```tsx
/** @file Integration tests: one team's evening, from home to the victory, driven by the clock. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { playPinSound, playVictorySound } from '../services/sound'
import { RESET_HOLD_MS } from './ResetButton'
import { TeamGame } from './TeamGame'

vi.mock('../services/sound', () => ({ playVictorySound: vi.fn(), playPinSound: vi.fn() }))

const MIN = 60_000
const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 },
  ],
  padlock: { order: [2, 1] },
}
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const type = (text: string) => { for (const char of text) press(char); press('Valider') }
/** Moves the clock on; the ticking hook then shows the matching screen. */
const wait = (minutes: number) => act(() => vi.advanceTimersByTime(minutes * MIN))
const holdResetIcon = () => {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Recommencer la partie (appui long)' }))
  act(() => vi.advanceTimersByTime(RESET_HOLD_MS))
}
// The Zombies (team 1) play Le grenier first, then La crypte.
const renderZombies = (overrides: Partial<QuizConfig> = {}, onChangeTeam = vi.fn()) =>
  render(<TeamGame config={{ ...config, ...overrides }} teamIndex={1} onChangeTeam={onChangeTeam} />)

describe('TeamGame', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

  it('shows the team at home, then starts on its own challenge with both clocks', () => {
    renderZombies()
    expect(screen.getByText('Équipe des Zombies')).toBeInTheDocument()
    press('Commencer')
    expect(screen.getByRole('heading', { name: 'Le grenier' })).toBeInTheDocument()
    expect(screen.getByText('Épreuve 1/2')).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveTextContent('15:00')
    expect(screen.getByRole('timer', { name: 'Temps total restant' })).toHaveTextContent('30:00')
  })
  it('waits for the next room once the digit is found, then moves on by itself', () => {
    renderZombies()
    press('Commencer')
    type('0')
    expect(playPinSound).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre trouvé : 0')
    expect(screen.getByText('Changement de salle dans 15:00')).toBeInTheDocument()
    wait(15)
    expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
    expect(screen.getByText('Épreuve 2/2')).toBeInTheDocument()
  })
  it('calls an animator when time ran out, who gives the digit; the group goes on', () => {
    renderZombies()
    press('Commencer')
    type('9')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(playPinSound).not.toHaveBeenCalled()
    wait(15)
    expect(screen.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeInTheDocument()
    type('1111')
    expect(screen.getByRole('alert')).toHaveTextContent('Ce n’est pas le code animateur.')
    type('2710')
    expect(screen.getByRole('status')).toHaveTextContent('Chiffre de l’épreuve : 0')
    press('Continuer')
    expect(screen.getByRole('heading', { name: 'La crypte' })).toBeInTheDocument()
    // The wrong try of the first slot does not follow the group.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('opens the padlock after the last slot and sends the group to the restaurant door', () => {
    renderZombies()
    press('Commencer')
    type('0')
    wait(15)
    type('4')
    wait(15)
    expect(screen.getByRole('heading', { name: 'Le cadenas' })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    press('Ouvrir')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(playVictorySound).not.toHaveBeenCalled()
    // Code: digit of Le grenier (0), then of La crypte (4).
    for (let i = 0; i < 4; i++) press('Chiffre 2 : augmenter')
    press('Ouvrir')
    expect(playVictorySound).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: 'Le cadenas est ouvert !' })).toBeInTheDocument()
    expect(screen.getByText('Rendez-vous à la porte du restaurant !')).toBeInTheDocument()
  })
  it('restarts on the home screen of the same team after a long press and confirmation', () => {
    renderZombies()
    press('Commencer')
    holdResetIcon()
    press('Recommencer')
    expect(screen.getByText('Équipe des Zombies')).toBeInTheDocument()
  })
  it('lets an animator change the team from the reset window', () => {
    const onChangeTeam = vi.fn()
    renderZombies({}, onChangeTeam)
    holdResetIcon()
    press('Changer d’équipe')
    expect(onChangeTeam).toHaveBeenCalledOnce()
  })
  it('shows the great hall behind the game, not on the home screen', () => {
    const { container } = renderZombies()
    expect(container.querySelector('.hall-backdrop')).toBeNull()
    press('Commencer')
    expect(container.querySelector('.hall-backdrop')).not.toBeNull()
  })
  it('shows the entrance message in front of the restaurant, and starts the clocks on its answer', () => {
    const { container } = renderZombies({ entrance: { message: 'Qui suis-je ?', answer: { kind: 'letters', value: 'Bouh' } } })
    press('Commencer')
    expect(screen.getByText('Qui suis-je ?')).toBeInTheDocument()
    expect(container.querySelector('.restaurant-front')).not.toBeNull()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    wait(5) // the clocks wait for the group to be inside
    for (const key of ['B', 'O', 'U', 'H']) press(key)
    press('Valider')
    expect(screen.getByRole('heading', { name: 'Le grenier' })).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveTextContent('15:00')
  })
})
```

Run → FAIL.

- [ ] **Step 8: `TeamGame` — implement**

Replace `src/components/TeamGame.tsx`:

```tsx
/** @file One team's game: the clock picks the challenge and the screen, drawn over its backdrop, with the reset icon on top. */
import type { ReactNode } from 'react'
import type { QuizConfig } from '../config/types'
import { gamePhase, type GamePhase } from '../game/phase'
import { wrongAttemptsIn } from '../game/progress'
import { remainingSeconds, slotTiming } from '../game/time'
import { useGameProgress, type GameProgress } from '../hooks/useGameProgress'
import { useNow } from '../hooks/useNow'
import { playPinSound, playVictorySound } from '../services/sound'
import { HallBackdrop } from './decor/HallBackdrop'
import { RestaurantFront } from './decor/RestaurantFront'
import { EntranceScreen } from './EntranceScreen'
import { GameHeader } from './GameHeader'
import { HomeScreen } from './HomeScreen'
import { PadlockScreen } from './PadlockScreen'
import { ResetControl } from './ResetControl'
import { StepScreen } from './StepScreen'
import { TimeUpScreen } from './TimeUpScreen'
import { VictoryScreen } from './VictoryScreen'

/** Props of TeamGame. */
export interface TeamGameProps {
  config: QuizConfig
  /** 0-based team playing on this tablet. */
  teamIndex: number
  /** Called from the reset window to set the tablet up for another team. */
  onChangeTeam(): void
}

/**
 * The game of the tablet's team.
 * @param props See TeamGameProps.
 * @returns The current screen, with the reset icon.
 */
export function TeamGame({ config, teamIndex, onChangeTeam }: TeamGameProps) {
  const progress = useGameProgress(config, teamIndex)
  // Ticks only while playing: slot changes, clocks and « Temps écoulé » all follow from the time.
  const now = useNow(progress.state.status === 'playing')
  const phase = gamePhase(progress.state, config, teamIndex, now)
  return (
    <>
      {backdrop(phase)}
      {currentScreen({ config, teamIndex, progress, phase, now })}
      <ResetControl onReset={progress.reset} onChangeTeam={onChangeTeam} />
    </>
  )
}

/** Restaurant door for the entrance message, great hall once the group is inside; plain candlelight at home. */
function backdrop(phase: GamePhase): ReactNode {
  if (phase.kind === 'entrance') return <RestaurantFront />
  return phase.kind === 'home' ? null : <HallBackdrop />
}

interface ScreenInput { config: QuizConfig; teamIndex: number; progress: GameProgress; phase: GamePhase; now: number }

/** Screen matching the phase. */
function currentScreen({ config, teamIndex, progress, phase, now }: ScreenInput): ReactNode {
  const { state, start, enter, answer, giveDigit, unlock } = progress
  if (phase.kind === 'entrance' && config.entrance) {
    return <EntranceScreen entrance={config.entrance} wrongAttempts={wrongAttemptsIn(state, null)} onSubmit={enter} />
  }
  if (phase.kind === 'home' || phase.kind === 'entrance' || state.startedAt === null) {
    return (
      <HomeScreen title={config.title} intro={config.intro} teamName={config.teams[teamIndex]}
        challengeCount={config.stepCount} slotMinutes={config.slotMinutes} onStart={start} />
    )
  }
  const { stepCount, slotMinutes } = config
  // `now` may lag one tick behind « Commencer »: never show a time before the start.
  const at = Math.max(now, state.startedAt)
  const timing = slotTiming(state.startedAt, at, slotMinutes)
  const slot = phase.kind !== 'won' && timing.slot < stepCount ? timing.slot : null
  const header = (
    <GameHeader slot={slot} total={stepCount} solved={state.digits.filter((d) => d !== null).length}
      slotSeconds={timing.secondsLeft} totalSeconds={remainingSeconds(state.startedAt, at, stepCount * slotMinutes)} />
  )
  switch (phase.kind) {
    case 'won':
      return <VictoryScreen header={header} message={config.padlock.victoryMessage} />
    case 'padlock': {
      // Sounds start inside the tap handler: tablets only allow sound started by a gesture.
      const open = (code: number[]) => { if (unlock(code)) playVictorySound() }
      return (
        <PadlockScreen header={header} title={config.padlock.title} steps={config.steps} foundDigits={state.digits}
          hint={config.padlock.hint} wrongAttempts={wrongAttemptsIn(state, stepCount)} onOpen={open} />
      )
    }
    case 'timeUp':
      return (
        <TimeUpScreen key={phase.challenge} header={header} step={config.steps[phase.challenge]}
          animatorCode={config.animatorCode} onUnlock={(code) => giveDigit(phase.challenge, code)} />
      )
    case 'challenge':
    case 'waiting': {
      const submit = (text: string) => { if (answer(phase.challenge, text)) playPinSound() }
      return (
        <StepScreen key={phase.challenge} header={header} step={config.steps[phase.challenge]} challenge={phase.challenge}
          digits={state.digits} wrongAttempts={wrongAttemptsIn(state, phase.slot)} secondsLeft={timing.secondsLeft}
          isLastSlot={phase.slot === stepCount - 1} onSubmit={submit} />
      )
    }
  }
}
```

(`remainingSeconds` stays in `time.ts`; update its `durationMinutes` JSDoc to « Total game duration (slots × slot length). ».)

- [ ] **Step 9: unit checks**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: all green. `grep -rn "durationMinutes\|stepIndex\|useCountdown\|formatDuration\|elapsedSeconds" src scripts` → no match (except `remainingSeconds`' parameter name, fine).

- [ ] **Step 10: sample quiz without entrance, and e2e**

`quiz.yaml`: delete the `entree:` section (the 6 lines under it) but keep its comment block, changed to:

```yaml
# Message d'entrée, lu devant la porte du restaurant. Section facultative, absente ici :
# le soir d'Halloween, le code d'entrée est sur papier. Si on l'ajoute, sa bonne réponse
# fait entrer les enfants dans la salle et démarre les chronos.
#   titre         facultatif, texte non vide (par défaut : « Le message d'entrée »)
#   message       obligatoire, texte non vide ; « | » permet d'écrire sur plusieurs lignes
#   type_reponse  obligatoire : chiffres (pavé numérique) ou mots (clavier de lettres)
#   reponse       obligatoire, ce que les enfants doivent taper (voir les règles plus bas)
# Exemple :
# entree:
#   message: "Qui suis-je ? Je traverse les murs."
#   type_reponse: mots
#   reponse: "Fantôme"
```

`e2e/typing.ts`: delete `enterRestaurant`.

Replace `e2e/game.spec.ts`:

```ts
/** @file Critical path of an evening: a team plays its rotation, gets help on a missed challenge, and opens the padlock. */
import { test, expect, type Page } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

// Sample quiz.yaml, by challenge number: title, what the children type, digit earned.
const CHALLENGES: Record<number, readonly [string, string, number]> = {
  1: ['La crypte', '13', 4], 2: ['Le chaudron', 'CRAPAUD', 7], 3: ['La bibliothèque', '0472', 2],
  4: ['Le cimetière', '1832', 9], 5: ['Le grenier', "TOILE D'ARAIGNEE", 0], 6: ['La porte de la cuisine', 'CITROUILLE', 5],
}
const nextSlot = (page: Page) => page.clock.fastForward('15:00')

test('the Zombies play challenges 2 to 6 then 1, get help on one, and open the padlock', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await expect(page.getByText('Équipe des Zombies')).toBeVisible()
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()

  // Slot 1: challenge 2, after a wrong try.
  await expect(page.getByRole('heading', { name: 'Le chaudron' })).toBeVisible()
  await expect(page.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveText('15:00')
  await expect(page.getByRole('timer', { name: 'Temps total restant' })).toHaveText('90:00')
  await typeAnswer(page, 'CHAT')
  await expect(page.getByRole('alert')).toBeVisible()
  await typeAnswer(page, 'CRAPAUD')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 7')
  await expect(page.getByText(/^Changement de salle dans \d\d:\d\d$/)).toBeVisible()

  // Slot 2: challenge 3 is missed; an animator gives its digit at the start of slot 3.
  await nextSlot(page)
  await expect(page.getByRole('heading', { name: 'La bibliothèque' })).toBeVisible()
  await nextSlot(page)
  await expect(page.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeVisible()
  await typeAnswer(page, '1111')
  await expect(page.getByRole('alert')).toBeVisible()
  await typeAnswer(page, '2710')
  await expect(page.getByRole('status')).toHaveText('Chiffre de l’épreuve : 2')
  await page.getByRole('button', { name: 'Continuer' }).click()

  // Slots 3 to 6: challenges 4, 5, 6, then 1.
  for (const number of [4, 5, 6, 1]) {
    const [title, answer, digit] = CHALLENGES[number]
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await typeAnswer(page, answer)
    await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
    await nextSlot(page)
  }

  // Padlock code of the sample quiz: challenges in order 3, 1, 6, 2, 5, 4.
  const CODE = [2, 4, 5, 7, 0, 9]
  await expect(page.getByRole('heading', { name: 'La porte du restaurant hanté' })).toBeVisible()
  for (const [i, digit] of CODE.entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
    await expect(page.getByLabel(`Chiffre ${i + 1}`, { exact: true })).toHaveText(String(digit))
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('heading', { name: 'La salle du restaurant hanté est ouverte !' })).toBeVisible()
  await expect(page.getByText('Rendez-vous à la porte du restaurant !')).toBeVisible()
})
```

`e2e/save-and-reset.spec.ts`: `@file` « Critical paths around the tablet: resume after a reload, reset, change of team. »; delete the entrance test; replace the first test by:

```ts
test('the game resumes on the same challenge after a reload', async ({ page }) => {
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await typeAnswer(page, '13')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'La crypte' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 4')
  await expect(page.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toBeVisible()
})
```

and in the old « 3-second press » test replace `enterRestaurant(page)` by
`await setUpTablet(page, 'Sorcières')` + the « Commencer » click. Remove the unused imports.

Run: `npm run build && npm run test:e2e` (preview server stopped first) → PASS.

- [ ] **Step 11: commit** `feat: play the team rotation driven by the clock (#19)`.

---

### Task 6: Layout check, browser check and documentation

**Files:**
- Create: `e2e/layout.spec.ts`
- Modify (only if the check fails): `src/styles/screens.css`, `src/styles/controls.css`
- Modify: `CLAUDE.md`, `ETAT.md`

**Interfaces:**
- Consumes: the whole sprint.

- [ ] **Step 1: layout e2e**

`e2e/layout.spec.ts`:

```ts
/** @file The challenge screens fit a 810×1080 tablet without scrolling, with the digits and the letters keyboards. */
import { test, expect } from '@playwright/test'
import { setUpTablet } from './typing.js'

// The Sorcières start on a digits challenge, the Zombies on a letters one.
for (const [team, title] of [['Sorcières', 'La crypte'], ['Zombies', 'Le chaudron']] as const) {
  test(`the « ${title} » screen fits the tablet without scrolling`, async ({ page }) => {
    await page.goto('./')
    await setUpTablet(page, team)
    await page.getByRole('button', { name: 'Commencer', exact: true }).click()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}
```

Run: `npm run test:e2e -- layout` → if it passes, go on. If a screen overflows by N px: lower `.step .cutaway-lock { margin-top }` in `screens.css` (tablet, currently 40px) by N (not below 12px), rebuild, rerun; if still too tall, reduce `.slot-label` to 18px and `.game-header` `min-height` to 64px. Record the chosen values in CLAUDE.md (« Hauteur de l'écran d'étape »).

- [ ] **Step 2: look at it in the browser**

With `npm run build && npm run preview -- --port 4173` and a fresh Playwright context (the service worker may serve an old build), take screenshots at 810×1080 and 390×844 of: setup (code then teams), home, a challenge, the waiting message, « Temps écoulé » (code typed as dots, then the digit), the padlock, the victory. Check: header readable (slot clock amber, total small), nothing hidden under the reset icon, no sideways scroll on the phone. Fix what looks wrong (CSS only), rerun `npm run test:e2e`.

- [ ] **Step 3: documentation**

`CLAUDE.md`:
- « But »: the game is now an escape game for 6 teams in rotation (one tablet per team, 15-min slots, animator code).
- « Structure »: add `rotation`, `phase` to `src/game/`; `useNow` (instead of `useCountdown`), `useTeam` to `src/hooks/`; `savedTeam` to `src/services/`; `Game` (team gate), `TeamGame` (screens), `TeamSetupScreen`, `TimeUpScreen` to `src/components/`.
- « Pièges connus », update or add:
  - **Créneaux**: slot, time up and padlock are derived by `gamePhase` from `startedAt` + `Date.now()` (never an action); the answer action names its challenge, so a tap at the slot change is ignored.
  - **Équipe**: key `quiz-halloween:team` (the name, not the index); a reset keeps it; choosing a team deletes the saved game.
  - **Sauvegarde**: the state is `{ status, digits (per challenge), startedAt, finishedAt, wrongAttempts, wrongSlot }`; `wrongSlot` stops a wrong-try message from following the group into the next slot.
  - **Code animateur**: shown as dots (`secret`), kept as text by `parseQuizYaml` like `reponse`.
  - **Entrée**: still supported but absent from the sample `quiz.yaml`.
  - **e2e**: `page.clock.fastForward('15:00')` moves one slot; `setUpTablet(page, team)` first on every test.
- Remove the obsolete lines (« Compteur » decremented clock wording if any, `Commencer` still valid).

`ETAT.md`: sprint 9 done on the branch, next action = review (`relecteur-code`) then PR `Closes #19`; decisions of this plan (section « Decisions taken while planning ») copied in « Décisions prises ».

- [ ] **Step 4: final verification**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run valider && npm run test:e2e` → all green; paste the summary lines in the PR description.

- [ ] **Step 5: commit** `docs: document the team rotation (#19)` (plus `style: …` for any CSS fix of Steps 1–2, as its own commit).
