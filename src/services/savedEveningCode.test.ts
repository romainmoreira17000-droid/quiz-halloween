/** @file Tests for the evening code kept on the device. */
import { EVENING_CODE_KEY, loadEveningCode, saveEveningCode } from './savedEveningCode'

describe('savedEveningCode', () => {
  it('has no code at first', () => {
    expect(loadEveningCode()).toBeNull()
  })
  it('keeps the code without the spaces around it', () => {
    saveEveningCode('  CITROUILLE-42 ')
    expect(localStorage.getItem(EVENING_CODE_KEY)).toBe('CITROUILLE-42')
    expect(loadEveningCode()).toBe('CITROUILLE-42')
  })
  it('forgets the code when saved empty', () => {
    saveEveningCode('CITROUILLE-42')
    saveEveningCode('   ')
    expect(loadEveningCode()).toBeNull()
  })
  it('never throws when the storage is refused', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(loadEveningCode()).toBeNull()
    spy.mockRestore()
  })
})
