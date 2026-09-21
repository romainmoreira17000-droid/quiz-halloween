/** @file Tests for the in-memory game progress hook. */
import { act, renderHook } from '@testing-library/react'
import { useGameProgress } from './useGameProgress'

const steps = [{ title: 'A', instruction: 'a', solution: 3 }]

describe('useGameProgress', () => {
  afterEach(() => vi.useRealTimers())

  it('starts with the current time, plays a step and opens the padlock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T14:00:00Z'))
    const { result } = renderHook(() => useGameProgress(steps, [1]))
    act(() => result.current.start())
    expect(result.current.state.startedAt).toBe(Date.parse('2026-10-31T14:00:00Z'))
    act(() => result.current.answer(3))
    act(() => result.current.next())
    expect(result.current.state.status).toBe('padlock')
    let opened = true
    act(() => { opened = result.current.unlock([1]) })
    expect(opened).toBe(false)
    vi.setSystemTime(new Date('2026-10-31T14:42:15Z'))
    act(() => { opened = result.current.unlock([3]) })
    expect(opened).toBe(true)
    expect(result.current.state).toMatchObject({ status: 'won', finishedAt: Date.parse('2026-10-31T14:42:15Z') })
  })
})
