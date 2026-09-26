/** @file Team playing on the tablet: read once from localStorage, set by an animator. */
import { useState } from 'react'
import { clearGame } from '../services/savedGame'
import { loadTeam, saveTeam } from '../services/savedTeam'

/** Team of the tablet and the animator's actions. */
export interface TabletTeam {
  /** 0-based team in quiz.yaml order, null until an animator sets the tablet up. */
  teamIndex: number | null
  /** Sets the team. Another team starts a fresh game (no save resumes under another team); the same one resumes. */
  choose(index: number): void
  /** Shows the setup screen (animator code) again; the saved team stays until another one is chosen. */
  forget(): void
}

/**
 * Holds the team of the tablet.
 * @param teams Team names of the quiz.
 * @returns The team and its actions.
 */
export function useTeam(teams: readonly string[]): TabletTeam {
  const [teamIndex, setTeamIndex] = useState(() => loadTeam(teams))
  return {
    teamIndex,
    choose: (index) => {
      // Re-choosing the saved team keeps its game: a reset would restart its slots and put it in another team's room.
      if (loadTeam(teams) !== index) clearGame()
      saveTeam(teams[index])
      setTeamIndex(index)
    },
    forget: () => setTeamIndex(null),
  }
}
