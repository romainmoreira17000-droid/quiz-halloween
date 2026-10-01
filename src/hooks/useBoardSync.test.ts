/** @file Tests for the tablet sending its game to the remote board. */
import { act, renderHook } from '@testing-library/react'
import type { BoardApi } from '../services/board'
import { HEARTBEAT_MS, useBoardSync } from './useBoardSync'

const fakeApi = (result: 'ok' | 'refused' | 'failed' = 'ok', enabled = true) => {
  const push = vi.fn(() => Promise.resolve(result))
  const api: BoardApi = { enabled, push, read: vi.fn(), reset: vi.fn() }
  return { api, push }
}
// One object per scenario: the hook reads a new state object as a change, so one built per render would send in a loop.
const STATE = { n: 1 }
const input = (state: unknown, code: string | null = 'CODE-123') => ({ team: 'Zombies', fingerprint: 'fp', state, code })

describe('useBoardSync', () => {
  afterEach(() => vi.useRealTimers())

  it('sends nothing without an evening code, or without Supabase settings', async () => {
    const { api, push } = fakeApi()
    const { result } = renderHook(() => useBoardSync(input({ n: 1 }, null), api))
    const off = fakeApi('ok', false)
    renderHook(() => useBoardSync(input({ n: 1 }), off.api))
    await act(async () => {})
    expect(push).not.toHaveBeenCalled()
    expect(off.push).not.toHaveBeenCalled()
    expect(result.current).toEqual({ kind: 'off' })
  })
  it('sends the state at once, then at every change, but not for a mere re-render', async () => {
    const { api, push } = fakeApi()
    const first = { n: 1 }
    const { result, rerender } = renderHook(({ state }) => useBoardSync(input(state), api), { initialProps: { state: first as unknown } })
    await act(async () => {})
    expect(push).toHaveBeenLastCalledWith('CODE-123', 'Zombies', 'fp', first)
    expect(result.current).toEqual({ kind: 'connected' })
    rerender({ state: first })
    await act(async () => {})
    expect(push).toHaveBeenCalledTimes(1)
    const second = { n: 2 }
    rerender({ state: second })
    await act(async () => {})
    expect(push).toHaveBeenLastCalledWith('CODE-123', 'Zombies', 'fp', second)
  })
  it('sends again every 30 s and when the network comes back', async () => {
    // Only the heartbeat is faked: React's async act needs the real setImmediate, or it hangs.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const { api, push } = fakeApi()
    renderHook(() => useBoardSync(input(STATE), api))
    await act(async () => {})
    await act(async () => { vi.advanceTimersByTime(HEARTBEAT_MS) })
    expect(push).toHaveBeenCalledTimes(2)
    await act(async () => { window.dispatchEvent(new Event('online')) })
    expect(push).toHaveBeenCalledTimes(3)
  })
  it('reports a refused code and a failure', async () => {
    const refused = fakeApi('refused')
    const { result } = renderHook(() => useBoardSync(input(STATE), refused.api))
    await act(async () => {})
    expect(result.current).toEqual({ kind: 'refused' })
    const failed = fakeApi('failed')
    const second = renderHook(() => useBoardSync(input(STATE), failed.api))
    await act(async () => {})
    expect(second.result.current.kind).toBe('failing')
  })
})
