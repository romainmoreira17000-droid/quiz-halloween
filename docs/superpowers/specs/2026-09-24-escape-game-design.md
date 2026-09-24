# Escape game en équipes — Conception

Date : 2026-09-24 — Statut : validée par Romain (2026-09-24) — Issue : #19

## But

Le quiz devient un escape game d'une soirée d'Halloween : **6 équipes** (5 enfants + 2 adultes chacune)
jouent en même temps, chacune avec sa tablette. Chaque équipe fait les **6 épreuves** dans un ordre décalé,
pour que deux équipes ne soient jamais sur la même épreuve au même moment. Chaque épreuve donne un chiffre ;
les 6 chiffres ouvrent le cadenas de la porte du restaurant hanté, où tout le monde mange ensemble.

Le déroulé de la soirée côté animateurs (épreuves, matériel, indices) est dans `docs/scenario-soiree.md`.

## Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Rotation | 6 épreuves toutes en rotation, décalage circulaire | 6 équipes pour 5 épreuves laissait une équipe sans épreuve |
| Moment commun | Le repas, après l'ouverture de la porte | Choix de Romain |
| Cadence | Créneaux de 15 min calculés depuis « Commencer » | Toutes les équipes changent de salle ensemble ; un redémarrage ne décale rien |
| Équipe de la tablette | Réglée avant la soirée par un animateur (code animateur) | Image de l'équipe collée au dos ; les enfants ne peuvent pas la changer |
| Code d'entrée (20h) | Sur papier, hors tablette | Les tablettes sont trouvées une fois entrés |
| Chrono | Temps restant de l'épreuve en gros + temps total en petit | Les enfants savent combien il leur reste pour chercher |
| Pas trouvé en 15 min | « Temps écoulé : appelez un animateur » ; le code animateur donne le chiffre | Aucune équipe bloquée devant la porte, mais un adulte intervient |
| Fin | Cadenas virtuel sur la tablette, victoire, puis vraie porte ouverte ensemble | Chaque équipe a sa victoire, puis moment commun |
| Indice | Bouton « Donne-moi un indice » visible dès le début, débloqué à 10 min, gratuit | Choix de Romain |
| Mauvaise réponse | Saisie bloquée 1 min avec décompte | Oblige à chercher au lieu de tenter au hasard |
| Code animateur | Écrit dans `quiz.yaml`, donc lisible sur le dépôt public | Même choix assumé que pour les réponses |

## Rotation

Les équipes sont numérotées dans l'ordre du YAML (0 à 5), les créneaux aussi (0 à 5).
L'équipe `e` joue au créneau `c` l'épreuve `(e + c) mod 6`. Avec l'ordre Sorcières, Zombies, Fantômes,
Loups-garous, Squelettes, Momies :

| Créneau | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Sorcières | 1 | 2 | 3 | 4 | 5 | 6 |
| Zombies | 2 | 3 | 4 | 5 | 6 | 1 |
| Fantômes | 3 | 4 | 5 | 6 | 1 | 2 |
| Loups-garous | 4 | 5 | 6 | 1 | 2 | 3 |
| Squelettes | 5 | 6 | 1 | 2 | 3 | 4 |
| Momies | 6 | 1 | 2 | 3 | 4 | 5 |

Le validateur impose autant d'équipes que d'étapes (sinon la rotation crée des conflits ou des trous).

## Format du YAML (changements)

```yaml
equipes: ["Sorcières", "Zombies", "Fantômes", "Loups-garous", "Squelettes", "Momies"]
                              # obligatoire, noms uniques non vides, autant que nombre_etapes
duree_epreuve_minutes: 15     # obligatoire, entier > 0 (remplace duree_minutes)
indice_apres_minutes: 10      # obligatoire, entier >= 0 et < duree_epreuve_minutes
blocage_secondes: 60          # obligatoire, entier >= 0 (0 = pas de blocage)
code_animateur: "2710"        # obligatoire, 4 à 8 chiffres, entre guillemets
etapes:
  - titre: ...                # inchangé : titre, consigne, image, type_reponse, reponse, chiffre
    indice: "..."             # nouveau, facultatif ; sans indice, pas de bouton
```

- `duree_minutes` disparaît : le temps total vaut `nombre_etapes × duree_epreuve_minutes`.
- `entree` reste possible dans le format mais est retirée du `quiz.yaml` de la soirée.
- `cadenas.ordre` reste : le code est pris dans l'ordre des **épreuves**, jamais dans l'ordre de passage.

## Parcours sur la tablette

1. **Réglage de l'équipe** (si aucune équipe n'est enregistrée) : saisie du code animateur, puis 6 gros
   boutons. L'équipe est gardée dans le localStorage (clé à part : `quiz-halloween:team`), et la remise à
   zéro ne l'efface pas. On la change depuis la fenêtre de remise à zéro (« Changer d'équipe », avec le code).
2. **Accueil** : « Équipe des Momies », titre, intro, bouton « Commencer » (appuyé ensemble au signal).
3. **Épreuve** (créneau `c`) : entête « Épreuve 3/6 · 12:47 » + temps total en petit ; consigne sur
   parchemin, cadenas en coupe (6 goupilles), zone de réponse.
   - Bonne réponse : « Chiffre trouvé ! » puis écran d'attente « Changement de salle dans 4:12 ».
   - Mauvaise réponse : saisie bloquée `blocage_secondes` (« Nouvelle réponse possible dans 0:42 »).
   - Bouton indice : grisé « Indice disponible dans 3:00 », actif à `indice_apres_minutes`, affiche l'indice.
4. **Fin du créneau** : passage automatique à l'épreuve suivante si le chiffre est trouvé. Sinon, écran
   « Temps écoulé : appelez un animateur » ; l'animateur tape le code, la tablette montre le chiffre, puis
   « Continuer » mène à l'épreuve du créneau en cours (son temps a déjà commencé à couler).
5. **Après le dernier créneau** : cadenas virtuel à molettes (existant), victoire, message
   « Rendez-vous à la porte du restaurant ! ».

Tant qu'un créneau précédent est « temps écoulé » sans code animateur, l'écran « Temps écoulé » reste affiché.

## Logique (src/game)

- Le créneau en cours et le temps restant se **calculent** depuis `startedAt` et `Date.now()`, jamais
  en mémoire (même règle que le compteur actuel) : `slot = floor((now - startedAt) / durée)`.
- `rotation.ts` (pur) : épreuve jouée par l'équipe `e` au créneau `c`.
- État de partie : `teamIndex`, `startedAt`, chiffres trouvés **par numéro d'épreuve** (tableau de
  `number | null`), épreuves débloquées par l'animateur, `blockedUntil` (timestamp), `finishedAt`.
- Actions : `start`, `answer` (avec `now`), `animatorUnlock` (code + numéro d'épreuve), `unlock`, `reset`.
  Le passage de créneau n'est pas une action : c'est l'heure qui le décide.
- L'empreinte de sauvegarde inclut les nouvelles clés ; `restoreGameState` contrôle le nouvel état.

## Hors périmètre

Classement des équipes, synchronisation entre tablettes (chaque tablette part de son propre « Commencer »,
quelques secondes d'écart sont acceptées), son spécial de fin de créneau.

## Découpage

- **Sprint 9 (#19)** : équipes et réglage, rotation, double chrono, fin de créneau et code animateur, fin de
  partie. Suppression de `duree_minutes`.
- **Sprint 10** : bouton indice et blocage après mauvaise réponse.

## Tests

- Unitaires : rotation (aucun conflit sur les 6 créneaux), calcul du créneau et des temps, réducteur
  (réponse, blocage, déblocage animateur, fin), validateur (nouvelles clés et leurs erreurs), restauration.
- Composants : écran de réglage, entête, écran d'attente, « Temps écoulé », bouton indice.
- e2e (`page.clock`) : une équipe joue un créneau, attend le changement, rate une épreuve et se fait
  débloquer, puis ouvre le cadenas.
