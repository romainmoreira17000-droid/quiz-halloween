/** @file A team is blocked for a minute after a wrong answer, then reads its hint ten minutes into the slot. */
import { test, expect } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

test('a wrong answer blocks the keyboard for a minute and the hint unlocks after ten minutes', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Le chaudron' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Indice dans (10:00|09:5\d)$/ })).toBeDisabled()

  await typeAnswer(page, 'CHAT')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Réponse tapée')).toHaveText(/^Nouvelle réponse possible dans (01:00|00:5\d)$/)
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeDisabled()
  await page.clock.fastForward('01:00')
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeEnabled()

  await page.clock.fastForward('09:00')
  await page.getByRole('button', { name: 'Voir l’indice' }).click()
  const dialog = page.getByRole('dialog', { name: 'Indice' })
  await expect(dialog).toContainText('Un animal vert qui fait « croa ».')
  await dialog.getByRole('button', { name: 'Fermer' }).click()
  await expect(dialog).toHaveCount(0)

  await typeAnswer(page, 'CRAPAUD')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 7')
  await expect(page.getByRole('button', { name: /indice/i })).toHaveCount(0)
})
