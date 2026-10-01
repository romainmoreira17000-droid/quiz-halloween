/** @file Tests for keeping the final challenge on screen during its « Bravo ! ». */
import { act, renderHook } from '@testing-library/react'
import type { GamePhase } from '../game/phase'
import { CELEBRATION_DELAY_MS, CELEBRATION_MS } from './useCelebration'
import { useFinaleHold } from './useFinaleHold'

const final: GamePhase = { kind: 'challenge', slot: 5, challenge: 5 }
const padlock: GamePhase = { kind: 'padlock' }
interface Props { phase: GamePhase; inFinalSlot: boolean }
const hook = (phase: GamePhase, finalStep: number | undefined) =>
  renderHook((p: Props) => useFinaleHold(p.phase, finalStep, p.inFinalSlot), { initialProps: { phase, inFinalSlot: true } })

describe('useFinaleHold', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('holds the final when it gets solved, then lets the padlock show', () => {
    const { result, rerender } = hook(final, 5)
    rerender({ phase: padlock, inFinalSlot: true })
    expect(result.current.held).toBe(true)
    act(() => vi.advanceTimersByTime(CELEBRATION_DELAY_MS + CELEBRATION_MS - 1))
    expect(result.current.held).toBe(true)
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.held).toBe(false)
  })
  it('lets go early on release', () => {
    const { result, rerender } = hook(final, 5)
    rerender({ phase: padlock, inFinalSlot: true })
    act(() => result.current.release())
    expect(result.current.held).toBe(false)
  })
  it('does not hold after a skip past the last slot', () => {
    const { result, rerender } = hook(final, 5)
    rerender({ phase: padlock, inFinalSlot: false })
    expect(result.current.held).toBe(false)
  })
  it('does not hold when the padlock is already there on load', () => {
    expect(hook(padlock, 5).result.current.held).toBe(false)
  })
  it('does not hold after a rotating challenge', () => {
    const { result, rerender } = hook({ kind: 'challenge', slot: 4, challenge: 2 }, 5)
    rerender({ phase: padlock, inFinalSlot: true })
    expect(result.current.held).toBe(false)
  })
  it('does not hold without a final', () => {
    const { result, rerender } = hook(final, undefined)
    rerender({ phase: padlock, inFinalSlot: true })
    expect(result.current.held).toBe(false)
  })
})
