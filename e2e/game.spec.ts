/** @file Critical paths of a game on a tablet: entrance, every challenge, padlock, and time running out. */
import { test, expect } from '@playwright/test'
import { enterRestaurant, setUpTablet, typeAnswer } from './typing.js'

// Sample quiz.yaml: what the children type on each step, and the digit it earns.
const STEPS = [['13', 4], ['CRAPAUD', 7], ['0472', 2], ['1832', 9], ["TOILE D'ARAIGNEE", 0], ['CITROUILLE', 5]] as const

test('a group enters the restaurant, solves every challenge, then opens the padlock', async ({ page }) => {
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Une lettre sous la porte' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveCount(0)
  await typeAnswer(page, 'CHAT')
  await expect(page.getByRole('alert')).toBeVisible()
  await typeAnswer(page, 'FANTOME')

  await expect(page.getByRole('heading', { name: 'La crypte' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveText('90:00')
  await typeAnswer(page, '12')
  await expect(page.getByRole('alert')).toBeVisible()

  for (const [i, [answer, digit]] of STEPS.entries()) {
    await expect(page.getByText(`Étape ${i + 1} sur 6`)).toBeVisible()
    await typeAnswer(page, answer)
    await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
    await page.getByRole('button', { name: i === STEPS.length - 1 ? 'Continuer' : 'Étape suivante' }).click()
  }

  // Padlock code of the sample quiz: steps in order 3, 1, 6, 2, 5, 4.
  const CODE = [2, 4, 5, 7, 0, 9]
  await expect(page.getByRole('heading', { name: 'La porte du restaurant hanté' })).toBeVisible()
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
  await setUpTablet(page, 'Sorcières')
  await enterRestaurant(page)

  const clock = page.getByRole('timer')
  await expect(clock).toHaveText('90:00')
  await page.clock.fastForward('01:31:00')
  await expect(clock).toHaveText('-01:00')
  await expect(clock).toHaveClass(/clock--overtime/)

  await typeAnswer(page, '13')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 4')
})
