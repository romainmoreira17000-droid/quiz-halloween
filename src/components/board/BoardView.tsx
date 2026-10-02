/** @file The animator board once the code is known: header, alerts, one card per team, solutions and « Nouvelle soirée ». */
import { useEffect, useMemo, useState } from 'react'
import type { QuizConfig } from '../../config/types'
import { BOARD_FRESH_MS } from '../../game/boardAlerts'
import { boardCards } from '../../game/boardCard'
import { boardClock } from '../../game/boardClock'
import { quizFingerprint } from '../../game/fingerprint'
import { useBoard } from '../../hooks/useBoard'
import { useBoardAlerts } from '../../hooks/useBoardAlerts'
import { useNow } from '../../hooks/useNow'
import { useWakeLock } from '../../hooks/useWakeLock'
import type { BoardApi } from '../../services/board'
import { alertAnimator } from '../../services/notify'
import { AlertBanner } from './AlertBanner'
import { AlertToggle } from './AlertToggle'
import { BoardHeader } from './BoardHeader'
import { NewEvening } from './NewEvening'
import { SolutionsPanel } from './SolutionsPanel'
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
  const [alertsOn, setAlertsOn] = useState(false)
  const wakeLock = useWakeLock(alertsOn)
  // A stale board makes every tablet look silent: no « silent » alert until it reads again.
  const online = feed.last === 'ok' && feed.okAt !== null && now - feed.okAt <= BOARD_FRESH_MS
  const alerts = useBoardAlerts(cards, { ready: feed.snapshot !== null, online, onNew: alertsOn ? alertAnimator : () => {} })
  // The test beep, inside the tap, both unlocks the sound and lets the animator check the volume.
  const enableAlerts = () => { setAlertsOn(true); alertAnimator() }
  const [eraseFailed, setEraseFailed] = useState(false)
  // Waits for the answer: a silent failure would let the animator believe the board was emptied.
  const erase = async () => {
    setEraseFailed(false)
    const result = await api.reset(code)
    if (result === 'refused') onRefused()
    else setEraseFailed(result === 'failed')
  }
  const age = feed.okAt === null ? null : Math.max(0, Math.floor((now - feed.okAt) / 1000))
  return (
    <main className="screen board">
      <BoardHeader clock={reference === null ? null : boardClock(reference, now, config)} stepCount={config.stepCount} />
      <AlertToggle enabled={alertsOn} wakeLock={wakeLock} onEnable={enableAlerts} />
      <AlertBanner alerts={alerts.pending} onSeen={alerts.dismiss} />
      <div className="board-cards">
        {cards.map((view) => <TeamCard key={view.team} view={view} alert={alerts.alertTeams.has(view.team)} />)}
      </div>
      <SolutionsPanel config={config} />
      <footer className="board-footer">
        <p role="status">
          {feed.last === 'failed' ? 'Connexion perdue, nouvelle tentative…' : age === null ? 'Connexion…' : `Mis à jour il y a ${age} s`}
        </p>
        {eraseFailed && <p className="board-error" role="alert">Effacement impossible, réessaie.</p>}
        <NewEvening onConfirm={() => void erase()} />
      </footer>
    </main>
  )
}
