# CLAUDE.md — quiz-halloween

## But
Jeu d'énigmes d'Halloween joué en groupe sur tablette par les enfants du Centre de Loisirs.
Chaque étape donne une consigne dont la réponse est un chiffre (0–9) ; les chiffres ouvrent un
cadenas final qui déclenche une animation. Tout le contenu vient de `quiz.yaml`.

Conception complète : `docs/superpowers/specs/2026-09-21-quiz-halloween-design.md`.

## Utilisateurs
- **Enfants** (en groupe, sur tablette) : jouent.
- **Animateurs** : lancent la partie, remettent à zéro entre deux groupes, éditent le YAML.

## Stack
- Vite 8 + React 19 + TypeScript, vite-plugin-pwa (manifest, service worker et icônes PNG
  générés depuis `public/icon.svg` via `pwa-assets.config.ts`).
- Tests : Vitest 5 + Testing Library + jsdom ; Playwright (chromium, vue tablette 810×1080).
- **Pas de Supabase ni de backend** : aucune donnée à stocker ou partager, zéro donnée personnelle.
  La progression est gardée dans le localStorage de la tablette (sprint 6).

## Structure
```
quiz.yaml                  paramètres du quiz (clés en français, commentées)
public/images/             images des étapes (référencées par `image:`)
scripts/valider.ts         CLI du validateur (tsx), lancé en prebuild
src/config/                types, validateurs purs (checks, validateStep, validatePadlock,
                           validateQuiz), parseQuiz (YAML), images (CLI), loadQuiz (import ?raw)
src/game/                  logique pure : time, answer, messages, padlock, progress (réducteur de partie)
src/hooks/                 useCountdown, useGameProgress
src/components/            Game (seul assembleur d'écrans) + un composant par écran + Keypad, Dial, HauntedDoor, ...
src/services/              sound (son de victoire synthétisé en Web Audio)
src/styles/                thème « Manoir à la bougie » : base, controls, screens, padlock, victory
src/test/setup.ts          setup Vitest (matchers jest-dom)
e2e/                       parcours Playwright
.github/workflows/         ci.yml (PR) et deploy.yml (push sur main)
docs/superpowers/          spec et plans des sprints
```

## Commandes
```bash
npm run dev          # serveur local (http://localhost:5173/quiz-halloween/)
npm run test:run     # tests unitaires
npm run test:e2e     # build + preview + Playwright
npm run typecheck    # vérification des types
npm run valider      # vérifie quiz.yaml + images (aussi en prebuild)
npm run build        # build de production dans dist/
```

## Déploiement
GitHub Pages, dépôt public `romainmoreira17000-droid/quiz-halloween`.
Chaque merge sur `main` déclenche `deploy.yml` → https://romainmoreira17000-droid.github.io/quiz-halloween/
La CI (`ci.yml`) tourne sur chaque PR : typecheck, tests, build, e2e.

## Pièges connus
- **Chemin de base** `/quiz-halloween/` (`base` dans `vite.config.ts`) : toute URL absolue
  écrite à la main doit en tenir compte. En e2e, `baseURL` l'inclut déjà : `page.goto('./')`.
- **Dépôt public** : les solutions de `quiz.yaml` sont lisibles par tous. Choix assumé par Romain.
- Le squelette a été généré par create-vite dans `$TEMP` puis copié (dossier non vide).
- Le hook `garde-fous` bloque tout commit sur `main` : tout passe par branche + PR.
- Pare-feu Windows sans droits admin : le serveur Vite n'est joignable qu'en localhost.
  Pour tester sur une vraie tablette, passer par le site GitHub Pages.
- Le modèle create-vite inclut `oxlint` (`npm run lint`), gardé tel quel.
- **Config du quiz** : clés YAML en français, mappées vers des identifiants anglais dans `QuizConfig`.
  Le validateur ne s'arrête jamais à la première erreur ; messages en français préfixés par
  l'emplacement (`étape 3 : `, `cadenas : `). L'existence des images n'est vérifiée que par la CLI
  (Node), pas dans le navigateur.
- **Polices hors ligne** : `@fontsource` (sous-ensembles latin) importées dans `main.tsx`, mises en
  précache grâce à `woff2` dans `workbox.globPatterns`. Ne pas repasser par Google Fonts.
- **Chiffres** : toujours `font-variant-numeric: lining-nums`, sinon le 0 ressemble à un o.
- **Compteur** : toujours recalculé depuis `startedAt` (`Date.now()`), jamais décrémenté en mémoire.
- **Tests** : Vitest sert depuis `/`, donc `import.meta.env.BASE_URL` vaut `/` ; utiliser
  `vi.stubEnv('BASE_URL', ...)` pour tester une URL. `tsconfig.node.json` inclut la lib DOM pour
  le code de `page.evaluate` en e2e. `page.clock.fastForward` : format `hh:mm:ss` au-delà de 59 min.
- **e2e en local** : `reuseExistingServer` réutilise un `vite preview` déjà lancé sur le port 4173 **sans
  reconstruire** : les tests tournent alors sur un vieux build. Arrêter ce serveur avant `npm run test:e2e`.
- **Animations de victoire** : styles de base = état final, keyframes = état de départ (`both`), pour que
  `prefers-reduced-motion` montre directement la fin. Timings alignés avec `sound.ts`.
- **Son** : lancé dans le gestionnaire du tap « Ouvrir » (sinon bloqué par la tablette) ; muet si l'iPad est
  en mode silencieux. Jamais d'exception si Web Audio manque (jsdom).
- **tsconfig.scripts.json** : `scripts/` a son propre tsconfig en résolution `bundler`, car
  `tsconfig.node.json` (`nodenext`) exige des extensions sur les imports de `src/`.
