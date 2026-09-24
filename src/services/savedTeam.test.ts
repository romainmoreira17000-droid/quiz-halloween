/** @file Tests for the team saved on the tablet. */
import { clearTeam, loadTeam, saveTeam, TEAM_KEY } from './savedTeam'

const TEAMS = ['Sorcières', 'Zombies']

describe('saved team', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reads back the saved team', () => {
    saveTeam('Zombies')
    expect(loadTeam(TEAMS)).toBe(1)
  })
  it('has no team at first, or after clearing', () => {
    expect(loadTeam(TEAMS)).toBeNull()
    saveTeam('Zombies')
    clearTeam()
    expect(loadTeam(TEAMS)).toBeNull()
  })
  it('forgets a team that quiz.yaml no longer has', () => {
    localStorage.setItem(TEAM_KEY, 'Vampires')
    expect(loadTeam(TEAMS)).toBeNull()
  })
  it('never throws when the browser refuses storage', () => {
    const refuse = () => { throw new Error('denied') }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(refuse)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(refuse)
    expect(loadTeam(TEAMS)).toBeNull()
    expect(() => saveTeam('Zombies')).not.toThrow()
    expect(() => clearTeam()).not.toThrow()
  })
})
