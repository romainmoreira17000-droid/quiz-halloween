/** @file Picks the screen to show from the game progress. */
import type { QuizConfig } from '../config/types'
import { useGameProgress } from '../hooks/useGameProgress'
import { AllSolvedScreen } from './AllSolvedScreen'
import { GameHeader } from './GameHeader'
import { HomeScreen } from './HomeScreen'
import { StepScreen } from './StepScreen'

/** Props of Game. */
export interface GameProps { config: QuizConfig }

/**
 * The whole game for a valid quiz.
 * @param props.config Validated quiz configuration.
 * @returns The current screen.
 */
export function Game({ config }: GameProps) {
  const { state, start, answer, next } = useGameProgress(config.steps, config.padlock.order)
  if (state.status === 'home' || state.startedAt === null) {
    return <HomeScreen title={config.title} intro={config.intro} durationMinutes={config.durationMinutes} onStart={start} />
  }
  const playing = state.status === 'playing'
  const header = (
    <GameHeader startedAt={state.startedAt} durationMinutes={config.durationMinutes}
      total={config.stepCount} solved={state.foundDigits.length} current={playing ? state.stepIndex : null} />
  )
  if (!playing) return <AllSolvedScreen header={header} steps={config.steps} foundDigits={state.foundDigits} />
  return (
    <StepScreen header={header} step={config.steps[state.stepIndex]} stepNumber={state.stepIndex + 1}
      total={config.stepCount} foundDigit={state.foundDigits[state.stepIndex]} wrongAttempts={state.wrongAttempts}
      isLast={state.stepIndex === config.stepCount - 1} onDigit={answer} onNext={next} />
  )
}
