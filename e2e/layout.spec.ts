/** @file The challenge screens fit a 810×1080 tablet without scrolling (every answer of the quiz is typed on the keypad). */
import { test, expect } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

// Each team starts on its own rotating challenge: every title (some wrap on two lines).
const FIRST_CHALLENGES = [
  ['Sorcières', 'La galerie des portraits'], ['Zombies', "L'addition"], ['Fantômes', 'Le cimetière'],
  ['Loups-garous', 'Le jackpot funèbre'], ['Squelettes', 'Les toilettes scientifiques'],
] as const
for (const [team, title] of FIRST_CHALLENGES) {
  test(`the « ${title} » screen fits the tablet without scrolling`, async ({ page }) => {
    await page.goto('./')
    await setUpTablet(page, team)
    await page.getByRole('button', { name: 'Commencer', exact: true }).click()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Indice dans/ })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('the common final screen, with its hint button, fits the tablet without scrolling', async ({ page }) => {
  await page.goto('./?test')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  for (const answer of ['6', '3', '8', '9', '9']) {
    await typeAnswer(page, answer)
    await page.getByRole('button', { name: 'Épreuve suivante' }).click()
  }
  await expect(page.getByRole('heading', { name: 'Invisible mais visible' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Indice dans/ })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the step screen still fits the tablet once the three hints are out', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await page.clock.fastForward('13:00')
  await expect(page.getByRole('button', { name: 'Voir les indices (3/3)' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the waiting screen, with its message, fits the tablet without scrolling', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await typeAnswer(page, '6')
  await page.clock.fastForward('00:05')
  await expect(page.getByText('Profitez-en pour déguster ce qui se trouve sur la table !')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  expect(overflow).toBeLessThanOrEqual(0)
})
