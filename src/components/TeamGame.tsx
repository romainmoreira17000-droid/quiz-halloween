/** @file One team's game: picks the screen and its backdrop from the progress, with the reset icon on top. */
import type { ReactNode } from 'react'
import type { QuizConfig } from '../config/types'
import { elapsedSeconds } from '../game/time'
import { useGameProgress, type GameProgress } from '../hooks/useGameProgress'
import type { GameStatus } from '../game/progress'
import { playPinSound, playVictorySound } from '../services/sound'
import { HallBackdrop } from './decor/HallBackdrop'
import { RestaurantFront } from './decor/RestaurantFront'
import { EntranceScreen } from './EntranceScreen'
import { GameHeader } from './GameHeader'
import { HomeScreen } from './HomeScreen'
import { PadlockScreen } from './PadlockScreen'
import { ResetControl } from './ResetControl'
import { StepScreen } from './StepScreen'
import { VictoryScreen } from './VictoryScreen'

/** Props of TeamGame. */
export interface TeamGameProps {
  config: QuizConfig
  /** 0-based team playing on this tablet. */
  teamIndex: number
  /** Called from the reset window to set the tablet up for another team. */
  onChangeTeam(): void
}

/**
 * The game of the tablet's team.
 * @param props See TeamGameProps.
 * @returns The current screen, with the reset icon.
 */
export function TeamGame({ config, teamIndex, onChangeTeam }: TeamGameProps) {
  const progress = useGameProgress(config)
  return (
    <>
      {backdrop(progress.state.status)}
      {currentScreen(config, teamIndex, progress)}
      <ResetControl onReset={progress.reset} onChangeTeam={onChangeTeam} />
    </>
  )
}

/**
 * Decor behind the screen: the restaurant door for the entrance message, the great hall once the group is
 * inside; the home screen keeps its plain candlelight.
 */
function backdrop(status: GameStatus): ReactNode {
  if (status === 'entrance') return <RestaurantFront />
  return status === 'playing' || status === 'padlock' || status === 'won' ? <HallBackdrop /> : null
}

/** Screen matching the current game status. */
function currentScreen(config: QuizConfig, teamIndex: number, { state, start, enter, answer, next, unlock }: GameProgress): ReactNode {
  // Temporary bridge until the rotation lands (Task 5): the whole game still runs on one clock,
  // but only GameHeader needs it now that HomeScreen shows the rhythm of the evening instead.
  const durationMinutes = config.stepCount * config.slotMinutes
  const { status, startedAt, finishedAt } = state
  if (status === 'entrance' && config.entrance) {
    return <EntranceScreen entrance={config.entrance} wrongAttempts={state.wrongAttempts} onSubmit={enter} />
  }
  if (status === 'home' || startedAt === null) {
    return (
      <HomeScreen title={config.title} intro={config.intro} teamName={config.teams[teamIndex]}
        challengeCount={config.stepCount} slotMinutes={config.slotMinutes} onStart={start} />
    )
  }
  const header = (
    <GameHeader startedAt={startedAt} finishedAt={finishedAt} durationMinutes={durationMinutes}
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
  // Same reason as the padlock: the clack must start inside the tap on Valider.
  const submit = (text: string) => { if (answer(text)) playPinSound() }
  return (
    <StepScreen header={header} step={config.steps[state.stepIndex]} stepNumber={state.stepIndex + 1}
      total={config.stepCount} foundDigits={state.foundDigits} wrongAttempts={state.wrongAttempts}
      isLast={state.stepIndex === config.stepCount - 1} onSubmit={submit} onNext={next} />
  )
}
