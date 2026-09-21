/** @file Provisional end screen listing the digits found (replaced by the padlock in sprint 5). */
import type { ReactNode } from 'react'
import type { QuizStep } from '../config/types'

/** Props of AllSolvedScreen. */
export interface AllSolvedScreenProps {
  header: ReactNode
  steps: readonly QuizStep[]
  /** Digits found, in step order. */
  foundDigits: number[]
}

/**
 * Shown once every step is solved.
 * @param props See AllSolvedScreenProps.
 * @returns The end screen.
 */
export function AllSolvedScreen({ header, steps, foundDigits }: AllSolvedScreenProps) {
  return (
    <main className="screen solved">
      {header}
      <h2>Toutes les énigmes sont résolues !</h2>
      <p>Retenez bien vos chiffres : le coffre aux bonbons vous attend.</p>
      <ul className="recap">
        {steps.map((step, i) => <li key={i}><span>{step.title}</span><b>{foundDigits[i]}</b></li>)}
      </ul>
    </main>
  )
}
