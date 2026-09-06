# Le menu de l'accueil, quand la souris passe dessus

Vu le 06/09/2026 sur le Mac.

## Ce qui n'allait pas

Les dix maps de la clairière sont des boutons `bare`. Au survol, un cadre kaki et
un fond sombre apparaissent d'un coup, le texte passe en crème, et c'est tout.
C'est le survol d'une ligne de formulaire, pas celui d'un chemin qui part d'une
clairière. Rien ne donne envie d'entrer.

## Ce qu'on fait

Une map hors de la clairière est un chemin, et le survoler, c'est viser la case
où l'on va poser le pied. Trois choses arrivent ensemble, en 300 ms.

**La case isométrique vient marquer l'entrée.** Le losange vert du fronton, juste
au-dessus de la liste, glisse depuis la gauche et se pose au début de la ligne
survolée. Même carré de 7 px tourné à 45°, même `--leaf-lit` : l'œil l'a déjà
rencontré deux lignes plus haut. C'est le geste du jeu, où la case sous le
curseur s'allume avant qu'on clique.

Il ne porte pas le même halo que celui du fronton. Le fronton pose un cerne
sombre, qui détache le losange du filet clair sur lequel il est assis ; le chemin
pose une lueur verte, qui le détache de la planche sombre. Même forme, deux
fonds, deux halos.

Le vert ne colore ici ni un titre ni un état, mais l'action du moment, ce que le
document de design lui autorise déjà.

**Le nom fait un pas de côté.** Il se décale de 16 px vers la droite. Le losange
tourné en occupe dix, et les six qui restent sont l'air qu'il faut entre lui et
la première lettre. Le texte bouge parce qu'on lui prend sa place, pas pour
bouger.

**Le cadre s'en va, la lumière reste.** Le rectangle bordé de `bare` est remplacé
par un dégradé sombre qui s'éteint vers la droite : la lumière tombe du côté du
losange. Une ligne survolée se lit comme éclairée, plus comme encadrée, et le
texte garde le fond sombre dont il a besoin pour se détacher du décor.

**Rien ne coûte une mise en page.** Le losange et le nom bougent en `transform`,
la planche en `opacity`. Aucune de ces propriétés ne redessine la page, et une
seule ligne s'anime à la fois. Pas de `scale`, pas de soulèvement : ce qui bouge
ici se déplace le long de la lecture.

C'est la seule exception à la règle du survol de `frontend.md`, et le document de
design la porte maintenant, avec sa limite : cet écran, et lui seul.

**Une face de bouton, et un seul compagnon.** `btn-way` porte la planche, le
losange en `::after` et les trois mesures dont ils dépendent, déclarées ensemble
en tête : la taille du losange, son écart du bord, le pas du nom. Le nom a sa
propre classe, `wayname`, parce qu'il faut un élément à décaler ; c'est la face
qui le déplace, depuis son propre bloc. Aucune classe ne remonte vers son parent.

**Une entrée ne s'enfonce pas au clic.** Toutes les faces portent
`active:translate-y-px`, le pixel de course d'un bouton qu'on presse. Ici il n'y
a ni cadre ni relief à enfoncer : seul le texte sautait d'un pixel, et ça se
lisait comme un défaut. La face remet ce pixel à zéro elle-même, dans la table
des variantes, pour que ça tienne sans que l'appelant y pense.

**Le mouvement réduit éteint les trois transitions par leur nom**, comme le
demande `frontend.md`. L'état arrive quand même, d'un coup : le losange se pose,
le nom est écarté, la planche est allumée. C'est le mouvement qu'on retire, pas
ce que le survol dit.

**Le menu prend ses premiers tests.** `way-list.test.tsx` garde le nom accessible
de chaque bouton, que la découpe en `span` pouvait casser sans bruit. Les deux
autres cas, le clic qui dit quelle map et le point « À régler » posé sur une
seule ligne, couvrent du comportement plus ancien que ce changement : le
composant n'avait aucun test, et c'était l'occasion.

## Ce qu'on ne fait pas

**Pas de torche qui passe.** Une bande de lumière crème traversait la ligne une
fois, de gauche à droite, comme l'éclat d'un panneau de bois qu'on éclaire. Deux
essais, franc puis presque transparent : dans les deux cas elle se lisait comme
un reflet sur une vitre, quelque chose qui glisse devant le texte au lieu
d'éclairer la planche. Le survol de dix lignes n'a pas besoin d'un troisième
mouvement. Elle est retirée, avec ses `@keyframes torch`.

**Pas de losange partagé avec le fronton.** Deux `@utility` ne peuvent pas se
partager un pseudo-élément, et un troisième utilitaire pour une forme de deux
déclarations coûterait plus qu'il ne rendrait. La forme est écrite deux fois, et
le document de design dit pourquoi.

**Pas de face partagée avec `bare`.** `btn-way` recopie sa couleur, son ombre de
texte, son bord et son fond. C'est la règle du système : chaque face porte tout
ce qu'elle pose, sinon le bord et le rayon tombent au hasard de l'ordre
d'émission des `@utility`.

Le « Retour » des autres maps garde sa face `slate` : il se pose sur onze décors
dont des clairs, et le document de design dit pourquoi.

Pas de son, pas de secousse, pas de grossissement.

## Ce qui reste à regarder

- [ ] Le Mac, l'accueil : survoler une entrée, le losange arrive par la gauche et
      se pose, le nom s'écarte.
- [ ] Descendre la liste d'un coup à la souris : dix losanges à la suite, et
      aucune saccade.
- [ ] Au clavier : la tabulation donne le même état que la souris, l'anneau de
      focus compris.
- [ ] Cliquer et garder le bouton enfoncé : rien ne descend d'un pixel.
- [ ] La ligne des Paramètres pendant la mise en route : le point rouge reste
      visible par-dessus la planche, à droite.
- [ ] Une fenêtre courte, où `--spacing-rung` tombe à 30 px et `--text-way` à
      17 px : le losange reste centré sur la hauteur.
- [ ] Le mouvement réduit du système allumé : rien ne bouge, et la ligne survolée
      se lit quand même.
- [ ] Windows : les mêmes, jamais lancé.

## Une fois livré

Ce fichier s'efface.
