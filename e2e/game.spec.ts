/** @file Critical paths of a game on a tablet: full run to the victory with mistakes, and time running out. */
import { test, expect } from '@playwright/test'

// Solutions of the sample quiz.yaml, in step order.
const SOLUTIONS = [4, 7, 2, 9, 0, 5]

test('a group plays every step, then opens the padlock after one wrong code', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'La crypte' })).toBeVisible()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()

  for (const [i, digit] of SOLUTIONS.entries()) {
    await expect(page.getByText(`Étape ${i + 1} sur 6`)).toBeVisible()
    await page.getByRole('button', { name: String(digit), exact: true }).click()
    await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
    await page.getByRole('button', { name: i === SOLUTIONS.length - 1 ? 'Continuer' : 'Étape suivante' }).click()
  }

  // Padlock code of the sample quiz: steps in order 3, 1, 6, 2, 5, 4.
  const CODE = [2, 4, 5, 7, 0, 9]
  await expect(page.getByRole('heading', { name: 'La porte du restaurant hanté' })).toBeVisible()
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('alert')).toBeVisible()

  for (const [i, digit] of CODE.entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
    await expect(page.getByLabel(`Chiffre ${i + 1}`, { exact: true })).toHaveText(String(digit))
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('heading', { name: 'La salle du restaurant hanté est ouverte !' })).toBeVisible()
  await expect(page.getByText(/^Temps : \d+ min \d{2} s$/)).toBeVisible()
})

test('the clock goes red and negative once time is up, and the game goes on', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()

  const clock = page.getByRole('timer')
  await expect(clock).toHaveText('90:00')
  await page.clock.fastForward('01:31:00')
  await expect(clock).toHaveText('-01:00')
  await expect(clock).toHaveClass(/clock--overtime/)

  await page.getByRole('button', { name: '4', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 4')
})
