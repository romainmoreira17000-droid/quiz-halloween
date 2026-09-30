/** @file Tablet entry: an animator sets the team first, then that team's game runs. */
import type { QuizConfig } from '../config/types'
import { isBoardMode } from '../game/boardMode'
import { isTestMode } from '../game/testMode'
import { useEveningCode } from '../hooks/useEveningCode'
import { useTeam } from '../hooks/useTeam'
import { boardApi, type BoardApi } from '../services/board'
import { BoardScreen } from './board/BoardScreen'
import { TeamGame } from './TeamGame'
import { TeamSetupScreen } from './TeamSetupScreen'

/** Props of Game. */
export interface GameProps {
  config: QuizConfig
  /** Remote board calls (a fake in tests). */
  api?: BoardApi
}

/**
 * The whole game for a valid quiz.
 * @param props.config Validated quiz configuration.
 * @param props.api Remote board calls.
 * @returns The remote board with `?animateur`, else the setup screen until the tablet has a team, then the team's game.
 */
export function Game({ config, api = boardApi }: GameProps) {
  const { teamIndex, choose, forget } = useTeam(config.teams)
  const [eveningCode, setEveningCode] = useEveningCode()
  // The animator phone: no team, no game, only the board.
  if (isBoardMode(window.location.search)) return <BoardScreen config={config} api={api} />
  if (teamIndex === null) {
    const setUp = (index: number, code: string) => { setEveningCode(code); choose(index) }
    return <TeamSetupScreen teams={config.teams} animatorCode={config.animatorCode} eveningCode={eveningCode} onChoose={setUp} />
  }
  return (
    <TeamGame config={config} teamIndex={teamIndex} onChangeTeam={forget} testMode={isTestMode(window.location.search)}
      eveningCode={eveningCode} api={api} />
  )
}
