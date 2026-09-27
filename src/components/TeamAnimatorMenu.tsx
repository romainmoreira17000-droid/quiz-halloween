/** @file Animator menu of the tablet's game: picks the actions that make sense on the screen shown now. */
import type { QuizConfig } from '../config/types'
import { blockSecondsLeft } from '../game/block'
import { padlockCode } from '../game/padlock'
import type { GamePhase } from '../game/phase'
import { hintsAvailable } from '../game/progress'
import { timeOfDay } from '../game/startTime'
import type { GameProgress } from '../hooks/useGameProgress'
import { playPinSound } from '../services/sound'
import { AnimatorMenu } from './AnimatorMenu'

/** Props of TeamAnimatorMenu. */
export interface TeamAnimatorMenuProps {
  config: QuizConfig
  progress: GameProgress
  /** Screen shown now. */
  phase: GamePhase
  /** Current time in ms (the ticking clock of TeamGame). */
  now: number
  onClose(): void
}

/**
 * The menu, with only the actions possible now: solve, unblock and one more hint need a challenge on screen;
 * the skip also works during the wait, and the start time can be changed during the whole game.
 * @param props See TeamAnimatorMenuProps.
 * @returns The animator menu.
 */
export function TeamAnimatorMenu({ config, progress, phase, now, onClose }: TeamAnimatorMenuProps) {
  const { state } = progress
  const code = padlockCode(config.steps, config.padlock.order)
  // The start time can be fixed on every screen of a game in progress, « Temps écoulé » and padlock included.
  const start = state.status === 'playing' && state.startedAt !== null
    ? { value: timeOfDay(state.startedAt), onSet: progress.setStart } : undefined
  if (phase.kind === 'waiting') {
    return <AnimatorMenu steps={config.steps} code={code} onSkip={() => progress.animatorSkip(phase.challenge)} start={start} onClose={onClose} />
  }
  if (phase.kind !== 'challenge' || state.startedAt === null) {
    return <AnimatorMenu steps={config.steps} code={code} start={start} onClose={onClose} />
  }
  const { challenge, slot } = phase
  const step = config.steps[challenge]
  const total = step.hints?.length ?? 0
  const shown = hintsAvailable(state, config, challenge, slot, now)
  return (
    <AnimatorMenu steps={config.steps} code={code} challengeTitle={step.title}
      // Sounds start inside the tap handler: tablets only allow sound started by a gesture.
      onSolve={() => { if (progress.animatorSolve(challenge)) playPinSound() }}
      onUnblock={blockSecondsLeft(state.blockedUntil, now) > 0 ? progress.unblock : undefined}
      nextHint={shown < total ? { number: shown + 1, total, onShow: () => progress.showHint(challenge) } : undefined}
      onSkip={() => { if (progress.animatorSkip(challenge)) playPinSound() }}
      start={start} onClose={onClose} />
  )
}
