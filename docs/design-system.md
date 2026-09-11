# Le système graphique de Multifus

Multifus sert à jouer à Dofus Retro, donc il en a l'air. Chaque écran est un lieu
du Monde des Douze : un décor du jeu occupe la fenêtre, du verre teinté posé
dessus porte ce qu'il y a à lire, on y va depuis l'accueil et on en revient. Ce
n'est pas un panneau de réglages qui parle du jeu de loin.

**Ce document ne recopie aucune valeur.** Les couleurs, les corps, les
espacements et les matières sont dans le code, qui seul est vrai. Ici il n'y a
que la vision, les sources, et les règles qui ont chacune coûté un essai raté.
Une table recopiée ici serait fausse dans la semaine.

## Où le code dit

La matière vit dans `packages/retro`, que le logiciel et le site importent tous
les deux. Ce qui tient au cadre d'une map reste dans le logiciel.

| Fichier                               | Ce qu'il tient                                                                                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/retro/src/styles/retro.css` | Le système entier : les jetons du `:root`, les corps et les espacements du `@theme inline`, les matières `@utility`, le rythme                                                                                |
| `packages/retro/src/styles/theme.css` | Le pont vers shadcn et Base UI : chaque jeton de couleur pointe sur `retro.css`. Des espacements en propre, jamais une couleur                                                                                |
| `packages/retro/src/cn.ts`            | `tailwind-merge` étendu des tailles et des conteneurs du thème                                                                                                                                                |
| `packages/retro/src/components/`      | Ce qui se porte des deux côtés : `Button` et ses huit faces, `Panel`, `Shade`, `Tale`, `Scene`, `Flag`, `Cross`                                                                                               |
| `apps/desktop/src/index.css`          | Le fonds neutre de la fenêtre principale, et les réglages du navigateur                                                                                                                                       |
| `apps/desktop/src/components/layout/` | Le cadre d'une map : `Screen`, `StageScreen`, `MapHeader`, `MapTitle`, `FieldRow`                                                                                                                             |
| `apps/desktop/src/components/world/`  | Le monde : le décor, le dolmen, les têtes, le menu, le retour, le cartouche                                                                                                                                   |
| `apps/desktop/src/constants/world.ts` | Les dix maps, leurs noms et leurs décors                                                                                                                                                                      |
| `apps/website/src/styles.css`         | Le fonds du site, qui défile et se sélectionne, là où la fenêtre ne fait ni l'un ni l'autre, et la case du comparatif                                                                                         |
| `apps/website/src/components/`        | Le cadre d'une page : `SiteShell`, `SiteHeader`, `Cartouche`, `LanguageOffer`, `Band`, `DecorBand`, `WayLink`, `PageCard`, `Opening`, `ProseBlock`, `PlateBlock`, `RivalTable`, `RuneTable`, `ProvenanceList` |
| `CONTEXT.md`                          | Les mots. Un nom de composant en sort                                                                                                                                                                         |
| `.claude/rules/frontend.md`           | React, l'accessibilité, Tailwind, le survol, les durées                                                                                                                                                       |

`index.css` n'est chargé que par la fenêtre principale. Ce qu'une fenêtre
satellite peint, la bannière, la roue, le tableau des runes, se déclare dans
`theme.css` ou `retro.css` : ailleurs il se peint sans couleur, et aucun test ne
le voit, puisqu'ils lisent les feuilles collées bout à bout. La même règle vaut
pour ce qu'un composant de `packages/retro` nomme : `grain` vivait dans
`index.css` alors que `Scene` l'emploie, donc le site l'aurait peint sans son
bruit. Il est dans `retro.css`, avec ce qui s'y rattache.

## D'où vient la matière

Deux sources, relevées et jamais devinées.

Le site officiel `www.dofus-retro.com` donne les fontes, le vert d'action et la
structure d'un panneau. Sa feuille est
`https://static.ankama.com/dofus-retro/www/modules/common/common.css`. Le client,
capturé dans `packages/ankama/images/dofus-options-general.png`, donne la
matière : le cadre presque noir, le brun, le kaki, la crème.

**Le site tranche pour les couleurs d'action, le client tranche pour la
matière.** Les boutons orange en pilule du client ont été repris une fois, et ils
ont fait dériver tout l'écran hors du système : sur le site, l'orange ne colore
qu'un titre, et les boutons sont verts.

Quand une matière manque, on retourne à la source plutôt que de l'inventer.
`curl` sur la feuille, puis `tr '}' '\n'` et `grep` pour la lire, elle est
minifiée sur 1,5 Mo. On n'en garde que des adresses : l'article 13.5 des CGU
d'Ankama qualifie le moissonnage de contrefaçon. CloudFront refuse un navigateur
piloté, donc rien ne s'automatise. Le site n'a ni champ, ni onglet, ni curseur :
pour un écran de travail, c'est la fenêtre Options du client qui répond.

## Les règles

### La couleur

1. Le vert dit l'action du moment et ce qui est en place, rien d'autre. Un seul
   bouton vert par map, jamais un titre, jamais un avancement. Sur le site, cette
   action porte un nom, « Télécharger », et un seul bouton vert par page le dit.
   `/telecharger` en porte deux, le Mac et Windows : c'est la même action coupée
   en deux par le système, pas deux actions qui se disputent l'œil. Le comparatif
   ne coche donc rien en vert : soixante-douze cases vertes noieraient le seul
   bouton qui compte, et le disque plein, le demi-disque et l'anneau vide se
   distinguent sans couleur
2. L'or et l'ambre ne vivent que dans le logo du jeu. Ils survivent aux deux
   endroits que `CONTEXT.md` nomme, la part sans couleur de la roue et l'étoile
   du principal, et nulle part ailleurs
3. Les deux sceaux de sexe gardent leur couleur, seule exception au vert : ils se
   choisissent côte à côte, et deux disques verts ne se distinguent plus
4. Ce qui n'est pas cliquable ne porte ni fond ni bord. Un chemin de réglage est
   du texte, un état est un point de couleur suivi d'une phrase

### Le décor et le verre

5. Une plaque est de l'`iron` transparent, jamais du `slate`. La couleur du voile
   décide du contraste, l'alpha décide de ce qu'on voit derrière, et on ne paie
   pas l'un avec l'autre : mesuré sur le pixel le plus clair des décors, l'`iron`
   tient les 4,5:1, le `slate` tombe à 2,8:1. On ombre en variant l'alpha
6. Le texte posé sur du verre est gravé par `--engrave`. Ce que le joueur tape ne
   se grave pas
7. On assombrit local et le moins possible. Un voile qui cache le décor coûte
   plus qu'il ne rapporte : c'est le décor qui dit où on est
8. Le décor ne s'arrête jamais de bouger, celui qui sort compris. Une panoramique
   qui ne tourne que sur l'image affichée fait sauter l'image au changement
9. Une ombre qui s'éteint le fait en courbe, jamais en droite. Une rampe de trois
   arrêts pose un trait là où la pente change, et l'œil le voit même là où
   l'alpha ne vaut presque plus rien. Les deux courbes sont dans le `:root` de
   `retro.css` et se portent par un masque, la couleur et le sens restant à
   l'élément. `--fall-stops` est à queue plate d'un seul côté, et sert ce qui
   pend d'un bord : `fall` s'en sert pour les deux `Shade`. `--ebb-stops` est
   plate aux deux bouts, et sert ce qui meurt des deux côtés : la plaque d'une
   phrase de map s'y efface à gauche comme à droite. Prendre l'une pour l'autre
   se voit : le départ raide de `--fall-stops` pose un trait là où la plaque
   quitte sa pleine valeur, exactement le trait qu'on voulait effacer. Un bord ne
   reçoit qu'une ombre, car deux courbes superposées de longueurs différentes
   rendent ce trait aussi. Et une ombre a besoin de place : une opacité forte
   serrée sur trop peu se verra toujours

### La mise en page

10. Une map occupe la fenêtre entière, et le reste flotte au-dessus, hors du flux.
    Dans le flux, le retour coupait ce qui défile, et ouvrir le journal levait la
    scène entière. Ce qui flotte en haut partage une seule ligne, dont
    `--spacing-crown` donne la hauteur et `items-center` le centre : le retour,
    le cartouche, la ligne d'écoute de l'accueil. Trois boîtes de hauteurs
    différentes ancrées au même `top` ne s'alignent pas, un bouton de 28 pixels
    et des drapeaux de 16 se ratant de six. Un avis n'entre pas dans cette
    ligne : il se pose au-dessus, dans le flux, et pousse vers le bas la ligne
    comme la map. Lui réserver sa place à coups de `padding` échoue dès qu'on
    traduit, la largeur du mot « Retour » n'étant pas celle de « Zurück »
11. Ce qui flotte a son ombre, `Shade` en haut et en bas, et un écran commence et
    finit hors d'elle : c'est `--spacing-fall` qui donne les deux marges. Le
    texte qui glisse dessous s'efface au lieu de se cogner
12. Le titre d'une map se pose toujours à la même hauteur, quelle que soit celle
    de ce qu'il annonce. C'est le bas qui reste vide. Sous lui, la phrase est
    posée sur une plaque dont le fronton fait le bord haut. Un assombrissement
    flou et sans bord, qui défile pendant que l'ombre du haut ne bouge pas, se
    lit comme un défaut d'affichage : deux nuages sombres qui se croisent. Un
    objet à bords passe derrière l'ombre sans surprendre, et c'est pour cela que
    la plaque a un bord haut, un bord bas et des côtés qui se perdent. Ses côtés
    doivent avoir fini de se perdre avant que la phrase commence, sinon les
    premiers et les derniers mots d'une longue ligne se posent sur presque rien :
    la fin de la courbe et le rembourrage du texte se règlent ensemble, et se
    vérifient sur la phrase la plus longue, pas sur la plus courte. La plaque
    tient sa lisibilité de l'`iron`, jamais de la taille de sa phrase : sur le
    pixel le plus clair des décors, sous la plaque, la `cream` tient les 4,5:1 là
    où la `khaki-lit` tombe à 3,7:1. La phrase reste loin du corps du titre,
    sinon l'œil ne va plus qu'à elle et le reste de la map s'efface
13. Un écran garde une marge de hauteur : les fontes chargent en `swap`, et la
    page grandit de quelques pixels le temps que les vraies arrivent
14. Un dialogue tient sa place de son composant, jamais de sa classe. Une classe
    de position dans le `className` d'un `DialogContent` remplace le `fixed` du
    composant, `tailwind-merge` gardant la dernière : la carte retombe dans le
    flux, tout en bas du document, et le navigateur y défile pour poser le
    focus, emmenant l'écran entier avec lui

### Le mouvement

15. Rien n'est monté ni démonté au fil d'une animation. Tout est là à la première
    image, seules l'opacité et la translation bougent : un joueur pressé clique
    avant la fin, et un test cherche à la milliseconde zéro. Un bouton ne monte
    pas en opacité au-dessus du décor, il porte `steady` et arrive posé : son
    fond translucide laisse passer la pelouse tant que le fondu dure, et cela
    se lit comme un survol. `settle` ne voit que ses enfants directs : ce qu'une
    map pose en haut reste à plat dans la section. Regrouper le titre et la
    phrase dans un conteneur a sorti le bouton de la portée de `steady`, qui est
    reparti en fondu, et a écrasé l'échelonnement du reste
16. Une animation qui fait attendre ne se pose que là où on ne passe qu'une fois.
    La mise en route a ses quatre secondes ; une map s'ouvre en 800 ms sans rien
    bloquer
17. Les délais s'annulent sous `prefers-reduced-motion`, pas seulement les durées
18. Une translation d'entrée vit dans un conteneur qui coupe, sinon elle agrandit
    la zone défilable et la barre paraît une demi-seconde
19. Un survol change une couleur, et un clic aussi. Rien ne bouge de place sous
    le doigt : le bouton s'assombrit, il ne s'enfonce pas. Le menu de l'accueil
    est la seule exception au repos, parce que viser une entrée y est le geste
    même de l'écran. La liste des fonctionnalités de l'accueil du site est ce
    même menu, et elle porte donc le même `btn-way` : choisir où aller y est
    aussi le geste de la page. Elle ne l'invente pas, elle le reprend, et c'est
    à cette condition que l'exception reste unique. Sur le fond uni du site, le
    voile de `btn-way` ne se voit plus, faute de décor dessous : ce qui reste,
    et qui suffit, c'est le losange qui entre et le titre qui s'éclaircit
20. Une tête du dolmen n'apparaît ni ne s'efface d'un coup. Celle qui arrive
    éclot sur sa place, celle qui s'en va sort d'abord du flux, figée là où elle
    était, et les autres glissent de leur ancienne place à la nouvelle. Le
    glissement se mesure et se joue à la main, dans `useGlide` : une rafale de
    connexions couperait toute animation que le navigateur mènerait seul, et
    c'est là qu'il faut être fluide. Il repart de la position où le précédent en
    était, jamais du début. Ce qui glisse ne porte donc aucune transformation à
    lui, l'éclosion vivant un cran plus bas, sur ce que la place porte. Les
    boîtes mesurées se périment dès que la fenêtre change de taille, la tête
    étant en `vh` : un `ResizeObserver` les reprend, sinon le glissement suivant
    part d'une position d'avant. Et seul ce qui change vraiment de taille prend
    l'échelle : la posée sur du texte l'étire

### Le CSS

21. Chaque `@utility` est complète et ne partage aucune base. Tailwind v4 ne les
    émet pas dans l'ordre du fichier : deux qui posent la même propriété se
    battent, et c'est le hasard qui gagne
22. On n'écrit pas une matière avant l'écran qui l'emploie. Une `@utility` sans
    appelant est une abstraction pour plus tard
23. Aucune valeur en dur dans un composant : un jeton, ou rien. Ce qui se pose sur
    une tête se déduit de `--head`, qui rétrécit quand le roster grossit
24. Une taille de texte du thème s'ajoute à `cn`, dans `packages/retro/src/cn.ts`.
    `tailwind-merge` ne connaît que les tailles de Tailwind : sans cette liste il
    lit `text-mark` comme une couleur, le `text-background` qui suit l'écrase, et
    le texte repart à la taille du navigateur sans que rien ne le dise

25. Aucun `backdrop-filter` au-dessus d'une vidéo. Une vidéo qui joue est
    composée par le système sur sa propre couche, et le filtre oblige WebKit à
    recomposer les deux : il se trompe alors de géométrie et dessine la vidéo
    plus petite, calée dans un coin. La plaque de `LoopStage` a coûté six essais
    avant qu'on trouve. De toute façon un filtre sous une image opaque ne sature
    rien : il ne rapporte que le bug

26. Un trait fin tient sa propre couche, `transform: translateZ(0)`. Une ligne
    dont le milieu est en `flex-1` pose ce qui la suit à une coordonnée à
    virgule ; WebKit promeut au survol, cale la couche sur le pixel entier, et le
    trait saute d'un pixel à l'aller comme au retour. L'étoile et la croix du
    roster ont coûté trois essais, le `backdrop-filter` et les transitions
    accusés à tort. La couche figée ne coûte qu'elle-même, et le trait ne bouge
    plus

### Les mots et les formes

27. Un bouton est du texte en Bebas capitales. Pas d'icône à côté d'un mot ; ce
    qui reste de `lucide` est un glyphe seul, et s'en ira
28. Bebas est la fonte de Multifus. Ce que le joueur a écrit reste en Roboto, dans
    sa casse à lui
29. Bebas est déclarée dans `retro.css` et non plus importée de `fontsource`,
    parce qu'elle y reçoit un ascendant et un descendant à nous. Les siens
    posent la ligne de base trop haut, le mot montait dans son bouton, et les
    deux webviews ne lisaient même pas les mêmes chiffres : macOS `hhea`,
    Windows les mesures Windows d'`OS/2`. La somme des deux vaut l'interligne
    des boutons, ce qui annule le demi-interligne, et leur différence pose la
    capitale au milieu. Les valeurs sont mesurées dans la webview, un bouton par
    taille et la ligne de base relevée à l'écran, jamais calculées : la table de
    la fonte annonce une capitale plus basse que celle qu'elle dessine, et
    Chromium arrondit l'ascendant au pixel. `text-box` dirait tout ça en une
    ligne le jour où le plancher des webviews l'atteindra
30. Bebas ne porte pas une phrase. Bebas Neue n'a pas de bas de casse, et ce
    qu'on lui donne en minuscules ressort en petites capitales : une question
    entière y devient un mur qu'on relit deux fois. Elle tient les titres et les
    boutons, où le mot est court et attendu ; une phrase que le joueur lit pour
    la première fois est en Roboto
31. Un corps de texte commence par un verbe, et ne parle pas par métaphore quand
    il y a un geste à faire
32. Un titre nomme le réglage comme le système l'écrit, et un mot que le joueur
    lira sur son propre écran passe entre guillemets par `quoted`
33. Ce qui s'apprend une fois s'ouvre dans un dialogue, pas dans la plaque qui le
    règle. Le bouton qui le rouvre ne vit dans aucun écran : le cadre de la map
    le pose lui-même, en haut à gauche à côté du retour, au même endroit sur
    toutes les maps. Posé dans l'écran il suivait la mise en page, et on le
    cherchait d'une map à l'autre
34. Une liste qu'on ne lit que le jour où ça coince se plie, une entrée ouverte
    à la fois. Dépliée d'un bloc, elle se lit comme un mur et la réponse
    cherchée s'y noie ; pliée, elle ne montre que les questions, et elle peut
    grossir sans que la précédente devienne plus dure à trouver. Le repère qui
    dit l'ouverture est le losange de `btn-way`, pas un chevron : le geste est
    déjà celui de l'accueil, et un bouton ne porte pas d'icône à côté d'un mot.
    Les deux losanges partagent leur côté, leur durée et leur courbe par
    `--lozenge-side` et `--lozenge-turn`, jamais plus : l'un est un élément,
    l'autre un `::after` dont la rotation vit dans un `transform` qui translate
    aussi. Sortir la rotation de là arrête la translation
35. Ce qu'une page du site ne fait pas se lit en intertitre, jamais en note de bas
    de page. Quand c'est la page entière qui l'avoue, ça se pose sur une plaque,
    `PlateBlock` : l'accueil et les sept fonctionnalités. `/telecharger` est
    l'exception, et elle se voit : sa limite est l'une des quatre preuves
    d'« Avant d'installer », et les quatre gardent le même rythme. Une plaque
    posée partout ne dirait plus rien. Le paragraphe qui ouvre un corps porte,
    lui, un filet à sa gauche et la couleur crème, comme les chiffres de
    l'accueil : il raconte, et les passages expliquent
36. La langue se change par son drapeau, en haut à droite, et le drapeau mène à
    la même page. C'est le cartouche des maps posé sur la barre du site, et
    `ensign` répond maintenant à `aria-current` autant qu'à `aria-pressed` :
    dans une fenêtre c'est un bouton qui bascule, sur un site c'est un lien qui
    navigue. Un seul endroit par page choisit la langue, donc le pied de page
    n'en a plus. Ce qui propose l'autre langue sans qu'on l'ait demandé, lui,
    s'écrit dans la langue proposée, se ferme, et ne revient pas

## Dessiner une map

`app.tsx` pose déjà le décor, les bandes, le cartouche, le crédit et le journal.
Une nouvelle map n'écrit que son dedans :

37. `Screen` si c'est une liste, `StageScreen` si ça montre le jeu. Les deux
    posent `MapHeader`, donc le titre, le fronton et une phrase
38. `Panel` par groupe, c'est le verre. `FieldRow` pour une ligne de réglage,
    `Tick` pour ce qui s'allume, `Button` pour un geste
39. Le nom de la map et son décor se déclarent dans `constants/world.ts`, et
    `CurrentMap` la branche
40. Ni onglet ni barre latérale : on vient de l'accueil, on y retourne par
    « Retour » ou par Échap

Avant de dessiner, lire `CONTEXT.md` pour les mots. `frontend.md` tient React,
l'accessibilité et Tailwind, et ce document ne les redit pas.

## Ce qui manque

Le champ de saisie, la zone de texte, la liste déroulante, le curseur et le
tableau tournent encore sur les composants shadcn repeints par les jetons : la
bonne palette, pas la bonne matière. Chacun se prend sur la fenêtre Options du
client le jour où la map qui en a besoin est reprise.

## Les images

Elles appartiennent à Ankama. La [licence](../LICENSE) exclut du MIT les dossiers
qui en portent, chaque fenêtre le dit en bas, et
[docs/images.md](./images.md) tient la provenance de chacune et les droits.
