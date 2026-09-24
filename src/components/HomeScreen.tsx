/** @file Home screen: team of the tablet, title, intro and the « Commencer » button every team taps together at the signal. */

/** Props of HomeScreen. */
export interface HomeScreenProps {
  title: string
  intro?: string
  /** Team playing on this tablet. */
  teamName: string
  challengeCount: number
  slotMinutes: number
  onStart(): void
}

/** @returns For example "6 épreuves" or "1 minute". */
const count = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

/**
 * First screen shown to the group.
 * @param props See HomeScreenProps.
 * @returns The home screen.
 */
export function HomeScreen({ title, intro, teamName, challengeCount, slotMinutes, onStart }: HomeScreenProps) {
  return (
    <main className="screen home">
      <div className="candle" aria-hidden="true"><span className="flame" /><span className="wick" /><span className="wax" /></div>
      <p className="team-name">Équipe des {teamName}</p>
      <h1>{title}</h1>
      {intro && <p className="intro">{intro}</p>}
      <button type="button" className="seal-button" onClick={onStart}>Commencer</button>
      <p className="duration">{count(challengeCount, 'épreuve')} de {count(slotMinutes, 'minute')}.</p>
    </main>
  )
}
