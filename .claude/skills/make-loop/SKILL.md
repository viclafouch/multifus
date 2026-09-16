---
name: make-loop
description: Fabrique la boucle sans son qu'une capture d'écran doit devenir, en H.264 muet, en webp animé ou en GIF. À lire quand on pose la vidéo d'un LoopStage, quand on veut l'aperçu qu'une carte joue au survol, quand on demande un GIF d'un .mp4 ou d'un .mov, et quand un média déjà là pèse trop lourd.
---

# Une capture en boucle

`make-loop.mjs` fait le rendu, et `node .claude/skills/make-loop/make-loop.mjs --help` dit ses options. Ce fichier dit ce qu'il faut décider avant de le lancer, parce que le script ne devine ni le format, ni la largeur, ni le recadrage.

## Les étapes

1. **Mesurer la boîte d'arrivée.** Ni la vidéo ni le GIF n'ont de repli vectoriel : trop étroit c'est mou, trop large c'est du poids mort. La largeur à demander vaut la largeur en points de la boîte, multipliée par la densité de l'écran. Sur le Mac de la vitrine, densité deux : une plaque de 44 rem fait 704 points, donc 1408 pixels. Chercher la boîte dans le composant qui reçoit le média, jamais l'estimer.

2. **Prendre la vidéo, sauf empêchement.** Le défaut du script est le bon : le même fichier sert le logiciel et le site, et le site se lit au téléphone. Le webp animé sert l'aperçu qu'une balise `img` joue toute seule, sans lecteur ni geste, et il se coupe court avec `--start` et `--seconds`. Le GIF ne se justifie que devant un lecteur qui ne joue ni vidéo ni webp.

3. **Recadrer si la boîte a un rapport.** `object-cover` jette des pixels, et ces pixels-là s'encodent quand même. Passer `--aspect` au rapport de la boîte fait l'économie. Le recadrage est centré : si l'action penche vers un bord, le dire, la sortie coupera dedans.

4. **Lancer le script, et rendre son rapport.** Il écrit les dimensions, la cadence, le format et le poids. Recopier ce poids.

## Ce qu'il faut demander à qui filme

Le script rétrécit, il n'agrandit pas : une capture plus étroite que la largeur
d'arrivée donne une plaque molle, et rien ne la rattrape.

`node .claude/skills/make-loop/frame-dofus.mjs` règle chaque fenêtre de Dofus à
702 × 560 points et dit les deux sélections à donner à l'enregistreur, 700 × 410
points chacune. C'est la taille des boucles déjà posées, et elle tient d'une
vidéo à l'autre : une fenêtre plus grande montre le jeu à une autre échelle, et
les plaques ne font plus famille. Chacune rend 1400 pixels de large, huit de
moins que la plaque de 1408 : cet écart-là ne se voit pas.

La sélection du haut commence sous la barre de titre et cadre la carte. Celle du
bas se cale sur le bas de la fenêtre et cadre le chat, la ligne de saisie
comprise. Une boucle qui montre un texte s'écrire prend celle du bas, sans quoi
le recadrage 16:9 jette la ligne même qu'elle montre.

## Ce que le script ne dit pas

**Ce qu'un GIF coûte au téléphone.** Il se télécharge en entier avant sa première image, se décode sans le matériel, et tient toutes ses images en mémoire. Mesuré sur une capture de 8,4 s en 1408 × 792 : 13,1 Mo en GIF, 602 Ko en H.264, pour un détail zoomé qu'on ne sait pas distinguer. Vingt-deux fois. C'est cet écart qui fait du GIF l'exception.

**Ce qu'un webp animé coûte.** Comme le GIF il se télécharge en entier avant sa première image et se décode sans le matériel, mais il compresse à l'échelle du H.264. Mesuré sur la même capture de 5 s en 720 × 406, 25 images par seconde : 897 Ko en webp à la qualité 72, contre 280 Ko en H.264. Trois fois, pas vingt-deux. C'est cet écart-là qui le rend tenable au survol d'une carte, et qui le garde hors de tout ce qui se charge d'entrée.

**Jamais de son.** Le script retire la piste audio, et le lecteur joue en sourdine : c'est cette paire qui autorise iOS à démarrer la lecture sans un geste de l'utilisateur. Une piste audio, même vide, la lui refuse.

**gifski, jamais `palettegen`.** La chaîne `palettegen`/`paletteuse` de ffmpeg, palette neuve à chaque image, rend un fichier dix fois plus lourd pour le même œil : 127 Mo là où gifski en fait 12. Le script n'appelle ffmpeg que pour sortir les images.

**Une capture du jeu est une image d'Ankama.** Elle se pose dans `packages/ankama`, que la licence exclut du MIT, et nulle part ailleurs.
