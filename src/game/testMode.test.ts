/** @file Tests for the test mode switch read from the address. */
import { isTestMode } from './testMode'

describe('isTestMode', () => {
  it('is on with ?test, with or without a value', () => {
    expect(isTestMode('?test')).toBe(true)
    expect(isTestMode('?test=1')).toBe(true)
    expect(isTestMode('?a=b&test')).toBe(true)
  })
  it('is off without it', () => {
    expect(isTestMode('')).toBe(false)
    expect(isTestMode('?testing')).toBe(false)
    expect(isTestMode('?a=test')).toBe(false)
  })
})
