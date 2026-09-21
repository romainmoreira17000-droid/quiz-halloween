# Sprint 1 — Squelette, CI, déploiement Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployable Vite + React + TS PWA skeleton for `quiz-halloween`, public GitHub repo with ramdam17 invited, CI on PRs and automatic GitHub Pages deploy from `main`.

**Architecture:** Static SPA, no backend. Vite builds to `dist/` with `base: '/quiz-halloween/'`. vite-plugin-pwa generates the manifest, service worker and PNG icons (from `public/icon.svg`). GitHub Actions: `ci.yml` on PRs, `deploy.yml` on push to `main`.

**Tech Stack:** Node 24, Vite 8, React 19, TypeScript, vite-plugin-pwa 1.3 + @vite-pwa/assets-generator, Vitest 5 + Testing Library + jsdom, Playwright 1.63 (chromium).

**Spec:** `docs/superpowers/specs/2026-09-21-quiz-halloween-design.md`

## Global Constraints

- Code, identifiers, commit messages in English; all UI text in French.
- Max 200 lines per source file. JSDoc `@file` header on every module, JSDoc on every export.
- No `any`. No Supabase, no backend, no personal data.
- Repo: `romainmoreira17000-droid/quiz-halloween`, **public**. Collaborator `ramdam17` (push).
- Site URL: `https://romainmoreira17000-droid.github.io/quiz-halloween/`.
- Mobile/tablet first: big touch targets (min 64px), strong contrast.
- No commit on `main` (enforced by the `garde-fous` hook): `main` holds only the spec commit; the scaffold goes through branch `chore/scaffold` + PR, like every sprint.

---

### Task 1: Vite scaffold, test tooling, PWA

**Files:**
- Create (via create-vite, then moved to project root): `package.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `src/main.tsx`, `src/App.tsx`, `.gitignore`
- Create: `src/test/setup.ts`, `src/App.test.tsx`, `public/icon.svg`, `pwa-assets.config.ts`
- Modify: `README.md` (currently empty)

**Interfaces:**
- Produces: `App` default export in `src/App.tsx` rendering an `<h1>` “Quiz Halloween”. npm scripts `dev`, `build`, `preview`, `test`, `test:run`, `test:e2e`, `typecheck`.

- [ ] **Step 1: Scaffold in a temp folder and move into the project root** (the root already holds `.git`, `docs/`, `README.md`, so create-vite cannot target it directly)

```bash
cd "$TEMP" && rm -rf qh-scaffold && npm create vite@latest qh-scaffold -- --template react-ts --no-interactive
cp -r "$TEMP/qh-scaffold/." "/c/Users/romain.moreira/Desktop/MES APPS/Quizz Halloween/" && rm -rf "$TEMP/qh-scaffold"
cd "/c/Users/romain.moreira/Desktop/MES APPS/Quizz Halloween"
npm pkg set name=quiz-halloween
npm install
npm install -D vite-plugin-pwa @vite-pwa/assets-generator
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install -D @playwright/test && npx playwright install chromium
```
Delete template leftovers: `src/App.css`, `src/assets/`, `public/vite.svg`; empty `src/index.css` (styles come in sprint 3). Remove their imports.

- [ ] **Step 2: npm scripts**

```bash
npm pkg set scripts.test="vitest" scripts.test:run="vitest run" scripts.test:coverage="vitest run --coverage" scripts.test:e2e="playwright test" scripts.typecheck="tsc -b"
```

- [ ] **Step 3: Write the failing component test** — `src/test/setup.ts`:

```ts
/** @file Vitest global setup: adds jest-dom matchers. */
import '@testing-library/jest-dom/vitest'
```

`src/App.test.tsx`:
```tsx
/** @file Smoke test for the root component. */
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('shows the quiz title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Quiz Halloween' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Configure Vite/Vitest/PWA** — `vite.config.ts`:

```ts
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
        theme_color: '#1a0f2e',
        background_color: '#1a0f2e',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webp,jpg}'] },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
})
```

`pwa-assets.config.ts`:
```ts
/** @file Generates PWA PNG icons from public/icon.svg at build time. */
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({ preset: minimal2023Preset, images: ['public/icon.svg'] })
```

`public/icon.svg`: a simple orange pumpkin on dark purple (`#1a0f2e`), 512×512 viewBox.

Add `"types": ["vitest/globals", "@testing-library/jest-dom"]` to `compilerOptions` of `tsconfig.app.json`; add `"pwa-assets.config.ts"` to `include` of `tsconfig.node.json`. In `index.html`: `lang="fr"`, `<title>Quiz Halloween</title>`, `<meta name="theme-color" content="#1a0f2e">`.

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run` — Expected: FAIL, heading “Quiz Halloween” not found.

- [ ] **Step 6: Minimal `src/App.tsx`**

```tsx
/** @file Root component of the Halloween quiz. */

/**
 * Root of the application.
 * @returns The current game screen.
 */
export default function App() {
  return (
    <main>
      <h1>Quiz Halloween</h1>
    </main>
  )
}
```

- [ ] **Step 7: Verify** — `npm run test:run` PASS, `npm run typecheck` OK, `npm run build` OK and `dist/manifest.webmanifest` + `dist/sw.js` exist.

### Task 2: Playwright smoke test (tablet viewport)

**Files:** Create `playwright.config.ts`, `e2e/home.spec.ts`. Modify `.gitignore` (add `test-results/`, `playwright-report/`).

- [ ] **Step 1: Config** — `playwright.config.ts`:

```ts
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
```

- [ ] **Step 2: Test** — `e2e/home.spec.ts`:

```ts
/** @file Smoke test: the deployed bundle loads under the Pages base path. */
import { test, expect } from '@playwright/test'

test('home page shows the quiz title', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Quiz Halloween' })).toBeVisible()
})
```

- [ ] **Step 3: Run** `npm run test:e2e` — Expected: 1 passed.

### Task 3: GitHub workflows and PR template

**Files:** Create `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/pull_request_template.md`.

- [ ] **Step 1: `ci.yml`**

```yaml
name: CI
on:
  pull_request:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test:run
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

- [ ] **Step 2: `deploy.yml`**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: PR template** (French): sections Contexte / Changements / Comment tester / Capture ; checkboxes: tests verts, build OK, `npm run valider` OK, fichiers ≤ 200 lignes, JSDoc présente.

### Task 4: Project docs (CLAUDE.md, ETAT.md, README.md)

- [ ] `CLAUDE.md`: purpose, users, stack (no Supabase and why), folder structure from the spec, commands, deploy, known pitfalls (base path `/quiz-halloween/`; repo is public so `quiz.yaml` solutions are readable; scaffold was moved from a temp dir).
- [ ] `ETAT.md` from `~/.claude/templates/ETAT.md`: next sprint = #2 validator, next action = “créer la branche `feat/yaml-validator` et suivre `docs/superpowers/plans/2026-09-21-sprint2-validateur.md`”. Environnement: GitHub Pages, no env vars.
- [ ] `README.md` (French): but, installation, commandes, édition du quiz (`quiz.yaml`, lands in sprint 2), déploiement.

### Task 5: Initial commit, GitHub repo, issues, Pages

- [ ] **Step 1: Final local check** — `npm run typecheck && npm run test:run && npm run build && npm run test:e2e`, all green; show output.
- [ ] **Step 2: Publish `main` as-is, then commit the scaffold on a branch** (the `garde-fous` hook blocks any commit on `main`; `main` only holds the spec commit)

```bash
# Branch chore/scaffold already exists locally (holds plans + ETAT.md).
gh repo create quiz-halloween --public --source . --remote origin
git push -u origin main
git add -A && git commit -m "chore: initial scaffold (#1)"
git push -u origin chore/scaffold
```
- [ ] **Step 3: Invite, enable Pages, protect main**

```bash
gh api -X PUT repos/romainmoreira17000-droid/quiz-halloween/collaborators/ramdam17 -f permission=push
gh api -X POST repos/romainmoreira17000-droid/quiz-halloween/pages -f build_type=workflow
gh api -X PUT repos/romainmoreira17000-droid/quiz-halloween/branches/main/protection --input - <<'EOF'
{"required_status_checks":null,"enforce_admins":false,"required_pull_request_reviews":{"required_approving_review_count":0},"restrictions":null}
EOF
```
- [ ] **Step 4: Issues** — one `gh issue create` per sprint 1–6 (titles in French, acceptance criteria copied from the spec’s matching section). Sprint 1 must be issue #1 (create it before the scaffold commit).
- [ ] **Step 5: PR** — run agent `relecteur-code`, then `gh pr create` from `chore/scaffold` (French description, `Closes #1`), wait for green CI. **Merge only with Romain’s go.**
- [ ] **Step 6: Verify deploy** (after merge) — `gh run watch` on the deploy run, then Playwright on `https://romainmoreira17000-droid.github.io/quiz-halloween/` at 810×1080: heading visible, manifest served.
