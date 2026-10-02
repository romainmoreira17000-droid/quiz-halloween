/** @file Installed app: a long press on its icon offers the animator board, the icon itself still opens the game. */
import { test, expect } from '@playwright/test'

interface Manifest { start_url: string; shortcuts?: { name: string; url: string; icons?: { src: string }[] }[] }

test('the app manifest offers a « Tableau animateur » shortcut that opens the board', async ({ page, request }) => {
  const manifest = await (await request.get('manifest.webmanifest')).json() as Manifest
  expect(manifest.start_url).toBe('/quiz-halloween/')
  const shortcut = manifest.shortcuts?.find((s) => s.name === 'Tableau animateur')
  expect(shortcut?.url).toBe('/quiz-halloween/?animateur')
  // Each icon of the shortcut must exist, or Android shows a blank one.
  for (const icon of shortcut?.icons ?? []) expect((await request.get(icon.src)).ok()).toBe(true)
  await page.goto(shortcut!.url)
  await expect(page.getByLabel('Code de soirée')).toBeVisible()
})
