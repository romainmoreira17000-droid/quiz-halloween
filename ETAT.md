# État du projet — quiz-halloween

Dernière mise à jour : 2026-10-04 (expérience du ballon mergée et déployée)

## Sprint en cours
**Toilettes scientifiques : consigne du trône remise** (#96, branche `fix/toilets-original-hook`) : Romain préfère
l'accroche d'origine (trône, asphyxiés, dosage) ; les 3 indices du ballon et le récit du ballon restent. PR ouverte,
tests verts (654 unitaires, layout e2e). Reste : merge par Romain.

## Prochaine action concrète
Romain essaie la nouvelle version sur une tablette (ouvrir l'appli avec le wifi, recharger une fois) : « Commencer »,
« Nous sommes arrivés », une bonne réponse, puis vérifier « Prochaine épreuve » et l'écran du créneau suivant (`?test`).
Avant la soirée du 13 : `check:board -- --full` (Romain, avec son code), essai du réseau sur le lieu si possible.
Idée notée par la relecture, pas planifiée : afficher « En route vers … » sur le tableau animateur.

## Sprint précédent
Aucun. **Raccourci « Tableau animateur »** (#87, PR #88) mergé et déployé le 2026-10-02 : appui long sur l'icône de l'appli
installée → `?animateur` (`manifest.shortcuts`). Romain doit désinstaller/réinstaller l'appli sur son Android pour le voir.
Reste avant la soirée du 13 : `check:board -- --full` (Romain, avec son code), essai du réseau sur le lieu si possible.
Sprint B (actions à distance) : non lancé, Romain est satisfait du tableau actuel.

Précédent : Aucun. **Sprint A du tableau animateur** (#84, PR #85) mergé et déployé le 2026-10-02 (build `index-DxARfOHK.js`). **Soirée le 13 octobre** : tout doit être
mergé et essayé sur les vraies tablettes et le téléphone (Android) vers le 10 octobre.
Spec `docs/superpowers/specs/2026-10-02-board-details-alerts-design.md`, plan `docs/superpowers/plans/2026-10-02-board-details-alerts.md`.
- [x] Tâches 1 à 7 : cartes (chiffres dans l'ordre de passage, solution masquée, indices lus), panneau Solutions, alertes
  (Temps écoulé, tablette muette, 3 mauvaises réponses : son + vibration + bandeau « Vu » + carte rouge), « Activer les alertes »
  (bip de test + écran gardé allumé), e2e, vérification visuelle 360 et 810 px, docs.
- [x] Relecture finale (relecteur-code, Opus) : 3 points importants corrigés. PR #85 ouverte.
- [x] PR #85 mergée (CI verte) et déployée.
- [ ] Romain essaie sur son Android : bip, vibration, écran allumé ; une tablette en `?test` qui rate un créneau doit faire sonner.
- Sprint B (actions à distance : valider, indice, débloquer, passer) : seulement s'il reste le temps de l'essayer avant le 13.

Précédent : comptine du cadenas final (#81, PR #82) mergée et déployée le 2026-10-01 : `cadenas.indice` réécrit par
allusions (potier = cimetière, yeux peints = galerie, savants = toilettes, sous la table = addition, symboles = jackpot,
monstres = finale), sans nom de salle (choix de Romain : l'ancienne nommait les salles, trop facile).

Sprint 27 (#76, PR #77) mergé le 2026-10-01 : récit entre les épreuves (champ `recit`, `QuizStep.story`).

Sprint 26 (#74, PR #75) mergé le 2026-10-01 : toilettes scientifiques, message de victoire, 5 équipes (Momies retirées).
Après déploiement, régler à nouveau l'équipe de chaque tablette.

Code de soirée changé par Romain le 2026-10-01 (dans l'éditeur SQL), essai du suivi à distance en cours de son côté.

## Où on en est
- [x] Sprint 27 (#76) : récit entre les épreuves, mergé (PR #77).
- [x] Sprint 26 (#74) : toilettes scientifiques, message de victoire, 5 équipes, mergé (PR #75).
- [x] Sprint 25 (#71) : laboratoire et finale, mergé (PR #72).
- [x] Sprint 24 (#68) : épreuve finale commune après la rotation, test hors ligne, mergé et déployé (PR #69).
- [x] Sprint 23 (#65) : suivi des équipes à distance (`?animateur`, Supabase), mergé et déployé (PR #66).
- [x] Sprint 22 (#62) : comptine de l'indice du cadenas final, mergé et déployé (PR #63).
- [x] Sprint 21 (#59) : contenu réel (l'addition, le jackpot funèbre, indices à 8/10/13 min, code du cadenas
  8 6 0 3 9 4 avec le 0 provisoire des toilettes), mergé et déployé (PR #60).
- [x] Sprint 20 (#57) : cadenas Halloween en bronze, mergé (PR #58).
- [x] Sprint 18 (#51) : « Passer à l'épreuve suivante », mergé (PR #53).
- [x] Sprint 19 (#52) : « Départ de la partie » (recaler une tablette décalée), mergé (PR #54).
- [x] Suite de relecture, mergée (PR #55) : bouton « Annuler » de la confirmation du saut,
  « Rien à débloquer » masqué quand l'heure de départ est modifiable, heure d'avant minuit acceptée après minuit.
- [x] Sprints 1 à 17 terminés et en ligne (dernier : cadenas 3D d'horreur, rouille, chaînes et sang, PR #49).
- [x] Code animateur : 1717 (choix de Romain le 2026-10-01, #79).

## Prochaine action concrète
Romain ouvre `?animateur` sur son Android, touche « Activer les alertes »
et vérifie le bip, la vibration et que l'écran ne se met pas en veille.

Avant (toujours valable) :
Site en ligne vérifié le 2026-10-01 (build `index-BnlkB8IJ.js` : « Les toilettes scientifiques » et récits présents). Sur une tablette déjà ouverte, le service worker sert d'abord l'ancien build puis se met à jour tout seul (`autoUpdate`) : ouvrir l'app avec le wifi et recharger une fois. Romain essaie la finale sur les tablettes (ouvrir l'app avec le wifi avant la soirée, la laisser ouverte, lancer toutes les tablettes ensemble).
Ensuite : essai en vrai du suivi à distance (Supabase : projet `quiz-halloween`, ref `bnlkrsxjdjxkhqnqqgpz` ; avant la soirée,
`check:board -- --full`).
Petites retouches notées par la relecture du sprint 20, plus tard si Romain le souhaite : commentaires « rusty » restants
(LockChains, PadlockScreen), fenêtre du cadenas collée aux molettes sur téléphone, tests qui figent des coordonnées exactes.

Sprint 25 : Romain relit les consignes et merge la PR (le merge déploie : jamais pendant la soirée).
**Ne pas déployer pendant la soirée** : le déploiement perd les parties en cours.

## Décisions prises (et pourquoi)
- #84 (choix de Romain) : solutions sur les cartes (masquées) et dans un panneau ; alertes sur Temps écoulé, tablette muette
  (2 min) et 3 mauvaises réponses (pas « saisie bloquée » : chaque mauvaise réponse bloque) ; téléphone Android (vibration).
- #84 (conception) : rien ne sonne à l'ouverture du tableau (ce qui est déjà en cours est seulement rouge) ; pas d'alerte
  « muette » si le tableau lui-même n'a pas lu depuis 15 s (téléphone sorti de veille ou sans réseau) ; aucune modification de
  Supabase ni des tablettes (empreinte inchangée, parties en cours sans risque).
- Sprint 25 (choix de Romain) : la finale a ses 3 indices dans l'app (mêmes horaires 8/10/13 min, sur toutes les tablettes
  à la fois), au lieu de les dire à voix haute ; les enfants tapent **4** (pavé) ; l'épreuve 3 s'appelle « Le laboratoire
  machiavélique » (la comptine garde « aux toilettes », c'est toujours la même salle).
- Sprint 24 (choix de Romain) : tout le monde est dans la même salle, la 6e épreuve se joue ensemble en dernier ; chaque
  équipe tape la réponse sur sa tablette ; cadenas dès la finale trouvée (pas d'attente de fin de créneau).
- Sprint 24 (relecture) : plus de chrono d'épreuve sur le cadenas atteint pendant la finale (il n'a pas de limite) ;
  « Passer au cadenas » au lieu de « Passer à l'épreuve suivante » dans le menu animateur pendant la finale.
- Sprint 24 (design) : l'écran de la finale reste affiché le temps du « Bravo ! » (`useFinaleHold`), sinon la chute de
  goupille et le « Bravo ! » disparaîtraient avec le passage immédiat au cadenas.
- Sprint 22 (choix de Romain) : 720 ordres possibles pour le code, donc une énigme sur l'écran du cadenas (comptine rimée,
  niveau moyen) qui suit l'ordre des salles ; les chiffres par salle sont déjà rappelés dans la liste au-dessus.
- Sprint 20 (cadrage, choix de Romain) : style de `cadenas.jpeg` sur les 3 cadenas (le rouillé du sprint 17 disparaît) ;
  le cadenas bouge à chaque bonne réponse ; ouverture = « plongée dans la serrure » ; bandeau « HAPPY HALLOWEEN » gardé.
  SVG + 3D CSS plutôt que Three.js (pas de modèle 3D, poids, tablettes, hors ligne).
- Sprint 20 (exécution) : le « Bravo ! » opaque cachait le tressautement → délai du « Bravo ! » 0,5 → 1,5 s, tressautement
  raccourci à 1,1 s. Fenêtre du cadenas d'épreuve en hublot arrondi (6 chiffres lisibles), pas en rond parfait.
- Suite de relecture : une heure « à venir » tapée dans « Départ de la partie » compte pour hier si c'est à moins de 12 h
  (soirée qui passe minuit), sinon refusée (faute de frappe).
- Sprint 19 (design) : heure de départ à la minute (écart ≤ 1 min avec les autres tablettes, acceptable) ; possible sur
  tout écran `playing` (y compris « Temps écoulé » et cadenas), pas avant « Commencer ». Pas de confirmation : taper une heure est déjà volontaire.
- Sprint 18 (cadrage, choix de Romain) : trois besoins (tout le monde avance, une équipe bloquée, une tablette décalée).
  Un saut sur une seule tablette l'envoie dans une salle occupée → bouton avec confirmation « à faire sur toutes les
  tablettes » ; équipe bloquée = « Valider l'épreuve » (existant) ; tablette décalée = sprint 19 (heure de départ).
- Sprint 18 (design) : le saut donne le chiffre de l'épreuve pas trouvée (sinon « Temps écoulé » redemandait le code) ;
  l'action nomme son épreuve (un tap au changement de créneau ne saute pas deux fois). Le `skipSlot` du mode test reste inchangé.
- Sprint 17 (choix de Romain) : ambiance rouille + chaînes + sang ; molettes-tambours 3D + animation d'ouverture.
- Sprint 17 (design) : ouverture jouée au début de la victoire plutôt qu'avant (pas de nouvel état de partie).
- Sprint 16 (choix de Romain) : grande célébration plein écran ; message d'attente identique dans toutes les salles ;
  « Changement de salle » → « Changement d'épreuve ».
- Sprint 16 (exécution) : fond du « Bravo ! » opaque (translucide, on lisait « Chiffre trouvé » sous le gros chiffre) ;
  célébration déclenchée dans l'écran d'étape (passage non trouvé → trouvé), donc aussi pour « Valider l'épreuve » de l'animateur.
- Sprint 15 (choix de Romain) : sprint partiel, seules 2 épreuves sur 6 reçues ; les autres gardent leur contenu d'exemple
  marqué « à remplacer » dans `quiz.yaml`.
- Sprint 15 (choix de Romain) : une consigne de 4 lignes faisait défiler l'écran d'étape de 51 px sur tablette → cadenas
  réduit (260 → 190 px) plutôt que consignes raccourcies ou texte plus petit. Limite : 4 lignes (≈ 200 caractères).
- Sprint 15 : le test du voile de l'indice du cadenas ne le vérifie que s'il existe (le quiz n'en a plus pour l'instant).
- Sprint 14 (exécution) : indices disponibles = max (pas somme) du chrono et de l'animateur ; une vieille sauvegarde avec
  `hintSlot` sans `hintCount` reprend avec 1 indice ; un seul indice dans une étape → fenêtre « Indice » sans numéro.
- Sprint 14 (cadrage, choix de Romain) : horaires d'indices communs à toutes les épreuves (`indices_apres_minutes: [5, 8, 11]`,
  modifiable) ; enfants : indices un par un ; menu animateur : un indice de plus par appui, tous les indices dans les solutions.
- Contenu réel (choix de Romain) : textes indépendants de l'ordre de passage (rotation) ; consignes courtes (3-4 lignes, je
  les condense et Romain valide) ; au cimetière les enfants tapent **8** (2806 ouvre un vrai cadenas sur place).
- Sprint 13 (cadrage, choix de Romain) : menu animateur via la fenêtre de ↺ (rien de plus à l'écran pour les enfants),
  code toujours demandé (le menu montre les solutions). Actions : valider l'épreuve, débloquer la saisie, montrer
  l'indice, voir les solutions. Le menu ne touche jamais au temps (rotation intacte).
- Sprint 13 (exécution) : « Valider l'épreuve » seulement sur une épreuve en cours (« Temps écoulé » garde son code à
  l'écran) ; une action ferme le menu (l'animateur voit l'effet tout de suite) ; sur téléphone, boutons de la fenêtre ↺
  réduits pour tenir sur une ligne.
- Épreuve 6 (issue #35) : source « 6eme epreuves.png » renommée « invisible mais visible.png » (→ `invisible-mais-visible.webp`,
  même règle de nom que les autres fonds).
- Sprint 12 (cadrage, choix de Romain) : le saut de créneau sert seulement à tester l'app, pas pendant la soirée
  (une tablette qui avance seule arrive dans une salle occupée et reste décalée). Activation par `?test` dans
  l'adresse : un enfant ne peut pas l'activer en tapotant. Pas de saut sur « Temps écoulé » (il faut le code
  animateur, comme en vrai) ; l'indice ne se débloque pas plus tôt.
- Sprint 11 (cadrage, choix de Romain) : épreuves 1 à 6 = La galerie des portraits, La table hantée, Le cimetière,
  Les saveurs hantées, Les toilettes scientifiques, Invisible mais visible (sans image → décor dessiné de la grande salle).
  « image principale » : accueil + attente ; « sortie du restaurant » : cadenas + victoire ; l'entrée garde sa façade dessinée.
- Sprint 11 (plan) : nouvelles clés `fond` (étape), `fond_accueil`, `cadenas.fond` ; la clé `image` (image dans le
  parchemin) reste telle quelle. WebP en noms ASCII ; « Temps écoulé » montre la salle de l'épreuve ratée.
- Sprint 11 (exécution) : source « la table hanté.png » renommée « hantée » (→ `table-hantee.webp`) ; originaux dans
  `images-sources/` (gitignoré, restent sur le PC de Romain). WebP ≈ 200–250 Ko. Voile sombre en dégradé : texte lisible
  sur les 7 écrans (tablette et téléphone). Test de mise en page étendu aux 6 épreuves (titres plus longs) : aucun défilement.
- Sprint 10 (cadrage, choix de Romain) : bouton indice à cheval sur le bas du parchemin, grisé « Indice dans 03:00 »,
  puis « Voir l’indice » qui ouvre une fenêtre relisible à volonté (l'écran d'étape n'a plus de place en hauteur).
- Sprint 10 (plan) : décompte du blocage dans la ligne de la réponse tapée (touches grisées) ; blocage plafonné à la
  fin du créneau ; seulement sur les épreuves ; pas d'indice sur l'attente, « Temps écoulé » et le cadenas.
- Sprint 10 (plan) : `blockedUntil` sauvegardé et relu (seulement en `playing`) ; une sauvegarde sans ce champ est
  rejetée. `indice_apres_minutes` et `blocage_secondes` validés avec les réglages de partie (`validateTeamSettings`).
- Sprint 10 (tâche 5) : la fenêtre d'indice héritait de l'encre sombre du parchemin (texte illisible) : encre claire
  forcée dans `hint.css`. Écran d'étape sur tablette : tient toujours sans défilement avec le bouton d'indice.
- Sprint 9 (relecture) : « Changer d'équipe » puis la même équipe reprend la partie au lieu de l'effacer
  (un enfant pouvait sinon décaler sa tablette dans la rotation pour toute la soirée).
- Sprint 9 (relecture, choix de Romain) : pendant une partie, « Recommencer » demande le code animateur (un reset
  en cours de soirée décalait l'équipe dans la rotation). À l'accueil et après la victoire, pas de code.
- Sprint 9 (tâche 6) : voile sombre derrière « Chiffre de l'épreuve » (écran Temps écoulé) : l'ambre était
  illisible sur la nappe claire ; boutons d'équipe en 40 px sans retour à la ligne (« Loups-garous » se
  coupait en deux). Écran d'étape sur tablette : aucun défilement, aucune retouche de hauteur nécessaire.
- Sprint 9 (tâche 6) : la liste des chiffres et l'indice du cadenas étaient posés sur le décor sans voile : corrigé par
  l'issue #30 (panneau sombre `rgb(12 8 5 / .78)` arrondi, fond uni plutôt que dégradé radial car la liste est large).
- Sprint 9 (plan) : clés YAML du sprint 9 seulement (`equipes`, `duree_epreuve_minutes`, `code_animateur`) ;
  indice et blocage arrivent au sprint 10 avec leurs fonctionnalités.
- Sprint 9 (plan) : ni index d'équipe ni liste « débloqué par un animateur » dans l'état : l'équipe a sa propre clé ;
  un chiffre donné par l'animateur est rangé comme un chiffre trouvé. Choisir une équipe efface la partie.
- Sprint 9 (plan) : une mauvaise réponse garde son créneau (`wrongSlot`) ; une réponse nomme son épreuve (un tap
  au changement de créneau est ignoré) ; code animateur affiché en points (les enfants regardent).
- Sprint 9 (plan) : entête « Épreuve 3/6 » + chrono du créneau en gros + total en petit ; pas de chrono sur le
  cadenas ni la victoire (toutes les équipes finissent ensemble) ; le parchemin perd « Étape 2 sur 6 ».
- Sprint 9 (plan) : l'entrée (`entree`) reste gérée par le code mais sort du `quiz.yaml` d'exemple.
- Escape game (2026-09-24) : 6 équipes, 6 épreuves toutes en rotation (équipe e, créneau c → épreuve
  (e+c) mod 6) : avec l'épreuve 6 commune, une équipe restait sans épreuve. Le moment commun est le repas.
- Escape game : créneaux de 15 min calculés depuis « Commencer » ; pas trouvé → « appelez un animateur » +
  code animateur ; indice par bouton débloqué à 10 min, gratuit ; mauvaise réponse = saisie bloquée 1 min.
- Escape game : équipe réglée sur la tablette par un animateur (image au dos) ; code d'entrée sur papier
  (entrée retirée du YAML) ; chrono épreuve en gros + total en petit ; fin = cadenas virtuel puis vraie porte.
- Sprint 8 (relecture) : suggestions reportées : helper commun pour la règle « bonne réponse » (dupliquée entre
  le réducteur et `answer()`/`unlock()`), pavé à 88 px = limite basse, pas de tests des sous-composants décoratifs.
- Sprint 8 (tâche 6) : voile sombre derrière le texte de victoire : le temps en ambre était illisible sur la
  nappe claire de la grande salle. La queue du « Q » était déjà corrigée à la tâche 3 (fausse alerte).
- Sprint 8 (tâche 5) : la lettre et le clavier cachent le milieu de la façade ; la lanterne (à gauche), l'enseigne
  (à droite) et les citrouilles sont placées dans les bandes visibles (entre lettre et clavier, sous le clavier).
  Une seule lanterne au lieu de deux (l'enseigne prend la place de droite). Sur téléphone, les côtés sont coupés.
- Sprint 8 (tâche 5) : sur téléphone, marge du titre d'entrée réduite (24/16 px) : la lettre faisait défiler de 9 px.
- Sprint 8 (tâche 4) : sur tablette, cadenas d'étape à 260 px (au lieu de 300) et écart de saisie de 12 px :
  l'écran à pavé dépassait de 34 px. Il tient maintenant pile en 1080 px (pavé et clavier de lettres).
- Sprint 8 : l'entête (compteur + bougies) reste tel quel ; l'accueil garde sa bougie, sans décor
  (le spec ne parle que des écrans de jeu).
- Sprint 8 : décor en composants SVG React (pas une image) : animations des flammes coupées par la règle
  `prefers-reduced-motion` existante, et fichiers testables.
- Sprint 8 : le « clac » est joué dans le tap « Valider » (sinon bloqué par la tablette), d'où
  `answer()` qui renvoie un booléen, comme `unlock()`.
- Sprint 8 : sur tablette, l'écran d'étape garde 40 px en bas au lieu de 96 (l'icône ↺ est à gauche, loin
  des claviers centrés) pour que tout tienne en 1080 px.
- Sprint 7 (exécution) : `reponse: 0472` sans guillemets garde son 0 (le parseur relit le texte
  source du YAML) : un oubli de guillemets aurait bloqué les enfants sans aucune erreur.
- Sprint 7 : clavier de lettres resserré (touches 62 px sur tablette, 28 px sur téléphone) : les tailles
  du plan débordaient de l'écran. Hauteur des touches inchangée (70 px / 52 px).
- Sprint 7 : zone de réponse commune `AnswerZone` (entrée + étapes) ; une sauvegarde « entrée » sur un
  quiz sans entrée repart de l'accueil.
- À reprendre au sprint 8 : l'écran à pavé dépasse de 15 px en hauteur sur 810×1080 ; la queue du « Q »
  de la police déborde de sa touche.
- Sprint 7 : les enfants font des **épreuves réelles** ; la tablette sert à taper la bonne réponse
  (chiffres ou mots, choisi par épreuve dans le YAML), qui **donne** un chiffre (`reponse` + `chiffre`
  remplacent `solution`). 1 étape = 1 épreuve.
- Sprint 7 : message d'entrée facultatif (`entree`), sans chiffre ; le **compteur démarre à sa bonne
  réponse**. Mots : majuscules, accents, espaces autour ignorés ; chiffres : zéros de tête comptés.
  Une seule réponse acceptée par épreuve. Clavier AZERTY dessiné (celui du système cache l'écran).
- Sprint 7 : épreuves **fictives** dans le YAML ; Romain fournira les vraies (consigne, réponse, chiffre).
- Sprint 8 (décor, validé en maquette) : grande salle dessinée en SVG « belle comme une image IA »,
  consigne sur parchemin, **gros cadenas vu en coupe** dont une goupille tombe à chaque bonne réponse,
  anse qui se décroche à la fin (option A choisie). Maquette : `.superpowers/brainstorm/` (non versionné).
- Sprint 6 : icône en `position: absolute` en bas de page (pas `fixed` comme prévu au plan) : sur
  téléphone, l'écran du cadenas défile et une icône fixe couvrait la 1re molette. `.screen` garde 96 px
  libres en bas. Sur tablette, rien ne change à l'œil.
- Sprint 6 : relecture, point « une sauvegarde d'un autre quiz est effacée à l'ouverture » non retenu :
  elle ne pourrait jamais être reprise (empreinte différente), l'effacer ne perd rien. Pas de piège du
  Tab dans la fenêtre (2 boutons, usage tactile).
- Sprint 6 : e2e avec `exact: true` sur « Commencer » : Playwright compare en sous-chaîne et
  « Recommencer la partie » contient « Commencer » (4 e2e cassés sinon).
- Sprint 6 : icône ↺ pâle **en bas à gauche** (loin du pavé, peu tentante pour les enfants), anneau qui
  se remplit pendant l'appui de 3 s, puis **fenêtre du jeu** « Recommencer la partie ? » (Annuler /
  Recommencer), Annuler par défaut. Choix de Romain.
- Sprint 6 : empreinte calculée sur la **config validée**, pas sur le texte du YAML : modifier un
  commentaire ne fait pas perdre une partie en cours.
- Sprint 6 : essais ratés non restaurés ; son de victoire non rejoué après rechargement ; sauvegarde
  abîmée ou localStorage refusé → accueil, sans message.
- Sprint 5 : le cadenas ouvre **la salle du restaurant hanté** (pas un coffre à bonbons) → intro du YAML
  corrigée. Titre de l'écran et message de victoire dans le YAML (`cadenas.titre`,
  `cadenas.message_victoire`, facultatifs) pour réutiliser le jeu avec une autre histoire.
- Sprint 5 : animation = anse qui se soulève, double porte qui s'ouvre, lueur, fantômes et chauves-souris,
  puis message + temps mis. CSS pur ; styles de base = état final pour `prefers-reduced-motion`.
- Sprint 5 : son **synthétisé en Web Audio** (clac, grincement, gémissement) : pas de fichier, pas de
  droits, hors ligne. Lancé dans le tap « Ouvrir » (sinon bloqué par la tablette).
- Sprint 5 : molettes à 0 au départ, 9 ↔ 0 en boucle ; code faux = secousse + message, sans pénalité.
  Le compteur se fige à l'ouverture (`finishedAt`).
- Sprint 5 : sur téléphone, molettes resserrées (6 × 50 px) pour tenir sur une ligne à 360 px.
- Sprint 5 : un vieux `vite preview` sur le port 4173 faisait tourner l'e2e sur un ancien build
  (`reuseExistingServer`) ; noté dans les pièges du CLAUDE.md.
- Sprint 4 : `tsconfig.node.json` inclut `DOM` pour le code de `page.evaluate` en e2e ; test d'image
  via `vi.stubEnv('BASE_URL')` car Vitest sert depuis `/`.
- Sprint 4 : progression en **bougies** (design choisi), pas en citrouilles comme écrit dans l'issue.
- Sprint 4 : après la dernière étape, **écran provisoire** « Toutes les énigmes sont résolues ! » avec les
  chiffres trouvés ; remplacé par le cadenas au sprint 5.
- Mauvaise réponse : **messages qui tournent** (4 phrases), jamais deux fois le même de suite.
- Progression en mémoire seulement (réducteur pur) ; localStorage et remise à zéro au sprint 6.
- Polices @fontsource en sous-ensemble latin seulement (accents français couverts, cache hors ligne léger).
- Dépôt **public** : Pages sur dépôt privé exige un compte GitHub payant.
- Pas de Supabase : aucune donnée à stocker, zéro donnée personnelle.
- YAML validé à la construction : un YAML faux bloque la publication.
- Temps écoulé : le jeu continue (compteur rouge négatif).
- Sprint 6 (prévu) : progression sauvegardée sur la tablette ; remise à zéro par appui long 3 s.
- Sprint 5 (prévu) : cadenas, ordre + indice facultatifs dans le YAML.
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

- Design retenu : **Manoir à la bougie** (`docs/design/maquettes/bougie.*`) : fond suie, texte crème,
  touches en sceaux de cire rouge, bougies pour la progression, IM Fell English SC (titres) + Alegreya.

## Points en suspens / questions pour Romain
- Sprint 11 envisagé (demande de Romain, 2026-09-26) : une image de fond par épreuve, fournie par Romain.
  Question : l'image remplace-t-elle le décor SVG de la grande salle, ou passe-t-elle par-dessus ?
- Relecture sprint 10, mineurs reportés : icône de remise à zéro visible au-dessus de la fenêtre d'indice ; focus
  non rendu au bouton à la fermeture (et pas de fermeture en touchant le voile) ; décompte annoncé chaque seconde par
  les lecteurs d'écran ; README qui cite « une minute » / « 10 minutes » en dur ; vieilles sauvegardes rejetées.
- Changer un `indice` le jour J change l'empreinte du quiz et efface les parties en cours (comme toute modif du YAML).
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
- Supabase (projet `quiz-halloween`) seulement pour le suivi à distance ; variables `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` (secrets GitHub pour le build). Sans elles, le jeu marche sans suivi.
- Hébergement : GitHub Pages — `https://romainmoreira17000-droid.github.io/quiz-halloween/`

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
