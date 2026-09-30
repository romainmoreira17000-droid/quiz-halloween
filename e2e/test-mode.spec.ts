/** @file Test mode (`?test`): an animator walks through every challenge up to the padlock without waiting. */
import { test, expect } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

// The Sorcières play challenges 1 to 6 in order; answers of the sample quiz.yaml.
const CHALLENGES = [
  ['La galerie des portraits', '6'], ["L'addition", '3'], ['Le cimetière', '8'],
  ['Le jackpot funèbre', '9'], ['Les toilettes scientifiques', "TOILE D'ARAIGNEE"], ['Invisible mais visible', 'CITROUILLE'],
] as const

test('with ?test, the skip button walks through the rotation up to the padlock', async ({ page }) => {
  await page.goto('./?test')
  await setUpTablet(page, 'Sorcières')
  await expect(page.getByText('Mode test')).toBeVisible()
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  const skip = page.getByRole('button', { name: 'Épreuve suivante' })

  // Challenge 1 is skipped without an answer: « Temps écoulé » still needs the animator code.
  await expect(page.getByRole('heading', { name: CHALLENGES[0][0] })).toBeVisible()
  // The step screen still fits the tablet with the test mode controls.
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0)
  await skip.click()
  await expect(page.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeVisible()
  await expect(skip).toBeHidden()
  await typeAnswer(page, '2710')
  await page.getByRole('button', { name: 'Continuer' }).click()

  for (const [title, answer] of CHALLENGES.slice(1)) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await typeAnswer(page, answer)
    await expect(page.getByRole('status')).toHaveText(/^Chiffre trouvé/)
    await skip.click()
  }
  await expect(page.getByRole('list', { name: 'Chiffres trouvés' })).toBeVisible()
  await expect(skip).toBeHidden()
  await expect(page.getByText('Mode test')).toBeVisible()
})

test('without ?test, there is no test mode', async ({ page }) => {
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: CHALLENGES[0][0] })).toBeVisible()
  await expect(page.getByText('Mode test')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Épreuve suivante' })).toBeHidden()
})
