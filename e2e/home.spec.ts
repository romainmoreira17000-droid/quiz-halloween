/** @file Smoke test: the deployed bundle loads under the Pages base path. */
import { test, expect } from '@playwright/test'

test('home page shows the quiz title', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Le manoir hanté' })).toBeVisible()
})

test('bundled fonts are loaded (no Google Fonts needed offline)', async ({ page }) => {
  await page.goto('./')
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''))
  })
  expect(loaded).toEqual(expect.arrayContaining(['Alegreya', 'IM Fell English SC']))
})
