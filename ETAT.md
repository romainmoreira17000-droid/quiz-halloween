# État du projet — quiz-halloween

Dernière mise à jour : 2026-09-21 21:00

## Sprint en cours
- **Objectif :** Sprint 3 — maquettes design (3 directions, captures 810×1080, choix de Romain)
- **Issue :** #3
- **Branche :** `feat/design-mockups` (créée depuis `main` à jour)
- **PR :** —

## Où on en est
- [x] Sprint 1 terminé : PR #7 fusionnée, site en ligne et vérifié (Playwright 810×1080 : titre,
  manifest et service worker OK) — https://romainmoreira17000-droid.github.io/quiz-halloween/
- [x] Sprint 2, Tasks 1 à 5 : validateur, CLI `npm run valider` (prebuild), `quiz.yaml` d'exemple
  (6 étapes fictives), écran d'erreurs de config. Vérifié : typecheck, 48 tests unitaires, build, e2e verts.
- [x] Task 6 : docs (README « Modifier le quiz », CLAUDE.md) mises à jour.
- [x] Task 6 : relecture `relecteur-code` (rien de bloquant, suggestions traitées : 50 tests), PR #8, CI verte.
- [x] Sprint 2 terminé : PR #8 fusionnée, issue #2 fermée, site en ligne vérifié (Playwright 810×1080 :
  titre « Le manoir hanté »).
- [x] Sprint 3 : cadrage fait (7-10 ans, salle noire éclairée aux bougies → fond sombre, pas de blanc pur).
- [x] Maquettes HTML des 3 directions (accueil, étape, cadenas) dans `docs/design/maquettes/`
- [x] Script `scripts/capture-maquettes.ts` + 9 captures dans `docs/design/captures/`.
  Vérifié : typecheck, lint, 50 tests, build verts.
- [ ] Relecture `relecteur-code` en cours ← reprendre ici
- [ ] PR avec captures, choix de Romain noté ici

## Prochaine action concrète
Traiter les retours du `relecteur-code`, pousser `feat/design-mockups`, ouvrir la PR (captures en images
dans la description), puis demander à Romain de choisir sa direction (bougie, potion ou lune) et la noter ici.

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

- Sprint 3 : maquettes = HTML statique jetable hors de `src/` (pas de TDD : aucune logique). Polices
  Google Fonts pour les maquettes ; la version finale les embarquera (jeu hors ligne).
- Public 7-10 ans, salle dans le noir : fond sombre, textes crème/ambre, pas d'aplats éblouissants,
  boutons du pavé ≥ 88 px.
- Maquettes : `commun.css` (squelette + bascule d'écran par `#accueil`/`#etape`/`#cadenas`, sans JS) +
  un .html/.css par direction. Chiffres toujours en police à chiffres alignés (le 0 ne doit pas
  ressembler à un o). Captures en `reducedMotion` pour qu'elles soient identiques d'un lancement à l'autre.

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
