/** @file Tests for the kind wrong-answer and wrong-code messages. */
import { WRONG_ANSWER_MESSAGES, WRONG_CODE_MESSAGES, waitingLabel, wrongAnswerMessage, wrongCodeMessage } from './messages'

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

describe('waitingLabel', () => {
  it('announces the next post', () => expect(waitingLabel(0, 6)).toBe('Changement d’épreuve dans'))
  it('announces the padlock after the last slot', () => expect(waitingLabel(5, 6)).toBe('Le cadenas final dans'))
  it('announces the final after the rotation', () => expect(waitingLabel(4, 6, 5)).toBe('L’épreuve finale dans'))
  it('announces the next post before the end of the rotation', () => expect(waitingLabel(3, 6, 5)).toBe('Changement d’épreuve dans'))
})
