# La tête de classe se coupe

## Le constat

Sur Windows, les Réglages n'affichaient que quatre lignes au lieu de six.

- La ligne de la tête de classe n'existait que sur macOS, où elle portait la
  pastille WINDOWS. Sur Windows, Multifus posait la tête sans le dire et sans
  laisser le choix.
- La ligne du bouton par personnage disparaissait quand la barre des tâches ne
  regroupe rien (`TaskbarGlomLevel` à 2, « Ne jamais combiner »). Une ligne qui
  s'évapore selon un réglage de Windows ne s'explique pas.

## Ce qu'on décide

Six lignes partout, dans le même ordre, et six interrupteurs vivants.

- La tête de classe devient un vrai interrupteur sur Windows. On peut vouloir
  choisir la classe pour le médaillon du roster et laisser la barre des tâches
  tranquille.
- Le bouton par personnage garde son interrupteur même quand la barre des tâches
  ne regroupe rien. Il écrit un choix qui prendra effet le jour où Windows
  regroupera, et c'est la description de la ligne qui dit que rien ne bougera
  d'ici là. Un interrupteur mort mentait sur la valeur rangée dans le fichier.
- La modale de classe dit où la tête est restée quand elle ne part pas dans la
  barre des tâches : sur macOS comme avant, et désormais sur Windows dès que
  l'interrupteur est coupé.

## Le réglage

`paint_portraits`, à côté de `short_titles` et `ungroup_taskbar`, allumé par
défaut pour que rien ne change chez qui a déjà posé des têtes. Éteint, la
fenêtre reprend l'œuf de Dofus Retro par la Trace, comme au moment de quitter.

## À vérifier sur Windows

- [ ] Six lignes dans les Réglages, six interrupteurs qui répondent
- [ ] La tête coupée rend l'œuf de Dofus Retro aux fenêtres déjà peintes
- [ ] La tête remise repeint sans relancer le client
- [ ] Le médaillon du roster garde sa tête dans les deux cas
- [ ] La tête coupée, la modale de classe dit où la tête reste
- [ ] Le journal porte une ligne à chaque bascule
- [ ] Barre des tâches en « Ne jamais combiner » : la ligne du bouton par
      personnage dit « Déjà fait », et l'interrupteur garde la valeur qu'on lui
      donne
- [ ] Barre des tâches repassée en « Toujours combiner » : la ligne reprend sa
      description, et l'interrupteur agit
