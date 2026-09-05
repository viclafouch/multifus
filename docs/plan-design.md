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
fonte, chaque matière, et ce qui a été écarté. Ce plan ne le répète pas.

## La prise en main est une scène, pas un tutoriel

Pas de fenêtre posée sur une image : l'image est l'écran. Une étape, un décor du
jeu en plein cadre, et le texte dessus. On enchaîne comme un film.

Chaque étape s'ouvre sur un carton de chapitre au milieu de l'écran, « ÉTAPE 2
SUR 6 » et le nom de l'étape entre deux filets. Il tient deux secondes et demie,
le temps de le lire, s'efface vers le haut, et le texte arrive alors dans
l'ordre : le titre, le corps, le chemin du réglage, le contrôle, les boutons, à
200 ms d'écart. Tout est posé à quatre secondes.

Le décor ne s'arrête jamais de bouger : un aller-retour de soixante-deux
secondes,
qui tourne sur les six images en même temps. C'est ce qui règle un défaut vu à
l'essai : quand la panoramique ne tournait que sur l'image de l'étape en cours,
la sortante se recalait d'un coup au moment du changement, et l'image sautait.
Rien ne s'arrête, donc plus rien ne saute, et le passage d'une étape à l'autre
n'est plus qu'une opacité.

Les six décors sont dans `apps/desktop/src/assets/ankama/`, un par étape, et
chacun raconte son étape :

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
608 ko à eux six, en WebP. Ils portent le logo Dofus Retro d'Ankama incrusté, et
la mention de droits est répétée sous la clôture. La [licence](../LICENSE) exclut
le dossier du MIT.

Ce qui tient tout ça est du CSS, pas une bibliothèque. Rien n'est monté ni
démonté au fil de l'animation : tout est là dès la première image, seules
l'opacité et la translation bougent. Un joueur pressé clique sans attendre la
fin, un lecteur d'écran lit tout tout de suite, et les tests trouvent chaque
bouton à la milliseconde zéro. Une bibliothèque d'animation n'aurait rien ajouté
à ça et aurait demandé de démonter des éléments, ce qui casse les deux.

Les délais sont dans `retro.css`, `lift-1` à `lift-5` et `chapter`. Le bloc
`prefers-reduced-motion` de `index.css` remet maintenant les délais à zéro en
plus des durées : sans ça, un joueur qui coupe les animations aurait attendu
deux secondes devant un écran vide.

- `apps/desktop/src/retro.css` : le système, tout entier. Importé après
  `theme.css`, et aucun jeton de couleur ni aucune matière ne se croise avec
  l'ancien
- `apps/desktop/src/components/retro/` : le `Button` à trois faces, la `Scene` et
  son fondu enchaîné, la `ChapterCard` du carton, la `StepFence` des étapes, le
  `StepState` du contrôle, le `SettingPath` du chemin, le `FeatureRoll` du
  générique

Les étapes sont une clôture d'enclos en bas de l'écran, un piquet par étape, la
tête claire quand l'étape est passée. Elle n'est pas verte : le vert dirait le
geste du moment, et un piquet ne dit que l'avancement.

## Un seul bouton vert par écran

L'écran d'essai en montrait quatre à la fois, et deux n'étaient même pas
cliquables : le chemin du réglage et l'état du contrôle portaient un fond et un
bord, donc ils avaient l'air de boutons. Trois règles en sortent.

- **Ce qui n'est pas cliquable ne porte pas de boîte.** Le chemin est du texte
  kaki, sans fond ni bord, l'état est un point de couleur suivi d'une phrase. Il
  ne reste de fond que sous les vrais boutons
- **Le vert désigne le geste du moment, jamais l'avancement.** `leadOf` dans
  `helpers/onboarding.ts` le choisit, et rend le geste avec ce qu'il faut pour
  l'accomplir : autoriser si l'étape est l'autorisation, ouvrir la page du
  système s'il y en a une, montrer la capture du jeu s'il y en a une, avancer si
  le contrôle est bon, et rien du tout sur l'essai tant que le jeu n'a pas
  appelé, parce que là il n'y a rien à cliquer, il faut aller jouer. Avant,
  « Continuer » était vert même sans rien avoir fait : l'écran disait de sauter
  l'étape
- **Le reste passe en second**, en dessous, plus petit et sans couleur, y
  compris « Continuer »

## Le wording

Une étape dit ce que le joueur y gagne, et [CONTEXT.md](../CONTEXT.md) le
demandait déjà. Le titre nomme le réglage comme le système l'écrit, il n'a pas
bougé et il sert aussi l'écran des Paramètres. Le corps, lui, est neuf.

Il dit ce qu'il faut faire, pas ce que ça évoque. « Un combat, un message privé :
Multifus vous amène devant » ne dit pas au joueur ce qu'il doit faire ; « Recevez
un message privé ou entrez en combat : sa fenêtre passera devant toute seule »
le dit. Chaque corps commence par un verbe et tient entre 120 et 160 signes, pour
que les six pages aient le même poids.

## Le film montre tout Multifus

La prise en main ne vend pas que l'AutoFocus : quelqu'un qui la finit doit savoir
tout ce qu'il vient d'installer. Les fonctionnalités sont dans
`constants/features.ts`, une table de neuf, et elles se montrent deux fois :

- **À la bienvenue**, leurs noms seuls, sur trois colonnes qui s'écrivent l'une
  après l'autre
- **À la fin**, une fois l'essai réussi, le générique : les neuf sur trois
  colonnes, chacune avec sa phrase, et l'écran s'élargit pour les tenir

Trois colonnes et pas deux, parce que deux débordaient de la fenêtre. Sous 640 px
de haut, la variante `short` retire les phrases et ne garde que les noms : le
relevé de `scrollHeight - clientHeight` rend zéro sur les six étapes, à 880 × 660
comme à la taille minimale de 720 × 520.

Huit des neuf portent le nom d'un écran de la barre de gauche, et
`constants/features.test.ts` refuse qu'un écran ouvrable manque au générique :
ajouter une fonctionnalité sans l'annoncer casse le test.

La cascade est l'utilitaire `roll` de `retro.css`, qui donne son délai à chaque
enfant par `nth-child`. C'est du CSS parce qu'un style en ligne est interdit ici
et qu'une valeur arbitraire dans un composant l'est aussi.

## Ce que le système a ajouté au dépôt

Deux paquets, tous deux dans `apps/desktop` : `@fontsource/bebas-neue` pour les
titres et les boutons, `@fontsource/roboto` pour le texte courant, en 400, 500 et 700. Ils sont importés dans `index.css`, avant `theme.css` et `retro.css`.
[docs/design-system.md](./design-system.md) dit pourquoi ce sont celles-là, et
pourquoi elles ne viennent pas d'un CDN.

## Ce qui reste à décider

- Quelles images Victor garde, dans la galerie
- Les autres écrans, un par un, sur le même système
- Le logo
