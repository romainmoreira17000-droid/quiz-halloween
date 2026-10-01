/** @file Typed shape of the quiz configuration, once validated from quiz.yaml. */

/** How children type an answer: keypad digits or AZERTY letters. */
export type AnswerKind = 'digits' | 'letters'

/** Answer expected from the children, as written in quiz.yaml (compared after normalization). */
export interface ExpectedAnswer { kind: AnswerKind; value: string }

/** Optional message read before entering the restaurant; its answer starts the clock. */
export interface EntranceConfig { title?: string; message: string; answer: ExpectedAnswer }

/** One challenge: an instruction, the answer children type, the padlock digit it earns, and optional hints. */
export interface QuizStep {
  title: string; instruction: string; image?: string; answer: ExpectedAnswer; digit: number
  /** `indices`: unlocked one by one at `hintTimes`; no hint button without them. */
  hints?: string[]
  /** `fond`: photo shown behind the screen while the group is in this room; drawn great hall without it. */
  backdrop?: string
}

/** Final padlock: order in which step digits are entered (always filled, default 1..N) and optional texts. */
export interface PadlockConfig {
  order: number[]; hint?: string; title?: string; victoryMessage?: string
  /** `fond`: photo behind the padlock and victory screens. */
  backdrop?: string
}

/** Whole quiz, with English keys mapped from the French YAML. */
export interface QuizConfig {
  title: string
  intro?: string
  /** `fond_accueil`: photo behind the home screen and the wait between two rooms. */
  homeBackdrop?: string
  /** `message_attente`: shown under the earned digit while the group waits for the next challenge (same in every room). */
  waitingMessage?: string
  /** Team names, in rotation order: team i starts on rotating challenge i + 1. At least one per rotating challenge. */
  teams: string[]
  /** Length of one slot in minutes: every team changes room at the same time. */
  slotMinutes: number
  /** `indices_apres_minutes`: minute of the slot at which hint n° i unlocks (strictly increasing, all below slotMinutes). */
  hintTimes: number[]
  /** Seconds the keyboard stays blocked after a wrong answer to a challenge (0 = never). */
  blockSeconds: number
  /** Code animators type to set up a tablet or give the digit of a missed challenge (digits, kept as text). */
  animatorCode: string
  stepCount: number
  steps: QuizStep[]
  /** `finale: true` on a step: 0-based challenge every team plays together in the last slot; absent without one. */
  finalStep?: number
  padlock: PadlockConfig
  /** `entree` section, absent when the game starts directly on step 1. */
  entrance?: EntranceConfig
}

/** Outcome of validation: the typed config, or every French error message. */
export type ValidationResult = { ok: true; config: QuizConfig } | { ok: false; errors: string[] }
