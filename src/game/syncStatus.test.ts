/** @file Tests for the remote follow-up status of a tablet. */
import { afterPush, syncStatusLabel } from './syncStatus'

describe('afterPush', () => {
  it('follows the last result, and keeps the start of a run of failures', () => {
    expect(afterPush({ kind: 'pending' }, 'ok', 5)).toEqual({ kind: 'connected' })
    expect(afterPush({ kind: 'connected' }, 'refused', 5)).toEqual({ kind: 'refused' })
    expect(afterPush({ kind: 'connected' }, 'failed', 5)).toEqual({ kind: 'failing', since: 5 })
    expect(afterPush({ kind: 'failing', since: 5 }, 'failed', 90)).toEqual({ kind: 'failing', since: 5 })
  })
})

describe('syncStatusLabel', () => {
  it('says it in French for the animator menu', () => {
    expect(syncStatusLabel({ kind: 'off' }, 0)).toBe('désactivé')
    expect(syncStatusLabel({ kind: 'pending' }, 0)).toBe('connexion…')
    expect(syncStatusLabel({ kind: 'connected' }, 0)).toBe('connecté')
    expect(syncStatusLabel({ kind: 'refused' }, 0)).toBe('code de soirée refusé')
    expect(syncStatusLabel({ kind: 'failing', since: 0 }, 59_000)).toBe('hors ligne')
    expect(syncStatusLabel({ kind: 'failing', since: 0 }, 125_000)).toBe('hors ligne depuis 2 min')
  })
})
