/** @file Short fingerprint of a quiz, so a saved game is only resumed on the quiz it was played on. */
import type { QuizConfig } from '../config/types'

/**
 * Hashes the validated config (FNV-1a, 32 bits). Built from the config, not the YAML text,
 * so editing a comment in quiz.yaml does not throw away a game in progress.
 * @param config Validated quiz.
 * @returns 8 lowercase hexadecimal characters.
 */
export function quizFingerprint(config: QuizConfig): string {
  const text = JSON.stringify(config)
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
