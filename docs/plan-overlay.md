# Le module Overlay

La bannière, la roue et le tableau des runes posent tous les trois une fenêtre
sans bord devant le jeu. Chacun redérivait la construction de cette fenêtre, le
fil à part, la ligne de journal d'une erreur Tauri, et le compteur de
génération. Environ 120 lignes de Rust disaient trois fois la même chose.

## Ce qui est passé dans `app/overlay.rs`

**`Overlay`** porte ce qui distingue un overlay d'un autre, et rien de plus :
label, page, nom du fil, la variante `Work` d'un fil qui casse, la variante de
journal d'un échec, et le seul drapeau qui diffère à la construction,
`accepts_first_mouse`. Chaque module en déclare une constante.

Derrière cette interface : `build` avec ses dix appels dans le bon ordre,
`apart` avec son `catch_unwind`, `said` et `complain` pour le journal, `window`
et `target` pour retrouver la fenêtre.

**`Generation`** tient le couple `next` / `matches_latest`, avec ses ordonnances
atomiques, qui vivait en trois exemplaires.

**`Acknowledged`** tient `acknowledge` / `matches_acknowledged`, le `fetch_max`
et le `>=` que la roue seule emploie pour savoir que sa fenêtre est vide. Ce
n'est pas la même chose qu'une génération, et ça porte donc un autre nom : un
accusé vaut pour toutes les ouvertures d'avant, une génération ne vaut que pour
elle.

## Ce qui reste à chaque module

Ce qui diffère vraiment, et qui n'avait rien à faire dans un tronc commun :

- La bannière et la roue rendent le curseur au jeu, `set_ignore_cursor_events`
- Le tableau des runes retient l'activation, panneau non activant sur le Mac
- La taille de départ : la bannière la connaît, la roue la calcule de son
  diamètre le plus large, le tableau la lit dans les réglages

Les trois variantes de journal restent trois. `BannerFailed`, `WheelFailed` et
`RuneTableFailed` portent trois phrases françaises distinctes à l'écran : la
ressemblance était de forme, pas de sens.

## Ce que ça a coûté et rendu

286 lignes retirées des trois modules, 171 posées dans `overlay.rs` dont une
cinquantaine de tests. Le volume est presque le même ; c'est la localité qui
change. Les ordonnances atomiques se corrigent en un endroit, et le quatrième
overlay coûtera une constante, pas un module.

Un seul test jumeau est parti, celui de la bannière. Ceux de la roue et du
tableau passent par `lay` et `holds`, qui font plus que compter, et ils restent.

## Ce que le tableau des runes a gardé

Il ne touche toujours pas à l'écoute des clics. Ses clics passent par le DOM de
sa page, et l'overlay ne change rien à ça.

## À vérifier sur les deux machines

Rien ne devait changer à l'écran. La construction des trois fenêtres a pourtant
été réécrite, et c'est ce qu'il faut regarder :

- La bannière se pose au bon coin, Déplacement rapide allumé, et le curseur la
  traverse sans que le jeu perde le clic
- La roue s'ouvre au maintien, prend la souris, et rien ne s'allume derrière le
  disque
- Le tableau des runes se prend et se déplace, et le jeu garde le premier plan
  pendant tout le geste
- Sur le Mac, le tableau ne ramène pas Multifus devant : c'est le panneau non
  activant, et il est posé après la construction comme avant
- Les trois se ferment et se rouvrent proprement, deux fois de suite
- Multifus lancé, aucune des trois ne vole le focus : elles naissent `focused(false)`

## Ce qu'on n'a pas fait

`holds_point` et `screen_under` vivent toujours en double, en `i32` dans la roue
et en `f64` dans le tableau. Les rassembler demande de toucher au placement de
la roue, qui marche et qui a été vérifié en jeu, et de trancher entre les points
et les pixels. C'est un chantier à part.
