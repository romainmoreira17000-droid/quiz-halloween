/**
 * @file Bronze padlock of the victory screen: it turns to face the children, its keyhole flares, its shackle
 * springs up and its chains fall, then the screen plunges into its night window. The same outline pushed back
 * in 3D gives it a thickness while it turns. Motion in victory.css.
 */
import { HalloweenLockBody, LOCK_BODY_PATH } from './HalloweenLockBody'
import { HangingGhost } from './HangingGhost'
import { LockChains } from './LockChains'
import { LockCrown, LockShackle } from './LockCrown'
import { LockDefs } from './LockDefs'

/** Same box as the step screen lock: the `chain-fall` pivot of lock.css is set for it. */
const CHAIN_BOX = { x: 2, y: 24, width: 296, height: 222 }

/**
 * The padlock that opens when the right code is dialled.
 * @returns Decorative markup, hidden from screen readers.
 */
export function VictoryLock() {
  return (
    <div className="victory-lock-3d" aria-hidden="true">
      <svg className="victory-lock-back" viewBox="0 0 300 250"><path d={LOCK_BODY_PATH} fill="#2a1b0b" /></svg>
      <svg className="victory-lock" viewBox="0 0 300 250">
        <LockDefs />
        {/* Long legs hidden behind the body: they stay engaged in it once the shackle has sprung up. */}
        <LockShackle className="victory-lock-shackle" legBottom={140} />
        <HalloweenLockBody />
        <LockCrown />
        {/* In front of the body, wrapped round it; already fallen, so they drop as soon as the victory screen shows. */}
        <LockChains box={CHAIN_BOX} fallen />
        <HangingGhost x={252} y={66} />
      </svg>
    </div>
  )
}
