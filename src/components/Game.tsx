/** @file Picks the screen to show from the game progress, with the reset icon on top. */
import type { ReactNode } from 'react'
import type { QuizConfig } from '../config/types'
import { elapsedSeconds } from '../game/time'
import { useGameProgress, type GameProgress } from '../hooks/useGameProgress'
import { playVictorySound } from '../services/sound'
import { GameHeader } from './GameHeader'
import { HomeScreen } from './HomeScreen'
import { PadlockScreen } from './PadlockScreen'
import { ResetControl } from './ResetControl'
import { StepScreen } from './StepScreen'
import { VictoryScreen } from './VictoryScreen'

/** Props of Game. */
export interface GameProps { config: QuizConfig }

/**
 * The whole game for a valid quiz.
 * @param props.config Validated quiz configuration.
 * @returns The current screen, with the reset icon.
 */
export function Game({ config }: GameProps) {
  const progress = useGameProgress(config)
  return (
    <>
      {currentScreen(config, progress)}
      <ResetControl onReset={progress.reset} />
    </>
  )
}

/** Screen matching the current game status. */
function currentScreen(config: QuizConfig, { state, start, answer, next, unlock }: GameProgress): ReactNode {
  const { status, startedAt, finishedAt } = state
  if (status === 'home' || startedAt === null) {
    return <HomeScreen title={config.title} intro={config.intro} durationMinutes={config.durationMinutes} onStart={start} />
  }
  const header = (
    <GameHeader startedAt={startedAt} finishedAt={finishedAt} durationMinutes={config.durationMinutes}
      total={config.stepCount} solved={state.foundDigits.length} current={status === 'playing' ? state.stepIndex : null} />
  )
  if (status === 'won' && finishedAt !== null) {
    return <VictoryScreen header={header} message={config.padlock.victoryMessage} elapsedSeconds={elapsedSeconds(startedAt, finishedAt)} />
  }
  if (status === 'padlock') {
    // The sound starts inside the tap handler: tablets only allow sound started by a gesture.
    const open = (code: number[]) => { if (unlock(code)) playVictorySound() }
    return (
      <PadlockScreen header={header} title={config.padlock.title} steps={config.steps} foundDigits={state.foundDigits}
        hint={config.padlock.hint} wrongAttempts={state.wrongAttempts} onOpen={open} />
    )
  }
  return (
    <StepScreen header={header} step={config.steps[state.stepIndex]} stepNumber={state.stepIndex + 1}
      total={config.stepCount} foundDigit={state.foundDigits[state.stepIndex]} wrongAttempts={state.wrongAttempts}
      isLast={state.stepIndex === config.stepCount - 1} onSubmit={answer} onNext={next} />
  )
}
