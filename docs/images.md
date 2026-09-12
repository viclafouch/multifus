# Les images d'Ankama, et les droits

Presque chaque image du dépôt vient d'Ankama. Ce document dit d'où, à quelle
condition, et pourquoi certaines pistes sont fermées. Le système graphique, lui,
est dans [design-system.md](./design-system.md).

La seule exception est le logo, `packages/retro/src/assets/logo.png`, que la
clairière, l'écran À propos et la barre du site lisent tous les trois. Il ne
porte rien d'Ankama, et c'est pour cette raison qu'il n'entre pas dans
`packages/ankama`, que la licence exclut du MIT. Celui qui est là est encore
celui du scaffolder Tauri, et [logo.md](./logo.md) dessine son remplaçant.

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
qu'elles vivent toutes dans `packages/ankama`, qu'un `git rm -r` retire d'un
coup, et que la [licence](../LICENSE) exclut du MIT. Toute image gardée suit
cette discipline, le logiciel et le site puisant au même dossier.

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

Ils vivent dans `packages/ankama/images/`, les boucles dans
`packages/ankama/loops/`, et chaque fenêtre porte la mention d'Ankama en bas.

| Fichier                  | Source                                                                          |
| ------------------------ | ------------------------------------------------------------------------------- |
| `camp.webp`              | `www/modules/mmorpg/discover/assets/screens/`, recadré en 4:3                   |
| `village.webp`           | idem                                                                            |
| `harbour.webp`           | idem                                                                            |
| `forest.webp`            | idem                                                                            |
| `pen.webp`               | idem                                                                            |
| `arena.webp`             | `upload/backoffice/direct/2021-02-22/827fd3d5…png`                              |
| `dolmen.webp`            | `upload/backoffice/direct/2026-06-24/d865ca61…png`, quatre menhirs et une dalle |
| `workshop.webp`          | `upload/backoffice/direct/2023-03-21/04ba16cf…png`, l'enclume et les potions    |
| `battle.webp`            | `upload/backoffice/direct/2025-02-10/3620d31a…png`, braseros et ossements       |
| `wheel-loop.mp4`         | une capture du jeu faite ici, H.264 muet                                        |
| `walk-loop.mp4`          | idem                                                                            |
| `auto-focus-loop.mp4`    | idem                                                                            |
| `rune-table-loop.mp4`    | idem                                                                            |
| `relay-loop.mp4`         | `auto-focus-loop.mp4` réencodé, doublure à retourner                            |
| `quick-replies-loop.mp4` | `walk-loop.mp4` réencodé, doublure à retourner                                  |
| `home-loop.mp4`          | `wheel-loop.mp4` réencodé, doublure du montage de l'accueil                     |
| `*-loop-poster.webp`     | une image de la boucle qui la porte, tirée à `ffmpeg` et pesée à `cwebp`        |

## Les portraits de classe

`packages/ankama/portraits/` tient les douze classes, deux sexes, en `.png`, et
`packages/ankama/icons/` les mêmes en `.ico`, que Rust pose sur la fenêtre du
jeu. Ils viennent des visuels de classe publiés par Ankama sur son site, relevés
à la main comme les décors, et ils suivent la même discipline que le reste du
dossier. Ce sont eux que porte une tête de la roue des personnages.

Leur origine n'était écrite nulle part avant le 11 septembre 2026, ni ici, ni
dans le relevé, ni dans un message de commit : quarante-huit fichiers, les plus
visibles du logiciel, sans provenance. Ce fichier la porte depuis, et une image
dont on ne sait plus d'où elle vient n'entre plus dans le dépôt. Le site avait
une page qui publiait cette table, `/images` ; elle a été supprimée le
12 septembre 2026, et la protection tient sans elle : la licence exclut le
dossier, et le pied de page crédite Ankama sur chaque page.

La fenêtre Options du client, `dofus-options-general.png`, vit dans le même
dossier et n'est pas un décor : c'est la capture d'où
[design-system.md](./design-system.md) tire la matière, et la mise en route la
montre pour dire où cocher.

`arena.webp` n'est plus un décor de map depuis que la roue a rejoint les
Personnages : la mise en route s'en sert pour l'étape de l'essai.
Les vidéos passent par le skill `make-loop`, qui les rend au format et à la
largeur de la plaque.

**Trois boucles sont des doublures, et le dépôt les porte quand même.** Une
fonctionnalité vaut une vidéo, donc les six du menu en ont une et l'accueil
aussi ; trois n'étaient pas tournées, et une capture déjà là tient la place le
temps qu'elles le soient. Elles ne posent pas de question de droits, mais elles
montrent autre chose que ce que leur page raconte : c'est écrit dans
[plan.md](./plan.md), avec ce qu'il reste à tourner.

**Une doublure se réencode, elle ne se copie pas.** Un fichier copié octet pour
octet a la même empreinte que son original, donc Vite n'en livre qu'un, et les
deux pages qui le montrent déclarent à Google la même vidéo sous la même adresse.
C'est le dédoublement qu'un `VideoObject` par page existe pour éviter. Chaque
doublure est donc passée par `ffmpeg -crf 26`, et son affiche est tirée sur une
autre seconde que celle de sa source : sept pages, sept adresses, et six
vignettes qui ne se ressemblent pas sur l'accueil.

**Une affiche n'est pas la première image de sa boucle.** Elle se choisit à
l'œil, sur la seconde où la fonctionnalité est visible : le tableau des runes
n'est posé qu'au milieu de sa boucle, et l'image du début ne montre que la
forgemagie. Elle sert deux fois, d'affiche au lecteur tant que la vidéo n'a pas
démarré, et de vignette à Google, qui refuse un `VideoObject` sans
`thumbnailUrl`. Sans elle, la plaque reste noire pour qui a demandé moins
d'animations, puisque la vidéo ne part alors pas toute seule.

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
**est-ce qu'un texte s'y lit**. Il y a deux tables, et chacune est vraie chez
elle : `apps/desktop/src/constants/world.ts` donne le décor d'une map du
logiciel, `apps/website/src/constants/decors.ts` celui d'une page du site. Cinq
pages reprennent le décor de la map dont elles parlent, et les autres choisissent
librement.

**Les décors sombres vont aux maps qui parlent le plus.** `battle` et `workshop`
sont les moins saturés, et ce sont AutoFocus, Tableau des runes et Paramètres
qui portent le plus de lignes. `camp`, le plus chargé, va là où il y a le moins
à lire.
