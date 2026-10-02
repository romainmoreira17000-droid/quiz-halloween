# Tableau animateur : détail, solutions et alertes — Conception

Date : 2026-10-02 — Statut : à relire par Romain — Issue : #84 — Soirée : 13 octobre

## But

Sur le téléphone de l'animateur (`?animateur`), voir **tout ce qu'il faut pour aider une équipe sans aller à sa
tablette** (chiffres trouvés, solution, indices déjà lus) et **être prévenu** quand une équipe a besoin de lui.

C'est le **sprint A**. Les actions à distance (valider, indice, débloquer, passer) sont le sprint B, seulement s'il
reste le temps de les tester sur les vraies tablettes avant la soirée.

## Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Périmètre technique | Téléphone seulement : rien ne change dans Supabase, sur les tablettes ni dans `QuizConfig` | Le tableau reçoit déjà l'état complet ; empreinte inchangée, aucune partie en cours en danger |
| Solutions | Sur chaque carte (épreuve en cours, masquée) **et** dans un panneau « Solutions » replié | Choix de Romain ; masquée car un enfant peut voir l'écran |
| Téléphone | Android | Vibration (`navigator.vibrate`) disponible |
| Déclencheurs d'alerte | Temps écoulé, tablette muette (> 2 min), 3 mauvaises réponses dans le créneau | Choix de Romain ; pas « saisie bloquée » : chaque mauvaise réponse bloque, ça sonnerait sans arrêt |
| Effet d'une alerte | Vibration + son une seule fois, bandeau avec « Vu », carte rouge qui clignote tant que ça dure | Le son attire l'attention, le bandeau dit quoi, la carte dit où |
| Ouverture du tableau | Ce qui est déjà en cours est rouge mais ne sonne pas | Sinon tout sonne d'un coup en ouvrant la page |
| Veille de l'écran | « Activer les alertes » demande aussi le maintien de l'écran allumé (Wake Lock) | Écran éteint = page en pause = plus de relecture ni d'alerte |
| Son | Synthétisé en Web Audio dans `sound.ts`, comme les autres | Pas de fichier, hors ligne, jamais d'exception sans Web Audio |

## 1. Cartes d'équipe

- Les ronds deviennent **une case par épreuve, dans l'ordre de passage de l'équipe** (`challengeAt` pour chaque
  créneau). Chaque case : chiffre trouvé, ou « – ». L'épreuve en cours (épreuve, attente, Temps écoulé) est encadrée.
  Nom accessible de la liste inchangé (« 3 chiffres trouvés sur 6 »).
- **« Voir la solution »** (bouton, replié par défaut) en `challenge` et `timeUp` : réponse attendue + chiffre de
  l'épreuve en cours.
- **Indices vus** : le texte des indices déjà disponibles pour l'équipe (`hintsAvailable` premiers indices de
  l'étape), sous « Indices vus 2/3 », replié derrière ce libellé.
- Carte en alerte (voir 3) : classe `team-card--alert`, bordure rouge qui clignote (fixe si
  `prefers-reduced-motion`).

## 2. Panneau « Solutions »

`<details>` sous les cartes, replié, titre « Solutions (à ne pas montrer aux enfants) » :
- chaque épreuve dans l'ordre du YAML : titre (« finale » marquée), réponse, chiffre, indices numérotés ;
- **code du cadenas** dans l'ordre de saisie (`padlockCode`) ;
- code animateur.

## 3. Alertes

**Détection** : fonction pure `newAlerts(previous, current)` (`src/game/boardAlerts.ts`) sur deux listes de cartes
(`TeamCardView`). Une alerte a une **clé** qui ne sonne qu'une fois :
- `timeUp` : carte passée en `timeUp` ; clé = équipe + titre de l'épreuve ratée ;
- `silent` : `freshness` passée à `silent` ; clé = équipe + `silent` + numéro d'épisode (réarmée quand la tablette
  redonne des nouvelles) ;
- `wrong` : `wrongAttempts` atteint 3 (seuil `ALERT_WRONG_ATTEMPTS`) ; clé = équipe + épreuve en cours.

`activeAlerts(cards)` dit quelles cartes sont rouges en ce moment (mêmes conditions, sans la notion de passage).

**Premier tableau reçu** : sert de référence, aucune alerte sonore.

**Hook `useBoardAlerts(cards)`** : garde les cartes précédentes et les clés déjà sonnées, ajoute les nouvelles alertes
au bandeau, appelle `playAlertSound()` et `navigator.vibrate([300, 150, 300])` (si disponible), seulement si les
alertes sont activées.

**Bouton « Activer les alertes »** en haut du tableau tant qu'elles ne le sont pas : dans le tap, débloque le son
(contexte audio créé dans le geste) et demande `navigator.wakeLock.request('screen')`, redemandé au retour sur la page
(`visibilitychange`). Échec du Wake Lock = alertes quand même actives, petit texte « Garde l'écran allumé ».

**Bandeau** (`role="alert"`) en haut : une ligne par alerte non vue, ex. « Zombies : Temps écoulé (Le cimetière) »,
« Fantômes : plus de nouvelles depuis 2 min », « Vampires : 3 mauvaises réponses (L'addition) », chacune avec « Vu ».

## 4. Découpage

- `src/game/boardAlerts.ts` (+ test) : `newAlerts`, `activeAlerts`, libellés.
- `src/game/boardCard.ts` : ajoute à la vue `digits` (valeurs), `order` (épreuves dans l'ordre de passage),
  `currentChallenge` (index), `hintTexts`. Rester sous 200 lignes (extraire si besoin).
- `src/hooks/useBoardAlerts.ts`, `src/hooks/useWakeLock.ts`.
- `src/services/sound.ts` : `playAlertSound`.
- `src/components/board/` : `TeamDigits`, `CardSolution`, `SolutionsPanel`, `AlertBanner`, `AlertToggle` ; `TeamCard`
  et `BoardView` les assemblent.
- `src/styles/board.css`.

## 5. Tests

- Vitest : `newAlerts` (chaque déclencheur, une seule fois, premier tableau muet, réarmement de `silent`, nouveau
  créneau = nouvelle alerte), `activeAlerts`, nouvelles infos de `boardCards`, composants (solution masquée puis
  montrée, panneau, bandeau et « Vu », bouton d'activation avec `vibrate`/`wakeLock` simulés).
- Playwright (faux Supabase existant) : une équipe passe en Temps écoulé entre deux relectures → bandeau, « Vu » le
  ferme ; panneau Solutions affiche le code du cadenas.
- Vérification visuelle sur téléphone (360 px) : rien ne déborde.

## Hors périmètre

- Actions à distance (sprint B).
- Notifications quand le téléphone est en veille ou l'appli en arrière-plan (il faudrait un serveur de push).
- Alerte de victoire ou d'arrivée au cadenas.
