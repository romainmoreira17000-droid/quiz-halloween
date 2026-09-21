# État du projet — quiz-halloween

Dernière mise à jour : 2026-09-21

## Sprint en cours
- **Objectif :** Sprint 1 — squelette Vite + React + TS + PWA, CI, déploiement GitHub Pages
- **Issue :** pas encore créée (le dépôt GitHub n'existe pas encore)
- **Branche :** `chore/scaffold` (locale)
- **PR :** pas encore ouverte

## Où on en est
- [x] Cadrage (brainstorming) validé par Romain
- [x] Conception : `docs/superpowers/specs/2026-09-21-quiz-halloween-design.md` (commitée sur `main`)
- [x] Plans : `docs/superpowers/plans/2026-09-21-sprint1-squelette.md` et `...-sprint2-validateur.md`
- [ ] Exécuter le plan du sprint 1 ← reprendre ici
- [ ] Sprint 2 : validateur YAML

## Prochaine action concrète
Suivre `docs/superpowers/plans/2026-09-21-sprint1-squelette.md`, Task 1 Step 1 (scaffold create-vite dans `$TEMP` puis copie à la racine), sur la branche `chore/scaffold`. Romain doit choisir le mode d'exécution (sous-agents ou inline).

## Décisions prises (et pourquoi)
- Dépôt **public** : Pages sur dépôt privé exige un compte GitHub payant.
- Pas de Supabase : aucune donnée à stocker, zéro donnée personnelle.
- YAML validé à la construction : un YAML faux bloque la publication.
- Temps écoulé : le jeu continue (compteur rouge négatif).
- Progression sauvegardée sur la tablette ; remise à zéro par appui long 3 s.
- Cadenas : ordre + indice facultatifs dans le YAML.
- Plans détaillés seulement pour les sprints 1–2 : les écrans dépendent du design choisi au sprint 3.

## Points en suspens / questions pour Romain
- Aucun pour l'instant. Le sprint 3 (maquettes) demandera un choix de design.

## Commandes du projet
Pas encore de code. Voir le plan du sprint 1.

## Environnement
- Pas de backend.
- Hébergement : GitHub Pages — `https://romainmoreira17000-droid.github.io/quiz-halloween/`
- Variables nécessaires : aucune

## Pièges connus
- Le hook `garde-fous` bloque tout commit sur `main`, même le squelette initial : tout passe par une branche + PR.
- Le dossier n'est pas vide (`.git`, `docs/`, `README.md`) : create-vite doit générer dans `$TEMP` puis copier.
