# Tableau de bord animateur à distance — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un écran `?animateur` qui montre en direct, depuis un téléphone, où en est chaque équipe ; les tablettes y envoient leur état via Supabase, sans jamais dépendre du réseau pour jouer.

**Architecture:** Chaque tablette reste maître de sa partie (localStorage) et envoie une copie de son `GameState` à une fonction Supabase protégée par un code de soirée. L'écran animateur relit toutes les 5 s et recalcule chaque carte avec les mêmes fonctions pures que la tablette (`gamePhase`, `hintsAvailable`, `slotTiming`). Tout accès réseau passe par `src/services/board.ts`, qui ne lève jamais.

**Tech Stack:** Vite 8, React 19, TypeScript, `@supabase/supabase-js` 2.117, Supabase (Postgres, pgcrypto), Vitest 5 + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-remote-board-design.md`

## Global Constraints

- Branche `feat/remote-board`, issue #65 ; commits Conventional Commits en anglais terminés par `(#65)` et la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Jamais de commit sur `main`.
- 200 lignes maximum par fichier ; en-tête `@file` et JSDoc sur tout export ; commentaires en anglais qui disent le *pourquoi* ; pas de `any`.
- Textes affichés en français, avec l'apostrophe typographique `’` comme dans le reste de l'app (« Code de soirée », « Nouvelle soirée », « Suivi à distance »).
- Les composants n'accèdent jamais à Supabase ni au localStorage directement : `src/services/` seulement.
- Seule la clé `anon` dans le front ; code de soirée jamais dans le dépôt ; RLS activée sur toutes les tables, sans policy.
- Aucune erreur réseau ne doit changer le déroulé du jeu sur la tablette ni y afficher quoi que ce soit aux enfants.
- La forme de `QuizConfig` ne change pas (empreinte inchangée : les parties en cours survivent au déploiement).
- Seuils : envoi toutes les **30 s** (`HEARTBEAT_MS`), relecture toutes les **5 s** (`POLL_MS`), orange au-delà de **60 s** sans nouvelles, rouge au-delà de **120 s**, décalage signalé au-delà de **1 min**, **12** équipes au plus, nom d'équipe **1 à 40** caractères, état **2 Ko** au plus, code de soirée **8 caractères** au moins, pause de **0,5 s** sur un mauvais code.
- Tests lancés avec `npm run test:run` (unitaires) et `npm run test:e2e` (arrêter tout `vite preview` sur le port 4173 avant).

## Review Focus

- **Envois qui se croisent** : un envoi lent qui répond après un plus récent ne doit jamais écraser l'état récent sur le serveur → envois un par un, le dernier état gagne (test dans la tâche 6).
- **Tablette remise à zéro** : elle envoie un état `home`, que `restoreGameState` refuse → la carte doit dire « Pas commencé », pas « Version différente » (test dans la tâche 3).
- **Code tapé avec des espaces** sur le clavier de la tablette ou du téléphone → espaces autour ignorés, code vide = pas de suivi (test dans la tâche 4).
- **Onglet caché puis rouvert** sur le téléphone : relecture immédiate au retour, pas 5 s d'écran figé (test dans la tâche 8).
- **Téléphone étroit (360 px)** : le tableau ne défile jamais en largeur (test e2e dans la tâche 10).

---

### Task 1: Lecture de la réponse de `read_board`

**Files:**
- Create: `src/game/boardSnapshot.ts`
- Test: `src/game/boardSnapshot.test.ts`

**Interfaces:**
- Produces: `BoardEntry { team: string; fingerprint: string; state: unknown; updatedAt: number }`, `BoardSnapshot { serverNow: number; receivedAt: number; teams: BoardEntry[] }`, `parseBoard(data: unknown, receivedAt: number): BoardSnapshot | null`.

- [ ] **Step 1: Write the failing test**

```ts
/** @file Tests for reading the answer of read_board. */
import { parseBoard } from './boardSnapshot'

describe('parseBoard', () => {
  it('reads the server time and the teams', () => {
    const data = { server_now: 5000, teams: [{ team: 'Zombies', fingerprint: 'abcd1234', state: { status: 'home' }, updated_at: 4000 }] }
    expect(parseBoard(data, 9000)).toEqual({
      serverNow: 5000, receivedAt: 9000,
      teams: [{ team: 'Zombies', fingerprint: 'abcd1234', state: { status: 'home' }, updatedAt: 4000 }],
    })
  })
  it('skips a malformed row but keeps the others', () => {
    const data = { server_now: 5000, teams: [null, { team: 3 }, { team: 'Momies', fingerprint: 'x', state: null, updated_at: 1 }] }
    expect(parseBoard(data, 0)?.teams.map((t) => t.team)).toEqual(['Momies'])
  })
  it('refuses an answer without server time or team list', () => {
    expect(parseBoard(null, 0)).toBeNull()
    expect(parseBoard({ teams: [] }, 0)).toBeNull()
    expect(parseBoard({ server_now: 1, teams: 'no' }, 0)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/boardSnapshot.test.ts`
Expected: FAIL (cannot find module `./boardSnapshot`)

- [ ] **Step 3: Write minimal implementation**

```ts
/** @file What the animator board reads from the database, checked field by field: the rows come from the network. */

/** One tablet's last news, as stored by push_team_state. */
export interface BoardEntry {
  team: string
  fingerprint: string
  /** Game state as sent by the tablet, unchecked here (see boardCard). */
  state: unknown
  /** Server time of the last news, in ms. */
  updatedAt: number
}

/** Answer of read_board, stamped with the phone's time when it arrived. */
export interface BoardSnapshot {
  /** Server time when it answered, in ms. */
  serverNow: number
  /** Phone time when the answer arrived, in ms: the silence of a tablet keeps counting between two reads. */
  receivedAt: number
  teams: BoardEntry[]
}

const isTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/**
 * Checks the answer of read_board.
 * @param data JSON returned by the function (anything).
 * @param receivedAt Phone time of the answer, in ms.
 * @returns The snapshot (malformed rows left out), or null when the answer itself is unusable.
 */
export function parseBoard(data: unknown, receivedAt: number): BoardSnapshot | null {
  if (typeof data !== 'object' || data === null) return null
  const { server_now: serverNow, teams } = data as Record<string, unknown>
  if (!isTime(serverNow) || !Array.isArray(teams)) return null
  const entries = teams.flatMap((row: unknown): BoardEntry[] => {
    if (typeof row !== 'object' || row === null) return []
    const { team, fingerprint, state, updated_at: updatedAt } = row as Record<string, unknown>
    return typeof team === 'string' && typeof fingerprint === 'string' && isTime(updatedAt)
      ? [{ team, fingerprint, state, updatedAt }] : []
  })
  return { serverNow, receivedAt, teams: entries }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/boardSnapshot.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/boardSnapshot.ts src/game/boardSnapshot.test.ts
git commit -m "feat: parse the remote board snapshot (#65)"
```

---

### Task 2: Horloge commune du tableau

**Files:**
- Create: `src/game/boardClock.ts`
- Test: `src/game/boardClock.test.ts`

**Interfaces:**
- Consumes: `timeOfDay(ms): string` (`src/game/startTime.ts`), `slotTiming(startedAt, now, slotMinutes): { slot; secondsLeft }` (`src/game/time.ts`).
- Produces: `OFFSET_TOLERANCE_MS = 60_000`, `referenceStart(starts: readonly number[]): number | null`, `startOffsetMinutes(start: number, reference: number): number | null`, `BoardClock { start: string; elapsedSeconds: number; slot: number | null; secondsLeft: number | null }`, `boardClock(start: number, now: number, config: Pick<QuizConfig, 'stepCount' | 'slotMinutes'>): BoardClock`.

- [ ] **Step 1: Write the failing test**

```ts
/** @file Tests for the shared clock of the animator board. */
import { boardClock, referenceStart, startOffsetMinutes } from './boardClock'
import { timeOfDay } from './startTime'

const config = { stepCount: 6, slotMinutes: 15 }

describe('referenceStart', () => {
  it('takes the start most tablets agree on (lower median)', () => {
    expect(referenceStart([3000, 1000, 1000])).toBe(1000)
    expect(referenceStart([1000, 5000])).toBe(1000)
  })
  it('has none without a game in progress', () => {
    expect(referenceStart([])).toBeNull()
  })
})

describe('startOffsetMinutes', () => {
  it('ignores a gap of one minute or less', () => {
    expect(startOffsetMinutes(60_000, 0)).toBeNull()
    expect(startOffsetMinutes(-60_000, 0)).toBeNull()
  })
  it('gives the signed gap in whole minutes beyond that', () => {
    expect(startOffsetMinutes(3 * 60_000 + 10_000, 0)).toBe(3)
    expect(startOffsetMinutes(-2 * 60_000 - 5_000, 0)).toBe(-2)
  })
})

describe('boardClock', () => {
  it('tells the start, the elapsed time and where the rotation stands', () => {
    const start = new Date(2026, 9, 31, 19, 2).getTime()
    expect(boardClock(start, start + 16 * 60_000, config)).toEqual({
      start: timeOfDay(start), elapsedSeconds: 960, slot: 1, secondsLeft: 840,
    })
  })
  it('has no slot once every slot is over', () => {
    expect(boardClock(0, 6 * 15 * 60_000, config)).toMatchObject({ slot: null, secondsLeft: null, elapsedSeconds: 5400 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/boardClock.test.ts`
Expected: FAIL (cannot find module `./boardClock`)

- [ ] **Step 3: Write minimal implementation**

```ts
/** @file Shared clock of the animator board: the start most tablets agree on, and where the rotation stands. */
import type { QuizConfig } from '../config/types'
import { timeOfDay } from './startTime'
import { slotTiming } from './time'

/** A tablet whose start differs by more than this from the others is shown as out of step. */
export const OFFSET_TOLERANCE_MS = 60_000

/** Header of the board. */
export interface BoardClock {
  /** Reference start, "hh:mm". */
  start: string
  /** Whole seconds since the reference start. */
  elapsedSeconds: number
  /** 0-based slot, null once every slot is over. */
  slot: number | null
  /** Seconds before the next change of challenge, null once every slot is over. */
  secondsLeft: number | null
}

/**
 * Start most tablets agree on: the median, the lower one of the middle two, so one late tablet does not move it.
 * @param starts Start timestamps (ms) of the games in progress.
 * @returns The reference start, or null without any game in progress.
 * @example referenceStart([3000, 1000, 1000]) // 1000
 */
export function referenceStart(starts: readonly number[]): number | null {
  if (starts.length === 0) return null
  const sorted = [...starts].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) / 2)]
}

/**
 * How far a tablet's start is from the others.
 * @param start Start of that tablet, in ms.
 * @param reference Reference start, in ms.
 * @returns Rounded minutes (positive: started later), or null within OFFSET_TOLERANCE_MS.
 */
export function startOffsetMinutes(start: number, reference: number): number | null {
  const gap = start - reference
  return Math.abs(gap) > OFFSET_TOLERANCE_MS ? Math.round(gap / 60_000) : null
}

/**
 * Where the rotation stands for the reference start.
 * @param start Reference start, in ms.
 * @param now Phone time, in ms.
 * @param config Number of challenges and slot length.
 * @returns See BoardClock.
 */
export function boardClock(start: number, now: number, config: Pick<QuizConfig, 'stepCount' | 'slotMinutes'>): BoardClock {
  const timing = slotTiming(start, now, config.slotMinutes)
  const over = timing.slot >= config.stepCount
  return {
    start: timeOfDay(start),
    elapsedSeconds: Math.max(0, Math.floor((now - start) / 1000)),
    slot: over ? null : timing.slot,
    secondsLeft: over ? null : timing.secondsLeft,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/boardClock.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/boardClock.ts src/game/boardClock.test.ts
git commit -m "feat: add the shared clock of the remote board (#65)"
```

---

### Task 3: Contenu d'une carte d'équipe

**Files:**
- Create: `src/game/boardCard.ts`
- Test: `src/game/boardCard.test.ts`

**Interfaces:**
- Consumes: `BoardSnapshot`, `BoardEntry` (tâche 1) ; `referenceStart`, `startOffsetMinutes` (tâche 2) ; existants : `gamePhase` (`phase.ts`), `hintsAvailable`, `wrongAttemptsIn`, `GameState` (`progress.ts`), `restoreGameState` (`restore.ts`), `blockSecondsLeft` (`block.ts`), `slotTiming` (`time.ts`).
- Produces: `LATE_AFTER_S = 60`, `SILENT_AFTER_S = 120`, `CardStatus`, `Freshness`, `TeamCardView`, `boardCards(config: QuizConfig, fingerprint: string, snapshot: BoardSnapshot | null, now: number): { cards: TeamCardView[]; reference: number | null }`.

- [ ] **Step 1: Write the failing test**

```ts
/** @file Tests for what a team card of the animator board shows. */
import type { QuizConfig } from '../config/types'
import { boardCards } from './boardCard'
import type { BoardEntry, BoardSnapshot } from './boardSnapshot'
import { initialGameState } from './progress'

const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintTimes: [5, 10], blockSeconds: 60,
  animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4, hints: ['h1', 'h2'] },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 },
  ],
  padlock: { order: [1, 2] },
}
const FP = 'fp000001'
const MIN = 60_000
const playing = (over: Partial<ReturnType<typeof initialGameState>> = {}) =>
  ({ ...initialGameState(2), status: 'playing', startedAt: 0, ...over })
const entry = (team: string, state: unknown, over: Partial<BoardEntry> = {}): BoardEntry =>
  ({ team, fingerprint: FP, state, updatedAt: 0, ...over })
const snap = (teams: BoardEntry[], serverNow = 0, receivedAt = 0): BoardSnapshot => ({ serverNow, receivedAt, teams })
const card = (teams: BoardEntry[], now: number, name = 'Sorcières', serverNow = 0, receivedAt = 0) =>
  boardCards(config, FP, snap(teams, serverNow, receivedAt), now).cards.find((c) => c.team === name)!

describe('boardCards', () => {
  it('shows every team of quiz.yaml, unseen before any news', () => {
    const { cards, reference } = boardCards(config, FP, null, 0)
    expect(cards.map((c) => [c.team, c.status, c.freshness])).toEqual([['Sorcières', 'unseen', null], ['Zombies', 'unseen', null]])
    expect(reference).toBeNull()
  })
  it('ignores a row of a team that is not in quiz.yaml', () => {
    expect(boardCards(config, FP, snap([entry('Vampires', playing())]), 0).cards).toHaveLength(2)
  })
  it('says « other version » for another fingerprint or a damaged state', () => {
    expect(card([entry('Sorcières', playing(), { fingerprint: 'other' })], 0).status).toBe('otherVersion')
    expect(card([entry('Sorcières', { status: 'playing' })], 0).status).toBe('otherVersion')
  })
  it('says « not started » for a tablet that was reset (home state)', () => {
    expect(card([entry('Sorcières', initialGameState(2))], 0).status).toBe('home')
  })
  it('shows the challenge in play, its clock, wrong tries, block and hints', () => {
    const state = playing({ wrongAttempts: 2, wrongSlot: 0, blockedUntil: 6 * MIN + 30_000 })
    expect(card([entry('Sorcières', state)], 6 * MIN)).toMatchObject({
      status: 'challenge', challengeTitle: 'La crypte', slotSecondsLeft: 9 * 60, wrongAttempts: 2,
      blockedSeconds: 30, hints: { shown: 1, total: 2 }, found: [false, false],
    })
  })
  it('forgets the wrong tries of an earlier slot', () => {
    const state = playing({ digits: [4, null], wrongAttempts: 2, wrongSlot: 0 })
    expect(card([entry('Sorcières', state)], 16 * MIN)).toMatchObject({ status: 'challenge', challengeTitle: 'Le grenier', wrongAttempts: 0, hints: null })
  })
  it('shows the wait once the digit is found', () => {
    expect(card([entry('Sorcières', playing({ digits: [4, null] }))], MIN)).toMatchObject({ status: 'waiting', found: [true, false] })
  })
  it('shows « time up » with the missed challenge', () => {
    expect(card([entry('Sorcières', playing())], 16 * MIN)).toMatchObject({ status: 'timeUp', challengeTitle: 'La crypte' })
  })
  it('shows the padlock, then the victory time', () => {
    expect(card([entry('Sorcières', playing({ digits: [4, 0] }))], 31 * MIN).status).toBe('padlock')
    const won = { ...playing({ digits: [4, 0] }), status: 'won', finishedAt: 32 * MIN }
    expect(card([entry('Sorcières', won)], 33 * MIN)).toMatchObject({ status: 'won', finishedAt: 32 * MIN })
  })
  it('measures the silence on the server clock, then on the phone clock since the answer', () => {
    const at = (updatedAt: number, now: number) => card([entry('Sorcières', playing(), { updatedAt })], now, 'Sorcières', 100_000, 0)
    expect(at(40_000, 0)).toMatchObject({ silentSeconds: 60, freshness: 'fresh' })
    expect(at(39_000, 0)).toMatchObject({ silentSeconds: 61, freshness: 'late' })
    expect(at(40_000, 61_000)).toMatchObject({ silentSeconds: 121, freshness: 'silent' })
  })
  it('flags a tablet that started out of step with the others', () => {
    const teams = [entry('Sorcières', playing()), entry('Zombies', playing({ startedAt: 3 * MIN }))]
    const { cards, reference } = boardCards(config, FP, snap(teams), 5 * MIN)
    expect(reference).toBe(0)
    expect(cards.map((c) => c.offsetMinutes)).toEqual([null, 3])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/boardCard.test.ts`
Expected: FAIL (cannot find module `./boardCard`)

- [ ] **Step 3: Write minimal implementation**

```ts
/** @file What one team's card shows on the animator board, derived from its last news the way a tablet derives its screen. */
import type { QuizConfig } from '../config/types'
import { blockSecondsLeft } from './block'
import { referenceStart, startOffsetMinutes } from './boardClock'
import type { BoardEntry, BoardSnapshot } from './boardSnapshot'
import { gamePhase } from './phase'
import { hintsAvailable, wrongAttemptsIn, type GameState } from './progress'
import { restoreGameState } from './restore'
import { slotTiming } from './time'

/** Seconds without news after which a card turns orange (two missed 30 s heartbeats). */
export const LATE_AFTER_S = 60
/** Seconds without news after which a card turns red. */
export const SILENT_AFTER_S = 120

export type CardStatus = 'unseen' | 'otherVersion' | 'home' | 'entrance' | 'challenge' | 'waiting' | 'timeUp' | 'padlock' | 'won'
export type Freshness = 'fresh' | 'late' | 'silent'

/** Everything a team card shows. */
export interface TeamCardView {
  team: string
  status: CardStatus
  /** Challenge in play (challenge, waiting) or missed (timeUp), null otherwise. */
  challengeTitle: string | null
  /** Seconds left in the current slot (challenge, waiting), null otherwise. */
  slotSecondsLeft: number | null
  /** One per challenge: digit known. */
  found: boolean[]
  /** Seconds of keyboard block left (challenge only). */
  blockedSeconds: number
  /** Wrong tries in the current slot (challenge only). */
  wrongAttempts: number
  /** Hints of the challenge in play, when it has any. */
  hints: { shown: number; total: number } | null
  /** Minutes the start differs from the others (positive: started later), null when in step. */
  offsetMinutes: number | null
  /** Victory time in ms (won only). */
  finishedAt: number | null
  /** Seconds since the last news, null when never seen. */
  silentSeconds: number | null
  freshness: Freshness | null
}

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0

/** The state a tablet sent, or why the board cannot use it. */
function readState(entry: BoardEntry, fingerprint: string, stepCount: number): GameState | 'home' | 'otherVersion' {
  // Another quiz or app version: its challenges and timings may differ, the board would compute nonsense.
  if (entry.fingerprint !== fingerprint) return 'otherVersion'
  const raw = typeof entry.state === 'object' && entry.state !== null ? entry.state as Record<string, unknown> : {}
  // A reset tablet sends its home state, which restoreGameState refuses (nothing to resume).
  if (raw.status === 'home') return 'home'
  const restored = restoreGameState(entry.state, stepCount)
  if (!restored) return 'otherVersion'
  // restoreGameState drops the wrong tries (a reload starts them over); the board wants them.
  return { ...restored, wrongAttempts: isCount(raw.wrongAttempts) ? raw.wrongAttempts : 0, wrongSlot: isCount(raw.wrongSlot) ? raw.wrongSlot : null }
}

function silence(entry: BoardEntry, snapshot: BoardSnapshot, now: number): { silentSeconds: number; freshness: Freshness } {
  // Server clock up to the answer, then the phone clock: tablets and phone never need to agree on the time.
  const silentSeconds = Math.max(0, Math.floor((snapshot.serverNow - entry.updatedAt + now - snapshot.receivedAt) / 1000))
  const freshness = silentSeconds > SILENT_AFTER_S ? 'silent' : silentSeconds > LATE_AFTER_S ? 'late' : 'fresh'
  return { silentSeconds, freshness }
}

/**
 * Cards of every team of quiz.yaml, in its order.
 * @param config Validated quiz of this app.
 * @param fingerprint quizFingerprint(config).
 * @param snapshot Last good answer of read_board, null before the first one.
 * @param now Phone time, in ms.
 * @returns The cards, and the reference start used for the offsets (null without a game in progress).
 */
export function boardCards(config: QuizConfig, fingerprint: string, snapshot: BoardSnapshot | null, now: number): { cards: TeamCardView[]; reference: number | null } {
  const rows = config.teams.map((team) => snapshot?.teams.find((e) => e.team === team) ?? null)
  const states = rows.map((row) => (row ? readState(row, fingerprint, config.stepCount) : null))
  const starts = states.flatMap((s) => (typeof s === 'object' && s?.status === 'playing' && s.startedAt !== null ? [s.startedAt] : []))
  const reference = referenceStart(starts)
  const cards = config.teams.map((team, teamIndex): TeamCardView => {
    const blank: TeamCardView = {
      team, status: 'unseen', challengeTitle: null, slotSecondsLeft: null, found: Array.from({ length: config.stepCount }, () => false),
      blockedSeconds: 0, wrongAttempts: 0, hints: null, offsetMinutes: null, finishedAt: null, silentSeconds: null, freshness: null,
    }
    const row = rows[teamIndex]
    const state = states[teamIndex]
    if (!row || !snapshot || state === null) return blank
    const seen = { ...blank, ...silence(row, snapshot, now) }
    if (state === 'home' || state === 'otherVersion') return { ...seen, status: state }
    return { ...seen, ...playingCard(state, config, teamIndex, now, reference) }
  })
  return { cards, reference }
}

function playingCard(state: GameState, config: QuizConfig, teamIndex: number, now: number, reference: number | null): Partial<TeamCardView> {
  const found = state.digits.map((d) => d !== null)
  const phase = gamePhase(state, config, teamIndex, now)
  const offsetMinutes = state.status === 'playing' && state.startedAt !== null && reference !== null
    ? startOffsetMinutes(state.startedAt, reference) : null
  const base = { found, offsetMinutes }
  switch (phase.kind) {
    case 'home': case 'entrance': case 'padlock': return { ...base, status: phase.kind }
    case 'won': return { ...base, status: 'won', finishedAt: state.finishedAt }
    case 'timeUp': return { ...base, status: 'timeUp', challengeTitle: config.steps[phase.challenge].title }
    case 'waiting':
    case 'challenge': {
      const step = config.steps[phase.challenge]
      const slotSecondsLeft = slotTiming(state.startedAt ?? now, now, config.slotMinutes).secondsLeft
      const common = { ...base, status: phase.kind, challengeTitle: step.title, slotSecondsLeft }
      if (phase.kind === 'waiting') return common
      const total = step.hints?.length ?? 0
      return {
        ...common, blockedSeconds: blockSecondsLeft(state.blockedUntil, now), wrongAttempts: wrongAttemptsIn(state, phase.slot),
        hints: total > 0 ? { shown: hintsAvailable(state, config, phase.challenge, phase.slot, now), total } : null,
      }
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/boardCard.test.ts`
Expected: PASS (11 tests). Si `wrongAttemptsIn` n'est pas exporté par `progress.ts`, l'exporter (il l'est déjà : `TeamGame.tsx` l'importe).

- [ ] **Step 5: Commit**

```bash
git add src/game/boardCard.ts src/game/boardCard.test.ts
git commit -m "feat: derive each team card of the remote board (#65)"
```

---

### Task 4: Code de soirée gardé sur l'appareil, et adresse `?animateur`

**Files:**
- Create: `src/services/savedEveningCode.ts`, `src/hooks/useEveningCode.ts`, `src/game/boardMode.ts`
- Test: `src/services/savedEveningCode.test.ts`, `src/game/boardMode.test.ts`

**Interfaces:**
- Produces: `EVENING_CODE_KEY = 'quiz-halloween:evening-code'`, `loadEveningCode(): string | null`, `saveEveningCode(code: string): void` (espaces autour retirés ; vide = effacé), `useEveningCode(): [string | null, (code: string) => void]`, `isBoardMode(search: string): boolean`.

- [ ] **Step 1: Write the failing tests**

`src/services/savedEveningCode.test.ts` :

```ts
/** @file Tests for the evening code kept on the device. */
import { EVENING_CODE_KEY, loadEveningCode, saveEveningCode } from './savedEveningCode'

describe('savedEveningCode', () => {
  it('has no code at first', () => {
    expect(loadEveningCode()).toBeNull()
  })
  it('keeps the code without the spaces around it', () => {
    saveEveningCode('  CITROUILLE-42 ')
    expect(localStorage.getItem(EVENING_CODE_KEY)).toBe('CITROUILLE-42')
    expect(loadEveningCode()).toBe('CITROUILLE-42')
  })
  it('forgets the code when saved empty', () => {
    saveEveningCode('CITROUILLE-42')
    saveEveningCode('   ')
    expect(loadEveningCode()).toBeNull()
  })
  it('never throws when the storage is refused', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(loadEveningCode()).toBeNull()
    spy.mockRestore()
  })
})
```

`src/game/boardMode.test.ts` :

```ts
/** @file Tests for the animator board address. */
import { isBoardMode } from './boardMode'

describe('isBoardMode', () => {
  it('is on with ?animateur, with or without a value', () => {
    expect(isBoardMode('?animateur')).toBe(true)
    expect(isBoardMode('?test&animateur=1')).toBe(true)
  })
  it('is off otherwise', () => {
    expect(isBoardMode('')).toBe(false)
    expect(isBoardMode('?test')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/savedEveningCode.test.ts src/game/boardMode.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Write minimal implementation**

`src/services/savedEveningCode.ts` :

```ts
/** @file Remembers the evening code of the remote board on this device, under its own key so a game reset keeps it. */

/** localStorage key of the evening code. */
export const EVENING_CODE_KEY = 'quiz-halloween:evening-code'

// Every access is wrapped, like savedTeam: a refused storage only means typing the code again.

/**
 * Reads the evening code of this device.
 * @returns The code, or null (none saved, storage refused).
 */
export function loadEveningCode(): string | null {
  try {
    return localStorage.getItem(EVENING_CODE_KEY) || null
  } catch {
    return null
  }
}

/**
 * Saves the evening code, without the spaces a phone keyboard adds; an empty code turns the remote board off.
 * @param code Code as typed.
 */
export function saveEveningCode(code: string): void {
  const trimmed = code.trim()
  try {
    if (trimmed === '') localStorage.removeItem(EVENING_CODE_KEY)
    else localStorage.setItem(EVENING_CODE_KEY, trimmed)
  } catch { /* see above */ }
}
```

`src/hooks/useEveningCode.ts` :

```ts
/** @file Evening code of the remote board on this device: read once, changed by an animator. */
import { useState } from 'react'
import { loadEveningCode, saveEveningCode } from '../services/savedEveningCode'

/**
 * Holds the evening code of this device.
 * @returns The code (null when none) and a setter that saves it (empty turns it off).
 */
export function useEveningCode(): [string | null, (code: string) => void] {
  const [code, setCode] = useState(loadEveningCode)
  const change = (next: string) => {
    saveEveningCode(next)
    setCode(loadEveningCode())
  }
  return [code, change]
}
```

`src/game/boardMode.ts` :

```ts
/** @file Animator board switch: `?animateur` in the address, so the tablets never show it by accident. */

/**
 * Whether the app was opened as the animator board.
 * @param search Query string of the address (`window.location.search`).
 * @returns True when it has an `animateur` parameter, with or without a value.
 */
export function isBoardMode(search: string): boolean {
  return new URLSearchParams(search).has('animateur')
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/savedEveningCode.test.ts src/game/boardMode.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/savedEveningCode.ts src/services/savedEveningCode.test.ts src/hooks/useEveningCode.ts src/game/boardMode.ts src/game/boardMode.test.ts
git commit -m "feat: keep the evening code and add the ?animateur address (#65)"
```

---

### Task 5: Service Supabase du tableau

**Files:**
- Create: `src/services/supabaseClient.ts`, `src/services/board.ts`, `src/vite-env.d.ts`, `.env.example`
- Modify: `package.json` (dépendance), `vite.config.ts` (bloc `test`)
- Test: `src/services/board.test.ts`

**Interfaces:**
- Consumes: `parseBoard`, `BoardSnapshot` (tâche 1).
- Produces: `BoardCallResult = 'ok' | 'refused' | 'failed'` (exporté depuis `src/game/syncStatus.ts`, créé ici avec seulement ce type ; la tâche 6 le complète), `RpcClient`, `BoardApi { enabled: boolean; push(code, team, fingerprint, state: unknown): Promise<BoardCallResult>; read(code): Promise<{ result: BoardCallResult; snapshot: BoardSnapshot | null }>; reset(code): Promise<BoardCallResult> }`, `createBoardApi(client: RpcClient | null, clock?: () => number): BoardApi`, `boardApi: BoardApi`.
- Noms des paramètres SQL (à respecter dans la tâche 11) : `p_code`, `p_team`, `p_fingerprint`, `p_state`. Mauvais code = erreur SQLSTATE `28P01`.

- [ ] **Step 1: Install the client and keep tests off the real server**

```bash
npm install @supabase/supabase-js@^2.117.2
```

Dans `vite.config.ts`, bloc `test`, ajouter (les tests unitaires ne doivent jamais joindre le vrai Supabase, même si `.env.local` existe) :

```ts
    // Unit tests never reach the real Supabase, even with a .env.local on this PC.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
```

Créer `src/vite-env.d.ts` :

```ts
/** @file Types of the build-time settings read through import.meta.env. */
interface ImportMetaEnv {
  /** Supabase project URL; missing: remote board off. */
  readonly VITE_SUPABASE_URL?: string
  /** Public anon key of that project (never the service_role key). */
  readonly VITE_SUPABASE_ANON_KEY?: string
}
interface ImportMeta { readonly env: ImportMetaEnv }
```

Créer `.env.example` :

```bash
# Copier en .env.local (gitignoré). Sans ces deux lignes, le suivi à distance est désactivé.
VITE_SUPABASE_URL=https://<projet>.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon publique>
```

- [ ] **Step 2: Write the failing test**

```ts
/** @file Tests for the remote board service: result of each call, never an exception. */
import { createBoardApi, type RpcClient } from './board'

const client = (answer: Awaited<ReturnType<RpcClient['rpc']>> | Error) => ({
  rpc: vi.fn(() => (answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer))),
})

describe('createBoardApi', () => {
  it('sends the state with the parameter names of the SQL function', async () => {
    const fake = client({ data: null, error: null })
    expect(await createBoardApi(fake).push('CODE-123', 'Zombies', 'fp', { status: 'home' })).toBe('ok')
    expect(fake.rpc).toHaveBeenCalledWith('push_team_state', { p_code: 'CODE-123', p_team: 'Zombies', p_fingerprint: 'fp', p_state: { status: 'home' } })
  })
  it('tells a refused evening code from any other failure', async () => {
    expect(await createBoardApi(client({ data: null, error: { code: '28P01', message: 'invalid evening code' } })).push('x', 't', 'f', {})).toBe('refused')
    expect(await createBoardApi(client({ data: null, error: { code: '23514', message: 'check' } })).push('x', 't', 'f', {})).toBe('failed')
    expect(await createBoardApi(client(new TypeError('Failed to fetch'))).push('x', 't', 'f', {})).toBe('failed')
  })
  it('reads the board, stamped with the phone time', async () => {
    const fake = client({ data: { server_now: 10, teams: [] }, error: null })
    expect(await createBoardApi(fake, () => 99).read('CODE-123')).toEqual({ result: 'ok', snapshot: { serverNow: 10, receivedAt: 99, teams: [] } })
    expect(fake.rpc).toHaveBeenCalledWith('read_board', { p_code: 'CODE-123' })
  })
  it('counts an unreadable board as a failure', async () => {
    expect(await createBoardApi(client({ data: 'nope', error: null })).read('x')).toEqual({ result: 'failed', snapshot: null })
  })
  it('resets the board', async () => {
    const fake = client({ data: null, error: null })
    expect(await createBoardApi(fake).reset('CODE-123')).toBe('ok')
    expect(fake.rpc).toHaveBeenCalledWith('reset_board', { p_code: 'CODE-123' })
  })
  it('is off without a client', async () => {
    const api = createBoardApi(null)
    expect(api.enabled).toBe(false)
    expect(await api.push('x', 't', 'f', {})).toBe('failed')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/services/board.test.ts`
Expected: FAIL (cannot find module `./board`)

- [ ] **Step 4: Write minimal implementation**

`src/game/syncStatus.ts` (complété à la tâche 6) :

```ts
/** @file Where the remote follow-up of a tablet stands, and the words the animator menu uses for it. */

/** What a call to the remote board gave: done, evening code refused, or anything else (network, server). */
export type BoardCallResult = 'ok' | 'refused' | 'failed'
```

`src/services/supabaseClient.ts` :

```ts
/** @file The one Supabase client of the app (public anon key only), or null when the build has no Supabase settings. */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase client; null without VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (unit tests, local dev without
 * .env.local), which turns the remote board off. No login: nothing to keep in localStorage.
 */
export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  : null
```

`src/services/board.ts` :

```ts
/** @file The only door to the remote board (SQL functions push_team_state, read_board, reset_board). Never throws. */
import { parseBoard, type BoardSnapshot } from '../game/boardSnapshot'
import type { BoardCallResult } from '../game/syncStatus'
import { supabase } from './supabaseClient'

/** The part of the Supabase client used here, so tests can pass a fake. */
export interface RpcClient {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>
}

/** Calls to the remote board. */
export interface BoardApi {
  /** False when the build has no Supabase settings: nothing is ever sent. */
  enabled: boolean
  /** Sends a tablet's game (also its heartbeat). */
  push(code: string, team: string, fingerprint: string, state: unknown): Promise<BoardCallResult>
  /** Reads every team; the snapshot is null unless the result is 'ok'. */
  read(code: string): Promise<{ result: BoardCallResult; snapshot: BoardSnapshot | null }>
  /** « Nouvelle soirée »: empties the board. */
  reset(code: string): Promise<BoardCallResult>
}

/** SQLSTATE raised by the SQL functions for a wrong evening code (invalid_password). */
const REFUSED = '28P01'

/**
 * Builds the board calls on a Supabase client.
 * @param client Client, or null (remote board off).
 * @param clock Phone time, for the snapshot stamp.
 * @returns The calls; none of them ever throws.
 */
export function createBoardApi(client: RpcClient | null, clock: () => number = Date.now): BoardApi {
  const call = async (fn: string, args: Record<string, unknown>): Promise<{ result: BoardCallResult; data: unknown }> => {
    if (!client) return { result: 'failed', data: null }
    try {
      const { data, error } = await client.rpc(fn, args)
      if (!error) return { result: 'ok', data }
      return { result: error.code === REFUSED ? 'refused' : 'failed', data: null }
    } catch {
      // No network, DNS, CORS...: the game goes on, the next heartbeat retries.
      return { result: 'failed', data: null }
    }
  }
  return {
    enabled: client !== null,
    push: async (code, team, fingerprint, state) =>
      (await call('push_team_state', { p_code: code, p_team: team, p_fingerprint: fingerprint, p_state: state })).result,
    read: async (code) => {
      const { result, data } = await call('read_board', { p_code: code })
      const snapshot = result === 'ok' ? parseBoard(data, clock()) : null
      return result === 'ok' && !snapshot ? { result: 'failed', snapshot: null } : { result, snapshot }
    },
    reset: async (code) => (await call('reset_board', { p_code: code })).result,
  }
}

/** Board calls of the app. */
export const boardApi = createBoardApi(supabase && { rpc: (fn, args) => supabase.rpc(fn, args) })
```

Si TypeScript refuse l'adaptateur `supabase.rpc(fn, args)` (types génériques de supabase-js sans types générés), écrire `rpc: (fn, args) => supabase.rpc(fn, args) as unknown as ReturnType<RpcClient['rpc']>` : le résultat est de toute façon vérifié à l'exécution par `parseBoard`.

- [ ] **Step 5: Run tests, typecheck**

Run: `npx vitest run src/services/board.test.ts && npm run typecheck`
Expected: PASS (6 tests), typecheck sans erreur.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/vite-env.d.ts .env.example src/game/syncStatus.ts src/services/supabaseClient.ts src/services/board.ts src/services/board.test.ts
git commit -m "feat: add the Supabase service of the remote board (#65)"
```

---

### Task 6: Envoi de l'état par la tablette (`useBoardSync`)

**Files:**
- Modify: `src/game/syncStatus.ts`
- Create: `src/game/latestSender.ts`, `src/hooks/useBoardSync.ts`
- Test: `src/game/syncStatus.test.ts`, `src/game/latestSender.test.ts`, `src/hooks/useBoardSync.test.ts`

**Interfaces:**
- Consumes: `BoardApi`, `boardApi` (tâche 5).
- Produces: `SyncStatus = { kind: 'off' } | { kind: 'pending' } | { kind: 'connected' } | { kind: 'refused' } | { kind: 'failing'; since: number }`, `afterPush(previous: SyncStatus, result: BoardCallResult, now: number): SyncStatus`, `syncStatusLabel(status: SyncStatus, now: number): string`, `createLatestSender<T>(send: (value: T) => Promise<void>): (value: T) => void`, `HEARTBEAT_MS = 30_000`, `useBoardSync(input: { team: string; fingerprint: string; state: unknown; code: string | null }, api?: BoardApi): SyncStatus`.

- [ ] **Step 1: Write the failing tests**

`src/game/syncStatus.test.ts` :

```ts
/** @file Tests for the remote follow-up status of a tablet. */
import { afterPush, syncStatusLabel } from './syncStatus'

describe('afterPush', () => {
  it('follows the last result, and keeps the start of a run of failures', () => {
    expect(afterPush({ kind: 'pending' }, 'ok', 5)).toEqual({ kind: 'connected' })
    expect(afterPush({ kind: 'connected' }, 'refused', 5)).toEqual({ kind: 'refused' })
    expect(afterPush({ kind: 'connected' }, 'failed', 5)).toEqual({ kind: 'failing', since: 5 })
    expect(afterPush({ kind: 'failing', since: 5 }, 'failed', 90)).toEqual({ kind: 'failing', since: 5 })
  })
})

describe('syncStatusLabel', () => {
  it('says it in French for the animator menu', () => {
    expect(syncStatusLabel({ kind: 'off' }, 0)).toBe('désactivé')
    expect(syncStatusLabel({ kind: 'pending' }, 0)).toBe('connexion…')
    expect(syncStatusLabel({ kind: 'connected' }, 0)).toBe('connecté')
    expect(syncStatusLabel({ kind: 'refused' }, 0)).toBe('code de soirée refusé')
    expect(syncStatusLabel({ kind: 'failing', since: 0 }, 59_000)).toBe('hors ligne')
    expect(syncStatusLabel({ kind: 'failing', since: 0 }, 125_000)).toBe('hors ligne depuis 2 min')
  })
})
```

`src/game/latestSender.test.ts` :

```ts
/** @file Tests for the one-at-a-time sender where the latest value wins. */
import { createLatestSender } from './latestSender'

describe('createLatestSender', () => {
  it('sends one value at a time, then only the latest one waiting', async () => {
    const sent: number[] = []
    let finish: () => void = () => {}
    const send = createLatestSender<number>((value) => {
      sent.push(value)
      return new Promise((resolve) => { finish = resolve })
    })
    send(1)
    send(2)
    send(3)
    expect(sent).toEqual([1])
    finish()
    await vi.waitFor(() => expect(sent).toEqual([1, 3]))
    finish()
    send(4)
    await vi.waitFor(() => expect(sent).toEqual([1, 3, 4]))
  })
})
```

`src/hooks/useBoardSync.test.ts` :

```ts
/** @file Tests for the tablet sending its game to the remote board. */
import { act, renderHook } from '@testing-library/react'
import type { BoardApi } from '../services/board'
import { HEARTBEAT_MS, useBoardSync } from './useBoardSync'

const fakeApi = (result: 'ok' | 'refused' | 'failed' = 'ok', enabled = true) => {
  const push = vi.fn(() => Promise.resolve(result))
  const api: BoardApi = { enabled, push, read: vi.fn(), reset: vi.fn() }
  return { api, push }
}
const input = (state: unknown, code: string | null = 'CODE-123') => ({ team: 'Zombies', fingerprint: 'fp', state, code })

describe('useBoardSync', () => {
  afterEach(() => vi.useRealTimers())

  it('sends nothing without an evening code, or without Supabase settings', async () => {
    const { api, push } = fakeApi()
    const { result } = renderHook(() => useBoardSync(input({ n: 1 }, null), api))
    const off = fakeApi('ok', false)
    renderHook(() => useBoardSync(input({ n: 1 }), off.api))
    await act(async () => {})
    expect(push).not.toHaveBeenCalled()
    expect(off.push).not.toHaveBeenCalled()
    expect(result.current).toEqual({ kind: 'off' })
  })
  it('sends the state at once, then at every change, but not for a mere re-render', async () => {
    const { api, push } = fakeApi()
    const first = { n: 1 }
    const { result, rerender } = renderHook(({ state }) => useBoardSync(input(state), api), { initialProps: { state: first as unknown } })
    await act(async () => {})
    expect(push).toHaveBeenLastCalledWith('CODE-123', 'Zombies', 'fp', first)
    expect(result.current).toEqual({ kind: 'connected' })
    rerender({ state: first })
    await act(async () => {})
    expect(push).toHaveBeenCalledTimes(1)
    const second = { n: 2 }
    rerender({ state: second })
    await act(async () => {})
    expect(push).toHaveBeenLastCalledWith('CODE-123', 'Zombies', 'fp', second)
  })
  it('sends again every 30 s and when the network comes back', async () => {
    vi.useFakeTimers()
    const { api, push } = fakeApi()
    renderHook(() => useBoardSync(input({ n: 1 }), api))
    await act(async () => {})
    await act(async () => { vi.advanceTimersByTime(HEARTBEAT_MS) })
    expect(push).toHaveBeenCalledTimes(2)
    await act(async () => { window.dispatchEvent(new Event('online')) })
    expect(push).toHaveBeenCalledTimes(3)
  })
  it('reports a refused code and a failure', async () => {
    const refused = fakeApi('refused')
    const { result } = renderHook(() => useBoardSync(input({ n: 1 }), refused.api))
    await act(async () => {})
    expect(result.current).toEqual({ kind: 'refused' })
    const failed = fakeApi('failed')
    const second = renderHook(() => useBoardSync(input({ n: 1 }), failed.api))
    await act(async () => {})
    expect(second.result.current.kind).toBe('failing')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/syncStatus.test.ts src/game/latestSender.test.ts src/hooks/useBoardSync.test.ts`
Expected: FAIL (`afterPush`, `createLatestSender`, `useBoardSync` not found)

- [ ] **Step 3: Write minimal implementation**

`src/game/syncStatus.ts` (remplacer le contenu) :

```ts
/** @file Where the remote follow-up of a tablet stands, and the words the animator menu uses for it. */

/** What a call to the remote board gave: done, evening code refused, or anything else (network, server). */
export type BoardCallResult = 'ok' | 'refused' | 'failed'

/** Remote follow-up of a tablet. */
export type SyncStatus =
  /** No evening code, or no Supabase settings in the build. */
  | { kind: 'off' }
  /** First send not answered yet. */
  | { kind: 'pending' }
  | { kind: 'connected' }
  | { kind: 'refused' }
  /** Failing since `since` (ms, first failure of the run). */
  | { kind: 'failing'; since: number }

/**
 * Status after a send.
 * @param previous Status before.
 * @param result Result of the send.
 * @param now Tablet time, in ms.
 * @returns The new status; a run of failures keeps the time of its first one.
 */
export function afterPush(previous: SyncStatus, result: BoardCallResult, now: number): SyncStatus {
  if (result === 'ok') return { kind: 'connected' }
  if (result === 'refused') return { kind: 'refused' }
  return previous.kind === 'failing' ? previous : { kind: 'failing', since: now }
}

/**
 * Words of the « Suivi à distance » line of the animator menu.
 * @param status Status of the tablet.
 * @param now Tablet time, in ms.
 * @returns For example "connecté" or "hors ligne depuis 2 min".
 */
export function syncStatusLabel(status: SyncStatus, now: number): string {
  switch (status.kind) {
    case 'off': return 'désactivé'
    case 'pending': return 'connexion…'
    case 'connected': return 'connecté'
    case 'refused': return 'code de soirée refusé'
    case 'failing': {
      const minutes = Math.floor((now - status.since) / 60_000)
      return minutes < 1 ? 'hors ligne' : `hors ligne depuis ${minutes} min`
    }
  }
}
```

`src/game/latestSender.ts` :

```ts
/** @file Sends one value at a time, the latest waiting one next: an old state answered late never overwrites a newer one. */

/**
 * Wraps a send so calls never overlap.
 * @param send Sends one value; must not reject.
 * @returns A function to call with each new value; values replaced while a send runs are dropped.
 */
export function createLatestSender<T>(send: (value: T) => Promise<void>): (value: T) => void {
  let busy = false
  let waiting: { value: T } | null = null
  const run = (value: T) => {
    busy = true
    void send(value).finally(() => {
      busy = false
      const next = waiting
      waiting = null
      if (next) run(next.value)
    })
  }
  return (value) => {
    if (busy) waiting = { value }
    else run(value)
  }
}
```

`src/hooks/useBoardSync.ts` :

```ts
/** @file Sends the tablet's game to the remote board: at every change, every 30 s, and when the network comes back. */
import { useEffect, useRef, useState } from 'react'
import { createLatestSender } from '../game/latestSender'
import { afterPush, type SyncStatus } from '../game/syncStatus'
import { boardApi, type BoardApi } from '../services/board'

/** Heartbeat: the board turns a card orange after two missed ones. */
export const HEARTBEAT_MS = 30_000

/** What the tablet sends. */
export interface BoardSyncInput {
  team: string
  fingerprint: string
  /** Game state; a new object means a change (useReducer keeps the same one otherwise). */
  state: unknown
  /** Evening code, null: remote board off. */
  code: string | null
}

interface Payload { team: string; fingerprint: string; state: unknown; code: string }

/**
 * Keeps the remote board up to date with this tablet. Failures never reach the game.
 * @param input See BoardSyncInput.
 * @param api Board calls (a fake in tests).
 * @returns Status for the animator menu.
 */
export function useBoardSync({ team, fingerprint, state, code }: BoardSyncInput, api: BoardApi = boardApi): SyncStatus {
  const active = api.enabled && code !== null
  const [status, setStatus] = useState<SyncStatus>({ kind: 'pending' })
  const [send] = useState(() => createLatestSender<Payload>(async (p) => {
    const result = await api.push(p.code, p.team, p.fingerprint, p.state)
    setStatus((previous) => afterPush(previous, result, Date.now()))
  }))
  const latest = useRef<Payload | null>(null)
  useEffect(() => {
    latest.current = active && code !== null ? { team, fingerprint, state, code } : null
    if (latest.current) send(latest.current)
  }, [active, team, fingerprint, state, code, send])
  useEffect(() => {
    if (!active) return
    const resend = () => { if (latest.current) send(latest.current) }
    const id = setInterval(resend, HEARTBEAT_MS)
    window.addEventListener('online', resend)
    return () => { clearInterval(id); window.removeEventListener('online', resend) }
  }, [active, send])
  return active ? status : { kind: 'off' }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game/syncStatus.test.ts src/game/latestSender.test.ts src/hooks/useBoardSync.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/syncStatus.ts src/game/syncStatus.test.ts src/game/latestSender.ts src/game/latestSender.test.ts src/hooks/useBoardSync.ts src/hooks/useBoardSync.test.ts
git commit -m "feat: send the tablet game to the remote board (#65)"
```

---

### Task 7: Brancher la tablette (réglage, envoi, ligne du menu animateur)

**Files:**
- Modify: `src/components/TeamSetupScreen.tsx`, `src/components/Game.tsx`, `src/components/TeamGame.tsx`, `src/components/TeamAnimatorMenu.tsx`, `src/components/AnimatorMenu.tsx`, `src/styles/animator.css`, `src/styles/screens.css`
- Test: `src/components/TeamSetupScreen.test.tsx`, `src/components/AnimatorMenu.test.tsx`, `src/components/Game.test.tsx`

**Interfaces:**
- Consumes: `useEveningCode` (tâche 4), `useBoardSync`, `syncStatusLabel`, `SyncStatus` (tâche 6), `BoardApi`, `boardApi` (tâche 5), `quizFingerprint` (`src/game/fingerprint.ts`).
- Produces: `TeamSetupScreenProps` gagne `eveningCode: string | null` et `onChoose(index: number, eveningCode: string): void` ; `GameProps` gagne `api?: BoardApi` ; `TeamGameProps` gagne `eveningCode?: string | null` et `api?: BoardApi` ; `TeamAnimatorMenuProps` gagne `sync: SyncStatus` ; `AnimatorMenuProps` gagne `remote?: string`.

- [ ] **Step 1: Write the failing tests**

Ajouter à `src/components/TeamSetupScreen.test.tsx` (dans le `describe` existant ; adapter les rendus existants avec `eveningCode={null}`) :

```tsx
  it('passes the evening code typed with the chosen team', () => {
    const onChoose = vi.fn()
    render(<TeamSetupScreen teams={['Sorcières', 'Zombies']} animatorCode="2710" eveningCode={null} onChoose={onChoose} />)
    for (const digit of '2710') fireEvent.click(screen.getByRole('button', { name: digit }))
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    fireEvent.change(screen.getByLabelText('Code de soirée (facultatif)'), { target: { value: 'CITROUILLE-42' } })
    fireEvent.click(screen.getByRole('button', { name: 'Zombies' }))
    expect(onChoose).toHaveBeenCalledWith(1, 'CITROUILLE-42')
  })
  it('shows the saved evening code', () => {
    render(<TeamSetupScreen teams={['Sorcières']} animatorCode="2710" eveningCode="CITROUILLE-42" onChoose={vi.fn()} />)
    for (const digit of '2710') fireEvent.click(screen.getByRole('button', { name: digit }))
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByLabelText('Code de soirée (facultatif)')).toHaveValue('CITROUILLE-42')
  })
```

Ajouter à `src/components/AnimatorMenu.test.tsx` :

```tsx
  it('shows the remote follow-up line when given', () => {
    render(<AnimatorMenu steps={steps} code={[0, 4]} remote="hors ligne depuis 2 min" onClose={vi.fn()} />)
    expect(screen.getByText('Suivi à distance : hors ligne depuis 2 min')).toBeInTheDocument()
  })
```

Ajouter à `src/components/Game.test.tsx` (importer `EVENING_CODE_KEY` depuis `../services/savedEveningCode` et `type BoardApi` depuis `../services/board`) :

```tsx
  it('saves the evening code and sends the game of the chosen team', async () => {
    const push = vi.fn(() => Promise.resolve('ok' as const))
    const api: BoardApi = { enabled: true, push, read: vi.fn(), reset: vi.fn() }
    render(<Game config={config} api={api} />)
    for (const digit of '2710') press(digit)
    press('Valider')
    fireEvent.change(screen.getByLabelText('Code de soirée (facultatif)'), { target: { value: ' CITROUILLE-42 ' } })
    press('Zombies')
    expect(localStorage.getItem(EVENING_CODE_KEY)).toBe('CITROUILLE-42')
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('CITROUILLE-42', 'Zombies', expect.any(String), expect.objectContaining({ status: 'home' })))
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/TeamSetupScreen.test.tsx src/components/AnimatorMenu.test.tsx src/components/Game.test.tsx`
Expected: FAIL (no « Code de soirée » field, no remote line, `api` prop ignored)

- [ ] **Step 3: Implement**

`TeamSetupScreen.tsx` : ajouter les props et le champ, au-dessus de la liste des équipes.

```tsx
/** Props of TeamSetupScreen. */
export interface TeamSetupScreenProps {
  /** Team names, in quiz.yaml order. */
  teams: readonly string[]
  /** `code_animateur` from quiz.yaml. */
  animatorCode: string
  /** Evening code saved on this tablet, null when none. */
  eveningCode: string | null
  /** Called with the 0-based chosen team and the evening code as typed (empty: remote board off). */
  onChoose(index: number, eveningCode: string): void
}
```

Dans le composant : `const [code, setCode] = useState(eveningCode ?? '')`, puis dans la branche `unlocked`, avant `<p className="setup-question">` :

```tsx
          <label className="evening-code">
            Code de soirée (facultatif)
            <input type="text" value={code} autoComplete="off" autoCapitalize="characters" spellCheck={false}
              onChange={(event) => setCode(event.target.value)} />
          </label>
```

et `onClick={() => onChoose(i, code)}` sur les boutons d'équipe. Mettre à jour le JSDoc du composant : « then the optional evening code of the remote board and one big button per team ».

`Game.tsx` :

```tsx
/** @file Tablet entry: an animator sets the team first, then that team's game runs; `?animateur` shows the remote board instead. */
import type { QuizConfig } from '../config/types'
import { isTestMode } from '../game/testMode'
import { useEveningCode } from '../hooks/useEveningCode'
import { useTeam } from '../hooks/useTeam'
import { boardApi, type BoardApi } from '../services/board'
import { TeamGame } from './TeamGame'
import { TeamSetupScreen } from './TeamSetupScreen'

/** Props of Game. */
export interface GameProps {
  config: QuizConfig
  /** Remote board calls (a fake in tests). */
  api?: BoardApi
}

/**
 * The whole game for a valid quiz.
 * @param props.config Validated quiz configuration.
 * @param props.api Remote board calls.
 * @returns The setup screen until the tablet has a team, then the team's game.
 */
export function Game({ config, api = boardApi }: GameProps) {
  const { teamIndex, choose, forget } = useTeam(config.teams)
  const [eveningCode, setEveningCode] = useEveningCode()
  if (teamIndex === null) {
    const setUp = (index: number, code: string) => { setEveningCode(code); choose(index) }
    return <TeamSetupScreen teams={config.teams} animatorCode={config.animatorCode} eveningCode={eveningCode} onChoose={setUp} />
  }
  return (
    <TeamGame config={config} teamIndex={teamIndex} onChangeTeam={forget} testMode={isTestMode(window.location.search)}
      eveningCode={eveningCode} api={api} />
  )
}
```

(La branche `?animateur` est ajoutée à la tâche 9.)

`TeamGame.tsx` : ajouter aux props

```tsx
  /** Evening code of the remote board, null: nothing is sent. */
  eveningCode?: string | null
  /** Remote board calls (a fake in tests). */
  api?: BoardApi
```

puis dans le composant (signature `{ config, teamIndex, onChangeTeam, testMode = false, eveningCode = null, api = boardApi }`), après `useGameProgress` :

```tsx
  const fingerprint = useMemo(() => quizFingerprint(config), [config])
  const sync = useBoardSync({ team: config.teams[teamIndex], fingerprint, state: progress.state, code: eveningCode }, api)
```

et passer `sync={sync}` à `<TeamAnimatorMenu>`. Imports à ajouter : `useMemo` (react), `quizFingerprint` (`../game/fingerprint`), `useBoardSync` (`../hooks/useBoardSync`), `boardApi, type BoardApi` (`../services/board`).

`TeamAnimatorMenu.tsx` : prop `sync: SyncStatus` (JSDoc : « Remote follow-up of the tablet, shown on top of the menu. »), `const remote = syncStatusLabel(sync, now)` et `remote={remote}` sur les **trois** `<AnimatorMenu>`. Mettre à jour les rendus de `TeamAnimatorMenu.test.tsx` avec `sync={{ kind: 'off' }}`.

`AnimatorMenu.tsx` : prop

```tsx
  /** State of the remote follow-up (see syncStatusLabel), shown under the title. */
  remote?: string
```

et juste après `<h2 id="animator-title">Menu animateur</h2>` :

```tsx
        {remote && <p className="animator-remote">Suivi à distance : {remote}</p>}
```

`src/styles/animator.css` : après `.animator-warning` :

```css
.animator-remote { margin: 0; font-size: 20px; opacity: .85; }
```

`src/styles/screens.css` : à la fin (avant le premier `@media` s'il y en a un pour `.team-setup`, sinon à la fin) :

```css
/* Remote board code on the setup screen: typed once by an animator, native keyboard. */
.evening-code { display: grid; gap: 8px; width: min(100%, 520px); font-size: 24px; }
.evening-code input {
  min-height: 64px; padding: 0 16px; border: 2px solid var(--bronze); border-radius: 16px;
  background: var(--soot); color: var(--wax); font: 700 28px var(--text-font); text-align: center;
}
```

- [ ] **Step 4: Run all unit tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS, aucun test existant cassé. Vérifier `wc -l src/components/TeamGame.tsx` ≤ 200.

- [ ] **Step 5: Commit**

```bash
git add src/components src/styles/animator.css src/styles/screens.css
git commit -m "feat: send the tablet game with the evening code set at team setup (#65)"
```

---

### Task 8: Relecture du tableau toutes les 5 s (`useBoard`)

**Files:**
- Create: `src/hooks/useBoard.ts`
- Test: `src/hooks/useBoard.test.ts`

**Interfaces:**
- Consumes: `BoardApi` (tâche 5), `BoardSnapshot` (tâche 1), `BoardCallResult` (tâche 5).
- Produces: `POLL_MS = 5_000`, `BoardFeed { snapshot: BoardSnapshot | null; last: BoardCallResult | null; okAt: number | null }`, `useBoard(code: string, api?: BoardApi): BoardFeed`.

- [ ] **Step 1: Write the failing test**

```ts
/** @file Tests for the animator board reading the teams every 5 s. */
import { act, renderHook } from '@testing-library/react'
import type { BoardSnapshot } from '../game/boardSnapshot'
import type { BoardApi } from '../services/board'
import { POLL_MS, useBoard } from './useBoard'

const snapshot: BoardSnapshot = { serverNow: 1, receivedAt: 1, teams: [] }
let hidden = false
Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })

const fakeApi = (answers: Array<'ok' | 'refused' | 'failed'>) => {
  const read = vi.fn(() => {
    const result = answers.length > 1 ? answers.shift()! : answers[0]
    return Promise.resolve({ result, snapshot: result === 'ok' ? snapshot : null })
  })
  const api: BoardApi = { enabled: true, push: vi.fn(), read, reset: vi.fn() }
  return { api, read }
}

describe('useBoard', () => {
  beforeEach(() => { vi.useFakeTimers(); hidden = false })
  afterEach(() => vi.useRealTimers())

  it('reads at once, then every 5 s', async () => {
    const { api, read } = fakeApi(['ok'])
    const { result } = renderHook(() => useBoard('CODE-123', api))
    await act(async () => {})
    expect(read).toHaveBeenCalledWith('CODE-123')
    expect(result.current).toMatchObject({ snapshot, last: 'ok' })
    await act(async () => { vi.advanceTimersByTime(POLL_MS) })
    expect(read).toHaveBeenCalledTimes(2)
  })
  it('keeps the last good board when a read fails', async () => {
    const { api } = fakeApi(['ok', 'failed'])
    const { result } = renderHook(() => useBoard('CODE-123', api))
    await act(async () => {})
    await act(async () => { vi.advanceTimersByTime(POLL_MS) })
    expect(result.current).toMatchObject({ snapshot, last: 'failed' })
  })
  it('reports a refused code', async () => {
    const { api } = fakeApi(['refused'])
    const { result } = renderHook(() => useBoard('CODE-123', api))
    await act(async () => {})
    expect(result.current).toMatchObject({ snapshot: null, last: 'refused' })
  })
  it('pauses while the page is hidden and reads at once when it shows again', async () => {
    const { api, read } = fakeApi(['ok'])
    renderHook(() => useBoard('CODE-123', api))
    await act(async () => {})
    hidden = true
    await act(async () => { vi.advanceTimersByTime(3 * POLL_MS) })
    expect(read).toHaveBeenCalledTimes(1)
    hidden = false
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(read).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useBoard.test.ts`
Expected: FAIL (cannot find module `./useBoard`)

- [ ] **Step 3: Write minimal implementation**

```ts
/** @file Reads the remote board every 5 s while the page is visible (a phone in a pocket spends no battery on it). */
import { useEffect, useState } from 'react'
import type { BoardSnapshot } from '../game/boardSnapshot'
import type { BoardCallResult } from '../game/syncStatus'
import { boardApi, type BoardApi } from '../services/board'

/** Delay between two reads; the clocks of the cards tick on the phone in between. */
export const POLL_MS = 5_000

/** What the board knows. */
export interface BoardFeed {
  /** Last good answer, kept through failures. */
  snapshot: BoardSnapshot | null
  /** Result of the last read, null before the first answer. */
  last: BoardCallResult | null
  /** Phone time of the last good read, in ms. */
  okAt: number | null
}

/**
 * Keeps reading the board. Mount it again (React `key`) for another code.
 * @param code Evening code.
 * @param api Board calls (a fake in tests).
 * @returns See BoardFeed.
 */
export function useBoard(code: string, api: BoardApi = boardApi): BoardFeed {
  const [feed, setFeed] = useState<BoardFeed>({ snapshot: null, last: null, okAt: null })
  useEffect(() => {
    let cancelled = false
    let busy = false
    const read = async () => {
      // One read at a time, and none while hidden: visibilitychange reads again on return.
      if (busy || document.hidden) return
      busy = true
      const { result, snapshot } = await api.read(code)
      busy = false
      if (cancelled) return
      setFeed((previous) => (result === 'ok' ? { snapshot, last: result, okAt: Date.now() } : { ...previous, last: result }))
    }
    void read()
    const id = setInterval(() => void read(), POLL_MS)
    const onVisible = () => { if (!document.hidden) void read() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [code, api])
  return feed
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useBoard.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useBoard.ts src/hooks/useBoard.test.ts
git commit -m "feat: read the remote board every 5 s while visible (#65)"
```

---

### Task 9: Écran animateur

**Files:**
- Create: `src/components/board/BoardScreen.tsx`, `src/components/board/BoardView.tsx`, `src/components/board/BoardCodeForm.tsx`, `src/components/board/BoardHeader.tsx`, `src/components/board/TeamCard.tsx`, `src/components/board/NewEvening.tsx`, `src/styles/board.css`
- Modify: `src/components/Game.tsx`, `src/main.tsx`
- Test: `src/components/board/TeamCard.test.tsx`, `src/components/board/BoardScreen.test.tsx`

**Interfaces:**
- Consumes: `boardCards`, `TeamCardView`, `CardStatus` (tâche 3) ; `boardClock`, `BoardClock` (tâche 2) ; `useBoard`, `BoardFeed` (tâche 8) ; `useEveningCode` (tâche 4) ; `isBoardMode` (tâche 4) ; `BoardApi` (tâche 5) ; existants : `useNow`, `formatClock`, `timeOfDay`, `quizFingerprint`.
- Produces: `BoardScreen({ config, api }: { config: QuizConfig; api?: BoardApi })`.

- [ ] **Step 1: Write the failing tests**

`src/components/board/TeamCard.test.tsx` :

```tsx
/** @file Tests for one team card of the animator board. */
import { render, screen } from '@testing-library/react'
import type { TeamCardView } from '../../game/boardCard'
import { TeamCard } from './TeamCard'

const view = (over: Partial<TeamCardView>): TeamCardView => ({
  team: 'Zombies', status: 'challenge', challengeTitle: 'La crypte', slotSecondsLeft: 252, found: [true, false, false],
  blockedSeconds: 0, wrongAttempts: 0, hints: null, offsetMinutes: null, finishedAt: null, silentSeconds: 4, freshness: 'fresh', ...over,
})

describe('TeamCard', () => {
  it('shows the status, the challenge, its clock and the digits found', () => {
    render(<TeamCard view={view({})} />)
    const card = screen.getByRole('article', { name: 'Zombies' })
    expect(card).toHaveTextContent('En épreuve')
    expect(card).toHaveTextContent('La crypte')
    expect(card).toHaveTextContent('04:12')
    expect(screen.getByLabelText('1 chiffre trouvé sur 3')).toBeInTheDocument()
    expect(card).toHaveTextContent('à l’instant')
  })
  it('shows the alerts', () => {
    render(<TeamCard view={view({ blockedSeconds: 45, wrongAttempts: 3, hints: { shown: 2, total: 3 }, offsetMinutes: -3 })} />)
    const card = screen.getByRole('article', { name: 'Zombies' })
    expect(card).toHaveTextContent('Bloquée 00:45')
    expect(card).toHaveTextContent('3 mauvaises réponses')
    expect(card).toHaveTextContent('Indices vus 2/3')
    expect(card).toHaveTextContent('Décalée de 3 min')
  })
  it('turns orange then red without news, and says when it never had any', () => {
    const { rerender } = render(<TeamCard view={view({ silentSeconds: 130, freshness: 'silent' })} />)
    expect(screen.getByRole('article', { name: 'Zombies' })).toHaveClass('team-card--silent')
    expect(screen.getByText('il y a 2 min')).toBeInTheDocument()
    rerender(<TeamCard view={view({ status: 'unseen', challengeTitle: null, slotSecondsLeft: null, silentSeconds: null, freshness: null })} />)
    expect(screen.getByRole('article', { name: 'Zombies' })).toHaveTextContent('Aucune nouvelle')
  })
})
```

`src/components/board/BoardScreen.test.tsx` :

```tsx
/** @file Tests for the animator board screen. */
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { QuizConfig } from '../../config/types'
import { quizFingerprint } from '../../game/fingerprint'
import { initialGameState } from '../../game/progress'
import type { BoardApi } from '../../services/board'
import { EVENING_CODE_KEY } from '../../services/savedEveningCode'
import { BoardScreen } from './BoardScreen'

const config: QuizConfig = {
  title: 'Le manoir hanté', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintTimes: [10], blockSeconds: 0, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'La crypte', instruction: 'a', answer: { kind: 'digits', value: '4' }, digit: 4 },
    { title: 'Le grenier', instruction: 'b', answer: { kind: 'digits', value: '0' }, digit: 0 },
  ],
  padlock: { order: [1, 2] },
}
const api = (result: 'ok' | 'refused' = 'ok') => {
  const now = Date.now()
  const state = { ...initialGameState(2), status: 'playing', startedAt: now - 60_000 }
  const snapshot = { serverNow: now, receivedAt: now, teams: [{ team: 'Zombies', fingerprint: quizFingerprint(config), state, updatedAt: now }] }
  const fake: BoardApi = {
    enabled: true, push: vi.fn(),
    read: vi.fn(() => Promise.resolve(result === 'ok' ? { result, snapshot } : { result, snapshot: null })),
    reset: vi.fn(() => Promise.resolve('ok' as const)),
  }
  return fake
}
const openWith = (code: string) => {
  fireEvent.change(screen.getByLabelText('Code de soirée'), { target: { value: code } })
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le tableau' }))
}

describe('BoardScreen', () => {
  it('asks for the evening code, then shows a card per team', async () => {
    const fake = api()
    render(<BoardScreen config={config} api={fake} />)
    openWith('CODE-123')
    expect(await screen.findByText('En épreuve')).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Zombies' })).getByText('Le grenier')).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Sorcières' })).getByText('Aucune nouvelle')).toBeInTheDocument()
    expect(localStorage.getItem(EVENING_CODE_KEY)).toBe('CODE-123')
  })
  it('goes back to the code with « Code refusé » when the database refuses it', async () => {
    localStorage.setItem(EVENING_CODE_KEY, 'WRONG-CODE')
    render(<BoardScreen config={config} api={api('refused')} />)
    expect(await screen.findByText('Code refusé.')).toBeInTheDocument()
    expect(localStorage.getItem(EVENING_CODE_KEY)).toBeNull()
  })
  it('empties the board after a confirmation, and can be cancelled', async () => {
    localStorage.setItem(EVENING_CODE_KEY, 'CODE-123')
    const fake = api()
    render(<BoardScreen config={config} api={fake} />)
    await screen.findByText('En épreuve')
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle soirée' }))
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(fake.reset).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle soirée' }))
    fireEvent.click(screen.getByRole('button', { name: 'Effacer le tableau' }))
    expect(fake.reset).toHaveBeenCalledWith('CODE-123')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/board`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement the components**

`src/components/board/TeamCard.tsx` :

```tsx
/** @file One team on the animator board: where it is, its clock, its digits and what needs an animator. */
import type { CardStatus, TeamCardView } from '../../game/boardCard'
import { timeOfDay } from '../../game/startTime'
import { formatClock } from '../../game/time'

const STATUS: Record<CardStatus, string> = {
  unseen: 'Aucune nouvelle', otherVersion: 'Version différente', home: 'Pas commencé', entrance: 'Devant l’entrée',
  challenge: 'En épreuve', waiting: 'Chiffre trouvé, attente', timeUp: 'Temps écoulé', padlock: 'Au cadenas', won: 'Victoire',
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

/**
 * Card of one team.
 * @param props.view What to show (see boardCards).
 * @returns An article named after the team.
 */
export function TeamCard({ view }: { view: TeamCardView }) {
  const status = view.status === 'won' && view.finishedAt !== null ? `Victoire à ${timeOfDay(view.finishedAt)}` : STATUS[view.status]
  const found = view.found.filter(Boolean).length
  const alerts = [
    view.blockedSeconds > 0 && `Bloquée ${formatClock(view.blockedSeconds)}`,
    view.wrongAttempts > 0 && plural(view.wrongAttempts, 'mauvaise réponse', 'mauvaises réponses'),
    view.hints && `Indices vus ${view.hints.shown}/${view.hints.total}`,
    view.offsetMinutes !== null && `Décalée de ${Math.abs(view.offsetMinutes)} min`,
  ].filter((alert): alert is string => typeof alert === 'string')
  return (
    <article className={`team-card team-card--${view.freshness ?? 'unseen'} team-card--${view.status}`} aria-label={view.team}>
      <header className="team-card-head">
        <h2>{view.team}</h2>
        {view.silentSeconds !== null && (
          <span className="team-card-news">{view.freshness === 'fresh' ? 'à l’instant' : `il y a ${Math.floor(view.silentSeconds / 60)} min`}</span>
        )}
      </header>
      <p className="team-card-status">{status}</p>
      {view.challengeTitle && (
        <p className="team-card-challenge">
          <span>{view.challengeTitle}</span>
          {view.slotSecondsLeft !== null && <b>{formatClock(view.slotSecondsLeft)}</b>}
        </p>
      )}
      <ol className="team-card-digits" aria-label={`${plural(found, 'chiffre trouvé', 'chiffres trouvés')} sur ${view.found.length}`}>
        {view.found.map((known, i) => <li key={i} className={known ? 'found' : undefined} />)}
      </ol>
      {alerts.length > 0 && <ul className="team-card-alerts">{alerts.map((alert) => <li key={alert}>{alert}</li>)}</ul>}
    </article>
  )
}
```

`src/components/board/BoardHeader.tsx` :

```tsx
/** @file Top of the animator board: the start most tablets agree on and when the teams change challenge. */
import type { BoardClock } from '../../game/boardClock'
import { formatClock } from '../../game/time'

/**
 * Shared clock of the evening.
 * @param props.clock See boardClock, null without a game in progress.
 * @param props.stepCount Number of challenges.
 * @returns The header.
 */
export function BoardHeader({ clock, stepCount }: { clock: BoardClock | null; stepCount: number }) {
  return (
    <header className="board-header">
      <h1>Suivi des équipes</h1>
      {clock === null ? <p>Aucune partie en cours.</p> : (
        <p>
          Départ {clock.start} · Temps écoulé {formatClock(clock.elapsedSeconds)}
          {clock.slot === null || clock.secondsLeft === null
            ? ' · Toutes les épreuves sont finies'
            : <> · Épreuve {clock.slot + 1}/{stepCount} · Changement d’épreuve dans <b>{formatClock(clock.secondsLeft)}</b></>}
        </p>
      )}
    </header>
  )
}
```

`src/components/board/BoardCodeForm.tsx` :

```tsx
/** @file Asks for the evening code on the animator's phone. */
import { useState, type FormEvent } from 'react'

/**
 * Code form of the animator board.
 * @param props.refused Whether the last code was refused by the database.
 * @param props.onSubmit Called with the typed code.
 * @returns The form.
 */
export function BoardCodeForm({ refused, onSubmit }: { refused: boolean; onSubmit(code: string): void }) {
  const [code, setCode] = useState('')
  const submit = (event: FormEvent) => { event.preventDefault(); if (code.trim() !== '') onSubmit(code) }
  return (
    <form className="board-code" onSubmit={submit}>
      <h1>Suivi des équipes</h1>
      <label>
        Code de soirée
        <input type="text" value={code} autoComplete="off" autoCapitalize="characters" spellCheck={false}
          onChange={(event) => setCode(event.target.value)} />
      </label>
      {refused && <p className="board-error" role="alert">Code refusé.</p>}
      <button type="submit" className="seal-button">Ouvrir le tableau</button>
    </form>
  )
}
```

`src/components/board/NewEvening.tsx` :

```tsx
/** @file « Nouvelle soirée »: empties the board, after a confirmation (the tablets still playing come back within 30 s). */
import { useState } from 'react'

/**
 * Button and its confirmation.
 * @param props.onConfirm Empties the board.
 * @returns The button, or the confirmation.
 */
export function NewEvening({ onConfirm }: { onConfirm(): void }) {
  const [asking, setAsking] = useState(false)
  if (!asking) return <button type="button" className="ghost-button" onClick={() => setAsking(true)}>Nouvelle soirée</button>
  return (
    <div className="board-confirm">
      <p>Effacer le suivi de toutes les équipes ? Les tablettes encore en jeu réapparaîtront dans les 30 secondes.</p>
      <button type="button" className="seal-button" onClick={() => { setAsking(false); onConfirm() }}>Effacer le tableau</button>
      <button type="button" className="ghost-button" onClick={() => setAsking(false)}>Annuler</button>
    </div>
  )
}
```

`src/components/board/BoardView.tsx` :

```tsx
/** @file The animator board once the code is known: header, one card per team, freshness and « Nouvelle soirée ». */
import { useEffect, useMemo } from 'react'
import type { QuizConfig } from '../../config/types'
import { boardCards } from '../../game/boardCard'
import { boardClock } from '../../game/boardClock'
import { quizFingerprint } from '../../game/fingerprint'
import { useBoard } from '../../hooks/useBoard'
import { useNow } from '../../hooks/useNow'
import type { BoardApi } from '../../services/board'
import { BoardHeader } from './BoardHeader'
import { NewEvening } from './NewEvening'
import { TeamCard } from './TeamCard'

/** Props of BoardView. */
export interface BoardViewProps {
  config: QuizConfig
  code: string
  api: BoardApi
  /** Called when the database refuses the code. */
  onRefused(): void
}

/**
 * Live board.
 * @param props See BoardViewProps.
 * @returns The board.
 */
export function BoardView({ config, code, api, onRefused }: BoardViewProps) {
  const feed = useBoard(code, api)
  const now = useNow(true)
  const fingerprint = useMemo(() => quizFingerprint(config), [config])
  useEffect(() => { if (feed.last === 'refused') onRefused() }, [feed.last, onRefused])
  const { cards, reference } = boardCards(config, fingerprint, feed.snapshot, now)
  const age = feed.okAt === null ? null : Math.max(0, Math.floor((now - feed.okAt) / 1000))
  return (
    <main className="screen board">
      <BoardHeader clock={reference === null ? null : boardClock(reference, now, config)} stepCount={config.stepCount} />
      <div className="board-cards">{cards.map((view) => <TeamCard key={view.team} view={view} />)}</div>
      <footer className="board-footer">
        <p role="status">
          {feed.last === 'failed' ? 'Connexion perdue, nouvelle tentative…' : age === null ? 'Connexion…' : `Mis à jour il y a ${age} s`}
        </p>
        <NewEvening onConfirm={() => void api.reset(code)} />
      </footer>
    </main>
  )
}
```

`src/components/board/BoardScreen.tsx` :

```tsx
/** @file Animator board (`?animateur`): the evening code first, then the live board. */
import { useCallback, useState } from 'react'
import type { QuizConfig } from '../../config/types'
import { useEveningCode } from '../../hooks/useEveningCode'
import { boardApi, type BoardApi } from '../../services/board'
import { BoardCodeForm } from './BoardCodeForm'
import { BoardView } from './BoardView'

/**
 * Whole animator board.
 * @param props.config Validated quiz (same app, same quiz as the tablets).
 * @param props.api Board calls (a fake in tests).
 * @returns The code form, or the board.
 */
export function BoardScreen({ config, api = boardApi }: { config: QuizConfig; api?: BoardApi }) {
  const [code, setCode] = useEveningCode()
  const [refused, setRefused] = useState(false)
  // Stable: BoardView calls it from an effect.
  const onRefused = useCallback(() => { setRefused(true); setCode('') }, [setCode])
  if (code === null) return <main className="screen board"><BoardCodeForm refused={refused} onSubmit={(typed) => { setRefused(false); setCode(typed) }} /></main>
  // Keyed by code: another code starts a fresh feed.
  return <BoardView key={code} config={config} code={code} api={api} onRefused={onRefused} />
}
```

`useEveningCode` renvoie un nouveau setter à chaque rendu : pour que `useCallback` serve, l'envelopper dans `useCallback` dans `src/hooks/useEveningCode.ts` :

```ts
  const change = useCallback((next: string) => {
    saveEveningCode(next)
    setCode(loadEveningCode())
  }, [])
```

(importer `useCallback`).

`Game.tsx` : après les deux hooks, avant `if (teamIndex === null)` :

```tsx
  // The animator's phone: no team, no game, only the board.
  if (isBoardMode(window.location.search)) return <BoardScreen config={config} api={api} />
```

(imports `isBoardMode` depuis `../game/boardMode`, `BoardScreen` depuis `./board/BoardScreen` ; JSDoc du retour : « the remote board with `?animateur` ».)

`src/styles/board.css` (importé dans `src/main.tsx` après `animator.css`) :

```css
/** @file Animator board: stacked cards on a phone, a grid on a tablet; big type, readable outdoors. */
.board { gap: 16px; padding: 16px; max-width: 1100px; margin: 0 auto; }
.board-header h1, .board-code h1 { margin: 0; font-size: 32px; }
.board-header p { margin: 4px 0 0; font-size: 20px; font-variant-numeric: lining-nums; }
.board-header b { color: var(--amber); }
.board-cards { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); }
.team-card {
  display: grid; gap: 8px; padding: 14px 16px; border: 2px solid var(--bronze); border-radius: 16px;
  background: rgb(26 18 12 / .92); text-align: left; min-width: 0;
}
.team-card--late { border-color: #e39b2d; }
.team-card--silent { border-color: #d64533; box-shadow: 0 0 0 2px #d64533; }
.team-card-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.team-card-head h2 { margin: 0; font-size: 26px; overflow-wrap: anywhere; }
.team-card-news { font-size: 16px; opacity: .8; white-space: nowrap; }
.team-card--late .team-card-news { color: #e39b2d; opacity: 1; }
.team-card--silent .team-card-news { color: #ff7a66; opacity: 1; font-weight: 700; }
.team-card-status { margin: 0; font-size: 22px; font-weight: 700; color: var(--amber); }
.team-card-challenge { margin: 0; display: flex; justify-content: space-between; gap: 8px; font-size: 20px; }
.team-card-challenge b { font-variant-numeric: lining-nums; font-size: 24px; }
.team-card-digits { display: flex; gap: 6px; list-style: none; margin: 0; padding: 0; }
.team-card-digits li { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--bronze); }
.team-card-digits li.found { background: var(--amber); }
.team-card-alerts { margin: 0; padding-left: 20px; font-size: 18px; color: #ffb199; font-variant-numeric: lining-nums; }
.board-footer { display: grid; gap: 12px; justify-items: center; font-size: 18px; }
.board-confirm { display: grid; gap: 10px; justify-items: center; text-align: center; }
.board-code { display: grid; gap: 16px; justify-items: center; }
.board-code label { display: grid; gap: 8px; font-size: 24px; width: min(100%, 420px); }
.board-code input {
  min-height: 64px; padding: 0 16px; border: 2px solid var(--bronze); border-radius: 16px;
  background: var(--soot); color: var(--wax); font: 700 28px var(--text-font); text-align: center;
}
.board-error { margin: 0; color: #ff7a66; font-size: 20px; }
```

- [ ] **Step 4: Run all unit tests, typecheck and lint**

Run: `npm run test:run && npm run typecheck && npm run lint`
Expected: PASS. Vérifier qu'aucun fichier ne dépasse 200 lignes : `wc -l src/components/board/*.tsx src/components/Game.tsx`.

- [ ] **Step 5: Look at it in a browser**

Lancer `npm run dev`, ouvrir `http://localhost:5173/quiz-halloween/?animateur` avec Playwright (MCP) en 390×844 puis 810×1080 ; sans `.env.local` le tableau affiche « Connexion perdue, nouvelle tentative… » après le code : c'est attendu. Capture d'écran pour la PR.

- [ ] **Step 6: Commit**

```bash
git add src/components/board src/components/Game.tsx src/hooks/useEveningCode.ts src/styles/board.css src/main.tsx
git commit -m "feat: add the animator board screen at ?animateur (#65)"
```

---

### Task 10: Parcours e2e avec un faux Supabase

**Files:**
- Modify: `playwright.config.ts`
- Create: `e2e/remote-board.spec.ts`

**Interfaces:**
- Consumes: écrans des tâches 7 et 9 ; `setUpTablet`, `typeAnswer` (`e2e/typing.ts`) ; noms SQL `p_code`, `p_team`, `p_fingerprint`, `p_state` (tâche 5).

- [ ] **Step 1: Point the e2e build at a fake Supabase**

Dans `playwright.config.ts`, bloc `webServer`, ajouter :

```ts
    // A fake Supabase address, intercepted by page.route in remote-board.spec.ts: e2e never reach a real server.
    // Variables already set win over .env.local in Vite, so a local .env.local does not leak in.
    env: { VITE_SUPABASE_URL: 'https://board.e2e.test', VITE_SUPABASE_ANON_KEY: 'e2e-anon-key' },
```

- [ ] **Step 2: Write the e2e tests**

```ts
/** @file Remote board: a tablet sends its game, the animator's phone shows it; a tablet without network plays on. */
import { test, expect, type Page, type Route } from '@playwright/test'
import { typeAnswer } from './typing.js'

const RPC = 'https://board.e2e.test/rest/v1/rpc/'
type Push = { p_code: string; p_team: string; p_fingerprint: string; p_state: { status: string } }

/** Answers like PostgREST, CORS included (the fake server is on another origin than the app, with a preflight). */
async function reply(route: Route, status: number, body: unknown): Promise<void> {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' }
  if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
  return route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) })
}

/** Sets the tablet up with an evening code, recording what it sends. */
async function setUpWithCode(page: Page, team: string, pushes: Push[]): Promise<void> {
  await page.route(`${RPC}push_team_state`, async (route) => {
    if (route.request().method() === 'POST') pushes.push(route.request().postDataJSON() as Push)
    await reply(route, 200, null)
  })
  await page.goto('./')
  await typeAnswer(page, '2710')
  await page.getByLabel('Code de soirée (facultatif)').fill('CITROUILLE-42')
  await page.getByRole('button', { name: team, exact: true }).click()
}

test('a tablet sends its game and the animator board shows it', async ({ page, context }) => {
  const pushes: Push[] = []
  await setUpWithCode(page, 'Sorcières', pushes)
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect.poll(() => pushes.at(-1)?.p_state.status).toBe('playing')
  const last = pushes.at(-1)!
  expect(last).toMatchObject({ p_code: 'CITROUILLE-42', p_team: 'Sorcières' })

  const board = await context.newPage()
  await board.setViewportSize({ width: 360, height: 780 })
  await board.route(`${RPC}read_board`, (route) => reply(route, 200, {
    server_now: Date.now(), teams: [{ team: 'Sorcières', fingerprint: last.p_fingerprint, state: last.p_state, updated_at: Date.now() }],
  }))
  await board.goto('./?animateur')
  // Same browser context: the code typed on the tablet is already saved, the board opens at once.
  const card = board.getByRole('article', { name: 'Sorcières' })
  await expect(card).toContainText('En épreuve')
  await expect(card).toContainText('La galerie des portraits')
  await expect(board.getByRole('article', { name: 'Zombies' })).toContainText('Aucune nouvelle')
  const overflow = await board.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the board goes back to the code form when the evening code is refused', async ({ page }) => {
  await page.route(`${RPC}read_board`, (route) => reply(route, 403, { code: '28P01', message: 'invalid evening code' }))
  await page.goto('./?animateur')
  await page.getByLabel('Code de soirée').fill('MAUVAIS-CODE')
  await page.getByRole('button', { name: 'Ouvrir le tableau' }).click()
  await expect(page.getByRole('alert')).toHaveText('Code refusé.')
})

test('a tablet without network plays on and tells the animator', async ({ page }) => {
  await page.route(`${RPC}push_team_state`, (route) => route.abort('internetdisconnected'))
  await page.goto('./')
  await typeAnswer(page, '2710')
  await page.getByLabel('Code de soirée (facultatif)').fill('CITROUILLE-42')
  await page.getByRole('button', { name: 'Sorcières', exact: true }).click()
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'La galerie des portraits' })).toBeVisible()
  await typeAnswer(page, '6')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 6')
})
```

(« La galerie des portraits » : réponse `6`, chiffre 6 dans le `quiz.yaml` actuel, comme dans `e2e/save-and-reset.spec.ts`.)

- [ ] **Step 3: Run the e2e suite**

Arrêter tout `vite preview` sur 4173, puis : `npm run test:e2e`
Expected: PASS, y compris les parcours existants (aucun ne tape de code de soirée, donc aucun envoi).

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts e2e/remote-board.spec.ts
git commit -m "test: cover the remote board end to end with a fake Supabase (#65)"
```

---

### Task 11: Base Supabase, script de sécurité, déploiement

**Files:**
- Create: `supabase/config.toml` (par `supabase init`), `supabase/migrations/<horodatage>_remote_board.sql`, `scripts/check-board-security.ts`
- Modify: `package.json` (script `check:board`), `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: noms de fonctions et de paramètres de la tâche 5 ; `createBoardApi` n'est pas utilisé par le script (il parle directement au client pour tester aussi les accès interdits).

- [ ] **Step 1: Initialise Supabase and create the migration**

```bash
supabase init
supabase migration new remote_board
```

Contenu du fichier `supabase/migrations/<horodatage>_remote_board.sql` créé :

```sql
-- Remote animator board (issue #65): one row per team, reached only through three functions guarded by an evening code.
-- No personal data: a team name (monster names from quiz.yaml) and its game state.

create extension if not exists pgcrypto with schema extensions;

-- Evening code, hashed (bcrypt). A single row; set by hand, never committed.
create table public.evening_secret (
  id smallint primary key default 1 check (id = 1),
  code_hash text not null
);
alter table public.evening_secret enable row level security;

create table public.team_status (
  team text primary key check (char_length(team) between 1 and 40),
  fingerprint text not null check (char_length(fingerprint) <= 64),
  state jsonb not null check (jsonb_typeof(state) = 'object' and pg_column_size(state) <= 2048),
  updated_at timestamptz not null default now()
);
alter table public.team_status enable row level security;

-- RLS on and no policy: nobody reads or writes these tables directly, only the functions below.
revoke all on public.evening_secret, public.team_status from anon, authenticated;

create function public.check_evening_code(p_code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_code is null or char_length(p_code) < 8 or not exists (
    select 1 from public.evening_secret s where s.code_hash = extensions.crypt(p_code, s.code_hash)
  ) then
    -- Slows down guessing: each wrong try costs half a second.
    perform pg_sleep(0.5);
    raise exception 'invalid evening code' using errcode = '28P01';
  end if;
end $$;
revoke execute on function public.check_evening_code(text) from public, anon, authenticated;

create function public.push_team_state(p_code text, p_team text, p_fingerprint text, p_state jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.check_evening_code(p_code);
  if not exists (select 1 from public.team_status t where t.team = p_team)
     and (select count(*) from public.team_status) >= 12 then
    raise exception 'too many teams' using errcode = '54000';
  end if;
  insert into public.team_status (team, fingerprint, state, updated_at)
  values (p_team, p_fingerprint, p_state, now())
  on conflict (team) do update
    set fingerprint = excluded.fingerprint, state = excluded.state, updated_at = excluded.updated_at;
end $$;

create function public.read_board(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.check_evening_code(p_code);
  -- Times in ms, like Date.now() on the tablets.
  return jsonb_build_object(
    'server_now', floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
    'teams', coalesce((
      select jsonb_agg(jsonb_build_object(
        'team', t.team, 'fingerprint', t.fingerprint, 'state', t.state,
        'updated_at', floor(extract(epoch from t.updated_at) * 1000)::bigint
      ) order by t.team)
      from public.team_status t
    ), '[]'::jsonb)
  );
end $$;

create function public.reset_board(p_code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.check_evening_code(p_code);
  delete from public.team_status where true;
end $$;

revoke execute on function public.push_team_state(text, text, text, jsonb), public.read_board(text), public.reset_board(text)
  from public, authenticated;
grant execute on function public.push_team_state(text, text, text, jsonb), public.read_board(text), public.reset_board(text)
  to anon;
```

Pas de Docker sur ce PC : la migration n'est pas testée en local ; elle l'est par le script de l'étape 2 sur le vrai projet, **après accord de Romain** (voir « Mise en ligne »).

- [ ] **Step 2: Write the security check script**

`scripts/check-board-security.ts` :

```ts
/**
 * @file Checks the remote board database with the public anon key, as an intruder would see it:
 * `npm run check:board` (reads .env.local; asks the evening code in BOARD_CODE). `--full` also fills 12 fake teams
 * to check the 13th is refused, then empties the board: only before the evening.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
const code = process.env.BOARD_CODE
if (!url || !key || !code) {
  console.error('VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (.env.local) et BOARD_CODE sont nécessaires.')
  process.exit(2)
}
const db = createClient(url, key, { auth: { persistSession: false } })
const state = { status: 'home' }
let failures = 0

async function expectRefused(label: string, run: () => PromiseLike<{ error: unknown }>): Promise<void> {
  const { error } = await run()
  if (error) console.log(`ok     ${label}`)
  else { failures++; console.log(`ÉCHEC  ${label} : accepté`) }
}
async function expectAccepted(label: string, run: () => PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await run()
  if (!error) console.log(`ok     ${label}`)
  else { failures++; console.log(`ÉCHEC  ${label} : ${error.message}`) }
}

await expectRefused('lecture directe de team_status', () => db.from('team_status').select())
await expectRefused('lecture directe de evening_secret', () => db.from('evening_secret').select())
await expectRefused('écriture directe dans team_status', () => db.from('team_status').insert({ team: 'x', fingerprint: 'x', state }))
await expectRefused('appel de check_evening_code', () => db.rpc('check_evening_code', { p_code: code }))
await expectRefused('read_board avec un mauvais code', () => db.rpc('read_board', { p_code: 'mauvais-code' }))
await expectRefused('push_team_state avec un mauvais code', () => db.rpc('push_team_state', { p_code: 'mauvais-code', p_team: 'x', p_fingerprint: 'x', p_state: state }))
await expectRefused('reset_board avec un mauvais code', () => db.rpc('reset_board', { p_code: 'mauvais-code' }))
await expectRefused('nom d’équipe de 41 caractères', () => db.rpc('push_team_state', { p_code: code, p_team: 'x'.repeat(41), p_fingerprint: 'x', p_state: state }))
await expectRefused('état de plus de 2 Ko', () => db.rpc('push_team_state', { p_code: code, p_team: 'test-taille', p_fingerprint: 'x', p_state: { pad: 'x'.repeat(3000) } }))
await expectAccepted('read_board avec le bon code', () => db.rpc('read_board', { p_code: code }))

if (process.argv.includes('--full')) {
  const { data } = await db.rpc('read_board', { p_code: code })
  if ((data as { teams: unknown[] } | null)?.teams.length) {
    console.error('Le tableau n’est pas vide : --full l’effacerait. Faire « Nouvelle soirée » d’abord.')
    process.exit(2)
  }
  for (let i = 1; i <= 12; i++) {
    await expectAccepted(`équipe de test ${i}`, () => db.rpc('push_team_state', { p_code: code, p_team: `test-${i}`, p_fingerprint: 'x', p_state: state }))
  }
  await expectRefused('13e équipe', () => db.rpc('push_team_state', { p_code: code, p_team: 'test-13', p_fingerprint: 'x', p_state: state }))
  await expectAccepted('reset_board avec le bon code', () => db.rpc('reset_board', { p_code: code }))
}

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} vérification(s) en échec.`)
process.exit(failures === 0 ? 0 : 1)
```

`package.json`, dans `scripts` :

```json
    "check:board": "tsx --env-file=.env.local scripts/check-board-security.ts",
```

Run: `npx tsc -p tsconfig.scripts.json` → aucune erreur (le script n'est pas lancé ici : pas encore de projet).

- [ ] **Step 3: Pass the settings to the deployed build**

Dans `.github/workflows/deploy.yml`, remplacer `- run: npm run build` par :

```yaml
      - run: npm run build
        # Public values (anon key only), set in the repository variables; missing: remote board off.
        env:
          VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ vars.VITE_SUPABASE_ANON_KEY }}
```

- [ ] **Step 4: Commit**

```bash
git add supabase scripts/check-board-security.ts package.json .github/workflows/deploy.yml
git commit -m "feat: add the remote board database and its security check (#65)"
```

---

### Task 12: Documentation

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `ETAT.md`

- [ ] **Step 1: README**

Ajouter une section « Suivi à distance (tableau animateur) » : but ; `.env.local` depuis `.env.example` ; variables du dépôt GitHub (`gh variable set VITE_SUPABASE_URL`, `gh variable set VITE_SUPABASE_ANON_KEY`) ; réglage du code de soirée dans l'éditeur SQL de Supabase :

```sql
insert into public.evening_secret (id, code_hash)
values (1, extensions.crypt('LE-CODE-DE-LA-SOIREE', extensions.gen_salt('bf')))
on conflict (id) do update set code_hash = excluded.code_hash;
```

(8 caractères au moins, jamais écrit dans le dépôt) ; `BOARD_CODE=... npm run check:board` (et `-- --full` avant la soirée) ; usage le soir : code de soirée au réglage de chaque tablette, `…/quiz-halloween/?animateur` sur le téléphone, ligne « Suivi à distance » du menu animateur pour vérifier chaque tablette.

- [ ] **Step 2: CLAUDE.md**

- « Stack » : remplacer « Pas de Supabase ni de backend » par : Supabase **seulement pour le suivi à distance** (table `team_status`, pas de donnée personnelle) ; la partie reste dans le localStorage de la tablette, qui joue sans réseau.
- « Structure » : ajouter `supabase/` (migrations), `src/components/board/`, `src/game/boardSnapshot|boardClock|boardCard|boardMode|syncStatus|latestSender`, `src/hooks/useBoardSync|useBoard|useEveningCode`, `src/services/supabaseClient|board|savedEveningCode`, `scripts/check-board-security.ts`, `src/styles/board.css`.
- « Commandes » : `npm run check:board`.
- « Pièges connus », nouvelle entrée **Suivi à distance** : tables sans policy, tout par `push_team_state` / `read_board` / `reset_board` (paramètres `p_*`, mauvais code = SQLSTATE `28P01`) ; code de soirée jamais dans le dépôt ; `vite.config.ts` vide les variables Supabase en test unitaire et `playwright.config.ts` pointe sur `https://board.e2e.test` (intercepté par `page.route`) ; envois un par un (`createLatestSender`) ; la carte recalcule tout avec `gamePhase` et exige la même empreinte (sinon « Version différente ») ; un état `home` = « Pas commencé ».

- [ ] **Step 3: ETAT.md**

Cocher les étapes faites, prochaine action = mise en ligne (création du projet Supabase avec l'accord de Romain).

- [ ] **Step 4: Commit**

```bash
git add README.md CLAUDE.md ETAT.md
git commit -m "docs: document the remote animator board (#65)"
```

---

## Mise en ligne (hors tâches d'agent : chaque étape avec l'accord de Romain)

1. Créer le projet Supabase (région Paris `eu-west-3`, offre gratuite), puis `supabase link --project-ref <ref>`.
2. `supabase db push` (migration sur la base de prod).
3. Romain règle le code de soirée dans l'éditeur SQL (commande du README).
4. `.env.local` avec l'URL et la clé `anon` ; `BOARD_CODE=... npm run check:board -- --full` → « Tout est bon. ».
5. Agent `auditeur-supabase` (Opus) sur la branche ; agent `relecteur-code`.
6. `gh variable set VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
7. PR vers `main` (`Closes #65`, capture du tableau) ; merge par Romain, **jamais pendant une soirée**.
8. Essai en vrai : deux tablettes et un téléphone sur le wifi du lieu.

## Écart assumé avec la stack standard

Pas de `supabase gen types` : le front n'appelle que trois fonctions, et chaque réponse est vérifiée à l'exécution (`parseBoard`) ; des types générés n'ajouteraient rien. À signaler à Romain dans la PR.
