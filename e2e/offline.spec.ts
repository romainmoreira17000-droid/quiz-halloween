/** @file Weak wifi in the room: once loaded, a whole game (rotation, common final, padlock) plays without any network. */
import { test, expect } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

// The Sorcières rotate through challenges 1 to 5 of quiz.yaml, then play the final.
const ROTATION = [
  ['La galerie des portraits', '6'], ["L'addition", '3'], ['Le cimetière', '8'],
  ['Le jackpot funèbre', '9'], ['Le laboratoire machiavélique', '9'],
] as const
// Padlock order 3, 1, 5, 2, 4, 6.
const CODE = [8, 6, 9, 3, 9, 4]

test('a whole game plays offline once the app was loaded', async ({ page, context }) => {
  await page.goto('./?test')
  // The service worker must hold the app before the network goes away, as on a tablet opened before the evening.
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await context.setOffline(true)
  await page.reload()

  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  const skip = page.getByRole('button', { name: 'Épreuve suivante' })
  for (const [title, answer] of ROTATION) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await typeAnswer(page, answer)
    await expect(page.getByRole('status')).toHaveText(/^Chiffre trouvé/)
    await skip.click()
  }
  await expect(page.getByRole('heading', { name: 'Invisible mais visible' })).toBeVisible()
  await typeAnswer(page, '4')
  await page.getByRole('dialog', { name: 'Bravo !' }).click()
  for (const [i, digit] of CODE.entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('heading', { name: 'La porte du restaurant des ombres est ouverte !' })).toBeVisible()
})
