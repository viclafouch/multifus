# Le système graphique de Multifus

Ce document reste. Il dit d'où vient chaque couleur, chaque fonte, chaque
matière, et ce qui a été écarté. On le lit avant de dessiner un écran, et on
l'écrit quand une décision est prise, pour qu'aucune session ne reparte de zéro.

## La philosophie

Multifus sert à jouer à Dofus Retro. Il doit donc en avoir l'air, et pas l'air
d'un panneau de réglages qui parle du jeu de loin.

**Un écran est une scène, pas un formulaire.** On entre dans le Monde des Douze.
Le décor du jeu occupe l'écran entier, une plaque de bois posé dessus porte ce
qu'il y a à lire, et le tout arrive en séquence, comme un plan de film : un
carton de chapitre au milieu, puis le titre, puis le texte, puis le geste à
faire. Le joueur se laisse porter, il ne remplit pas une page.

**On emploie les mots du jeu.** Le percepteur, la team, la map, l'échange, le
défi, le craft. [CONTEXT.md](../CONTEXT.md) tient le vocabulaire de Multifus
lui-même ; le reste se prend dans le jeu, et se vérifie plutôt que de se
deviner. Les fichiers de langue officiels sont sur le CDN d'Ankama, sans préfixe
`lang_`, quand un mot fait douter.

**On ne parle jamais par métaphore quand il y a un geste à faire.** « Un combat,
un message privé : Multifus vous amène devant » ne dit pas au joueur quoi faire.
« Recevez un message privé ou entrez en combat : sa fenêtre passera devant toute
seule » le dit. Un corps de texte commence par un verbe.

## D'où vient le système

Deux sources, et rien d'autre. Chacune a été relevée, pas devinée.

**Le site officiel, `www.dofus-retro.com`.** Sa feuille de style est
`https://static.ankama.com/dofus-retro/www/modules/common/common.css`. Elle donne
les fontes, les couleurs d'action et la structure d'un panneau.

**Le client, dans le dépôt.** `apps/desktop/src/assets/dofus-options-general.png`
est une capture de la fenêtre Options du jeu. Elle donne la matière : le cadre
presque noir, le brun de la barre de titre, le kaki du panneau, la crème du
texte.

Quand les deux se contredisent, **le site tranche pour les couleurs d'action**,
**le client tranche pour la matière**. C'est la seule règle d'arbitrage, et elle
existe parce qu'on s'est trompé une fois : la fenêtre Options du client a des
boutons orange en pilule, et les avoir repris a fait dériver tout l'écran hors du
système. Sur le site, l'orange (`#f2801b`, `#ee5a12`) ne sert qu'à colorer un
titre de texte, jamais un bouton. Les boutons du site sont verts.

### Y retourner avant de dessiner

Le système n'est pas fini : il ne couvre que ce que la mise en route a demandé.
Dès qu'un écran a besoin d'une matière qui n'est pas dans les tables plus bas, on
retourne à la source plutôt que d'inventer. C'est ce qui garde le logiciel dans
l'univers du jeu au lieu de le faire glisser vers un thème générique.

La marche à suivre, et ses pièges, relevés le 5 septembre 2026 :

- **La feuille de style se prend en direct.** `curl` sur
  `https://static.ankama.com/dofus-retro/www/modules/common/common.css`.
  CloudFront refuse un Chrome sans interface sur `www.dofus-retro.com`, donc on
  n'ouvre pas le site avec un navigateur piloté
- **Elle est minifiée sur peu de lignes**, 1,5 Mo, et une expression régulière en
  Python s'y perd sans fin. `tr '}' '\n'` puis `grep` la lit en une seconde
- **On lit à la main, et on ne garde que des adresses.** L'article 13.5 des CGU
  d'Ankama qualifie le moissonnage automatisé de ses sites d'acte de
  contrefaçon. Le relevé sert à repérer, pas à ramasser
- **Le client donne ce que le site n'a pas.** Le site est une vitrine : il a des
  panneaux, des titres et des boutons, pas de champ de saisie, pas d'onglet, pas
  de curseur. La fenêtre Options du jeu les a tous, et c'est là qu'on va pour un
  écran de travail

## Les fontes

| Rôle                        | Fonte                      | Preuve                                                          |
| --------------------------- | -------------------------- | --------------------------------------------------------------- |
| Titres, boutons, étiquettes | `Bebas Neue`, en capitales | `bebas_neueregular` sur le site, posée 45 fois, graisse normale |
| Texte courant               | `Roboto`                   | `body{font-family:"Roboto"}` sur le site, 15 px                 |

Elles arrivent par `@fontsource/bebas-neue` et `@fontsource/roboto`, en 400, 500
et 700, importées dans `index.css`. Jamais par un CDN : la politique de sécurité
de Tauri n'autorise que `'self'` pour les polices.

Bebas Neue n'a pas de bas de casse. Tout ce qui la porte est en capitales, et le
français met ses accents sur les capitales.

**Ce que le joueur a écrit reste en Roboto**, dans sa casse à lui. Une réponse
rapide s'est affichée en Bebas capitales : le texte qui allait être collé dans le
jeu ne ressemblait plus à ce qu'on avait tapé, et une longue phrase devenait
illisible. Bebas est la fonte de Multifus, pas celle du joueur.

### Les corps, et il n'y en a qu'une échelle

Le jeton dit le corps, la classe de fonte dit la fonte. Tout est dans le
`@theme inline` de `retro.css`, et `theme.css` n'en porte plus un seul.

| Jeton     | Corps   | Fonte  | Ce qui le porte                                     |
| --------- | ------- | ------ | --------------------------------------------------- |
| `chapter` | 46 px   | Bebas  | le carton de chapitre                               |
| `sign`    | 28 à 34 | Bebas  | le titre d'une map, qui suit la hauteur             |
| `action`  | 23 px   | Bebas  | le grand bouton vert, taille `lead`                 |
| `bar`     | 20 px   | Bebas  | le titre d'une plaque                               |
| `way`     | 17 à 22 | Bebas  | le menu de l'accueil, qui suit la hauteur           |
| `deed`    | 17 px   | Bebas  | l'étiquette d'un bouton                             |
| `tale`    | 17 px   | Roboto | la phrase d'une map, et le titre d'une ligne        |
| `aside`   | 13 px   | Roboto | la seconde ligne, les indications                   |
| `legend`  | 13 px   | Bebas  | la petite étiquette gravée                          |
| `mark`    | 11 px   | Roboto | l'étiquette en capitales, la version, le crédit     |
| `log`     | 11 px   | mono   | le journal, les touches, ce qui vient de la machine |

Huit corps pour douze jetons : `tale` et `deed` partagent 17 px, `aside` et
`legend` 13, `mark` et `log` 11. Chaque paire vit dans deux fontes et deux
interlignes, jamais dans deux tailles voisines.

**Il y avait deux échelles.** `theme.css` en portait onze de plus, de 9,6 px à
34 px, dont quatre à moins d'un pixel les unes des autres : 11,5, 12,5, 13 et
13,5. Une plaque écrivait donc son titre en 13,5 et sa phrase en 11,5, quand la
map au-dessus parlait en 17. C'est ce que l'œil voyait sans savoir le nommer.
Elles sont mortes le même jour, et `--size-aside` et `--size-mark` sont descendus
dans le `:root` pour que les fenêtres satellites, qui écrivent du CSS à la main,
tirent la même échelle. Leur nom porte `size-` parce que `--mark` était déjà pris
par la couleur d'une pastille : un corps posé dessous aurait éteint tous les
points d'état, sans erreur nulle part.

## Les couleurs

Les valeurs vivent dans `apps/desktop/src/retro.css`, sous `:root`.

### La matière, prise sur la fenêtre Options du client

| Jeton         | Valeur    | Ce que c'est                                |
| ------------- | --------- | ------------------------------------------- |
| `--iron`      | `#241f19` | le cadre de la fenêtre du jeu, presque noir |
| `--slate`     | `#4b463c` | la barre de titre et les onglets            |
| `--band`      | `#978870` | le filet qui sépare                         |
| `--khaki`     | `#c7bfa1` | le fond du panneau, et notre texte courant  |
| `--khaki-lit` | `#d2ccac` | le panneau clair, l'onglet actif            |
| `--cream`     | `#f2ead6` | le texte fort, les titres                   |

### L'action et l'état, pris sur le site

| Jeton          | Valeur    | Preuve                                                      |
| -------------- | --------- | ----------------------------------------------------------- |
| `--leaf`       | `#248b2e` | `.ak-btn-discover{background:#248b2e}`                      |
| `--leaf-lit`   | `#289b33` | le vert des titres du site                                  |
| `--stone`      | `#b1ac9c` | le bord du bouton vert, `border:1px solid #b1ac9c`          |
| `--olive-deep` | `#848e02` | l'ombre du texte du bouton, `text-shadow:0 1px 1px #848e02` |
| `--flame`      | `#e4442c` | le rouge d'erreur du site                                   |
| `--night`      | `#021b08` | le fond du site, qui sert au voile sur les décors           |

Cinq valeurs ne viennent d'aucune des deux sources, et disent pourquoi :

| Jeton         | Valeur                  | Ce que c'est                                                                       |
| ------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `--leaf-glow` | `oklch(0.79 0.16 152)`  | le vert du connecté : `--leaf` éclairci, pour qu'une pastille brille sur du sombre |
| `--amber`     | `oklch(0.796 0.142 71)` | la part sans couleur de la roue, et rien d'autre                                   |
| `--gold`      | `oklch(0.84 0.155 88)`  | l'étoile du principal : `--amber` éclairci et tiré vers le jaune, et rien d'autre  |
| `--male`      | `oklch(0.66 0.13 212)`  | le sceau de Mars, un bleu de sarcelle                                              |
| `--female`    | `oklch(0.6 0.17 348)`   | le sceau de Vénus, un prune                                                        |

**Les deux sceaux gardent leur couleur, et c'est la seule exception au vert.** Un
sexe choisi est un état, donc il devrait s'allumer en vert comme le reste ; sauf
que les deux se choisissent côte à côte, et deux disques verts l'un contre
l'autre ne se distinguent plus. Le sceau allumé prend donc sa propre couleur,
l'éteint reste gris. `--sign` porte celle du moment, et `sigil-lit` la lit
partout : l'en-tête des Personnages, la fiche d'un personnage, la grille des
classes.

Le vert ne s'emploie que pour **l'action du moment** et pour **ce qui est en
place**. Il ne colore jamais un titre, ni un texte courant, ni un avancement :
un piquet d'étape franchi est clair, pas vert, sinon l'écran porte deux verts
qui ne disent pas la même chose.

## Ce qui est écarté, et pourquoi

Une piste écartée revient toujours si personne n'écrit pourquoi.

- **L'or et l'ambre.** Ils ne sont que dans le logo Dofus Retro, jamais dans le
  système. Une interface dorée ressemble à un jeu mobile, pas à Retro. `--amber`
  survit au seul endroit que `CONTEXT.md` nomme, la part sans couleur de la roue.
  `--gold` en est la seconde exception, et la dernière : l'étoile du personnage
  principal. Une distinction se lit en or partout depuis toujours, elle mesure
  18 px, et une pièce d'or posée sur un portrait ne dore pas un écran. Une étoile
  crème avait été essayée d'abord : sur un médaillon clair elle disparaissait, et
  rien ne disait qu'elle était allumée plutôt que blanche
- **Les icônes en trait**, celles de `lucide`. Le site n'en pose aucune et le
  jeu non plus. Un bouton y est du texte, en capitales, et rien d'autre. Il en
  reste dans les écrans que le monde n'a pas encore repris, et elles s'en iront
  avec eux
- **L'orange en bouton.** C'est celui du client, pas du site. Voir plus haut
- **Le panneau clair sur fond clair.** Un panneau `#f8f8f6` posé sur un décor de
  jeu écrase le décor. La plaque est sombre et laisse voir la carte derrière
- **Le plein texte sans matière.** Du blanc posé sur une photo n'est pas un
  design, c'est un sous-titre

## La matière

**La plaque** (`@utility plate`) est une fenêtre du jeu posée sur la carte. Coins
arrondis à 12 px, bord de 2 px en `--band`, fond dégradé de `--iron` à `--slate`
avec un tiers de transparence pour que le décor se devine, un filet clair en
haut, une ombre portée large. Elle ne touche jamais les bords de l'écran : le
décor reste visible tout autour, sinon la scène disparaît.

**Le fronton** (`@utility crest`) est un filet horizontal avec un losange vert au
milieu, sous le titre. Le losange est la case isométrique de Dofus.

**Les boutons** ont huit faces, et une seule est verte par écran :

| Variante | Emploi                                            |
| -------- | ------------------------------------------------- |
| `leaf`   | le geste du moment, un seul par écran             |
| `slate`  | tout le reste, y compris « Continuer »            |
| `bare`   | le cadre de la fenêtre, « Passer », et les icônes |
| `flame`  | ce qui détruit : « Tout effacer »                 |
| `glint`  | rien qu'un contenu : l'étoile du principal        |
| `ember`  | la croix qui retire, kaki au repos, flamme dessus |
| `token`  | la même croix posée sur un décor, en jeton rouge  |
| `way`    | un chemin qui part de la clairière, et lui seul   |

Ils sont en pilule, en Bebas capitales. La taille `lead` est réservée au bouton
vert.

Une action posée au bout d'une ligne porte le cadre `slate`, jamais `bare`. Sans
cadre, « Ouvrir Telegram Web » et « Aller voir » se lisaient comme la valeur de
la ligne, et personne ne cliquait. Le « Retour » d'une map le porte aussi, parce
qu'il se pose sur onze décors dont des clairs. `bare` ne sert plus qu'à ce qui
borde la fenêtre de la mise en route et aux icônes qui portent leur infobulle.

**Le menu de la clairière se vise comme une case du jeu.** Ses dix entrées sont
des chemins, et les survoler, c'est viser la case où l'on va poser le pied. Un
losange vert glisse depuis la gauche et se pose au début de l'entrée, et le nom
s'écarte pour lui laisser la place (`wayname`). C'est le seul endroit où le
survol raconte quelque chose, parce que c'est le seul écran dont tout le contenu
est un départ.

**C'est la seule exception à la règle du survol de `frontend.md`**, qui interdit
tout effet de survol qui n'existe pas déjà ailleurs. Elle a été levée pour cet
écran, et pour lui seul : ce qui bouge ici se déplace le long de la lecture, il
n'y a ni `scale` ni soulèvement, et aucun autre écran n'a le droit d'en faire
autant.

Le vert n'y colore ni un titre ni un état, mais l'action du moment, ce que la
règle du vert autorise déjà. Le cadre bordé de `bare` a disparu : à sa place, un
dégradé sombre qui s'éteint vers la droite, donc une ligne éclairée du côté du
losange plutôt qu'une ligne encadrée.

**Le losange du chemin est celui du fronton, dessiné deux fois.** Même carré de
7 px tourné à 45°, même `--leaf-lit`, mais celui du fronton porte un cerne sombre
qui le détache du filet, et celui du chemin une lueur verte qui le détache de la
planche. Deux `@utility` ne peuvent pas se partager un pseudo-élément, et un
troisième utilitaire pour une forme de deux déclarations coûterait plus qu'il ne
rendrait. Les trois mesures du chemin, la taille du losange, son écart du bord et
le pas du nom, sont des propriétés personnalisées déclarées ensemble en tête de
`btn-way` : elles doivent bouger ensemble.

Le pas du nom, 16 px, n'est pas la largeur du losange. Le losange tourné en
occupe dix, et les six qui restent sont l'air qu'il faut entre lui et la première
lettre.

**Une entrée ne s'enfonce pas au clic.** Toutes les faces portent
`active:translate-y-px`, le pixel de course d'un bouton qu'on presse. Ici il n'y
a ni cadre ni relief à enfoncer : seul le texte sautait d'un pixel, et ça se
lisait comme un défaut. La face `way` remet ce pixel à zéro elle-même, dans la
table des variantes et non chez l'appelant, pour que la prochaine entrée qui la
portera l'ait aussi.

**Une bande de lumière y a été essayée, et retirée.** Un éclat crème traversait
la ligne une fois, de gauche à droite, comme sur un panneau qu'on éclaire au
passage. Franc puis presque transparent, il se lisait dans les deux cas comme un
reflet sur une vitre : quelque chose qui glisse devant le texte au lieu
d'éclairer la planche. Deux mouvements suffisent à un survol.

Rien n'y coûte une mise en page : `transform` pour le losange et le nom,
`opacity` pour la planche. Une seule ligne s'anime à la fois.

**Deux boutons restent des `<button>` du navigateur**, la tête du dolmen et le
drapeau d'une langue, contre la règle de `frontend.md` qui veut un composant. Ce
n'est pas un oubli : chaque face de bouton porte un bord complet et une pilule en
Bebas capitales, et ces deux-là ont déjà leur matière, `head` et `ensign`, qui
pose son propre `border` et son propre `border-radius`. Les faire porter une face
rendrait le bord et le rayon au hasard de l'ordre d'émission des `@utility`, ce
que la note plus bas décrit. Ils prennent `sighted`, qui porte l'anneau de focus
de tout le logiciel, et rien d'autre du bouton.

**Une pastille posée sur une tête suit la tête.** Le dolmen rétrécit `--head` à
mesure que le roster grossit, de 66 px pour un personnage seul à 26 px pour une
foule. `--spacing-pebble` en tire la taille de l'étoile et de la croix, 42 % de
la tête, et `--spacing-nook` le point du cercle où la croix se pose, à 45° du
sommet : son centre tombe sur le bord, moitié dedans, moitié dehors. Rien de
posé sur une tête ne porte de taille en pixels.

**Le voile** (`@utility grove-shade`) est ce qui rend un décor de jeu lisible : un
ovale sombre au centre, un dégradé en haut et en bas, un vignettage de bord. Sans
lui, un texte blanc sur une prairie verte ne se lit pas.

**Le chemin d'un réglage** est du texte kaki, sans fond ni bord, ses segments
séparés par un `›` et le dernier en clair. Il a porté une plaque incrustée une
fois, et on l'a retirée : sur un écran où tout est posé sur du sombre, un
rectangle bordé se lit comme un bouton.

### Toutes les matières de `retro.css`

| Utilitaire                           | Ce que ça pose                                                       |
| ------------------------------------ | -------------------------------------------------------------------- |
| `grove`, `grove-shade`               | le fond du décor, et le voile qui le rend lisible                    |
| `drift`                              | la panoramique permanente et le fondu entre deux décors              |
| `plate`, `note`                      | le verre posé sur la carte, et le texte gravé dessus                 |
| `crest`                              | le fronton : un filet et le losange vert                             |
| `btn-leaf`, `btn-slate`, `btn-bare`  | les trois faces du bouton, chacune complète                          |
| `btn-flame`                          | la quatrième, celle qui détruit : « Tout effacer »                   |
| `btn-glint`, `btn-ember`             | le bouton sans face, et la croix qui retire une ligne                |
| `btn-token`                          | la même croix posée sur un décor : un jeton rouge plein              |
| `btn-way`, `wayname`                 | un chemin de la clairière : la planche, le losange, le nom qui cède  |
| `star`, `cross`                      | l'étoile du principal, et la croix qui retire, toutes deux dessinées |
| `tick`                               | la case à cocher du jeu, verte et cochée quand c'est en place        |
| `plaque`                             | un creux inscrit : les noms des personnages vus                      |
| `frame`                              | le cadre d'une capture ouverte en grand                              |
| `badge`, `pip`, `pip-live`           | l'état : la couleur du texte, et son point                           |
| `fenceline`, `rail`, `stake`, `knob` | la clôture des étapes : l'ombre, les lisses, le piquet               |
| `knob-lit`, `knob-here`              | la tête d'un piquet franchi, et celle de l'étape en cours            |
| `sonar-leaf`, `sonar-still`          | l'encre et l'arrêt de l'onde partagée avec l'ancien thème            |
| `limelight`                          | l'ombre portée qui décolle un titre du décor                         |
| `rule`                               | le filet du carton de chapitre                                       |
| `chapter`                            | le carton : il monte, tient, s'efface vers le haut                   |
| `unfurl`                             | la plaque qui se déplie                                              |
| `lift`, `lift-1` à `lift-5`          | ce qui monte, un cran toutes les 200 ms                              |
| `roll`                               | le générique, un poste toutes les 130 ms par `nth-child`             |
| `lift-chrome`                        | l'en-tête et le pied, qui arrivent tout de suite                     |
| `roam`                               | la panoramique du monde, et le fondu entre deux maps                 |
| `veil`, `deepen`                     | le voile de toute map, et le cran de plus d'une map de travail       |
| `settle`                             | ce qui monte à l'arrivée, quatre crans puis tout le reste            |
| `flank`                              | le dégradé qui assombrit le côté où l'on écrit                       |
| `hem`, `brow`                        | l'ourlet du bas sous le crédit, et celui du haut sous le retour      |
| `legible`                            | le halo sous une phrase posée à même le décor : une ellipse floutée  |
| `sighted`                            | l'anneau du clavier, le même sur tout ce qui se focalise             |
| `tint-*`, `stripe`                   | la couleur d'un personnage, et la pastille qui la porte              |
| `sigil`, `sign-male`, `sign-female`  | le sceau d'un sexe, gris éteint, bleu ou prune allumé                |
| `ensign`                             | un drapeau de langue, éteint tant qu'il n'est pas celui du moment    |
| `dolmen-field`                       | la boîte qui refait la géométrie du décor en `cover`                 |
| `dolmen-seat`                        | la place de la dalle, et `--head`, dont tout le reste se déduit      |
| `stage`                              | le cadre d'une boucle du jeu, au format 16/10                        |
| `emblem`                             | l'ombre portée qui décolle le logo du décor                          |
| `hearth`, `glade`                    | l'ombre sous les têtes, et la lueur d'herbe autour                   |
| `head`, `hood`                       | la tête de classe sur le dolmen, et sa pierre de survol              |

Chaque face de bouton porte son propre bord et ses propres transitions. Elles ne
partagent aucun utilitaire de base, parce que Tailwind v4 n'émet pas les
`@utility` dans l'ordre du fichier : deux utilitaires qui posent la même
propriété se battent, et c'est le hasard de l'ordre d'émission qui gagne.

### Les mots du système

| Nom              | Ce que c'est                                                                |
| ---------------- | --------------------------------------------------------------------------- |
| `ChapterCard`    | le carton de chapitre au milieu de l'écran                                  |
| `Scene`          | les six décors empilés, et celui qui est devant                             |
| `StepFence`      | la clôture d'enclos, un piquet par étape                                    |
| `StepState`      | le point et la phrase qui disent si l'étape est en place                    |
| `SettingPath`    | le chemin d'un réglage, `Options › Général › Divers`                        |
| `FeatureRoll`    | les fonctionnalités sur trois colonnes, leurs noms seuls ou avec leur ligne |
| `WorldScene`     | les onze décors empilés, le voile, et celui qui est devant                  |
| `Dolmen`         | la dalle du centre, les têtes dessus, le compte dessous                     |
| `Head`           | une tête de classe, sa couleur, et ce qu'elle dit au survol                 |
| `WayBack`        | le retour à la clairière, en haut à gauche de chaque map                    |
| `MapFrame`       | le cadre d'une map : le retour, et ce qui défile dessous                    |
| `Screen`         | une map qui est une liste : titre, fronton, une phrase, les plaques         |
| `KeyStone`       | une combinaison de touches, gravée                                          |
| `WayList`        | la colonne des dix maps, sur l'accueil                                      |
| `LoopStage`      | la boucle du jeu, ou ce qu'elle montrera tant qu'elle manque                |
| `StageScreen`    | une map qui montre le jeu : la boucle, et les réglages à côté               |
| `Tick`           | la case à cocher, seule forme d'un réglage qui s'allume                     |
| `MainMark`       | l'étoile d'or du principal, la même partout                                 |
| `SceneCredit`    | la mention d'Ankama, en bas de chaque fenêtre                               |
| `ClearingScreen` | l'accueil : le titre, le menu, le dolmen                                    |
| `Cartouche`      | le coin haut droit : la version, et les trois drapeaux                      |
| `Flag`           | un drapeau, dessiné en SVG, jamais un émoji ni une image                    |
| `Tale`           | la phrase d'un titre, et le halo qui la décolle du décor                    |
| `MapHeader`      | le titre, le fronton et la phrase, partagés par les deux sortes d'écran     |

## Les règles qui tranchent

Elles viennent toutes d'un essai raté, et elles se tiennent.

1. **Un seul bouton vert par écran**, et il désigne le geste du moment, jamais
   l'avancement. « Continuer » vert alors que rien n'est fait dit au joueur de
   sauter l'étape
2. **Ce qui n'est pas cliquable ne porte ni fond ni bord.** Un chemin de réglage
   est du texte, un état est un point de couleur suivi d'une phrase. Quatre
   boîtes empilées dont deux sont mortes, et on ne sait plus où cliquer
3. **Le décor ne s'arrête jamais de bouger.** Si la panoramique ne tourne que sur
   l'image affichée, la sortante se recale d'un coup au changement et l'image
   saute. Tout tourne, tout le temps, et changer d'étape n'est plus qu'une
   opacité
4. **Rien n'est monté ni démonté au fil d'une animation.** Tout est là dès la
   première image, seules l'opacité et la translation bougent. Un joueur pressé
   clique sans attendre, un lecteur d'écran lit tout, et un test trouve chaque
   bouton à la milliseconde zéro
5. **Une translation d'entrée se fait dans un conteneur qui coupe.** Sinon elle
   agrandit la zone défilable du parent, et la barre de défilement apparaît une
   demi-seconde à chaque étape. La plaque porte `overflow: clip` pour ça
6. **Les délais s'annulent sous `prefers-reduced-motion`**, pas seulement les
   durées. Un délai de deux secondes qui survit, c'est deux secondes d'écran vide
7. **Un écran se resserre sous 640 px de haut.** La fenêtre descend jusqu'à
   720 × 520, et à cette taille le générique ne tient pas. La variante `short`
   d'`index.css` répond : le titre passe au corps d'un bouton, le fronton
   s'efface, les phrases du générique s'effacent et il ne reste que les noms.
   Rien ne disparaît qui porte une action
8. **Un écran garde une marge de hauteur.** Bebas et Roboto arrivent en
   `font-display: swap` ; le temps qu'elles chargent, la fonte de secours a
   d'autres mesures et la page grandit de quelques pixels. Un écran au ras de la
   fenêtre montre alors une barre de défilement une fraction de seconde. Rien
   dans le code ne le mesure : c'est un essai à mener à la main, en relevant
   `scrollHeight - clientHeight` toutes les 16 ms pendant toute l'animation, sur
   chaque étape et à la taille minimale de la fenêtre. Il doit rendre zéro
9. **Une map occupe toute la fenêtre, et le reste flotte au-dessus.** Le retour,
   le crédit du décor et le journal sont posés en absolu ou en fixe, hors du
   flux. Tant qu'ils prenaient une part de la colonne, ce qui défilait se coupait
   net sous le retour, et ouvrir le journal levait la scène entière : les
   personnages quittaient leur dalle. Trois conséquences qui se tiennent : la
   dalle se place par rapport à la fenêtre et non par rapport à ce qui reste ; le
   décor descend jusqu'au bas de l'écran, ourlet compris ; et le bas de la
   colonne garde la hauteur du journal en creux, pour que rien ne finisse dessous
10. **Ce qui assombrit est local, et le moins possible.** `flank` sur le côté du
    menu, `legible` derrière une phrase, `hem` en bas de l'écran. Deux voiles
    couvrent bien tout l'écran, `veil` sur chaque map et `deepen` sur les maps de
    travail, mais ils sont doux et chiffrés pour cela : `deepen` est descendu de
    48 % à 32 % d'`iron` le jour où `legible` est arrivé, puis à 20 % le jour où
    `legible` a cessé de couper. Chaque fois, la même raison : le décor s'était
    éteint pour un texte qui savait déjà se défendre. Un voile qui cache le décor
    coûte plus qu'il ne rapporte, c'est le décor qui dit où on est
11. **La plaque est du verre teinté d'`iron`, et le texte est gravé.** Elle laisse
    voir le décor à 28 % en son milieu, sans aucun flou : sur le port, on suit
    le bateau derrière la liste ; au camp de Bonta, la foule passe sous les
    pseudos. Ce qui tient le texte lisible n'est pas l'opacité seule, c'est
    `--engrave`, une ombre portée d'un pixel à 65 % de noir posée sur toute la
    plaque. Un champ de saisie en est exclu : ce que le joueur tape ne se grave
    pas. Trois essais écartés en chemin. Le flou, qui rendait un gris de
    plastique et effaçait le décor qu'on voulait voir. L'opacité seule, qui
    demandait un panneau fermé. Et surtout **le `slate` au ventre de la
    plaque** : c'était lui, le gris. Mesure faite sur le 1 % le plus clair de
    chacun des onze décors, voile non compté, le kaki de 13 px tombait à
    **2,8:1** derrière du `slate` à 68 %, et il fallait 94 % pour atteindre les
    4,5:1 que demande `frontend.md`. Le même alpha en `iron` donne **4,6:1** au
    pire décor et 7,1:1 pour la crème de 17 px, à transparence égale. La
    couleur du voile décide du contraste, l'alpha décide de ce qu'on voit
    derrière : ce sont deux réglages, et on ne paie pas l'un avec l'autre.
    L'ombrage de la plaque se fait donc en variant l'alpha, 24 % en haut, 28 %
    au milieu, 22 % en bas, jamais en changeant de couleur. `saturate(1.15)`
    reste, il rend au décor la couleur que le sombre lui prend. La note et la
    scène d'une boucle sont la même matière. La mesure se refait avec un canvas
    dans la page, en compositant `deepen` puis la plaque sur le pixel le plus
    clair du décor : rien dans les tests ne la garde, parce qu'un test qui
    fige un dégradé fige un choix qu'on règle à l'œil
12. **Ce qui flotte a sa bande.** Le retour, le cartouche et le crédit sont hors
    du flux, et ce qui défile passe dessous : sans rien entre les deux, une case
    à cocher venait se poser contre les drapeaux, et une ligne de réglage
    traversait le crédit. `brow` en haut et `hem` en bas éteignent le décor sous
    eux. Le texte qui glisse dessous s'efface au lieu de se cogner. Deux suites :
    ce qui vit dans la bande passe au-dessus d'elle, la ligne d'écoute de
    l'accueil comme le retour et le cartouche ; et un écran commence sous elle,
    à 80 px, pour qu'aucun titre ne naisse dans le sombre
13. **Le titre d'une map se pose toujours au même endroit**, quelle que soit la
    hauteur de ce qu'il annonce. L'écran était centré : une map à deux réglages
    posait son titre cent pixels plus bas qu'une map à huit, et passer de l'une à
    l'autre faisait sauter le titre. Il est en haut, à une distance fixe, et
    c'est le bas qui reste vide quand il y a peu à dire
14. **Un halo se floute, il ne se dégrade pas.** `legible` était un dégradé radial
    peint dans la boîte de la phrase : la boîte coupe le fond, et le dégradé
    n'avait pas fini de s'éteindre au bord. On voyait le rectangle. C'est
    maintenant une ellipse pleine, posée derrière la phrase et floutée de 26 px :
    le flou déborde de sa boîte, il n'a aucun bord à couper, et il s'éteint sans
    marche. Rien à installer pour ça, `filter: blur` suffit

## Le rythme

Les temps sont dans `retro.css`. Une scène se joue en quatre secondes, et rien
n'empêche de cliquer avant.

| Temps         | Ce qui arrive                                    |
| ------------- | ------------------------------------------------ |
| 0,25 s        | le carton de chapitre monte                      |
| 0,25 à 2,15 s | il tient, le temps de le lire                    |
| 2,15 s        | la plaque se déplie                              |
| 2,50 s        | le titre, puis un élément toutes les 200 ms      |
| 3,00 s        | le générique, un poste toutes les 130 ms         |
| en continu    | la panoramique du décor, un aller-retour de 62 s |

Il y a cinq crans, `lift-1` à `lift-5`, et pas un de plus que ce que l'écran
pose : une échelle avec un barreau mort finit par se remplir n'importe comment.

## Le wording

Le français est la source, Lingui porte le reste, et
[.claude/rules/code-style.md](../.claude/rules/code-style.md) tient les règles de
`t` et de `msg`. Ce qui suit est la voix.

- **Un titre nomme le réglage comme le système l'écrit**, parce qu'on cherche une
  ligne dans une liste. Il est partagé avec l'écran des Paramètres et ne bouge
  pas à la légère
- **Un corps commence par un verbe** et tient entre 120 et 160 signes, pour que
  les pages aient le même poids. L'écran de fin fait exception, une phrase et
  rien de plus : ce sont les neuf fonctionnalités qui portent l'écran, et un
  corps long les pousse hors de la fenêtre
- **On parle à quelqu'un qui joue depuis longtemps.** « Votre percepteur se fait
  taper à l'autre bout du monde et vous ne l'apprenez qu'en rentrant » dit la
  même chose que « les notifications sont retenues », en mieux
- **Un mot que le joueur va lire sur son propre écran passe entre guillemets**,
  par `quoted`, et se prend dans `systemWords`

## Où le système vit

| Fichier                                  | Ce qu'il tient                                          |
| ---------------------------------------- | ------------------------------------------------------- |
| `apps/desktop/src/retro.css`             | tout le système : jetons, matière, rythme               |
| `apps/desktop/src/theme.css`             | le pont vers shadcn, et pas une couleur à lui           |
| `apps/desktop/src/index.css`             | le fonds neutre, et les douze couleurs du domaine       |
| `apps/desktop/src/components/retro/`     | les composants de la mise en route                      |
| `apps/desktop/src/components/world/`     | les composants du monde : le dolmen, les têtes, le menu |
| `apps/desktop/src/constants/world.ts`    | les maps, leurs noms et leurs décors                    |
| `apps/desktop/src/constants/features.ts` | les fonctionnalités que le générique montre             |
| `apps/desktop/src/helpers/onboarding.ts` | les phrases de la mise en route, et `leadOf`            |
| `apps/desktop/src/assets/ankama/`        | les décors, qui appartiennent à Ankama                  |

Le fonds neutre d'`index.css` ne porte toujours aucune couleur d'interface :
`grain` pour le grain de l'image, `selectable` pour un texte qu'on veut pouvoir
copier, `sonar` pour l'onde d'écoute dont l'encre se donne par `--sonar-ink`, et
les douze `tint-*` du domaine.

## Le monde, et la fin des deux thèmes

Livré le 5 septembre 2026. Le système ne couvre plus la seule mise en route : il
couvre tout Multifus. Le détail du monde est dans
[docs/plan-monde.md](./plan-monde.md) ; ce qui suit est ce qui devient une règle.

**Il n'y a plus deux thèmes.** `theme.css` est le pont vers les composants
shadcn, et chacun de ses jetons de couleur pointe sur un jeton de `retro.css`.
Ce qui lui reste en propre part avec les fenêtres satellites, qui sont dans « Ce
qui reste » du plan du monde : les fonds du disque de la roue (`wheel-disc`,
`wheel-hub`, `wheel-face`), le nom et la tête d'une part, la pastille de couleur
d'un dialogue, et une quinzaine d'espacements. `--background` est `--iron`,
`--foreground` est `--cream`, `--primary` est `--leaf-lit`, `--font-sans` est
Roboto. Fraunces et Inter ont quitté le dépôt, `--font-display` et
`--font-heading` aussi : un composant qui veut la fonte gravée écrit
`font-carve`, comme le reste du logiciel. Repeindre un écran ne demande
donc plus de le réécrire : il arrive dans le système par ses jetons, et on ne le
réécrit que pour sa forme.

`theme.css` dépend maintenant du `:root` de `retro.css`. **Toute entrée qui
importe l'un importe l'autre**, `banner.css`, `wheel.css` et `rune-table.css`
comprises.

**Les douze couleurs des personnages vivent dans `retro.css`**, avec les
`tint-*` et la pastille `stripe`. Elles ont passé une journée dans `index.css`,
au motif qu'elles appartiennent au domaine et non au monde, et c'était une
faute : `index.css` n'est chargé que par la fenêtre principale. La bannière
peignait donc sa pastille sans couleur et la roue rendait ses onze parts en
ambre, sans qu'aucun test ne le voie, puisqu'ils lisaient les trois feuilles
collées bout à bout. **Ce qu'une fenêtre satellite peint doit être déclaré dans
une feuille qu'elle importe**, et il n'y en a que deux, `theme.css` et
`retro.css`.

**Deux verts, et c'est voulu.** `--leaf` est l'action, `--leaf-glow` est le vert
du connecté : le même vert, plus clair, parce qu'une pastille d'état doit briller
sur du sombre. `colors.test.ts` mesure que les douze couleurs s'en éloignent.

**L'ambre survit à deux endroits.** `--amber` est la part sans couleur de la
roue, que `CONTEXT.md` nomme, donc elle existe. `--gold`, qui en descend, est
l'étoile du personnage principal, et c'est tout : ni l'un ni l'autre n'entre dans
un bouton, un titre ou un fond.

### Les trois questions, tranchées

1. **Les icônes.** La barre de gauche qui en portait une par ligne n'existe plus.
   Une route se nomme en capitales Bebas, comme sur le site. `lucide` reste dans
   ce qui n'est pas encore repris, ligne par ligne, et s'en ira avec
2. **Le décor.** Une image d'Ankama au fond de chaque map. Elle est voilée d'un
   cran de plus sur une map de travail que sur la clairière : on vient y lire des
   chiffres. Le crédit reste en bas, sur chaque map
3. **Par quel écran commencer.** Par aucun des dix : par la clairière, qui
   n'existait pas

### Ce qui ne passe pas de la mise en route

- **La chorégraphie de quatre secondes.** `unfurl`, `lift-1` à `lift-5` et
  `chapter` sont faits pour une scène qu'on traverse une fois. La règle qui en
  sort : **une animation qui fait attendre ne se pose que là où on ne passe
  qu'une fois**. On a essayé de la contourner en rejouant le chargement de carte
  du client entre deux maps, 1150 ms de noir plein : beau une fois, pesant à la
  dixième. Retiré. Une map s'ouvre maintenant en 800 ms, sans rien bloquer
- **Le carton de chapitre.** Il annonce une étape dans un enchaînement. Une map
  ouverte depuis la clairière n'a rien à annoncer
- **La clôture des étapes.** `StepFence`, `stake` et `knob` ne disent qu'un
  avancement, et il n'y en a plus hors de la mise en route

### La case et le bouton, pris sur la fenêtre Options

Livré le 5 septembre 2026, après le monde, et **c'est la matière qui change les
dix maps d'un coup, pas les dix maps qui changent une matière**. Deux gestes ont
suffi :

- **`Tick`** remplace l'interrupteur shadcn partout : la case carrée du client,
  bord `--iron` de 2 points, face crème creusée, coche dessinée en bordures
  tournées à 42°. Cochée, elle passe au vert, parce que le vert dit ce qui est en
  place. Elle garde le rôle ARIA `switch` du composant qu'elle remplace : un
  réglage qui s'allume n'est pas un formulaire à valider
- **Le bouton shadcn est supprimé.** Il n'y a plus que
  `components/retro/button.tsx`, avec une face de plus, `btn-flame`, pour ce qui
  détruit

Et la règle des icônes est appliquée là où elle se voyait le plus : `IconTile`
supprimé, `FieldRow` sans prop `icon`, aucun glyphe dans un bouton qui porte un
mot. Ce qui reste de `lucide` est un glyphe seul, sans mot à côté.

### Ce qui manque encore

Le champ de saisie, la zone de texte, la liste déroulante, le curseur, le
tableau. Ils tournent aujourd'hui sur les composants shadcn repeints par les
jetons, ce qui les met dans la bonne palette sans leur donner la bonne matière.
Chacun se prend sur la fenêtre Options du client,
`apps/desktop/src/assets/dofus-options-general.png`, quand la map qui en a besoin
est reprise. **On n'écrit pas une matière avant l'écran qui l'emploie** : une
`@utility` sans appelant est une abstraction pour plus tard, et le dépôt les
refuse.

## Les images

Elles appartiennent à Ankama. La [licence](../LICENSE) exclut du MIT les trois
dossiers qui en portent, et chaque écran qui en montre une le dit à l'écran.
[docs/plan-design.md](./plan-design.md) tient le relevé et le détail des droits.
