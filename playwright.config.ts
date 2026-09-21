/** @file Playwright config: runs e2e tests on the production preview, tablet-sized. */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:4173/quiz-halloween/',
    viewport: { width: 810, height: 1080 },
    hasTouch: true,
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/quiz-halloween/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
