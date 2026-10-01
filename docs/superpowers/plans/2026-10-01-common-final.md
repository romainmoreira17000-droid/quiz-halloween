# Épreuve finale commune — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** une étape `finale: true` se joue par toutes les équipes au dernier créneau, après la rotation des autres épreuves ; sa bonne réponse mène au cadenas (après le « Bravo ! ») sans attendre la fin du créneau.

**Architecture:** tout part de `challengeAt` (rotation) et de `gamePhase` (écran dérivé de l'horloge) : le réducteur, l'écran et le tableau à distance suivent sans changement. Seul ajout d'état d'interface : `useFinaleHold` garde l'écran de la finale affiché le temps du « Bravo ! » quand la phase passe au cadenas.

**Tech Stack:** Vite + React 19 + TypeScript, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-01-common-final-design.md`

## Global Constraints
- 200 lignes max par fichier ; en-tête `@file` + JSDoc sur tout export ; commentaires en anglais (le pourquoi) ; textes affichés en français.
- Commits Conventional Commits en anglais avec `(#68)`, sur `feat/common-final`, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Sans `finale`, le comportement est exactement celui d'aujourd'hui (tous les tests existants hors e2e du quiz d'exemple restent verts sans modification).
- Messages du validateur en français, préfixés par l'emplacement (`étape 6 : `), jamais d'arrêt à la première erreur.
- `QuizConfig.finalStep?: number` (index 0-based), absent sans finale.

## Review Focus
- Finale validée par « Valider l'épreuve » (animateur) : même « Bravo ! » puis cadenas → test dans Task 5.
- « Passer à l'épreuve suivante » pendant la finale : cadenas direct, sans « Bravo ! » (pas de faux succès) → test dans Task 5.
- Rechargement de la tablette pendant le « Bravo ! » de la finale : cadenas direct, rien ne rejoue → test dans Task 5.
- Finale ratée à la fin du créneau : « Temps écoulé » puis cadenas, comme une autre épreuve → test dans Task 2.
- Finale placée ailleurs qu'en dernier dans `etapes` : rotation correcte et chiffre au bon index → tests dans Tasks 1 et 2.

---

### Task 1: Rotation avec finale

**Files:**
- Modify: `src/config/types.ts` (QuizConfig)
- Modify: `src/game/rotation.ts`
- Test: `src/game/rotation.test.ts`

**Interfaces:**
- Produces: `QuizConfig.finalStep?: number` ; `challengeAt(teamIndex: number, slot: number, count: number, finalStep?: number): number`.

- [ ] **Step 1: tests rouges** — ajouter à `rotation.test.ts` :

```ts
describe('challengeAt with a final challenge', () => {
  const SLOTS = [0, 1, 2, 3, 4, 5]
  it('rotates the other challenges, then everyone plays the final', () => {
    expect(SLOTS.map((slot) => challengeAt(1, slot, 6, 5) + 1)).toEqual([2, 3, 4, 5, 1, 6])
  })
  it('gives every team each rotating challenge once, then the final', () => {
    for (const team of SLOTS) {
      const order = SLOTS.map((slot) => challengeAt(team, slot, 6, 5))
      expect(new Set(order.slice(0, 5))).toEqual(new Set([0, 1, 2, 3, 4]))
      expect(order[5]).toBe(5)
    }
  })
  it('puts at most two of six teams on a rotating challenge', () => {
    for (const slot of [0, 1, 2, 3, 4]) {
      const counts = SLOTS.map((team) => challengeAt(team, slot, 6, 5))
      for (const c of new Set(counts)) expect(counts.filter((x) => x === c).length).toBeLessThanOrEqual(2)
    }
  })
  it('skips a final placed in the middle of the list', () => {
    expect(SLOTS.map((slot) => challengeAt(0, slot, 6, 2))).toEqual([0, 1, 3, 4, 5, 2])
  })
  it('plays only the final when it is the only challenge', () => {
    expect(challengeAt(3, 0, 1, 0)).toBe(0)
  })
})
```

- [ ] **Step 2:** `npx vitest run src/game/rotation.test.ts` → FAIL (la finale n'est pas sautée).
- [ ] **Step 3: implémentation** :

```ts
/**
 * Challenge a team plays during a slot: each team starts one rotating challenge further than the previous team;
 * once every rotating challenge is played, every team plays the final together.
 * @param teamIndex 0-based team, in quiz.yaml order (more teams than rotating challenges share a post).
 * @param slot 0-based slot.
 * @param count Number of challenges, final included.
 * @param finalStep 0-based final challenge (`finale: true`), played by everyone in the last slot.
 * @returns 0-based challenge.
 * @example challengeAt(1, 4, 6, 5) // 0: the Zombies end the rotation on challenge 1, then play the final
 */
export function challengeAt(teamIndex: number, slot: number, count: number, finalStep?: number): number {
  if (finalStep === undefined) return (teamIndex + slot) % count
  const rotating = count - 1
  if (slot >= rotating) return finalStep
  const position = (teamIndex + slot) % rotating
  // Positions after the final shift by one: the final is not part of the rotation.
  return position < finalStep ? position : position + 1
}
```
Mettre à jour l'en-tête `@file` (« …; the final challenge is played by every team in the last slot »). Dans `types.ts`, ajouter à `QuizConfig` après `steps` :
```ts
  /** `finale: true` on a step: 0-based challenge played by every team together in the last slot; absent without one. */
  finalStep?: number
```
et corriger le commentaire de `teams` : « Team names, in rotation order: team i starts on rotating challenge i + 1. At least one per rotating challenge. »
- [ ] **Step 4:** `npx vitest run src/game/rotation.test.ts` → PASS.
- [ ] **Step 5:** commit `feat: rotate around a common final challenge (#68)`.

### Task 2: Phase — la finale trouvée ouvre le cadenas

**Files:** Modify `src/game/phase.ts` ; Test `src/game/phase.test.ts`

**Interfaces:**
- Consumes: `challengeAt(..., finalStep)`.
- Produces: `gamePhase(state, config: Pick<QuizConfig, 'stepCount' | 'slotMinutes' | 'finalStep'>, teamIndex, now)`.

- [ ] **Step 1: tests rouges** — ajouter :

```ts
describe('gamePhase with a final challenge', () => {
  // 3 challenges, challenge 0 is the final: team 1 plays 2, 1, then the final 0.
  const final = { stepCount: 3, slotMinutes: 15, finalStep: 0 }
  const fin = (digits: (number | null)[], minutes: number) => gamePhase(playing(digits), final, 1, minutes * MIN)
  it('plays the rotation first', () => {
    expect(fin(none, 0)).toEqual({ kind: 'challenge', slot: 0, challenge: 2 })
    expect(fin([null, null, 5], 15)).toEqual({ kind: 'challenge', slot: 1, challenge: 1 })
  })
  it('plays the final in the last slot', () => {
    expect(fin([null, 7, 5], 30)).toEqual({ kind: 'challenge', slot: 2, challenge: 0 })
  })
  it('opens the padlock as soon as the final is found, before the slot ends', () => {
    expect(fin([4, 7, 5], 31)).toEqual({ kind: 'padlock' })
  })
  it('still waits for the next post once a rotating challenge is found', () => {
    expect(fin([null, null, 5], 5)).toEqual({ kind: 'waiting', slot: 0, challenge: 2 })
  })
  it('asks for an animator when the final is missed', () => {
    expect(fin([null, 7, 5], 45)).toEqual({ kind: 'timeUp', challenge: 0 })
  })
  it('asks for an earlier missed challenge before the padlock', () => {
    expect(fin([4, null, 5], 31)).toEqual({ kind: 'timeUp', challenge: 1 })
  })
})
```

- [ ] **Step 2:** `npx vitest run src/game/phase.test.ts` → FAIL.
- [ ] **Step 3:** dans `gamePhase`, `Pick<QuizConfig, 'stepCount' | 'slotMinutes' | 'finalStep'>`, `const { stepCount, finalStep } = config`, passer `finalStep` aux deux appels de `challengeAt`, puis remplacer le dernier `return` par :

```ts
  const challenge = challengeAt(teamIndex, slot, stepCount, finalStep)
  if (state.digits[challenge] === null) return { kind: 'challenge', slot, challenge }
  // No post to move to after the final: earlier slots all have their digit (checked above), so open the padlock.
  return challenge === finalStep ? { kind: 'padlock' } : { kind: 'waiting', slot, challenge }
```
JSDoc de `gamePhase` : ajouter « a found final opens the padlock right away ».
- [ ] **Step 4:** `npx vitest run src/game` → PASS (progress.test inclus, inchangé).
- [ ] **Step 5:** commit `feat: open the padlock once the final is found (#68)`.

### Task 3: Validateur `finale`

**Files:**
- Create: `src/config/validateFinal.ts`, `src/config/validateFinal.test.ts`
- Modify: `src/config/validateStep.ts` (clé `finale` acceptée), `src/config/validateTeamSettings.ts` (+ test), `src/config/validateQuiz.ts` (+ test)

**Interfaces:**
- Produces: `validateFinal(rawSteps: unknown, errors: string[]): number | undefined` ; `validateTeamSettings(raw, rotationCount: number | null, errors)`.

- [ ] **Step 1: tests rouges** — `validateFinal.test.ts` :

```ts
/** @file Tests for the `finale` flag of the steps. */
import { validateFinal } from './validateFinal'

const step = (extra: Record<string, unknown> = {}) => ({ titre: 'T', ...extra })
function run(steps: unknown) {
  const errors: string[] = []
  return { final: validateFinal(steps, errors), errors }
}

describe('validateFinal', () => {
  it('finds no final by default', () => {
    expect(run([step(), step()])).toEqual({ final: undefined, errors: [] })
  })
  it('returns the 0-based final step', () => {
    expect(run([step(), step({ finale: true }), step({ finale: false })])).toEqual({ final: 1, errors: [] })
  })
  it('rejects a non boolean flag', () => {
    expect(run([step({ finale: 'oui' })]).errors).toEqual(['étape 1 : « finale » doit valoir true ou false.'])
  })
  it('rejects several finals', () => {
    expect(run([step({ finale: true }), step(), step({ finale: true }), step({ finale: true })]))
      .toEqual({ final: undefined, errors: ['« finale » : une seule étape peut être la finale (étapes 1, 3 et 4).'] })
  })
  it('rejects hints on the final', () => {
    expect(run([step({ finale: true, indices: ['Regardez'] })]).errors)
      .toEqual(["étape 1 : la finale n'a pas d'indices (les animateurs les donnent)."])
  })
  it('ignores a list that is not a list (reported elsewhere)', () => {
    expect(run('rien')).toEqual({ final: undefined, errors: [] })
  })
})
```
Dans `validateTeamSettings.test.ts`, remplacer le test « needs one team per step » par :
```ts
  it('needs at least one team per rotating challenge', () => {
    expect(run(valid, 3).errors)
      .toEqual(["« equipes » contient 2 équipe(s) alors qu'il y a 3 épreuve(s) en rotation : il faut au moins une équipe par épreuve."])
  })
  it('lets several teams share a post', () => {
    expect(run(valid, 1).errors).toEqual([])
  })
  it('accepts any team count when only the final is left', () => {
    expect(run(valid, 0).errors).toEqual([])
  })
```
Dans `validateQuiz.test.ts`, ajouter :
```ts
  it('maps finale to finalStep and counts teams against the rotation', () => {
    const raw = validRaw()
    ;(raw.etapes as Record<string, unknown>[])[5].finale = true
    raw.equipes = teams(5)
    const result = validateQuiz(raw)
    expect(result.ok && result.config.finalStep).toBe(5)
  })
  it('has no finalStep without a final', () => {
    const result = validateQuiz(validRaw())
    expect(result.ok && 'finalStep' in result.config).toBe(false)
  })
```
- [ ] **Step 2:** `npx vitest run src/config` → FAIL.
- [ ] **Step 3: implémentation** — `validateFinal.ts` :

```ts
/** @file Validates the `finale` flag of the steps: at most one final challenge, played by every team together, without hints. */
import { isObject } from './checks'

/** @returns « 1, 3 et 4 » for [1, 3, 4]. */
function frenchList(numbers: number[]): string {
  return numbers.length < 2 ? numbers.join('') : `${numbers.slice(0, -1).join(', ')} et ${numbers[numbers.length - 1]}`
}

/**
 * Finds the final challenge, pushing French messages into `errors`.
 * @param rawSteps Value of `etapes` (a wrong shape is reported by validateQuiz, not here).
 * @param errors Accumulator shared with the other validators.
 * @returns 0-based final step, or undefined when there is none or the flags are wrong.
 */
export function validateFinal(rawSteps: unknown, errors: string[]): number | undefined {
  if (!Array.isArray(rawSteps)) return undefined
  const finals: number[] = []
  rawSteps.forEach((raw, i) => {
    if (!isObject(raw) || raw.finale === undefined) return
    if (typeof raw.finale !== 'boolean') errors.push(`étape ${i + 1} : « finale » doit valoir true ou false.`)
    if (raw.finale !== true) return
    finals.push(i)
    // Every team plays the final together in one room: animators give the hints aloud.
    if (raw.indices !== undefined) errors.push(`étape ${i + 1} : la finale n'a pas d'indices (les animateurs les donnent).`)
  })
  if (finals.length > 1) {
    errors.push(`« finale » : une seule étape peut être la finale (étapes ${frenchList(finals.map((i) => i + 1))}).`)
    return undefined
  }
  return finals[0]
}
```
`validateStep.ts` : ajouter `'finale'` à `STEP_KEYS` (vérifié par validateFinal ; commentaire). `validateTeamSettings.ts` : paramètre renommé `rotationCount`, condition et message :
```ts
  // Every team is in the same room: several teams may share a post, but a post nobody visits would be wasted.
  if (rotationCount !== null && raw.length < rotationCount) {
    errors.push(`« equipes » contient ${raw.length} équipe(s) alors qu'il y a ${rotationCount} épreuve(s) en rotation : il faut au moins une équipe par épreuve.`)
  }
```
(JSDoc des deux fonctions mise à jour : « Rotating challenges (steps minus the final), or null… »). `validateQuiz.ts` :
```ts
  const finalStep = validateFinal(raw.etapes, errors)
  const rotationCount = countOk ? (raw.nombre_etapes as number) - (finalStep === undefined ? 0 : 1) : null
  const settings = validateTeamSettings(raw, rotationCount, errors)
  …
    ...(finalStep !== undefined && { finalStep }),   // après steps
```
- [ ] **Step 4:** `npx vitest run src/config` → PASS ; `npm run typecheck`.
- [ ] **Step 5:** commit `feat: validate the final challenge flag (#68)`.

### Task 4: Libellé d'attente et fin du « Bravo ! » dans StepScreen

**Files:** Modify `src/game/messages.ts` (+ `messages.test.ts`), `src/hooks/useCelebration.ts`, `src/components/StepScreen.tsx` (+ test)

**Interfaces:**
- Produces: `waitingLabel(slot: number, stepCount: number, finalStep?: number): string` ; `StepScreenProps.nextLabel: string | null` (remplace `isLastSlot`) ; `StepScreenProps.onCelebrationEnd?: () => void` ; `useCelebration(solved, onEnd?)`.

- [ ] **Step 1: tests rouges** — `messages.test.ts` :
```ts
describe('waitingLabel', () => {
  it('announces the next post', () => expect(waitingLabel(0, 6)).toBe('Changement d’épreuve dans'))
  it('announces the padlock after the last slot', () => expect(waitingLabel(5, 6)).toBe('Le cadenas final dans'))
  it('announces the final after the rotation', () => expect(waitingLabel(4, 6, 5)).toBe('L’épreuve finale dans'))
})
```
`StepScreen.test.tsx` : remplacer `isLastSlot: false` par `nextLabel: 'Changement d’épreuve dans'` dans `base`, le test « announces the padlock » par `nextLabel="Le cadenas final dans"`, et ajouter :
```ts
  it('announces the final', () => {
    render(<StepScreen {...base} digits={[4, 7, null, null, null, null]} nextLabel="L’épreuve finale dans" />)
    expect(screen.getByText('L’épreuve finale dans 04:12')).toBeInTheDocument()
  })
  it('shows no countdown without a label', () => {
    render(<StepScreen {...base} digits={[4, 7, null, null, null, null]} nextLabel={null} />)
    expect(screen.queryByText(/dans \d\d:\d\d/)).not.toBeInTheDocument()
  })
  it('tells when the « Bravo ! » is closed by a tap', () => {
    vi.useFakeTimers()
    const onCelebrationEnd = vi.fn()
    const { rerender } = render(<StepScreen {...base} onCelebrationEnd={onCelebrationEnd} />)
    rerender(<StepScreen {...base} digits={[4, 7, null, null, null, null]} onCelebrationEnd={onCelebrationEnd} />)
    act(() => vi.advanceTimersByTime(CELEBRATION_DELAY_MS))
    fireEvent.click(screen.getByRole('dialog', { name: 'Bravo !' }))
    expect(onCelebrationEnd).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
```
(imports `act`, `fireEvent`, `vi`, `CELEBRATION_DELAY_MS` selon ce que le fichier a déjà.)
- [ ] **Step 2:** `npx vitest run src/game/messages.test.ts src/components/StepScreen.test.tsx` → FAIL.
- [ ] **Step 3:** `messages.ts` :
```ts
/**
 * Words before the countdown on a solved challenge.
 * @param slot 0-based slot on screen.
 * @param stepCount Number of challenges (final included).
 * @param finalStep Final challenge, when the quiz has one.
 * @returns French label, followed on screen by the time left.
 */
export function waitingLabel(slot: number, stepCount: number, finalStep?: number): string {
  if (slot === stepCount - 1) return 'Le cadenas final dans'
  if (finalStep !== undefined && slot === stepCount - 2) return 'L’épreuve finale dans'
  return 'Changement d’épreuve dans'
}
```
`useCelebration(solved, onEnd?)` : `dismiss` appelle `setShown(false)` puis `onEnd?.()` (le délai automatique ne l'appelle pas : `useFinaleHold` a son propre délai). `StepScreen` : prop `nextLabel: string | null` (« Words before the countdown once solved; null hides it (the final, before the padlock) ») et `onCelebrationEnd?: () => void` (« Called when the « Bravo ! » is closed by a tap ») ; `{nextLabel && <p className="next-room">{nextLabel} {formatClock(secondsLeft)}</p>}` ; `useCelebration(solved, props.onCelebrationEnd)`. Dans `TeamGame.tsx`, remplacer `isLastSlot={…}` par `nextLabel={waitingLabel(phase.slot, stepCount, config.finalStep)}`.
- [ ] **Step 4:** `npx vitest run` → PASS ; `npm run typecheck`.
- [ ] **Step 5:** commit `feat: announce the final on the waiting screen (#68)`.

### Task 5: Garder l'écran de la finale pendant le « Bravo ! »

**Files:**
- Create: `src/hooks/useFinaleHold.ts`, `src/hooks/useFinaleHold.test.ts`
- Modify: `src/components/TeamGame.tsx` (+ `TeamGame.test.tsx` s'il existe, sinon nouveau test `src/components/TeamGame.final.test.tsx`)

**Interfaces:**
- Consumes: `GamePhase`, `CELEBRATION_DELAY_MS`, `CELEBRATION_MS`, `onCelebrationEnd`.
- Produces: `useFinaleHold(phase: GamePhase, finalStep: number | undefined, inFinalSlot: boolean): { held: boolean; release(): void }`.

Règle : `held` passe à true au rendu où la phase passe de `challenge` sur la finale à `padlock` **pendant le créneau de la finale** (`inFinalSlot`) — bonne réponse ou « Valider l'épreuve ». Un saut (« Passer à l'épreuve suivante ») recule `startedAt` au-delà du dernier créneau, donc `inFinalSlot` est faux : pas de « Bravo ! ». Rechargement : la première phase vue est déjà `padlock`, rien n'est gardé. Le passage est détecté **pendant le rendu** (état du rendu précédent, motif React « storing information from previous renders ») : un `useEffect` laisserait le cadenas s'afficher une image et démonterait `StepScreen`, perdant son « Bravo ! ». `held` retombe après `CELEBRATION_DELAY_MS + CELEBRATION_MS` ou sur `release()`.

- [ ] **Step 1: tests rouges** — `useFinaleHold.test.ts` (renderHook + fake timers) :
```ts
/** @file Tests for keeping the final challenge on screen during its « Bravo ! ». */
import { act, renderHook } from '@testing-library/react'
import type { GamePhase } from '../game/phase'
import { CELEBRATION_DELAY_MS, CELEBRATION_MS } from './useCelebration'
import { useFinaleHold } from './useFinaleHold'

const final: GamePhase = { kind: 'challenge', slot: 5, challenge: 5 }
const padlock: GamePhase = { kind: 'padlock' }
const hook = (phase: GamePhase, inFinalSlot = true, finalStep: number | undefined = 5) =>
  renderHook((p: { phase: GamePhase; inFinalSlot: boolean }) => useFinaleHold(p.phase, finalStep, p.inFinalSlot), { initialProps: { phase, inFinalSlot } })

describe('useFinaleHold', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })
  it('holds the final when it gets solved, then lets the padlock show', () => {
    const { result, rerender } = hook(final)
    rerender({ phase: padlock, inFinalSlot: true })
    expect(result.current.held).toBe(true)
    act(() => vi.advanceTimersByTime(CELEBRATION_DELAY_MS + CELEBRATION_MS))
    expect(result.current.held).toBe(false)
  })
  it('lets go early on release', () => {
    const { result, rerender } = hook(final)
    rerender({ phase: padlock, inFinalSlot: true })
    act(() => result.current.release())
    expect(result.current.held).toBe(false)
  })
  it('does not hold after a skip past the last slot', () => {
    const { result, rerender } = hook(final)
    rerender({ phase: padlock, inFinalSlot: false })
    expect(result.current.held).toBe(false)
  })
  it('does not hold when the padlock is already there on load', () => {
    expect(hook(padlock).result.current.held).toBe(false)
  })
  it('does not hold after a rotating challenge or without a final', () => {
    const rotating: GamePhase = { kind: 'challenge', slot: 4, challenge: 2 }
    const a = hook(rotating)
    a.rerender({ phase: padlock, inFinalSlot: true })
    expect(a.result.current.held).toBe(false)
    const b = hook(final, true, undefined)
    b.rerender({ phase: padlock, inFinalSlot: true })
    expect(b.result.current.held).toBe(false)
  })
})
```
Test de composant (`TeamGame.final.test.tsx`) avec un quiz de 2 étapes dont la 2e est finale (construire la config à la main comme les autres tests de `TeamGame` du dépôt, `api` factice sans réseau), équipe 0, fake timers : « Commencer », taper la réponse de l'étape 1, avancer de 15 min, taper la réponse de la finale → `status` « Chiffre trouvé » encore visible, pas de cadenas ; avancer de `CELEBRATION_DELAY_MS` → dialog « Bravo ! » ; avancer de `CELEBRATION_MS` → titre du cadenas visible. Deuxième test : même parcours mais la finale validée par le menu animateur (`Valider l'épreuve`) → même « Bravo ! ». S'inspirer des tests existants qui pilotent `TeamGame` (chercher `render(<TeamGame` dans `src/components`).
- [ ] **Step 2:** `npx vitest run src/hooks/useFinaleHold.test.ts src/components/TeamGame.final.test.tsx` → FAIL.
- [ ] **Step 3: implémentation** — `useFinaleHold.ts` :
```ts
/** @file Keeps the final challenge on screen during its « Bravo ! », although the clock already says padlock. */
import { useEffect, useState } from 'react'
import type { GamePhase } from '../game/phase'
import { CELEBRATION_DELAY_MS, CELEBRATION_MS } from './useCelebration'

/** @returns A key that changes only when the screen changes (phase objects are new on every render). */
function phaseKey(phase: GamePhase): string {
  return phase.kind === 'challenge' || phase.kind === 'waiting' || phase.kind === 'timeUp' ? `${phase.kind}:${phase.challenge}` : phase.kind
}

/**
 * Holds the final challenge screen while its pin falls and its « Bravo ! » shows.
 * @param phase Phase derived from the clock.
 * @param finalStep Final challenge of the quiz, if any.
 * @param inFinalSlot Whether the clock is still in the final's slot (false after « Passer à l'épreuve suivante »).
 * @returns `held` while the final screen must stay, and `release` to show the padlock early (« Bravo ! » tapped).
 */
export function useFinaleHold(phase: GamePhase, finalStep: number | undefined, inFinalSlot: boolean): { held: boolean; release(): void } {
  const key = phaseKey(phase)
  const [previous, setPrevious] = useState(key)
  const [held, setHeld] = useState(false)
  // Checked during render, not in an effect: one frame of padlock would unmount the step screen and its « Bravo ! ».
  if (key !== previous) {
    setPrevious(key)
    if (finalStep !== undefined && previous === `challenge:${finalStep}` && key === 'padlock' && inFinalSlot) setHeld(true)
  }
  useEffect(() => {
    if (!held) return
    const timer = setTimeout(() => setHeld(false), CELEBRATION_DELAY_MS + CELEBRATION_MS)
    return () => clearTimeout(timer)
  }, [held])
  return { held, release: () => setHeld(false) }
}
```
`TeamGame.tsx` : dans `TeamGame`, calculer `const inFinalSlot = progress.state.startedAt !== null && slotTiming(progress.state.startedAt, now, config.slotMinutes).slot < config.stepCount` et `const hold = useFinaleHold(phase, config.finalStep, inFinalSlot)` ; passer `hold` à `currentScreen` (ajout à `ScreenInput`). Dans `currentScreen`, avant le `switch`, si `hold.held && config.finalStep !== undefined` rendre l'écran d'étape de la finale (même `key={config.finalStep}`, même position dans l'arbre que le cas `challenge`, pour que `StepScreen` et son `useCelebration` restent montés) avec `slot = stepCount - 1`, `nextLabel={null}`, `onCelebrationEnd={hold.release}`. Factoriser le rendu de `StepScreen` dans une fonction `stepScreen(input, challenge, slot, nextLabel, onCelebrationEnd?)` utilisée par les deux cas. Garder `TeamGame.tsx` sous 200 lignes (sinon sortir `currentScreen` dans `src/components/teamScreens.tsx`).
- [ ] **Step 4:** `npx vitest run` → PASS ; `npm run typecheck`.
- [ ] **Step 5:** commit `feat: keep the final on screen during its celebration (#68)`.

### Task 6: `quiz.yaml`, parcours e2e et hors ligne

**Files:** Modify `quiz.yaml`, `e2e/game.spec.ts`, `e2e/test-mode.spec.ts` ; Create `e2e/offline.spec.ts` ; ajuster les autres `e2e/*.spec.ts` qui supposent l'ancienne rotation.

- [ ] **Step 1: `quiz.yaml`** — sur « Invisible mais visible », ajouter `finale: true` (avant `fond`). Docs des clés d'étape, après `indices` :
```yaml
#   finale        facultatif, true sur une seule étape : l'épreuve que toutes les équipes
#                 jouent ensemble au dernier créneau, après la rotation des autres ; pas
#                 d'« indices » (les animateurs les donnent). Sa bonne réponse ouvre le cadenas.
```
Commentaire de `equipes` : « Au moins une équipe par épreuve en rotation (les étapes sauf la finale) : chaque équipe fait toutes les épreuves en commençant par une épreuve différente ; avec plus d'équipes que d'épreuves, certaines partagent un poste (ici Sorcières et Momies). » `npm run valider` → OK.
- [ ] **Step 2: `e2e/game.spec.ts`** — les Zombies jouent 2, 3, 4, 5, 1 puis la finale 6. Titre du test : « the Zombies play challenges 2 to 5 and 1, then the common final, get help on one, and open the padlock ». Remplacer la boucle « Slots 3 to 6 » par :
```ts
  // Slots 3 to 5: challenges 4, 5, then 1; the waiting screen of slot 5 announces the final.
  for (const number of [4, 5, 1]) {
    const [title, answer, digit] = CHALLENGES[number]
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await typeAnswer(page, answer)
    await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
    if (number === 1) await expect(page.getByText(/^L’épreuve finale dans \d\d:\d\d$/)).toBeVisible()
    await nextSlot(page)
  }

  // Slot 6: the common final; once found, the « Bravo ! » then the padlock, without waiting for the slot to end.
  const [title, answer, digit] = CHALLENGES[6]
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByRole('button', { name: /indice/i })).toBeHidden()
  await typeAnswer(page, answer)
  await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
  await page.clock.fastForward('00:02')
  await expect(page.getByRole('dialog', { name: 'Bravo !' })).toContainText(String(digit))
  await page.clock.fastForward('00:03')
```
- [ ] **Step 3: `e2e/test-mode.spec.ts`** — boucle sur `CHALLENGES.slice(1, 5)` avec `skip.click()`, puis la finale sans saut :
```ts
  const [finalTitle, finalAnswer] = CHALLENGES[5]
  await expect(page.getByRole('heading', { name: finalTitle })).toBeVisible()
  await typeAnswer(page, finalAnswer)
  await page.getByRole('dialog', { name: 'Bravo !' }).click()
```
(puis les attentes existantes sur « Chiffres trouvés »). Le test attend le « Bravo ! » réel (≈ 1,5 s, pas de `page.clock` ici).
- [ ] **Step 4: `e2e/offline.spec.ts`** :
```ts
/** @file Weak wifi in the room: once loaded, a whole game (rotation, final, padlock) plays without any network. */
import { test, expect } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

const ROTATION = [['La galerie des portraits', '6'], ["L'addition", '3'], ['Le cimetière', '8'], ['Le jackpot funèbre', '9'], ['Les toilettes scientifiques', "TOILE D'ARAIGNEE"]] as const
const CODE = [8, 6, 0, 3, 9, 4]

test('a whole game plays offline once the app was loaded', async ({ page, context }) => {
  await page.goto('./?test')
  // The service worker must hold the app before the network goes away, as on a tablet opened before the evening.
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await context.setOffline(true)
  await page.reload()

  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  const skip = page.getByRole('button', { name: 'Épreuve suivante' })
  for (const [title, answer] of ROTATION) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await typeAnswer(page, answer)
    await expect(page.getByRole('status')).toHaveText(/^Chiffre trouvé/)
    await skip.click()
  }
  await expect(page.getByRole('heading', { name: 'Invisible mais visible' })).toBeVisible()
  await typeAnswer(page, 'CITROUILLE')
  await page.getByRole('dialog', { name: 'Bravo !' }).click()
  for (const [i, digit] of CODE.entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('heading', { name: 'La porte du restaurant des ombres est ouverte !' })).toBeVisible()
})
```
- [ ] **Step 5:** arrêter tout `vite preview` sur 4173, puis `npm run test:e2e`. Corriger les autres specs qui dépendent de l'ancienne rotation (chercher les `fastForward('15:00')` répétés et les titres attendus aux créneaux 5 et 6, notamment `remote-board.spec.ts`, `animator-menu.spec.ts`, `layout.spec.ts`, `halloween-lock.spec.ts`, `padlock-veil.spec.ts`) en appliquant l'ordre « rotation sur 1–5 puis 6 ». Tout vert.
- [ ] **Step 6:** commit `feat: make invisible mais visible the common final (#68)`.

### Task 7: Documentation et vérification finale

**Files:** `CLAUDE.md`, `README.md`, `ETAT.md`, spec.

- [ ] **Step 1:** `CLAUDE.md` : « But » (5 épreuves en rotation, puis la finale commune au 6e créneau) ; `src/game/` (rotation : finale) ; `src/hooks/` (`useFinaleHold`) ; nouveau piège **Finale** : `finalStep`, `challengeAt` saute la finale, `gamePhase` → padlock dès la finale trouvée, `useFinaleHold` détecte le passage au rendu (pas d'effet), pas d'« Bravo ! » après un saut, ordre e2e des Zombies 2,3,4,5,1,6.
- [ ] **Step 2:** `README.md`, section « Le soir » : ouvrir l'app sur chaque tablette avec le wifi avant la soirée et la laisser ouverte (wifi faible : le jeu marche ensuite sans réseau ; seul le suivi à distance s'arrête) ; caler toutes les tablettes sur la même heure de départ (la finale démarre en même temps partout).
- [ ] **Step 3:** spec : ajouter la section « Écran de la finale pendant le « Bravo ! » » (useFinaleHold).
- [ ] **Step 4:** `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e` : montrer les sorties.
- [ ] **Step 5:** vérif visuelle Playwright (vue tablette 810×1080 et téléphone 390×844) : attente du 5e créneau (« L'épreuve finale dans »), écran de la finale sans bouton d'indice.
- [ ] **Step 6:** `ETAT.md` à jour ; commit `docs: document the common final (#68)`.
