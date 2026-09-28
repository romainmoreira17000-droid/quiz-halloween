/** @file The challenge screens fit a 810×1080 tablet without scrolling, with the digits and the letters keyboards. */
import { test, expect } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

// Each team starts on its own challenge: every title (some wrap on two lines) with both keyboards.
const FIRST_CHALLENGES = [
  ['Sorcières', 'La galerie des portraits'], ['Zombies', 'La table hantée'], ['Fantômes', 'Le cimetière'],
  ['Loups-garous', 'Les saveurs hantées'], ['Squelettes', 'Les toilettes scientifiques'], ['Momies', 'Invisible mais visible'],
] as const
for (const [team, title] of FIRST_CHALLENGES) {
  test(`the « ${title} » screen fits the tablet without scrolling`, async ({ page }) => {
    await page.goto('./')
    await setUpTablet(page, team)
    await page.getByRole('button', { name: 'Commencer', exact: true }).click()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    // The last challenge of the example quiz has no hint, hence no hint button.
    if (title !== 'Invisible mais visible') await expect(page.getByRole('button', { name: /^Indice dans/ })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('the step screen still fits the tablet once the three hints are out', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await page.clock.fastForward('11:00')
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
