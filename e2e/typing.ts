/** @file Types an answer on the in-app keypad or letter keyboard, then taps Valider. */
import type { Page } from '@playwright/test'

const KEY_NAMES: Readonly<Record<string, string>> = { ' ': 'Espace', "'": 'Apostrophe', '-': 'Tiret' }

/**
 * @param page Playwright page showing an answer keyboard.
 * @param text Answer in capitals (letters) or digits.
 */
export async function typeAnswer(page: Page, text: string): Promise<void> {
  for (const char of text) await page.getByRole('button', { name: KEY_NAMES[char] ?? char, exact: true }).click()
  await page.getByRole('button', { name: 'Valider', exact: true }).click()
}

/**
 * Sets the tablet up as an animator would: animator code of the sample quiz, then the team.
 * @param page Playwright page showing the setup screen.
 * @param team Team name from quiz.yaml.
 */
export async function setUpTablet(page: Page, team: string): Promise<void> {
  await typeAnswer(page, '2710')
  await page.getByRole('button', { name: team, exact: true }).click()
}
