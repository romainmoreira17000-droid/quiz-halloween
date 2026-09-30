/** @file Animator board (`?animateur`): the evening code first, then the live board. */
import { useCallback, useState } from 'react'
import type { QuizConfig } from '../../config/types'
import { useEveningCode } from '../../hooks/useEveningCode'
import { boardApi, type BoardApi } from '../../services/board'
import { BoardCodeForm } from './BoardCodeForm'
import { BoardView } from './BoardView'

/**
 * Whole animator board.
 * @param props.config Validated quiz (same app, same quiz as the tablets).
 * @param props.api Board calls (a fake in tests).
 * @returns The code form, or the board.
 */
export function BoardScreen({ config, api = boardApi }: { config: QuizConfig; api?: BoardApi }) {
  const [code, setCode] = useEveningCode()
  const [refused, setRefused] = useState(false)
  // Stable: BoardView calls it from an effect.
  const onRefused = useCallback(() => { setRefused(true); setCode('') }, [setCode])
  if (code === null) return <main className="screen board"><BoardCodeForm refused={refused} onSubmit={(typed) => { setRefused(false); setCode(typed) }} /></main>
  // Keyed by code: another code starts a fresh feed.
  return <BoardView key={code} config={config} code={code} api={api} onRefused={onRefused} />
}
