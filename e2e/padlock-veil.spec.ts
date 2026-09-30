/** @file The padlock recap and hint sit on a dark veil, so they stay readable on the photo backdrop. */
import { test, expect, type Locator } from '@playwright/test'
import { setUpTablet, typeAnswer } from './typing.js'

// The Sorcières play challenges 1 to 6 in order; answers of the sample quiz.yaml.
const ANSWERS = ['6', '3', '8', '9', "TOILE D'ARAIGNEE", 'CITROUILLE']

/** Alpha of the element's background colour (0 when transparent). */
const backgroundAlpha = (locator: Locator) => locator.evaluate((el) => {
  const match = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/)
  const parts = match ? match[1].split(/[\s,/]+/).filter(Boolean) : []
  return parts.length === 4 ? Number(parts[3]) : parts.length === 3 ? 1 : 0
})

test('the padlock recap and hint have a dark veil behind them', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await setUpTablet(page, 'Sorcières')
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  for (const answer of ANSWERS) {
    await typeAnswer(page, answer)
    await expect(page.getByRole('status')).toHaveText(/^Chiffre trouvé/)
    await page.clock.fastForward('15:00')
  }
  const recap = page.getByRole('list', { name: 'Chiffres trouvés' })
  await expect(recap).toBeVisible()
  expect(await backgroundAlpha(recap)).toBeGreaterThanOrEqual(0.6)
  // The padlock hint is optional and the quiz has none until its real text is written.
  const hint = page.locator('.padlock .hint')
  if (await hint.count() > 0) expect(await backgroundAlpha(hint)).toBeGreaterThanOrEqual(0.6)
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflowX).toBeLessThanOrEqual(0)
})
