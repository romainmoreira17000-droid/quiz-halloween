# Tableau animateur : détail, solutions et alertes — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sur `?animateur`, montrer les chiffres trouvés dans l'ordre de passage, la solution et les indices lus de l'épreuve en cours, un panneau « Solutions », et faire sonner/vibrer le téléphone quand une équipe a besoin d'un animateur.

**Architecture:** Tout se passe sur le téléphone. `boardCards` (pur) enrichit la vue de chaque carte ; `boardAlerts` (pur) dit quelles alertes sont actives et lesquelles sont nouvelles ; `useBoardAlerts` garde le tableau précédent et le bandeau ; `useWakeLock` garde l'écran allumé ; `notify.ts` fait le son et la vibration. Aucun changement Supabase, tablette ni `QuizConfig` (empreinte inchangée).

**Tech Stack:** React 19 + TypeScript, Vitest + Testing Library, Playwright (faux Supabase par `page.route`), Web Audio, Vibration API, Screen Wake Lock API.

**Spec:** `docs/superpowers/specs/2026-10-02-board-details-alerts-design.md`

## Global Constraints

- 200 lignes max par fichier ; JSDoc `@file` + JSDoc des exports ; commentaires en anglais (le pourquoi) ; textes affichés en français.
- Pas de `any`. Pas d'accès direct à Supabase dans les composants.
- Aucun changement dans `supabase/`, `src/config/`, ni dans l'état envoyé par les tablettes.
- Chiffres : `font-variant-numeric: lining-nums`.
- Animations : rien qui clignote sous `prefers-reduced-motion`.
- Rien ne déborde à 360 px de large.
- Commits Conventional Commits en anglais, `(#84)`, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Seuil « équipe en difficulté » : 3 mauvaises réponses dans le créneau. Tablette muette : `freshness === 'silent'` (> 120 s). Vibration : `[300, 150, 300]`.

## Review Focus

1. **Téléphone qui revient de veille ou perd le réseau** : toutes les tablettes paraissent muettes (le silence se compte depuis la dernière lecture). Attendu : aucune alerte « muette » tant que le tableau lui-même n'est pas à jour (`online` faux si la dernière lecture a échoué ou date de plus de 15 s). Test : Task 2 + Task 6.
2. **Ouverture du tableau en pleine soirée** : une équipe déjà en Temps écoulé ne doit pas sonner, mais sa carte est rouge. Test : Task 2 (`newAlerts(null, …)`) + Task 4.
3. **Alerte qui disparaît d'elle-même** (l'animateur a tapé le code sur la tablette) : elle quitte le bandeau sans « Vu ». Test : Task 4.
4. **Solution qui reste ouverte quand l'équipe change d'épreuve** : elle doit se refermer (un enfant pourrait la voir). Test : Task 5 (`key` sur `CardSolution`).
5. **Navigateur sans Web Audio / vibration / Wake Lock** : jamais d'exception ; « Garde l'écran allumé » affiché. Test : Task 3.

---

### Task 1: Vue de carte enrichie (`boardCards`)

**Files:**
- Modify: `src/game/boardCard.ts`
- Test: `src/game/boardCard.test.ts`

**Interfaces:**
- Produces (dans `boardCard.ts`) :
  ```ts
  export interface TrackBox { title: string; digit: number | null; current: boolean }
  export interface CardSolution { answer: string; digit: number }
  // TeamCardView gagne :
  track: TrackBox[]            // une case par créneau, dans l'ordre de passage de l'équipe
  solution: CardSolution | null // épreuve en cours (challenge) ou ratée (timeUp)
  hintTexts: string[]          // textes des indices disponibles (challenge seulement)
  ```

- [ ] **Step 1: Write the failing tests** — ajouter dans le `describe('boardCards')` de `src/game/boardCard.test.ts` :

```ts
  it('lists the digits in the team play order and frames the challenge in play', () => {
    // Zombies (team 1) start on challenge 2 (Le grenier), then play challenge 1.
    expect(card([entry('Zombies', playing({ digits: [4, null] }))], MIN, 'Zombies').track).toEqual([
      { title: 'Le grenier', digit: null, current: true },
      { title: 'La crypte', digit: 4, current: false },
    ])
  })
  it('gives an unseen team its play order, empty', () => {
    expect(card([], 0, 'Zombies').track).toEqual([
      { title: 'Le grenier', digit: null, current: false },
      { title: 'La crypte', digit: null, current: false },
    ])
  })
  it('gives the solution and the hints seen of the challenge in play', () => {
    expect(card([entry('Sorcières', playing())], 6 * MIN)).toMatchObject({ solution: { answer: '4', digit: 4 }, hintTexts: ['h1'] })
  })
  it('gives the solution of the missed challenge on « time up », none while waiting', () => {
    expect(card([entry('Sorcières', playing())], 16 * MIN)).toMatchObject({ solution: { answer: '4', digit: 4 }, hintTexts: [] })
    expect(card([entry('Sorcières', playing({ digits: [4, null] }))], MIN).solution).toBeNull()
  })
```

- [ ] **Step 2: Run** `npx vitest run src/game/boardCard.test.ts` — Expected: FAIL (`track` undefined).

- [ ] **Step 3: Implement** in `src/game/boardCard.ts` :
  - import `challengeAt` from `./rotation` and `QuizStep` type from `../config/types`.
  - add the two interfaces above (JSDoc each) and the three fields to `TeamCardView` (JSDoc each).
  - helpers :

```ts
/** One box per slot, in the order this team plays the challenges. */
function trackOf(config: QuizConfig, teamIndex: number, digits: readonly (number | null)[], current: number | null): TrackBox[] {
  return Array.from({ length: config.stepCount }, (_, slot) => {
    const challenge = challengeAt(teamIndex, slot, config.stepCount, config.finalStep)
    return { title: config.steps[challenge].title, digit: digits[challenge] ?? null, current: challenge === current }
  })
}

const solutionOf = (step: QuizStep): CardSolution => ({ answer: step.answer.value, digit: step.digit })
```
  - in `boardCards`, the `blank` card gets `track: trackOf(config, teamIndex, [], null), solution: null, hintTexts: []`.
  - in `playingCard`, after `phase` :

```ts
  const current = phase.kind === 'challenge' || phase.kind === 'waiting' || phase.kind === 'timeUp' ? phase.challenge : null
  const base = { found, offsetMinutes, track: trackOf(config, teamIndex, state.digits, current) }
```
  - `timeUp` returns `{ ...base, status: 'timeUp', challengeTitle: ..., solution: solutionOf(config.steps[phase.challenge]) }`.
  - `challenge` : compute `shown = hintsAvailable(...)` once (when `total > 0`), return `solution: solutionOf(step)`, `hintTexts: step.hints?.slice(0, shown) ?? []`, `hints` as before.
  - File stays under 200 lines.

- [ ] **Step 4: Run** `npx vitest run src/game/boardCard.test.ts` — Expected: PASS (old tests too). Then `npm run typecheck` : `TeamCard.test.tsx` fixture will fail typecheck — add `track: [], solution: null, hintTexts: []` to its `view()` defaults for now (Task 5 rewrites it).

- [ ] **Step 5: Commit** — `git add src/game/boardCard.ts src/game/boardCard.test.ts src/components/board/TeamCard.test.tsx` ; `git commit -m "feat: add play order, solution and hint texts to board cards (#84)"`.

---

### Task 2: Alertes pures (`boardAlerts`)

**Files:**
- Create: `src/game/boardAlerts.ts`, `src/game/boardAlerts.test.ts`

**Interfaces:**
- Consumes: `TeamCardView` (Task 1).
- Produces:
  ```ts
  export const ALERT_WRONG_ATTEMPTS = 3
  export const BOARD_FRESH_MS = 15_000
  export type AlertKind = 'timeUp' | 'silent' | 'wrong'
  export interface BoardAlert { key: string; team: string; kind: AlertKind; text: string }
  export function activeAlerts(cards: readonly TeamCardView[], online: boolean): BoardAlert[]
  export function newAlerts(previous: readonly BoardAlert[] | null, current: readonly BoardAlert[]): BoardAlert[]
  ```

- [ ] **Step 1: Write the failing tests** `src/game/boardAlerts.test.ts` :

```ts
/** @file Tests for the alerts of the animator board. */
import { activeAlerts, newAlerts } from './boardAlerts'
import type { TeamCardView } from './boardCard'

const card = (over: Partial<TeamCardView>): TeamCardView => ({
  team: 'Zombies', status: 'challenge', challengeTitle: 'Le cimetière', slotSecondsLeft: 300, found: [], track: [],
  solution: null, hintTexts: [], blockedSeconds: 0, wrongAttempts: 0, hints: null, offsetMinutes: null, finishedAt: null,
  silentSeconds: 3, freshness: 'fresh', ...over,
})

describe('activeAlerts', () => {
  it('raises nothing for a team that plays normally', () => {
    expect(activeAlerts([card({}), card({ status: 'waiting' }), card({ status: 'unseen', freshness: null })], true)).toEqual([])
  })
  it('raises « time up » with the missed challenge', () => {
    expect(activeAlerts([card({ status: 'timeUp' })], true)).toEqual([
      { key: 'Zombies|timeUp|Le cimetière', team: 'Zombies', kind: 'timeUp', text: 'Zombies : Temps écoulé (Le cimetière)' },
    ])
  })
  it('raises a silent tablet, only while the board itself is up to date', () => {
    const silent = card({ freshness: 'silent', silentSeconds: 130 })
    expect(activeAlerts([silent], true)).toEqual([
      { key: 'Zombies|silent|', team: 'Zombies', kind: 'silent', text: 'Zombies : plus de nouvelles depuis 2 min' },
    ])
    expect(activeAlerts([silent], false)).toEqual([])
    expect(activeAlerts([card({ freshness: 'late' })], true)).toEqual([])
  })
  it('raises 3 wrong answers in the slot, not 2', () => {
    expect(activeAlerts([card({ wrongAttempts: 2 })], true)).toEqual([])
    expect(activeAlerts([card({ wrongAttempts: 4 })], true)).toEqual([
      { key: 'Zombies|wrong|Le cimetière', team: 'Zombies', kind: 'wrong', text: 'Zombies : 3 mauvaises réponses (Le cimetière)' },
    ])
  })
})

describe('newAlerts', () => {
  const timeUp = activeAlerts([card({ status: 'timeUp' })], true)
  const wrongHere = activeAlerts([card({ wrongAttempts: 3 })], true)
  const wrongThere = activeAlerts([card({ wrongAttempts: 3, challengeTitle: 'L’addition' })], true)
  it('rings nothing on the first board (what is already going on is not news)', () => {
    expect(newAlerts(null, timeUp)).toEqual([])
  })
  it('rings an alert once', () => {
    expect(newAlerts([], timeUp)).toEqual(timeUp)
    expect(newAlerts(timeUp, timeUp)).toEqual([])
  })
  it('rings again for another challenge, or once an alert was over', () => {
    expect(newAlerts(wrongHere, wrongThere)).toEqual(wrongThere)
    expect(newAlerts([], wrongHere)).toEqual(wrongHere)
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/game/boardAlerts.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement** `src/game/boardAlerts.ts` :

```ts
/** @file Which teams need an animator now, and which of those needs are new since the previous read of the board. */
import type { TeamCardView } from './boardCard'

/** Wrong answers in one slot after which a team probably needs help. */
export const ALERT_WRONG_ATTEMPTS = 3
/** Age of the last good read after which the board itself is stale: every tablet would look silent. */
export const BOARD_FRESH_MS = 15_000

export type AlertKind = 'timeUp' | 'silent' | 'wrong'

/** One need; `key` names it, so the same need rings only once. */
export interface BoardAlert { key: string; team: string; kind: AlertKind; text: string }

/**
 * Needs of every team right now.
 * @param cards Cards of the board (see boardCards).
 * @param online The board read the database lately; otherwise the silences are the phone's, not the tablets'.
 * @returns The alerts, team by team.
 */
export function activeAlerts(cards: readonly TeamCardView[], online: boolean): BoardAlert[] {
  return cards.flatMap((card) => {
    const alerts: BoardAlert[] = []
    const add = (kind: AlertKind, detail: string, text: string) =>
      alerts.push({ key: `${card.team}|${kind}|${detail}`, team: card.team, kind, text: `${card.team} : ${text}` })
    const title = card.challengeTitle ?? ''
    if (card.status === 'timeUp') add('timeUp', title, `Temps écoulé (${title})`)
    if (online && card.freshness === 'silent') add('silent', '', 'plus de nouvelles depuis 2 min')
    // Fixed text: the key stays the same while the count goes up, so the banner line does not change either.
    if (card.status === 'challenge' && card.wrongAttempts >= ALERT_WRONG_ATTEMPTS) {
      add('wrong', title, `${ALERT_WRONG_ATTEMPTS} mauvaises réponses (${title})`)
    }
    return alerts
  })
}

/**
 * Alerts that were not there at the previous read.
 * @param previous Alerts of the previous read, null before the first one (nothing rings on opening the board).
 * @param current Alerts now.
 * @returns The new ones.
 */
export function newAlerts(previous: readonly BoardAlert[] | null, current: readonly BoardAlert[]): BoardAlert[] {
  if (previous === null) return []
  return current.filter((alert) => !previous.some((old) => old.key === alert.key))
}
```

- [ ] **Step 4: Run** `npx vitest run src/game/boardAlerts.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit** — `git add src/game/boardAlerts.ts src/game/boardAlerts.test.ts` ; `git commit -m "feat: detect the board alerts (#84)"`.

---

### Task 3: Son, vibration et écran allumé

**Files:**
- Modify: `src/services/sound.ts`, `src/services/sound.test.ts`
- Create: `src/services/notify.ts`, `src/services/notify.test.ts`, `src/hooks/useWakeLock.ts`, `src/hooks/useWakeLock.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // sound.ts
  export function playAlertSound(createContext?: AudioContextFactory): void
  // notify.ts
  export const ALERT_VIBRATION = [300, 150, 300]
  export function alertAnimator(createContext?: AudioContextFactory): void
  // useWakeLock.ts
  export type WakeLockStatus = 'off' | 'on' | 'unavailable'
  export function useWakeLock(wanted: boolean): WakeLockStatus
  ```

- [ ] **Step 1: Write the failing tests.**
  - `src/services/sound.test.ts` : import `playAlertSound` and add (reuses `fakeContext` of the file) :

```ts
describe('playAlertSound', () => {
  it('does nothing without Web Audio, or when it is blocked', () => {
    expect(() => playAlertSound(() => null)).not.toThrow()
    expect(() => playAlertSound(() => { throw new Error('blocked') })).not.toThrow()
  })
  it('plays two beeps, then releases the audio context', () => {
    const { ctx, close, oscillators } = fakeContext()
    playAlertSound(() => ctx)
    expect(oscillators.filter((o) => o.start.mock.calls.length > 0)).toHaveLength(2)
    oscillators.find((o) => o.onended)?.onended?.()
    expect(close).toHaveBeenCalledOnce()
  })
})
```
  - `src/services/notify.test.ts` :

```ts
/** @file Tests for the alert of the animator: sound and vibration. */
import { ALERT_VIBRATION, alertAnimator } from './notify'

afterEach(() => { Reflect.deleteProperty(navigator, 'vibrate') })

describe('alertAnimator', () => {
  it('vibrates when the phone can', () => {
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    alertAnimator(() => null)
    expect(vibrate).toHaveBeenCalledWith(ALERT_VIBRATION)
  })
  it('never throws without vibration nor sound', () => {
    expect(() => alertAnimator(() => null)).not.toThrow()
    Object.defineProperty(navigator, 'vibrate', { value: () => { throw new Error('no') }, configurable: true })
    expect(() => alertAnimator(() => null)).not.toThrow()
  })
})
```
  - `src/hooks/useWakeLock.test.ts` :

```ts
/** @file Tests for keeping the animator's screen on. */
import { renderHook, waitFor } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

const setWakeLock = (request: () => Promise<unknown>) =>
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
afterEach(() => { Reflect.deleteProperty(navigator, 'wakeLock') })

describe('useWakeLock', () => {
  it('asks nothing until wanted', () => {
    const request = vi.fn(() => Promise.resolve({ release: vi.fn(() => Promise.resolve()) }))
    setWakeLock(request)
    expect(renderHook(() => useWakeLock(false)).result.current).toBe('off')
    expect(request).not.toHaveBeenCalled()
  })
  it('keeps the screen on, and lets it go when unmounted', async () => {
    const release = vi.fn(() => Promise.resolve())
    setWakeLock(vi.fn(() => Promise.resolve({ release })))
    const { result, unmount } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(result.current).toBe('on'))
    unmount()
    expect(release).toHaveBeenCalled()
  })
  it('says « unavailable » without the API or when it is refused', async () => {
    expect(renderHook(() => useWakeLock(true)).result.current).toBe('unavailable')
    setWakeLock(() => Promise.reject(new Error('battery saver')))
    const { result } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(result.current).toBe('unavailable'))
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/services src/hooks/useWakeLock.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement.**
  - `sound.ts` : update `@file` (« … and the animator's alert ») and add :

```ts
/**
 * Plays two short beeps for the animator board. Phones allow it once the page was tapped (« Activer les alertes »).
 * Silent (never throws) when audio is unavailable.
 * @param createContext Audio context factory, replaced in tests.
 */
export function playAlertSound(createContext: AudioContextFactory = browserContext): void {
  const ctx = openContext(createContext)
  if (!ctx) return
  const t = ctx.currentTime
  tone(ctx, 'triangle', t, t + 0.25, 0.35).frequency.setValueAtTime(880, t)
  const second = tone(ctx, 'triangle', t + 0.35, t + 0.6, 0.35)
  second.frequency.setValueAtTime(660, t + 0.35)
  second.onended = () => void ctx.close()
}
```
  - `src/services/notify.ts` :

```ts
/** @file Gets the animator's attention: two beeps and a vibration (Android; iPhones cannot vibrate from a page). */
import { playAlertSound, type AudioContextFactory } from './sound'

/** Two strong buzzes, felt in a pocket. */
export const ALERT_VIBRATION = [300, 150, 300]

/**
 * Rings and vibrates once. Never throws.
 * @param createContext Audio context factory, replaced in tests.
 */
export function alertAnimator(createContext?: AudioContextFactory): void {
  playAlertSound(createContext)
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(ALERT_VIBRATION)
  } catch {
    // Some browsers throw instead of ignoring; the beeps and the banner remain.
  }
}
```
  - `src/hooks/useWakeLock.ts` :

```ts
/** @file Keeps the animator's screen on: a sleeping phone pauses the page, so the board stops reading and ringing. */
import { useEffect, useState } from 'react'

/** off: not asked; on: the screen stays on; unavailable: the animator must keep it on by hand. */
export type WakeLockStatus = 'off' | 'on' | 'unavailable'

/**
 * Asks the phone to keep the screen on while `wanted`, again each time the page comes back (the lock is lost when
 * it is hidden).
 * @param wanted The alerts are on.
 * @returns See WakeLockStatus.
 */
export function useWakeLock(wanted: boolean): WakeLockStatus {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [status, setStatus] = useState<'off' | 'on' | 'refused'>('off')
  useEffect(() => {
    if (!wanted || !supported) return
    let cancelled = false
    let sentinel: WakeLockSentinel | null = null
    const request = () => {
      if (document.hidden) return
      navigator.wakeLock.request('screen').then(
        (lock) => { if (cancelled) void lock.release(); else { sentinel = lock; setStatus('on') } },
        () => { if (!cancelled) setStatus('refused') },
      )
    }
    request()
    const onVisible = () => { if (!document.hidden) request() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVisible); void sentinel?.release() }
  }, [wanted, supported])
  if (!wanted) return 'off'
  return !supported || status === 'refused' ? 'unavailable' : status
}
```
  (In tests the fake lock is cast: `WakeLockSentinel` only needs `release` here.)

- [ ] **Step 4: Run** `npx vitest run src/services src/hooks/useWakeLock.test.ts` and `npm run typecheck` — Expected: PASS.

- [ ] **Step 5: Commit** — `git add src/services src/hooks/useWakeLock.ts src/hooks/useWakeLock.test.ts` ; `git commit -m "feat: add the animator alert sound, vibration and screen wake lock (#84)"`.

---

### Task 4: `useBoardAlerts`

**Files:**
- Create: `src/hooks/useBoardAlerts.ts`, `src/hooks/useBoardAlerts.test.ts`

**Interfaces:**
- Consumes: `activeAlerts`, `newAlerts`, `BoardAlert` (Task 2) ; `TeamCardView` (Task 1).
- Produces:
  ```ts
  export interface BoardAlertsOptions { ready: boolean; online: boolean; onNew(): void }
  export interface BoardAlerts { pending: BoardAlert[]; alertTeams: ReadonlySet<string>; dismiss(key: string): void }
  export function useBoardAlerts(cards: readonly TeamCardView[], options: BoardAlertsOptions): BoardAlerts
  ```

- [ ] **Step 1: Write the failing tests** `src/hooks/useBoardAlerts.test.ts` :

```ts
/** @file Tests for the alert banner of the animator board. */
import { act, renderHook } from '@testing-library/react'
import type { TeamCardView } from '../game/boardCard'
import { useBoardAlerts } from './useBoardAlerts'

const card = (over: Partial<TeamCardView>): TeamCardView => ({
  team: 'Zombies', status: 'challenge', challengeTitle: 'Le cimetière', slotSecondsLeft: 300, found: [], track: [],
  solution: null, hintTexts: [], blockedSeconds: 0, wrongAttempts: 0, hints: null, offsetMinutes: null, finishedAt: null,
  silentSeconds: 3, freshness: 'fresh', ...over,
})
const setup = (first: TeamCardView[], ready = true) => {
  const onNew = vi.fn()
  const hook = renderHook(({ cards, ready }) => useBoardAlerts(cards, { ready, online: true, onNew }), { initialProps: { cards: first, ready } })
  return { ...hook, onNew }
}

describe('useBoardAlerts', () => {
  it('shows what is already wrong on opening in red, without ringing', () => {
    const { result, onNew } = setup([card({ status: 'timeUp' })])
    expect(result.current.pending).toEqual([])
    expect(result.current.alertTeams.has('Zombies')).toBe(true)
    expect(onNew).not.toHaveBeenCalled()
  })
  it('waits for the first read before taking a reference', () => {
    const { result, rerender, onNew } = setup([card({ status: 'unseen', freshness: null })], false)
    rerender({ cards: [card({ status: 'timeUp' })], ready: true })
    expect(result.current.pending).toEqual([])
    expect(onNew).not.toHaveBeenCalled()
  })
  it('rings a new need once and keeps it in the banner until « Vu »', () => {
    const { result, rerender, onNew } = setup([card({})])
    rerender({ cards: [card({ status: 'timeUp' })], ready: true })
    rerender({ cards: [card({ status: 'timeUp', slotSecondsLeft: 200 })], ready: true })
    expect(onNew).toHaveBeenCalledOnce()
    expect(result.current.pending.map((a) => a.text)).toEqual(['Zombies : Temps écoulé (Le cimetière)'])
    act(() => result.current.dismiss(result.current.pending[0].key))
    expect(result.current.pending).toEqual([])
    expect(result.current.alertTeams.has('Zombies')).toBe(true)
  })
  it('drops a need from the banner once it is over', () => {
    const { result, rerender } = setup([card({})])
    rerender({ cards: [card({ status: 'timeUp' })], ready: true })
    rerender({ cards: [card({ status: 'waiting' })], ready: true })
    expect(result.current.pending).toEqual([])
    expect(result.current.alertTeams.size).toBe(0)
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/hooks/useBoardAlerts.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement** `src/hooks/useBoardAlerts.ts` :

```ts
/** @file Alerts of the animator board: a new need rings once and stays in the banner until « Vu » or until it is over. */
import { useEffect, useRef, useState } from 'react'
import { activeAlerts, newAlerts, type BoardAlert } from '../game/boardAlerts'
import type { TeamCardView } from '../game/boardCard'

/** Options of useBoardAlerts. */
export interface BoardAlertsOptions {
  /** The board has read the database at least once (before, every card is blank). */
  ready: boolean
  /** See activeAlerts. */
  online: boolean
  /** Rings and vibrates; called once per read that brings new needs. */
  onNew(): void
}

/** What the board shows of the alerts. */
export interface BoardAlerts {
  /** New needs not marked « Vu », oldest first. */
  pending: BoardAlert[]
  /** Teams with a need right now (red card), seen or not. */
  alertTeams: ReadonlySet<string>
  dismiss(key: string): void
}

/**
 * Follows the needs of the teams from one render to the next.
 * @param cards Cards of the board.
 * @param options See BoardAlertsOptions.
 * @returns See BoardAlerts.
 */
export function useBoardAlerts(cards: readonly TeamCardView[], options: BoardAlertsOptions): BoardAlerts {
  const active = activeAlerts(cards, options.online)
  // The cards are rebuilt every second (clock): only a change of needs is worth an update.
  const signature = active.map((alert) => alert.key).join('\n')
  const previous = useRef<BoardAlert[] | null>(null)
  const latest = useRef({ active, onNew: options.onNew })
  const [pending, setPending] = useState<BoardAlert[]>([])
  useEffect(() => { latest.current = { active, onNew: options.onNew } })
  useEffect(() => {
    if (!options.ready) return
    const now = latest.current.active
    const fresh = newAlerts(previous.current, now)
    previous.current = now
    setPending((list) => [...list.filter((alert) => now.some((still) => still.key === alert.key)), ...fresh])
    if (fresh.length > 0) latest.current.onNew()
  }, [signature, options.ready])
  return {
    pending,
    alertTeams: new Set(active.map((alert) => alert.team)),
    dismiss: (key) => setPending((list) => list.filter((alert) => alert.key !== key)),
  }
}
```
  Note : the first effect (no deps) runs before the second in the same commit, so `latest.current` is up to date.

- [ ] **Step 4: Run** `npx vitest run src/hooks/useBoardAlerts.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit** — `git add src/hooks/useBoardAlerts.ts src/hooks/useBoardAlerts.test.ts` ; `git commit -m "feat: follow the board alerts between reads (#84)"`.

---

### Task 5: Carte d'équipe détaillée

**Files:**
- Create: `src/components/board/plural.ts`, `src/components/board/TeamDigits.tsx`, `src/components/board/CardSolution.tsx`, `src/components/board/CardHints.tsx`
- Modify: `src/components/board/TeamCard.tsx`, `src/components/board/TeamCard.test.tsx`, `src/styles/board.css`

**Interfaces:**
- Consumes: `TrackBox`, `CardSolution` type (renommé à l'import : `type CardSolution as Solution`), `TeamCardView` (Task 1).
- Produces: `TeamCard({ view, alert }: { view: TeamCardView; alert?: boolean })` ; `plural(n, one, many): string`.

- [ ] **Step 1: Write the failing tests** — dans `TeamCard.test.tsx` : remplacer le `view()` par un fixture avec `track` et ajouter des tests :

```ts
import { fireEvent, render, screen } from '@testing-library/react'
// ...
const view = (over: Partial<TeamCardView>): TeamCardView => ({
  team: 'Zombies', status: 'challenge', challengeTitle: 'La crypte', slotSecondsLeft: 252, found: [true, false, false],
  track: [{ title: 'Le grenier', digit: 7, current: false }, { title: 'La crypte', digit: null, current: true }, { title: 'La cave', digit: null, current: false }],
  solution: { answer: 'CHAUVE-SOURIS', digit: 4 }, hintTexts: [],
  blockedSeconds: 0, wrongAttempts: 0, hints: null, offsetMinutes: null, finishedAt: null, silentSeconds: 4, freshness: 'fresh', ...over,
})
```
  Tests ajoutés :

```ts
  it('shows each digit found, in play order, and frames the challenge in play', () => {
    render(<TeamCard view={view({})} />)
    const boxes = screen.getAllByRole('listitem').filter((li) => li.closest('.team-card-digits'))
    expect(boxes.map((li) => li.textContent)).toEqual(['7', '–', '–'])
    expect(boxes[1]).toHaveAttribute('aria-current', 'step')
    expect(boxes[0]).toHaveAccessibleName('Le grenier : 7')
  })
  it('hides the solution until asked', () => {
    render(<TeamCard view={view({})} />)
    expect(screen.queryByText('CHAUVE-SOURIS')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voir la solution' }))
    expect(screen.getByText('CHAUVE-SOURIS')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cacher la solution' }))
    expect(screen.queryByText('CHAUVE-SOURIS')).not.toBeInTheDocument()
  })
  it('hides the solution again when the team moves to another challenge', () => {
    const { rerender } = render(<TeamCard view={view({})} />)
    fireEvent.click(screen.getByRole('button', { name: 'Voir la solution' }))
    rerender(<TeamCard view={view({ challengeTitle: 'La cave', solution: { answer: 'OS', digit: 1 } })} />)
    expect(screen.queryByText('OS')).not.toBeInTheDocument()
  })
  it('lists the hints the team has seen', () => {
    render(<TeamCard view={view({ hints: { shown: 2, total: 3 }, hintTexts: ['Regardez sous la table', 'Comptez les chaises'] })} />)
    fireEvent.click(screen.getByText('Indices vus 2/3'))
    expect(screen.getByText('Comptez les chaises')).toBeVisible()
  })
  it('turns red while the team needs an animator', () => {
    render(<TeamCard view={view({})} alert />)
    expect(screen.getByRole('article', { name: 'Zombies' })).toHaveClass('team-card--alert')
  })
```
  Le test existant `'1 chiffre trouvé sur 3'` reste valable (une case avec chiffre dans `track`).

- [ ] **Step 2: Run** `npx vitest run src/components/board/TeamCard.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Implement.**
  - `plural.ts` :

```ts
/** @file French count with its noun: « 1 chiffre trouvé », « 3 mauvaises réponses ». */

/**
 * @param n Count.
 * @param one Noun for 0 or 1.
 * @param many Noun for 2 and more.
 * @returns e.g. "2 mauvaises réponses".
 */
export const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`
```
  - `TeamDigits.tsx` :

```tsx
/** @file Digits of one team, one box per challenge in the order the team plays them; the one in play is framed. */
import type { TrackBox } from '../../game/boardCard'
import { plural } from './plural'

/**
 * @param props.track See TeamCardView.track.
 * @returns The list of boxes, named after the count of digits found.
 */
export function TeamDigits({ track }: { track: readonly TrackBox[] }) {
  const found = track.filter((box) => box.digit !== null).length
  return (
    <ol className="team-card-digits" aria-label={`${plural(found, 'chiffre trouvé', 'chiffres trouvés')} sur ${track.length}`}>
      {track.map((box, i) => (
        <li key={i} className={box.digit !== null ? 'found' : undefined} aria-current={box.current ? 'step' : undefined}
          aria-label={`${box.title} : ${box.digit ?? 'pas encore'}`}>
          {box.digit ?? '–'}
        </li>
      ))}
    </ol>
  )
}
```
  - `CardSolution.tsx` :

```tsx
/** @file Solution of the challenge in play, hidden by default: a child may be looking at the animator's phone. */
import { useState } from 'react'
import type { CardSolution as Solution } from '../../game/boardCard'

/**
 * Mount it with `key` = challenge title, so it closes again when the team moves on.
 * @param props.solution Answer and digit of the challenge.
 * @returns A button, and the solution once asked.
 */
export function CardSolution({ solution }: { solution: Solution }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card-solution">
      <button type="button" className="ghost-button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Cacher la solution' : 'Voir la solution'}
      </button>
      {open && <p>Réponse : <b>{solution.answer}</b> · Chiffre : <b>{solution.digit}</b></p>}
    </div>
  )
}
```
  - `CardHints.tsx` :

```tsx
/** @file Hints a team has already read, folded under their count. */

/**
 * @param props.shown Hints available to the team.
 * @param props.total Hints of the challenge.
 * @param props.texts The `shown` first hints.
 * @returns The count, unfolding into the texts.
 */
export function CardHints({ shown, total, texts }: { shown: number; total: number; texts: readonly string[] }) {
  const label = `Indices vus ${shown}/${total}`
  if (texts.length === 0) return <p className="card-hints">{label}</p>
  return (
    <details className="card-hints">
      <summary>{label}</summary>
      <ol>{texts.map((text, i) => <li key={i}>{text}</li>)}</ol>
    </details>
  )
}
```
  - `TeamCard.tsx` : signature `TeamCard({ view, alert = false }: { view: TeamCardView; alert?: boolean })` (JSDoc `@param props.alert` : « The team needs an animator: red card. ») ; importer `plural` depuis `./plural` (supprimer la copie locale) ; retirer la ligne `Indices vus` de `alerts` ; ajouter `team-card--alert` à la classe quand `alert` ; remplacer le `<ol>` des ronds par `<TeamDigits track={view.track} />` ; après lui :

```tsx
      {view.hints && <CardHints shown={view.hints.shown} total={view.hints.total} texts={view.hintTexts} />}
      {view.solution && <CardSolution key={view.challengeTitle ?? ''} solution={view.solution} />}
```
  - `board.css` — remplacer les règles `.team-card-digits li` / `li.found` et ajouter :

```css
.team-card-digits li {
  display: grid; place-items: center; width: 36px; height: 40px; border: 2px solid var(--bronze); border-radius: 8px;
  font: 700 22px var(--text-font); font-variant-numeric: lining-nums; opacity: .7;
}
.team-card-digits li.found { background: var(--amber); color: var(--soot); opacity: 1; }
.team-card-digits li[aria-current] { outline: 3px solid var(--wax); outline-offset: 2px; opacity: 1; }
.card-hints { margin: 0; font-size: 18px; }
.card-hints summary { cursor: pointer; color: #ffb199; }
.card-hints ol { margin: 6px 0 0; padding-left: 22px; }
.card-solution { display: grid; gap: 6px; justify-items: start; }
.card-solution p { margin: 0; font-size: 20px; overflow-wrap: anywhere; }
.card-solution b { color: var(--amber); font-variant-numeric: lining-nums; }
.board .card-solution .ghost-button { min-height: 48px; font-size: 20px; }
.team-card--alert { border-color: #d64533; animation: card-alert 1s ease-in-out infinite alternate; }
@keyframes card-alert { to { box-shadow: 0 0 0 4px #d64533, 0 0 18px #d64533; } }
@media (prefers-reduced-motion: reduce) { .team-card--alert { animation: none; box-shadow: 0 0 0 4px #d64533; } }
```

- [ ] **Step 4: Run** `npx vitest run src/components/board` and `npm run typecheck` — Expected: PASS.

- [ ] **Step 5: Commit** — `git add src/components/board src/styles/board.css` ; `git commit -m "feat: show digits, solution and hints seen on board cards (#84)"`.

---

### Task 6: Panneau Solutions, bandeau, activation et assemblage

**Files:**
- Create: `src/components/board/SolutionsPanel.tsx`, `src/components/board/SolutionsPanel.test.tsx`, `src/components/board/AlertBanner.tsx`, `src/components/board/AlertToggle.tsx`, `src/components/board/AlertControls.test.tsx`
- Modify: `src/components/board/BoardView.tsx`, `src/styles/board.css`

**Interfaces:**
- Consumes: `useBoardAlerts` (Task 4), `useWakeLock`, `WakeLockStatus`, `alertAnimator` (Task 3), `BOARD_FRESH_MS`, `BoardAlert` (Task 2), `TeamCard` (Task 5), `padlockCode` (`src/game/padlock.ts`).
- Produces: `SolutionsPanel({ config })`, `AlertBanner({ alerts, onSeen })`, `AlertToggle({ enabled, wakeLock, onEnable })`.

- [ ] **Step 1: Write the failing tests.**
  - `SolutionsPanel.test.tsx` :

```tsx
/** @file Tests for the solutions panel of the animator board. */
import { fireEvent, render, screen } from '@testing-library/react'
import type { QuizConfig } from '../../config/types'
import { SolutionsPanel } from './SolutionsPanel'

const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières'], slotMinutes: 15, hintTimes: [5], blockSeconds: 0, animatorCode: '1717', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'letters', value: 'Os' }, digit: 4, hints: ['Sous la dalle'] },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '07' }, digit: 0 },
  ],
  finalStep: 1, padlock: { order: [2, 1] },
}

describe('SolutionsPanel', () => {
  it('is folded, then lists every challenge, the padlock code and the animator code', () => {
    render(<SolutionsPanel config={config} />)
    expect(screen.getByText('Sous la dalle')).not.toBeVisible()
    fireEvent.click(screen.getByText('Solutions (à ne pas montrer aux enfants)'))
    expect(screen.getByText('Sous la dalle')).toBeVisible()
    expect(screen.getByText('Le grenier (finale)')).toBeInTheDocument()
    expect(screen.getByText('07')).toBeInTheDocument()
    expect(screen.getByText('0 4')).toBeInTheDocument()
    expect(screen.getByText('1717')).toBeInTheDocument()
  })
})
```
  - `AlertControls.test.tsx` :

```tsx
/** @file Tests for the alert banner and the « Activer les alertes » button. */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { AlertBanner } from './AlertBanner'
import { AlertToggle } from './AlertToggle'

describe('AlertBanner', () => {
  it('shows nothing without alerts', () => {
    render(<AlertBanner alerts={[]} onSeen={vi.fn()} />)
    expect(screen.queryByRole('list', { name: 'Alertes' })).not.toBeInTheDocument()
  })
  it('lists each alert with its « Vu »', () => {
    const onSeen = vi.fn()
    const alert = { key: 'Zombies|timeUp|Le cimetière', team: 'Zombies', kind: 'timeUp' as const, text: 'Zombies : Temps écoulé (Le cimetière)' }
    render(<AlertBanner alerts={[alert]} onSeen={onSeen} />)
    const list = screen.getByRole('list', { name: 'Alertes' })
    expect(list).toHaveTextContent('Zombies : Temps écoulé (Le cimetière)')
    fireEvent.click(within(list).getByRole('button', { name: 'Vu' }))
    expect(onSeen).toHaveBeenCalledWith(alert.key)
  })
})

describe('AlertToggle', () => {
  it('offers to turn the alerts on', () => {
    const onEnable = vi.fn()
    render(<AlertToggle enabled={false} wakeLock="off" onEnable={onEnable} />)
    fireEvent.click(screen.getByRole('button', { name: 'Activer les alertes' }))
    expect(onEnable).toHaveBeenCalledOnce()
  })
  it('says they are on, and asks to keep the screen on when the phone cannot', () => {
    const { rerender } = render(<AlertToggle enabled wakeLock="on" onEnable={vi.fn()} />)
    expect(screen.getByText('Alertes activées')).toBeInTheDocument()
    rerender(<AlertToggle enabled wakeLock="unavailable" onEnable={vi.fn()} />)
    expect(screen.getByText('Alertes activées · Garde l’écran allumé')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/components/board` — Expected: FAIL (modules missing).

- [ ] **Step 3: Implement.**
  - `SolutionsPanel.tsx` :

```tsx
/** @file Every solution of the evening, folded at the bottom of the board (children may look at the phone). */
import type { QuizConfig } from '../../config/types'
import { padlockCode } from '../../game/padlock'

/**
 * @param props.config Validated quiz.
 * @returns A folded panel: each challenge (answer, digit, hints), the padlock code, the animator code.
 */
export function SolutionsPanel({ config }: { config: QuizConfig }) {
  return (
    <details className="board-solutions">
      <summary>Solutions (à ne pas montrer aux enfants)</summary>
      <ol>
        {config.steps.map((step, i) => (
          <li key={i}>
            <h3>{step.title}{i === config.finalStep ? ' (finale)' : ''}</h3>
            <p>Réponse : <b>{step.answer.value}</b> · Chiffre : <b>{step.digit}</b></p>
            {step.hints && <ol className="board-solutions-hints">{step.hints.map((hint, j) => <li key={j}>{hint}</li>)}</ol>}
          </li>
        ))}
      </ol>
      <p>Code du cadenas : <b>{padlockCode(config.steps, config.padlock.order).join(' ')}</b></p>
      <p>Code animateur : <b>{config.animatorCode}</b></p>
    </details>
  )
}
```
  - `AlertBanner.tsx` :

```tsx
/** @file New needs of the teams, at the top of the board, each until the animator taps « Vu ». */
import type { BoardAlert } from '../../game/boardAlerts'

/**
 * @param props.alerts Pending alerts (see useBoardAlerts).
 * @param props.onSeen Called with the key of the alert marked « Vu ».
 * @returns The list, or nothing without alerts.
 */
export function AlertBanner({ alerts, onSeen }: { alerts: readonly BoardAlert[]; onSeen(key: string): void }) {
  if (alerts.length === 0) return null
  // aria-live rather than role="alert": the board already has an alert for a failed « Nouvelle soirée ».
  return (
    <ul className="board-alerts" aria-label="Alertes" aria-live="assertive">
      {alerts.map((alert) => (
        <li key={alert.key}>
          <span>{alert.text}</span>
          <button type="button" className="ghost-button" onClick={() => onSeen(alert.key)}>Vu</button>
        </li>
      ))}
    </ul>
  )
}
```
  - `AlertToggle.tsx` :

```tsx
/** @file « Activer les alertes »: phones only allow sound after a tap, and the same tap keeps the screen on. */
import type { WakeLockStatus } from '../../hooks/useWakeLock'

/**
 * @param props.enabled The alerts are on.
 * @param props.wakeLock See useWakeLock.
 * @param props.onEnable Turns them on; called inside the tap (sound allowed).
 * @returns The button, or the state of the alerts.
 */
export function AlertToggle({ enabled, wakeLock, onEnable }: { enabled: boolean; wakeLock: WakeLockStatus; onEnable(): void }) {
  if (!enabled) return <button type="button" className="seal-button board-alert-toggle" onClick={onEnable}>Activer les alertes</button>
  return <p className="board-alert-state">Alertes activées{wakeLock === 'unavailable' ? ' · Garde l’écran allumé' : ''}</p>
}
```
  - `BoardView.tsx` : imports `useBoardAlerts`, `useWakeLock`, `alertAnimator`, `BOARD_FRESH_MS`, `AlertBanner`, `AlertToggle`, `SolutionsPanel`. Dans le corps, après `cards` :

```tsx
  const [alertsOn, setAlertsOn] = useState(false)
  const wakeLock = useWakeLock(alertsOn)
  // A stale board makes every tablet look silent: no « silent » alert until it reads again.
  const online = feed.last === 'ok' && feed.okAt !== null && now - feed.okAt <= BOARD_FRESH_MS
  const alerts = useBoardAlerts(cards, { ready: feed.snapshot !== null, online, onNew: alertsOn ? alertAnimator : () => {} })
  // The test beep, inside the tap, both unlocks the sound and lets the animator check the volume.
  const enableAlerts = () => { setAlertsOn(true); alertAnimator() }
```
  Rendu : après `<BoardHeader … />` : `<AlertToggle enabled={alertsOn} wakeLock={wakeLock} onEnable={enableAlerts} />` et `<AlertBanner alerts={alerts.pending} onSeen={alerts.dismiss} />` ; les cartes : `<TeamCard key={view.team} view={view} alert={alerts.alertTeams.has(view.team)} />` ; après `.board-cards` : `<SolutionsPanel config={config} />`. `alertAnimator()` sans argument (pas de son en jsdom). Mettre à jour le `@file` (« … alerts and solutions »). Rester sous 200 lignes.
  - `board.css` :

```css
.board-alert-toggle { justify-self: center; }
.board-alert-state { margin: 0; font-size: 18px; text-align: center; color: var(--amber); }
.board-alerts {
  position: sticky; top: 0; z-index: 2; display: grid; gap: 8px; margin: 0; padding: 10px; list-style: none;
  border-radius: 16px; background: #5b130c; box-shadow: 0 4px 16px rgb(0 0 0 / .6);
}
.board-alerts li { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 20px; overflow-wrap: anywhere; }
.board .board-alerts .ghost-button { min-height: 48px; font-size: 20px; flex: none; }
.board-solutions { padding: 12px 16px; border: 2px solid var(--bronze); border-radius: 16px; background: rgb(26 18 12 / .92); text-align: left; }
.board-solutions summary { font-size: 22px; font-weight: 700; cursor: pointer; }
.board-solutions > ol { padding-left: 22px; }
.board-solutions h3 { margin: 12px 0 4px; font-size: 20px; }
.board-solutions p { margin: 4px 0; font-size: 19px; overflow-wrap: anywhere; }
.board-solutions b { color: var(--amber); font-variant-numeric: lining-nums; }
.board-solutions-hints { margin: 4px 0; padding-left: 22px; font-size: 17px; }
```

- [ ] **Step 4: Run** `npm run test:run` and `npm run typecheck` and `npm run lint` — Expected: all PASS (`BoardScreen.test.tsx` included, unchanged).

- [ ] **Step 5: Commit** — `git add src/components/board src/styles/board.css` ; `git commit -m "feat: add solutions panel and alert banner to the board (#84)"`.

---

### Task 7: Parcours e2e, vérification visuelle et docs

**Files:**
- Modify: `e2e/remote-board.spec.ts`, `CLAUDE.md`, `README.md`, `ETAT.md`

- [ ] **Step 1: Write the e2e test** — ajouter dans `e2e/remote-board.spec.ts` :

```ts
test('the board rings when a team runs out of time, and shows the solutions', async ({ page, context }) => {
  const pushes: Push[] = []
  await setUpWithCode(page, 'Sorcières', pushes)
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect.poll(() => pushes.at(-1)?.p_state.status).toBe('playing')
  const last = pushes.at(-1)!
  const board = await context.newPage()
  await board.setViewportSize({ width: 360, height: 780 })
  // First read: the team plays; every later read: the tablet started 16 min ago without the digit → « Temps écoulé ».
  let reads = 0
  await board.route(`${RPC}read_board`, (route) => {
    if (route.request().method() === 'POST') reads += 1
    const startedAt = reads > 1 ? Date.now() - 16 * 60_000 : Date.now() - 60_000
    return reply(route, 200, {
      server_now: Date.now(), teams: [{ team: 'Sorcières', fingerprint: last.p_fingerprint, state: { ...last.p_state, startedAt }, updated_at: Date.now() }],
    })
  })
  await board.goto('./?animateur')
  await board.getByRole('button', { name: 'Activer les alertes' }).click()
  await expect(board.getByText(/Alertes activées/)).toBeVisible()
  const banner = board.getByRole('list', { name: 'Alertes' })
  await expect(banner).toContainText('Sorcières : Temps écoulé (La galerie des portraits)', { timeout: 15_000 })
  await expect(board.getByRole('article', { name: 'Sorcières' })).toHaveClass(/team-card--alert/)
  await banner.getByRole('button', { name: 'Vu' }).click()
  await expect(banner).toBeHidden()
  await board.getByText('Solutions (à ne pas montrer aux enfants)').click()
  await expect(board.getByText('8 6 9 3 9 4')).toBeVisible()
  const overflow = await board.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
```

- [ ] **Step 2: Run** — arrêter tout `vite preview` sur 4173, puis `npm run test:e2e -- remote-board` — Expected: PASS (les 4 tests).

- [ ] **Step 3: Vérification visuelle** (Playwright MCP, 360×780 puis 810×1080) : build + `npx vite preview`, ouvrir `./?animateur` avec un faux `read_board` (comme le test) ; capture : cartes (cases de chiffres, « Voir la solution » ouvert), bandeau, panneau Solutions ouvert. Rien ne déborde ; chiffres lisibles. Repartir d'un contexte neuf (service worker).

- [ ] **Step 4: Docs.**
  - `CLAUDE.md` : dans la structure, `src/game/` + `boardAlerts` (alertes du tableau), `src/hooks/` + `useBoardAlerts`, `useWakeLock`, `src/services/` + `notify` ; `src/components/board/` + `TeamDigits, CardSolution, CardHints, SolutionsPanel, AlertBanner, AlertToggle`. Dans « Suivi à distance », ajouter : « Sprint A (#84) : cartes avec chiffres dans l'ordre de passage, solution masquée, indices lus ; panneau Solutions ; alertes (Temps écoulé, tablette muette, 3 mauvaises réponses) qui sonnent une fois (`newAlerts` compare les clés) et jamais au premier tableau ; pas d'alerte « muette » si le tableau n'a pas lu depuis 15 s (`BOARD_FRESH_MS`). Son + vibration seulement après « Activer les alertes » (geste) ; Wake Lock redemandé au retour sur la page. »
  - `README.md`, section « Le soir » : « Sur le téléphone de l'animateur, taper **Activer les alertes** (un bip de test sonne), garder le tableau au premier plan et le téléphone branché si possible : écran éteint = plus d'alertes. »
  - `ETAT.md` : sprint en cours #84, étapes faites, prochaine action, décisions (seuil 3, rien au premier tableau, pas d'alerte muette si tableau périmé) ; corriger « Environnement » (Supabase pour le suivi à distance, variables `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`).

- [ ] **Step 5: Commit** — `git add e2e/remote-board.spec.ts CLAUDE.md README.md ETAT.md` ; `git commit -m "test: cover board alerts end to end; docs (#84)"`.
