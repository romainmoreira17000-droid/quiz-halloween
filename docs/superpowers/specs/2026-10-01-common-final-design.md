# Épreuve finale commune — design (sprint 24, #68)

## Besoin (validé par Romain le 2026-10-01)
Toutes les équipes jouent dans la même salle : les « salles » de l'app sont des postes. Les 5 premières épreuves
tournent entre les équipes ; la 6e, « Invisible mais visible », se joue **tous ensemble, en dernier**. Ses indices sont
donnés à voix haute par les animateurs. Chaque équipe tape la réponse de la finale sur sa propre tablette pour gagner
son chiffre. Le wifi de la salle est faible : le jeu doit marcher de bout en bout sans réseau.

## Configuration (`quiz.yaml`)
- Nouvelle clé d'étape facultative `finale: true` (booléen). Mappée vers `QuizConfig.finalStep?: number` (index 0-based
  de l'étape), absente sans finale. `QuizStep` ne change pas.
- Validateur :
  - `finale` doit être un booléen (`étape 6 : « finale » doit valoir true ou false.`) ;
  - une seule étape finale (`« finale » : une seule étape peut être la finale (étapes 2 et 6).`) ;
  - pas d'`indices` sur la finale (`étape 6 : la finale n'a pas d'indices (les animateurs les donnent).`) ;
  - équipes : **au moins** une par épreuve en rotation (rotation = `nombre_etapes` moins la finale). Plus d'équipes que
    de postes est accepté : elles partagent un poste (même salle). Une rotation vide (une seule étape, finale) est acceptée.
- La finale peut être n'importe où dans `etapes` : son chiffre garde l'index de son étape (l'ordre du cadenas ne bouge pas).
  Dans le YAML de la soirée, c'est l'étape 6.
- La durée totale reste `nombre_etapes × duree_epreuve_minutes`.

## Rotation (`src/game/rotation.ts`)
`challengeAt(teamIndex, slot, stepCount, finalStep?)` :
- liste des épreuves en rotation = toutes sauf la finale, dans l'ordre du YAML ;
- `slot < longueur de la rotation` → `rotation[(teamIndex + slot) % longueur]` ;
- sinon → la finale.

Sans finale, résultat identique à aujourd'hui. Avec 6 équipes et 5 postes, les équipes 1 et 6 (Sorcières et Momies) sont
au même poste à chaque créneau.

## Phase (`src/game/phase.ts`)
`gamePhase` reçoit `finalStep` et appelle `challengeAt` avec. Un seul changement de règle : si l'épreuve du créneau en
cours est la finale et que son chiffre est connu → `padlock` tout de suite (plus de poste à rejoindre). Les « Temps
écoulé » des créneaux passés gardent la priorité, donc le cadenas ne s'ouvre qu'avec tous les chiffres connus.
Le réducteur (`progress.ts`) ne change pas : il dérive tout de `gamePhase`. « Passer à l'épreuve suivante » pendant la
finale donne son chiffre puis mène au cadenas ; « Départ de la partie » garde son sens.

## Écrans
- Écran d'étape de la finale : pas de bouton d'indice (aucun indice dans le YAML, comportement existant) ; « Donner un
  indice » est déjà inactif sans indices dans le menu animateur (à vérifier par un test).
- Attente du dernier créneau de rotation : « L'épreuve finale dans 04:12 » au lieu de « Changement d'épreuve dans ».
  `StepScreen` reçoit `nextLabel` à la place de `isLastSlot` (« Le cadenas final dans » reste pour un quiz sans finale).
- Tableau animateur : rien à faire, il passe par `gamePhase`.

## Hors ligne
L'app est déjà une PWA (précache Workbox) et la partie vit dans le localStorage ; le suivi à distance échoue en silence.
Nouveau test e2e : après un premier chargement, `context.setOffline(true)`, rechargement, puis parcours complet
(5 épreuves, finale, cadenas, victoire) en mode `?test`. Consigne pour la soirée (README) : ouvrir l'app sur chaque tablette
avec le wifi avant la soirée, la laisser ouverte.

## Compatibilité
`QuizConfig` change de forme → empreinte différente → les parties en cours sont perdues au déploiement. Déployer avant
la soirée, jamais pendant.

## Tests
- Unitaires : `challengeAt` (sans finale = comme avant ; avec finale : chaque équipe fait les 5 épreuves une fois puis la
  finale, au plus 2 équipes par poste, finale ailleurs qu'en dernier dans le YAML) ; `gamePhase` (finale trouvée → cadenas,
  « Temps écoulé » d'avant prioritaire) ; validateur (clé, doublon, indices, nombre d'équipes) ; `StepScreen` (libellé).
- e2e : parcours complet avec finale, et le même hors ligne.
