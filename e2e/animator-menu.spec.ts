/** @file Animator menu: from the reset icon, with the animator code, an animator helps a stuck group. */
import { test, expect, type Page } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

/** Long press on ↺, « Menu animateur », then the animator code of the sample quiz in the window. */
async function openMenu(page: Page): Promise<void> {
  const icon = page.getByRole('button', { name: 'Recommencer la partie (appui long)' })
  await icon.hover()
  await page.mouse.down()
  await page.clock.fastForward(3000)
  await page.mouse.up()
  await page.getByRole('button', { name: 'Menu animateur' }).click()
  const dialog = page.getByRole('dialog')
  for (const key of ['2', '7', '1', '0', 'Valider']) await dialog.getByRole('button', { name: key, exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Menu animateur' })).toBeVisible()
}

test('an animator unblocks, shows the hint, solves the challenge and reads the answers', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'La galerie des portraits' })).toBeVisible()

  await typeAnswer(page, '99')
  await expect(page.getByLabel('Réponse tapée')).toHaveText(/^Nouvelle réponse possible dans/)
  await openMenu(page)
  await page.getByRole('button', { name: 'Débloquer la saisie' }).click()
  await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled()

  await openMenu(page)
  await page.getByRole('button', { name: 'Débloquer l’indice suivant (1/3)' }).click()
  await page.getByRole('button', { name: 'Voir l’indice (1/3)' }).click()
  await expect(page.getByRole('dialog', { name: 'Indices' })).toContainText('La réponse est un nombre pair.')
  await page.getByRole('button', { name: 'Fermer' }).click()

  await openMenu(page)
  await page.getByRole('button', { name: 'Voir les solutions' }).click()
  await expect(page.getByRole('list', { name: 'Solutions' })).toContainText('La galerie des portraits')
  await expect(page.getByText('Code du cadenas : 8 6 5 7 0 9')).toBeVisible()
  await page.getByRole('button', { name: 'Valider l’épreuve « La galerie des portraits »' }).click()
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 6')
})

test('an animator moves the group on to the next challenge, giving the digit of the unsolved one', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'La galerie des portraits' })).toBeVisible()

  await openMenu(page)
  await page.getByRole('button', { name: 'Passer à l’épreuve suivante' }).click()
  await expect(page.getByText('À faire sur toutes les tablettes, sinon les équipes se croisent.')).toBeVisible()
  await page.getByRole('button', { name: 'Oui, passer à l’épreuve suivante' }).click()
  // « Temps écoulé » would come first if the digit of the skipped challenge were still missing.
  await expect(page.getByRole('heading', { name: 'La table hantée' })).toBeVisible()
  await expect(page.getByText('Temps écoulé')).toHaveCount(0)
})
