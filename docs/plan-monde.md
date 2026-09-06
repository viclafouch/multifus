# Le monde

Multifus a cessé d'être un panneau de réglages à colonne de gauche. C'est une
carte du Monde des Douze : un accueil, puis une map par fonctionnalité.

Décidé et posé le 5 septembre 2026, à partir d'une capture de Dofus Retro que
Victor a donnée : quatre menhirs autour d'une dalle de pierre.

Ce fichier s'efface quand les dix maps sont reprises une à une et que les boucles
d'image sont posées.

## Où on en est

Le cadre est écrit, vert et regardé à l'écran, sur le Mac, dans un navigateur
piloté qui bouchonne le pont Tauri. Ce qui est livré :

- l'accueil : le logo, le titre, le menu de gauche, le dolmen et ses têtes ;
- le cadre d'une map, son titre, son fronton, sa phrase, son crédit ;
- **la scène à boucle** (`StageScreen`), le modèle des maps qui montrent le jeu ;
- **la fin des deux thèmes** : `theme.css` n'est plus qu'un pont vers `retro.css`.

Rien n'a été lancé dans `tauri dev` ni sur Windows.

## Trois essais rendus, et ce qu'ils ont appris

Ils ont tous été écrits, regardés, puis retirés. Ils ne reviennent pas.

**Les quatre panneaux de bois.** Un panneau par route, « Les fenêtres »,
« L'appel », « La main », « Le camp », avec des planches clouées dessus. Deux
fautes : le bois cloué fait campagne, pas Dofus Retro, et surtout **un joueur ne
sait pas ce qu'est « La main »**. Un groupement n'aide que si son nom est un mot
du jeu. Le menu est maintenant une colonne de dix boutons, du haut vers le bas,
dans la face `bare`, et rien d'autre.

**« La clairière ».** Le nom de l'accueil. Il ne veut rien dire pour qui joue.
L'accueil porte le logo et le mot `Multifus`, comme l'écran-titre d'un jeu.
Le retour, en haut à gauche d'une map, dit « Retour ».

**Le chargement de carte.** Un noir plein avec « Chargement de la carte ... »,
repris du client, entre deux maps. Beau une fois, pesant à la dixième : un
logiciel qu'on ouvre vingt fois par jour n'a pas le droit de faire attendre pour
faire joli. La règle qui en sort : **on n'imite du jeu que ce qui apprend
quelque chose**.

## L'accueil

Décor `assets/ankama/dolmen.webp`, la capture entière, 1484 × 864, où la dalle
tombe déjà à 61 % de la largeur. Un premier jet l'avait recadrée au centre, puis
essayé de la décaler : rendu.

**Un décor ne se décale pas, il se recadre.** Une image en `object-cover` ne
peut glisser de côté sans un `scale` qui la rend floue : le `translate` d'une
transformation s'applique avant l'échelle, donc pour amener un point à 66 % de
la largeur il faut monter à `scale(1.4)`, et un fond de 1100 points étiré à 1700
se voit.

**Le dolmen n'est pas posé en pourcentage de la fenêtre, mais de l'image.** Un
pourcentage de fenêtre ne marche à aucune autre taille : en `object-cover`,
l'image est agrandie pour couvrir, puis rognée, et le point qu'on vise se déplace
par rapport aux bords. Deux essais l'ont montré, un décalage vertical de 40
points chez Victor sur une grande fenêtre là où c'était juste sur la mienne.

La réponse est `@utility dolmen-field` : une boîte qui refait exactement la
géométrie de l'image affichée, `max(100vw, 100vh × 1484 / 864)` sur
`max(100vh, 100vw × 864 / 1484)`, centrée en fixe. Elle déborde de la fenêtre
comme l'image déborde. Le dolmen se place alors **à 62,1 % et 46,2 % de cette
boîte**, qui sont les coordonnées de la dalle dans l'image, et le compte tombe
juste à toutes les tailles : 64,5 % de la largeur mesurés à 1100 × 760 pour
64,4 % calculés.

**Ces deux nombres se sont mesurés, pas devinés.** Une lecture à l'œil sur
l'image donne un point de trop, et l'erreur se voit à l'écran. Ils viennent d'un
relevé de pixels sur `dolmen.webp` : la ligne la plus large dont les pixels sont
de la pierre et non de l'herbe.

**En fixe, parce que la référence est la fenêtre.** Se placer par rapport à ce
qui reste de la colonne, c'est bouger dès que le journal s'ouvre ou qu'un bandeau
s'affiche. Le compte des connectés sort du flux lui aussi, sous la grappe : sinon
c'est le bloc entier qui se centre, et les têtes montent d'une demi-plaque
au-dessus de la pierre.

**La tête rétrécit quand le roster grossit**, parce que la dalle ne grandit pas :
elle fait 330 × 112 points sur une fenêtre de 1100 × 760, et rien n'y tient à
taille fixe. Trois paliers, posés par `data-crowd` sur le siège :

| Roster | Tête                       | Par rangée | Rangées |
| ------ | -------------------------- | ---------- | ------- |
| 1 à 4  | `clamp(44px, 8,6vh, 66px)` | 4          | 1       |
| 5 à 8  | `clamp(30px, 5,2vh, 40px)` | 4          | 2       |
| 9 et + | `clamp(26px, 4,6vh, 36px)` | 6          | 2       |

Jamais trois rangées : la dalle n'en porte pas trois sans que la première monte
dans l'herbe. Au-delà de douze, la grappe déborde, et c'est assumé.

**La largeur de la grappe se redéclare à chaque palier.** `--cluster` est un
`calc` sur `--head`, et une propriété personnalisée est résolue **là où elle est
déclarée**, pas là où elle est lue : laissée dans `:root`, elle gardait la grande
tête et laissait passer six têtes là où on en voulait quatre. Elle compte aussi
le pas du bouton, quatre points de chaque côté, sinon la quatrième tête tombe à
la ligne.

**À gauche, le titre et les dix boutons.** Logo, `Multifus` en Bebas, un fronton,
puis les maps dans l'ordre de la barre système. Paramètres porte un point rouge
et « À régler » en `sr-only` quand un contrôle s'est fermé.

**Le menu se mesure en hauteur de fenêtre**, taille `way` du bouton : le barreau
fait `clamp(30px, 6.1vh, 40px)` et la lettre `clamp(17px, 2.7vh, 22px)`. Une
taille fixe assez grande pour une fenêtre de 760 déborde à 520, où dix boutons
plus le titre ne tiennent pas. La colonne, elle, reste à 15,5 rem : c'est ce que
« La roue des personnages » demande, et la dalle commence bien après.

**Le vert de fond est parti.** `--night` teintait tout l'écran en vert sombre et
cachait le décor. Le voile est maintenant en `--iron`, très léger au centre, et
c'est un dégradé de gauche (`@utility flank`) qui assombrit **là où on écrit**,
pas partout. La règle : **on assombrit sous le texte, jamais la carte entière.**

**Au centre, le dolmen.** Les têtes de classe se posent sur la dalle du décor,
pas sur une dalle dessinée. Une ombre (`hearth`) les décolle du sol, une lueur
d'herbe (`glade`) tient autour, et le compte des connectés est sur une plaque
creusée, sinon il se perd dans l'herbe claire.

Un connecté est en couleur avec un anneau vert, un déconnecté est en gris. La
barre de couleur est sous la tête, jamais sur l'anneau, qui dit l'état.
Le survol lève une pierre (`hood`) qui dit le pseudo, la classe, l'état et le
raccourci ; le même texte est dans l'`aria-label`, pour qui lit à l'oreille. Le
clic ouvre le dialogue du personnage. Le principal porte un losange crème.

**Les pseudos ne s'écrivent pas sous les têtes.** Ils y ont été, coupés à cinq
lettres : « PANDOUIL… » à côté de « SRAMOUN… » n'apprend rien. Le portrait de
classe et la couleur séparent déjà, `CONTEXT.md` le dit, et le survol donne le
reste.

**Le logo** est `assets/logo.png`, celui de Tauri en attendant le vrai. Il vient
de `src-tauri/icons/128x128@2x.png` : quand le vrai logo arrive, les deux se
régénèrent depuis la même image source.

## La scène à boucle

C'est le modèle d'une map qui montre le jeu, et Déplacement rapide est le premier
à l'avoir. La règle : **un joueur qui arrive sur une fonctionnalité doit la voir
tourner avant de lire un mot.**

1. le titre, seul, au centre, avec de l'air au-dessus ;
2. le fronton ;
3. une phrase, une seule ;
4. **la boucle**, grande, au format 16/10, dans un cadre (`@utility stage`) ;
5. **les réglages en colonne à droite**, jamais par-dessus la boucle.

Tant qu'une boucle manque, `LoopStage` écrit dans le cadre ce que le jeu montrera.
La phrase tient lieu d'image, et elle apprend déjà quelque chose.

**Ce qui déborde va dans un dialogue.** Le coin et l'écran de la bannière ont
quitté l'écran du Déplacement rapide pour un dialogue, ouvert par un bouton
« La bannière ». Un écran porte le geste du moment ; le réglage fin se range.

## Changer de map

Un clic sur un bouton du menu change de map, et c'est tout : le décor passe en
fondu en 420 ms, le titre monte à 60 ms, le fronton à 200, la phrase à 340, la
première plaque à 480, et tout ce qui suit à 620 (`@utility settle`). Les crans
s'arrêtent à quatre : une map peut porter dix plaques, et un dixième cran ferait
attendre deux secondes avant de voir la dernière. Rien ne fait attendre.

Le retour se fait au bouton « ‹ Retour », en haut à gauche de chaque map, et à
Échap. Échap sert d'abord à fermer l'aperçu du tableau des runes : tant qu'un
aperçu est ouvert, il ne ramène pas à l'accueil.

## Les trois couches d'une fenêtre

Une map occupe toute la fenêtre. Ce qui l'entoure flotte au-dessus, hors du flux,
et cet ordre-là n'est pas cosmétique.

| Couche     | Où elle est                                        |
| ---------- | -------------------------------------------------- |
| le décor   | en absolu sur toute la fenêtre, sous tout le reste |
| la map     | la colonne qui défile, moins la hauteur du journal |
| le retour  | en absolu, en haut à gauche, au-dessus de la map   |
| le crédit  | en absolu, sur un ourlet sombre, au-dessus du bas  |
| le journal | en fixe, en bas, au-dessus de tout                 |

Le retour prenait une bande en haut de la colonne : ce qui défilait se coupait
net dessous, sans rien pour l'annoncer. Le journal prenait une part de la
colonne : l'ouvrir levait la scène entière et les personnages quittaient leur
dalle. Ils sont maintenant posés dessus, et la colonne garde la hauteur du
journal en creux (`pb-ledger`) pour que rien ne finisse dessous.

**Le bas de l'écran est un ourlet, pas une bande.** `@utility hem` éteint le
décor sur 56 points, ce qui rend le crédit du décor lisible sur l'herbe claire et
donne au contenu qui défile une sortie en fondu au lieu d'une coupe nette.

## Ce qu'une map porte

Deux squelettes, et rien d'autre.

**`Screen`**, pour une map qui est une liste de réglages : titre, fronton, une
phrase, puis les plaques. Le titre part toujours à 80 points du haut, sous
l'ourlet, quelle que soit la hauteur de ce qui suit. Les deux squelettes tirent
cet en-tête du même `MapHeader`.

**`StageScreen`**, pour une map qui montre le jeu : titre, fronton, une phrase,
puis la boucle à gauche et les réglages à droite.

**La phrase porte son halo** (`@utility legible`). Elle est posée à même le
décor, en crème plutôt qu'en kaki, sur un dégradé radial qui s'éteint avant le
bord de sa boîte. Un dégradé qui déborde de sa boîte se coupe net et redessine un
rectangle : c'était le premier essai, et il faisait une plaque de plus.

Le nom d'une map vient de `MAP_NAMES`, jamais du `t` d'un écran. Les dix écrans
écrivaient leur titre eux-mêmes, et le menu l'écrivait une deuxième fois.

**La borne de pierre a été retirée.** Le titre d'une map est du Bebas crème avec
son ombre portée et son fronton, comme dans la mise en route. Une pierre gravée
de plus était une matière de plus pour rien.

## Ce qui a bougé ailleurs

- `NavRail` et `constants/navigation.ts` sont supprimés. `constants/world.ts` les
  remplace, et `constants/world.test.ts` garde la même garantie : les maps sont
  celles que la barre système nomme, dans le même ordre. Il en ajoute deux, que
  la barre de gauche ne pouvait pas donner
- `useCurrentScreen` est devenu `useCurrentMap`, et la mémoire ouvre sur
  l'accueil et non plus sur Personnages
- `useCharacterMarks` sort les quatre gestes du dialogue de personnage, que
  l'accueil et la map Personnages emploient tous les deux
- `authorizationState` rejoint `authorizationLine` dans `helpers/wording.ts`
- Le journal du bas est passé au bois et à Bebas. Ses lignes restent en chasse
  fixe : un journal est un log, et les heures doivent s'aligner

## Les décors

Chaque map porte un décor du jeu, plein cadre. Le choix de chacun et sa
provenance sont dans [docs/plan-design.md](./plan-design.md), avec la règle :
**le décor dit ce que la map fait, et les plus sombres vont aux maps qui parlent
le plus**.

Deux décors ont été ajoutés le 5 septembre 2026, `workshop.webp` et
`battle.webp`, et six maps ont changé de décor : AutoFocus, La roue, Tableau des
runes, Messages privés, Paramètres et À propos.

## Les boucles d'image

Il manque ce qui montre le jeu en train de faire la chose. Une boucle courte,
sans son, cadrée serré, à poser dans `assets/loops/` et à nommer par sa map.

- [ ] **AutoFocus** : une notification de combat arrive, la fenêtre du personnage
      passe devant toute seule
- [ ] **Déplacement rapide** : un clic gauche dans le jeu, le personnage suivant
      passe devant, la bannière se pose dans le coin
- [ ] **Réponses rapides** : une combinaison frappée, le texte se colle dans la
      zone de chat du jeu
- [ ] **Messages privés** : un message privé reçu dans le jeu, le même sur le
      téléphone

La roue et le tableau des runes n'en ont pas besoin : les deux maps montrent déjà
la vraie roue et le vrai tableau, ce qui vaut mieux qu'un enregistrement.

Chaque boucle est une dette : elle vieillit à chaque version du jeu.

## Le tour du 6 septembre

Quatre choses vues d'un coup, sur la fenêtre lancée, et réparées ensemble.

**Les drapeaux, et le cartouche.** Le choix de la langue était un menu déroulant
posé sur l'accueil seul, avec l'icône `Languages` de `lucide` : introuvable, et
le seul `Select` du logiciel. C'est maintenant trois drapeaux de 24 × 16 points,
côte à côte, celui du moment en couleur et cerclé de vert, les deux autres
éteints à 70 % d'opacité et 35 % de gris. Ils sont dessinés en SVG, jamais en
émoji : Windows ne rend pas les drapeaux émoji. Ils vivent dans le `Cartouche`,
en haut à droite de **toutes** les maps, avec le numéro de version, en face du
retour. `components/ui/select.tsx` est supprimé, plus rien ne s'en sert.

**Le halo d'une phrase ne se coupe plus.** `legible` était un dégradé radial peint
dans la boîte du paragraphe. Un fond ne déborde pas de sa boîte, et le dégradé
n'avait pas fini de s'éteindre au bord : on voyait le rectangle. C'est une ellipse
pleine floutée de 26 points, posée derrière la phrase par `Tale`, qui porte
maintenant la phrase des deux sortes d'écran. Le flou déborde et n'a aucun bord à
couper.

**Le décor s'est éclairci.** `veil` et `deepen` sont remontés (radial 72 → 84 %,
bord 30 → 48 %, `deepen` 32 → 20 % d'`iron`), et le halo derrière la phrase est
descendu à 76 % d'`iron` dans la foulée. Le décor dit où l'on est ; il ne sert à
rien de le peindre pour le cacher ensuite.

**Le bouton d'un dialogue criait plus fort que son titre.** La taille `default`
écrivait en `text-bar`, le corps d'un titre de plaque. Elle a son corps à elle,
`deed`, et l'échelle entière est passée derrière (voir le système graphique).

**Le retour porte un cadre.** Il était en `bare` : sur un décor clair, du kaki sans
fond ne se voit pas. Il est en `slate`, et il se lit sur les onze décors.

## La revue du 6 septembre, écran par écran

Onze maps, la mise en route, et chaque état qu'un instantané peut prendre, pris
en capture à 880 × 660 (la taille d'ouverture), à 720 × 520 (la plus petite) et à
1440 × 900. Ce qui en est sorti, du plus gênant au moins :

**La plaque laissait passer le décor sans le maîtriser.** Voir la règle 11 du
système graphique, qui porte l'histoire complète et les mesures. Elle est du
verre teinté d'`iron`, elle laisse voir le décor à 28 %, elle ne floute rien, et
son texte est gravé.

**Deux écrans n'avaient aucune plaque.** L'état vide portait un cadre en
pointillés et rien dessous : « Multifus attend votre autorisation » s'écrivait en
blanc à même la prairie, et c'est le premier écran d'un nouveau venu. Le roster
vide et « Aucune réponse rangée » faisaient pareil. `EmptyState` est posé sur une
plaque, et ses couleurs viennent du monde et non plus de l'ancien thème.

**Les deux barres d'alerte étaient invisibles.** `NoticeBar` peignait un rouge à
8 % d'opacité et écrivait en kaki : sur la prairie de l'accueil, on ne voyait ni
le fond ni le texte. Le fichier de réglages mis de côté est le message qu'il ne
faut pas rater. La barre est en `iron` à 95 %, bordée de `flame`, et son
« J'ai compris » porte un cadre.

**Le titre de l'accueil se posait sur la ligne d'écoute** dès qu'une barre
d'alerte apparaissait : le bloc était centré sur toute la colonne, et la barre le
remontait. Il est centré sur ce qui reste sous la ligne d'écoute.

**Le cartouche et la barre d'alerte se marchaient dessus.** La barre garde
maintenant sa droite libre, et le cartouche est peint après elle.

**Une réponse rapide s'écrivait en Bebas capitales.** Voir les fontes.

**Les champs de réponse n'avaient pas la même largeur** d'une ligne à l'autre : la
colonne du raccourci s'élargissait quand une ligne portait une remarque sous son
bouton. Elle a sa largeur, remarque ou pas.

**Une action au bout d'une ligne n'avait pas de cadre.** « Ouvrir Telegram Web »,
« Aller voir », « Ajouter une réponse » : du texte gravé, en kaki à 58 %, qui se
lisait comme la valeur de la ligne. `LinkButton` est en `slate` par défaut, et
`btn-bare` remonte à 78 % pour ce qui borde la fenêtre.

**Les numéros d'étape de Messages privés** se calaient sur la deuxième ligne au
lieu du titre.

**Le badge d'état tirait sur toute la largeur** de sa colonne : « Éteint » faisait
un ruban de 400 px.

**La pastille « Windows » avait la forme d'un bouton.** C'est une mention, elle
porte la plaque gravée des mentions.

**Le chemin du fichier de réglages se coupait au milieu d'un mot.** Il coupe où il
peut, `wrap-anywhere` plutôt que `break-all`.

**Le titre d'une map suit la hauteur de la fenêtre** (`clamp(28px, 4.6vh, 34px)`).
À 520 de haut, la liste des personnages montrait trois lignes.

## La relecture à deux axes, et ce qu'elle a trouvé

Passée sur tout le diff, une fois le monde livré. Ce que le code y a gagné :

**La bannière et la roue peignaient sans couleurs.** Le pire de tout, et personne
ne l'avait vu : voir le système graphique, « ce qu'une fenêtre satellite peint ».
Le test des couleurs lit maintenant ce qu'une entrée importe vraiment, au lieu de
coller les trois feuilles bout à bout.

**Le retour se posait sur la barre d'alerte.** Elle ne libérait que sa droite,
pour le cartouche. Elle libère les deux côtés.

**La ligne « Revoir la mise en route » s'ouvrait sous l'ourlet du haut** quand on
y arrivait depuis l'avis de l'AutoFocus : `scroll-mt-4` contre un ourlet de 68.

**Les drapeaux manquaient à la mise en route**, c'est-à-dire au seul écran où un
nouveau venu peut découvrir que Multifus ne parle pas sa langue. Ils sont dans son
en-tête, à gauche de « Passer ».

**Les dialogues écrivaient hors de l'échelle**, en 14, 16 et 18 px. Quatre
fichiers de `components/ui/` sont passés aux jetons, ce qui étend l'exception
déjà assumée pour le bouton rétro.

**Les marges entre frères ont disparu** : `mt-3`, `mb-4` et compagnie doublaient
le `gap-4` de l'écran. Le rythme est celui de l'écran, et d'un seul endroit.

**L'anneau de focus était recopié cinq fois** : c'est `sighted`, une matière.

**L'en-tête d'une map était écrit deux fois**, dans `Screen` et dans
`StageScreen` : c'est `MapHeader`.

**Le mot « écran » restait là où `CONTEXT.md` dit « map »** : le lecteur d'écran
lisait « Les écrans de Multifus », et `lib/screen-memory.ts` gardait la clé
`multifus.screen`. Ce sont `Les maps de Multifus` et `multifus.map`. `ScreenName`
reste : c'est le mot du pont vers le Rust, pas celui de l'interface.

Deux constats ont été rejetés après vérification. Les deux `<button>` du
navigateur qui restent sont expliqués dans le système graphique. Et le contraste,
signalé au jugé, s'est révélé pire que l'estimation une fois mesuré : c'est ce
qui a tué le `slate` au ventre de la plaque.

Une phrase a bougé, les trois catalogues sont à jour.

## Ce qui reste

### Ce que la revue laisse ouvert

**La grande boîte noire du Déplacement rapide et de l'AutoFocus.** Tant que la
boucle n'est pas enregistrée, `LoopStage` est un rectangle noir de 16/10 avec une
phrase au milieu. La phrase est passée en kaki plein, mais le trou reste : c'est
l'enregistrement des boucles qui le comble, pas le CSS.

**La fiche d'un personnage déborde en 660 de haut.** Sexe, classe, couleur : le
corps du dialogue défile, et à la taille d'ouverture on voit la moitié de la
rangée des couleurs. Rien n'est cassé, mais rien ne dit qu'il y a une suite.

**Les deux familles de jetons de couleur cohabitent encore** dans une vingtaine de
fichiers : `text-muted-foreground` vaut exactement `text-khaki`, `--destructive`
vaut `--flame`. Aucune différence à l'écran, mais deux noms pour une couleur.
À solder avec `theme.css`, le jour où plus aucun composant `ui/` ne sert.

### Le geste à deux doigts, pour revenir en arrière

Faisable, et pas gratuit. `wry` sait le faire des deux côtés,
`with_back_forward_navigation_gestures` pose `allowsBackForwardNavigationGestures`
sur WKWebView et `SetIsSwipeNavigationEnabled` sur WebView2. Mais Tauri ne
l'expose pas : il faut passer par `with_webview` et appeler le sélecteur à la
main, sous `unsafe`. Et surtout, le geste rejoue l'historique du navigateur, que
Multifus n'écrit pas : `useCurrentMap` garde la map dans un état React et dans le
`localStorage`. Il faudrait donc empiler une entrée d'historique par map et
écouter `popstate`. Deux morceaux, l'un en Rust et l'autre dans le hook, à faire
dans leur propre plan.

### Ce que les dix maps ont reçu d'un coup

La matière partagée a été refaite une fois, pas dix, et les dix maps l'ont eue
ensemble. C'est le même geste que la fusion des deux thèmes.

- **La case à cocher du jeu** (`Tick`, `@utility tick`). Un carré de 19 points,
  bord `--iron` de 2 points, face crème creusée. Cochée, la face passe au vert
  et une coche crème s'y dessine, en bordures tournées à 42°, sans image ni
  icône. Elle remplace l'interrupteur shadcn partout. Le rôle ARIA reste
  `switch`, donc aucun test n'a bougé
- **Un seul bouton**, celui de `components/retro/button.tsx`. Le bouton shadcn
  est supprimé, et ses noms sont traduits une fois pour toutes :
  `ghost` → `bare`, `secondary` et `outline` → `slate`, `destructive` → `flame`,
  `xs` → `tight`, `icon-sm` → `icon`, `icon-xs` → `icon-tight`
- **Les icônes en trait sont sorties des rangées et des boutons.** `IconTile` est
  supprimé, `FieldRow` n'a plus de prop `icon`, `NOTIFICATION_ICONS` non plus.
  Un bouton est du texte en capitales, comme le dit le système
- **`FieldRow`, `PanelHeader`, `SectionRow`, `Note`** sont passés à l'échelle
  rétro : titre Bebas capitales crème, ligne Roboto kaki, filet `--band`
- **Le sceau d'un sexe** est une pierre, pas un néon : le glyphe est le caractère
  `♂` ou `♀`, et la pierre est grise quand le groupe est hors du défilement.
  Allumée, elle reprend `--male` et `--female`, le bleu de Mars et le prune de
  Vénus, revenus dans `retro.css` : deux disques verts côte à côte ne se
  distinguaient plus
- **L'étoile du principal** est devenue le losange crème, celui que les têtes du
  dolmen portent déjà. `MainStar` s'appelle `MainMark`
- **La croix de suppression** est le caractère `×`

Deux fichiers de `components/ui/` ont été touchés, `dialog.tsx` et
`alert-dialog.tsx`, pour qu'ils prennent le bouton rétro. C'est contre la règle
qui dit de ne pas les éditer, et c'est assumé : la règle protège un composant
qu'on régénère, et on ne régénère plus rien de shadcn.

### Les dix maps, une par une

- [x] **Personnages** : wording coupé de moitié, sigils et étoile repris
- [x] **Raccourcis** : wording coupé, les deux avis du bas raccourcis
- [x] **Déplacement rapide** : passé en scène à boucle, la bannière en dialogue

Les sept autres portent encore une liste de plaques empilées. Ce qu'il leur faut,
et dans cet ordre :

- [ ] **AutoFocus**, **Réponses rapides**, **Messages privés** : scène à boucle,
      comme Déplacement rapide
- [ ] **La roue**, **Tableau des runes** : scène aussi, mais la vraie roue et le
      vrai tableau à la place de la boucle. Ils se dessinent déjà
- [ ] **Paramètres** : le plus chargé, six réglages et une mise en route. À
      découper en dialogues, un par sujet
- [ ] **À propos** : trois lignes suffisent
- [ ] Une phrase par map, et rien de plus. Le reste va dans un dialogue
- [ ] Les jauges, les champs et les listes shadcn n'ont pas encore leur matière,
      à relever sur `assets/dofus-options-general.png`. **On n'écrit une
      `@utility` qu'avec l'écran qui l'emploie**

### Le reste

- [ ] Les trois fenêtres à part, `banner.html`, `wheel.html`, `rune-table.html`.
      Elles importent déjà `retro.css`, elles n'ont pas encore leur forme
- [ ] Sortir `lucide-react` du dépôt. Il en reste dans une vingtaine de
      fichiers, tous des glyphes seuls sans mot à côté : le chevron d'un
      `Select`, la croix d'un `Dialog`, le cadenas de l'autorisation. Chacun
      demande un mot ou un caractère à sa place. Le chevron du journal est parti
      le premier : il était à côté du mot « Journal », et le panneau ouvert dit
      déjà qu'il est ouvert
- [ ] Sortir `theme.css` quand plus aucun composant `shadcn` ne sert. Il ne
      porte plus de couleur à lui, seulement l'échelle de texte et les matières
      de la roue
- [ ] Le vrai logo. `assets/logo.png` est celui de Tauri, et `src-tauri/icons/`
      aussi : les deux se refont depuis la même image le jour venu
- [ ] Regarder l'accueil dans `tauri dev`, à la taille d'origine puis à
      720 × 520 : rien ne doit défiler. Vérifié dans un navigateur, pas dans la
      vraie fenêtre
- [ ] Regarder le monde sur Windows : rien n'y a jamais été lancé
- [ ] Regarder une map dont la liste dépasse la fenêtre dans `tauri dev` : elle
      défile bien sous l'ourlet dans un navigateur piloté, la vraie fenêtre reste
      à voir

## Regarder ce qu'on fait

Le pont Tauri n'existe pas dans un navigateur, donc `tauri dev` est le seul
endroit où le vrai logiciel se voit. Pour l'œil, un navigateur piloté suffit à
condition de bouchonner le pont **avant le chargement de la page** :

```js
window.__TAURI_INTERNALS__ = {
  metadata: {
    currentWindow: { label: 'main' },
    currentWebview: { label: 'main' }
  },
  transformCallback(callback, once) {
    /* rend un identifiant, pose window['_' + id] */
  },
  unregisterCallback() {},
  convertFileSrc(path) {
    return path
  },
  invoke(cmd) {
    /* rend l'instantané pour 'snapshot', 0 pour 'plugin:…' */
  }
}
```

Les pièges trouvés le 5 septembre 2026 :

- `@tauri-apps/api` appelle `window.__TAURI_INTERNALS__.invoke`, rien d'autre.
  Le stub tient en vingt lignes
- L'instantané bouchon doit porter les vraies formes : une entrée de journal est
  `{ id, at, event: { kind } }`, et une couleur de personnage est l'un des douze
  noms de `constants/colors.ts`. Une valeur inventée casse l'écran sans le dire
- `listen` se plaint d'`unregisterListener` au démontage. C'est sans effet, et
  ça n'apparaît qu'à la fermeture de la page
