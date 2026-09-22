# État du projet — quiz-halloween

Dernière mise à jour : 2026-09-22 (sprint 7 codé, testé et relu ; PR à ouvrir)

## Sprint en cours
- **Sprint 7** : message d'entrée + réponses en chiffres ou en mots (issue #14).
- Branche `feat/entrance-and-text-answers`. **PR #16** ouverte, en attente de Romain.
- Spec : `docs/superpowers/specs/2026-09-22-entree-et-reponses-design.md` (validée par Romain).
- Plan : `docs/superpowers/plans/2026-09-22-sprint7-entree-et-reponses.md` (7 tâches).
- Sprint suivant déjà ouvert : **sprint 8**, décor de la grande salle + cadenas en coupe (issue #15).

## Où on en est
- [x] Sprints 1 à 6 terminés et en ligne. Romain a testé sur tablette : tout marche.
- [x] Sprint 7 : brainstorming, spec, plan
- [x] Tâches 1 à 7 (sous-agents Sonnet, relecture par tâche) + relecture globale Opus + corrections
- [x] 242 tests unitaires, 7 e2e, typecheck, lint, valider, build : tout vert
- [x] Vérif navigateur (810×1080 et 360 px, navigateur neuf) : entrée, étape chiffres, étape mots
- [x] Relecture `relecteur-code` (prête pour la PR), PR #16 ouverte
- [ ] Romain : relire la PR et décider du merge ; puis sprint 8 (décor, issue #15)

## Prochaine action concrète
Attendre que la CI de la PR #16 soit verte et que Romain décide du merge. Après merge :
`git checkout main && git pull && git branch -d feat/entrance-and-text-answers`, puis sprint 8 (issue #15).

## Décisions prises (et pourquoi)
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
