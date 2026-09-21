/// <reference types="vitest/config" />
/** @file Vite, PWA and Vitest configuration. */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the site under /<repo>/.
const BASE = '/quiz-halloween/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true },
      manifest: {
        name: 'Quiz Halloween',
        short_name: 'Quiz Halloween',
        description: "Jeu d'énigmes d'Halloween du Centre de Loisirs",
        lang: 'fr',
        theme_color: '#1a120c',
        background_color: '#1a120c',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webp,jpg,woff2}'] },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
})
