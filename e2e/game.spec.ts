/** @file Critical path of an evening: a team plays its rotation, gets help on a missed challenge, and opens the padlock. */
import { test, expect, type Page } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

// Sample quiz.yaml (challenges 1 and 3 are real), by challenge number: title, what the children type, digit earned.
const CHALLENGES: Record<number, readonly [string, string, number]> = {
  1: ['La galerie des portraits', '6', 6], 2: ['La table hantée', 'CRAPAUD', 7], 3: ['Le cimetière', '8', 8],
  4: ['Les saveurs hantées', '1832', 9], 5: ['Les toilettes scientifiques', "TOILE D'ARAIGNEE", 0], 6: ['Invisible mais visible', 'CITROUILLE', 5],
}
const nextSlot = (page: Page) => page.clock.fastForward('15:00')

test('the Zombies play challenges 2 to 6 then 1, get help on one, and open the padlock', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await expect(page.getByText('Équipe des Zombies')).toBeVisible()
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()

  // Slot 1: challenge 2, after a wrong try.
  await expect(page.getByRole('heading', { name: 'La table hantée' })).toBeVisible()
  await expect(page.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveText('15:00')
  await expect(page.getByRole('timer', { name: 'Temps total restant' })).toHaveText('90:00')
  await typeAnswer(page, 'CHAT')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Réponse tapée')).toHaveText(/^Nouvelle réponse possible dans (01:00|00:5\d)$/)
  await page.clock.fastForward('01:00')
  await typeAnswer(page, 'CRAPAUD')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 7')
  await expect(page.getByText(/^Changement d’épreuve dans \d\d:\d\d$/)).toBeVisible()
  // The « Bravo ! » comes just after the pin falls and goes away on its own, leaving the waiting message.
  await page.clock.fastForward('00:02')
  await expect(page.getByRole('dialog', { name: 'Bravo !' })).toContainText('7')
  await page.clock.fastForward('00:03')
  await expect(page.getByRole('dialog', { name: 'Bravo !' })).toBeHidden()
  await expect(page.getByText('Profitez-en pour déguster ce qui se trouve sur la table !')).toBeVisible()

  // Slot 2: challenge 3 is missed; an animator gives its digit at the start of slot 3.
  await nextSlot(page)
  await expect(page.getByRole('heading', { name: 'Le cimetière' })).toBeVisible()
  await nextSlot(page)
  await expect(page.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeVisible()
  await typeAnswer(page, '1111')
  await expect(page.getByRole('alert')).toBeVisible()
  await typeAnswer(page, '2710')
  await expect(page.getByRole('status')).toHaveText('Chiffre de l’épreuve : 8')
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
  const CODE = [8, 6, 5, 7, 0, 9]
  await expect(page.getByRole('heading', { name: 'La porte du restaurant hanté' })).toBeVisible()
  for (const [i, digit] of CODE.entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
    await expect(page.getByLabel(`Chiffre ${i + 1}`, { exact: true })).toHaveText(String(digit))
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('heading', { name: 'La salle du restaurant hanté est ouverte !' })).toBeVisible()
  await expect(page.getByText('Rendez-vous à la porte du restaurant !')).toBeVisible()
})
