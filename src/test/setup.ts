/** @file Vitest global setup: adds jest-dom matchers and clears localStorage between tests. */
import '@testing-library/jest-dom/vitest'

// A game saved by one test must never be resumed by the next one.
afterEach(() => localStorage.clear())
