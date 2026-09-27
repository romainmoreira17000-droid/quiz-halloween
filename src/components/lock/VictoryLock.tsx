/**
 * @file Rusty padlock of the victory screen: its shackle springs up, its chains fall, then it drops before
 * the doors swing open. Same look as the other padlocks (LockDefs); motion in victory.css and lock.css.
 */
import { BloodDrips, type Drip } from './BloodDrips'
import { LockChains } from './LockChains'
import { LockDefs } from './LockDefs'

// Long legs hidden behind the body: they stay engaged in it once the shackle has sprung up.
const SHACKLE = 'M78 140 V88 a72 72 0 0 1 144 0 V140'
const RIVETS = [[44, 108], [256, 108], [44, 226], [256, 226]]
/** Same box as the step screen lock: the `chain-fall` pivot of lock.css is set for it. */
const CHAIN_BOX = { x: 2, y: 24, width: 296, height: 222 }
const DRIPS: readonly Drip[] = [
  { x: 150, y: 196, length: 22 }, { x: 70, y: 236, length: 14 }, { x: 226, y: 236, length: 20 },
]

/**
 * The padlock that opens when the right code is dialled.
 * @returns A decorative SVG, hidden from screen readers.
 */
export function VictoryLock() {
  return (
    <svg className="victory-lock" viewBox="0 0 300 250" aria-hidden="true">
      <LockDefs />
      <g className="victory-lock-shackle">
        <path d={SHACKLE} fill="none" stroke="#120e0b" strokeWidth="26" />
        <path d={SHACKLE} fill="none" stroke="url(#lock-rust)" strokeWidth="20" filter="url(#lock-rust-grain)" />
      </g>
      <rect x="30" y="92" width="240" height="152" rx="22" fill="url(#lock-iron)"
        stroke="url(#lock-rust)" strokeWidth="8" filter="url(#lock-rust-grain)" />
      <rect x="36" y="97" width="228" height="4" rx="2" fill="#8a7a6a" fillOpacity=".25" />
      {RIVETS.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" fill="#6b5a4a" stroke="#120e0b" strokeWidth="2" />)}
      <path d="M150 150 a14 14 0 0 1 8 25 l6 21 h-28 l6 -21 a14 14 0 0 1 8 -25 z" fill="#050302" />
      <BloodDrips drips={DRIPS} />
      {/* In front of the body, wrapped round it; already fallen, so they drop as soon as the victory screen shows. */}
      <LockChains box={CHAIN_BOX} fallen />
    </svg>
  )
}
