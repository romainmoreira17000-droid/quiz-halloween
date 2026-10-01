/**
 * @file Kind messages shown after a wrong answer or a wrong padlock code (children aged 7–10,
 * no penalty).
 */

/** Messages shown in turn, so a second wrong try visibly changes the screen. */
export const WRONG_ANSWER_MESSAGES: readonly string[] = [
  'Presque ! Cherchez encore.',
  'Les fantômes rigolent… Réessayez !',
  'Pas tout à fait. Vérifiez votre réponse !',
  'Courage, vous allez trouver !',
]

/** Messages shown in turn after a wrong padlock code. */
export const WRONG_CODE_MESSAGES: readonly string[] = [
  'Le cadenas ne bouge pas… Essayez un autre ordre !',
  'Toujours fermé ! Quel chiffre vient en premier ?',
  'Les fantômes gardent la porte… Réessayez !',
]

/** @returns The message for the n-th wrong try (≥ 1), cycling through the list. */
function cycle(messages: readonly string[], attempt: number): string {
  return messages[(attempt - 1) % messages.length]
}

/**
 * Message for the n-th wrong try on a step.
 * @param attempt Wrong tries so far on this step (≥ 1).
 * @returns A message, cycling through the list.
 */
export function wrongAnswerMessage(attempt: number): string {
  return cycle(WRONG_ANSWER_MESSAGES, attempt)
}

/**
 * Message for the n-th wrong padlock code.
 * @param attempt Wrong codes so far (≥ 1).
 * @returns A message, cycling through the list.
 */
export function wrongCodeMessage(attempt: number): string {
  return cycle(WRONG_CODE_MESSAGES, attempt)
}

/**
 * Words before the countdown on a solved challenge.
 * @param slot 0-based slot on screen.
 * @param stepCount Number of challenges (final included).
 * @param finalStep Final challenge, when the quiz has one.
 * @returns French label, followed on screen by the time left.
 */
export function waitingLabel(slot: number, stepCount: number, finalStep?: number): string {
  if (slot === stepCount - 1) return 'Le cadenas final dans'
  if (finalStep !== undefined && slot === stepCount - 2) return 'L’épreuve finale dans'
  return 'Changement d’épreuve dans'
}
