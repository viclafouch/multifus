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

| Fichier                           | Ce qu'il tient                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/retro.css`                   | Le système entier : les jetons du `:root`, les corps et les espacements du `@theme inline`, les matières `@utility`, le rythme |
| `src/theme.css`                   | Le pont vers shadcn et Base UI : chaque jeton de couleur pointe sur `retro.css`. Des espacements en propre, jamais une couleur |
| `src/index.css`                   | Le fonds neutre de la fenêtre principale, et les réglages du navigateur                                                        |
| `src/components/retro/button.tsx` | Les huit faces de bouton et leurs tailles                                                                                      |
| `src/components/layout/`          | Le cadre d'une map : `Screen`, `StageScreen`, `MapHeader`, `Panel`, `FieldRow`                                                 |
| `src/components/world/`           | Le monde : le décor, le dolmen, les têtes, le menu, le retour, le cartouche                                                    |
| `src/constants/world.ts`          | Les dix maps, leurs noms et leurs décors                                                                                       |
| `CONTEXT.md`                      | Les mots. Un nom de composant en sort                                                                                          |
| `.claude/rules/frontend.md`       | React, l'accessibilité, Tailwind, le survol, les durées                                                                        |

`index.css` n'est chargé que par la fenêtre principale. Ce qu'une fenêtre
satellite peint, la bannière, la roue, le tableau des runes, se déclare dans
`theme.css` ou `retro.css` : ailleurs il se peint sans couleur, et aucun test ne
le voit, puisqu'ils lisent les feuilles collées bout à bout.

## D'où vient la matière

Deux sources, relevées et jamais devinées.

Le site officiel `www.dofus-retro.com` donne les fontes, le vert d'action et la
structure d'un panneau. Sa feuille est
`https://static.ankama.com/dofus-retro/www/modules/common/common.css`. Le client,
capturé dans `apps/desktop/src/assets/dofus-options-general.png`, donne la
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
   bouton vert par map, jamais un titre, jamais un avancement
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
    scène entière
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
19. Un survol change une couleur. Le menu de l'accueil en est la seule exception,
    parce que viser une entrée y est le geste même de l'écran
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
24. Une taille de texte du thème s'ajoute à `cn`, dans `lib/utils.ts`.
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
    plus. Elle rend net aussi ce qui bougeait déjà : l'enfoncement d'un pixel au
    clic se voit alors pour de bon, et c'est tant mieux

### Les mots et les formes

27. Un bouton est du texte en Bebas capitales. Pas d'icône à côté d'un mot ; ce
    qui reste de `lucide` est un glyphe seul, et s'en ira
28. Bebas est la fonte de Multifus. Ce que le joueur a écrit reste en Roboto, dans
    sa casse à lui
29. Un corps de texte commence par un verbe, et ne parle pas par métaphore quand
    il y a un geste à faire
30. Un titre nomme le réglage comme le système l'écrit, et un mot que le joueur
    lira sur son propre écran passe entre guillemets par `quoted`
31. Ce qui s'apprend une fois s'ouvre dans un dialogue, pas dans la plaque qui le
    règle. Le bouton qui le rouvre ne vit dans aucun écran : le cadre de la map
    le pose lui-même, en haut à gauche à côté du retour, au même endroit sur
    toutes les maps. Posé dans l'écran il suivait la mise en page, et on le
    cherchait d'une map à l'autre

## Dessiner une map

`app.tsx` pose déjà le décor, les bandes, le cartouche, le crédit et le journal.
Une nouvelle map n'écrit que son dedans :

32. `Screen` si c'est une liste, `StageScreen` si ça montre le jeu. Les deux
    posent `MapHeader`, donc le titre, le fronton et une phrase
33. `Panel` par groupe, c'est le verre. `FieldRow` pour une ligne de réglage,
    `Tick` pour ce qui s'allume, `Button` pour un geste
34. Le nom de la map et son décor se déclarent dans `constants/world.ts`, et
    `CurrentMap` la branche
35. Ni onglet ni barre latérale : on vient de l'accueil, on y retourne par
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
