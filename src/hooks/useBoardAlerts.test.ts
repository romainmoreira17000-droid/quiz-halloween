/** @file Tests for the alert banner of the animator board. */
import { act, renderHook } from '@testing-library/react'
import type { TeamCardView } from '../game/boardCard'
import { useBoardAlerts } from './useBoardAlerts'

const card = (over: Partial<TeamCardView>): TeamCardView => ({
  team: 'Zombies', status: 'challenge', challengeTitle: 'Le cimetière', slotSecondsLeft: 300, found: [], track: [],
  solution: null, hintTexts: [], blockedSeconds: 0, wrongAttempts: 0, hints: null, offsetMinutes: null, finishedAt: null,
  silentSeconds: 3, freshness: 'fresh', ...over,
})
interface Props { cards: TeamCardView[]; ready: boolean; online?: boolean }
const setup = (first: TeamCardView[], ready = true) => {
  const onNew = vi.fn()
  const initialProps: Props = { cards: first, ready }
  const hook = renderHook(({ cards, ready, online = true }: Props) => useBoardAlerts(cards, { ready, online, onNew }), { initialProps })
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
  it('rings nothing while the board is stale (phone back from sleep): its clocks run on old news', () => {
    const { result, rerender, onNew } = setup([card({})])
    rerender({ cards: [card({ status: 'timeUp' })], ready: true, online: false })
    expect(onNew).not.toHaveBeenCalled()
    rerender({ cards: [card({ status: 'waiting' })], ready: true, online: true })
    expect(onNew).not.toHaveBeenCalled()
    expect(result.current.pending).toEqual([])
  })
  it('does not ring a silent tablet again after a short loss of the board', () => {
    const silent = card({ freshness: 'silent', silentSeconds: 130 })
    const { result, rerender, onNew } = setup([card({})])
    rerender({ cards: [silent], ready: true })
    act(() => result.current.dismiss(result.current.pending[0].key))
    rerender({ cards: [silent], ready: true, online: false })
    rerender({ cards: [silent], ready: true, online: true })
    expect(onNew).toHaveBeenCalledOnce()
    expect(result.current.pending).toEqual([])
  })
  it('drops a need from the banner once it is over', () => {
    const { result, rerender } = setup([card({})])
    rerender({ cards: [card({ status: 'timeUp' })], ready: true })
    rerender({ cards: [card({ status: 'waiting' })], ready: true })
    expect(result.current.pending).toEqual([])
    expect(result.current.alertTeams.size).toBe(0)
  })
})
