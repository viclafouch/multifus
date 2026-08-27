# Le roster vide

L'écran que voit un joueur qui vient d'installer Multifus, et qui n'a encore
lancé aucun client.

## Le problème

L'écran disait « Votre roster est vide » et posait un bouton « Chercher
maintenant ». Deux ennuis :

- Le bouton laisse croire qu'il y a quelque chose à déclencher. Le tour de
  Multifus passe sur les fenêtres une fois par seconde et émet un snapshot dès
  que quelque chose bouge : le bouton ne fait rien de plus que la seconde
  suivante.
- Le texte ne dit pas au joueur ce qu'on attend de lui. Il ne sait pas qu'il
  suffit d'entrer en jeu.

## Ce qu'on fait

- Le bouton disparaît, et la commande `refresh` avec lui, des deux côtés du
  pont. `runtime::refresh` reste : `commands::reset` l'appelle.
- L'écran raconte les trois temps du joueur : lancer le jeu, entrer en jeu, et
  voir sa ligne se poser. Des verbes du jeu, jamais de verbe technique.
- Une lampe verte fixe, en bas de l'encadré, dit que Multifus regarde. C'est
  elle qui remplace le bouton.

## L'écran

Un encadré en pointillés, comme avant, avec :

1. Six têtes de classe qui se chevauchent : Iop, Eniripsa, Sram, Sadida, Xélor,
   Ecaflip, en alternant homme et femme. Ce sont les portraits de
   `CLASS_PORTRAITS`, ceux-là mêmes que porteront les lignes du roster. Une team
   pour de faux, qui met de la couleur sur un écran vide.
2. Le titre, une phrase, et l'avertissement sur l'écran de connexion.
3. Trois cartes numérotées `01` `02` `03` en mono, comme les rangs du
   défilement. Le rang se tire de l'index, il n'est pas dans les chaînes.
4. Une ligne d'état séparée par un trait en pointillés : la lampe verte, et
   « Multifus regarde vos fenêtres, une fois par seconde », les mots de **Tour**
   dans `CONTEXT.md`.

## Décisions

- Le mot **client** reste : c'est le mot du joueur multicompte.
- Les trois lignes des cartes tiennent la même longueur, une quarantaine de
  signes, pour que les trois cartes aient la même hauteur dans une fenêtre de
  880 px. L'avertissement sur l'écran de connexion sort donc des cartes.
- `EmptyRoster` passe par `EmptyState`, qui gagne un `footer` pour la bande du
  bas. Forker la coque revenait à recopier quatre chaînes de classes.
- Les six têtes ne passent pas par `CharacterMedallion` : ce composant grise un
  portrait déconnecté et pose un halo vert sur un connecté, deux états qu'aucune
  de ces six têtes n'a. Elles ne sont que du décor, et lisent `CLASS_PORTRAITS`
  en direct.
- Pas une animation sur cet écran. Ni cascade à l'ouverture, ni respiration sous
  la lampe : un écran qu'on lit une fois, et qu'on ne revoit plus. `rise` reste
  aux lignes du roster, qui elles arrivent en cours de partie.
