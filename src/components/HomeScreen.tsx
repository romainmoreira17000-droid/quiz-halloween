/** @file Home screen: candle, title, intro and the "Commencer" button that leaves home (the clock
 * starts at the entrance answer when there is one, otherwise right away). */

/** Props of HomeScreen. */
export interface HomeScreenProps {
  title: string
  intro?: string
  durationMinutes: number
  onStart(): void
}

/**
 * First screen shown to the group.
 * @param props See HomeScreenProps.
 * @returns The home screen.
 */
export function HomeScreen({ title, intro, durationMinutes, onStart }: HomeScreenProps) {
  return (
    <main className="screen home">
      <div className="candle" aria-hidden="true"><span className="flame" /><span className="wick" /><span className="wax" /></div>
      <h1>{title}</h1>
      {intro && <p className="intro">{intro}</p>}
      <button type="button" className="seal-button" onClick={onStart}>Commencer</button>
      <p className="duration">Vous avez {durationMinutes} minute{durationMinutes > 1 ? 's' : ''}.</p>
    </main>
  )
}
