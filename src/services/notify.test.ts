/** @file Tests for the alert of the animator: sound and vibration. */
import { ALERT_VIBRATION, alertAnimator } from './notify'

afterEach(() => { Reflect.deleteProperty(navigator, 'vibrate') })

describe('alertAnimator', () => {
  it('vibrates when the phone can', () => {
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    alertAnimator(() => null)
    expect(vibrate).toHaveBeenCalledWith(ALERT_VIBRATION)
  })
  it('never throws without vibration nor sound', () => {
    expect(() => alertAnimator(() => null)).not.toThrow()
    Object.defineProperty(navigator, 'vibrate', { value: () => { throw new Error('no') }, configurable: true })
    expect(() => alertAnimator(() => null)).not.toThrow()
  })
})
