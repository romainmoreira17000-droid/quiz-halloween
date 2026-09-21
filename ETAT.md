# État du projet — quiz-halloween

Dernière mise à jour : 2026-09-21 (sprint 5 cadré)

## Sprint en cours
- **Objectif :** Sprint 5 — cadenas final + victoire (porte du restaurant hanté, animation, son)
- **Issue :** #5 (critères mis à jour)
- **Branche :** `feat/padlock-victory` (créée depuis `main` à jour)
- **PR :** pas encore
- **Plan :** `docs/superpowers/plans/2026-09-21-sprint5-cadenas-victoire.md` (9 tâches)

## Où on en est
- [x] Sprints 1 à 4 terminés (PR #7 à #10 fusionnées ; site en ligne).
- [x] Sprint 5 : cadrage validé par Romain, issue #5 mise à jour, plan écrit.
- [ ] Task 1 : clés YAML `cadenas.titre` / `cadenas.message_victoire` + histoire du restaurant
- [ ] Task 2 : logique pure (code, molettes, durée, messages de code faux)
- [ ] Task 3 : états `padlock`/`won`, action `unlock`, compteur figé
- [ ] Task 4 : `Dial` + `PadlockScreen` + padlock.css
- [ ] Task 5 : son synthétisé (`services/sound.ts`)
- [ ] Task 6 : `HauntedDoor` + `VictoryScreen` + victory.css
- [ ] Task 7 : branchement dans `Game`, suppression d'`AllSolvedScreen`
- [ ] Task 8 : e2e + vérif visuelle (tablette, téléphone, animations réduites)
- [ ] Task 9 : docs, relecture, PR

## Prochaine action concrète
Task 1 du plan : tests rouges dans `src/config/validatePadlock.test.ts` pour `titre` et `message_victoire`.

## Décisions prises (et pourquoi)
- Sprint 5 : le cadenas ouvre **la salle du restaurant hanté** (pas un coffre à bonbons) → intro du YAML
  corrigée. Titre de l'écran et message de victoire dans le YAML (`cadenas.titre`,
  `cadenas.message_victoire`, facultatifs) pour réutiliser le jeu avec une autre histoire.
- Sprint 5 : animation = anse qui se soulève, double porte qui s'ouvre, lueur, fantômes et chauves-souris,
  puis message + temps mis. CSS pur ; styles de base = état final pour `prefers-reduced-motion`.
- Sprint 5 : son **synthétisé en Web Audio** (clac, grincement, gémissement) : pas de fichier, pas de
  droits, hors ligne. Lancé dans le tap « Ouvrir » (sinon bloqué par la tablette).
- Sprint 5 : molettes à 0 au départ, 9 ↔ 0 en boucle ; code faux = secousse + message, sans pénalité.
  Le compteur se fige à l'ouverture (`finishedAt`).
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
