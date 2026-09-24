/** @file CLI: validates quiz.yaml and its images. Exit code 1 on error (blocks the build). */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { parseQuizYaml } from '../src/config/parseQuiz'
import { findMissingImages } from '../src/config/images'

const result = parseQuizYaml(readFileSync('quiz.yaml', 'utf8'))
const images = existsSync('public/images') ? new Set(readdirSync('public/images')) : new Set<string>()
const errors = result.ok ? findMissingImages(result.config, images) : result.errors

if (errors.length > 0) {
  console.error(`❌ quiz.yaml contient ${errors.length} erreur(s) :`)
  errors.forEach((message) => console.error(`  - ${message}`))
  process.exit(1)
}
if (result.ok) {
  const { stepCount, teams, slotMinutes } = result.config
  console.log(`✅ quiz.yaml est valide (${stepCount} étapes, ${teams.length} équipes, ${slotMinutes} min par épreuve).`)
}
