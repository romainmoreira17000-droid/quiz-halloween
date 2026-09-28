/**
 * @file Bronze body shared by the SVG padlocks (step screen and victory), in their `0 0 300 250` viewBox:
 * an edge drawn lower for the thickness, cobwebs, bones, the HAPPY HALLOWEEN banner, the night window
 * (children are drawn over its sky), a glowing keyhole and a skull. Draw LockShackle before it, LockCrown after.
 */
import type { ReactNode } from 'react'
import { LockBanner } from './LockBanner'
import { NightWindow } from './NightWindow'
import { Bone, Cobweb, Keyhole, Skull } from './Ornaments'

/** Outline of the body: straight sides, a crowned top, a rounded point at the bottom. */
export const LOCK_BODY_PATH = 'M58 98 Q150 84 242 98 Q268 102 268 128 V200 Q268 238 150 248 Q32 238 32 200 V128 Q32 102 58 98 Z'
/** The window, wide enough for the pins of six challenges with readable digits. */
export const LOCK_WINDOW = { x: 48, y: 128, width: 204, height: 100 }
/** Thickness of the lock, shown by the edge under the face. */
const EDGE = 6

/** Props of HalloweenLockBody. */
export interface HalloweenLockBodyProps {
  /** What the window shows over its sky (the pins of the step screen). */
  children?: ReactNode
}

/**
 * The bronze body of the padlock.
 * @param props See HalloweenLockBodyProps.
 * @returns An SVG group.
 */
export function HalloweenLockBody({ children }: HalloweenLockBodyProps) {
  return (
    <g className="lock-body">
      <path d={LOCK_BODY_PATH} transform={`translate(0 ${EDGE})`} fill="url(#lock-bronze-edge)" />
      <path className="lock-body-face" d={LOCK_BODY_PATH} fill="url(#lock-bronze)" stroke="#3a2610" strokeWidth="2" />
      <path d="M40 126 Q42 106 66 102" fill="none" stroke="#fff3c4" strokeOpacity=".5" strokeWidth="2" />
      <Cobweb x={36} y={102} size={24} />
      <Cobweb x={264} y={102} size={24} flip />
      <Bone x={39} y={146} length={56} />
      <Bone x={261} y={146} length={56} />
      <LockBanner y={116} />
      <NightWindow box={LOCK_WINDOW} shape="porthole" />
      {children}
      {/* Invisible until a right answer or the victory lights it (lock.css). */}
      <circle className="lock-flare" cx="150" cy="233" r="18" fill="url(#lock-glow)" />
      <Keyhole cx={150} cy={232} />
      <Skull cx={150} cy={248} r={7} />
    </g>
  )
}
