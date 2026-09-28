/**
 * @file Bronze Halloween padlock seen in cross-section, on the step screen: one pin per step drops below the
 * shear line when its digit is found; the lock then jolts on its chain and its pumpkin flares; once every pin
 * is down the shackle frees itself and the chains fall. Motion lives in lock.css, paint in LockDefs.
 */
import { HalloweenLockBody } from './lock/HalloweenLockBody'
import { HangingGhost } from './lock/HangingGhost'
import { LockChains } from './lock/LockChains'
import { LockCrown, LockShackle } from './lock/LockCrown'
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

/** Pin chamber, inside the night window (LOCK_WINDOW of HalloweenLockBody). */
const CHAMBER = { x: 58, y: 134, width: 184, height: 60 }
/** Where the pins must go below for the shackle to move. */
const SHEAR_LINE_Y = 166
const PIN_HEIGHT = 26
/** Baseline of the digits, on a dark plate: the night sky would swallow them. */
const DIGIT_Y = 221
const DIGIT_PLATE = { x: 58, y: 197, width: 184, height: 30 }
/** The chains cross behind the lock: only their ends show, around the shackle and under the body. */
const CHAIN_BOX = { x: 2, y: 24, width: 296, height: 222 }

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

/** @returns Class names of the lock: open once every pin is down, jolting while a pin falls. */
function lockClass(open: boolean, jolt: boolean): string {
  return ['cutaway-lock', open && 'cutaway-lock--open', jolt && 'cutaway-lock--jolt'].filter(Boolean).join(' ')
}

/**
 * The padlock of the step screen.
 * @param props See CutawayLockProps.
 * @returns An SVG image of the lock, described in French for screen readers.
 */
export function CutawayLock({ total, foundDigits, fallingIndex }: CutawayLockProps) {
  const down = foundDigits.filter(isFound).length
  const open = down >= total
  const pitch = CHAMBER.width / total
  // Pins stay readable with few steps and never touch each other with many.
  const pinWidth = Math.max(4, Math.min(20, pitch - 8))
  const fontSize = Math.min(28, pitch * 0.92)
  return (
    <svg className={lockClass(open, fallingIndex !== undefined)} viewBox="0 0 300 250"
      role="img" aria-label={lockLabel(total, down)}>
      <LockDefs />
      <ellipse cx="150" cy="160" rx="150" ry="95" fill="url(#lock-glow)" opacity=".35" />
      <LockChains box={CHAIN_BOX} fallen={open} />
      <LockShackle className="cutaway-shackle" />
      <HalloweenLockBody>
        {/* Translucent: the moon and the castle show behind the pins. */}
        <rect {...CHAMBER} rx="6" fill="#0f0a07" fillOpacity=".35" />
        <rect {...DIGIT_PLATE} rx="6" fill="#0f0a07" fillOpacity=".85" />
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
          stroke="#f3d27a" strokeOpacity=".45" strokeDasharray="4 4" />
        <rect {...CHAMBER} rx="6" fill="none" stroke="#000" strokeOpacity=".6" strokeWidth="2" />
      </HalloweenLockBody>
      <LockCrown />
      <HangingGhost x={252} y={66} />
    </svg>
  )
}
