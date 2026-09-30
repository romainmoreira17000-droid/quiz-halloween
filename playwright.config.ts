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
    // A fake Supabase address, intercepted by page.route in remote-board.spec.ts: e2e never reach a real server.
    // Variables already set win over .env.local in Vite, so a local .env.local does not leak in.
    env: { VITE_SUPABASE_URL: 'https://board.e2e.test', VITE_SUPABASE_ANON_KEY: 'e2e-anon-key' },
  },
})
