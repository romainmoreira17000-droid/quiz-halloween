/** @file Tests for the answer check. */
import { isCorrectAnswer } from './answer'

const step = { title: 'La crypte', instruction: 'Comptez...', solution: 0 }

describe('isCorrectAnswer', () => {
  it('accepts the solution, including 0', () => {
    expect(isCorrectAnswer(step, 0)).toBe(true)
  })
  it('rejects any other digit', () => {
    expect(isCorrectAnswer(step, 9)).toBe(false)
  })
})
