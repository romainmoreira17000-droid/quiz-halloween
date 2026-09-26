/** @file Tests for the choice of the backdrop behind each screen. */
import type { QuizConfig } from '../config/types'
import { backdropFor } from './backdrop'

const step = (backdrop?: string) => ({
  title: 'T', instruction: 'i', answer: { kind: 'digits' as const, value: '1' }, digit: 1, ...(backdrop && { backdrop }),
})
type Input = Pick<QuizConfig, 'steps' | 'padlock' | 'homeBackdrop'>
const dressed: Input = {
  homeBackdrop: 'accueil.webp', padlock: { order: [1, 2], backdrop: 'sortie.webp' }, steps: [step('galerie.webp'), step()],
}
const bare: Input = { padlock: { order: [1, 2] }, steps: [step(), step()] }
const photo = (file: string) => ({ kind: 'photo', file })

describe('backdropFor', () => {
  it('shows the home photo at home, nothing without one', () => {
    expect(backdropFor({ kind: 'home' }, dressed)).toEqual(photo('accueil.webp'))
    expect(backdropFor({ kind: 'home' }, bare)).toEqual({ kind: 'none' })
  })
  it('keeps the drawn restaurant front for the entrance', () => {
    expect(backdropFor({ kind: 'entrance' }, dressed)).toEqual({ kind: 'restaurant' })
  })
  it('shows the room of the current challenge', () => {
    expect(backdropFor({ kind: 'challenge', slot: 0, challenge: 0 }, dressed)).toEqual(photo('galerie.webp'))
  })
  it('falls back to the drawn great hall for a room without photo', () => {
    expect(backdropFor({ kind: 'challenge', slot: 0, challenge: 1 }, dressed)).toEqual({ kind: 'hall' })
  })
  it('shows the room of the missed challenge when time ran out', () => {
    expect(backdropFor({ kind: 'timeUp', challenge: 0 }, dressed)).toEqual(photo('galerie.webp'))
  })
  it('shows the home photo while the group waits for the next room', () => {
    expect(backdropFor({ kind: 'waiting', slot: 0, challenge: 0 }, dressed)).toEqual(photo('accueil.webp'))
    expect(backdropFor({ kind: 'waiting', slot: 0, challenge: 0 }, bare)).toEqual({ kind: 'hall' })
  })
  it('shows the way out on the padlock and the victory', () => {
    expect(backdropFor({ kind: 'padlock' }, dressed)).toEqual(photo('sortie.webp'))
    expect(backdropFor({ kind: 'won' }, dressed)).toEqual(photo('sortie.webp'))
    expect(backdropFor({ kind: 'won' }, bare)).toEqual({ kind: 'hall' })
  })
})
