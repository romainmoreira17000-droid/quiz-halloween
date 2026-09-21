/** @file Tests for primitive validation helpers. */
import { isObject, isNonEmptyString, isIntInRange, unknownKeyErrors } from './checks'

describe('isObject', () => {
  it('accepts plain objects only', () => {
    expect(isObject({ a: 1 })).toBe(true)
    expect(isObject([])).toBe(false)
    expect(isObject(null)).toBe(false)
    expect(isObject('x')).toBe(false)
  })
})

describe('isNonEmptyString', () => {
  it('rejects empty, blank and non-strings', () => {
    expect(isNonEmptyString('Bou')).toBe(true)
    expect(isNonEmptyString('')).toBe(false)
    expect(isNonEmptyString('   ')).toBe(false)
    expect(isNonEmptyString(4)).toBe(false)
  })
})

describe('isIntInRange', () => {
  it('accepts bounds and rejects floats, strings and out-of-range', () => {
    expect(isIntInRange(0, 0, 9)).toBe(true)
    expect(isIntInRange(9, 0, 9)).toBe(true)
    expect(isIntInRange(10, 0, 9)).toBe(false)
    expect(isIntInRange(-1, 0, 9)).toBe(false)
    expect(isIntInRange(4.5, 0, 9)).toBe(false)
    expect(isIntInRange('4', 0, 9)).toBe(false)
  })
})

describe('unknownKeyErrors', () => {
  it('reports each unknown key with its location prefix', () => {
    expect(unknownKeyErrors({ titre: 'a', solutions: 4 }, ['titre', 'solution'], 'étape 2 : '))
      .toEqual(["étape 2 : « solutions » n'est pas un paramètre connu."])
  })
})
