/** @file Tests for the quiz fingerprint. */
import type { QuizConfig } from '../config/types'
import { quizFingerprint } from './fingerprint'

const config: QuizConfig = {
  title: 'Le manoir', durationMinutes: 90, stepCount: 1,
  steps: [{ title: 'A', instruction: 'a', solution: 4 }], padlock: { order: [1] },
}

describe('quizFingerprint', () => {
  it('is 8 hexadecimal characters', () => {
    expect(quizFingerprint(config)).toMatch(/^[0-9a-f]{8}$/)
  })
  it('is the same for the same quiz', () => {
    expect(quizFingerprint(structuredClone(config))).toBe(quizFingerprint(config))
  })
  it('changes when a solution changes', () => {
    const changed = { ...config, steps: [{ ...config.steps[0], solution: 5 }] }
    expect(quizFingerprint(changed)).not.toBe(quizFingerprint(config))
  })
})
