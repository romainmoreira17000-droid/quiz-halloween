/**
 * @file Big rusty padlock seen in cross-section: one pin per step drops below the shear line when its digit
 * is found, lighting its slot; once every pin is down the shackle frees itself and the chains fall.
 * Motion lives in lock.css, paint in LockDefs.
 */
import { BloodDrips, type Drip } from './lock/BloodDrips'
import { LockChains } from './lock/LockChains'
import { LockDefs } from './lock/LockDefs'

/** Props of CutawayLock. */
export interface CutawayLockProps {
  /** Number of steps, i.e. pins. */
  total: number
  /** Digit per step (index = step number - 1); null or missing while not found. Found pins are down. */
  foundDigits: readonly (number | null)[]
  /** Pin that falls right now (the digit just earned); the other found pins are drawn already down. */
  fallingIndex?: number
}

/** Inner chamber of the lock body, in viewBox units. */
const CHAMBER = { x: 44, y: 106, width: 212, height: 78 }
/** Where the pins must go below for the shackle to move. */
const SHEAR_LINE_Y = 136
const PIN_HEIGHT = 36
/** Baseline of the digits, on a dark plate: the rust grain would swallow them. */
const DIGIT_Y = 214
const DIGIT_PLATE = { x: 44, y: 190, width: 212, height: 32 }
// Short shackle legs leave room under the digits for the keyhole, within the same viewBox (same height on screen).
const SHACKLE = 'M78 100 V88 a72 72 0 0 1 144 0 V100'
const RIVETS = [[39, 102], [261, 102], [39, 234], [261, 234]]
/** The chains cross behind the lock: only their ends show, around the shackle and under the body. */
const CHAIN_BOX = { x: 2, y: 24, width: 296, height: 222 }
const KEYHOLE = { cx: 150, cy: 229 }
const DRIPS: readonly Drip[] = [
  { x: 150, y: 237, length: 9 }, { x: 58, y: 94, length: 11 }, { x: 236, y: 94, length: 7 }, { x: 268, y: 154, length: 14 },
]

/** @returns The French description read by screen readers. */
function lockLabel(total: number, down: number): string {
  if (down >= total) return 'Cadenas ouvert : toutes les goupilles sont tombées'
  return `Cadenas : ${down} ${down > 1 ? 'goupilles tombées' : 'goupille tombée'} sur ${total}`
}

// Challenges are found in rotation order, so any pin can be down.
const isFound = (digit: number | null | undefined): digit is number => digit !== null && digit !== undefined

/** @returns Class names of a pin, found and/or falling right now. */
function pinClass(found: boolean, falling: boolean): string {
  if (!found) return 'lock-pin'
  return falling ? 'lock-pin lock-pin--down lock-pin--falling' : 'lock-pin lock-pin--down'
}

/**
 * The padlock of the great hall.
 * @param props See CutawayLockProps.
 * @returns An SVG image of the lock, described in French for screen readers.
 */
export function CutawayLock({ total, foundDigits, fallingIndex }: CutawayLockProps) {
  const down = foundDigits.filter(isFound).length
  const open = down >= total
  const pitch = CHAMBER.width / total
  // Pins stay readable with few steps and never touch each other with many.
  const pinWidth = Math.max(4, Math.min(22, pitch - 8))
  const fontSize = Math.min(30, pitch * 0.9)
  return (
    <svg className={open ? 'cutaway-lock cutaway-lock--open' : 'cutaway-lock'} viewBox="0 0 300 250"
      role="img" aria-label={lockLabel(total, down)}>
      <LockDefs />
      <ellipse cx="150" cy="149" rx="150" ry="90" fill="url(#lock-glow)" />
      <LockChains box={CHAIN_BOX} fallen={open} />
      <g className="cutaway-shackle">
        <path d={SHACKLE} fill="none" stroke="#120e0b" strokeWidth="26" />
        <path d={SHACKLE} fill="none" stroke="url(#lock-rust)" strokeWidth="20" filter="url(#lock-rust-grain)" />
        <path d="M72 100 V88 a78 78 0 0 1 60 -76" fill="none" stroke="#d9a070" strokeOpacity=".35" strokeWidth="3" />
      </g>
      <rect className="cutaway-body" x="30" y="92" width="240" height="152" rx="22" fill="url(#lock-iron)"
        stroke="url(#lock-rust)" strokeWidth="8" filter="url(#lock-rust-grain)" />
      <rect x="36" y="97" width="228" height="4" rx="2" fill="#8a7a6a" fillOpacity=".25" />
      {RIVETS.map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="5" fill="url(#lock-rust)" stroke="#120e0b" strokeWidth="1.5" />
          <circle cx={cx - 1.5} cy={cy - 1.5} r="1.5" fill="#e0b080" fillOpacity=".6" />
        </g>
      ))}
      <path className="cutaway-keyhole" d={`M${KEYHOLE.cx} ${KEYHOLE.cy - 4} a3.5 3.5 0 0 1 2 6.4 l1.5 5.6 h-7 l1.5 -5.6 a3.5 3.5 0 0 1 2 -6.4 Z`}
        fill="#050302" stroke="#3b1a0b" strokeWidth="1" />
      <BloodDrips drips={DRIPS} />
      <rect {...CHAMBER} rx="6" fill="#0f0a07" />
      <rect {...DIGIT_PLATE} rx="6" fill="#0f0a07" fillOpacity=".9" />
      {Array.from({ length: total }, (_, i) => {
        const x = CHAMBER.x + pitch * i
        const digit = foundDigits[i]
        const found = isFound(digit)
        return (
          <g key={i}>
            {found && <rect className="lock-slot-glow" x={x} y={CHAMBER.y} width={pitch} height={CHAMBER.height} fill="#f2a541" />}
            <rect className={pinClass(found, i === fallingIndex)} x={x + (pitch - pinWidth) / 2} y={CHAMBER.y + 4}
              width={pinWidth} height={PIN_HEIGHT} rx={Math.min(4, pinWidth / 2)} fill="url(#lock-pin)" />
            <text className={found ? 'lock-digit lock-digit--found' : 'lock-digit'} x={x + pitch / 2} y={DIGIT_Y}
              fontSize={fontSize} textAnchor="middle">
              {found ? digit : '·'}
            </text>
          </g>
        )
      })}
      <line x1={CHAMBER.x} y1={SHEAR_LINE_Y} x2={CHAMBER.x + CHAMBER.width} y2={SHEAR_LINE_Y}
        stroke="#c9a26b" strokeOpacity=".35" strokeDasharray="4 4" />
      <rect {...CHAMBER} rx="6" fill="none" stroke="#000" strokeOpacity=".6" strokeWidth="3" />
    </svg>
  )
}
