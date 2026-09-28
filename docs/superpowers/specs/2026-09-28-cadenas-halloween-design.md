# Conception — Cadenas Halloween en bronze, animé en 3D

Date : 2026-09-28 · Issue : #57 (sprint 20) · Branche : `feat/halloween-padlock`

## Contexte

Romain a ajouté `images-sources/cadenas.jpeg` : un cadenas en bronze doré, suspendu à des chaînes, avec une
citrouille lumineuse, des ailes de chauve-souris, des toiles d'araignée, deux os, un crâne, un bandeau
« HAPPY HALLOWEEN » orange lumineux et une fenêtre ronde sur un ciel de nuit (lune, sorcière, château, fantôme).
Il veut ce style pour les cadenas du jeu, « en 3D avec une version animée ».

Choix de Romain (cadrage) :

- le style s'applique aux **trois** cadenas : en coupe (écran d'épreuve), final à molettes, victoire ;
  le look rouillé du sprint 17 (rouille, sang, rivets) disparaît ;
- une vraie ambiance quand une équipe trouve une **bonne réponse** : le cadenas bouge ;
- une vraie animation 3D à l'**ouverture** : la « plongée dans la serrure » (option 1 sur 3) ;
- bandeau gardé en anglais : « HAPPY HALLOWEEN », texte fixe (pas dans `quiz.yaml`).

Décision technique : **dessin SVG + effets 3D CSS** (`perspective`, `rotateX/Y`, `translateZ`), pas de moteur
3D (Three.js). Raisons : pas de modèle 3D à la qualité de l'image, app plus lourde, tablettes qui chauffent,
et le jeu doit marcher hors ligne. Le résultat est un dessin **inspiré** de l'image, pas une copie de la photo.

## Le dessin commun

Un seul dessin, découpé en petits composants dans `src/components/lock/` (200 lignes max par fichier) :

- `LockDefs` : remplace la peinture rouillée par des dégradés bronze (`lock-bronze`, `lock-bronze-edge`
  pour la tranche, `lock-bone`, `lock-banner`, `lock-sky`, `lock-pumpkin`, `lock-glow`) ; ids toujours `lock-*`.
  `lock-rust`, `lock-rust-grain`, `lock-blood` sont supprimés.
- `HalloweenLockBody` : le corps en bronze (contour « écusson » arrondi), sa tranche décalée vers le bas
  pour l'épaisseur, les toiles dans les coins, les deux os sur les côtés, le crâne en bas, la serrure lumineuse,
  le bandeau en arc avec « HAPPY HALLOWEEN » (`textPath`). Paramétré par la largeur (le cadenas final est plus
  large) et par un emplacement de fenêtre dans lequel l'appelant met son contenu.
- `LockCrown` : le haut — anse, deux ailes de chauve-souris, citrouille (yeux et bouche lumineux).
- `NightWindow` : le ciel de la fenêtre (dégradé nuit, lune, château, sorcière), découpé par un `clipPath`
  rond (écran d'épreuve, victoire) ou ovale (cadenas final).
- `LockChains` : gardé (acier), plus le petit fantôme pendu à la chaîne de droite.
- `BloodDrips` et ses tests sont supprimés.

Les trois cadenas :

| Cadenas | Fenêtre | Contenu de la fenêtre |
|---|---|---|
| `CutawayLock` (écran d'épreuve) | ronde | ciel + chambre des goupilles + chiffres trouvés |
| `FinalLock` (cadenas final) | ovale, s'élargit avec les molettes | ciel + molettes-tambours (enfants HTML) |
| `VictoryLock` (victoire) | ronde | ciel (sert de décor à la plongée) |

Contraintes gardées :

- `CutawayLock` reste à **190 px** de haut (écran d'épreuve sans défilement, `e2e/layout.spec.ts`) ;
  chiffres toujours lisibles, `font-variant-numeric: lining-nums`, fond sombre sous les chiffres.
- `aria-label` / rôles inchangés (`lockLabel`, `role="img"`, décor `aria-hidden`, `<output class="dial-value">`).
- Pas de nouvel état de partie : toutes les animations sont déclenchées par des classes dérivées de l'état
  existant (`fallingIndex`, `open`, `wrongAttempts`, écran de victoire).
- Règle des animations : styles de base = **état final**, keyframes = état de départ (`both`) ;
  `prefers-reduced-motion` (base.css) montre directement la fin. Rien de décoratif n'intercepte les taps
  (`pointer-events: none`).

## Ambiance permanente (discrète)

- Citrouille : lueur qui vacille comme une bougie (opacité/`drop-shadow`, boucle ≈ 3 s, irrégulière).
- Fantôme pendu : se balance autour de son attache (boucle ≈ 4 s).
- Sorcière : traverse la lune toutes les ≈ 12 s (écran d'épreuve et cadenas final).
- Tout est coupé par `prefers-reduced-motion`.

## Bonne réponse (écran d'épreuve)

Déclenché par `fallingIndex` (déjà passé par `StepScreen` quand l'épreuve affichée vient d'être trouvée, donc
aussi pour « Valider l'épreuve » de l'animateur) — nouvelle classe `cutaway-lock--jolt` :

1. la goupille tombe (0,45 s, « clac » de `playPinSound` inchangé) ;
2. à l'impact (0,4 s), le cadenas **tressaute sur sa chaîne** : bascule vers l'avant en 3D (`rotateX`) autour
   de l'anse puis balancier amorti (`rotateZ`), ≈ 1,5 s ; le fantôme ballotte ;
3. citrouille et serrure **s'embrasent** (orange vif ≈ 1 s) puis reviennent à leur lueur normale ;
4. puis le « Bravo ! » plein écran, inchangé (délai 0,5 s + 3 s).

Quand toutes les goupilles sont tombées : l'anse se libère et les chaînes tombent, comme aujourd'hui.

## Mauvais code (cadenas final)

La secousse actuelle (`.lock-zone.shake`, remontée par `key`) est gardée ; en plus, les yeux de la citrouille et
du crâne passent au **rouge** ≈ 1 s (classe dérivée de `wrongAttempts > 0` sur la même zone remontée).

## Victoire : la plongée dans la serrure (≈ 5,5 s)

Le `VictoryLock` quitte la porte et devient une couche plein écran au-dessus de `HauntedDoor` :

| Temps | Ce qui se passe |
|---|---|
| 0 – 0,6 s | le cadenas arrive tourné (`rotateY(-35deg)`, perspective) et pivote face aux enfants ; on voit sa tranche |
| 0,6 – 0,9 s | la serrure s'illumine en orange |
| 0,9 s | **l'anse saute** (clac du son, recalé de 0,2 à 0,9 s) ; chaînes qui tombent ; le fantôme s'envole |
| 1,2 – 2,4 s | **plongée** : le cadenas grossit (`scale` jusqu'à ≈ 12) centré sur la fenêtre ; le bronze sort par les bords, le ciel remplit l'écran |
| 2,2 – 2,8 s | le ciel s'efface et laisse voir la porte |
| 2,4 – 4,4 s | portes qui s'ouvrent, lueur (décalées de 1,4 s par rapport à aujourd'hui) |
| 3,4 – 7 s | fantômes et chauves-souris qui s'envolent |
| 5,6 s | message de victoire |

`sound.ts` suit la même frise : clac 0,9 s, grincement 2,4 – 4,4 s, gémissement 3,6 – 5,8 s. Le commentaire de
frise en tête de `victory.css` et `sound.ts` est mis à jour. Avec `prefers-reduced-motion` : portes ouvertes et
message tout de suite, la couche du cadenas est invisible (état final = `opacity: 0`).

## Tests

- **Unitaires** (Vitest + Testing Library) :
  - tests existants de `CutawayLock`, `FinalLock`, `VictoryLock`, `PadlockScreen`, `HauntedDoor`, `Dial` adaptés
    (plus de sang ni de rouille), textes lus inchangés ;
  - `CutawayLock` : classe `cutaway-lock--jolt` présente seulement avec `fallingIndex` ; bandeau « HAPPY HALLOWEEN »
    présent et masqué aux lecteurs d'écran ;
  - `FinalLock` / `PadlockScreen` : état « code faux » (yeux rouges) seulement après un mauvais code ;
  - `HalloweenLockBody` : fenêtre ronde ou ovale, largeur paramétrable ;
  - `sound.ts` : clac à 0,9 s, grincement et gémissement recalés.
- **e2e** : `layout.spec.ts` (pas de défilement de l'écran d'épreuve, pavé et clavier) et parcours existants verts.
- **Visuel** : captures Playwright sur tablette (810×1080) et téléphone : écran d'épreuve, bonne réponse, cadenas
  final, mauvais code, étapes de la victoire (`page.clock`).

## Hors périmètre

Moteur 3D, changement de la logique de jeu, de la sauvegarde ou de `quiz.yaml` (l'empreinte ne change pas :
les parties en cours ne sont pas perdues par ce déploiement, mais on ne déploie toujours pas pendant la soirée).
