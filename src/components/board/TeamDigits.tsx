/** @file Digits of one team, one box per challenge in the order the team plays them; the one in play is framed. */
import type { TrackBox } from '../../game/boardCard'
import { plural } from './plural'

/**
 * @param props.track See TeamCardView.track.
 * @returns The list of boxes, named after the count of digits found.
 */
export function TeamDigits({ track }: { track: readonly TrackBox[] }) {
  const found = track.filter((box) => box.digit !== null).length
  return (
    <ol className="team-card-digits" aria-label={`${plural(found, 'chiffre trouvé', 'chiffres trouvés')} sur ${track.length}`}>
      {track.map((box, i) => (
        <li key={i} className={box.digit !== null ? 'found' : undefined} aria-current={box.current ? 'step' : undefined}
          aria-label={`${box.title} : ${box.digit ?? 'pas encore'}`}>
          {box.digit ?? '–'}
        </li>
      ))}
    </ol>
  )
}
