# État du projet — quiz-halloween

Dernière mise à jour : 2026-09-21 19:35

## Sprint en cours
- **Objectif :** Sprint 2 — validateur du YAML du quiz
- **Issue :** #2
- **Branche :** `feat/yaml-validator` (créée depuis `main` à jour)
- **PR :** pas encore ouverte

## Où on en est
- [x] Sprint 1 terminé : PR #7 fusionnée, site en ligne et vérifié (Playwright 810×1080 : titre,
  manifest et service worker OK) — https://romainmoreira17000-droid.github.io/quiz-halloween/
- [x] Sprint 2, Tasks 1 à 5 : validateur, CLI `npm run valider` (prebuild), `quiz.yaml` d'exemple
  (6 étapes fictives), écran d'erreurs de config. Vérifié : typecheck, 48 tests unitaires, build, e2e verts.
- [x] Task 6 : docs (README « Modifier le quiz », CLAUDE.md) mises à jour.
- [ ] Task 6 : relecture `relecteur-code`, corrections, PR `Closes #2`, CI verte ← reprendre ici
- [ ] Sprint 3 : maquettes design (issue #3)

## Prochaine action concrète
Traiter les retours de `relecteur-code`, puis `gh pr create` vers `main` (description en français,
`Closes #2`) et attendre la CI verte. Merge seulement avec le feu vert de Romain.
Ensuite : sprint 3, maquettes design (issue #3).

## Décisions prises (et pourquoi)
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
