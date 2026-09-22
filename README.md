# Quiz Halloween

Jeu d'énigmes d'Halloween pour les enfants du Centre de Loisirs, joué en groupe sur tablette.
Chaque étape est une épreuve réelle : les enfants tapent la bonne réponse (code en chiffres ou mot)
et gagnent un chiffre. Un message d'entrée facultatif fait entrer dans le restaurant et démarre le
compteur ; les chiffres trouvés ouvrent le cadenas final.

En ligne : https://romainmoreira17000-droid.github.io/quiz-halloween/

## Déroulé d'une partie

1. Accueil, puis message d'entrée (facultatif) : la bonne réponse fait entrer dans le restaurant et
   démarre le compteur.
2. Chaque étape est une épreuve réelle : les enfants tapent la bonne réponse (code en chiffres ou
   mot, sur un pavé ou un clavier de lettres dessinés dans l'appli) et gagnent le chiffre de
   l'étape. Mauvaise réponse : l'écran tremble et un message d'encouragement s'affiche (essais
   illimités). Bonne réponse : le chiffre trouvé et « Étape suivante ». Les bougies en haut
   montrent la progression.
3. Quand le temps est écoulé, le compteur passe en rouge et devient négatif ; le jeu continue.
4. Après la dernière étape, le cadenas : N molettes à régler dans l'ordre de `cadenas.ordre`. Le bon code ouvre la
   porte du restaurant hanté (animation + son) et affiche le temps mis.

La partie est gardée sur la tablette : si la page se recharge (ou si la tablette redémarre), le
groupe reprend à la même étape, avec le compteur toujours juste. Les essais ratés ne sont pas gardés.

**Remettre à zéro entre deux groupes (animateur) :** rester appuyé 3 secondes sur la petite icône ↺
en bas à gauche (un anneau se remplit), puis toucher « Recommencer » dans la fenêtre qui s'ouvre.
« Annuler » garde la partie en cours. Si `quiz.yaml` a été modifié entre-temps, la partie
sauvegardée est ignorée et le jeu revient à l'accueil.

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
| `entree` | non | `message`, `type_reponse`, `reponse` ; `titre` facultatif |
| `etapes` | oui | liste ; chaque étape a `titre`, `consigne`, `type_reponse` (`chiffres` \| `mots`), `reponse`, `chiffre` (0 à 9), et éventuellement `image` (fichier présent dans `public/images/`) |
| `cadenas.ordre` | non | chaque numéro d'étape de 1 à `nombre_etapes`, une seule fois (par défaut 1, 2, 3...) |
| `cadenas.indice` | non | texte |
| `cadenas.titre` | non | texte non vide (par défaut « Le cadenas ») |
| `cadenas.message_victoire` | non | texte non vide (par défaut « Le cadenas est ouvert ! ») |

Toute clé inconnue (faute de frappe) est refusée. Après une modification, lancer `npm run valider`.
Toutes les erreurs sont listées d'un coup, par exemple :

```
❌ quiz.yaml contient 2 erreur(s) :
  - étape 1 : « chiffre » doit être un chiffre entier entre 0 et 9.
  - cadenas : « ordre » doit contenir chaque numéro d'étape de 1 à 6, une seule fois.
```

Un `quiz.yaml` invalide bloque la publication (le build échoue). En local (`npm run dev`), l'app
affiche la même liste d'erreurs à la place du jeu.

**Attention :** le dépôt est public, les solutions sont donc lisibles par tous.

## Déploiement

Automatique : chaque PR fusionnée dans `main` publie le site sur GitHub Pages
(workflow `.github/workflows/deploy.yml`). Les PR passent d'abord par la CI (`ci.yml`).
