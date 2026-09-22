# Conception — Message d'entrée, réponses en chiffres ou en mots, décor du restaurant

Date : 2026-09-22 · Issues : #14 (sprint 7, fonctionnement), #15 (sprint 8, décor)

## Contexte

Le jeu change d'usage. Les enfants ne résolvent plus des énigmes sur la tablette : ils font des
**épreuves réelles** (jeux, fouilles, dégustations…), puis notent sur la tablette la **bonne réponse**
de l'épreuve. Chaque bonne réponse donne **un chiffre** du code du cadenas final.

Avant d'entrer dans le restaurant hanté, les enfants reçoivent un **message d'entrée** dont la réponse
ouvre la porte. Le compteur ne démarre qu'une fois entrés dans la salle.

Le contenu réel des épreuves sera fourni plus tard par Romain. Le YAML livré contient des épreuves
**fictives** qui servent aux tests.

## Déroulé d'une partie

1. **Accueil** : titre, introduction, « Commencer ». Pas de compteur.
2. **Message d'entrée** (si la section `entree` existe) : titre, message, saisie de la réponse.
   - Mauvaise réponse : message moqueur qui tourne (comme aujourd'hui), sans pénalité.
   - Bonne réponse : on entre dans la salle, **le compteur démarre**.
   - Sans section `entree`, « Commencer » mène directement à l'épreuve 1 et démarre le compteur
     (comportement actuel).
3. **Épreuves 1 à N** : consigne (et image facultative), saisie de la réponse.
   - Bonne réponse : le chiffre gagné s'affiche, puis « Suivant ».
   - Mauvaise réponse : message qui tourne, sans pénalité.
4. **Code final** : écran du cadenas actuel (molettes, ordre, indice), inchangé au sprint 7.
5. **Victoire** : animation et son actuels, inchangés.

Sauvegarde sur la tablette et remise à zéro par appui long : inchangées, étendues à l'écran d'entrée.

## Règles de réponse

- `type_reponse: chiffres` : pavé numérique, la réponse est une suite de 1 à 12 chiffres
  (« 0472 » est différent de « 472 » : les zéros de tête comptent).
- `type_reponse: mots` : clavier de lettres AZERTY dessiné dans l'appli (le clavier du système
  couvrirait la moitié de l'écran), avec une touche espace pour les réponses en plusieurs mots.
  Comparaison **sans tenir compte** des majuscules, des accents et des espaces en début ou en fin ;
  les espaces multiples au milieu comptent pour un seul.
- Longueur de saisie limitée à 12 caractères en chiffres, 24 en mots.
- « Valider » est désactivé tant que la saisie est vide ; « Effacer » retire le dernier caractère.

## Format de `quiz.yaml`

```yaml
entree:                        # facultatif
  titre: "Une lettre sous la porte"      # facultatif (défaut : « Le message d'entrée »)
  message: "Le fantôme du chef..."       # obligatoire, texte non vide
  type_reponse: mots                     # obligatoire : chiffres | mots
  reponse: "CITROUILLE"                  # obligatoire

etapes:
  - titre: "Le cimetière"      # obligatoire
    consigne: "..."            # obligatoire
    image: tombe.png           # facultatif
    type_reponse: chiffres     # obligatoire : chiffres | mots
    reponse: "1832"            # obligatoire ; en chiffres : uniquement des chiffres
    chiffre: 9                 # obligatoire : entier de 0 à 9, le chiffre gagné
```

- `solution` n'est plus acceptée. Si elle est présente, erreur explicite :
  « étape 2 : « solution » a été remplacée par « reponse » (ce que tapent les enfants) et
  « chiffre » (le chiffre gagné) ».
- `reponse` peut s'écrire avec ou sans guillemets en YAML (`reponse: 1832` est accepté et lu comme
  le texte « 1832 »). Les guillemets sont conseillés pour garder les zéros de tête.
- En `mots`, la réponse ne doit contenir que des lettres (accents compris), des espaces, des
  apostrophes ou des tirets, faute de quoi le clavier ne permettrait pas de la taper ; et 24 caractères
  au plus. En `chiffres`, 12 chiffres au plus.
- Messages d'erreur en français, préfixés par l'emplacement (`entrée : `, `étape 3 : `), sans
  s'arrêter à la première erreur (règle existante).

Types TypeScript (clés anglaises) :

```ts
type AnswerKind = 'digits' | 'letters'
interface ExpectedAnswer { kind: AnswerKind; value: string }
interface QuizStep { title; instruction; image?; answer: ExpectedAnswer; digit: number }
interface EntranceConfig { title?: string; message: string; answer: ExpectedAnswer }
interface QuizConfig { ...; entrance?: EntranceConfig }
```

## Organisation du code (sprint 7)

- `src/config/` : validation de `entree`, `type_reponse`, `reponse`, `chiffre` ; refus de `solution`.
  Découpage en fichiers de moins de 200 lignes (un `validateAnswer` partagé par l'entrée et les étapes).
- `src/game/answer.ts` : `normalizeAnswer(text, kind)` et `isCorrectAnswer(typed, expected)`, purs.
- `src/game/progress.ts` : nouveau statut `entrance` (entre `home` et `playing`, `startedAt` à null).
  Actions : `start` (vers `entrance` s'il y a une entrée, sinon vers `playing` avec `startedAt`),
  `enter { text, now }` (bonne réponse → `playing`, `startedAt = now`), `answer { text }` (bonne
  réponse → ajoute `step.digit` aux chiffres trouvés).
- `src/game/restore.ts` : accepte l'état `entrance` (aucun chiffre trouvé, `startedAt` null).
- `src/components/` :
  - `EntranceScreen` : titre, message, saisie, messages d'erreur.
  - `AnswerInput` : affiche la saisie en cours et choisit le clavier selon le type ; gère la saisie
    (ajout, effacement, longueur max) et appelle `onSubmit(text)`.
  - `LetterKeyboard` : AZERTY sur 3 lignes, plus espace, effacer, valider ; touches ≥ 64 px de haut
    sur tablette.
  - `Keypad` : réutilisé pour les chiffres, avec « Effacer » et « Valider ».
  - `StepScreen` : utilise `AnswerInput` ; après une bonne réponse, affiche le chiffre gagné.
- Sauvegarde : l'empreinte du quiz change avec le nouveau format ; une partie en cours au moment de la
  mise à jour est ignorée (retour à l'accueil). Acceptable : rien d'autre n'est perdu.

## Décor (sprint 8)

Validé en maquette (compagnon visuel, `salle-epreuve.html`) :

- **Grande salle du restaurant hanté** dessinée en SVG/CSS, en fond de tous les écrans de jeu :
  lustre de bougies, fenêtres en arc avec lune, portraits aux yeux luisants, longue table nappée avec
  chandeliers, fantôme translucide, toile d'araignée, brume au sol, vignettage. Rendu soigné (dégradés,
  lueurs), animations discrètes (flammes qui vacillent, fantôme qui passe) coupées en
  `prefers-reduced-motion`.
- **Consigne** sur un parchemin façon carte de restaurant, en haut.
- **Gros cadenas vu en coupe** au centre : une goupille par épreuve. À chaque bonne réponse, la
  goupille tombe (animation + petit « clac » synthétisé), sa zone s'éclaire et le chiffre gagné
  s'inscrit dessous. Quand toutes sont tombées, l'anse se décroche, puis écran du code final.
- **Saisie** sous le cadenas : pavé en sceaux de cire (chiffres) ou clavier de lettres en bois (mots).
- **Écran d'entrée** devant la porte du restaurant, message sur une lettre.
- Tablette 810×1080 d'abord, lisible sur téléphone 360 px.

Le détail (composants SVG, animations) sera précisé dans le plan du sprint 8.

## Tests

- Vitest :
  - validateur : chaque nouvelle erreur (type inconnu, réponse non numérique en `chiffres`,
    caractère intapable en `mots`, chiffre hors 0–9, `solution` obsolète, `entree` sans message) ;
  - `isCorrectAnswer` : accents, majuscules, espaces, zéros de tête, réponse vide, mot faux ;
  - réducteur : `start` avec et sans entrée, `enter` juste et faux, `answer` qui ajoute le bon chiffre ;
  - `restoreGameState` : état `entrance` valide et incohérent ;
  - composants : saisie au clavier de lettres, effacement, longueur max, valider désactivé si vide.
- Playwright : partie complète avec entrée par un mot, une épreuve en chiffres, une en mots, jusqu'à la
  victoire ; le compteur n'apparaît qu'après l'entrée ; reprise après rechargement sur l'écran d'entrée.

## Hors périmètre

- Contenu réel des épreuves (fourni plus tard par Romain).
- Indices par épreuve, pénalités de temps, plusieurs réponses acceptées par épreuve.
