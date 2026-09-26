/** @file Parses the quiz YAML text, then validates it. */
import { isPair, isScalar, parseDocument, visit, type Document } from 'yaml'
import { validateQuiz } from './validateQuiz'
import type { ValidationResult } from './types'

/** Keys whose value is typed on the keypad: their YAML source text is the value, never a number. */
const TEXT_KEYS: readonly unknown[] = ['reponse', 'code_animateur']

/**
 * Restores the exact YAML source text of every `reponse` and `code_animateur` value that `yaml`
 * read as a number. `yaml` reads an unquoted `reponse: 0472` as the number 472, silently dropping
 * the leading zero the digits keyboard needs; the source text ("0472") is what was actually typed
 * in the file, so it is what should reach the validator and the game. A leading zero is part of
 * an answer or of the animator code just the same.
 * @param doc Parsed document, mutated in place.
 */
function keepCodesAsWritten(doc: Document): void {
  visit(doc, {
    Pair(_, pair) {
      if (!isPair(pair) || !isScalar(pair.key) || !TEXT_KEYS.includes(pair.key.value)) return
      const value = pair.value
      if (isScalar(value) && typeof value.value === 'number' && value.source !== undefined) {
        value.value = value.source
      }
    },
  })
}

/**
 * Parses YAML text and validates the result.
 * @param text Content of quiz.yaml.
 * @returns The typed config, or French error messages (syntax errors included).
 */
export function parseQuizYaml(text: string): ValidationResult {
  const doc = parseDocument(text)
  // parseDocument never throws: syntax errors land in doc.errors instead.
  if (doc.errors.length > 0) {
    return { ok: false, errors: [`Le fichier YAML est illisible : ${doc.errors[0].message}`] }
  }
  keepCodesAsWritten(doc)
  return validateQuiz(doc.toJS())
}
