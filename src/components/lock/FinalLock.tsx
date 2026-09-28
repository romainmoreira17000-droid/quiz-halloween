/**
 * @file Frame of the final padlock, in the bronze Halloween style: chained shackle, pumpkin and bat wings above
 * (SVG), then an HTML bronze body (it grows with the number of dials) with the HAPPY HALLOWEEN banner and a
 * night-sky window holding the dials, cobwebs, bones and a skull. Styles in padlock.css, motion in lock.css.
 */
import type { ReactNode } from 'react'
import { HangingGhost } from './HangingGhost'
import { LockChains } from './LockChains'
import { LockCrown, LockShackle } from './LockCrown'
import { LockDefs } from './LockDefs'
import { NightWindow } from './NightWindow'
import { Bone, Cobweb, Skull } from './Ornaments'

/** Props of FinalLock. */
export interface FinalLockProps {
  /** What the window holds: the dials. */
  children: ReactNode
  /** True after a wrong code: the eyes of the pumpkin and the skull burn red for a moment. */
  alarmed?: boolean
}

/** The chains cross behind the shackle and hang past its legs. */
const CHAIN_BOX = { x: 0, y: 6, width: 300, height: 104 }
/** Sky drawn wider than tall, then cropped to the window (`slice`) whatever the number of dials. */
const SKY = { x: 0, y: 0, width: 400, height: 140 }

/**
 * The great padlock that the dials open.
 * @param props See FinalLockProps.
 * @returns The lock, with its children in the window.
 */
export function FinalLock({ children, alarmed = false }: FinalLockProps) {
  return (
    <div className={alarmed ? 'final-lock final-lock--alarmed' : 'final-lock'}>
      <svg className="final-lock-crown" viewBox="0 0 300 110" aria-hidden="true">
        {/* The only LockDefs of the screen: the sky and the ornaments below point to these ids too. */}
        <LockDefs />
        <LockChains box={CHAIN_BOX} />
        <LockShackle className="final-lock-shackle" />
        <LockCrown />
        <HangingGhost x={236} y={48} />
      </svg>
      <div className="final-lock-body">
        <svg className="final-lock-web final-lock-web--left" viewBox="0 0 30 30" aria-hidden="true"><Cobweb x={0} y={0} size={28} /></svg>
        <svg className="final-lock-web final-lock-web--right" viewBox="0 0 30 30" aria-hidden="true"><Cobweb x={30} y={0} size={28} flip /></svg>
        <p className="final-lock-banner" aria-hidden="true">HAPPY HALLOWEEN</p>
        <div className="final-lock-window">
          <svg className="final-lock-sky" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <NightWindow box={SKY} shape="plain" />
          </svg>
          {children}
        </div>
        <svg className="final-lock-bone final-lock-bone--left" viewBox="0 0 12 70" aria-hidden="true"><Bone x={6} y={5} length={60} /></svg>
        <svg className="final-lock-bone final-lock-bone--right" viewBox="0 0 12 70" aria-hidden="true"><Bone x={6} y={5} length={60} /></svg>
        <svg className="final-lock-skull" viewBox="0 0 24 26" aria-hidden="true"><Skull cx={12} cy={11} r={9} /></svg>
      </div>
    </div>
  )
}
