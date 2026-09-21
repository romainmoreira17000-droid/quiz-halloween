/** @file Kind messages shown after a wrong answer (children aged 7–10, no penalty). */

/** Messages shown in turn, so a second wrong try visibly changes the screen. */
export const WRONG_ANSWER_MESSAGES: readonly string[] = [
  'Presque ! Cherchez encore.',
  'Les fantômes rigolent… Réessayez !',
  'Pas tout à fait. Relisez bien l’énigme !',
  'Courage, vous allez trouver !',
]

/**
 * Message for the n-th wrong try on a step.
 * @param attempt Wrong tries so far on this step (≥ 1).
 * @returns A message, cycling through the list.
 */
export function wrongAnswerMessage(attempt: number): string {
  return WRONG_ANSWER_MESSAGES[(attempt - 1) % WRONG_ANSWER_MESSAGES.length]
}
