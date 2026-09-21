# CLAUDE.md — quiz-halloween

## But
Jeu d'énigmes d'Halloween joué en groupe sur tablette par les enfants du Centre de Loisirs.
Chaque étape donne une consigne dont la réponse est un chiffre (0–9) ; les chiffres ouvrent un
cadenas final qui déclenche une animation. Tout le contenu vient de `quiz.yaml` (sprint 2).

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
quiz.yaml                  paramètres du quiz (sprint 2)
scripts/valider.ts         CLI du validateur (sprint 2)
src/config/                schéma, validateur, chargement du YAML
src/game/                  logique pure (réponse, code du cadenas, temps)
src/hooks/                 useCountdown, useGameProgress
src/components/            un composant par écran + Keypad, Padlock, ...
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
