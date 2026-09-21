# Quiz Halloween

Jeu d'énigmes d'Halloween pour les enfants du Centre de Loisirs, joué en groupe sur tablette.
Chaque étape donne une consigne dont la réponse est un chiffre ; les chiffres trouvés ouvrent un
cadenas final.

En ligne : https://romainmoreira17000-droid.github.io/quiz-halloween/

## Installation

Prérequis : Node 24.

```bash
npm install
npx playwright install chromium   # pour les tests de parcours
```

Aucune variable d'environnement n'est nécessaire (pas de backend).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Lancer en local (http://localhost:5173/quiz-halloween/) |
| `npm run test:run` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests de parcours sur tablette (Playwright) |
| `npm run typecheck` | Vérification des types |
| `npm run build` | Build de production dans `dist/` |

## Modifier le quiz

Le contenu (titre, étapes, consignes, solutions, cadenas) se trouvera dans `quiz.yaml` à la racine
(arrive au sprint 2). Les images vont dans `public/images/`. Un YAML invalide bloque la publication,
avec un message qui indique l'erreur.

## Déploiement

Automatique : chaque PR fusionnée dans `main` publie le site sur GitHub Pages
(workflow `.github/workflows/deploy.yml`). Les PR passent d'abord par la CI (`ci.yml`).
