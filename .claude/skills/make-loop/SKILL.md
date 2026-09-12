---
name: make-loop
description: Fabrique la boucle sans son qu'une capture d'écran doit devenir, en H.264 muet ou en GIF. À lire quand on pose la vidéo d'un LoopStage, quand on demande un GIF d'un .mp4 ou d'un .mov, et quand un média déjà là pèse trop lourd.
---

# Une capture en boucle

`make-loop.mjs` fait le rendu, et `node .claude/skills/make-loop/make-loop.mjs --help` dit ses options. Ce fichier dit ce qu'il faut décider avant de le lancer, parce que le script ne devine ni le format, ni la largeur, ni le recadrage.

## Les étapes

1. **Mesurer la boîte d'arrivée.** Ni la vidéo ni le GIF n'ont de repli vectoriel : trop étroit c'est mou, trop large c'est du poids mort. La largeur à demander vaut la largeur en points de la boîte, multipliée par la densité de l'écran. Sur le Mac de la vitrine, densité deux : une plaque de 44 rem fait 704 points, donc 1408 pixels. Chercher la boîte dans le composant qui reçoit le média, jamais l'estimer.

2. **Prendre la vidéo, sauf empêchement.** Le défaut du script est le bon : le même fichier sert le logiciel et le site, et le site se lit au téléphone. Le GIF ne se justifie que devant un lecteur qui ne joue pas de vidéo.

3. **Recadrer si la boîte a un rapport.** `object-cover` jette des pixels, et ces pixels-là s'encodent quand même. Passer `--aspect` au rapport de la boîte fait l'économie. Le recadrage est centré : si l'action penche vers un bord, le dire, la sortie coupera dedans.

4. **Lancer le script, et rendre son rapport.** Il écrit les dimensions, la cadence, le format et le poids. Recopier ce poids.

## Ce qu'il faut demander à qui filme

Le script rétrécit, il n'agrandit pas : une capture plus étroite que la largeur
d'arrivée donne une plaque molle, et rien ne la rattrape. Sur le Mac de la
vitrine, une sélection de 704 × 396 points tombe pile sur les 1408 × 792 de la
plaque, sans recadrage ni mise à l'échelle. Et la fenêtre de Dofus garde la même
taille d'une vidéo à l'autre, sinon les trois plaques montrent le jeu à trois
échelles et ne font pas famille.

## Ce que le script ne dit pas

**Ce qu'un GIF coûte au téléphone.** Il se télécharge en entier avant sa première image, se décode sans le matériel, et tient toutes ses images en mémoire. Mesuré sur une capture de 8,4 s en 1408 × 792 : 13,1 Mo en GIF, 602 Ko en H.264, pour un détail zoomé qu'on ne sait pas distinguer. Vingt-deux fois. C'est cet écart qui fait du GIF l'exception.

**Jamais de son.** Le script retire la piste audio, et le lecteur joue en sourdine : c'est cette paire qui autorise iOS à démarrer la lecture sans un geste de l'utilisateur. Une piste audio, même vide, la lui refuse.

**gifski, jamais `palettegen`.** La chaîne `palettegen`/`paletteuse` de ffmpeg, palette neuve à chaque image, rend un fichier dix fois plus lourd pour le même œil : 127 Mo là où gifski en fait 12. Le script n'appelle ffmpeg que pour sortir les images.

**Une capture du jeu est une image d'Ankama.** Elle se pose dans `packages/ankama`, que la licence exclut du MIT, et nulle part ailleurs.
