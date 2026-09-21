# État du projet — quiz-halloween

Dernière mise à jour : 2026-09-21 18:30

## Sprint en cours
- **Objectif :** Sprint 1 — squelette Vite + React + TS + PWA, CI, déploiement GitHub Pages
- **Issue :** #1 (issues #2 à #6 créées pour les sprints suivants)
- **Branche :** `chore/scaffold` (squelette commité en local)
- **PR :** pas encore ouverte

## Où on en est
- [x] Cadrage, conception, plans des sprints 1–2 (commités)
- [x] Tâche 1 : squelette Vite + PWA + Vitest (test rouge puis vert, typecheck, build OK)
- [x] Tâche 2 : Playwright, smoke test tablette (1 passed)
- [x] Tâche 3 : `ci.yml`, `deploy.yml`, modèle de PR
- [x] Tâche 4 : CLAUDE.md, README.md, ETAT.md
- [ ] Tâche 5 : dépôt GitHub, issues, commit, Pages, PR ← reprendre ici
- [ ] Sprint 2 : validateur YAML

## Prochaine action concrète
Tâche 5 du plan `docs/superpowers/plans/2026-09-21-sprint1-squelette.md`. Bloquée : Claude ne peut
pas pousser `main` (hook garde-fous). Dépôt créé par Romain, issues #1–#6 créées.
Reste : Romain fait le premier push de `main` ; puis Claude pousse `chore/scaffold`, invite
ramdam17, active Pages, protège `main`, relecture, PR `Closes #1`.

## Décisions prises (et pourquoi)
- Dépôt **public** : Pages sur dépôt privé exige un compte GitHub payant.
- Pas de Supabase : aucune donnée à stocker, zéro donnée personnelle.
- YAML validé à la construction : un YAML faux bloque la publication.
- Temps écoulé : le jeu continue (compteur rouge négatif).
- Progression sauvegardée sur la tablette ; remise à zéro par appui long 3 s.
- Cadenas : ordre + indice facultatifs dans le YAML.
- Actions GitHub en dernières versions (checkout/setup-node v7, pages v5) : les v4 tournent sur Node 20, déprécié.
- Exécution du plan en inline (pas de sous-agents) : tâches petites et enchaînées.

## Points en suspens / questions pour Romain
- Premier push de `main` : à faire par Romain (voir prochaine action).

## Commandes du projet
```bash
npm run dev          # lancer en local
npm run test:run     # tests unitaires
npm run test:e2e     # tests de parcours (build + preview)
npm run typecheck    # vérification des types
npm run build        # build de production
```

## Environnement
- Pas de backend.
- Hébergement : GitHub Pages — `https://romainmoreira17000-droid.github.io/quiz-halloween/`
- Variables nécessaires : aucune

## Pièges connus
- Le hook `garde-fous` bloque tout commit sur `main` : tout passe par une branche + PR.
- Le dossier n'était pas vide : create-vite a généré dans `$TEMP` puis copie.
- Pare-feu Windows (pas de droits admin) : `node.exe` ne peut pas écouter sur le réseau. Localhost
  marche (tests OK) ; tester sur tablette via le site Pages, pas via le serveur de dev.
- Le modèle create-vite actuel n'a plus `vite.svg` mais `favicon.svg`/`icons.svg` (supprimés).
