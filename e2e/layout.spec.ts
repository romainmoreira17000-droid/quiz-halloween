/** @file The challenge screens fit a 810×1080 tablet without scrolling, with the digits and the letters keyboards. */
import { test, expect } from '@playwright/test'
import { setUpTablet } from './typing.js'

// The Sorcières start on a digits challenge, the Zombies on a letters one.
for (const [team, title] of [['Sorcières', 'La crypte'], ['Zombies', 'Le chaudron']] as const) {
  test(`the « ${title} » screen fits the tablet without scrolling`, async ({ page }) => {
    await page.goto('./')
    await setUpTablet(page, team)
    await page.getByRole('button', { name: 'Commencer', exact: true }).click()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Indice dans/ })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}
