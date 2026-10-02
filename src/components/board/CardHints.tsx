/** @file Hints a team has already read, folded under their count. */

/**
 * @param props.shown Hints available to the team.
 * @param props.total Hints of the challenge.
 * @param props.texts The `shown` first hints.
 * @returns The count, unfolding into the texts.
 */
export function CardHints({ shown, total, texts }: { shown: number; total: number; texts: readonly string[] }) {
  const label = `Indices vus ${shown}/${total}`
  if (texts.length === 0) return <p className="card-hints">{label}</p>
  return (
    <details className="card-hints">
      <summary>{label}</summary>
      <ol>{texts.map((text, i) => <li key={i}>{text}</li>)}</ol>
    </details>
  )
}
