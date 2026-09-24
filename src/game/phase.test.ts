/** @file Tests for the screen decided by the clock. */
import { gamePhase, type PhaseInput } from './phase'

const MIN = 60_000
const rules = { stepCount: 3, slotMinutes: 15 }
const none = [null, null, null]
const playing = (digits: (number | null)[]): PhaseInput => ({ status: 'playing', startedAt: 0, digits })
// Team 1 of 3 plays challenges 1, 2, then 0 (0-based).
const at = (digits: (number | null)[], minutes: number) => gamePhase(playing(digits), rules, 1, minutes * MIN)

describe('gamePhase', () => {
  it.each(['home', 'entrance', 'won'] as const)('passes the %s status through', (status) => {
    expect(gamePhase({ status, startedAt: status === 'won' ? 0 : null, digits: none }, rules, 1, 0)).toEqual({ kind: status })
  })
  it('starts on the team’s own challenge', () => {
    expect(at(none, 0)).toEqual({ kind: 'challenge', slot: 0, challenge: 1 })
  })
  it('waits for the next room once the digit is found', () => {
    expect(at([null, 5, null], 14)).toEqual({ kind: 'waiting', slot: 0, challenge: 1 })
  })
  it('moves to the next challenge when the slot ends', () => {
    expect(at([null, 5, null], 15)).toEqual({ kind: 'challenge', slot: 1, challenge: 2 })
  })
  it('asks for an animator when a slot ended without its digit', () => {
    expect(at(none, 15)).toEqual({ kind: 'timeUp', challenge: 1 })
  })
  it('asks for the earliest missed challenge first, even several slots later', () => {
    expect(at(none, 44)).toEqual({ kind: 'timeUp', challenge: 1 })
    expect(at([null, 5, null], 44)).toEqual({ kind: 'timeUp', challenge: 2 })
  })
  it('goes to the padlock after the last slot', () => {
    expect(at([7, 5, 3], 45)).toEqual({ kind: 'padlock' })
  })
  it('asks for an animator before the padlock if the last challenge was missed', () => {
    expect(at([null, 5, 3], 45)).toEqual({ kind: 'timeUp', challenge: 0 })
  })
  it('treats a time before the start as the start', () => {
    expect(gamePhase(playing(none), rules, 1, -5000)).toEqual({ kind: 'challenge', slot: 0, challenge: 1 })
  })
})
