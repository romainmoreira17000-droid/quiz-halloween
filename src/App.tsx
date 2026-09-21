/** @file Root component: shows the game, or the config errors if quiz.yaml is invalid. */
import { ConfigErrorScreen } from './components/ConfigErrorScreen'
import { quizResult } from './config/loadQuiz'
import type { ValidationResult } from './config/types'

/** Props of App (injectable for tests). */
export interface AppProps { quiz?: ValidationResult }

/**
 * Root of the application.
 * @param props.quiz Validation result; defaults to the bundled quiz.yaml.
 * @returns The current screen.
 */
export default function App({ quiz = quizResult }: AppProps) {
  if (!quiz.ok) return <ConfigErrorScreen errors={quiz.errors} />
  return (
    <main>
      <h1>{quiz.config.title}</h1>
    </main>
  )
}
