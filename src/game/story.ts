/** @file Story told on the padlock screen: the final leads straight there, so its story is shown with the padlock. */
import type { QuizConfig } from '../config/types'

/**
 * Story of the final, shown under the padlock title.
 * @param config Steps of the quiz and its final, if any.
 * @returns The `recit` of the final; undefined without a final (the last step already told its story) or without a story.
 */
export function finalStory(config: Pick<QuizConfig, 'steps' | 'finalStep'>): string | undefined {
  return config.finalStep === undefined ? undefined : config.steps[config.finalStep].story
}
