# Quiz Halloween

Escape game d'Halloween pour les enfants du Centre de Loisirs : 5 équipes, une tablette par équipe.
Les équipes tournent entre 6 épreuves réelles, par créneaux de 15 minutes. À chaque épreuve, les
enfants tapent la bonne réponse (code en chiffres ou mot) et gagnent un chiffre ; les chiffres
ouvrent le cadenas final de la porte du restaurant des ombres.

En ligne : https://romainmoreira17000-droid.github.io/quiz-halloween/

## Déroulé d'une partie

1. **Réglage de la tablette (animateur) :** taper le code animateur (affiché en points), puis
   toucher le nom de l'équipe. La tablette garde son équipe, même après une remise à zéro.
2. **Accueil :** « Équipe des … » et le bouton « Commencer ». Toutes les tablettes doivent être
   lancées en même temps : les créneaux de 15 minutes sont comptés depuis « Commencer ».
3. **Épreuves :** créneaux 1 à 5, les épreuves en rotation : chaque équipe les fait toutes en
   commençant par une épreuve différente (5 équipes pour 5 postes :
   chaque équipe est seule dans sa salle). Créneau 6 : l'**épreuve finale** (`finale: true`, « Invisible mais visible »), jouée par
   toutes les équipes ensemble, avec ses indices aux mêmes minutes que les autres épreuves ;
   sa bonne réponse mène au cadenas juste après le « Bravo ! ». En haut : « Épreuve 3/6 », le temps du
   créneau en gros et le temps total en petit. Mauvaise réponse : l'écran tremble, un message
   d'encouragement s'affiche et la saisie est bloquée une minute (« Nouvelle réponse possible dans 00:42 »).
   À 8, 10 puis 13 minutes, un nouvel indice se débloque : le bouton « Voir l'indice (1/3) » du parchemin les montre, numérotés. Bonne réponse : une goupille du cadenas tombe, un grand « Bravo ! »
   montre le chiffre gagné (3 s, ou un tap pour le fermer), puis le morceau d'histoire de l'épreuve (`recit`,
   lisible dans n'importe quel ordre), le message d'attente de `message_attente`
   (« Profitez-en pour déguster… ») et « Changement d'épreuve dans … » (« L'épreuve finale dans … » au 5e
   créneau) jusqu'à la fin du créneau.
4. **Épreuve pas trouvée à temps :** au créneau suivant, « Temps écoulé : appelez un animateur ».
   L'animateur tape son code : le chiffre de l'épreuve et son `recit` s'affichent, puis « Continuer » mène à
   l'épreuve du créneau en cours.
5. **Cadenas :** après la finale (ou le dernier créneau), le `recit` de la finale en haut de l'écran, puis N molettes à régler dans l'ordre de `cadenas.ordre`. Le
   bon code ouvre la porte (animation + son) et donne rendez-vous à la vraie porte du restaurant.

La partie est gardée sur la tablette : si la page se recharge (ou si la tablette se met en veille),
le groupe retrouve l'écran du créneau en cours, avec les chiffres déjà trouvés.

**Remettre à zéro entre deux groupes (animateur) :** rester appuyé 3 secondes sur la petite icône ↺
en bas à gauche (un anneau se remplit), puis toucher « Recommencer » dans la fenêtre qui s'ouvre. Pendant une partie, le code animateur est
demandé : un reset refait partir les créneaux de la tablette de zéro, l'équipe ne serait plus en phase
avec les autres.
« Annuler » garde la partie en cours ; « Changer d'équipe » ramène au réglage de la tablette. Si `quiz.yaml` a été modifié entre-temps, la partie
sauvegardée est ignorée et le jeu revient à l'accueil.

**Menu animateur (à tout moment) :** rester appuyé 3 secondes sur ↺, toucher « Menu animateur », taper le code
animateur. Selon l'écran : « Valider l'épreuve » (donne le chiffre de l'épreuve affichée), « Débloquer la saisie »
(annule la minute de blocage), « Débloquer l'indice suivant (2/3) » (un indice de plus à chaque appui, sans attendre), et toujours « Voir les solutions »
(réponse, chiffre et indices de chaque épreuve, code du cadenas). Le menu ne change jamais le temps : l'équipe reste en phase.

**Tester sans attendre (mode test) :** ouvrir le site avec `?test` à la fin de l'adresse
(https://romainmoreira17000-droid.github.io/quiz-halloween/?test). Une étiquette rouge « Mode test » s'affiche,
et le bouton « Épreuve suivante » (en bas à droite) termine tout de suite le créneau en cours. Une épreuve
passée sans réponse mène à « Temps écoulé » (code animateur), comme en vrai. À ne jamais utiliser pendant la
soirée : une tablette qui avance seule envoie son équipe dans une salle encore occupée. Pour en sortir, rouvrir
l'adresse sans `?test`.

Le jeu fonctionne sans connexion une fois le site ouvert une première fois (polices embarquées).

## Installation

Prérequis : Node 24.

```bash
npm install
npx playwright install chromium   # pour les tests de parcours
```

Aucune variable d'environnement n'est nécessaire pour jouer. Seul le suivi à distance en demande deux (voir plus bas).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Lancer en local (http://localhost:5173/quiz-halloween/) |
| `npm run test:run` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests de parcours sur tablette (Playwright) |
| `npm run typecheck` | Vérification des types |
| `npm run images` | Convertit les illustrations de `images-sources/` en WebP légers dans `public/images/` |
| `npm run valider` | Vérifie `quiz.yaml` et ses images (lancé aussi avant chaque build) |
| `npm run build` | Build de production dans `dist/` |
| `npm run check:board` | Vérifie la sécurité de la base du suivi à distance (voir plus bas) |

## Modifier le quiz

Tout le contenu du jeu est dans `quiz.yaml`, à la racine. Le fichier est commenté ligne par ligne.
Les images vont dans `public/images/`.

**Ajouter ou remplacer une illustration de salle :** déposer le PNG (ou JPG) d'origine dans `images-sources/`
(dossier gardé sur l'ordinateur, jamais envoyé sur GitHub : les originaux pèsent 2 à 3 Mo), puis lancer
`npm run images`. Le script crée un `.webp` d'environ 200 Ko au nom simplifié (« la table hantée.png » →
`table-hantee.webp`), à indiquer dans `quiz.yaml` (`fond`, `fond_accueil` ou `cadenas.fond`). Les images sont
gardées dans la tablette pour jouer hors ligne : les garder légères. Sur une tablette en portrait, seul le
centre de l'illustration est visible.

| Clé | Obligatoire | Règle |
|---|---|---|
| `titre` | oui | texte non vide |
| `intro` | non | texte |
| `fond_accueil` | non | fichier de `public/images/` : fond de l'accueil et de l'attente entre deux salles |
| `equipes` | oui | liste de noms non vides et différents, autant que `nombre_etapes` |
| `duree_epreuve_minutes` | oui | nombre entier supérieur à 0 (durée d'un créneau) |
| `indices_apres_minutes` | oui | liste d'entiers ≥ 0 en croissant, plus petits que `duree_epreuve_minutes` (ex. `[5, 8, 11]`) : minute du créneau où s'active chaque indice |
| `blocage_secondes` | oui | entier ≥ 0 : saisie bloquée après une mauvaise réponse (0 = jamais) |
| `code_animateur` | oui | 4 à 8 chiffres ; ne jamais le dire devant les enfants |
| `nombre_etapes` | oui | entier ≥ 1, égal au nombre d'étapes listées |
| `entree` | non | `message`, `type_reponse`, `reponse` ; `titre` facultatif |
| `etapes` | oui | liste ; chaque étape a `titre`, `consigne`, `type_reponse` (`chiffres` \| `mots`), `reponse`, `chiffre` (0 à 9), et éventuellement `image` (fichier présent dans `public/images/`), `fond` (fond d'écran de la salle, fichier présent dans `public/images/` ; sans fond, la grande salle dessinée) et `indices` (liste de textes non vides, débloqués un par un aux minutes de `indices_apres_minutes`, pas plus que d'horaires ; sans indices, pas de bouton) |
| `cadenas.ordre` | non | chaque numéro d'étape de 1 à `nombre_etapes`, une seule fois (par défaut 1, 2, 3...) |
| `cadenas.indice` | non | texte |
| `cadenas.titre` | non | texte non vide (par défaut « Le cadenas ») |
| `cadenas.fond` | non | fichier de `public/images/` : fond du cadenas et de la victoire |
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

## Suivi à distance (tableau animateur)

Pendant la soirée, un animateur suit les 5 équipes depuis son téléphone : épreuve en cours, chiffres trouvés,
mauvaises réponses, temps restant. Le tableau est en **lecture seule** : les actions (valider, débloquer…) se font
toujours sur la tablette. Chaque tablette envoie son état à une petite base Supabase ; elle continue à jouer
normalement si le réseau tombe. Aucune donnée personnelle : seulement le nom d'équipe et l'état de la partie.

**Réglages (une fois) :**

1. Copier `.env.example` en `.env.local` et y mettre l'URL du projet Supabase et sa clé `anon` (publique).
2. Donner les mêmes valeurs au site en ligne :
   `gh variable set VITE_SUPABASE_URL` puis `gh variable set VITE_SUPABASE_ANON_KEY`.
   Sans ces variables, le suivi à distance est simplement désactivé.
3. Choisir le **code de soirée** (8 caractères au moins, jamais écrit dans le dépôt) et le régler dans l'éditeur SQL
   de Supabase :

   ```sql
   insert into public.evening_secret (id, code_hash)
   values (1, extensions.crypt('LE-CODE-DE-LA-SOIREE', extensions.gen_salt('bf')))
   on conflict (id) do update set code_hash = excluded.code_hash;
   ```

4. Vérifier que la base est bien fermée : `BOARD_CODE=le-code npm run check:board`. Avant la soirée, la version
   complète `BOARD_CODE=le-code npm run check:board -- --full` remplit aussi 12 équipes de test puis vide le tableau.

**Le soir :**

- **Wifi faible :** ouvrir l'app sur chaque tablette **avec le wifi, avant la soirée**, et la laisser ouverte.
  Ensuite tout le jeu marche sans réseau (seul le suivi à distance s'arrête, la tablette continue).
- Lancer toutes les tablettes en même temps (sinon « Départ de la partie » dans le menu animateur) : la finale
  commence au même moment partout.
- Au réglage de chaque tablette, taper le code de soirée dans « Code de soirée (facultatif) ».
- Sur le téléphone de l'animateur, ouvrir `https://romainmoreira17000-droid.github.io/quiz-halloween/?animateur`
  et taper le même code.
- Sur chaque tablette, la ligne « Suivi à distance » du menu animateur dit si l'envoi marche.
- « Nouvelle soirée » (sur le tableau) vide le tableau avant un nouveau groupe.
- **En fin de soirée** : « Nouvelle soirée » pour ne rien laisser dans la base, puis changer le code de soirée avant la
  suivante (il reste enregistré sur les tablettes).
- **Jamais de prénoms d'enfants comme noms d'équipe** dans `quiz.yaml` : les noms d'équipe sont envoyés à la base.

## Déploiement

Automatique : chaque PR fusionnée dans `main` publie le site sur GitHub Pages
(workflow `.github/workflows/deploy.yml`). Les PR passent d'abord par la CI (`ci.yml`).
