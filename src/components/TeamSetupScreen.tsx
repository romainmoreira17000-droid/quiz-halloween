/** @file Tablet setup, done by an animator before the evening: animator code, then the team playing on it. */
import { useState } from 'react'
import { isAnimatorCode } from '../game/answer'
import { AnswerZone } from './AnswerZone'

/** Props of TeamSetupScreen. */
export interface TeamSetupScreenProps {
  /** Team names, in quiz.yaml order. */
  teams: readonly string[]
  /** `code_animateur` from quiz.yaml. */
  animatorCode: string
  /** Called with the 0-based chosen team. */
  onChoose(index: number): void
}

/**
 * Asks for the animator code (shown as dots), then one big button per team.
 * @param props See TeamSetupScreenProps.
 * @returns The setup screen.
 */
export function TeamSetupScreen({ teams, animatorCode, onChoose }: TeamSetupScreenProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const submit = (text: string) => {
    if (isAnimatorCode(text, animatorCode)) setUnlocked(true)
    else setWrongAttempts((count) => count + 1)
  }
  return (
    <main className="screen team-setup">
      <h1>Réglage de la tablette</h1>
      {unlocked ? (
        <>
          <p className="setup-question">Quelle équipe joue sur cette tablette ?</p>
          <ul className="team-list">
            {teams.map((name, i) => (
              <li key={name}><button type="button" className="seal-button team-button" onClick={() => onChoose(i)}>{name}</button></li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="setup-question">Code animateur</p>
          <AnswerZone kind="digits" secret wrongAttempts={wrongAttempts} wrongMessage="Ce n’est pas le code animateur." onSubmit={submit} />
        </>
      )}
    </main>
  )
}
