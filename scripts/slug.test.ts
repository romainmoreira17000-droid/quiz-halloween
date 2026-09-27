/** @file Tests for the image file name slug. */
import { toWebpName } from './slug'

describe('toWebpName', () => {
  it('drops accents, spaces and the extension', () => {
    expect(toWebpName('la table hantée.png')).toBe('table-hantee.webp')
    expect(toWebpName('les saveurs hantées.png')).toBe('saveurs-hantees.webp')
  })
  it('drops a leading French article only', () => {
    expect(toWebpName('le cimetiere.png')).toBe('cimetiere.webp')
    expect(toWebpName('sortie du restaurant.png')).toBe('sortie-du-restaurant.webp')
    expect(toWebpName('image principale.png')).toBe('image-principale.webp')
  })
  it('keeps letters and digits, collapses other characters', () => {
    expect(toWebpName("L'Épreuve  N°2 .JPG")).toBe('epreuve-n-2.webp')
  })
})
