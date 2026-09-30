/** @file The animator board once the code is known: header, one card per team, freshness and « Nouvelle soirée ». */
import { useEffect, useMemo } from 'react'
import type { QuizConfig } from '../../config/types'
import { boardCards } from '../../game/boardCard'
import { boardClock } from '../../game/boardClock'
import { quizFingerprint } from '../../game/fingerprint'
import { useBoard } from '../../hooks/useBoard'
import { useNow } from '../../hooks/useNow'
import type { BoardApi } from '../../services/board'
import { BoardHeader } from './BoardHeader'
import { NewEvening } from './NewEvening'
import { TeamCard } from './TeamCard'

/** Props of BoardView. */
export interface BoardViewProps {
  config: QuizConfig
  code: string
  api: BoardApi
  /** Called when the database refuses the code. */
  onRefused(): void
}

/**
 * Live board.
 * @param props See BoardViewProps.
 * @returns The board.
 */
export function BoardView({ config, code, api, onRefused }: BoardViewProps) {
  const feed = useBoard(code, api)
  const now = useNow(true)
  const fingerprint = useMemo(() => quizFingerprint(config), [config])
  useEffect(() => { if (feed.last === 'refused') onRefused() }, [feed.last, onRefused])
  const { cards, reference } = boardCards(config, fingerprint, feed.snapshot, now)
  const age = feed.okAt === null ? null : Math.max(0, Math.floor((now - feed.okAt) / 1000))
  return (
    <main className="screen board">
      <BoardHeader clock={reference === null ? null : boardClock(reference, now, config)} stepCount={config.stepCount} />
      <div className="board-cards">{cards.map((view) => <TeamCard key={view.team} view={view} />)}</div>
      <footer className="board-footer">
        <p role="status">
          {feed.last === 'failed' ? 'Connexion perdue, nouvelle tentative…' : age === null ? 'Connexion…' : `Mis à jour il y a ${age} s`}
        </p>
        <NewEvening onConfirm={() => void api.reset(code)} />
      </footer>
    </main>
  )
}
