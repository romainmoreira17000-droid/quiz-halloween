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
  // Only the interval is faked: React's async act hangs under full fake timers.
  beforeEach(() => { vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }); hidden = false })
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
  it('never starts a read while one is still in flight', async () => {
    let finish: (value: { result: 'ok'; snapshot: BoardSnapshot }) => void = () => {}
    const read = vi.fn(() => new Promise<{ result: 'ok'; snapshot: BoardSnapshot }>((resolve) => { finish = resolve }))
    const api: BoardApi = { enabled: true, push: vi.fn(), read, reset: vi.fn() }
    const { result } = renderHook(() => useBoard('CODE-123', api))
    await act(async () => { vi.advanceTimersByTime(3 * POLL_MS) })
    expect(read).toHaveBeenCalledTimes(1)
    await act(async () => { finish({ result: 'ok', snapshot }) })
    expect(result.current.last).toBe('ok')
    await act(async () => { vi.advanceTimersByTime(POLL_MS) })
    expect(read).toHaveBeenCalledTimes(2)
  })
  it('ignores a late answer after unmount', async () => {
    let finish: (value: { result: 'ok'; snapshot: BoardSnapshot }) => void = () => {}
    const read = vi.fn(() => new Promise<{ result: 'ok'; snapshot: BoardSnapshot }>((resolve) => { finish = resolve }))
    const api: BoardApi = { enabled: true, push: vi.fn(), read, reset: vi.fn() }
    const { result, unmount } = renderHook(() => useBoard('CODE-123', api))
    unmount()
    await act(async () => { finish({ result: 'ok', snapshot }) })
    expect(result.current.last).toBeNull()
  })
})
