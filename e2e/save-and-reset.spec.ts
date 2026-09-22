/** @file Critical paths of sprint 6: resume after a reload, and the animator's reset. */
import { test, expect } from '@playwright/test'
import { enterRestaurant, typeAnswer } from './typing.js'

test('the game resumes at the same step after a reload', async ({ page }) => {
  await page.goto('./')
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
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Une lettre sous la porte' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Une lettre sous la porte' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveCount(0)
})

test('a 3-second press on the reset icon, then confirming, restarts the game', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await enterRestaurant(page)
  await typeAnswer(page, '13')

  await page.getByRole('button', { name: 'Recommencer la partie (appui long)' }).hover()
  await page.mouse.down()
  await page.clock.runFor(3000)
  await page.mouse.up()
  const dialog = page.getByRole('dialog', { name: 'Recommencer la partie ?' })
  await dialog.getByRole('button', { name: 'Recommencer', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible()
})
