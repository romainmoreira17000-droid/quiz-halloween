# État du projet — quiz-halloween

Dernière mise à jour : 2026-09-26 (sprint 9 : les 6 tâches commitées, reste relecture + PR)

## Sprint en cours
- **Objectif :** transformer le quiz en escape game pour 6 équipes en rotation (sprint 9), puis indice et
  blocage (sprint 10). Conception : `docs/superpowers/specs/2026-09-24-escape-game-design.md`.
- **Issue :** #19 (sprint 9)
- **Branche :** `feat/team-rotation`
- **PR :** #21 (ouverte, à fusionner après accord de Romain)
- **Plan :** `docs/superpowers/plans/2026-09-24-sprint9-equipes-rotation.md` (6 tâches)

## Où on en est
- [x] Sprints 1 à 8 terminés et en ligne (PR #18 fusionnée).
- [x] Spec, scénario et plan du sprint 9 (PR #20 fusionnée)
- [x] Tâche 1 : clés `equipes`, `duree_epreuve_minutes`, `code_animateur`
- [x] Tâche 2 : créneaux, rotation et phase (logique pure)
- [x] Tâche 3 : équipe de la tablette (réglage, accueil, changement d'équipe)
- [x] Tâche 4 : écran « Temps écoulé », goupilles par épreuve
- [x] Tâche 5 : rotation jouée (état, hook, écrans, e2e) — 302 tests unitaires + 7 e2e verts (ba2832f)
- [x] Tâche 6 : contrôle de mise en page (`e2e/layout.spec.ts`), vérif navigateur 810×1080 et 390×844,
  2 retouches CSS, documentation (CLAUDE.md, README)
- [x] Relecture (`relecteur-code`) : I1 corrigé, I2 soumis à Romain, 4 mineurs reportés
- [x] PR #21 ouverte vers `main` (Closes #19), CI en cours
- [ ] Romain : réponses et chiffres de chaque épreuve, code animateur, code d'entrée (liste en fin de scénario)

## Prochaine action concrète
Attendre la CI verte de la PR #21 et la réponse de Romain : fusion, et code animateur pour « Recommencer »
(si oui : petite correction sur la même branche avant fusion). Après fusion :
`git checkout main && git pull && git branch -d feat/team-rotation`, puis sprint 10 (indice et blocage).

## Décisions prises (et pourquoi)
- Sprint 9 (relecture) : « Changer d'équipe » puis la même équipe reprend la partie au lieu de l'effacer
  (un enfant pouvait sinon décaler sa tablette dans la rotation pour toute la soirée).
- Sprint 9 (relecture, choix de Romain) : pendant une partie, « Recommencer » demande le code animateur (un reset
  en cours de soirée décalait l'équipe dans la rotation). À l'accueil et après la victoire, pas de code.
- Sprint 9 (tâche 6) : voile sombre derrière « Chiffre de l'épreuve » (écran Temps écoulé) : l'ambre était
  illisible sur la nappe claire ; boutons d'équipe en 40 px sans retour à la ligne (« Loups-garous » se
  coupait en deux). Écran d'étape sur tablette : aucun défilement, aucune retouche de hauteur nécessaire.
- Sprint 9 (tâche 6) : à revoir plus tard, hors sprint : sur l'écran du cadenas, la liste des chiffres et l'indice
  sont posés sur le décor sans voile (lisibles, mais moins que sur fond uni).
- Sprint 9 (plan) : clés YAML du sprint 9 seulement (`equipes`, `duree_epreuve_minutes`, `code_animateur`) ;
  indice et blocage arrivent au sprint 10 avec leurs fonctionnalités.
- Sprint 9 (plan) : ni index d'équipe ni liste « débloqué par un animateur » dans l'état : l'équipe a sa propre clé ;
  un chiffre donné par l'animateur est rangé comme un chiffre trouvé. Choisir une équipe efface la partie.
- Sprint 9 (plan) : une mauvaise réponse garde son créneau (`wrongSlot`) ; une réponse nomme son épreuve (un tap
  au changement de créneau est ignoré) ; code animateur affiché en points (les enfants regardent).
- Sprint 9 (plan) : entête « Épreuve 3/6 » + chrono du créneau en gros + total en petit ; pas de chrono sur le
  cadenas ni la victoire (toutes les équipes finissent ensemble) ; le parchemin perd « Étape 2 sur 6 ».
- Sprint 9 (plan) : l'entrée (`entree`) reste gérée par le code mais sort du `quiz.yaml` d'exemple.
- Escape game (2026-09-24) : 6 équipes, 6 épreuves toutes en rotation (équipe e, créneau c → épreuve
  (e+c) mod 6) : avec l'épreuve 6 commune, une équipe restait sans épreuve. Le moment commun est le repas.
- Escape game : créneaux de 15 min calculés depuis « Commencer » ; pas trouvé → « appelez un animateur » +
  code animateur ; indice par bouton débloqué à 10 min, gratuit ; mauvaise réponse = saisie bloquée 1 min.
- Escape game : équipe réglée sur la tablette par un animateur (image au dos) ; code d'entrée sur papier
  (entrée retirée du YAML) ; chrono épreuve en gros + total en petit ; fin = cadenas virtuel puis vraie porte.
- Sprint 8 (relecture) : suggestions reportées : helper commun pour la règle « bonne réponse » (dupliquée entre
  le réducteur et `answer()`/`unlock()`), pavé à 88 px = limite basse, pas de tests des sous-composants décoratifs.
- Sprint 8 (tâche 6) : voile sombre derrière le texte de victoire : le temps en ambre était illisible sur la
  nappe claire de la grande salle. La queue du « Q » était déjà corrigée à la tâche 3 (fausse alerte).
- Sprint 8 (tâche 5) : la lettre et le clavier cachent le milieu de la façade ; la lanterne (à gauche), l'enseigne
  (à droite) et les citrouilles sont placées dans les bandes visibles (entre lettre et clavier, sous le clavier).
  Une seule lanterne au lieu de deux (l'enseigne prend la place de droite). Sur téléphone, les côtés sont coupés.
- Sprint 8 (tâche 5) : sur téléphone, marge du titre d'entrée réduite (24/16 px) : la lettre faisait défiler de 9 px.
- Sprint 8 (tâche 4) : sur tablette, cadenas d'étape à 260 px (au lieu de 300) et écart de saisie de 12 px :
  l'écran à pavé dépassait de 34 px. Il tient maintenant pile en 1080 px (pavé et clavier de lettres).
- Sprint 8 : l'entête (compteur + bougies) reste tel quel ; l'accueil garde sa bougie, sans décor
  (le spec ne parle que des écrans de jeu).
- Sprint 8 : décor en composants SVG React (pas une image) : animations des flammes coupées par la règle
  `prefers-reduced-motion` existante, et fichiers testables.
- Sprint 8 : le « clac » est joué dans le tap « Valider » (sinon bloqué par la tablette), d'où
  `answer()` qui renvoie un booléen, comme `unlock()`.
- Sprint 8 : sur tablette, l'écran d'étape garde 40 px en bas au lieu de 96 (l'icône ↺ est à gauche, loin
  des claviers centrés) pour que tout tienne en 1080 px.
- Sprint 7 (exécution) : `reponse: 0472` sans guillemets garde son 0 (le parseur relit le texte
  source du YAML) : un oubli de guillemets aurait bloqué les enfants sans aucune erreur.
- Sprint 7 : clavier de lettres resserré (touches 62 px sur tablette, 28 px sur téléphone) : les tailles
  du plan débordaient de l'écran. Hauteur des touches inchangée (70 px / 52 px).
- Sprint 7 : zone de réponse commune `AnswerZone` (entrée + étapes) ; une sauvegarde « entrée » sur un
  quiz sans entrée repart de l'accueil.
- À reprendre au sprint 8 : l'écran à pavé dépasse de 15 px en hauteur sur 810×1080 ; la queue du « Q »
  de la police déborde de sa touche.
- Sprint 7 : les enfants font des **épreuves réelles** ; la tablette sert à taper la bonne réponse
  (chiffres ou mots, choisi par épreuve dans le YAML), qui **donne** un chiffre (`reponse` + `chiffre`
  remplacent `solution`). 1 étape = 1 épreuve.
- Sprint 7 : message d'entrée facultatif (`entree`), sans chiffre ; le **compteur démarre à sa bonne
  réponse**. Mots : majuscules, accents, espaces autour ignorés ; chiffres : zéros de tête comptés.
  Une seule réponse acceptée par épreuve. Clavier AZERTY dessiné (celui du système cache l'écran).
- Sprint 7 : épreuves **fictives** dans le YAML ; Romain fournira les vraies (consigne, réponse, chiffre).
- Sprint 8 (décor, validé en maquette) : grande salle dessinée en SVG « belle comme une image IA »,
  consigne sur parchemin, **gros cadenas vu en coupe** dont une goupille tombe à chaque bonne réponse,
  anse qui se décroche à la fin (option A choisie). Maquette : `.superpowers/brainstorm/` (non versionné).
- Sprint 6 : icône en `position: absolute` en bas de page (pas `fixed` comme prévu au plan) : sur
  téléphone, l'écran du cadenas défile et une icône fixe couvrait la 1re molette. `.screen` garde 96 px
  libres en bas. Sur tablette, rien ne change à l'œil.
- Sprint 6 : relecture, point « une sauvegarde d'un autre quiz est effacée à l'ouverture » non retenu :
  elle ne pourrait jamais être reprise (empreinte différente), l'effacer ne perd rien. Pas de piège du
  Tab dans la fenêtre (2 boutons, usage tactile).
- Sprint 6 : e2e avec `exact: true` sur « Commencer » : Playwright compare en sous-chaîne et
  « Recommencer la partie » contient « Commencer » (4 e2e cassés sinon).
- Sprint 6 : icône ↺ pâle **en bas à gauche** (loin du pavé, peu tentante pour les enfants), anneau qui
  se remplit pendant l'appui de 3 s, puis **fenêtre du jeu** « Recommencer la partie ? » (Annuler /
  Recommencer), Annuler par défaut. Choix de Romain.
- Sprint 6 : empreinte calculée sur la **config validée**, pas sur le texte du YAML : modifier un
  commentaire ne fait pas perdre une partie en cours.
- Sprint 6 : essais ratés non restaurés ; son de victoire non rejoué après rechargement ; sauvegarde
  abîmée ou localStorage refusé → accueil, sans message.
- Sprint 5 : le cadenas ouvre **la salle du restaurant hanté** (pas un coffre à bonbons) → intro du YAML
  corrigée. Titre de l'écran et message de victoire dans le YAML (`cadenas.titre`,
  `cadenas.message_victoire`, facultatifs) pour réutiliser le jeu avec une autre histoire.
- Sprint 5 : animation = anse qui se soulève, double porte qui s'ouvre, lueur, fantômes et chauves-souris,
  puis message + temps mis. CSS pur ; styles de base = état final pour `prefers-reduced-motion`.
- Sprint 5 : son **synthétisé en Web Audio** (clac, grincement, gémissement) : pas de fichier, pas de
  droits, hors ligne. Lancé dans le tap « Ouvrir » (sinon bloqué par la tablette).
- Sprint 5 : molettes à 0 au départ, 9 ↔ 0 en boucle ; code faux = secousse + message, sans pénalité.
  Le compteur se fige à l'ouverture (`finishedAt`).
- Sprint 5 : sur téléphone, molettes resserrées (6 × 50 px) pour tenir sur une ligne à 360 px.
- Sprint 5 : un vieux `vite preview` sur le port 4173 faisait tourner l'e2e sur un ancien build
  (`reuseExistingServer`) ; noté dans les pièges du CLAUDE.md.
- Sprint 4 : `tsconfig.node.json` inclut `DOM` pour le code de `page.evaluate` en e2e ; test d'image
  via `vi.stubEnv('BASE_URL')` car Vitest sert depuis `/`.
- Sprint 4 : progression en **bougies** (design choisi), pas en citrouilles comme écrit dans l'issue.
- Sprint 4 : après la dernière étape, **écran provisoire** « Toutes les énigmes sont résolues ! » avec les
  chiffres trouvés ; remplacé par le cadenas au sprint 5.
- Mauvaise réponse : **messages qui tournent** (4 phrases), jamais deux fois le même de suite.
- Progression en mémoire seulement (réducteur pur) ; localStorage et remise à zéro au sprint 6.
- Polices @fontsource en sous-ensemble latin seulement (accents français couverts, cache hors ligne léger).
- Dépôt **public** : Pages sur dépôt privé exige un compte GitHub payant.
- Pas de Supabase : aucune donnée à stocker, zéro donnée personnelle.
- YAML validé à la construction : un YAML faux bloque la publication.
- Temps écoulé : le jeu continue (compteur rouge négatif).
- Sprint 6 (prévu) : progression sauvegardée sur la tablette ; remise à zéro par appui long 3 s.
- Sprint 5 (prévu) : cadenas, ordre + indice facultatifs dans le YAML.
- Actions GitHub en dernières versions (checkout/setup-node v7, pages v5) : les v4 tournent sur Node 20, déprécié.
- Exécution du plan en inline (pas de sous-agents) : tâches petites et enchaînées.
- `scripts/` a son propre `tsconfig.scripts.json` (résolution `bundler`) : `tsconfig.node.json` en
  `nodenext` refuse les imports sans extension de `src/config/`.
- Écran d'erreurs : clé React = index, pour ne pas perdre de ligne si deux messages sont identiques.

- Sprint 3 : maquettes = HTML statique jetable hors de `src/` (pas de TDD : aucune logique). Polices
  Google Fonts pour les maquettes ; la version finale les embarquera (jeu hors ligne).
- Public 7-10 ans, salle dans le noir : fond sombre, textes crème/ambre, pas d'aplats éblouissants,
  boutons du pavé ≥ 88 px.
- Maquettes : `commun.css` (squelette + bascule d'écran par `#accueil`/`#etape`/`#cadenas`, sans JS) +
  un .html/.css par direction. Chiffres toujours en police à chiffres alignés (le 0 ne doit pas
  ressembler à un o). Captures en `reducedMotion` pour qu'elles soient identiques d'un lancement à l'autre.

- Design retenu : **Manoir à la bougie** (`docs/design/maquettes/bougie.*`) : fond suie, texte crème,
  touches en sceaux de cire rouge, bougies pour la progression, IM Fell English SC (titres) + Alegreya.

## Points en suspens / questions pour Romain
- Protection de `main` : ajouter « Require status checks » (check `check`) pour qu'une PR ne puisse
  pas être fusionnée pendant que la CI tourne (c'est arrivé sur la PR #7, sans conséquence).
- Réglages GitHub sensibles (création du dépôt, push de `main`, invitations, protection) : Claude
  n'a pas la permission, Romain les lance avec `!`.

## Commandes du projet
```bash
npm run dev          # lancer en local
npm run test:run     # tests unitaires
npm run test:e2e     # tests de parcours (build + preview)
npm run typecheck    # vérification des types
npm run valider      # vérifie quiz.yaml et ses images
npm run build        # build de production
```

## Environnement
- Pas de backend.
- Hébergement : GitHub Pages — `https://romainmoreira17000-droid.github.io/quiz-halloween/`
- Variables nécessaires : aucune

## Pièges connus
- Le hook `garde-fous` bloque tout commit sur `main` : tout passe par une branche + PR.
- Le dossier n'était pas vide : create-vite a généré dans `$TEMP` puis copie.
- CI : sans `npm_config_libc: glibc` sur `npm ci`, npm saute `@rollup/rollup-linux-x64-gnu` et le
  build PWA casse (« Cannot find module »). Garder ce réglage dans les deux workflows.
- YAML des workflows : pas de « : » suivi d'un espace dans une commande `run:` non guillemetée.
- Pare-feu Windows (pas de droits admin) : `node.exe` ne peut pas écouter sur le réseau. Localhost
  marche (tests OK) ; tester sur tablette via le site Pages, pas via le serveur de dev.
- Le modèle create-vite actuel n'a plus `vite.svg` mais `favicon.svg`/`icons.svg` (supprimés).
- Service worker : un appareil qui a déjà ouvert le site voit l'ancienne version au premier
  chargement après un déploiement ; un rechargement suffit (vu en vérifiant le sprint 2).
