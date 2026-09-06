# La roue rentre chez les Personnages

La roue des personnages n'est pas un réglage à part : c'est ce qu'on fait de son
roster. Elle perd sa map, elle devient une plaque en bas de Personnages, et le
menu de l'accueil passe de dix chemins à neuf.

## Ce qu'on voit

**Avant.** Deux entrées dans le menu. « Personnages » porte le roster et
l'exclusion. « Roue des personnages » porte deux plaques : une qui rappelle la
combinaison, une qui dessine l'aperçu et ses deux jauges.

**Après.** Une seule entrée. Personnages porte son roster comme avant, et sous
lui une plaque « Roue des personnages » qui tient tout : la combinaison et
« Revoir la vidéo » dans son en-tête, le dessin en pleine largeur, les deux
jauges, et « Voir en vrai ». La plaque est là même quand le roster est vide : ses
personnages sont faux, elle ne dépend de personne, et c'est justement au nouveau
venu que la vidéo s'adresse.

## La vidéo

Elle arrive dans un dialogue, six dixièmes de seconde après qu'on est entré, et
une seule fois dans la vie du logiciel. La vidéo remplit le cadre, un ourlet
sombre monte du bas, le titre et une phrase se posent dessus, et un bouton vert
dit « J'ai compris ». Fermé, le Rust s'en souvient (`wheel.loopSeen`) et le
dialogue ne revient plus tout seul. « Revoir la vidéo », dans la plaque, le
rouvre à qui le redemande.

Trois arrangements ont été essayés avant celui-là, et les deux premiers sont
écartés :

- **La vidéo posée dans la plaque, sous le dessin.** Deux cadres empilés de
  largeurs différentes : la vidéo prenait toute la plaque, le dessin restait un
  timbre de 420 px au milieu. L'œil voyait deux écrans au lieu d'un
- **La vidéo à la place du dessin, dans le même cadre.** Plus propre, mais le
  bouton qui la replie était loin d'elle, et « replier » ne dit rien à personne
- **Le dialogue.** La plaque n'a plus qu'un seul agencement, toujours le même, et
  la vidéo a tout l'écran pour elle le jour où elle sert

Le cadre du dessin ne porte plus de largeur en pixels : `ScreenFrame` prend une
largeur facultative, `useBoxWidth` mesure ce que la plaque lui donne, et
`drawnWheel` en tire le diamètre. La roue dessinée fait donc trois fois ce
qu'elle faisait, et il n'y a toujours qu'un seul cadre « l'écran du joueur » dans
le logiciel.

`--aspect-loop` est passé de 16/10 à 16/9 : un enregistrement d'écran est en
16/9, et `object-cover` rognait un dixième de la largeur du GIF.

Le cadre porte `pane` et non `stage` : la planche translucide laissait remonter
les mâts du camp de Bonta au travers de la roue, en traits verticaux qui se
lisaient comme un défaut d'affichage.

Trois démonstrations cohabitent, et chacune répond à une question différente :

| Ce qu'on montre  | La question                           | Quand                       |
| ---------------- | ------------------------------------- | --------------------------- |
| La vidéo         | à quoi ça sert ?                      | une fois, puis à la demande |
| Le dessin        | quelle taille ça fera sur mon écran ? | à chaque visite             |
| « Voir en vrai » | est-ce que ça tombe bien là ?         | au bouton                   |

## Ce qui a changé dans le Rust

- `Screen` perd `Wheel` : neuf écrans, et la barre système perd sa ligne
- `settings::Wheel` prend `loop_seen`, faux par défaut
- `set_wheel_loop_seen`, une commande de plus, appelée par la fenêtre seule

## Ce qui a changé dans le TypeScript

- `ScreenName` perd `'wheel'`, et `MAPS`, `MAP_SCENES`, `MAP_NAMES` avec lui
- `screens/wheel/` devient `screens/characters/`, un dossier dont l'`index.tsx`
  n'orchestre que deux plaques, `RosterPanel` et `WheelPanel`
- Le titre de la plaque se prend dans `SHORTCUT_ACTIONS.wheel.label`, qui portait
  déjà le même mot que `MAP_NAMES.wheel`
- La fonctionnalité « La roue des personnages » du générique mène aux Personnages
- `hem-deep` dans `retro.css` : l'ourlet du bas, mais assez sombre pour qu'une
  phrase se lise sur une image du jeu en plein cadre
- `lib/motion.ts` : `matchIsStill`, la question `prefers-reduced-motion`, qui
  était écrite en dur dans `lib/anchor.ts` et sert maintenant aux deux
- `rankOf` descend de la plaque du roster dans `helpers/cycle.ts`, où vivent déjà
  les fonctions pures du défilement

## Deux mots qui n'étaient pas demandés, et pourquoi ils restent

- **La jauge « Personnages » s'appelle « Le monde ».** Une jauge nommée
  « Personnages » dans la map Personnages ne dit plus de quoi elle parle. Sa
  lecture, « Tout seul » ou « À 6 », va au mot du jeu
- **La phrase de l'en-tête a repris « Depuis une fenêtre du jeu, et nulle part
  ailleurs »**, la seule ligne de l'ancienne carte qui disait où le raccourci
  marche. Elle ne se perd pas dans le déménagement

## Ce qui reste

- **Poser la vraie vidéo.** `src/assets/ankama/wheel-loop.gif` est un bouche-trou
  pris sur le CDN d'Ankama, une Crâ qui respire dans l'herbe. Le remplacer par
  l'enregistrement de la roue à l'œuvre suffit : rien d'autre à toucher, le cadre
  est en 16/9 comme une capture d'écran, et la légende décrit déjà ce qu'on y
  verra
- **`cn` ne connaît pas l'échelle de corps du thème.** `twMerge` prend `text-bar`
  et `text-aside` pour des couleurs, et les efface dès qu'une couleur passe dans
  le même `cn`. `DialogContent` perd ainsi son `text-aside` depuis toujours, et
  tous les dialogues écrivent en 16 px au lieu de 13. Se règle par
  `extendTailwindMerge` avec les onze jetons de `retro.css`, et une garde qui
  relit la feuille. À faire à part : ça retaille le texte de tous les dialogues
  d'un coup

## Essais à mener à la main

- Entrer dans Personnages la première fois : le dialogue arrive, « J'ai compris »
  le ferme, on relance Multifus, il ne revient pas
- « Revoir la vidéo » le rouvre, et le referme sans rien réécrire
- Réduire la fenêtre à 720 × 520 : le dessin de la roue suit la plaque, la roue
  reste entière dans son cadre
- **Regarder la map Déplacement rapide.** `ScreenFrame` a changé de matière pour
  tout le monde : le choix du coin de la bannière porte maintenant la planche
  `stage` au lieu du `bg-card` de l'ancien thème. Rien ne le mesure, c'est à
  l'œil
- Entrer avec « Réduire les animations » allumé dans les réglages du système : le
  dialogue est là tout de suite, sans les six dixièmes de seconde
