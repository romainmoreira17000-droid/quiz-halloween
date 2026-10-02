/** @file Shown at each new slot before the challenge: tells the group which room to go to, the riddle comes once there. */
import type { ReactNode } from 'react'

/** Props of TravelScreen. */
export interface TravelScreenProps {
  /** In-game header (clocks and candles): the slot clock keeps running on the way. */
  header: ReactNode
  /** Title of the challenge of the new slot, which names its room. */
  title: string
  /** Called on « Nous sommes arrivés ». */
  onArrive(): void
}

/**
 * « Maintenant, dirigez-vous vers : … ». The instruction stays hidden so the children do not read it while walking.
 * @param props See TravelScreenProps.
 * @returns The screen.
 */
export function TravelScreen({ header, title, onArrive }: TravelScreenProps) {
  return (
    <main className="screen travel">
      {header}
      <section className="parchment travel-card">
        <p className="travel-lead">Maintenant, dirigez-vous vers :</p>
        <h2>{title}</h2>
      </section>
      <button type="button" className="seal-button" onClick={onArrive}>Nous sommes arrivés</button>
    </main>
  )
}
