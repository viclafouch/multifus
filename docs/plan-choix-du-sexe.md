# Le choix du sexe

## Ce qu'on répare

Dans la modale d'un personnage, le sexe se choisissait à deux boutons de texte
gris, « Homme | Femme », posés dans un cadre. Rien n'y rappelait Dofus, et la
grille de classes juste au-dessus, elle, est faite de têtes. L'œil descendait
d'une planche de portraits vers un réglage de formulaire.

## Ce qu'on fait

- Le sexe se choisit en premier, au-dessus de la grille des classes : les têtes
  de la grille prennent le sexe posé, et la question ne se pose plus après.
- Il se choisit à deux sceaux : un disque bombé cerclé d'un anneau clair,
  avec le signe de Mars ou de Vénus gravé au centre. Turquoise pour l'homme,
  prune pour la femme, les deux couleurs du jeu.
- Le sceau non choisi reste en retrait, pâli et désaturé. Il reprend ses
  couleurs sous la souris, et le sceau choisi garde un halo de sa propre
  couleur. Le mot sous le sceau passe du gris au blanc quand il est choisi.
- L'étape qui suit le choix d'une classe — les deux portraits de la classe,
  homme et femme — perd ses mots : chaque portrait porte son sceau en dessous.
  Le portrait dit déjà lequel est lequel, le nom reste pour le lecteur d'écran.

## Ce qu'on a décidé

Les deux couleurs sont les seules de la fenêtre : tout le reste garde l'ambre et
le gris du thème. Les tons `--male` et `--female` vivent dans `theme.css` à côté
de `--live` et `--idle`, et les trois utilitaires `sign-*`, `sigil` et
`sigil-lit` dans `index.css`, sur le même modèle que `tone-*` et `toned`.

Le sceau se dessine dans un seul composant, `GenderSigil` : il porte sa couleur
et son glyphe, et rien de son état. Le retrait, le halo et la réaction à la
souris viennent de l'écran qui s'en sert, parce qu'ils ne sont pas les mêmes
d'un écran à l'autre.

Le signe gravé garde 4,6 fois le contraste de son disque, 4 fois quand il est en
retrait : au-dessus des 3 fois qu'un élément graphique demande.

## À vérifier sur l'autre machine

- [ ] La modale d'un personnage : « Sexe » vient avant « Classe », avec deux
      sceaux ronds, Mars en turquoise et Vénus en prune, leur mot dessous
- [ ] Le sexe posé avant la classe : les douze têtes de la grille changent de
      sexe, et cliquer une classe ferme la modale sans rien demander de plus
- [ ] Aucun sexe choisi : les deux sceaux sont pâles, et reprennent leurs
      couleurs quand la souris passe dessus
- [ ] Un sexe choisi : son sceau s'allume d'un halo de sa couleur, son fond
      s'éclaircit, et son mot passe au blanc
- [ ] Le même sceau cliqué de nouveau : le sexe se retire, le halo s'éteint
- [ ] Poser une classe sur un personnage sans sexe : les deux portraits de la
      classe, chacun avec son sceau dessous et plus aucun mot
- [ ] Le clavier seul : la tabulation atteint les deux sceaux, l'anneau de focus
      se voit sur le fond sombre
