/** @file The bronze padlocks: the final lock fits a phone, and the victory plunge never hides the text nor blocks a tap. */
import { test, expect, type Page } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

/** Zombies miss every challenge: an animator gives each digit on « Temps écoulé », then the padlock shows. */
async function reachPadlock(page: Page): Promise<void> {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Zombies')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  for (let slot = 0; slot < 6; slot++) {
    await page.clock.fastForward('15:00')
    await expect(page.getByRole('heading', { name: 'Temps écoulé : appelez un animateur' })).toBeVisible()
    await typeAnswer(page, '2710')
    await page.getByRole('button', { name: 'Continuer' }).click()
  }
  await expect(page.getByRole('heading', { name: 'La porte du restaurant des ombres' })).toBeVisible()
}

/** Dials the code of the sample quiz and opens. */
async function openPadlock(page: Page): Promise<void> {
  for (const [i, digit] of [8, 6, 9, 3, 9, 4].entries()) {
    for (let n = 0; n < digit; n++) await page.getByRole('button', { name: `Chiffre ${i + 1} : augmenter` }).click()
  }
  await page.getByRole('button', { name: 'Ouvrir' }).click()
}

test('the final padlock and its six dials fit a 360 px phone without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await reachPadlock(page)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('with reduced motion, the victory shows its text at once and the plunge layer is gone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await reachPadlock(page)
  await openPadlock(page)
  await expect(page.getByRole('heading', { name: 'La porte du restaurant des ombres est ouverte !' })).toBeVisible()
  await expect(page.locator('.victory-lock-3d')).toHaveCSS('opacity', '0')
  // The invisible layer ends at 14× its size, over the whole screen: a tap on ↺ must still reach ↺.
  const tapped = await page.locator('.reset-button').evaluate((button) => {
    const { left, top, width, height } = button.getBoundingClientRect()
    return document.elementFromPoint(left + width / 2, top + height / 2)?.closest('button') === button
  })
  expect(tapped).toBe(true)
})
