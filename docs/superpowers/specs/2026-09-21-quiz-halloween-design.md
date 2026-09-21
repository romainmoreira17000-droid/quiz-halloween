# Quiz Halloween — Conception

Date : 2026-09-21 — Statut : validée par Romain

## But

Jeu d'énigmes Halloween pour les enfants du Centre de Loisirs, joué en groupe sur tablette via le web.
Chaque étape donne une consigne ; la réponse est un chiffre de 0 à 9. Les chiffres trouvés servent à
ouvrir un cadenas final qui déclenche une animation d'Halloween. Tout le contenu est paramétré par un
fichier YAML.

## Utilisateurs

- **Enfants** (en groupe, sur tablette) : jouent le quiz.
- **Animateurs** : lancent la partie, remettent à zéro entre deux groupes, éditent le YAML.

## Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Hébergement | GitHub Pages, dépôt **public** `quiz-halloween`, ramdam17 invité | Pages sur dépôt privé exige un compte payant ; Romain accepte que le YAML soit lisible |
| Backend | **Aucun** (pas de Supabase) | Aucune donnée à stocker ni partager ; zéro donnée personnelle |
| Stack | Vite + React + TypeScript + vite-plugin-pwa | Stack standard ; PWA = fonctionne si le wifi coupe |
| YAML | Importé et **validé à la construction** | Un YAML invalide fait échouer le build : jamais de site cassé en ligne |
| Fin du temps | Le jeu **continue** ; compteur rouge et négatif | Éviter la frustration des enfants |
| Mauvaise réponse | Essais illimités, secousse + message gentil, pas de pénalité | Public enfant |
| Rechargement | Progression **sauvegardée** sur la tablette (localStorage) | Un rechargement accidentel ne fait rien perdre |
| Remise à zéro | Icône discrète, **appui long 3 s** + confirmation | Réservé à l'animateur sans code à retenir |
| Cadenas | Ordre et indice facultatifs dans le YAML ; par défaut, ordre des étapes | Énigme finale pour les plus grands |

## Format du YAML (`quiz.yaml` à la racine)

```yaml
titre: "Le manoir hanté"          # obligatoire
intro: "Bienvenue..."             # facultatif
duree_minutes: 90                 # obligatoire, entier > 0
nombre_etapes: 6                  # obligatoire, entier >= 1
etapes:                           # obligatoire, exactement nombre_etapes éléments
  - titre: "La crypte"            # obligatoire, texte non vide
    consigne: "Comptez..."        # obligatoire, texte non vide
    image: "crypte.png"           # facultatif, fichier dans public/images/
    solution: 4                   # obligatoire, entier de 0 à 9
cadenas:                          # facultatif
  ordre: [3, 1, 6, 2, 5, 4]       # facultatif, permutation des numéros d'étape (1..N)
  indice: "Commencez par..."      # facultatif, texte
```

Le code du cadenas est la suite des solutions des étapes prises dans `cadenas.ordre`
(ou dans l'ordre 1..N si absent).

## Validateur

Règles (chaque violation produit un message en français qui situe l'erreur, ex. « étape 4 : la
solution doit être un chiffre entier entre 0 et 9 ») :

1. Le fichier est un YAML lisible et un objet.
2. `titre` : texte non vide. `intro` : texte si présent.
3. `duree_minutes` : entier > 0.
4. `nombre_etapes` : entier >= 1.
5. `etapes` : liste de **exactement** `nombre_etapes` éléments.
6. Chaque étape : `titre` et `consigne` textes non vides ; `solution` entier 0–9 ; `image` texte si présent.
7. `cadenas.ordre` si présent : liste de longueur `nombre_etapes`, contenant chaque entier de 1 à N une seule fois.
8. `cadenas.indice` : texte si présent.
9. Chaque `image` citée existe dans `public/images/` (vérifié par le script Node uniquement).
10. Clés inconnues signalées (faute de frappe probable, ex. `solutions`).

Le validateur **collecte toutes les erreurs** (il ne s'arrête pas à la première) et renvoie soit la
config typée, soit la liste d'erreurs. Il est exécuté :
- par `npm run valider` (script Node, sortie lisible, code de sortie 1 si erreurs) ;
- automatiquement en `prebuild` et dans la CI ;
- dans l'app au chargement (sécurité en dev : écran d'erreur listant les problèmes).

## Écrans

1. **Accueil** : titre, intro, bouton « Commencer » (démarre le compteur).
2. **Étape N/total** : bandeau (compteur mm:ss, progression en citrouilles), titre, consigne, image
   éventuelle, pavé de 10 gros boutons 0–9. Bonne réponse → « Chiffre trouvé : X » + bouton
   « Étape suivante ». Mauvaise → secousse + message.
3. **Cadenas** : rappel des chiffres trouvés avec le titre de leur étape, indice éventuel, N molettes
   (flèches haut/bas), bouton « Ouvrir ». Code faux → secousse.
4. **Victoire** : ouverture du cadenas puis animation Halloween, temps final affiché.
5. **Remise à zéro** : icône discrète présente sur tous les écrans, appui long 3 s puis confirmation.

Le compteur continue après zéro (affichage « -mm:ss » en rouge). Le temps est calculé à partir
de l'heure de départ enregistrée (pas d'un décompte en mémoire), pour rester juste après une mise en
veille ou un rechargement.

## Architecture

```
quiz.yaml                  paramètres du quiz
scripts/valider.ts         CLI du validateur (Node)
src/config/                schéma, validateur, chargement du YAML
src/game/                  logique pure : vérifier une réponse, code du cadenas, formatage du temps
src/hooks/                 useCountdown, useGameProgress (localStorage)
src/components/            un composant par écran + Keypad, Padlock, HalloweenAnimation, ResetButton
e2e/                       parcours Playwright
```

Pas de dossier `services/` Supabase : l'app n'a pas de backend. L'état sauvegardé
(étape courante, chiffres trouvés, heure de départ, statut) est versionné par une empreinte du YAML :
si le quiz change, l'ancienne progression est ignorée.

## Tests

- **Vitest** : validateur (une règle = au moins un test OK et un test KO, cas limites 0 et 9,
  étapes en trop / en moins, ordre avec doublon), logique du jeu, hooks, composants.
- **Playwright** (vue tablette) : partie complète avec une erreur, fin du temps (horloge simulée),
  reprise après rechargement, remise à zéro.

## Déploiement

- `base: '/quiz-halloween/'` dans `vite.config.ts`.
- `.github/workflows/ci.yml` sur les PR : typecheck, valider, tests, build.
- `.github/workflows/deploy.yml` sur `main` : build puis publication Pages.

## Sprints

1. Squelette, CI, déploiement Pages
2. Validateur YAML
3. Maquettes design Halloween (2–3 propositions, captures Playwright, choix de Romain)
4. Déroulé des étapes + compteur
5. Cadenas + animation finale
6. Reprise après rechargement + remise à zéro

## Hors périmètre

Sons, multi-groupes simultanés synchronisés, statistiques, back-office d'édition du YAML.
