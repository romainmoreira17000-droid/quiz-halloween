# Sprint 11 — Fonds d'écran photo : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** remplacer le décor dessiné par les illustrations de Romain : une photo par salle, l'« image principale » à l'accueil et
pendant l'attente, la « sortie » sur le cadenas et la victoire.

**Architecture:** trois clés YAML facultatives (`fond` d'étape, `fond_accueil`, `fond` du cadenas) validées comme le reste. Une
fonction pure `backdropFor(phase, config)` choisit le décor ; `TeamGame` l'affiche (photo via `PhotoBackdrop`, sinon le décor
dessiné). Les PNG d'origine (2,5 Mo) restent hors du dépôt : `npm run images` les convertit en WebP légers dans `public/images/`.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library, Playwright, sharp (conversion, déjà présent via
`@vite-pwa/assets-generator`, ajouté en devDependency explicite).

**Spec:** issue #24 (cadrage du 2026-09-26 avec Romain, validé en conversation) ; contexte :
`docs/superpowers/specs/2026-09-24-escape-game-design.md`.

## Global Constraints

- Fichiers ≤ 200 lignes ; `@file` + JSDoc sur chaque export ; commentaires en anglais ; textes affichés en français.
- Clés YAML en français, identifiants anglais dans `QuizConfig` ; messages d'erreur préfixés (`étape 3 : `, `cadenas : `).
- Correspondances (validées par Romain) : épreuve 1 « La galerie des portraits », 2 « La table hantée », 3 « Le cimetière »,
  4 « Les saveurs hantées », 5 « Les toilettes scientifiques », 6 « Invisible mais visible » (sans image → décor dessiné).
- « image principale » : accueil + attente (chiffre trouvé). « sortie du restaurant » : cadenas + victoire.
- Entrée : garde `RestaurantFront`. Écran de réglage d'équipe : inchangé (pas de décor).
- Noms des WebP en ASCII sans espace (URL sûres) : `galerie-des-portraits.webp`, `table-hantee.webp`, `cimetiere.webp`,
  `saveurs-hantees.webp`, `toilettes-scientifiques.webp`, `image-principale.webp`, `sortie-du-restaurant.webp`.
- Toute URL d'image passe par `import.meta.env.BASE_URL` (chemin de base `/quiz-halloween/`).
- Écran d'étape sur tablette 810×1080 : toujours sans défilement (`e2e/layout.spec.ts`).

## Review Focus

1. **Image pas encore chargée ou absente** (premier lancement lent) → le fond sombre du thème reste, texte lisible. Pinned par
   CSS (`.backdrop--photo` a `background: var(--soot)`), vérifié à la tâche 5.
2. **Téléphone et tablette en portrait** : la photo paysage est rognée au centre (`object-fit: cover`) sans défilement
   horizontal. Pinned par la vérif Playwright de la tâche 5 (390×844 et 810×1080).
3. **Hors ligne** : les WebP doivent être en précache. Pinned par la tâche 1 (build : `dist/sw.js` contient les 7 noms).
4. **Épreuve sans `fond`** (la 6ᵉ) → décor dessiné, jamais une image cassée. Pinned par `backdrop.test.ts` (tâche 3).
5. **Faute de frappe dans un nom de fond** → le build refuse avec un message clair. Pinned par `images.test.ts` (tâche 2).

---

### Task 1 : conversion des images en WebP

**Files:**
- Create: `scripts/slug.ts`, `scripts/slug.test.ts`, `scripts/images.ts`
- Modify: `package.json` (script `images`, devDependency `sharp`), `.gitignore` (`images-sources/`)
- Move: `public/images/*.png` → `images-sources/` (hors dépôt)
- Create (générés) : les 7 `public/images/*.webp`

**Interfaces:**
- Produces: `toWebpName(fileName: string): string` ; les 7 fichiers WebP nommés comme dans Global Constraints.

- [ ] **Step 1 : test rouge** — `scripts/slug.test.ts`

```ts
/** @file Tests for the image file name slug. */
import { toWebpName } from './slug'

describe('toWebpName', () => {
  it('drops accents, spaces and the extension', () => {
    expect(toWebpName('la table hanté.png')).toBe('table-hantee.webp')
    expect(toWebpName('les saveurs hantées.png')).toBe('saveurs-hantees.webp')
  })
  it('drops a leading French article only', () => {
    expect(toWebpName('le cimetiere.png')).toBe('cimetiere.webp')
    expect(toWebpName('sortie du restaurant.png')).toBe('sortie-du-restaurant.webp')
    expect(toWebpName('image principale.png')).toBe('image-principale.webp')
  })
  it('keeps letters and digits, collapses other characters', () => {
    expect(toWebpName("L'Épreuve  N°2 .JPG")).toBe('epreuve-n-2.webp')
  })
})
```

- [ ] **Step 2 :** `npx vitest run scripts/slug.test.ts` → FAIL (module introuvable).
- [ ] **Step 3 : code minimal** — `scripts/slug.ts`

```ts
/** @file Turns an illustration file name into a URL-safe WebP name. */

/**
 * Builds the WebP file name of an image: no accent, no space, no leading article.
 * @param fileName Original name, e.g. « la table hanté.png ».
 * @returns Lower-case kebab name ending in .webp, e.g. « table-hantee.webp ».
 */
export function toWebpName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const words = base.split(/[^a-z0-9]+/).filter(Boolean)
  // « la galerie des portraits » → « galerie-des-portraits »: the article adds nothing to the name.
  if (words.length > 1 && ['le', 'la', 'les', 'l'].includes(words[0])) words.shift()
  return `${words.join('-')}.webp`
}
```

- [ ] **Step 4 :** test vert.
- [ ] **Step 5 : script** — `npm i -D sharp`, puis `scripts/images.ts` :

```ts
/** @file CLI: converts the illustrations of images-sources/ into light WebP files in public/images/. */
import { mkdirSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
import { toWebpName } from './slug'

const SOURCE = 'images-sources'
// Wide enough for a tablet held landscape; the PWA precaches every image, so each must stay light.
const MAX_WIDTH = 1920
const QUALITY = 72

mkdirSync('public/images', { recursive: true })
for (const file of readdirSync(SOURCE).filter((name) => /\.(png|jpe?g)$/i.test(name))) {
  const target = `public/images/${toWebpName(file)}`
  const info = await sharp(`${SOURCE}/${file}`).resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY }).toFile(target)
  console.log(`✅ ${file} → ${target} (${Math.round(info.size / 1024)} Ko)`)
}
```

  `package.json` : `"images": "tsx scripts/images.ts"`. `.gitignore` : `images-sources/` (originaux de Romain, trop lourds).
- [ ] **Step 6 :** déplacer les 7 PNG de `public/images/` vers `images-sources/`, lancer `npm run images` : 7 lignes ✅,
  chaque fichier < 400 Ko (sinon baisser `QUALITY`).
- [ ] **Step 7 :** `npm run build` puis `grep -c "webp" dist/sw.js` et vérifier que les 7 noms y sont (précache hors ligne).
- [ ] **Step 8 : commit** — `feat: convert the room illustrations to light WebP (#24)` (slug, script, webp, gitignore, package).

### Task 2 : clés YAML `fond`, `fond_accueil`, `cadenas.fond`

**Files:**
- Modify: `src/config/types.ts`, `src/config/validateStep.ts`, `src/config/validatePadlock.ts`, `src/config/validateQuiz.ts`,
  `src/config/images.ts`
- Test: `src/config/validateStep.test.ts`, `src/config/validatePadlock.test.ts`, `src/config/validateQuiz.test.ts`,
  `src/config/images.test.ts`

**Interfaces:**
- Produces: `QuizStep.backdrop?: string`, `PadlockConfig.backdrop?: string`, `QuizConfig.homeBackdrop?: string` (noms de
  fichiers dans `public/images/`) ; `findMissingImages` couvre aussi ces trois clés.

- [ ] **Step 1 : tests rouges.**
  - `validateStep.test.ts` : `fond: 'cimetiere.webp'` → `backdrop: 'cimetiere.webp'` ; `fond: ''` → erreur
    `étape 1 : « fond » doit être un nom de fichier.` ; absent → pas de propriété `backdrop`.
  - `validatePadlock.test.ts` : `{ fond: 'sortie.webp' }` → `backdrop: 'sortie.webp'` ; `{ fond: 3 }` → erreur
    `cadenas : « fond » doit être un nom de fichier.`
  - `validateQuiz.test.ts` : `fond_accueil: 'accueil.webp'` → `homeBackdrop: 'accueil.webp'` ; `fond_accueil: ''` → erreur
    `« fond_accueil » doit être un nom de fichier.`
  - `images.test.ts` :

```ts
  it('also checks the home, step and padlock backdrops', () => {
    const withBackdrops: QuizConfig = {
      ...config, homeBackdrop: 'accueil.webp', padlock: { order: [1, 2], backdrop: 'sortie.webp' },
      steps: [{ ...config.steps[0], image: undefined, backdrop: 'salle.webp' }, { ...config.steps[1], image: undefined }],
    }
    expect(findMissingImages(withBackdrops, new Set())).toEqual([
      "fond_accueil : l'image « accueil.webp » est introuvable dans public/images/.",
      "étape 1 : l'image « salle.webp » est introuvable dans public/images/.",
      "cadenas : l'image « sortie.webp » est introuvable dans public/images/.",
    ])
  })
```

- [ ] **Step 2 :** `npx vitest run src/config` → les nouveaux tests échouent.
- [ ] **Step 3 : code.**
  - `types.ts` : `backdrop?: string` dans `QuizStep` (JSDoc : « `fond`: photo shown behind the screen while the group is in
    this room; drawn great hall without it ») ; idem `PadlockConfig` (padlock + victory) et `QuizConfig.homeBackdrop`
    (`fond_accueil`: home and waiting screens).
  - `validateStep.ts` : ajouter `'fond'` à `STEP_KEYS`, même contrôle que `image`, `...(raw.fond !== undefined && { backdrop: raw.fond as string })`.
  - `validatePadlock.ts` : `'fond'` dans `PADLOCK_KEYS` et dans le message « doit contenir des paramètres », contrôle
    `isNonEmptyString`, mapping `backdrop`.
  - `validateQuiz.ts` : `'fond_accueil'` dans `ROOT_KEYS`, contrôle, mapping `homeBackdrop`.
  - `images.ts` : liste `[['fond_accueil : ', homeBackdrop], ...steps.flatMap(image, backdrop avec 'étape i : '), ['cadenas : ', padlock.backdrop]]`,
    message `${prefix}l'image « ${file} » est introuvable dans public/images/.` (même texte qu'avant pour `image`).
- [ ] **Step 4 :** `npm run test:run` et `npm run typecheck` verts.
- [ ] **Step 5 : commit** — `feat: add backdrop keys to the quiz file (#24)`.

### Task 3 : choix du décor (logique pure)

**Files:**
- Create: `src/game/backdrop.ts`, `src/game/backdrop.test.ts`

**Interfaces:**
- Consumes: `GamePhase` (`src/game/phase.ts`), `QuizConfig` avec les clés de la tâche 2.
- Produces:

```ts
export type Backdrop = { kind: 'none' } | { kind: 'restaurant' } | { kind: 'hall' } | { kind: 'photo'; file: string }
export function backdropFor(phase: GamePhase, config: Pick<QuizConfig, 'steps' | 'padlock' | 'homeBackdrop'>): Backdrop
```

- [ ] **Step 1 : tests rouges** — `backdrop.test.ts`, un `it` par règle :
  - `home` → photo `homeBackdrop` ; sans `homeBackdrop` → `none` (comportement actuel).
  - `entrance` → `restaurant`.
  - `challenge` d'une étape avec `backdrop` → photo de cette étape ; sans `backdrop` → `hall` (6ᵉ épreuve).
  - `timeUp` → photo de l'épreuve ratée (le groupe y est encore, l'animateur y vient).
  - `waiting` → photo `homeBackdrop` ; sans → `hall`.
  - `padlock` et `won` → photo `padlock.backdrop` ; sans → `hall`.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 : code** — un `switch (phase.kind)` ; helper `photoOr(file, fallback)`.
- [ ] **Step 4 :** vert.
- [ ] **Step 5 : commit** — `feat: pick the backdrop of each screen (#24)`.

### Task 4 : affichage de la photo

**Files:**
- Create: `src/components/decor/PhotoBackdrop.tsx`, `src/components/decor/PhotoBackdrop.test.tsx`
- Modify: `src/components/TeamGame.tsx` (fonction `backdrop` → `backdropFor`), `src/styles/decor.css`
- Test: `src/components/TeamGame.test.tsx`

**Interfaces:**
- Consumes: `backdropFor`, `Backdrop` (tâche 3).
- Produces: `PhotoBackdrop({ file }: { file: string })`.

- [ ] **Step 1 : tests rouges.**
  - `PhotoBackdrop.test.tsx` : avec `vi.stubEnv('BASE_URL', '/quiz-halloween/')`, l'image décorative (`alt=""`, donc
    `container.querySelector('img')`) a `src="/quiz-halloween/images/cimetiere.webp"` ; le conteneur est `aria-hidden`.
  - `TeamGame.test.tsx` : avec `homeBackdrop: 'accueil.webp'` et `steps[1].backdrop: 'grenier.webp'`, l'accueil montre
    `accueil.webp`, après « Commencer » les Zombies voient `grenier.webp`, après « 0 » (attente) de nouveau `accueil.webp`.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 : code.**

```tsx
/** @file Illustration of the current room, behind the screens, under a dark veil that keeps the text readable. */

/**
 * Full-screen photo backdrop.
 * @param props.file Image file name in public/images/.
 * @returns The decorative image (hidden from screen readers).
 */
export function PhotoBackdrop({ file }: { file: string }) {
  return (
    <div className="backdrop backdrop--photo" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}images/${file}`} alt="" />
    </div>
  )
}
```

  `TeamGame.tsx` : `renderBackdrop(backdropFor(phase, config))` → `none` null, `restaurant` `<RestaurantFront />`, `hall`
  `<HallBackdrop />`, `photo` `<PhotoBackdrop key={file} file={file} />`.
  `decor.css` :

```css
/* Photo backdrops: landscape illustrations cropped to the middle on a portrait tablet. Soot shows while the image loads. */
.backdrop--photo { background: var(--soot); }
.backdrop--photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
/* The illustrations are bright and busy: a candlelit veil, darker at the top and bottom where the texts sit. */
.backdrop--photo::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(rgb(26 18 12 / .72), rgb(26 18 12 / .45) 45%, rgb(26 18 12 / .78));
}
```

- [ ] **Step 4 :** tests verts, typecheck.
- [ ] **Step 5 : commit** — `feat: show the room illustration behind the screens (#24)`.

### Task 5 : quiz.yaml, vérif navigateur, e2e, documentation

**Files:**
- Modify: `quiz.yaml`, `e2e/*.spec.ts` (si un titre d'épreuve y est cité), `CLAUDE.md`, `README.md`, `ETAT.md`

- [ ] **Step 1 :** `quiz.yaml` : titres des 6 épreuves (Global Constraints), `fond:` sur les 5 premières, `fond_accueil:
  "image-principale.webp"`, `cadenas.fond: "sortie-du-restaurant.webp"`, commentaires en français pour les trois clés
  (facultatives, fichier dans `public/images/`, conversion par `npm run images`). Consignes/réponses provisoires inchangées.
- [ ] **Step 2 :** `npm run valider` ✅ ; `npm run test:run` (mettre à jour les tests qui citent les anciens titres du YAML).
- [ ] **Step 3 :** arrêter tout `vite preview` sur 4173, `npm run test:e2e` vert (dont `layout.spec.ts`).
- [ ] **Step 4 : vérif Playwright** (navigateur neuf) sur 810×1080 et 390×844 : accueil, épreuve 1 (Sorcières), attente, 6ᵉ
  épreuve (décor dessiné), cadenas, victoire. Critères : texte lisible (ajuster l'opacité du voile si besoin), pas de défilement
  horizontal, écran d'étape sans défilement sur tablette. Hors ligne : recharger avec le réseau coupé, les photos restent.
- [ ] **Step 5 : docs** — `CLAUDE.md` : `images-sources/` + `npm run images` dans Structure/Commandes, piège « Fonds photo »
  (clés, WebP, voile, `backdropFor`). `README.md` : ajouter/modifier une illustration. `ETAT.md` à jour.
- [ ] **Step 6 : commit** — `feat: dress the six rooms with their illustrations (#24)` puis `docs: ... (#24)`.
