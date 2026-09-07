# Les images d'Ankama, et les droits

Chaque image du dépôt vient d'Ankama. Ce document dit d'où, à quelle condition,
et pourquoi certaines pistes sont fermées. Le système graphique, lui, est dans
[design-system.md](./design-system.md).

## Les droits

Les CGU de Dofus Retro ont été lues le 5 septembre 2026. Rien dedans ne dit
qu'un crédit suffit.

- **13.1** : tout ce qui vient d'Ankama, œuvres d'art comprises, « ne peut faire l'objet d'aucune utilisation sans l'autorisation préalable et écrite d'Ankama »
- **13.2** : interdiction de copier, reproduire, extraire ou créer des œuvres dérivées, en tout ou partie, sans accord écrit préalable
- **13.3** : les marques, donc le nom et les logos, demandent la même autorisation écrite
- **5.2.7** : pas d'exploitation commerciale. Multifus est gratuit, ce point-là est tenu
- **5.2.8** : interdiction de distribuer, même à titre gracieux, tout ou partie des fichiers du client
- **5.3.3** : la seule ouverture. Ankama « pourra autoriser, à sa seule discrétion, la diffusion de sites de fans ». C'est une tolérance révocable, et elle vise des sites, pas un logiciel qu'on installe
- **13.5** : Ankama s'oppose au moissonnage automatisé de ses sites et le qualifie de contrefaçon. Le relevé d'images a été fait à la main, pour repérer, et il ne garde que des adresses

Créditer ne donne aucun droit : en droit français, nommer l'auteur satisfait le
droit moral, jamais le droit patrimonial, qui est celui de reproduire. Gratuit
ne change rien non plus, le droit d'auteur ne connaissant pas d'exception pour
l'usage gratuit, et la courte citation ne couvrant pas les images.

Le point le plus exposé est **la licence MIT du dépôt**. Poser une image
d'Ankama dans un dépôt MIT revient à concéder au monde le droit de la copier et
de la vendre, ce que Multifus ne peut pas donner. Les images tiennent parce
qu'elles vivent dans des dossiers qu'un `git rm` retire d'un coup, et que la
[licence](../LICENSE) exclut du MIT. Toute image gardée suit cette discipline.

**La voie sûre est d'écrire à Ankama**, `contact@ankama.com`, et de demander
l'autorisation pour un logiciel gratuit et ouvert : c'est le seul chemin qui
donne un droit plutôt qu'une tolérance. En attendant, **l'habillage se dessine
sans fichier d'Ankama** : un style graphique ne se protège pas, une image si. La
palette, les matières, les formes rondes, le bois sont libres ; les images du
client et du site ne le sont pas.

## Les fichiers du client, piste fermée

Le client n'écrit qu'une adresse de CDN, dans `retroclient/config.xml` :
`https://dofusretro.cdn.ankama.com/static-data/612/`, qui ne rend que les
fichiers de langue. Les images sont sur le disque, dans
`/Applications/Ankama/Retro/Dofus Retro.app/Contents/Resources/app/retroclient/` :
6865 icônes d'objets, 965 de sorts, les 12 classes en `clips/artworks/breeds/`,
150 têtes, 871 illustrations, 1117 sprites, et 26 bannières de chargement en
JPEG. Tout le reste est du Flash vectoriel, qui se convertirait en SVG.

**Cette piste est fermée.** Ankama ne tolère les gestionnaires de fenêtres qu'à
la condition écrite qu'ils n'interagissent jamais avec les fichiers du jeu, et
le [README](../README.md) cite ses deux messages. Ouvrir les `clips/` pour en
tirer des images est exactement ce que cette phrase interdit, et c'est la
tolérance qui fait vivre Multifus qu'on mettrait en jeu pour une icône.
L'inventaire dit ce qui existe, pas où puiser.

## Le relevé du site

`static.ankama.com` rend des JPEG, des PNG et des GIF sans compte ni jeton : les
logos, les planches d'icônes et les images des articles. Les 545 articles de
`www.dofus-retro.com` ont été lus, et rien d'autre : aucune page de Dofus 2 ni
de Dofus 3. Le site n'a rien avant 2020, et ce n'est pas un trou du relevé,
Dofus Retro ayant rouvert en 2019. Ce qui est plus ancien vit chez la
communauté, et deux sites ont été lus par leur plan de site, `dotrofus.com` et
`dofuspourlesnoobs.com`. Une image prise chez eux porte deux couches de droits,
le travail de l'auteur du site et le contenu d'Ankama dessous : il faut écrire
aux deux.

Le relevé est dans [images-ankama.txt](./images-ankama.txt), une section par
source. La galerie est [images-ankama.html](./images-ankama.html), à ouvrir dans
un navigateur : elle trie par taille, par poids et par date, filtre par format,
pose un damier derrière l'image pour juger la transparence, et n'affiche les
vignettes que par lots de 240.

## Les décors du dépôt

Ils vivent dans `apps/desktop/src/assets/ankama/`, et chaque fenêtre porte la
mention d'Ankama en bas.

| Fichier          | Source                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| `camp.webp`      | `www/modules/mmorpg/discover/assets/screens/`, recadré en 4:3                        |
| `village.webp`   | idem                                                                                 |
| `harbour.webp`   | idem                                                                                 |
| `forest.webp`    | idem                                                                                 |
| `pen.webp`       | idem                                                                                 |
| `arena.webp`     | `upload/backoffice/direct/2021-02-22/827fd3d5…png`                                   |
| `dolmen.webp`    | `upload/backoffice/direct/2026-06-24/d865ca61…png`, quatre menhirs et une dalle      |
| `workshop.webp`  | `upload/backoffice/direct/2023-03-21/04ba16cf…png`, l'enclume et les potions         |
| `battle.webp`    | `upload/backoffice/direct/2025-02-10/3620d31a…png`, braseros et ossements            |
| `wheel-loop.gif` | `upload/backoffice/direct/2022-07-26/f9dfcb77…gif`, une Crâ qui respire dans l'herbe |

`arena.webp` n'est plus un décor de map depuis que la roue a rejoint les
Personnages : la mise en route s'en sert pour l'étape de l'essai.
`wheel-loop.gif` est un bouche-trou, en attendant l'enregistrement de la roue à
l'œuvre : l'écraser suffit.

**Un décor a été écarté**, `2020-12-03/e01dbec5…png` : un montage de presse
KrosmoNote, cinq vignettes séparées par des traits blancs et filigranées. Chaque
vignette fait 635 × 360, soit un agrandissement de 2,4 pour remplir une fenêtre
de 1100. Un fond ne se prend pas dans un montage.

## Les deux messages d'Ankama

Ils vivent dans le même dossier que les décors et ne sont pas des décors : ce
sont deux captures de ce qu'Ankama a écrit en public sur les gestionnaires de
fenêtres, que l'écran À propos montre en entier.

| Fichier                | Source                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `tolerance-forum.webp` | le fil `12-suggestions-retours/2950-…` de `www.dofus-retro.com`, première réponse de l'équipe, 1ᵉʳ avril 2026 |
| `tolerance-post.webp`  | le message de `@DOFUSRetro_FR` sur X, 10 mars 2026                                                            |

Chacune est datée, située, et rouvre sa page chez Ankama par « Ouvrir la
source » : `apps/desktop/src-tauri/src/app/links.rs` tient les deux adresses.
Une capture montre l'auteur, la date et le fil, ce qu'un texte recopié ne prouve
pas, et c'est pour cela qu'elle est là plutôt qu'une citation de plus. Elle reste
une image d'Ankama et suit la discipline du dossier.

## Choisir un décor

Deux questions, dans cet ordre : **est-ce qu'il dit ce que la map fait**, et
**est-ce qu'un texte s'y lit**. La table est dans
`apps/desktop/src/constants/world.ts`, qui seule est vraie.

**Les décors sombres vont aux maps qui parlent le plus.** `battle` et `workshop`
sont les moins saturés, et ce sont AutoFocus, Tableau des runes et Paramètres
qui portent le plus de lignes. `camp`, le plus chargé, va là où il y a le moins
à lire.
