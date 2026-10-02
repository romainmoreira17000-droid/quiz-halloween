/** @file Types an answer on the in-app keypad or letter keyboard, then taps Valider. */
import type { Page } from '@playwright/test'

const KEY_NAMES: Readonly<Record<string, string>> = { ' ': 'Espace', "'": 'Apostrophe', '-': 'Tiret' }

/**
 * @param page Playwright page showing an answer keyboard.
 * @param text Answer in capitals (letters) or digits.
 */
export async function typeAnswer(page: Page, text: string): Promise<void> {
  await arriveIfAsked(page)
  for (const char of text) await page.getByRole('button', { name: KEY_NAMES[char] ?? char, exact: true }).click()
  await page.getByRole('button', { name: 'Valider', exact: true }).click()
}

/**
 * Sets the tablet up as an animator would: animator code of the quiz, then the team.
 * @param page Playwright page showing the setup screen.
 * @param team Team name from quiz.yaml.
 */
export async function setUpTablet(page: Page, team: string): Promise<void> {
  await typeAnswer(page, '1717')
  await page.getByRole('button', { name: team, exact: true }).click()
}

/**
 * Taps « Nous sommes arrivés » when the way to a room is on screen (#90), so the riddle and its keyboard show.
 * Waits for one of the two screens first: right after a slot change the way to the room may not be drawn yet.
 * @param page Playwright page during a game.
 */
export async function arriveIfAsked(page: Page): Promise<void> {
  const arrived = page.getByRole('button', { name: 'Nous sommes arrivés' })
  const keyboard = page.getByRole('button', { name: 'Valider', exact: true })
  await arrived.or(keyboard).first().waitFor()
  if (await arrived.isVisible()) await arrived.click()
}
