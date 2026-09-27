# Sprint 13 — Menu animateur (issue #38)

**But :** à tout moment, un animateur ouvre un menu (↺ appui long → « Menu animateur » → code) pour valider
l'épreuve affichée, débloquer la saisie, montrer l'indice ou voir les solutions. Choix de Romain : accès par la
fenêtre de ↺ (rien de plus à l'écran), les 4 actions.

**Principe :** le menu n'agit jamais sur le temps. Trois nouvelles actions du réducteur, chacune vérifiée contre la
phase comme les autres ; le code est vérifié à l'ouverture du menu (UI), comme pour « Recommencer ».

## Tâches

1. **État** (TDD) : champ `hintSlot: number | null` (créneau où l'animateur a montré l'indice) dans `GameState` ;
   `restoreGameState` accepte une sauvegarde sans ce champ (null) pour ne pas perdre les parties en cours.
2. **Réducteur** (TDD) : `animatorSolve { challenge, now }` (phase `challenge` de cette épreuve → chiffre, blocage
   et essais effacés) ; `unblock { now }` (en `playing` → `blockedUntil` null) ; `showHint { challenge, now }`
   (phase `challenge` → `hintSlot` = créneau). `hintAvailable` : indice dispo si `hintSlot` = créneau affiché.
3. **Hook** : `animatorSolve()` (booléen pour le « clac »), `unblock()`, `showHint()`.
4. **ResetDialog** (TDD) : prop `menu?: { code; onOpen }` → bouton « Menu animateur », code toujours demandé.
5. **AnimatorMenu** (TDD) : fenêtre avec les actions possibles selon la phase + « Voir les solutions » (liste
   réponse/chiffre, code du cadenas) + « Fermer ». Une action ferme le menu.
6. **Branchement** dans `TeamGame` (état ouvert/fermé, `hintSecondsLeft` à 0 si `hintSlot` = créneau), styles.
7. **e2e** : ouvrir le menu, valider une épreuve, montrer l'indice, débloquer, voir les solutions.
8. **Docs** : CLAUDE.md (sauvegarde, piège), README (animateur), ETAT.md.
