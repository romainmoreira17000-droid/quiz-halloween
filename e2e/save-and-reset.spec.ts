/** @file Critical paths of sprint 6: resume after a reload, and the animator's reset. */
import { test, expect, type Page } from '@playwright/test'
import { enterRestaurant, setUpTablet, typeAnswer } from './typing.js'

test('the game resumes at the same step after a reload', async ({ page }) => {
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await enterRestaurant(page)
  await typeAnswer(page, '13')
  await page.getByRole('button', { name: 'Étape suivante' }).click()
  await expect(page.getByText('Étape 2 sur 6')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Étape 2 sur 6')).toBeVisible()
  await expect(page.getByRole('timer')).toBeVisible()
})

test('the entrance message is still there after a reload, with no clock', async ({ page }) => {
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Une lettre sous la porte' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Une lettre sous la porte' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveCount(0)
})

test('a 3-second press on the reset icon, then confirming, restarts the game', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await enterRestaurant(page)
  await typeAnswer(page, '13')

  await holdResetIcon(page)
  const dialog = page.getByRole('dialog', { name: 'Recommencer la partie ?' })
  await dialog.getByRole('button', { name: 'Recommencer', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible()
})

async function holdResetIcon(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Recommencer la partie (appui long)' }).hover()
  await page.mouse.down()
  await page.clock.runFor(3000)
  await page.mouse.up()
}

test('a reset keeps the team of the tablet', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Momies')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await holdResetIcon(page)
  await page.getByRole('dialog', { name: 'Recommencer la partie ?' })
    .getByRole('button', { name: 'Recommencer', exact: true }).click()
  await expect(page.getByText('Équipe des Momies')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Équipe des Momies')).toBeVisible()
})

test('changing the team asks for the animator code again', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Momies')
  await holdResetIcon(page)
  await page.getByRole('button', { name: 'Changer d’équipe' }).click()
  await expect(page.getByRole('heading', { name: 'Réglage de la tablette' })).toBeVisible()
  await setUpTablet(page, 'Fantômes')
  await expect(page.getByText('Équipe des Fantômes')).toBeVisible()
})
