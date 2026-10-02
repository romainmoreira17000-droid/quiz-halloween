/** @file Tests for keeping the animator's screen on. */
import { renderHook, waitFor } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

const setWakeLock = (request: () => Promise<unknown>) =>
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
afterEach(() => { Reflect.deleteProperty(navigator, 'wakeLock') })

describe('useWakeLock', () => {
  it('asks nothing until wanted', () => {
    const request = vi.fn(() => Promise.resolve({ release: vi.fn(() => Promise.resolve()) }))
    setWakeLock(request)
    expect(renderHook(() => useWakeLock(false)).result.current).toBe('off')
    expect(request).not.toHaveBeenCalled()
  })
  it('keeps the screen on, and lets it go when unmounted', async () => {
    const release = vi.fn(() => Promise.resolve())
    setWakeLock(vi.fn(() => Promise.resolve({ release })))
    const { result, unmount } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(result.current).toBe('on'))
    unmount()
    expect(release).toHaveBeenCalled()
  })
  it('says « unavailable » without the API or when it is refused', async () => {
    expect(renderHook(() => useWakeLock(true)).result.current).toBe('unavailable')
    setWakeLock(() => Promise.reject(new Error('battery saver')))
    const { result } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(result.current).toBe('unavailable'))
  })
})
