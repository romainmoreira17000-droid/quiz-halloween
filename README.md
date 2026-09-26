# Quiz Halloween

Escape game d'Halloween pour les enfants du Centre de Loisirs : 6 équipes, une tablette par équipe.
Les équipes tournent entre 6 épreuves réelles, par créneaux de 15 minutes. À chaque épreuve, les
enfants tapent la bonne réponse (code en chiffres ou mot) et gagnent un chiffre ; les chiffres
ouvrent le cadenas final de la porte du restaurant hanté.

En ligne : https://romainmoreira17000-droid.github.io/quiz-halloween/

## Déroulé d'une partie

1. **Réglage de la tablette (animateur) :** taper le code animateur (affiché en points), puis
   toucher le nom de l'équipe. La tablette garde son équipe, même après une remise à zéro.
2. **Accueil :** « Équipe des … » et le bouton « Commencer ». Toutes les tablettes doivent être
   lancées en même temps : les créneaux de 15 minutes sont comptés depuis « Commencer ».
3. **Épreuves :** l'équipe e fait, au créneau c, l'épreuve (e + c) modulo 6 : chaque équipe fait les
   6 épreuves, jamais deux équipes sur la même en même temps. En haut : « Épreuve 3/6 », le temps du
   créneau en gros et le temps total en petit. Mauvaise réponse : l'écran tremble, un message
   d'encouragement s'affiche et la saisie est bloquée une minute (« Nouvelle réponse possible dans 00:42 »).
   Au bout de 10 minutes, le bouton « Voir l'indice » du parchemin montre l'indice de l'épreuve. Bonne réponse : le chiffre trouvé, une goupille du cadenas tombe, et
   « Changement de salle dans … » jusqu'à la fin du créneau.
4. **Épreuve pas trouvée à temps :** au créneau suivant, « Temps écoulé : appelez un animateur ».
   L'animateur tape son code : le chiffre de l'épreuve s'affiche, puis « Continuer » mène à
   l'épreuve du créneau en cours.
5. **Cadenas :** après le dernier créneau, N molettes à régler dans l'ordre de `cadenas.ordre`. Le
   bon code ouvre la porte (animation + son) et donne rendez-vous à la vraie porte du restaurant.

La partie est gardée sur la tablette : si la page se recharge (ou si la tablette se met en veille),
le groupe retrouve l'écran du créneau en cours, avec les chiffres déjà trouvés.

**Remettre à zéro entre deux groupes (animateur) :** rester appuyé 3 secondes sur la petite icône ↺
en bas à gauche (un anneau se remplit), puis toucher « Recommencer » dans la fenêtre qui s'ouvre. Pendant une partie, le code animateur est
demandé : un reset refait partir les créneaux de la tablette de zéro, l'équipe ne serait plus en phase
avec les autres.
« Annuler » garde la partie en cours ; « Changer d'équipe » ramène au réglage de la tablette. Si `quiz.yaml` a été modifié entre-temps, la partie
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
| `equipes` | oui | liste de noms non vides et différents, autant que `nombre_etapes` |
| `duree_epreuve_minutes` | oui | nombre entier supérieur à 0 (durée d'un créneau) |
| `indice_apres_minutes` | oui | entier ≥ 0 et plus petit que `duree_epreuve_minutes` : minutes avant que le bouton « Indice » s'active |
| `blocage_secondes` | oui | entier ≥ 0 : saisie bloquée après une mauvaise réponse (0 = jamais) |
| `code_animateur` | oui | 4 à 8 chiffres ; ne jamais le dire devant les enfants |
| `nombre_etapes` | oui | entier ≥ 1, égal au nombre d'étapes listées |
| `entree` | non | `message`, `type_reponse`, `reponse` ; `titre` facultatif |
| `etapes` | oui | liste ; chaque étape a `titre`, `consigne`, `type_reponse` (`chiffres` \| `mots`), `reponse`, `chiffre` (0 à 9), et éventuellement `image` (fichier présent dans `public/images/`) et `indice` (texte non vide, lu sur demande au bout de `indice_apres_minutes` ; sans indice, pas de bouton) |
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
