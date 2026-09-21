/** @file Screen shown when quiz.yaml is invalid (only reachable in dev: builds are blocked). */

/** Props of ConfigErrorScreen. */
export interface ConfigErrorScreenProps { errors: string[] }

/**
 * Lists every configuration error so the animator can fix quiz.yaml.
 * @param props.errors French messages from the validator.
 * @returns The error screen.
 */
export function ConfigErrorScreen({ errors }: ConfigErrorScreenProps) {
  return (
    <main>
      <h1>Le quiz est mal configuré</h1>
      <p>Corrige ces points dans quiz.yaml :</p>
      {/* Index keys: the list is static and may contain identical messages. */}
      <ul>{errors.map((message, i) => <li key={i}>{message}</li>)}</ul>
    </main>
  )
}
