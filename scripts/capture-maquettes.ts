/**
 * @file CLI: screenshots every design mockup screen at tablet size (810×1080) for the sprint 3 PR.
 * Output goes to docs/design/captures/<direction>-<screen>.png.
 * Usage: npx tsx scripts/capture-maquettes.ts [direction...]   (default: all directions)
 * Fonts come from Google Fonts, so this needs an internet connection.
 */
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const DIRECTIONS = ['bougie', 'potion', 'lune']
const SCREENS = ['accueil', 'etape', 'cadenas']
const MOCKUPS_DIR = resolve('docs/design/maquettes')
const OUTPUT_DIR = resolve('docs/design/captures')

const requested = process.argv.slice(2)
const unknown = requested.filter((name) => !DIRECTIONS.includes(name))
if (unknown.length > 0) {
  console.error(`Direction(s) inconnue(s) : ${unknown.join(', ')}. Choix possibles : ${DIRECTIONS.join(', ')}.`)
  process.exit(1)
}
const directions = requested.length > 0 ? requested : DIRECTIONS

await mkdir(OUTPUT_DIR, { recursive: true })
const browser = await chromium.launch()
// Reduced motion freezes the flame/bubbles so screenshots are stable from one run to the next.
const page = await browser.newPage({ viewport: { width: 810, height: 1080 }, reducedMotion: 'reduce' })

for (const direction of directions) {
  const url = pathToFileURL(resolve(MOCKUPS_DIR, `${direction}.html`)).href
  for (const screen of SCREENS) {
    await page.goto(`${url}#${screen}`)
    await page.evaluate(() => document.fonts.ready)
    const file = resolve(OUTPUT_DIR, `${direction}-${screen}.png`)
    await page.screenshot({ path: file })
    console.log(`📸 ${direction}-${screen}.png`)
  }
}
await browser.close()
