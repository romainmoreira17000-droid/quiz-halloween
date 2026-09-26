/** @file One team's game: the clock picks the challenge and the screen, drawn over its backdrop, with the reset icon on top. */
import type { ReactNode } from 'react'
import type { QuizConfig } from '../config/types'
import { blockSecondsLeft } from '../game/block'
import { gamePhase, type GamePhase } from '../game/phase'
import { wrongAttemptsIn } from '../game/progress'
import { remainingSeconds, slotTiming } from '../game/time'
import { useGameProgress, type GameProgress } from '../hooks/useGameProgress'
import { useNow } from '../hooks/useNow'
import { playPinSound, playVictorySound } from '../services/sound'
import { HallBackdrop } from './decor/HallBackdrop'
import { RestaurantFront } from './decor/RestaurantFront'
import { EntranceScreen } from './EntranceScreen'
import { GameHeader } from './GameHeader'
import { HomeScreen } from './HomeScreen'
import { PadlockScreen } from './PadlockScreen'
import { ResetControl } from './ResetControl'
import { StepScreen } from './StepScreen'
import { TimeUpScreen } from './TimeUpScreen'
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
  const progress = useGameProgress(config, teamIndex)
  // Ticks only while playing: slot changes, clocks and « Temps écoulé » all follow from the time.
  const now = useNow(progress.state.status === 'playing')
  const phase = gamePhase(progress.state, config, teamIndex, now)
  return (
    <>
      {backdrop(phase)}
      {currentScreen({ config, teamIndex, progress, phase, now })}
      <ResetControl onReset={progress.reset} onChangeTeam={onChangeTeam}
        animatorCode={progress.state.status === 'playing' ? config.animatorCode : undefined} />
    </>
  )
}

/** Restaurant door for the entrance message, great hall once the group is inside; plain candlelight at home. */
function backdrop(phase: GamePhase): ReactNode {
  if (phase.kind === 'entrance') return <RestaurantFront />
  return phase.kind === 'home' ? null : <HallBackdrop />
}

interface ScreenInput { config: QuizConfig; teamIndex: number; progress: GameProgress; phase: GamePhase; now: number }

/** Screen matching the phase. */
function currentScreen({ config, teamIndex, progress, phase, now }: ScreenInput): ReactNode {
  const { state, start, enter, answer, giveDigit, unlock } = progress
  if (phase.kind === 'entrance' && config.entrance) {
    return <EntranceScreen entrance={config.entrance} wrongAttempts={wrongAttemptsIn(state, null)} onSubmit={enter} />
  }
  if (phase.kind === 'home' || phase.kind === 'entrance' || state.startedAt === null) {
    return (
      <HomeScreen title={config.title} intro={config.intro} teamName={config.teams[teamIndex]}
        challengeCount={config.stepCount} slotMinutes={config.slotMinutes} onStart={start} />
    )
  }
  const { stepCount, slotMinutes } = config
  // `now` may lag one tick behind « Commencer »: never show a time before the start.
  const at = Math.max(now, state.startedAt)
  const timing = slotTiming(state.startedAt, at, slotMinutes)
  const slot = phase.kind !== 'won' && timing.slot < stepCount ? timing.slot : null
  const header = (
    <GameHeader slot={slot} total={stepCount} solved={state.digits.filter((d) => d !== null).length}
      slotSeconds={timing.secondsLeft} totalSeconds={remainingSeconds(state.startedAt, at, stepCount * slotMinutes)} />
  )
  switch (phase.kind) {
    case 'won':
      return <VictoryScreen header={header} message={config.padlock.victoryMessage} />
    case 'padlock': {
      // Sounds start inside the tap handler: tablets only allow sound started by a gesture.
      const open = (code: number[]) => { if (unlock(code)) playVictorySound() }
      return (
        <PadlockScreen header={header} title={config.padlock.title} steps={config.steps} foundDigits={state.digits}
          hint={config.padlock.hint} wrongAttempts={wrongAttemptsIn(state, stepCount)} onOpen={open} />
      )
    }
    case 'timeUp':
      return (
        <TimeUpScreen key={phase.challenge} header={header} step={config.steps[phase.challenge]}
          animatorCode={config.animatorCode} onUnlock={(code) => giveDigit(phase.challenge, code)} />
      )
    case 'challenge':
    case 'waiting': {
      const submit = (text: string) => { if (answer(phase.challenge, text)) playPinSound() }
      return (
        <StepScreen key={phase.challenge} header={header} step={config.steps[phase.challenge]} challenge={phase.challenge}
          digits={state.digits} wrongAttempts={wrongAttemptsIn(state, phase.slot)} secondsLeft={timing.secondsLeft}
          isLastSlot={phase.slot === stepCount - 1} blockSecondsLeft={blockSecondsLeft(state.blockedUntil, at)} onSubmit={submit} />
      )
    }
  }
}
