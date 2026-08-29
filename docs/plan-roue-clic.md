# Un clic pendant la roue

Le joueur maintient la combinaison, le disque s'ouvre, et il clique sur une part.
Aujourd'hui le clic tombe sur la fenêtre de la roue, macOS met Multifus au
premier plan, la fenêtre principale passe devant le jeu, et le tour suivant
ferme la roue sans ramener personne. Le joueur voit Multifus s'ouvrir à la place
de son personnage.

## Ce qu'on veut

Un clic vaut un relâchement. La part cliquée passe devant, comme si le joueur
avait lâché les touches dessus. Un clic au centre ou hors du disque annule, la
même règle qu'au relâchement. Le clic est mangé : ni le jeu ni Multifus ne le
voient, et Multifus reste derrière.

Le jeu reste aveugle pendant la roue. La fenêtre garde la souris, et rien ne
s'allume derrière le disque. C'est la ligne du vocabulaire, et elle tient.

## Pourquoi le crochet, et pas la fenêtre

Une fenêtre prend la souris en entier ou pas du tout. La roue la garde, donc
c'est elle qui reçoit le clic, et macOS active l'application à qui appartient la
fenêtre cliquée. Rendre la souris ferait passer le clic au jeu, mais le survol
avec, et le jeu s'allumerait derrière le disque.

Reste le crochet du système, qui voit le clic avant que personne ne le reçoive.
Mangé là, le clic n'active rien. Ce crochet existe déjà pour le Déplacement
rapide, et c'est pour cela que le défaut ne se voit qu'une fois sur deux :
Déplacement rapide allumé, la porte tenue mange déjà le clic et rien ne saute ;
éteint, personne n'écoute.

## Les oreilles ne sont plus au seul Déplacement rapide

`app/clicks.rs` tient le crochet et la porte. Deux mécanismes les demandent, le
Déplacement rapide et la roue. Le premier qui demande ouvre le crochet, le
dernier qui rend le ferme.

- La porte (`ClickGate`) déménage de `Walk` vers `Clicks` : les deux la touchent,
  elle appartient aux oreilles.
- `Clicks` compte les demandeurs (`Asker::Walk`, `Asker::Wheel`) et n'appelle
  `start` qu'au premier, `stop` qu'au dernier.
- Le puits reste celui du Déplacement rapide, monté au démarrage, et la roue n'y
  passe pas.

## Le Déplacement rapide éteint oublie ses fenêtres

Le crochet ne tournait qu'avec le Déplacement rapide, et le plan de fenêtres qu'il
laissait derrière lui en s'éteignant ne gênait personne. Le crochet tournant
maintenant pour la roue seule, ce plan devient atteignable : un clic pris dans le
battement entre l'ouverture du crochet et la porte tenue partait en bascule, et
la bannière du Déplacement rapide se montrait sur l'arrivée, éteint.

`set_enabled` vide donc le plan et la liste de la porte en s'éteignant. Éteint,
le Déplacement rapide ne regarde plus une seule fenêtre, et ni le juge ni la
bannière n'ont de quoi répondre.

## La roue lit un compteur, elle n'attend pas un message

La porte compte les clics qu'elle mange pendant qu'on la tient
(`clicks_held_back`). La roue prend ce compte à l'ouverture, avant de tenir la
porte, et son fil de suivi le relit toutes les 16 ms avec la position du
curseur. Le compte a bougé, la roue appelle `release`, qui lit le curseur et
ramène la part visée.

Le compteur plutôt qu'un message parce que le fil du Déplacement rapide dort
jusqu'à 290 ms pendant une bascule : un clic annoncé par ce chemin arriverait en
retard. Le fil de la roue tourne déjà, il ne dort que 16 ms.

## Les deux boutons

Le bouton droit ouvre un menu dans le jeu, et il activerait Multifus tout pareil.
La porte tenue mange donc les deux boutons, et les deux valent un relâchement.
Le crochet du Mac écoutait le bouton gauche seul : son masque prend maintenant
le droit. Le juge garde une place par bouton, pour qu'un enfoncement mangé soit
suivi d'un relâchement mangé.

## Ce qu'on n'a pas fait, et pourquoi

- L'aperçu ne répond pas au clic. Il ne tient pas la porte, il dure deux
  secondes et demie, et rien ne l'attend derrière.
- Le crochet s'ouvre à chaque roue et se ferme avec elle, plutôt que de rester
  ouvert tant que Multifus tourne. Un crochet permanent verrait tous les clics de
  la machine sans jamais en avoir besoin.
- Le crochet se ferme sur l'enfoncement, et le relâchement du bouton peut donc
  arriver après lui, seul, dans le jeu. Un relâchement sans enfoncement ne fait
  rien dans Retro. À regarder sur le Mac.
- L'autorisation d'accessibilité refusée, le crochet ne démarre pas. La roue
  s'ouvre quand même, le journal le dit une fois, et le clic ramène Multifus
  devant comme avant.

## Ce que l'écran dit

L'écran Roue disait « Visez une tête, lâchez, la fenêtre passe devant ». Il dit
maintenant « lâchez ou cliquez ».

## À vérifier sur le Mac

- [ ] Déplacement rapide éteint, la roue ouverte, un clic gauche sur une part :
      le personnage passe devant, et Multifus ne se montre pas
- [ ] Le même clic au centre du disque, puis hors du disque : la roue se ferme et
      personne ne bouge
- [ ] Un clic droit sur une part : même chose qu'un clic gauche
- [ ] Après le clic, le personnage cliqué reçoit le clic suivant, et il marche
- [ ] Déplacement rapide allumé, un clic pendant la roue : la part cliquée passe
      devant, et l'équipe ne bascule pas d'un cran de plus
- [ ] La roue fermée, Déplacement rapide allumé : un clic dans le jeu bascule
      comme avant
- [ ] La roue fermée, Déplacement rapide éteint : un clic dans le jeu ne fait
      rien de plus que le jeu
- [ ] Rien ne s'allume dans le jeu derrière le disque, la roue ouverte
- [ ] Deux roues coup sur coup, un clic dans chacune : les deux ramènent la bonne
      fenêtre
- [ ] Le Déplacement rapide allumé puis éteint, une roue, un clic sur une part :
      la bannière ne se montre pas, et l'équipe ne bascule pas
