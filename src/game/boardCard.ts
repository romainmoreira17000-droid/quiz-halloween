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
