/** @file A team is blocked for a minute after a wrong answer, then reads its three hints at 5, 8 and 11 minutes. */
import { test, expect } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

test('a wrong answer blocks the keyboard for a minute and the three hints unlock at 5, 8 and 11 minutes', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'La table hantée' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Indice dans (05:00|04:5\d)$/ })).toBeDisabled()

  await typeAnswer(page, 'CHAT')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Réponse tapée')).toHaveText(/^Nouvelle réponse possible dans (01:00|00:5\d)$/)
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeDisabled()
  await page.clock.fastForward('01:00')
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeEnabled()

  await page.clock.fastForward('04:00')
  await page.getByRole('button', { name: 'Voir l’indice (1/3)' }).click()
  const dialog = page.getByRole('dialog', { name: 'Indices' })
  await expect(dialog.getByRole('listitem')).toHaveText(['Un animal qui vit près des mares.'])
  await expect(dialog).toContainText(/Indice suivant dans (03:00|02:5\d)/)
  // The open window follows the clock.
  await page.clock.fastForward('03:00')
  await expect(dialog.getByRole('listitem')).toHaveCount(2)
  await dialog.getByRole('button', { name: 'Fermer' }).click()
  await expect(dialog).toHaveCount(0)
  await page.clock.fastForward('03:00')
  await page.getByRole('button', { name: 'Voir les indices (3/3)' }).click()
  await expect(dialog.getByRole('listitem')).toHaveCount(3)
  await expect(dialog).not.toContainText('Indice suivant')
  await dialog.getByRole('button', { name: 'Fermer' }).click()

  await typeAnswer(page, 'CRAPAUD')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 7')
  await expect(page.getByRole('button', { name: /indice/i })).toHaveCount(0)
})
