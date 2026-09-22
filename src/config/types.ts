/** @file Typed shape of the quiz configuration, once validated from quiz.yaml. */

/** How children type an answer: keypad digits or AZERTY letters. */
export type AnswerKind = 'digits' | 'letters'

/** Answer expected from the children, as written in quiz.yaml (compared after normalization). */
export interface ExpectedAnswer { kind: AnswerKind; value: string }

/** Optional message read before entering the restaurant; its answer starts the clock. */
export interface EntranceConfig { title?: string; message: string; answer: ExpectedAnswer }

/** One challenge: an instruction, the answer children type, and the padlock digit it earns. */
export interface QuizStep { title: string; instruction: string; image?: string; answer: ExpectedAnswer; digit: number }

/** Final padlock: order in which step digits are entered (always filled, default 1..N) and optional texts. */
export interface PadlockConfig { order: number[]; hint?: string; title?: string; victoryMessage?: string }

/** Whole quiz, with English keys mapped from the French YAML. */
export interface QuizConfig {
  title: string
  intro?: string
  durationMinutes: number
  stepCount: number
  steps: QuizStep[]
  padlock: PadlockConfig
  /** `entree` section, absent when the game starts directly on step 1. */
  entrance?: EntranceConfig
}

/** Outcome of validation: the typed config, or every French error message. */
export type ValidationResult = { ok: true; config: QuizConfig } | { ok: false; errors: string[] }
