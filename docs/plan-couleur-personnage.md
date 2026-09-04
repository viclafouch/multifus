# La couleur du personnage

Une couleur choisie à la main par personnage, en plus du portrait de classe, pour
séparer des personnages que le portrait ne sépare plus.

## Où on en est

Écrit et vérifié sur le Mac, à la main et par les tests. Ce qui se voit à l'écran
est validé : la grille des couleurs, le liseré des trois listes, la roue, la
bannière.

Rien n'a été regardé à l'écran sur Windows. L'anneau du bouton de la barre des
tâches est le seul morceau que le Mac ne peut pas montrer, et c'est tout ce qui
reste à voir. Le code se compile et ses tests passent sur la machine Windows,
`create_icon` compris.

Ce fichier s'efface une fois l'anneau vu sur Windows.

## Le problème

Le portrait dit la classe, pas le personnage. Six Sadidas femmes connectés
portent six fois la même tête, dans la ligne du roster, dans la roue, et dans les
six boutons de la barre des tâches. Le pseudo les sépare, mais il se lit ; le
portrait se voit. Au moment où on choisit une part de roue, combinaison
maintenue, on n'a pas le temps de lire.

La couleur est la deuxième dimension. Le portrait dit la classe, la couleur dit
qui.

## Les douze couleurs

Le tableau de départ du plan ne tenait pas son propre contrôle : trois couleurs
tombaient hors du sRGB, le vert était à 0,062 de `--live`, et sous protanopie le
jaune et le vert se rejoignaient à 0,025. La palette a donc été recalculée.

**Deux exclusions que le plan n'avait pas vues.** L'ambre `--primary` est le
fond d'une part de roue sans couleur : une couleur orange s'y lirait comme
« pas de couleur ». Et `--live` est le vert du connecté. Les douze s'écartent
des deux. En revanche le rouge `--destructive` de l'exclu n'écarte rien : il
n'est jamais une pastille, seulement une bordure de médaillon sur une ligne
déjà barrée, et une palette sans rouge coûterait plus qu'elle ne rapporte.

**La structure en quatre étages de trois est tombée.** Elle donnait, à
nameabilité égale, un plancher dichromate plus bas qu'une répartition libre.
Les douze portent douze clartés distinctes, de 0,90 à 0,52, et douze teintes
qui font le tour du cercle.

| Français  | Code        | oklch                   | sRGB          |
| --------- | ----------- | ----------------------- | ------------- |
| Rouge     | `red`       | `oklch(0.6 0.223 8)`    | 228, 35, 102  |
| Orange    | `orange`    | `oklch(0.68 0.207 42)`  | 251, 94, 0    |
| Terre     | `earth`     | `oklch(0.54 0.13 46)`   | 170, 82, 34   |
| Jaune     | `yellow`    | `oklch(0.9 0.197 110)`  | 231, 232, 0   |
| Vert      | `green`     | `oklch(0.62 0.211 142)` | 12, 163, 0    |
| Sapin     | `pine`      | `oklch(0.52 0.11 166)`  | 0, 124, 90    |
| Turquoise | `turquoise` | `oklch(0.66 0.113 202)` | 0, 166, 176   |
| Ciel      | `sky`       | `oklch(0.8 0.143 222)`  | 33, 209, 255  |
| Bleu      | `blue`      | `oklch(0.56 0.243 262)` | 17, 99, 255   |
| Lavande   | `lavender`  | `oklch(0.7 0.186 300)`  | 177, 126, 255 |
| Violet    | `violet`    | `oklch(0.59 0.285 320)` | 193, 0, 226   |
| Rose      | `pink`      | `oklch(0.74 0.205 344)` | 255, 108, 202 |

### Ce que le contrôle mesure

`constants/colors.test.ts` lit `theme.css`, en tire les douze couleurs et les
trois repères du thème, et refuse la palette qui ne tient pas. Il porte sa
propre colorimétrie : oklch vers sRGB, et la simulation de Viénot 1999 pour la
deutéranopie et la protanopie. Les seuils, et ce que la palette atteint :

| Mesure                                     | Seuil  | Atteint |
| ------------------------------------------ | ------ | ------- |
| Distance ΔE-ok, vision normale             | ≥ 0.14 | 0.150   |
| Distance ΔE-ok, deutéranopie               | ≥ 0.07 | 0.076   |
| Distance ΔE-ok, protanopie                 | ≥ 0.07 | 0.081   |
| Distance à `--live`                        | ≥ 0.16 | 0.172   |
| Distance à `--primary`                     | ≥ 0.14 | 0.158   |
| Écart entre l'oklch et le sRGB rendu       | ≤ 0.01 | 0.002   |
| Distance entre deux parts de roue au repos | ≥ 0.06 | 0.082   |
| Contraste du pseudo sur une part           | ≥ 4.5  | 4.94    |
| Contraste du pseudo sur une part survolée  | ≥ 3.0  | 3.37    |

Les trois dernières lignes comptent l'ambre avec les douze : une part sans
couleur est une treizième couleur, et elle doit se séparer des autres comme
elles.

Le test lit aussi `domain/character.rs`, en tire les douze `Color::rgb` au
peigne, et les compare octet par octet au sRGB qu'il calcule depuis `theme.css`.
C'est ce qui relie les deux côtés du pont : la table Rust sert à peindre
l'anneau de l'icône Windows, et toucher `theme.css` sans toucher le Rust casse
le test en nommant la couleur qui a bougé. Rien n'est écrit deux fois à la main :
le test ne porte aucune valeur, il ne fait que confronter les deux fichiers.

## Où la couleur se voit

**Le fichier de thème est la seule source.** `theme.css` porte `--red`, `--sky`,
… à côté de `--male`, `--female` et `--live`, et une utilitaire `tint-<nom>` par
couleur pose `--tint`. C'est l'idiome déjà en place pour `sign-male` et
`--sign`. Rien n'écrit une couleur en dur dans un composant.

**Toute ligne qui porte un personnage.** Un liseré vertical au bord gauche, dans
le roster, dans les Raccourcis et dans les Messages privés : les trois écrans qui
listent des personnages passent par `CharacterRow` ou `CharacterLine`, et les
deux portent le même liseré. La bordure du médaillon ne bouge pas : elle dit
l'état.

Le nom de la couleur ne sort pas du dialogue. Il a d'abord été posé sous le
pseudo, en garde-fou pour qui ne distingue pas les couleurs ; c'était une
mauvaise lecture du besoin. Le pseudo dit déjà qui est qui, en toutes lettres :
la couleur n'est qu'un raccourci pour l'œil, jamais le seul porteur de
l'information, et rien ne se perd à ne pas l'épeler. « Sapin » ne dit rien à un
joueur qui n'ouvre Multifus qu'une fois par mois. Le journal, lui, garde le nom,
parce qu'un journal est du texte et qu'une pastille n'y tiendrait pas.

**La roue.** Chaque part porte sa couleur dès le repos, pleine, sans rien
attendre du survol. Une part sans couleur porte l'ambre : `--tint` retombe sur
`--primary`, et le disque est toujours entièrement peint. Le survol ajoute une
petite marche de clarté, et « ici » une plus petite encore.

Le premier dessin ne teintait la part qu'à 26 %, d'une couleur déjà tirée vers
le gris : deux parts voisines ne se séparaient que de 0,02 en ΔE, autant dire
pas du tout, et il fallait survoler ses huit Sacrieurs un par un pour trouver le
sien. La roue ne servait donc à rien. Les parts portent maintenant leur couleur
assombrie de 45 %, ce qui les sépare de 0,082 au repos, quatre fois mieux.

Le 45 % n'est pas un réglage d'humeur : c'est ce qui garde le pseudo blanc
lisible sur les douze. Assombries d'autant, la plus claire, le jaune, tombe à
une clarté de 0,495, où le pseudo garde 4,9 pour 1. Au survol, marche comprise,
il en garde encore 3,4. Le test lit les deux pourcentages dans `theme.css` et
refuse toute part qui descendrait sous ces seuils, ou deux parts qui se
rapprocheraient trop.

**La bannière.** Le liseré du même dessin que la ligne, au bord de la pastille.

La couleur pâlit avec le reste quand le personnage est déconnecté : la ligne
entière porte déjà `dimmed`, et le liseré s'éteint comme le portrait passe en
noir et blanc. Rien à écrire pour ça, c'était la question laissée ouverte.

**Le dialogue.** `class-dialog.tsx` devient `character-dialog.tsx`. Une couleur
déjà prise se montre creuse plutôt que pleine, et son libellé dit qui la porte.
C'est une différence de forme, pas de couleur : elle tient sous daltonisme.

Trois retours, parce que douze pastilles muettes ne disaient rien de ce qu'on
faisait. La pastille portée s'entoure d'un halo de sa propre couleur, dans
l'idiome de `sigil-lit` juste au-dessus. Celle qu'on approche prend un cerne
clair. Et la ligne du titre de la section nomme, à droite du mot « Couleur », la
couleur approchée, ou à défaut celle du personnage, ou « Aucune couleur » : on
balaie la grille et on lit le nom. Le clavier fait pareil que la souris, le halo
d'approche répondant au focus comme au survol, et le liseré du personnage se
pose en tête de la modale, là où le regard revient après un clic.

La ligne remplace la note qui expliquait les pastilles creuses : elle dit
« Ciel · déjà pris par Bravo » au moment où on est dessus, ce que la note disait
en général et hors de propos.

Une quatrième section allonge le dialogue, et il ne tenait plus dans une fenêtre
à sa hauteur minimale, 520 points : il débordait par le haut et par le bas, sans
rien à faire défiler. La grille des classes passe donc de quatre colonnes à cinq,
ce qui lui enlève une ligne, et le corps du dialogue se plafonne et défile.
C'était déjà limite avant la couleur ; ça ne l'est plus.

**Le bouton de la barre des tâches, Windows.** Un anneau composé au moment de
poser.

Sur le Mac il n'y a pas de bouton par fenêtre : `set_window_icon` est un no-op,
et le Dock ne montre qu'une icône pour Dofus. L'asymétrie est du système.

## L'icône Windows, sans rien de neuf

Le plan proposait `CreateIconIndirect` et une caisse de décodage. Ni l'un ni
l'autre n'a servi.

Les vingt-quatre `.ico` portent trois images de 16, 32 et 48 points, toutes en
DIB 32 bits non compressé : en-tête de 40 octets, puis des lignes BGRA de bas en
haut. Les décoder tient en vingt lignes de Rust pur, sans dépendance.

`create_icon` appelait déjà `CreateIconFromResourceEx` sur l'image que
`icon_image` tire du `.ico`. On glisse la composition entre les deux : décoder,
réduire le portrait au centre par filtre-boîte en alpha prémultiplié, poser
l'anneau autour, réencoder un DIB de la même forme. La fonction est pure, elle
vit dans `platform/window.rs` à côté de `icon_image`, et ses tests tournent sur
le Mac. Aucun appel Windows nouveau, rien sur le disque, et le `HICON` reste
détruit au remplacement comme avant.

Une fenêtre sans portrait ne prend pas d'anneau : il n'y a pas d'icône à nous
sur laquelle le poser, et le client garde son logo Dofus.

## Ce qu'on ne fait pas

Le portrait reste calculé, classe croisée avec sexe.

Pas de couleur libre au sélecteur, pas de couleur posée d'office, pas de
garde-fou contre la couleur partagée.

Rien dans le menu de la barre système.

Le signal du connecté n'a pas bougé : la couleur est un liseré au bord de la
ligne, le vert est une bordure de médaillon, et rien ne s'est brouillé.

## Ce qui reste, sur Windows

Le premier point est le seul qui compte : c'est le seul morceau que le Mac ne
sait pas montrer. Les autres ne sont là que parce qu'ils touchent au même code.

- **L'anneau.** Poser une couleur sur un personnage connecté qui a une classe, et
  regarder le bouton de la barre des tâches et l'alt-tab : l'anneau doit être là,
  net, aux deux tailles, l'une n'étant pas l'autre mise à l'échelle. Retirer la
  couleur, l'anneau part et le portrait reste. Retirer la classe, le client
  reprend son logo Dofus.
- **La trace.** Quitter Multifus avec des couleurs posées : les icônes d'origine
  reviennent, comme pour un portrait sans couleur.
- **Un personnage sans classe mais avec une couleur.** Sa fenêtre ne doit rien
  prendre du tout : pas d'anneau posé sur le logo Dofus.

## Une fois livré

- La ligne de la couleur s'enlève de [plan.md](./plan.md).
- La ligne « Couleur libre par compte » de `concurrents.md` et de
  `concurrents.html` est corrigée : elle devient « Couleur par personnage », et
  Multifus, Dracoon et Focus Retro la cochent tous les trois. Le mot « libre »
  était faux pour deux d'entre eux sur trois.
- Ce fichier s'efface.
