/** @file Checks that every image referenced by the quiz exists (used by the Node CLI). */
import type { QuizConfig } from './types'

/**
 * Lists the images (step images and backdrops) missing from the images folder.
 * @param config Validated quiz.
 * @param existing File names present in public/images/.
 * @returns One French message per missing image, prefixed by where it is referenced.
 */
export function findMissingImages(config: QuizConfig, existing: ReadonlySet<string>): string[] {
  const references: [string, string | undefined][] = [
    ['fond_accueil : ', config.homeBackdrop],
    ...config.steps.flatMap((step, i): [string, string | undefined][] =>
      [[`étape ${i + 1} : `, step.image], [`étape ${i + 1} : `, step.backdrop]]),
    ['cadenas : ', config.padlock.backdrop],
  ]
  return references.flatMap(([prefix, file]) =>
    file && !existing.has(file) ? [`${prefix}l'image « ${file} » est introuvable dans public/images/.`] : [])
}
