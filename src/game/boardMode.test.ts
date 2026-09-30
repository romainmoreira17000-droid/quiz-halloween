/** @file Tests for the animator board address. */
import { isBoardMode } from './boardMode'

describe('isBoardMode', () => {
  it('is on with ?animateur, with or without a value', () => {
    expect(isBoardMode('?animateur')).toBe(true)
    expect(isBoardMode('?test&animateur=1')).toBe(true)
  })
  it('is off otherwise', () => {
    expect(isBoardMode('')).toBe(false)
    expect(isBoardMode('?test')).toBe(false)
  })
})
