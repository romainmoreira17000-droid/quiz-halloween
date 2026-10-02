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
  it('flags a tablet that started out of step with the others', () => {
    const teams = [entry('Sorcières', playing()), entry('Zombies', playing({ startedAt: 3 * MIN }))]
    const { cards, reference } = boardCards(config, FP, snap(teams), 5 * MIN)
    expect(reference).toBe(0)
    expect(cards.map((c) => c.offsetMinutes)).toEqual([null, 3])
  })
})
