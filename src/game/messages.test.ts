/** @file Tests for the kind wrong-answer messages. */
import { WRONG_ANSWER_MESSAGES, wrongAnswerMessage } from './messages'

describe('wrongAnswerMessage', () => {
  it('starts with the first message', () => {
    expect(wrongAnswerMessage(1)).toBe(WRONG_ANSWER_MESSAGES[0])
  })
  it('never repeats the same message twice in a row', () => {
    for (let attempt = 1; attempt < 20; attempt++) {
      expect(wrongAnswerMessage(attempt + 1)).not.toBe(wrongAnswerMessage(attempt))
    }
  })
  it('cycles through every message', () => {
    const seen = new Set(Array.from({ length: WRONG_ANSWER_MESSAGES.length }, (_, i) => wrongAnswerMessage(i + 1)))
    expect(seen.size).toBe(WRONG_ANSWER_MESSAGES.length)
  })
})
