/** @file Critical path of an evening: a team plays its rotation, gets help on a missed challenge, and opens the padlock. */
import { test, expect, type Page } from '@playwright/test'
import { arriveIfAsked, setUpTablet, typeAnswer } from './typing.js'

// Real quiz.yaml, by challenge number: title, what the children type, digit earned.
const CHALLENGES: Record<number, readonly [string, string, number]> = {
  1: ['La galerie des portraits', '6', 6], 2: ["L'addition", '3', 3], 3: ['Le cimetière', '8', 8],
  4: ['Le jackpot funèbre', '9', 9], 5: ['Les toilettes scientifiques', '9', 9], 6: ['Invisible mais visible', '4', 4],
}
const nextSlot = (page: Page) => page.clock.fastForward('15:00')

test('the Zombies play challenges 2 to 5 and 1, then the common final, get help on one, and open the padlock', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await expect(page.getByText('Équipe des Zombies')).toBeVisible()
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()

  // Slot 1: the tablet sends the group to challenge 2 (its riddle only once there), solved after a wrong try.
  await expect(page.getByText('Maintenant, dirigez-vous vers :')).toBeVisible()
  await expect(page.getByRole('heading', { name: "L'addition" })).toBeVisible()
  await page.getByRole('button', { name: 'Nous sommes arrivés' }).click()
  await expect(page.getByRole('timer', { name: 'Temps restant pour l’épreuve' })).toHaveText('15:00')
  await expect(page.getByRole('timer', { name: 'Temps total restant' })).toHaveText('90:00')
  await typeAnswer(page, '1')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Réponse tapée')).toHaveText(/^Nouvelle réponse possible dans (01:00|00:5\d)$/)
  await page.clock.fastForward('01:00')
  await typeAnswer(page, '3')
  await expect(page.getByRole('status')).toHaveText('Chiffre trouvé : 3')
  await expect(page.getByText(/^Changement d’épreuve dans \d\d:\d\d$/)).toBeVisible()
  await expect(page.locator('.next-step')).toHaveText('Prochaine épreuve : Le cimetière')
  // The « Bravo ! » comes just after the pin falls and goes away on its own, leaving the waiting message.
  await page.clock.fastForward('00:02')
  await expect(page.getByRole('dialog', { name: 'Bravo !' })).toContainText('3')
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
  await typeAnswer(page, '1717')
  await expect(page.getByRole('status')).toHaveText('Chiffre de l’épreuve : 8')
  await page.getByRole('button', { name: 'Continuer' }).click()

  // Slots 3 to 5: challenges 4, 5, then 1; the waiting screen of slot 5 announces the final.
  for (const number of [4, 5, 1]) {
    const [title, answer, digit] = CHALLENGES[number]
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await typeAnswer(page, answer)
    await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
    if (number === 1) await expect(page.getByText(/^L’épreuve finale dans \d\d:\d\d$/)).toBeVisible()
    await nextSlot(page)
  }

  // Slot 6: the common final, with its hints like the others; once found, the « Bravo ! » then the padlock, before the slot ends.
  const [title, answer, digit] = CHALLENGES[6]
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await arriveIfAsked(page)
  await expect(page.getByRole('button', { name: /^Indice dans/ })).toBeVisible()
  await typeAnswer(page, answer)
  await expect(page.getByRole('status')).toHaveText(`Chiffre trouvé : ${digit}`)
  await page.clock.fastForward('00:02')
  await expect(page.getByRole('dialog', { name: 'Bravo !' })).toContainText(String(digit))
  await page.clock.fastForward('00:03')

  // Padlock code of the quiz: challenges in order 3, 1, 5, 2, 4, 6.
  const CODE = [8, 6, 9, 3, 9, 4]
  await expect(page.getByRole('heading', { name: 'La porte du restaurant des ombres' })).toBeVisible()
  for (const [i, digit] of CODE.entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
    await expect(page.getByLabel(`Chiffre ${i + 1}`, { exact: true })).toHaveText(String(digit))
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
  await expect(page.getByRole('heading', { name: /Bravo ! Vous avez déchiffré toutes les épreuves/ })).toBeVisible()
  await expect(page.getByText('Rendez-vous à la porte du restaurant !')).toBeVisible()
})
