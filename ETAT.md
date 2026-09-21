# État du projet — quiz-halloween

Dernière mise à jour : 2026-09-21 23:40

## Sprint en cours
- **Objectif :** Sprint 4 — déroulé des étapes + compteur, au design Manoir à la bougie
- **Issue :** #4
- **Branche :** `feat/steps-and-countdown` (créée depuis `main` à jour)
- **PR :** —
- **Plan :** `docs/superpowers/plans/2026-09-21-sprint4-etapes-compteur.md` (9 tâches)

## Où on en est
- [x] Sprints 1 à 3 terminés (PR #7, #8, #9 fusionnées ; site en ligne).
- [x] Sprint 4 : cadrage validé par Romain, plan écrit.
- [ ] Task 1 : logique pure (temps, réponse, messages) ← reprendre ici
- [ ] Task 2 : réducteur de partie + `useGameProgress`
- [ ] Task 3 : `useCountdown`
- [ ] Task 4 : styles bougie + polices @fontsource (woff2 en précache)
- [ ] Task 5 : Clock, CandleProgress, Keypad, GameHeader
- [ ] Task 6 : HomeScreen, StepScreen, AllSolvedScreen
- [ ] Task 7 : Game + branchement dans App
- [ ] Task 8 : e2e (partie complète, fin du temps, polices hors ligne) + vérif visuelle
- [ ] Task 9 : docs, relecture, PR

## Prochaine action concrète
Exécuter le plan en inline, à partir de la Task 1 (TDD : tests rouges, code, tests verts, commit `(#4)`).

## Décisions prises (et pourquoi)
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
- Progression sauvegardée sur la tablette ; remise à zéro par appui long 3 s.
- Cadenas : ordre + indice facultatifs dans le YAML.
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
