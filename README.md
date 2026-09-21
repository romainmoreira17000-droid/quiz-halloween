# Quiz Halloween

Jeu d'énigmes d'Halloween pour les enfants du Centre de Loisirs, joué en groupe sur tablette.
Chaque étape donne une consigne dont la réponse est un chiffre ; les chiffres trouvés ouvrent un
cadenas final.

En ligne : https://romainmoreira17000-droid.github.io/quiz-halloween/

## Déroulé d'une partie

1. Écran d'accueil : titre, introduction, durée. « Commencer » lance le compteur.
2. Chaque étape affiche son énigme et un pavé de 0 à 9. Mauvaise réponse : l'écran tremble et un
   message d'encouragement s'affiche (essais illimités). Bonne réponse : le chiffre trouvé et
   « Étape suivante ». Les bougies en haut montrent la progression.
3. Quand le temps est écoulé, le compteur passe en rouge et devient négatif ; le jeu continue.
4. Après la dernière étape, un écran récapitule les chiffres trouvés (le cadenas arrive ensuite).

Le jeu fonctionne sans connexion une fois le site ouvert une première fois (polices embarquées).

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
| `npm run valider` | Vérifie `quiz.yaml` et ses images (lancé aussi avant chaque build) |
| `npm run build` | Build de production dans `dist/` |

## Modifier le quiz

Tout le contenu du jeu est dans `quiz.yaml`, à la racine. Le fichier est commenté ligne par ligne.
Les images vont dans `public/images/`.

| Clé | Obligatoire | Règle |
|---|---|---|
| `titre` | oui | texte non vide |
| `intro` | non | texte |
| `duree_minutes` | oui | nombre entier supérieur à 0 |
| `nombre_etapes` | oui | entier ≥ 1, égal au nombre d'étapes listées |
| `etapes` | oui | liste ; chaque étape a `titre`, `consigne` (textes non vides), `solution` (chiffre de 0 à 9) et éventuellement `image` (fichier présent dans `public/images/`) |
| `cadenas.ordre` | non | chaque numéro d'étape de 1 à `nombre_etapes`, une seule fois (par défaut 1, 2, 3...) |
| `cadenas.indice` | non | texte |

Toute clé inconnue (faute de frappe) est refusée. Après une modification, lancer `npm run valider`.
Toutes les erreurs sont listées d'un coup, par exemple :

```
❌ quiz.yaml contient 2 erreur(s) :
  - étape 1 : « solution » doit être un chiffre entier entre 0 et 9.
  - cadenas : « ordre » doit contenir chaque numéro d'étape de 1 à 6, une seule fois.
```

Un `quiz.yaml` invalide bloque la publication (le build échoue). En local (`npm run dev`), l'app
affiche la même liste d'erreurs à la place du jeu.

**Attention :** le dépôt est public, les solutions sont donc lisibles par tous.

## Déploiement

Automatique : chaque PR fusionnée dans `main` publie le site sur GitHub Pages
(workflow `.github/workflows/deploy.yml`). Les PR passent d'abord par la CI (`ci.yml`).
