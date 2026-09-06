# Refonte de l'habillage

Les fonctionnalités sont finies. Ce plan ne touche qu'à ce qui se voit.

## Ce qu'on quitte

L'écran actuel est un thème shadcn sans couleur ni matière. Rien n'y dit Dofus.

## Ce qu'on a trouvé sur les images d'Ankama

Le client Dofus Retro n'écrit qu'une seule adresse de CDN, dans
`retroclient/config.xml` :
`https://dofusretro.cdn.ankama.com/static-data/612/`. Ce serveur ne rend que les
fichiers de langue. Les dossiers `gfx`, `clips`, `maps`, `docs` et `tutorials`
répondent tous « Access Denied » : le client les porte avec lui.

Les images du jeu sont donc sur le disque, dans
`/Applications/Ankama/Retro/Dofus Retro.app/Contents/Resources/app/retroclient/` :

- `clips/items/` : 6865 icônes d'objets
- `clips/spells/` : 965 icônes de sorts
- `clips/artworks/breeds/1..12.swf` : les 12 classes
- `clips/artworks/faces/` et `mini/` : 74 et 76 têtes de personnage
- `clips/artworks/big/` et `illu/` : 826 et 45 illustrations
- `clips/sprites/` : 1117 sprites
- `loadingbanners/1..26.jpg` : les bannières de chargement, déjà en JPEG

Tout est du Flash vectoriel, sauf les bannières. Le vectoriel se convertirait en
SVG, ce qui servirait mieux une interface qu'une image plate.

**Cette piste est fermée.** Ankama ne tolère les gestionnaires de fenêtres qu'à
la condition écrite qu'ils n'interagissent jamais avec les fichiers du jeu, et le
[README](../README.md) cite ses deux messages. Ouvrir les `clips/` pour en tirer
des images, c'est exactement ce que cette phrase interdit, et c'est la tolérance
qui fait vivre multifus qu'on mettrait en jeu pour une icône. L'inventaire
ci-dessus reste ici pour dire ce qui existe, pas pour y puiser.

Le CDN du site, `static.ankama.com`, rend des JPEG, des PNG et des GIF sans compte
ni jeton. Il porte les logos Dofus Retro, les planches d'icônes du site et les
images de tous les articles. Les 545 articles de `www.dofus-retro.com` ont été
lus, actualités et mises à jour comprises, et rien d'autre : aucune page de Dofus
2 ni de Dofus 3.

Le site officiel n'a rien avant 2020, et ce n'est pas un trou du relevé : Dofus
Retro a rouvert en 2019 et le site est né avec lui. Ce qui est plus ancien vit
chez la communauté. Deux sites ont donc été lus en entier, par leur plan de site :
`dotrofus.com`, une encyclopédie, et `dofuspourlesnoobs.com`, des guides tenus
depuis les premières années du jeu.

Le relevé est dans
[plan-design-images-ankama.txt](./plan-design-images-ankama.txt), une section par
source. La galerie qui les montre est
[plan-design-images-ankama.html](./plan-design-images-ankama.html), à ouvrir dans
un navigateur, un onglet par source. Elle trie par taille, par poids et par date,
filtre par format, pose un damier derrière l'image pour juger la transparence, et
n'affiche les vignettes que par lots de 240 pour tenir la charge.

## Droits

Les CGU de Dofus Retro ont été lues le 5 septembre 2026. Elles ne laissent aucune
place au doute, et rien dedans ne dit qu'un crédit suffit.

- **13.1** : tout ce qui vient d'Ankama, œuvres d'art comprises, « ne peut faire
  l'objet d'aucune utilisation sans l'autorisation préalable et écrite d'Ankama ».
- **13.2** : interdiction de copier, reproduire, extraire, ou créer des œuvres
  dérivées, en tout ou partie, sans accord écrit préalable.
- **13.3** : les marques, donc le nom et les logos, demandent la même
  autorisation écrite.
- **5.2.8** : interdiction de distribuer, même à titre gracieux, tout ou partie
  des fichiers du client.
- **5.2.7** : pas d'exploitation commerciale. multifus est gratuit, ce point-là
  est tenu.
- **5.3.3** : la seule ouverture. Ankama « pourra autoriser, à sa seule
  discrétion, la diffusion de sites de fans ». C'est une tolérance révocable, elle
  vise des sites, pas un logiciel qu'on installe.
- **13.5** : Ankama s'oppose au moissonnage automatisé de ses sites et le
  qualifie d'acte de contrefaçon. Le relevé d'images a été fait à la main, pour
  repérer, et il ne garde que des adresses. Il n'est pas à refaire à grande
  échelle.

Créditer ne donne aucun droit. En droit français, nommer l'auteur satisfait le
droit moral, jamais le droit patrimonial, qui est celui de reproduire. Gratuit ne
change rien non plus : le droit d'auteur ne connaît pas d'exception pour l'usage
gratuit, et la courte citation ne couvre pas les images.

Le point le plus exposé n'est pas l'usage, c'est **la licence MIT du dépôt**.
Poser une image d'Ankama dans un dépôt MIT revient à concéder au monde entier le
droit de la copier et de la vendre, ce que multifus ne peut pas donner. Les
vingt-quatre portraits déjà présents tiennent parce qu'ils vivent dans un dossier
qu'un `git rm` retire d'un coup. Toute image gardée suit la même discipline, dans
un dossier à part, exclu de la licence.

Une image prise chez `dotrofus.com` ou `dofuspourlesnoobs.com` porte deux couches
de droits : le travail de l'auteur du site, et le contenu d'Ankama en dessous. Il
faut écrire aux deux.

**La voie sûre est d'écrire à Ankama**, `contact@ankama.com`, et de demander
l'autorisation pour un logiciel gratuit et ouvert. C'est le seul chemin qui donne
un droit plutôt qu'une tolérance.

**En attendant, l'habillage se dessine sans fichier d'Ankama.** Un style
graphique ne se protège pas, une image si. La palette, les matières, les formes
rondes, l'or biseauté, le bois : libres. Les images du client et du site : non.

## Le logo

Dix pistes dessinées en SVG dans
[plan-design-logos.html](./plan-design-logos.html). Aucune n'est retenue.

Le prompt qui décrit multifus, l'univers du jeu et les règles graphiques d'Ankama
à un modèle qui n'en sait rien est dans
[plan-design-logo-prompt.md](./plan-design-logo-prompt.md), en version longue pour
un modèle qui rend du SVG et en version courte pour un générateur d'images.

Le test qui tranche : la silhouette noire à 16 pixels, parce que multifus vit
dans la barre de menus et que macOS y peint tout d'une seule couleur.

## Le système

Il est relevé, écrit et figé dans
[docs/design-system.md](./design-system.md) : d'où vient chaque couleur, chaque
fonte, chaque matière, ce qui a été écarté, les huit règles, et ce qu'il reste à
relever pour les écrans qui viennent. Ce plan ne le répète pas.

## La mise en route est livrée

Six scènes, un décor du jeu en plein cadre par étape, un carton de chapitre au
milieu, puis la plaque qui se déplie et son contenu qui monte cran par cran.
Commit `b5c378c`. Le pourquoi de chaque choix est dans
[docs/design-system.md](./design-system.md) ; il ne reste ici que la provenance
des six images, parce qu'elles vivent dans le dépôt.

| Étape             | Décor          | Pourquoi                                |
| ----------------- | -------------- | --------------------------------------- |
| Bienvenue         | `camp.webp`    | un camp bondé : c'est le multicompte    |
| L'autorisation    | `village.webp` | les maisons d'Astrub, et leurs fenêtres |
| Les notifications | `harbour.webp` | le port, ce qui arrive de loin          |
| La concentration  | `forest.webp`  | un combat en forêt, plus sombre         |
| Dans le jeu       | `pen.webp`     | l'enclos, un lieu à soi qu'on règle     |
| L'essai           | `arena.webp`   | un combat : le jeu qui appelle          |

Les cinq premiers sont recadrés en 4:3 depuis
`static.ankama.com/dofus-retro/www/modules/mmorpg/discover/assets/screens/screenN.jpg`,
le sixième depuis
`static.ankama.com/upload/backoffice/direct/2021-02-22/827fd3d564a0507051826a7fcf5f5e18.png`.
Ils portent le logo Dofus Retro d'Ankama incrusté, et la mention de droits est
répétée sous la clôture. La [licence](../LICENSE) exclut le dossier du MIT.

### Les trois décors ajoutés pour le monde

Donnés par Victor le 5 septembre 2026, depuis
`static.ankama.com/upload/backoffice/direct/`.

| Fichier         | Source                    | Ce qu'il porte                               |
| --------------- | ------------------------- | -------------------------------------------- |
| `dolmen.webp`   | `2026-06-24/d865ca61…png` | quatre menhirs autour d'une dalle pavée      |
| `workshop.webp` | `2023-03-21/04ba16cf…png` | un atelier : l'enclume, la scie, les potions |
| `battle.webp`   | `2025-02-10/3620d31a…png` | un champ de bataille, braseros et ossements  |

**Un quatrième a été écarté**, `2020-12-03/e01dbec5…png` : c'est un montage de
presse KrosmoNote, cinq vignettes séparées par des traits blancs, avec le
filigrane Ankama. Chaque vignette fait 635 × 360, soit un agrandissement de 2,4
pour remplir une fenêtre de 1100. Un fond ne se prend pas dans un montage.

### Comment un décor est choisi

Deux questions, dans cet ordre : **est-ce qu'il dit ce que la map fait**, et
**est-ce qu'un texte s'y lit**. Les deux comptent, et le premier passe devant.

| Map                | Décor           | Ce qu'il dit                                      |
| ------------------ | --------------- | ------------------------------------------------- |
| Accueil            | `dolmen.webp`   | la dalle porte la team                            |
| Personnages        | `camp.webp`     | un camp bondé : votre roster au complet           |
| Raccourcis         | `village.webp`  | la place du village, on va d'une maison à l'autre |
| Réponses rapides   | `harbour.webp`  | le quai : c'est là qu'on se parle                 |
| AutoFocus          | `battle.webp`   | le combat, et c'est à votre tour                  |
| Déplacement rapide | `forest.webp`   | la grille de déplacement, sous les arbres         |
| Tableau des runes  | `workshop.webp` | l'atelier du forgemage, l'enclume et les runes    |
| Messages privés    | `pen.webp`      | l'enclos, loin de la foule, où un mot vous trouve |
| Paramètres         | `workshop.webp` | l'atelier, encore : c'est là qu'on règle          |
| À propos           | `village.webp`  | le village, d'où le projet vient                  |

**Les décors sombres vont aux maps qui parlent le plus.** `battle` et `workshop`
sont les deux plus sombres et les moins saturés, et ce sont AutoFocus, Tableau
des runes et Paramètres qui portent le plus de lignes. `camp`, le plus chargé, va
là où il y a le moins à lire.

`arena.webp` n'est plus un décor de map depuis que la roue a rejoint les
Personnages, mais il reste dans le dépôt : la mise en route s'en sert pour
l'étape de l'essai.

### La boucle de la roue

| Fichier          | Source                    | Ce qu'il porte                   |
| ---------------- | ------------------------- | -------------------------------- |
| `wheel-loop.gif` | `2022-07-26/f9dfcb77…gif` | une Crâ qui respire dans l'herbe |

**C'est un bouche-trou.** Il tient la place de l'enregistrement de la roue à
l'œuvre, que Victor fera dans le jeu. Il fait 950 × 531 et pèse 345 Ko ; le
remplacer ne demande rien d'autre que d'écraser le fichier.

## Ce qui vient : tout le reste du logiciel

Même système, même univers, mais ce ne sont plus des étapes : ce sont des écrans
qu'on rouvre tous les jours. La section « Étendre le système au reste de
Multifus » de [docs/design-system.md](./design-system.md) dit ce qui passe tel
quel, ce qui ne passe pas, et les douze matières qui manquent encore.

Trois choses à trancher avant de dessiner, et elles sont pour Victor :

- **Les icônes** de la barre de gauche : les garder, les enlever, ou en dessiner
  un jeu. C'est ce qui décide de l'allure de tout le logiciel
- **Le décor** : une image d'Ankama au fond de chaque écran, seulement au fond de
  ceux où l'on entre, ou pas d'image du tout et rien qu'une matière
- **Par quel écran commencer** : le plus dense dit tout de suite si le système
  tient, donc Raccourcis ou Personnages

## Ce qui reste à décider

- Les trois questions ci-dessus
- Quelles images Victor garde, dans la galerie
- Le logo
