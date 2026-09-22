/** @file Tests for the saved game in localStorage. */
import type { GameState } from '../game/progress'
import { clearGame, loadGame, saveGame, STORAGE_KEY } from './savedGame'

const state: GameState = {
  status: 'playing', stepIndex: 0, foundDigits: [4], startedAt: 1000, finishedAt: null, wrongAttempts: 0,
}

describe('saved game', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reads back what was saved for the same quiz', () => {
    saveGame('abcd1234', state)
    expect(loadGame('abcd1234', 2)).toEqual(state)
  })
  it('ignores a game saved for another quiz', () => {
    saveGame('abcd1234', state)
    expect(loadGame('ffff0000', 2)).toBeNull()
  })
  it('returns null when nothing is saved, or after clearing', () => {
    expect(loadGame('abcd1234', 2)).toBeNull()
    saveGame('abcd1234', state)
    clearGame()
    expect(loadGame('abcd1234', 2)).toBeNull()
  })
  it('ignores a damaged save', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadGame('abcd1234', 2)).toBeNull()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint: 'abcd1234', state: { status: 'won' } }))
    expect(loadGame('abcd1234', 2)).toBeNull()
  })
  it('never throws when the browser refuses storage', () => {
    const refuse = () => { throw new Error('denied') }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(refuse)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(refuse)
    expect(loadGame('abcd1234', 2)).toBeNull()
    expect(() => saveGame('abcd1234', state)).not.toThrow()
    expect(() => clearGame()).not.toThrow()
  })
})
