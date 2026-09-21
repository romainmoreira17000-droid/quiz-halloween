/** @file Critical paths of a game on a tablet: full run with a mistake, and time running out. */
import { test, expect } from '@playwright/test'

// Solutions of the sample quiz.yaml, in step order.
const SOLUTIONS = [4, 7, 2, 9, 0, 5]

test('a group plays every step, with one wrong answer', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Commencer' }).click()

  await expect(page.getByRole('heading', { name: 'La crypte' })).toBeVisible()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()

  for (const [i, digit] of SOLUTIONS.entries()) {
    await expect(page.getByText(`Étape ${i + 1} sur 6`)).toBeVisible()
    await page.getByRole('button', { name: String(digit), exact: true }).click()
    await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
    await page.getByRole('button', { name: i === SOLUTIONS.length - 1 ? 'Continuer' : 'Étape suivante' }).click()
  }

  await expect(page.getByRole('heading', { name: 'Toutes les énigmes sont résolues !' })).toBeVisible()
})

test('the clock goes red and negative once time is up, and the game goes on', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await page.getByRole('button', { name: 'Commencer' }).click()

  const clock = page.getByRole('timer')
  await expect(clock).toHaveText('90:00')
  await page.clock.fastForward('01:31:00')
  await expect(clock).toHaveText('-01:00')
  await expect(clock).toHaveClass(/clock--overtime/)

  await page.getByRole('button', { name: '4', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 4')
})
