/** @file Team playing on the tablet: read once from localStorage, set by an animator. */
import { useState } from 'react'
import { clearGame } from '../services/savedGame'
import { clearTeam, loadTeam, saveTeam } from '../services/savedTeam'

/** Team of the tablet and the animator's actions. */
export interface TabletTeam {
  /** 0-based team in quiz.yaml order, null until an animator sets the tablet up. */
  teamIndex: number | null
  /** Sets the team; its game always starts fresh, so no save can resume under another team. */
  choose(index: number): void
  /** Forgets the team: the setup screen (animator code) comes back. */
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
    choose: (index) => { clearGame(); saveTeam(teams[index]); setTeamIndex(index) },
    forget: () => { clearTeam(); setTeamIndex(null) },
  }
}
