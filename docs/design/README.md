# Maquettes du design (sprint 3, issue #3)

Trois directions visuelles proposées pour le jeu, chacune sur trois écrans (accueil, étape, cadenas).
Ce sont des pages HTML statiques et jetables : elles ne font pas partie de l'app. La direction
retenue sera réécrite proprement dans les composants React au sprint 4.

| Direction | Fichiers | Idée |
|---|---|---|
| 1. Manoir à la bougie | `maquettes/bougie.*` | noir et brun chaud, flamme qui vacille, touches en sceaux de cire |
| 2. Potion de sorcière | `maquettes/potion.*` | violet et vert phosphorescent, chaudron qui bouillonne, touches en fioles |
| 3. Citrouilles sous la lune | `maquettes/lune.*` | bleu nuit, titre écrit sur la lune, touches en citrouilles |

**Direction retenue par Romain : 1. Manoir à la bougie.**

Contraintes communes : salle dans le noir, donc fond sombre et pas de blanc pur ; public de 7 à 10 ans ;
touches du pavé de 120 px et plus.

## Voir une maquette

Ouvrir le fichier HTML dans un navigateur, puis ajouter `#accueil`, `#etape` ou `#cadenas` à l'adresse.
Les polices viennent de Google Fonts : il faut une connexion internet.

## Refaire les captures (810×1080)

```bash
npx tsx scripts/capture-maquettes.ts          # les trois directions
npx tsx scripts/capture-maquettes.ts potion   # une seule
```

Les images sont écrites dans `captures/<direction>-<écran>.png`.
