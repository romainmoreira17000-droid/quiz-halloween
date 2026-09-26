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
