# CLAUDE.md — quiz-halloween

## But
Escape game d'Halloween pour 6 équipes d'enfants du Centre de Loisirs, une tablette par équipe.
Les équipes tournent entre 6 épreuves réelles, par créneaux de 15 min comptés depuis « Commencer »
(équipe e, créneau c → épreuve (e+c) mod 6). À chaque épreuve, les enfants tapent la bonne réponse
(chiffres ou mots), ce qui donne un chiffre (0–9) ; une épreuve pas trouvée à temps donne son chiffre
avec le code animateur. Les chiffres ouvrent un cadenas final qui déclenche une animation. L'équipe
de la tablette est réglée par un animateur (code animateur). Un indice par épreuve (bouton débloqué à
`indice_apres_minutes`) ; une mauvaise réponse bloque la saisie `blocage_secondes`. Tout le contenu vient
de `quiz.yaml`.

Conception : `docs/superpowers/specs/2026-09-21-quiz-halloween-design.md` (quiz d'origine) et
`docs/superpowers/specs/2026-09-24-escape-game-design.md` (escape game en rotation).

## Utilisateurs
- **Enfants** (en groupe, sur tablette) : jouent.
- **Animateurs** : règlent l'équipe de chaque tablette, lancent la partie, donnent le chiffre d'une
  épreuve ratée (code animateur), remettent à zéro, éditent le YAML.

## Stack
- Vite 8 + React 19 + TypeScript, vite-plugin-pwa (manifest, service worker et icônes PNG
  générés depuis `public/icon.svg` via `pwa-assets.config.ts`).
- Tests : Vitest 5 + Testing Library + jsdom ; Playwright (chromium, vue tablette 810×1080).
- **Pas de Supabase ni de backend** : aucune donnée à stocker ou partager, zéro donnée personnelle.
  La progression est gardée dans le localStorage de la tablette.

## Structure
```
quiz.yaml                  paramètres du quiz (clés en français, commentées)
public/images/             images des étapes (référencées par `image:`)
scripts/valider.ts         CLI du validateur (tsx), lancé en prebuild
src/config/                types, validateurs purs (checks, validateStep, validatePadlock,
                           validateQuiz), parseQuiz (YAML), images (CLI), loadQuiz (import ?raw)
src/game/                  logique pure : time, answer (normalisation chiffres/mots), messages, padlock,
                           rotation (créneau → épreuve), phase (écran dérivé de l'horloge),
                           progress (réducteur de partie), fingerprint (empreinte du quiz),
                           restore (contrôle d'un état relu), block (blocage après mauvaise réponse)
src/hooks/                 useNow (horloge qui avance), useTeam (équipe de la tablette), useGameProgress
src/components/            Game (porte : réglage de l'équipe), TeamGame (assembleur des écrans de jeu),
                           un composant par écran (TeamSetupScreen, TimeUpScreen, ...) + EntranceScreen,
                           AnswerInput, Keypad, LetterKeyboard, AnswerZone (zone de retour mauvaise
                           réponse partagée par StepScreen et EntranceScreen), Dial, HauntedDoor,
                           CutawayLock (cadenas en coupe de l'écran d'étape, une goupille par épreuve),
                           ResetControl (ResetButton appui long + ResetDialog), HintButton (bouton +
                           fenêtre d'indice), ...
src/components/decor/      décors SVG en fond : HallBackdrop (grande salle : HallRoom, HallWindows,
                           HallFurniture, HallSpirits, Candle) et RestaurantFront (façade + RestaurantDoor)
src/services/              sound (victoire + « clac » de goupille, synthétisés en Web Audio), savedGame et savedTeam (seuls accès au localStorage)
src/styles/                thème « Manoir à la bougie » : base, controls, screens, padlock, lock, decor, victory, reset, hint
src/test/setup.ts          setup Vitest (matchers jest-dom, localStorage vidé après chaque test)
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
- **Créneaux** : créneau, « Temps écoulé » et cadenas sont dérivés par `gamePhase` depuis `startedAt` +
  `Date.now()` (jamais par une action). L'action de réponse nomme son épreuve : un tap pile au
  changement de créneau est ignoré.
- **Équipe** : clé localStorage `quiz-halloween:team` (le nom, pas l'index). Une remise à zéro la garde ;
  « Changer d'équipe » ne l'efface pas (retour au réglage seulement). Choisir une **autre** équipe efface la
  partie ; rechoisir la même la reprend (sinon ses créneaux repartiraient de zéro, dans la salle d'une autre).
- **Code animateur** : affiché en points (`secret` d'`AnswerZone`), gardé en texte par `parseQuizYaml`
  comme `reponse` (un 0 initial n'est pas perdu).
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
- **Sauvegarde** : clé localStorage `quiz-halloween:progress` = `{ fingerprint, state }`, avec
  `state = { status, digits (un par épreuve), startedAt, finishedAt, wrongAttempts, wrongSlot, blockedUntil }` ;
  `wrongSlot` empêche un message de mauvaise réponse de suivre le groupe au créneau suivant. L'empreinte est
  calculée sur la **config validée** (pas le texte du YAML) : changer un commentaire ne perd pas la partie,
  changer une réponse si. Tout état relu passe par `restoreGameState` ; aucune erreur de stockage ne
  remonte (retour à l'accueil). Statut `home` = pas de sauvegarde (c'est ainsi que `reset` l'efface).
- **Remise à zéro** : durée de l'appui = `RESET_HOLD_MS` (ResetButton.tsx), à garder égale à l'animation
  `reset-fill` (3s) de `reset.css`. L'icône est en `position: absolute` en bas de `#root`, pas `fixed` :
  sur téléphone l'écran du cadenas défile et une icône fixe passait sur les molettes. `.screen` garde
  96 px libres en bas pour elle. Pendant une partie (`playing`), « Recommencer » demande le code animateur
  (un reset refait partir les créneaux de la tablette : l'équipe ne serait plus dans la bonne salle) ; la
  fenêtre défile sur téléphone (`.reset-overlay` en `overflow-y: auto`, marges auto).
- **Playwright et noms de boutons** : `getByRole({ name })` compare en sous-chaîne sans casse ;
  « Recommencer la partie » contient « Commencer » → toujours `exact: true` sur « Commencer ».
- **Vérif visuelle après rebuild** : le service worker de la PWA peut resservir l'ancien build ;
  repartir d'un navigateur neuf (fermer le contexte Playwright).
- **Réponses** : en `mots`, majuscules/accents/espaces autour ignorés et les espaces répétés à
  l'intérieur comptent pour un seul (`normalizeAnswer`) ; en `chiffres`, les zéros de tête comptent.
  YAML lirait `reponse: 0472` sans guillemets comme le nombre 472 : `parseQuizYaml` restaure le
  texte source de tout `reponse` numérique (via `visit` sur le document parsé) avant validation,
  donc les guillemets sont facultatifs pour garder un 0 initial.
- **Saisie** : `AnswerInput` est un `<output>` (rôle `status`) : il n'est jamais affiché en même temps
  que « Chiffre trouvé », sinon `getByRole('status')` deviendrait ambigu. Le texte tapé s'efface après
  une mauvaise réponse (remontage par `key`).
- **Entrée** : toujours gérée mais absente du `quiz.yaml` d'exemple (code d'entrée sur papier).
  Statut `entrance` avant `playing`, `startedAt` à null ; le compteur démarre à la bonne
  réponse.
- **Décors** : SVG en `position: fixed` z-index 0 (`.backdrop`), sous `.screen` (z-index 1). `TeamGame` choisit le
  décor selon le statut : aucun à l'accueil, `RestaurantFront` à l'entrée, `HallBackdrop` ensuite. Les
  dégradés partagés sont dans `DecorGradients` (ids `hall-*`, jamais `lock-*`). Sur téléphone, le décor est
  rogné sur les côtés (`slice`) : ne rien mettre d'important hors de x 162–648 du viewBox. Tout texte posé sur le
  décor a besoin d'un fond ou d'un voile (la nappe claire rend l'ambre illisible).
- **Clac de goupille** : joué dans le tap « Valider », d'où `answer()` qui renvoie un booléen (comme `unlock()`).
  La chute `pin-fall` (0,45 s, `lock.css`) est calée avec le son de `playPinSound` (`sound.ts`).
- **Hauteur de l'écran d'étape** : sur tablette (810×1080) il tient pile, sans défilement, grâce au cadenas à
  260 px et à l'écart de saisie de 12 px (`screens.css`), malgré l'entête à deux compteurs (créneau en gros,
  total en petit). Toute ligne ajoutée à l'écran d'étape le fera défiler : `e2e/layout.spec.ts` le vérifie
  (pavé et clavier de lettres).
- **e2e de la rotation** : `setUpTablet(page, équipe)` en premier dans chaque test (sinon écran de réglage) ;
  `page.clock.fastForward('15:00')` avance d'un créneau. Code animateur du YAML d'exemple : 2710.
- **Blocage** : `blockedUntil` (timestamp) dans l'état sauvegardé, plafonné à la fin du créneau (`blockEnd`) ; le
  réducteur ignore toute réponse pendant le blocage (ni bonne ni mauvaise) et `earnsDigit` renvoie false (pas de
  « clac »). Le décompte remplace la réponse tapée dans l'`<output>` (pas de ligne en plus). Seulement sur les épreuves.
- **Indice** : `secondsBeforeHint` dérivé du chrono du créneau ; bouton en `position: absolute` à cheval sur le bas du
  parchemin (`hint.css`), pour ne pas allonger l'écran d'étape. Pas d'indice sur l'attente, « Temps écoulé » ni le
  cadenas. La fenêtre est dans le parchemin : `hint.css` lui redonne l'encre claire (sinon texte sombre sur fond sombre).
- **e2e** : après une mauvaise réponse à une épreuve, `page.clock.fastForward('01:00')` avant de retaper.
