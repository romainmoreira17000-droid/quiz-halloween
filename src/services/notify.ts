/** @file Gets the animator's attention: two beeps and a vibration (Android; iPhones cannot vibrate from a page). */
import { playAlertSound, type AudioContextFactory } from './sound'

/** Two strong buzzes, felt in a pocket. */
export const ALERT_VIBRATION = [300, 150, 300]

/**
 * Rings and vibrates once. Never throws.
 * @param createContext Audio context factory, replaced in tests.
 */
export function alertAnimator(createContext?: AudioContextFactory): void {
  playAlertSound(createContext)
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(ALERT_VIBRATION)
  } catch {
    // Some browsers throw instead of ignoring; the beeps and the banner remain.
  }
}
