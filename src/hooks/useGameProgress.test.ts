/** @file Tests for the game progress hook, saved in localStorage. */
import { act, renderHook } from '@testing-library/react'
import type { QuizConfig } from '../config/types'
import { quizFingerprint } from '../game/fingerprint'
import { STORAGE_KEY } from '../services/savedGame'
import { useGameProgress } from './useGameProgress'

const MIN = 60_000
const START = Date.parse('2026-10-31T20:15:00+01:00')
const config: QuizConfig = {
  title: 'T', teams: ['Sorcières', 'Zombies'], slotMinutes: 15, hintAfterMinutes: 10, blockSeconds: 0, animatorCode: '2710', stepCount: 2,
  steps: [
    { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '3' }, digit: 3 },
    { title: 'B', instruction: 'b', answer: { kind: 'digits', value: '8' }, digit: 8 },
  ],
  padlock: { order: [2, 1] },
}
/** Sets the clock `minutes` after « Commencer ». */
const at = (minutes: number) => vi.setSystemTime(START + minutes * MIN)
// The Zombies (team 1) play B (challenge 1), then A (challenge 0).
const zombies = () => renderHook(() => useGameProgress(config, 1))

describe('useGameProgress', () => {
  beforeEach(() => { vi.useFakeTimers(); at(0) })
  afterEach(() => vi.useRealTimers())

  it('tells whether an answer earns the digit of the challenge on screen', () => {
    const { result } = zombies()
    let right = true
    act(() => { right = result.current.answer(1, '8') })
    expect(right).toBe(false) // still on the home screen
    act(() => result.current.start())
    act(() => { right = result.current.answer(0, '3') })
    expect(right).toBe(false) // not this team's challenge now
    act(() => { right = result.current.answer(1, '9') })
    expect(right).toBe(false)
    act(() => { right = result.current.answer(1, '8') })
    expect(right).toBe(true)
    expect(result.current.state.digits).toEqual([null, 8])
    act(() => { right = result.current.answer(1, '8') })
    expect(right).toBe(false)
  })
  it('plays the rotation up to the victory', () => {
    const { result } = zombies()
    act(() => result.current.start())
    expect(result.current.state.startedAt).toBe(START)
    act(() => { result.current.answer(1, '8') })
    at(15)
    act(() => { result.current.answer(0, '3') })
    let opened = true
    at(29)
    act(() => { opened = result.current.unlock([8, 3]) })
    expect(opened).toBe(false) // the padlock comes after the last slot
    at(30)
    act(() => { opened = result.current.unlock([3, 8]) })
    expect(opened).toBe(false)
    act(() => { opened = result.current.unlock([8, 3]) })
    expect(opened).toBe(true)
    expect(result.current.state).toMatchObject({ status: 'won', finishedAt: START + 30 * MIN })
  })
  it('gives the digit of a missed challenge once the animator code is typed', () => {
    const { result } = zombies()
    act(() => result.current.start())
    at(15)
    act(() => result.current.giveDigit(1, '2710'))
    expect(result.current.state.digits).toEqual([null, 8])
  })
  it('resumes the saved game after a reload, even several slots later', () => {
    const first = zombies()
    act(() => first.result.current.start())
    act(() => { first.result.current.answer(1, '8') })
    const saved = first.result.current.state
    first.unmount()
    at(40)
    expect(zombies().result.current.state).toEqual(saved)
  })
  it('does not resume a game saved for another quiz', () => {
    const first = zombies()
    act(() => first.result.current.start())
    first.unmount()
    const changed = { ...config, steps: [{ ...config.steps[0], digit: 7 }, config.steps[1]] }
    expect(renderHook(() => useGameProgress(changed, 1)).result.current.state.status).toBe('home')
  })
  it('goes back home and deletes the save on reset', () => {
    const { result } = zombies()
    act(() => result.current.start())
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    act(() => result.current.reset())
    expect(result.current.state.status).toBe('home')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
  it('starts the clock only once the entrance is solved', () => {
    const withEntrance: QuizConfig = { ...config, entrance: { message: 'm', answer: { kind: 'letters', value: 'Bouh' } } }
    const { result } = renderHook(() => useGameProgress(withEntrance, 1))
    act(() => result.current.start())
    expect(result.current.state).toMatchObject({ status: 'entrance', startedAt: null })
    at(5)
    act(() => result.current.enter('bouh'))
    expect(result.current.state).toMatchObject({ status: 'playing', startedAt: START + 5 * MIN })
  })
  it('ignores a stuck entrance save when the quiz no longer has an entrance', () => {
    const stuck = { status: 'entrance', digits: [null, null], startedAt: null, finishedAt: null, wrongAttempts: 0, wrongSlot: null }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint: quizFingerprint(config), state: stuck }))
    const { result } = zombies()
    expect(result.current.state.status).toBe('home')
    act(() => result.current.start())
    expect(result.current.state.status).toBe('playing')
  })
})
