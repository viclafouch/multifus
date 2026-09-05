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

Le vert ne s'emploie que pour **l'action du moment** et pour **ce qui est en
place**. Il ne colore jamais un titre, ni un texte courant, ni un avancement :
un piquet d'étape franchi est clair, pas vert, sinon l'écran porte deux verts
qui ne disent pas la même chose.

## Ce qui est écarté, et pourquoi

Une piste écartée revient toujours si personne n'écrit pourquoi.

- **L'or et l'ambre.** Ils ne sont que dans le logo Dofus Retro, jamais dans le
  système. Une interface dorée ressemble à un jeu mobile, pas à Retro
- **Les icônes en trait**, celles de `lucide`. Le site n'en pose aucune et le
  jeu non plus. Un bouton y est du texte, en capitales, et rien d'autre. Elles
  restent employées dans le reste de Multifus, qui a son propre thème
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

**Les boutons** ont trois formes, et une seule est verte par écran :

| Variante | Emploi                                           |
| -------- | ------------------------------------------------ |
| `leaf`   | le geste du moment, un seul par écran            |
| `slate`  | tout le reste, y compris « Continuer »           |
| `bare`   | le cadre de la fenêtre, « Retour » et « Passer » |

Ils sont en pilule, en Bebas capitales. La taille `lead` est réservée au bouton
vert.

**Le voile** (`@utility grove-shade`) est ce qui rend un décor de jeu lisible : un
ovale sombre au centre, un dégradé en haut et en bas, un vignettage de bord. Sans
lui, un texte blanc sur une prairie verte ne se lit pas.

**Le chemin d'un réglage** est du texte kaki, sans fond ni bord, ses segments
séparés par un `›` et le dernier en clair. Il a porté une plaque incrustée une
fois, et on l'a retirée : sur un écran où tout est posé sur du sombre, un
rectangle bordé se lit comme un bouton.

### Toutes les matières de `retro.css`

| Utilitaire                           | Ce que ça pose                                            |
| ------------------------------------ | --------------------------------------------------------- |
| `grove`, `grove-shade`               | le fond du décor, et le voile qui le rend lisible         |
| `drift`                              | la panoramique permanente et le fondu entre deux décors   |
| `plate`                              | la fenêtre du jeu posée sur la carte                      |
| `crest`                              | le fronton : un filet et le losange vert                  |
| `btn-leaf`, `btn-slate`, `btn-bare`  | les trois faces du bouton, chacune complète               |
| `plaque`                             | un creux inscrit : les noms des personnages vus           |
| `frame`                              | le cadre d'une capture ouverte en grand                   |
| `badge`, `pip`, `pip-live`           | l'état : la couleur du texte, et son point                |
| `fenceline`, `rail`, `stake`, `knob` | la clôture des étapes : l'ombre, les lisses, le piquet    |
| `knob-lit`, `knob-here`              | la tête d'un piquet franchi, et celle de l'étape en cours |
| `sonar-leaf`, `sonar-still`          | l'encre et l'arrêt de l'onde partagée avec l'ancien thème |
| `limelight`                          | l'ombre portée qui décolle un titre du décor              |
| `rule`                               | le filet du carton de chapitre                            |
| `chapter`                            | le carton : il monte, tient, s'efface vers le haut        |
| `unfurl`                             | la plaque qui se déplie                                   |
| `lift`, `lift-1` à `lift-5`          | ce qui monte, un cran toutes les 200 ms                   |
| `roll`                               | le générique, un poste toutes les 130 ms par `nth-child`  |
| `lift-chrome`                        | l'en-tête et le pied, qui arrivent tout de suite          |

Chaque face de bouton porte son propre bord et ses propres transitions. Elles ne
partagent aucun utilitaire de base, parce que Tailwind v4 n'émet pas les
`@utility` dans l'ordre du fichier : deux utilitaires qui posent la même
propriété se battent, et c'est le hasard de l'ordre d'émission qui gagne.

### Les mots du système

| Nom           | Ce que c'est                                                                |
| ------------- | --------------------------------------------------------------------------- |
| `ChapterCard` | le carton de chapitre au milieu de l'écran                                  |
| `Scene`       | les six décors empilés, et celui qui est devant                             |
| `StepFence`   | la clôture d'enclos, un piquet par étape                                    |
| `StepState`   | le point et la phrase qui disent si l'étape est en place                    |
| `SettingPath` | le chemin d'un réglage, `Options › Général › Divers`                        |
| `FeatureRoll` | les fonctionnalités sur trois colonnes, leurs noms seuls ou avec leur ligne |

## Les règles qui tranchent

Elles viennent toutes d'un essai raté, et elles se tiennent.

1. **Un seul bouton vert par écran**, et il désigne le geste du moment, jamais
   l'avancement. « Continuer » vert alors que rien n'est fait dit au joueur de
   sauter l'étape
2. **Ce qui n'est pas cliquable ne porte pas de bouton.** Un chemin de réglage
   est une plaque incrustée, un état est un point de couleur suivi d'une phrase.
   Quatre boîtes empilées dont deux sont mortes, et on ne sait plus où cliquer
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

| Fichier                                  | Ce qu'il tient                               |
| ---------------------------------------- | -------------------------------------------- |
| `apps/desktop/src/retro.css`             | tout le système : jetons, matière, rythme    |
| `apps/desktop/src/components/retro/`     | les composants qui l'emploient               |
| `apps/desktop/src/constants/features.ts` | les fonctionnalités que le générique montre  |
| `apps/desktop/src/helpers/onboarding.ts` | les phrases de la prise en main, et `leadOf` |
| `apps/desktop/src/assets/ankama/`        | les décors, qui appartiennent à Ankama       |

Le reste de Multifus tourne encore sur `theme.css`, l'ancien thème. Les deux
vivent côte à côte : **aucun jeton de couleur, aucune fonte et aucune matière ne
se croise**. Ce qui se partage est le petit fonds neutre d'`index.css`, qui ne
porte aucune couleur de thème : `grain` pour le grain de l'image, `selectable`
pour un texte qu'on veut pouvoir copier, `sonar` pour l'onde d'écoute, dont
l'encre se donne par `--sonar-ink`. Un écran passe au nouveau système quand il
est refait, jamais à moitié.

## Les images

Elles appartiennent à Ankama. La [licence](../LICENSE) exclut du MIT les trois
dossiers qui en portent, et chaque écran qui en montre une le dit à l'écran.
[docs/plan-design.md](./plan-design.md) tient le relevé et le détail des droits.
