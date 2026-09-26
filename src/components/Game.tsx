/** @file Tablet entry: an animator sets the team first, then that team's game runs. */
import type { QuizConfig } from '../config/types'
import { useTeam } from '../hooks/useTeam'
import { TeamGame } from './TeamGame'
import { TeamSetupScreen } from './TeamSetupScreen'

/** Props of Game. */
export interface GameProps { config: QuizConfig }

/**
 * The whole game for a valid quiz.
 * @param props.config Validated quiz configuration.
 * @returns The setup screen until the tablet has a team, then the team's game.
 */
export function Game({ config }: GameProps) {
  const { teamIndex, choose, forget } = useTeam(config.teams)
  if (teamIndex === null) {
    return <TeamSetupScreen teams={config.teams} animatorCode={config.animatorCode} onChoose={choose} />
  }
  return <TeamGame config={config} teamIndex={teamIndex} onChangeTeam={forget} />
}
