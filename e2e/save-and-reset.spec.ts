/** @file Critical paths around the tablet: resume after a reload, reset, change of team. */
import { test, expect, type Page } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

test('the game resumes on the same challenge after a reload', async ({ page }) => {
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await typeAnswer(page, '13')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'La crypte' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 4')
  await expect(page.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toBeVisible()
})

test('a 3-second press on the reset icon, then the animator code, restarts the game', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await typeAnswer(page, '13')

  await holdResetIcon(page)
  await confirmReset(page)

  await expect(page.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible()
})

/** « Recommencer », then the animator code of the sample quiz, asked while a game is under way. */
async function confirmReset(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Recommencer la partie ?' })
  await dialog.getByRole('button', { name: 'Recommencer', exact: true }).click()
  for (const key of ['2', '7', '1', '0', 'Valider']) await dialog.getByRole('button', { name: key, exact: true }).click()
}

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
  await confirmReset(page)
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
