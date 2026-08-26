# La classe à choisir

## Ce qu'on répare

Dans Personnages, un personnage sans portrait portait l'initiale de son pseudo
dans un rond gris pointillé. L'initiale ressemble à un choix déjà fait : rien ne
dit que le rond s'ouvre, et la classe reste vide pour toujours.

## Ce qu'on fait

- Le rond sans portrait porte un `?` doré, en Fraunces, sur un fond doré léger.
  La couleur du bord garde l'état, elle ne change pas.
- Le fond monte d'un cran quand la souris est sur le rond, et une bulle dit ce
  qui manque : « Choisir la classe de X », puis « Choisir le sexe de X » une fois
  la classe posée, puis « Changer la classe ou le sexe de X » une fois les deux
  choisis. La bulle et l'étiquette du lecteur d'écran disent la même phrase.
- La ligne sous le pseudo dit la même chose que le rond : « Classe à choisir »,
  « Sexe à choisir », et la classe seulement quand le portrait est complet. Le
  `?`, la bulle et la ligne répondent tous les trois au même manque.
- Le médaillon perd son `nickname` : il ne s'en servait que pour l'initiale. Le
  gris du déconnecté passe sur le portrait, pour que le `?` reste doré même hors
  ligne.

## Ce qu'on a décidé

Le rond des messages privés porte le même `?`, sans être un bouton : cet écran
dit qui est relayé, il ne change pas les personnages. Le `?` doré y reste un
rappel, et l'écran Personnages reste le seul endroit où on choisit.

Le mot **mule** sort du projet, ici et partout : `CONTEXT.md`, le sous-titre du
Déplacement, et les trois lignes des plans. On dit personnage, point. Le
`simule` du `README` est un autre mot, il reste.

## À vérifier sur l'autre machine

- [ ] Un personnage sans classe : `?` doré, bulle « Choisir la classe de X », la
      ligne dit « CLASSE À CHOISIR », et le clic ouvre bien la modale
- [ ] Le même une fois la classe posée sans le sexe : le `?` reste, la bulle et
      la ligne réclament le sexe
- [ ] Le même une fois les deux posés : le portrait remplace le `?`, la ligne dit
      la classe, la bulle propose de changer
- [ ] Un personnage déconnecté sans classe : le `?` reste doré, la ligne entière
      reste pâle, et un portrait complet vire au gris
- [ ] La bannière du Déplacement sur un personnage sans portrait : `?` doré aussi
- [ ] Les messages privés : la liste porte le même `?`, et le rond ne s'ouvre pas
- [ ] L'écran Déplacement : le sous-titre ne dit plus « mule »
