/** @file Remembers which team plays on this tablet, under its own localStorage key so a game reset keeps it. */

/** localStorage key of the tablet's team (the team name, as written in quiz.yaml). */
export const TEAM_KEY = 'quiz-halloween:team'

// Every access is wrapped, like savedGame: a refused storage only means asking for the team again.

/**
 * Reads the team of this tablet.
 * @param teams Team names of the current quiz.
 * @returns Its index, or null (none saved, team renamed or removed from quiz.yaml, storage refused).
 */
export function loadTeam(teams: readonly string[]): number | null {
  try {
    const index = teams.indexOf(localStorage.getItem(TEAM_KEY) ?? '')
    return index === -1 ? null : index
  } catch {
    return null
  }
}

/**
 * Saves the team of this tablet. The name, not the index: reordering quiz.yaml must not swap teams.
 * @param name Team name from quiz.yaml.
 */
export function saveTeam(name: string): void {
  try { localStorage.setItem(TEAM_KEY, name) } catch { /* see above */ }
}

/** Forgets the team of this tablet. */
export function clearTeam(): void {
  try { localStorage.removeItem(TEAM_KEY) } catch { /* see above */ }
}
