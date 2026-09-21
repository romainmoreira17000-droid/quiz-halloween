/** @file Tests for the kind wrong-answer and wrong-code messages. */
import { WRONG_ANSWER_MESSAGES, WRONG_CODE_MESSAGES, wrongAnswerMessage, wrongCodeMessage } from './messages'

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

describe('wrongCodeMessage', () => {
  it('cycles and never repeats twice in a row', () => {
    const shown = [1, 2, 3, 4].map(wrongCodeMessage)
    expect(shown.slice(0, 3)).toEqual(WRONG_CODE_MESSAGES)
    expect(shown[3]).toBe(WRONG_CODE_MESSAGES[0])
    expect(new Set(shown.slice(0, 3)).size).toBe(3)
  })
})
