/** @file Tests for the game progress hook, saved in localStorage. */
import { act, renderHook } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { STORAGE_KEY } from '../services/savedGame'
import { useGameProgress } from './useGameProgress'

const config: QuizConfig = {
  title: 'T', durationMinutes: 90, stepCount: 1,
  steps: [{ title: 'A', instruction: 'a', answer: { kind: 'digits', value: '3' }, digit: 3 }], padlock: { order: [1] },
}

describe('useGameProgress', () => {
  afterEach(() => vi.useRealTimers())

  it('starts with the current time, plays a step and opens the padlock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T14:00:00Z'))
    const { result } = renderHook(() => useGameProgress(config))
    act(() => result.current.start())
    expect(result.current.state.startedAt).toBe(Date.parse('2026-10-31T14:00:00Z'))
    act(() => result.current.answer('3'))
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

  it('resumes the saved game after a reload', () => {
    const first = renderHook(() => useGameProgress(config))
    act(() => first.result.current.start())
    act(() => first.result.current.answer('3'))
    const saved = first.result.current.state
    first.unmount()
    const { result } = renderHook(() => useGameProgress(config))
    expect(result.current.state).toEqual(saved)
  })

  it('does not resume a game saved for another quiz', () => {
    const first = renderHook(() => useGameProgress(config))
    act(() => first.result.current.start())
    first.unmount()
    const changed = { ...config, steps: [{ ...config.steps[0], digit: 7 }] }
    const { result } = renderHook(() => useGameProgress(changed))
    expect(result.current.state.status).toBe('home')
  })

  it('goes back home and deletes the save on reset', () => {
    const { result } = renderHook(() => useGameProgress(config))
    act(() => result.current.start())
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    act(() => result.current.reset())
    expect(result.current.state.status).toBe('home')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
