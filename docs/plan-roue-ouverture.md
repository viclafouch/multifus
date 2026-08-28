# La roue s'ouvre mal, deux fois

Deux défauts de la même seconde : la roue tombait à côté à sa première
ouverture, et elle montrait un instant la roue d'avant à chacune des suivantes.

## Elle tombait sous le milieu de l'écran

La fenêtre de la roue est construite une seule fois, au démarrage, à la plus
grande taille que la jauge permette : 360 pour le disque, 32 de halo de chaque
côté, 424 de côté. À chaque ouverture, Multifus la posait, puis la
redimensionnait à la taille demandée.

macOS tient une fenêtre par son coin bas-gauche. Rétrécir après avoir posé
laisse donc ce coin sur place et fait descendre le haut de toute la différence :
quarante points à la jauge par défaut, à 320, et quatre-vingts à la jauge la
plus étroite, à 280. La deuxième ouverture trouvait la fenêtre déjà à la bonne
taille, ne la retaillait pas, et tombait juste.

Le calcul des parts, lui, prenait la position voulue : le disque visible était
sous les camemberts que la souris visait, d'autant de points.

`place` taille désormais d'abord et pose ensuite. Le même dérapage revenait à
chaque mouvement de la jauge, vers le haut quand le disque grandit : il tombe
avec. Windows ne connaissait pas ce défaut, sa fenêtre se posant par son coin
haut-gauche.

## Elle montrait un instant la roue précédente

La fenêtre de la roue ne se ferme jamais, elle se cache. Cachée, elle garde la
dernière image qu'elle a dessinée, et le système la remontre telle quelle à la
seconde où on la remontre. Multifus envoyait la nouvelle roue et montrait la
fenêtre dans la foulée : le temps que la fenêtre reçoive et redessine, le joueur
revoyait l'équipe d'avant. Huit têtes pour cinq demandées, le temps d'un
battement.

La roue s'efface donc avant de se cacher. À la fermeture, Rust rend la souris au
jeu, envoie `multifus://wheel-wipe` avec le numéro de la roue, la fenêtre vide
son écran, et elle répond par `wheel_wiped` une fois la page redessinée. Rust ne
cache la fenêtre qu'à cette réponse, ou au bout de 150 ms si elle ne vient pas.
La dernière image gardée est donc toujours vide.

Trois choses tiennent avec :

- Le fil qui cache prend le verrou du geste, comme l'ouverture, et vérifie sous
  ce verrou que la roue qu'il ferme est encore la dernière. Sans lui, une roue
  ouverte entre-temps se faisait cacher par le fil de la précédente.
- `apart` dit maintenant si son fil est parti. S'il ne part pas, la fermeture
  cache la fenêtre sur place, comme avant.
- La fenêtre ne tient plus qu'une chose de Rust : la roue, ou rien.
  `wheel_step`, qu'elle demande à son premier affichage, rend « rien » quand la
  roue est fermée, et cette réponse n'écrase plus un effacement arrivé avant
  elle. Le repère de la part visée n'a plus besoin d'être remis à zéro à la
  fermeture, puisque toute la roue s'en va.

## Ce qu'on n'a pas fait, et pourquoi

L'ouverture, elle, n'attend rien : Rust envoie la roue et montre la fenêtre dans
la foulée. Le joueur voit donc une image ou deux de vide avant le disque. Lui
faire attendre l'accusé de la fenêtre, comme à la fermeture, coûterait le délai
entier à chaque ouverture : une fenêtre cachée ne dessine pas, `requestAnimationFrame`
y est suspendu, et l'accusé n'arriverait qu'une fois la fenêtre montrée. Du vide
avant le disque vaut mieux qu'une roue en retard sur le maintien.

De même, les 150 ms sont un plafond, pas une attente : la fenêtre répond en une
image ou deux. Une webview ralentie ferait traîner le disque d'autant après le
relâchement, sans rien bloquer, la souris étant déjà rendue au jeu.

## À vérifier sur le Mac

- [ ] Au tout premier maintien après le lancement, la roue s'ouvre au milieu de l'écran, pas plus bas
- [ ] Le survol allume la part que la souris touche, dès cette première ouverture
- [ ] La jauge de taille poussée à 360, puis un maintien : la roue s'ouvre au milieu, sans sauter vers le haut
- [ ] L'aperçu à huit personnages, la jauge ramenée à cinq, l'aperçu à nouveau : cinq parts d'emblée, jamais huit
- [ ] Relâcher les touches : la roue s'en va aussi vite qu'avant, sans traîner
- [ ] Deux maintiens coup sur coup, le second avant que le premier ait fini de s'effacer : la roue se rouvre et reste à l'écran
- [ ] Un aperçu lancé pendant qu'un autre s'efface : le disque ne disparaît pas sous les yeux
