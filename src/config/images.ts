/** @file Checks that every image referenced by the quiz exists (used by the Node CLI). */
import type { QuizConfig } from './types'

/**
 * Lists the step images missing from the images folder.
 * @param config Validated quiz.
 * @param existing File names present in public/images/.
 * @returns One French message per missing image.
 */
export function findMissingImages(config: QuizConfig, existing: ReadonlySet<string>): string[] {
  return config.steps.flatMap((step, i) =>
    step.image && !existing.has(step.image)
      ? [`étape ${i + 1} : l'image « ${step.image} » est introuvable dans public/images/.`]
      : [])
}
