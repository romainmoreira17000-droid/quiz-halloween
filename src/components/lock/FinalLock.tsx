/**
 * @file Rusty frame of the final padlock: a chained shackle above, an iron body eaten by rust around the dials,
 * blood running from its lower edge. Pure decoration around its children (the dials). Styles in padlock.css.
 */
import type { ReactNode } from 'react'
import { BloodDrips, type Drip } from './BloodDrips'
import { LockChains } from './LockChains'
import { LockDefs } from './LockDefs'

/** Props of FinalLock. */
export interface FinalLockProps {
  /** What the body holds: the dials. */
  children: ReactNode
}

const SHACKLE = 'M70 110 V92 a80 80 0 0 1 160 0 V110'
/** The chains cross behind the shackle and hang past its legs. */
const CHAIN_BOX = { x: 0, y: 6, width: 300, height: 104 }
const DRIPS: readonly Drip[] = [
  { x: 72, y: 0, length: 26 }, { x: 208, y: 0, length: 14 }, { x: 250, y: 0, length: 20 },
]

/**
 * The great rusty padlock that the dials open.
 * @param props See FinalLockProps.
 * @returns The lock, with its children inside the body.
 */
export function FinalLock({ children }: FinalLockProps) {
  return (
    <div className="final-lock">
      <svg className="final-lock-shackle" viewBox="0 0 300 110" aria-hidden="true">
        {/* The only LockDefs of the screen: the plate and the blood below point to these ids too. */}
        <LockDefs />
        <LockChains box={CHAIN_BOX} />
        <path d={SHACKLE} fill="none" stroke="#120e0b" strokeWidth="30" />
        <path d={SHACKLE} fill="none" stroke="url(#lock-rust)" strokeWidth="23" filter="url(#lock-rust-grain)" />
        <path d="M63 110 V92 a87 87 0 0 1 70 -84" fill="none" stroke="#d9a070" strokeOpacity=".35" strokeWidth="3" />
      </svg>
      <div className="final-lock-body">
        {/* Stretched to the body (it grows with the number of dials); a tablet-sized viewBox keeps the rust grain fine. */}
        <svg className="final-lock-plate" viewBox="0 0 600 260" preserveAspectRatio="none" aria-hidden="true">
          <rect x="5" y="5" width="590" height="250" rx="26" fill="url(#lock-iron)" stroke="url(#lock-rust)" strokeWidth="10"
            filter="url(#lock-rust-grain)" />
        </svg>
        {children}
        <svg className="final-lock-blood" viewBox="0 0 300 40" aria-hidden="true">
          <BloodDrips drips={DRIPS} />
        </svg>
      </div>
    </div>
  )
}
