/** @file Tests for the image existence check. */
import { findMissingImages } from './images'
import type { QuizConfig } from './types'

const config: QuizConfig = {
  title: 'T', teams: ['Sorcières', 'Zombies'], slotMinutes: 10, animatorCode: '2710', stepCount: 2, padlock: { order: [1, 2] },
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
  it('returns nothing when every image is present', () => {
    expect(findMissingImages(config, new Set(['crypte.png', 'absent.png']))).toEqual([])
  })
})
