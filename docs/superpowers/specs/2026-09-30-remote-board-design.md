# Tableau de bord animateur à distance — Conception

Date : 2026-09-30 — Statut : à relire par Romain — Issue : #65

## But

Pendant la soirée, un animateur voit **depuis son téléphone** où en est chaque équipe (épreuve, temps restant,
chiffres trouvés, blocages, indices, tablette décalée ou muette), sans aller voir chaque tablette.

Ce sprint est le **sprint 1 : voir** (lecture seule). Les actions à distance (valider, débloquer, indice,
passer à l'épreuve suivante pour tous, départ commun) feront l'objet d'un sprint 2, s'il reste du temps avant
la soirée.

## Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Découpage | Sprint 1 lecture seule, sprint 2 actions | Tester le suivi en vrai (wifi du lieu) sans risque de dérégler une tablette |
| Source de vérité | Chaque tablette reste maître de sa partie ; le suivi n'est qu'une copie | Sans réseau, le jeu marche exactement comme avant |
| Backend | Supabase, projet dédié | Stack habituelle ; seul moyen de partager un état entre appareils |
| Accès | Un **code de soirée** vérifié par la base, sans compte | Un seul animateur (ou deux) ; un secret mis dans le build serait lisible par tous (dépôt et site publics) |
| Code de soirée | Différent du code animateur (2710, public), chiffré dans la base, jamais dans le dépôt | Seule la base peut garder un secret |
| Mises à jour | Tablette : à chaque changement + toutes les 30 s + au retour du réseau. Tableau : relit toutes les 5 s | Plus simple et plus robuste que le temps réel ; le chrono est recalculé sur place, donc 5 s de retard ne se voient pas |
| Calculs du tableau | Mêmes fonctions pures que la tablette (`gamePhase`, `hintsAvailable`...) sur l'état reçu | L'état est petit ; pas de logique dupliquée |
| Données | Nom de l'équipe et état de partie seulement ; écrasés à chaque envoi ; « Nouvelle soirée » vide tout | Aucune donnée personnelle, rien qui s'accumule |

## 1. Base de données

Nouveau projet Supabase. Migration `supabase/migrations/<horodatage>_remote_board.sql`.

**Tables** (RLS activée sur les deux, **aucune policy** : ni `anon` ni `authenticated` ne les lisent ni ne les
écrivent directement) :

- `evening_secret` : `id` (toujours 1, contrainte), `code_hash` (texte, `crypt(code, gen_salt('bf'))` de
  pgcrypto).
- `team_status` : `team` (texte, clé primaire, 1 à 40 caractères), `fingerprint` (texte, 64 caractères
  au plus), `state` (jsonb, 2 Ko au plus), `updated_at` (timestamptz, `now()` du serveur).

**Fonctions** (`security definer`, `set search_path = ''`, `execute` retiré à `public` et donné à `anon`) :

- `push_team_state(code, team, fingerprint, state)` : vérifie le code, puis insère ou remplace la ligne de
  l'équipe avec `updated_at = now()`. Refuse une nouvelle équipe s'il y en a déjà 12. Refuse les tailles hors
  limites.
- `read_board(code)` : vérifie le code, puis renvoie `{ server_now, teams: [{ team, fingerprint, state, updated_at }] }`.
- `reset_board(code)` : vérifie le code, puis vide `team_status`.

Un mauvais code lève une erreur nommée (`invalid evening code`) après une pause de 0,5 s (`pg_sleep`), pour
freiner les essais au hasard. Le code fait **au moins 8 caractères**.

**Réglage du code** : une commande SQL donnée à Romain (non commitée), à lancer une fois puis avant chaque
soirée s'il veut le changer.

## 2. Côté tablette

- **Réglage de l'équipe** (`TeamSetupScreen`, déjà derrière le code animateur) : champ facultatif « Code de
  soirée ». Gardé dans le localStorage (`quiz-halloween:evening-code`, service `savedEveningCode`, seul accès à
  cette clé) ; survit à une remise à zéro et à « Changer d'équipe ».
- **Service `src/services/board.ts`** : seul fichier qui parle à Supabase (`@supabase/supabase-js`, clé
  `anon`). `pushTeamState` renvoie `'ok' | 'refused' | 'offline'` et ne lève jamais. `readBoard` et `resetBoard`
  pour l'écran animateur.
- **Hook `useBoardSync(team, fingerprint, state, code)`** : envoi à chaque changement d'état, toutes les
  30 s, et à l'événement `online`. Aucun envoi sans code ou sans configuration Supabase. Renvoie l'état du suivi
  (`connecté`, `hors ligne depuis`, `code refusé`, `désactivé`).
- **Menu animateur** : ligne « Suivi à distance : ... » avec cet état, pour vérifier chaque tablette en début
  de soirée. Rien n'est jamais montré aux enfants.
- **Configuration** : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local` (gitignoré) et dans les
  variables du dépôt GitHub (lues par `deploy.yml`). Absentes : suivi désactivé.

## 3. Écran animateur

- Adresse `…/quiz-halloween/?animateur` (lue par `Game` comme `?test`) : `Game` affiche `BoardScreen` au lieu
  du jeu.
- **Saisie du code de soirée** au premier accès, gardé sur le téléphone ; code refusé → retour à la saisie
  avec « Code refusé ».
- **En-tête commun** : heure de départ (celle de la majorité des équipes), temps écoulé, « Changement
  d'épreuve dans mm:ss ».
- **Une carte par équipe**, dans l'ordre de `equipes` du YAML (empilées sur téléphone, grille sur tablette) :
  - état : « Pas commencé », « En épreuve », « Chiffre trouvé, attente », « Temps écoulé », « Au cadenas »,
    « Victoire à hh h mm », « Version différente » (empreinte différente : calculs impossibles) ;
  - épreuve en cours (titre) et temps restant du créneau, en direct ;
  - 6 cases des chiffres trouvés (sans les valeurs) ;
  - alertes : « Bloquée m:ss », « n mauvaises réponses », « Indices vus n/m » ;
  - « Décalée de n min » si le départ s'écarte de plus d'une minute de la médiane des équipes en jeu ;
  - fraîcheur (heure du serveur) : « à l'instant » ; orange au-delà d'1 min ; rouge au-delà de 2 min ;
    « Aucune nouvelle » si jamais vue.
  - Une ligne d'une équipe absente du YAML est ignorée.
- **Pied** : « Mis à jour il y a n s » ou « Connexion perdue, nouvelle tentative… » ; bouton « Nouvelle
  soirée » avec confirmation et « Annuler ».
- Relecture suspendue quand l'onglet est caché (`visibilitychange`), reprise au retour.
- Thème « Manoir à la bougie », gros caractères, sans décor lourd.

Logique de carte dans une fonction pure `src/game/board.ts` (entrée : ligne reçue, config, heures ; sortie :
ce que montre la carte), les composants ne font qu'afficher.

## 4. Erreurs

- Réseau coupé, Supabase en panne, code refusé : la tablette joue normalement ; le tableau le signale ; tout
  se rattrape au retour du réseau.
- Fraîcheur calculée sur `server_now` et `updated_at` (même horloge) ; temps restant sur l'horloge du téléphone
  (quelques secondes d'écart au pire).
- État reçu passé par `restoreGameState` (comme une sauvegarde relue) : un état abîmé donne « Version
  différente » plutôt qu'un plantage.

## 5. Tests

- **Unitaires** : `board.ts` (tous les états, jamais vue, autre version, victoire, blocage fini, décalage,
  fraîcheur aux seuils), service `board` (faux client : `ok`, `refused`, `offline`, jamais d'exception),
  `useBoardSync` (horloge simulée : changement, 30 s, `online`, rien sans code), `savedEveningCode`.
- **Composants** : saisie du code, cartes, « Nouvelle soirée » avec confirmation, ligne « Suivi à distance ».
- **e2e Playwright** : faux Supabase intercepté (`page.route` sur `/rest/v1/rpc/*`) : une tablette joue, le
  tableau montre la bonne carte. La CI ne dépend jamais du vrai serveur.
- **Sécurité de la base** : script `scripts/check-board-security.ts` lancé contre le vrai projet avec la clé
  `anon` : lecture/écriture directe des tables refusée, mauvais code refusé, tailles et 13e équipe refusées, bon
  code accepté. Puis agent `auditeur-supabase` (Opus) avant la PR.

## 6. Mise en ligne (chaque étape avec l'accord de Romain)

1. Créer le projet Supabase. 2. Appliquer la migration. 3. Régler le code de soirée. 4. Ajouter
`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` aux variables du dépôt. 5. Merger la PR.

La forme de `QuizConfig` ne change pas : l'empreinte reste la même, le déploiement ne fait pas perdre les
parties. Règle inchangée : **jamais de déploiement pendant la soirée**.

## Hors périmètre

- Toute action à distance sur les tablettes (sprint 2).
- Historique des parties, statistiques.
- Comptes animateurs individuels.
