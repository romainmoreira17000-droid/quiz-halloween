/** @file Loads quiz.yaml into the bundle at build time and validates it. */
import quizText from '../../quiz.yaml?raw'
import { parseQuizYaml } from './parseQuiz'
import type { ValidationResult } from './types'

/** Validation result of the bundled quiz.yaml. */
export const quizResult: ValidationResult = parseQuizYaml(quizText)
