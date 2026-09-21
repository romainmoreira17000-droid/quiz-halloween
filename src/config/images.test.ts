/** @file Tests for the image existence check. */
import { findMissingImages } from './images'
import type { QuizConfig } from './types'

const config: QuizConfig = {
  title: 'T', durationMinutes: 10, stepCount: 2, padlock: { order: [1, 2] },
  steps: [
    { title: 'A', instruction: 'a', solution: 1, image: 'crypte.png' },
    { title: 'B', instruction: 'b', solution: 2, image: 'absent.png' },
  ],
}

describe('findMissingImages', () => {
  it('reports only images that are not in the folder', () => {
    expect(findMissingImages(config, new Set(['crypte.png'])))
      .toEqual(["étape 2 : l'image « absent.png » est introuvable dans public/images/."])
  })
})
