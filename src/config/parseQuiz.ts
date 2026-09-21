/** @file Parses the quiz YAML text, then validates it. */
import { parse } from 'yaml'
import { validateQuiz } from './validateQuiz'
import type { ValidationResult } from './types'

/**
 * Parses YAML text and validates the result.
 * @param text Content of quiz.yaml.
 * @returns The typed config, or French error messages (syntax errors included).
 */
export function parseQuizYaml(text: string): ValidationResult {
  let raw: unknown
  try {
    raw = parse(text)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return { ok: false, errors: [`Le fichier YAML est illisible : ${detail}`] }
  }
  return validateQuiz(raw)
}
