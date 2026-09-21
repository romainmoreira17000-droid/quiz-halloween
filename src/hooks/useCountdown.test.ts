/** @file Tests for the countdown hook (fake clock). */
import { act, renderHook } from '@testing-library/react'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  let start: number
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T14:00:00Z'))
    start = Date.now()
  })
  afterEach(() => vi.useRealTimers())

  it('shows the full duration before the game starts', () => {
    const { result } = renderHook(() => useCountdown(null, 90))
    expect(result.current).toBe(5400)
  })
  it('counts down from the start time', () => {
    const { result } = renderHook(() => useCountdown(start, 90))
    expect(result.current).toBe(5400)
    act(() => { vi.advanceTimersByTime(61_000) })
    expect(result.current).toBe(5339)
  })
  it('keeps counting below zero', () => {
    const { result } = renderHook(() => useCountdown(start, 1))
    act(() => { vi.advanceTimersByTime(125_000) })
    expect(result.current).toBe(-65)
  })
  it('stays right after the tablet slept (clock jumps, timers did not run)', () => {
    const { result } = renderHook(() => useCountdown(start, 90))
    vi.setSystemTime(start + 30 * 60_000)
    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current).toBe(3600)
  })
})
