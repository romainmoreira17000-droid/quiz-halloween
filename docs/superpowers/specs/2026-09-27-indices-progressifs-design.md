# Conception — Indices progressifs (jusqu'à 3 par épreuve)

Date : 2026-09-27 · Issue : #41 (sprint 14)

## Contexte

Le contenu réel de la soirée prévoit **3 indices par épreuve**, de plus en plus précis. L'app n'en affiche
qu'un, débloqué au bout de `indice_apres_minutes`. Choix de Romain (cadrage) :

- horaires **communs** à toutes les épreuves, réglés une seule fois (par défaut 5, 8 et 11 min) ;
- les enfants débloquent les indices **un par un** au fil du temps ;
- le menu animateur débloque **l'indice suivant** à chaque appui et montre **tous** les indices dans les solutions.

## Configuration (`quiz.yaml`)

```yaml
indices_apres_minutes: [5, 8, 11]   # remplace indice_apres_minutes

etapes:
  - titre: "Le cimetière"
    indices:                        # remplace indice
      - "La réponse se trouve sur le cercueil… mais tout dépend de la lumière."
      - "Cherchez une lumière qui permet de révéler ce qui est invisible."
      - "Utilisez la lampe à lumière noire."
```

Règles vérifiées (messages en français, le validateur continue après une erreur) :

- `indices_apres_minutes` : obligatoire, liste non vide d'entiers ≥ 0, **strictement croissants**, tous plus
  petits que `duree_epreuve_minutes` (sinon l'indice n'arriverait jamais).
- `indices` d'une étape : facultatif, liste de textes non vides ; pas plus d'indices que d'horaires.
- Anciennes clés : `indice_apres_minutes` (racine) et `indice` (étape) donnent un message qui montre la nouvelle
  forme, au lieu de « paramètre inconnu ». L'`indice` du **cadenas** ne change pas.

Types : `QuizConfig.hintAfterMinutes: number` devient `hintTimes: number[]` ; `QuizStep.hint?: string` devient
`hints?: string[]` (absent = pas de bouton).

## Règle de déblocage (logique pure, `src/game/hints.ts`)

Dans un créneau, l'indice n° k (1-based) est disponible quand `hintTimes[k-1]` minutes du créneau sont passées.
Le nombre d'indices disponibles est le plus grand des deux :

- indices débloqués par l'horloge ;
- indices débloqués par l'animateur **dans ce créneau** (`hintSlot` = créneau affiché → `hintCount`) ;

toujours plafonné au nombre d'indices de l'étape. Fonctions : nombre d'indices débloqués par l'horloge, secondes
avant le prochain (null s'il n'y en a plus), nombre disponible pour l'état.

## État et sauvegarde

`GameState` garde `hintSlot: number | null` et gagne `hintCount: number` (indices débloqués par l'animateur dans
`hintSlot`, 0 sinon). L'action `showHint` devient « un indice de plus » : `hintSlot` = créneau,
`hintCount` = disponibles + 1, refusée s'il n'y a plus d'indice à débloquer ou hors d'une épreuve en cours.

Relecture (`restoreGameState`) : `hintCount` absent → 1 si `hintSlot` est un créneau, 0 sinon (garde-fou). Valeur
invalide → sauvegarde rejetée. En pratique, la config change de forme (`hintTimes`, `hints`) : son empreinte change et
une partie en cours au moment du déploiement est perdue (retour à l'accueil). Ne pas déployer pendant la soirée.

## Écran d'épreuve (enfants)

Un seul bouton, au même endroit (à cheval sur le bas du parchemin) : l'écran ne s'allonge pas.

| Situation | Bouton |
|---|---|
| aucun indice encore | « Indice dans 03:00 » (grisé) |
| 1 indice disponible sur 3 | « Voir l'indice (1/3) » |
| 2 ou plus | « Voir les indices (2/3) » |

La fenêtre (titre « Indices ») liste les indices disponibles, numérotés, puis « Indice suivant dans 02:40 » s'il en
reste. Ouverte, elle se met à jour si un nouvel indice arrive. Pas d'indice sur l'attente, « Temps écoulé », le cadenas.

## Menu animateur

- « Débloquer l'indice suivant (2/3) » (numéro de l'indice qui sera débloqué) tant qu'il en reste ; ferme le menu.
- « Voir les solutions » : sous chaque épreuve, ses indices numérotés.
- Le menu ne touche jamais au temps.

## Tests

- Unitaires : validateurs (liste, ordre, bornes, trop d'indices, anciennes clés), `hints.ts`, réducteur
  (`showHint`), relecture (ancienne sauvegarde), `HintButton` (libellés, fenêtre), `AnimatorMenu` (bouton,
  solutions).
- e2e : indices qui apparaissent à 5, 8 et 11 min ; déblocage par l'animateur ; écran d'épreuve sans défilement
  sur tablette (`layout.spec.ts`, avec 3 indices).

## Hors périmètre

Indice du cadenas final ; contenu réel des épreuves (sprint suivant).
