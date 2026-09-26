/** @file Tests for the image existence check. */
import { findMissingImages } from './images'
import type { QuizConfig } from './types'

const config: QuizConfig = {
  title: 'T', teams: ['Sorcières', 'Zombies'], slotMinutes: 10, hintAfterMinutes: 5, blockSeconds: 0, animatorCode: '2710', stepCount: 2, padlock: { order: [1, 2] },
  steps: [
    { title: 'A', instruction: 'a', answer: { kind: 'digits', value: '1' }, digit: 1, image: 'crypte.png' },
    { title: 'B', instruction: 'b', answer: { kind: 'digits', value: '2' }, digit: 2, image: 'absent.png' },
  ],
}

describe('findMissingImages', () => {
  it('reports only images that are not in the folder', () => {
    expect(findMissingImages(config, new Set(['crypte.png'])))
      .toEqual(["étape 2 : l'image « absent.png » est introuvable dans public/images/."])
  })
  it('also checks the home, step and padlock backdrops', () => {
    const withBackdrops: QuizConfig = {
      ...config, homeBackdrop: 'accueil.webp', padlock: { order: [1, 2], backdrop: 'sortie.webp' },
      steps: [{ ...config.steps[0], image: undefined, backdrop: 'salle.webp' }, { ...config.steps[1], image: undefined }],
    }
    expect(findMissingImages(withBackdrops, new Set())).toEqual([
      "fond_accueil : l'image « accueil.webp » est introuvable dans public/images/.",
      "étape 1 : l'image « salle.webp » est introuvable dans public/images/.",
      "cadenas : l'image « sortie.webp » est introuvable dans public/images/.",
    ])
  })
  it('returns nothing when every image is present', () => {
    expect(findMissingImages(config, new Set(['crypte.png', 'absent.png']))).toEqual([])
  })
})
