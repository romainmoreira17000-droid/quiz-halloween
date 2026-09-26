/** @file Which backdrop goes behind each screen: the photo of the room the group is in, or a drawn decor. */
import type { QuizConfig } from '../config/types'
import type { GamePhase } from './phase'

/** Backdrop to draw: nothing, a drawn decor, or a photo from public/images/. */
export type Backdrop = { kind: 'none' } | { kind: 'restaurant' } | { kind: 'hall' } | { kind: 'photo'; file: string }

const photoOr = (file: string | undefined, fallback: Backdrop): Backdrop => (file ? { kind: 'photo', file } : fallback)

/**
 * Picks the backdrop of a screen.
 * @param phase Current screen.
 * @param config Backdrops of the quiz (home, each room, padlock).
 * @returns The photo of the place, or the drawn great hall when the quiz gives none (never a broken image).
 */
export function backdropFor(phase: GamePhase, config: Pick<QuizConfig, 'steps' | 'padlock' | 'homeBackdrop'>): Backdrop {
  const hall: Backdrop = { kind: 'hall' }
  switch (phase.kind) {
    case 'home': return photoOr(config.homeBackdrop, { kind: 'none' })
    case 'entrance': return { kind: 'restaurant' }
    // After « Temps écoulé » the group is still in the missed room, where the animator comes.
    case 'challenge':
    case 'timeUp': return photoOr(config.steps[phase.challenge].backdrop, hall)
    // Digit found: the group gathers before the next room, as in the main hall.
    case 'waiting': return photoOr(config.homeBackdrop, hall)
    case 'padlock':
    case 'won': return photoOr(config.padlock.backdrop, hall)
  }
}
