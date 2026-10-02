/** @file Every solution of the evening, folded at the bottom of the board (children may look at the phone). */
import type { QuizConfig } from '../../config/types'
import { padlockCode } from '../../game/padlock'

/**
 * @param props.config Validated quiz.
 * @returns A folded panel: each challenge (answer, digit, hints), the padlock code, the animator code.
 */
export function SolutionsPanel({ config }: { config: QuizConfig }) {
  return (
    <details className="board-solutions">
      <summary>Solutions (à ne pas montrer aux enfants)</summary>
      <ol>
        {config.steps.map((step, i) => (
          <li key={i}>
            <h3>{step.title}{i === config.finalStep ? ' (finale)' : ''}</h3>
            <p>Réponse : <b>{step.answer.value}</b> · Chiffre : <b>{step.digit}</b></p>
            {step.hints && <ol className="board-solutions-hints">{step.hints.map((hint, j) => <li key={j}>{hint}</li>)}</ol>}
          </li>
        ))}
      </ol>
      <p>Code du cadenas : <b>{padlockCode(config.steps, config.padlock.order).join(' ')}</b></p>
      <p>Code animateur : <b>{config.animatorCode}</b></p>
    </details>
  )
}
