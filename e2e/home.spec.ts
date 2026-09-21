/** @file Smoke test: the deployed bundle loads under the Pages base path. */
import { test, expect } from '@playwright/test'

test('home page shows the quiz title', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Quiz Halloween' })).toBeVisible()
})
