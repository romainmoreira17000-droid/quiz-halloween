/** @file Tests for the team of the tablet. */
import { act, renderHook } from '@testing-library/react'
import { STORAGE_KEY } from '../services/savedGame'
import { TEAM_KEY } from '../services/savedTeam'
import { useTeam } from './useTeam'

const TEAMS = ['Sorcières', 'Zombies']

describe('useTeam', () => {
  it('has no team on a new tablet, then keeps the chosen one after a reload', () => {
    const first = renderHook(() => useTeam(TEAMS))
    expect(first.result.current.teamIndex).toBeNull()
    act(() => first.result.current.choose(1))
    expect(first.result.current.teamIndex).toBe(1)
    first.unmount()
    expect(renderHook(() => useTeam(TEAMS)).result.current.teamIndex).toBe(1)
  })
  it('starts the chosen team on a fresh game', () => {
    localStorage.setItem(STORAGE_KEY, '{"fingerprint":"x","state":{}}')
    const { result } = renderHook(() => useTeam(TEAMS))
    act(() => result.current.choose(0))
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
  it('forgets the team', () => {
    localStorage.setItem(TEAM_KEY, 'Zombies')
    const { result } = renderHook(() => useTeam(TEAMS))
    act(() => result.current.forget())
    expect(result.current.teamIndex).toBeNull()
    expect(localStorage.getItem(TEAM_KEY)).toBeNull()
  })
})
