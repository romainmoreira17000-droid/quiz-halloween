# Sprint 12 — Mode test (issue #33)

**But :** en ouvrant l'app avec `?test`, un animateur saute à la fin du créneau pour parcourir toutes les
épreuves sans attendre. Choix de Romain : réservé aux tests, jamais pendant une vraie soirée.

**Principe :** tout l'écran se déduit de `startedAt` + `Date.now()`. Sauter un créneau = reculer `startedAt`
du temps restant dans le créneau. Aucune autre logique de jeu ne change.

## Tâches

1. **`src/game/skip.ts`** (TDD) : `startForNextSlot(startedAt, now, slotMinutes)` → nouveau `startedAt` tel que
   `now` tombe pile au début du créneau suivant.
2. **Réducteur** (TDD, `progress.ts`) : action `skipSlot { now }`, acceptée seulement en phase `challenge` ou
   `waiting` ; recule `startedAt` et remet `blockedUntil` à null (sinon le blocage, horodaté en absolu, suivrait
   au créneau suivant). Refusée sur l'accueil, « Temps écoulé », le cadenas, la victoire.
3. **`src/game/testMode.ts`** (TDD) : `isTestMode(search)` lit `?test` dans l'adresse.
4. **Hook** : `skipSlot()` dans `useGameProgress`.
5. **UI** (TDD composant) : `TestModeControl` = étiquette « MODE TEST » + bouton « Épreuve suivante » en bas à
   droite, en face de l'icône de remise à zéro (`position: absolute`, dans les 96 px libres de `.screen`).
   Branché dans `TeamGame` ; bouton seulement en `challenge`/`waiting`. Styles dans `test-mode.css`.
6. **e2e** : avec `?test`, parcours complet jusqu'au cadenas sans `page.clock` ; sans `?test`, ni étiquette ni
   bouton ; l'écran d'étape tient toujours sur la tablette.
7. **Docs** : CLAUDE.md (structure, piège), README (comment tester), ETAT.md.
