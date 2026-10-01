/** @file Tests for reading the answer of read_board. */
import { parseBoard } from './boardSnapshot'

describe('parseBoard', () => {
  it('reads the server time and the teams', () => {
    const data = { server_now: 5000, teams: [{ team: 'Zombies', fingerprint: 'abcd1234', state: { status: 'home' }, updated_at: 4000 }] }
    expect(parseBoard(data, 9000)).toEqual({
      serverNow: 5000, receivedAt: 9000,
      teams: [{ team: 'Zombies', fingerprint: 'abcd1234', state: { status: 'home' }, updatedAt: 4000 }],
    })
  })
  it('skips a malformed row but keeps the others', () => {
    const data = { server_now: 5000, teams: [null, { team: 3 }, { team: 'Momies', fingerprint: 'x', state: null, updated_at: 1 }] }
    expect(parseBoard(data, 0)?.teams.map((t) => t.team)).toEqual(['Momies'])
  })
  it('refuses an answer without server time or team list', () => {
    expect(parseBoard(null, 0)).toBeNull()
    expect(parseBoard({ teams: [] }, 0)).toBeNull()
    expect(parseBoard({ server_now: 1, teams: 'no' }, 0)).toBeNull()
  })
})
