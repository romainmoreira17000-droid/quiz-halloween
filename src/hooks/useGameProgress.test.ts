/** @file Tests for the in-memory game progress hook. */
import { act, renderHook } from '@testing-library/react'
import { useGameProgress } from './useGameProgress'

const steps = [{ title: 'A', instruction: 'a', solution: 3 }]

describe('useGameProgress', () => {
  afterEach(() => vi.useRealTimers())

  it('starts with the current time and plays a step', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T14:00:00Z'))
    const { result } = renderHook(() => useGameProgress(steps))
    act(() => result.current.start())
    expect(result.current.state.startedAt).toBe(Date.parse('2026-10-31T14:00:00Z'))
    act(() => result.current.answer(3))
    act(() => result.current.next())
    expect(result.current.state.status).toBe('solved')
  })
})
