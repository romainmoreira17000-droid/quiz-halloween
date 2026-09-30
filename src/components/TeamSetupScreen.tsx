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
  /** Evening code saved on this tablet, null when none. */
  eveningCode: string | null
  /** Called with the 0-based chosen team and the evening code as typed (empty: remote board off). */
  onChoose(index: number, eveningCode: string): void
}

/**
 * Asks for the animator code (shown as dots), then the optional evening code of the remote board and one big button per team.
 * @param props See TeamSetupScreenProps.
 * @returns The setup screen.
 */
export function TeamSetupScreen({ teams, animatorCode, eveningCode, onChoose }: TeamSetupScreenProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [code, setCode] = useState(eveningCode ?? '')
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
          <label className="evening-code">
            Code de soirée (facultatif)
            <input type="text" value={code} autoComplete="off" autoCapitalize="characters" spellCheck={false}
              onChange={(event) => setCode(event.target.value)} />
          </label>
          <p className="setup-question">Quelle équipe joue sur cette tablette ?</p>
          <ul className="team-list">
            {teams.map((name, i) => (
              <li key={name}><button type="button" className="seal-button team-button" onClick={() => onChoose(i, code)}>{name}</button></li>
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
