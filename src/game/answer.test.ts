/** @file Tests for the answer check. */
import { appendToAnswer, isAnimatorCode, isRightAnswer, MAX_ANSWER_LENGTH, normalizeAnswer } from './answer'

describe('normalizeAnswer', () => {
  it('ignores case, accents and outer spaces for letters, and squeezes inner spaces', () => {
    expect(normalizeAnswer('  Fantôme   du  chef ', 'letters')).toBe('FANTOME DU CHEF')
  })
  it('turns typographic apostrophes into plain ones', () => {
    expect(normalizeAnswer('Toile d’araignée', 'letters')).toBe("TOILE D'ARAIGNEE")
  })
  it('only trims digits, keeping leading zeros', () => {
    expect(normalizeAnswer(' 0472 ', 'digits')).toBe('0472')
  })
})

describe('isRightAnswer', () => {
  const word = { kind: 'letters', value: 'Fantôme' } as const
  const code = { kind: 'digits', value: '0472' } as const
  it('accepts a word typed without accent, in capitals', () => {
    expect(isRightAnswer('FANTOME', word)).toBe(true)
  })
  it('rejects another word', () => {
    expect(isRightAnswer('FANTOMES', word)).toBe(false)
  })
  it('requires leading zeros on codes', () => {
    expect(isRightAnswer('0472', code)).toBe(true)
    expect(isRightAnswer('472', code)).toBe(false)
  })
  it('never accepts an empty answer', () => {
    expect(isRightAnswer('   ', { kind: 'letters', value: ' ' })).toBe(false)
  })
})

describe('appendToAnswer', () => {
  it('adds a character', () => {
    expect(appendToAnswer('CHA', 'T', 'letters')).toBe('CHAT')
  })
  it('stops at the maximum length', () => {
    const full = '1'.repeat(MAX_ANSWER_LENGTH.digits)
    expect(appendToAnswer(full, '2', 'digits')).toBe(full)
    expect(MAX_ANSWER_LENGTH).toEqual({ digits: 12, letters: 24 })
  })
  it('refuses a leading space or two spaces in a row', () => {
    expect(appendToAnswer('', ' ', 'letters')).toBe('')
    expect(appendToAnswer('TARTE ', ' ', 'letters')).toBe('TARTE ')
  })
})

describe('isAnimatorCode', () => {
  it('accepts only the exact code, leading zero included', () => {
    expect(isAnimatorCode('0427', '0427')).toBe(true)
    expect(isAnimatorCode('427', '0427')).toBe(false)
    expect(isAnimatorCode('', '0427')).toBe(false)
  })
})
