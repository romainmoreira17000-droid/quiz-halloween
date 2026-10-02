# CLAUDE.md — quiz-halloween

## But
Escape game d'Halloween pour 5 équipes d'enfants du Centre de Loisirs, une tablette par équipe.
Les équipes tournent entre les épreuves réelles, par créneaux de 15 min comptés depuis « Commencer »
(sans finale : équipe e, créneau c → épreuve (e+c) mod 6). Sprint 24 : « Invisible mais visible » est la **finale**
(`finale: true`), jouée par toutes les équipes ensemble au 6e créneau, après la rotation des 5 autres (tout le monde est
dans la même salle ; 5 équipes pour 5 postes : chaque équipe seule dans sa salle ; avec plus d'équipes, des postes seraient partagés). À chaque épreuve, les enfants tapent la bonne réponse
(chiffres ou mots), ce qui donne un chiffre (0–9) ; une épreuve pas trouvée à temps donne son chiffre
avec le code animateur. Les chiffres ouvrent un cadenas final qui déclenche une animation. L'équipe
de la tablette est réglée par un animateur (code animateur). Jusqu'à 3 indices par épreuve (débloqués un par un
aux minutes de `indices_apres_minutes`, ou un de plus par appui dans le menu animateur) ; une mauvaise réponse bloque la saisie `blocage_secondes`. Tout le contenu vient
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
- **Supabase seulement pour le suivi à distance** (sprint 23) : table `team_status` (nom d'équipe + état de partie,
  aucune donnée personnelle). La partie reste dans le localStorage de la tablette, qui joue sans réseau.

## Structure
```
quiz.yaml                  paramètres du quiz (clés en français, commentées)
public/images/             images des étapes (`image:`) et fonds photo WebP (`fond`, `fond_accueil`, `cadenas.fond`)
images-sources/            illustrations PNG d'origine de Romain (gitignoré, converties par `npm run images`)
supabase/                  config.toml + migrations/ (base du suivi à distance)
scripts/check-board-security.ts  vérifie la base avec la clé anon, comme un intrus (`npm run check:board`)
scripts/valider.ts         CLI du validateur (tsx), lancé en prebuild
scripts/images.ts          CLI de conversion PNG → WebP (sharp), nom simplifié par `slug.ts`, sources choisies par `sources.ts`
src/config/                types, validateurs purs (checks, validateStep, validatePadlock,
                           validateQuiz), parseQuiz (YAML), images (CLI), loadQuiz (import ?raw)
src/game/                  logique pure : time, answer (normalisation chiffres/mots), messages, padlock,
                           rotation (créneau → épreuve, finale commune, `nextChallenge`), arrival (trajet vers la salle), hints (déblocage des indices, `hintsAvailable`), phase (écran dérivé de l'horloge),
                           progress (réducteur de partie), fingerprint (empreinte du quiz),
                           restore (contrôle d'un état relu), block (blocage après mauvaise réponse),
                           skip + testMode (mode test : saut de créneau, activé par `?test`), startTime (heure de départ ↔ « hh:mm »),
                           suivi à distance : boardSnapshot (lecture de `read_board`), boardClock (horloge commune), boardCard
                           (contenu d'une carte d'équipe), boardMode (`?animateur`), syncStatus, latestSender (envois un par un), boardAlerts (alertes du tableau)
src/hooks/                 useNow (horloge qui avance), useTeam (équipe de la tablette), useGameProgress,
                           useCelebration (« Bravo ! » quand l'épreuve affichée passe à trouvée), useFinaleHold (finale gardée à l'écran pendant son « Bravo ! »),
                           useBoardSync (envoi de l'état de la tablette), useBoard (relecture du tableau toutes les 5 s), useBoardAlerts (bandeau et sonnerie), useWakeLock (écran
                           allumé), useEveningCode
src/components/            Game (porte : réglage de l'équipe), TeamGame (assembleur des écrans de jeu),
                           un composant par écran (TeamSetupScreen, TravelScreen, TimeUpScreen, ...) + EntranceScreen,
                           AnswerInput, Keypad, LetterKeyboard, AnswerZone (zone de retour mauvaise
                           réponse partagée par StepScreen et EntranceScreen), Dial, HauntedDoor,
                           CutawayLock (cadenas en coupe de l'écran d'étape, une goupille par épreuve),
                           ResetControl (ResetButton appui long + ResetDialog), HintButton (bouton +
                           fenêtre d'indice), TestModeControl (étiquette + bouton du mode test),
                           AnimatorMenu + TeamAnimatorMenu (menu animateur, actions possibles selon l'écran) + SkipNext (« Passer à l'épreuve suivante » avec confirmation) + StartTime (« Départ de la partie »),
                           CelebrationOverlay (plein écran « Bravo ! » + chiffre gagné), ...
src/components/board/      tableau animateur à distance (`?animateur`) : BoardScreen (porte : code de soirée), BoardCodeForm,
                           BoardView, BoardHeader, TeamCard (+ TeamDigits, CardSolution, CardHints), NewEvening (« Nouvelle soirée »
                           avec confirmation), SolutionsPanel, AlertBanner, AlertToggle (« Activer les alertes »)
src/components/lock/       cadenas Halloween en bronze : LockDefs (dégradés bronze, os, ciel, citrouille ; ids `lock-*`),
                           Ornaments (Bone, Skull, Cobweb, Keyhole), LockCrown (LockShackle + ailes et citrouille),
                           LockBanner (« HAPPY HALLOWEEN »), NightWindow (ciel, lune, sorcière, château), HangingGhost,
                           HalloweenLockBody (corps partagé), LockChains, FinalLock (cadre HTML du cadenas final),
                           VictoryLock (cadenas de la plongée de victoire)
src/components/decor/      décors SVG en fond : HallBackdrop (grande salle : HallRoom, HallWindows,
                           HallFurniture, HallSpirits, Candle) et RestaurantFront (façade + RestaurantDoor)
src/services/              sound (victoire + « clac » de goupille, synthétisés en Web Audio), savedGame, savedTeam et savedEveningCode (seuls accès au localStorage),
                           supabaseClient + board (seuls accès à Supabase, appels coupés au bout de 10 s), notify (son + vibration de l'animateur)
src/styles/                thème « Manoir à la bougie » : base, controls, screens, padlock, lock, decor, victory, reset, hint, test-mode, animator, celebration, story, travel, board
src/test/setup.ts          setup Vitest (matchers jest-dom, localStorage vidé après chaque test) ; arrive.ts (tape « Nous sommes arrivés »)
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
npm run images       # convertit images-sources/ en WebP dans public/images/
npm run valider      # vérifie quiz.yaml + images (aussi en prebuild)
npm run build        # build de production dans dist/
BOARD_CODE=... npm run check:board   # sécurité de la base du suivi à distance (-- --full avant la soirée)
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
  `state = { status, digits (un par épreuve), startedAt, finishedAt, wrongAttempts, wrongSlot, blockedUntil, hintSlot, hintCount }` ;
  `wrongSlot` empêche un message de mauvaise réponse de suivre le groupe au créneau suivant. L'empreinte est
  calculée sur la **config validée** (pas le texte du YAML) : changer un commentaire ne perd pas la partie,
  changer une réponse si, **tout changement de forme de `QuizConfig`** aussi (nouveau champ, champ renommé : un
  déploiement de l'app peut donc perdre les parties en cours → ne jamais déployer pendant la soirée). Tout état relu passe par `restoreGameState` ; aucune erreur de stockage ne
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
  190 px et à l'écart de saisie de 12 px (`screens.css`), malgré l'entête à deux compteurs (créneau en gros,
  total en petit). Place pour une consigne de **4 lignes au plus** (≈ 200 caractères). Toute ligne de plus le fera défiler : `e2e/layout.spec.ts` le vérifie
  (pavé et clavier de lettres).
- **e2e de la rotation** : `setUpTablet(page, équipe)` en premier dans chaque test (sinon écran de réglage) ;
  `page.clock.fastForward('15:00')` avance d'un créneau. Code animateur du YAML : 1717.
- **Blocage** : `blockedUntil` (timestamp) dans l'état sauvegardé, plafonné à la fin du créneau (`blockEnd`) ; le
  réducteur ignore toute réponse pendant le blocage (ni bonne ni mauvaise) et `earnsDigit` renvoie false (pas de
  « clac »). Le décompte remplace la réponse tapée dans l'`<output>` (pas de ligne en plus). Seulement sur les épreuves.
- **Indices** : `hintsAvailable` (`hints.ts`) = le **max** (pas la somme) entre les indices débloqués par le chrono du
  créneau (`hintsUnlockedByClock`) et ceux donnés par l'animateur dans ce créneau (`hintCount` si `hintSlot` = créneau),
  plafonné au nombre d'indices de l'étape. Horaires communs à toutes les épreuves ; le validateur refuse une étape avec plus
  d'indices que d'horaires. Anciennes clés `indice_apres_minutes` / `indice` d'étape : message « remplacée par ». Un seul
  bouton (« Voir l'indice (1/3) », « Voir les indices (2/3) ») dont la fenêtre suit l'arrivée des indices ; bouton en `position: absolute` à cheval sur le bas du
  parchemin (`hint.css`), pour ne pas allonger l'écran d'étape. Pas d'indice sur l'attente, « Temps écoulé » ni le
  cadenas. La fenêtre est dans le parchemin : `hint.css` lui redonne l'encre claire (sinon texte sombre sur fond sombre).
- **e2e** : après une mauvaise réponse à une épreuve, `page.clock.fastForward('01:00')` avant de retaper.
- **Fonds photo** : `backdropFor` (`src/game/backdrop.ts`) choisit le décor : `fond_accueil` à l'accueil et pendant l'attente,
  `fond` de l'épreuve pendant l'épreuve et « Temps écoulé », `cadenas.fond` au cadenas et à la victoire ; sans fond, grande salle
  dessinée (façade à l'entrée, rien à l'accueil). `PhotoBackdrop` : `object-fit: cover` + voile sombre (`decor.css`) ; ne jamais
  commiter de PNG lourd dans `public/` (précache PWA : le build casse au-delà de 2 Mo). WebP ≈ 200 Ko via `npm run images`.
- **Mode test** : `?test` dans l'adresse (lu par `Game` via `isTestMode`), jamais activable depuis l'app. L'action
  `skipSlot` recule `startedAt` jusqu'à la fin du créneau (`startForNextSlot`) et efface `blockedUntil` (horodaté en
  absolu, il suivrait sinon au créneau suivant) ; seulement en `challenge`/`waiting`, pas sur « Temps écoulé ».
  Bouton en bas à droite, dans la bande libre de 96 px, en face de l'icône de remise à zéro. En e2e :
  `page.goto('./?test')`, sans `page.clock`.
- **Menu animateur** : ↺ appui long → « Menu animateur » (`ResetDialog`, prop `menu`) → code toujours demandé (le menu
  montre les solutions). Actions du réducteur `animatorSolve`, `unblock`, `showHint`, vérifiées contre la phase ; aucune ne
  touche au temps, sauf `animatorSkip` (« Passer à l'épreuve suivante », épreuve ou attente) : même recul de `startedAt`
  que `skipSlot`, mais donne le chiffre de l'épreuve pas trouvée (pas de « Temps écoulé » ensuite) et nomme son épreuve
  (un tap pile au changement de créneau ne saute pas deux fois). Confirmation obligatoire (avec « Annuler ») : à faire sur
  **toutes** les tablettes, sinon l'équipe arrive dans une salle occupée.
  `setStart` (« Départ de la partie », tout l'écran `playing`) : recale une tablette décalée sur l'heure de départ des autres
  (`<input type="time">`, aujourd'hui ; une heure à venir compte pour hier si c'est à moins de 12 h, pour une soirée
  qui passe minuit, sinon refusée) ; garde les chiffres, efface blocage, mauvaises réponses et
  indices donnés (ils visaient un créneau qui ne correspond plus). Les créneaux sautés passent par « Temps écoulé ». `showHint` = un indice de plus (`hintSlot` = créneau, `hintCount` = disponibles + 1). Relecture :
  `hintSlot` absent (avant le sprint 13) → null ; `hintCount` absent (avant le sprint 14) → 1 si `hintSlot` est un créneau,
  sinon 0 (simple garde-fou : le sprint 14 a changé la forme de la config, donc l'empreinte, et `loadGame` écarte ces
  vieilles sauvegardes avant la relecture). `TeamAnimatorMenu` ne passe
  que les actions possibles à l'écran (validation seulement en `challenge`). Le « clac » est joué dans le tap
  (`animatorSolve` renvoie un booléen). En test, taper le code **dans** la fenêtre (`within(dialog)`) : l'écran d'étape a
  aussi un pavé.
- **« Bravo ! » et attente** : `useCelebration` ne célèbre que le passage « pas trouvé → trouvé » pendant que l'écran d'étape
  est affiché (bonne réponse **ou** « Valider l'épreuve » de l'animateur) ; un écran qui s'ouvre déjà trouvé (rechargement)
  ne rejoue rien. Délai 1,5 s (chute de la goupille puis tressautement du cadenas, que le fond opaque cacherait) puis 3 s (`CELEBRATION_DELAY_MS`, `CELEBRATION_MS`), fermeture au tap.
  Fond **opaque** (un voile translucide laissait voir « Chiffre trouvé » sous le gros chiffre). L'overlay est un `dialog`
  nommé « Bravo ! » : en test, toujours `getByRole('dialog', { name: ... })` si l'écran peut en montrer deux. En e2e avec
  `page.clock`, le « Bravo ! » n'apparaît qu'après un `fastForward`. `message_attente` (racine du YAML, facultatif, même
  texte dans toutes les salles) s'affiche sous « Chiffre trouvé », au-dessus de « Changement d'épreuve dans ».
- **Cadenas Halloween** (`src/components/lock/`, sprint 20, style de `images-sources/cadenas.jpeg`) : les ids SVG partagés sont en
  `lock-*` (ceux des décors en `hall-*`) ; un seul `LockDefs` et un seul `NightWindow` (`lock-window-clip`) par écran. `CutawayLock`
  garde son viewBox `0 0 300 250` et 190 px (écran d'étape sans défilement) ; `LockShackle` avant `HalloweenLockBody`, `LockCrown`
  après. Molettes du cadenas final = tambours 3D : `rollDrum` (`padlock.ts`) donne l'angle cumulé (9 → 0 roule en avant), le
  tambour est `aria-hidden`, le chiffre reste lu dans l'`<output class="dial-value">` (masqué visuellement). Le cadenas final est
  un cadre HTML (le corps grandit avec les molettes) : 6 molettes tiennent sur 360 px de large (`e2e/halloween-lock.spec.ts`),
  os masqués sur téléphone. Bonne réponse = `cutaway-lock--jolt` tant que `fallingIndex` est donné (0,4 → 1,5 s, fini avant le
  « Bravo ! » ; rejoué au rechargement d'un écran trouvé, comme la chute de goupille). Mauvais code = `final-lock--alarmed` (yeux
  rouges). L'indice du cadenas (`cadenas.indice`, bloc `|-` en YAML) garde ses retours à la ligne (`.hint` en
  `white-space: pre-line`) : c'est la comptine qui donne l'ordre des salles. Victoire = `.victory-plunge` plein écran (`pointer-events: none`, état final invisible) : pivot 0–0,6 s, anse 0,9 s,
  plongée 1,2–2,4 s, portes 2,4 s, texte 5,6 s, calés sur `sound.ts` ; pas d'état de partie en plus. Les animations CSS ne suivent
  pas `page.clock` : pour une capture à un instant précis, `document.getAnimations()` + `pause()` + `currentTime`.
- **Suivi à distance** (sprint 23, `?animateur`) : tables `team_status` et `evening_secret` en RLS **sans aucune policy** (et
  `revoke all` pour anon) ; tout passe par les fonctions `security definer` `push_team_state` / `read_board` / `reset_board`
  (paramètres `p_*`), qui vérifient le code de soirée (bcrypt) ; mauvais code = SQLSTATE `28P01` (+ 0,5 s d'attente, sous un verrou global `pg_advisory_xact_lock` : les essais en parallèle
  ne vont pas plus vite ; un compteur d'échecs ne marcherait pas, le `raise` annule la transaction), 12 équipes
  au plus, état ≤ 2 Ko. Le code de soirée n'est **jamais** dans le dépôt (réglé à la main dans l'éditeur SQL, voir README).
  Sans `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, le suivi est désactivé et le jeu marche comme avant. En test unitaire,
  `vite.config.ts` vide ces variables ; en e2e, `playwright.config.ts` pointe sur `https://board.e2e.test` (intercepté par
  `page.route`, faux Supabase). Envois un par un (`createLatestSender` : seul le dernier état en attente part). La carte
  recalcule tout avec `gamePhase` sur l'horloge du serveur (`server_now`) et exige la même empreinte de quiz que le tableau
  (sinon « Version différente ») ; un état `home` = « Pas commencé ». Pas de `supabase gen types` (écart assumé) : trois
  fonctions seulement, réponses vérifiées à l'exécution par `parseBoard`.
- **Tableau détaillé et alertes** (#84) : cases de chiffres dans l'ordre de passage (`track`, via `challengeAt`), solution de
  l'épreuve en cours masquée (`CardSolution`, `key` = titre : se referme au changement d'épreuve), texte des indices vus, panneau
  « Solutions » replié (code du cadenas par `padlockCode`). Alertes : Temps écoulé, tablette `silent`, 3 mauvaises réponses
  (`ALERT_WRONG_ATTEMPTS`) ; une clé par besoin (`newAlerts` compare les clés : sonne une fois), **rien ne sonne au premier tableau**,
  et **aucune comparaison** tant que le tableau n'a pas lu depuis 15 s (`BOARD_FRESH_MS`, `online`) : un téléphone sorti de veille
  ferait sinon sonner de faux « Temps écoulé » (horloges calculées sur de vieilles nouvelles) et resonner les tablettes muettes
  au retour. « Muette » seulement pour une tablette en jeu (pas `home`, `won`, `otherVersion` : elle dort peut-être). Son + vibration seulement après « Activer les alertes » (geste, bip de test) ; Wake Lock redemandé
  au retour sur la page. Bandeau en `aria-live` (pas `role="alert"`, déjà pris par l'échec de « Nouvelle soirée ») : en test,
  `getByRole('list', { name: 'Alertes' })`. Wake Lock absent en Playwright headless → « Garde l'écran allumé ».
- **Raccourci d'appli** (#87) : une appli installée s'ouvre toujours sur `start_url` (le jeu) ; le tableau passe par
  `manifest.shortcuts` (`vite.config.ts`, appui long sur l'icône Android). Chrome ne relit le manifeste d'une appli installée
  que rarement : après un changement, désinstaller puis réinstaller. Vérifié par `e2e/app-shortcut.spec.ts`.
- **Finale commune** (sprint 24, `finale: true` → `QuizConfig.finalStep`, index 0-based) : `challengeAt` fait tourner les
  autres épreuves puis donne la finale à tous au dernier créneau ; une seule finale (validateFinal), avec ses `indices` comme
  les autres (sprint 25 : mêmes horaires, toutes les tablettes en même temps) ; il faut
  **au moins** une équipe par épreuve en rotation (plus d'équipes = postes partagés). `gamePhase` passe au cadenas **dès** la
  finale trouvée ; `useFinaleHold` garde alors l'écran de la finale le temps du « Bravo ! » (passage détecté **pendant le
  rendu**, pas dans un effet : une image de cadenas démonterait `StepScreen`). Pas de « Bravo ! » après « Passer à l'épreuve
  suivante » (créneau dépassé) ni au rechargement. En e2e, les Zombies jouent 2, 3, 4, 5, 1 puis 6 ; la finale se teste en
  `?test` avec les Sorcières (`e2e/offline.spec.ts` : parcours complet hors ligne, après `navigator.serviceWorker.ready`).
- **Récit** (sprint 27, `recit` d'étape → `QuizStep.story`, facultatif) : morceau d'histoire affiché (`.story`, `story.css`, voile
  sombre) sous « Chiffre trouvé » et au-dessus de `message_attente`, aussi après le code animateur de « Temps écoulé » ; celui de
  la finale est sur l'écran du cadenas (la finale y passe tout de suite). Chaque équipe tourne dans son ordre : un récit doit se
  comprendre seul, en 160 caractères environ (pas de plafond au validateur). Écran d'attente de chaque salle sans défilement sur tablette : `e2e/layout.spec.ts`.
- **Trajet vers la salle** (#90) : à chaque nouveau créneau (le 1er après « Commencer » et la finale compris), `TravelScreen`
  (« Maintenant, dirigez-vous vers : <titre> » + « Nous sommes arrivés ») remplace l'écran d'étape tant que
  `isOnTheWay(phase, arrivedSlot)` : la phase reste `challenge` (tableau animateur et menu animateur inchangés), seul
  `arrivedSlot` (état sauvegardé, absent avant #90 → null) dit si l'équipe est arrivée ; l'action `arrive` nomme son créneau.
  Chrono et indices tournent pendant le trajet. L'écran d'attente annonce `nextChallenge` (« Prochaine épreuve : … », `.next-step`),
  rien au dernier créneau. Nom = titre de l'épreuve (pas de champ `salle`). En test : `arriveIfAsked` (`src/test/arrive.ts`,
  appelé par `press`/`wait` des anciens tests) et `arriveIfAsked(page)` en e2e (`typing.ts`, aussi appelé par `typeAnswer`).
  L'écran d'attente des toilettes scientifiques tient à 4 px près sur tablette : `.next-step` a un padding vertical de 2 px.
