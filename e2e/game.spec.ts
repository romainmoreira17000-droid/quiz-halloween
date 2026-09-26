/** @file Critical path of an evening: a team plays its rotation, gets help on a missed challenge, and opens the padlock. */
import { test, expect, type Page } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

// Sample quiz.yaml, by challenge number: title, what the children type, digit earned.
const CHALLENGES: Record<number, readonly [string, string, number]> = {
  1: ['La crypte', '13', 4], 2: ['Le chaudron', 'CRAPAUD', 7], 3: ['La bibliothèque', '0472', 2],
  4: ['Le cimetière', '1832', 9], 5: ['Le grenier', "TOILE D'ARAIGNEE", 0], 6: ['La porte de la cuisine', 'CITROUILLE', 5],
}
const nextSlot = (page: Page) => page.clock.fastForward('15:00')

test('the Zombies play challenges 2 to 6 then 1, get help on one, and open the padlock', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await expect(page.getByText('Équipe des Zombies')).toBeVisible()
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()

  // Slot 1: challenge 2, after a wrong try.
  await expect(page.getByRole('heading', { name: 'Le chaudron' })).toBeVisible()
  await expect(page.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveText('15:00')
  await expect(page.getByRole('timer', { name: 'Temps total restant' })).toHaveText('90:00')
  await typeAnswer(page, 'CHAT')
  await expect(page.getByRole('alert')).toBeVisible()
  await typeAnswer(page, 'CRAPAUD')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 7')
  await expect(page.getByText(/^Changement de salle dans \d\d:\d\d$/)).toBeVisible()

  // Slot 2: challenge 3 is missed; an animator gives its digit at the start of slot 3.
  await nextSlot(page)
  await expect(page.getByRole('heading', { name: 'La bibliothèque' })).toBeVisible()
  await nextSlot(page)
  await expect(page.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeVisible()
  await typeAnswer(page, '1111')
  await expect(page.getByRole('alert')).toBeVisible()
  await typeAnswer(page, '2710')
  await expect(page.getByRole('status')).toHaveText('Chiffre de l’épreuve : 2')
  await page.getByRole('button', { name: 'Continuer' }).click()

  // Slots 3 to 6: challenges 4, 5, 6, then 1.
  for (const number of [4, 5, 6, 1]) {
    const [title, answer, digit] = CHALLENGES[number]
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await typeAnswer(page, answer)
    await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
    await nextSlot(page)
  }

  // Padlock code of the sample quiz: challenges in order 3, 1, 6, 2, 5, 4.
  const CODE = [2, 4, 5, 7, 0, 9]
  await expect(page.getByRole('heading', { name: 'La porte du restaurant hanté' })).toBeVisible()
  for (const [i, digit] of CODE.entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
    await expect(page.getByLabel(`Chiffre ${i + 1}`, { exact: true })).toHaveText(String(digit))
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('heading', { name: 'La salle du restaurant hanté est ouverte !' })).toBeVisible()
  await expect(page.getByText('Rendez-vous à la porte du restaurant !')).toBeVisible()
})
