# Le tableau des runes

Écrit et testé. Ce qui reste tient dans les deux listes du bas, à faire sur les
deux machines. Le fichier s'efface une fois qu'elles sont cochées.

## Ce qui a été écrit

Un raccourci, `Ctrl+Maj+R` au départ, pose les poids des runes sur la fenêtre du
jeu ; le même les retire. Le tableau se prend n'importe où et se pose où l'on
veut, hors de l'écran compris, sa place revient au lancement suivant, et la croix
le ferme. L'écran Tableau des runes, septième ligne de la barre de gauche, porte
les deux jauges de la plaque, sa taille et sa transparence, l'interrupteur des
autres fenêtres, le bouton d'aperçu et celui qui rappelle la plaque perdue. La
barre système montre, cache, et rappelle.

## Ce qui a changé en route

Six écarts au plan d'origine, tous pris en écrivant le code ou en le relisant.

**L'ancre est à trois états, pas deux.** `Posted { anchor: Option<WindowId> }` ne
distinguait pas « je me montre partout » de « je n'ai pas encore de fenêtre à qui
répondre ». Un tableau ouvert depuis la barre système, Multifus devant, se serait
montré sur toutes les fenêtres au lieu de la première. D'où
`Anchor::{ Anywhere, OnlyOn(id), TheNextOne }`.

**`RuneTableView` porte `previewing` et non `open`.** Sans lui, l'écran ne sait
pas si ce qui est ouvert est l'aperçu ou le tableau posé sur le jeu, et Échap
fermait le second. `open` était le nom du plan, mais rien à l'écran ne le lit : la
coche de la barre système se sert du booléen Rust, qui reste. Le pont ne porte
donc que ce que le front regarde.

**Échap est écouté par la fenêtre entière, pas par l'écran.** Posé sur l'écran
Tableau des runes, il cessait de répondre dès qu'on changeait d'écran, l'aperçu
restant ouvert derrière. Le crochet est monté dans `app.tsx`, à côté de la
navigation par la barre système.

**Pas de `rune_table_step`.** La page n'a besoin d'aucune donnée : Rust taille la
fenêtre, la plaque fait 100 % de large, et le seul mot qui remonte est sa
hauteur. Une commande de moins.

**Le cadre est en points, pas en pixels.** Sur le Mac, l'Accessibilité parle déjà
en points et rien n'est converti. Sur Windows, `GetWindowRect` rend des pixels,
divisés par `GetDpiForWindow` : la feature `Win32_UI_HiDpi` est entrée pour cela.
Le décalage gardé dans `config.json` est donc en points, et il survit à un
changement d'échelle.

**La pose ne se répète pas.** Le fil ne redonne sa taille et sa place à la fenêtre
que si l'une des deux a changé, plutôt que dix fois par seconde pendant des
heures.

## La question que le plan posait en premier, et sa réponse

**Une fenêtre sans bord et non focusable reçoit-elle les clics de sa page ?** Sur
le Mac, oui, mais le clic ramenait Multifus devant, et le tableau devenait
indéplaçable : à peine le bouton enfoncé, on avait quitté le jeu.

`focusable(false)` ne fait qu'une chose dans tao : la fenêtre ne devient ni clé ni
principale. AppKit active quand même l'application dès qu'on clique sur une de ses
fenêtres. Le seul réglage qui l'en empêche est `NSWindowStyleMaskNonactivatingPanel`,
et ce bit n'existe que sur un `NSPanel`.

`platform::hold_back_activation` échange donc la classe de la fenêtre contre
`NSPanel` par `object_setClass`, puis pose le bit. L'échange tient parce que
`NSPanel` dérive de `NSWindow` sans ajouter une seule variable d'instance : la
fonction refuse et le dit au journal si la classe demandait plus de place que la
fenêtre n'en tient. Deux réglages suivent : `hidesOnDeactivate` à faux, sans quoi
un panneau disparaît dès que Multifus n'est plus devant, ce qui est tout le
contraire de ce qu'on veut ; et `becomesKeyOnlyIfNeeded` à vrai, pour que le jour
où la plaque portera un champ, le clavier lui vienne sans que le jeu perde la
main.

Il fallait aussi `accept_first_mouse(true)` : sans lui, le premier clic sur une
fenêtre qui n'est pas au premier plan sert à l'y amener et n'arrive jamais à la
page. Le tirage aurait demandé deux clics.

Windows n'a rien coûté : `focusable(false)` y pose déjà `WS_EX_NOACTIVATE`, et
c'est exactement ce style qu'il faut. À vérifier tout de même sur la machine.

Ce que Multifus perd à l'échange : les surcharges de tao sur cette fenêtre, dont
`canBecomeKeyWindow` et le glissement par le fond, dont le tableau ne se sert pas.
`set_focusable` appelé sur cette fenêtre planterait, la variable d'instance de tao
n'étant plus là : personne ne l'appelle, et la permission n'est pas donnée à sa
page.

## Ce que le tirage a coûté, et ce qu'il coûte maintenant

**Pas de flou derrière la plaque.** Le plan demandait un fond « flouté derrière ».
`backdrop-filter` sur une fenêtre transparente échantillonne un fond que macOS ne
rafraîchit pas quand la fenêtre se déplace : on traînait une image figée du jeu,
avec la couleur qu'il avait au moment où le tirage a commencé. La ligne est
partie. La plaque reste légèrement translucide par son fond seul, et le jeu se
voit à travers pendant tout le déplacement.

**Rien ne change à l'écran pendant le tirage.** Pas de curseur qui se referme,
pas de teinte, pas d'état. La capture du pointeur retire d'elle-même le survol des
lignes le temps du geste, ce qui tombe bien.

**Le tirage ne parle plus à Dofus.** Il appelait `follow_game` à chaque image :
deux allers-retours Accessibilité vers le client par image, à soixante images par
seconde, sur un processus qui rend peut-être un combat. C'est ce qui donnait
l'impression que rien ne suivait. Le geste se sert maintenant de ce que la
dernière pose sait déjà, gardé dans `Posed` : où la plaque est, où était le coin
de la fenêtre du jeu, quelle taille elle fait, et quelle zone de travail la
retient. Une image de tirage coûte un message et un `set_position`, rien d'autre.
Le fil de 100 ms recale tout, et comme le décalage écrit est celui de la place où
la plaque a atterri, il n'y a rien à recaler.

**Une main qui court plus loin que l'écran n'écrit pas ce que la plaque n'a
jamais porté.** Le décalage gardé se calcule depuis la position bornée, pas depuis
la position demandée.

**Le clic est pris au navigateur d'entrée de jeu.** `user-select: none` est posé
sur la page, et le texte se surlignait tout de même en gris pendant le tirage,
d'où l'écran barré de blocs. WebKit reçoit son clic par `acceptsFirstMouse`, la
fenêtre n'étant pas au premier plan, et pose une sélection sans regarder la règle.
`preventDefault` sur l'enfoncement le coupe net : la capture du pointeur est à
nous, le navigateur ne fait plus rien de ce clic. Le bouton droit garde son
comportement, la croix arrêtant déjà l'événement avant nous.

## La jauge, et ce qu'elle grossit

Le plan ne réglait que la largeur, et la plaque s'étirait : les mêmes lettres,
les mêmes marges, des colonnes de plus en plus longues. La jauge grossit
maintenant la plaque d'un bloc.

La plaque est dessinée pour 320 points, la borne la plus étroite. La page se met
à l'échelle de la fenêtre qu'on lui donne : `zoom` sur le corps de la page, égal
à la largeur de la fenêtre divisée par 320, posé depuis un `ResizeObserver` sur
la racine. La racine n'est pas mise à l'échelle, donc la mesure ne se mord pas la
queue, et l'observateur rend la main avant que la fenêtre soit peinte : rien ne
saute. `zoom` a été préféré au zoom natif de la vue web, qui aurait pu changer
sous les pieds du tirage les coordonnées d'écran de la souris.

Du coup la page ne dit plus sa hauteur mais sa forme, hauteur sur largeur. La
forme ne dépend d'aucune échelle : le Rust la multiplie par la largeur voulue et
arrondit vers le haut. Une seule mesure sert à toutes les tailles.

**La jauge se voit pendant qu'on la pousse.** `size_rune_table` pose la taille et
replace la plaque sans rien écrire sur le disque, à chaque cran ; le relâchement
appelle `set_rune_table_width`, qui enregistre. C'est le même partage que le
tirage de la plaque, `move_rune_table` puis `rune_table_settled`. `size` sort
tout de suite si la largeur n'a pas bougé, pour qu'une jauge tenue immobile ne
demande rien à Dofus.

## Ce que la relecture a trouvé, et ce qui a été corrigé

**Un interblocage qui gelait Multifus.** `pose` tenait le verrou de la place
pendant `is_visible()`, qui depuis un fil de fond poste à la boucle d'évènements
et attend le fil principal. En face, `move_rune_table` est une commande
synchrone, donc sur le fil principal, et demandait ce même verrou. Dix fois par
seconde pendant un tirage, les deux pouvaient se croiser et l'application se
figeait pour de bon. La lecture se fait maintenant dans une variable, hors du
verrou.

**Le tirage suspend le suivi.** Tant que la main tient la plaque, le fil de
100 ms ne pose plus rien : plus un seul appel d'Accessibilité, plus un seul
getter bloquant en travers des `set_position`. `rune_table_settled` rend la
plaque au suivi, et une nouvelle ouverture la rend aussi, pour qu'une page qui
meurt en plein geste ne fige pas le suivi pour toujours.

**Les commandes qui parlent à Dofus sont `async`.** Six d'entre elles couraient
sur le fil principal et y faisaient deux allers-retours d'Accessibilité. Le
dépôt marquait déjà `(async)` les deux commandes qui touchent l'Accessibilité :
elles suivent la même règle. `move_rune_table` reste synchrone, ne parlant à
personne.

**Un seul suiveur.** Le tour d'une seconde appelait `follow_foreground` en plus
du fil dédié : deux poses entrelacées écrivaient une place que la fenêtre n'avait
jamais prise. Le tour n'appelle plus rien, et un verrou de pose met les
commandes et le fil à la file.

**Un panic ne peut plus emporter l'application.** Le suivi est enveloppé, comme
le fil l'était déjà. `clamp` sur une borne qui n'est pas un nombre paniquait :
un écran dont l'échelle ne se lit pas ne rend plus de zone de travail, et le
bornage laisse la plaque où elle a demandé.

**Une mesure absurde est refusée.** Une forme doit être finie, positive, et pas
plus haute que huit fois sa largeur.

**Le garde-fou du panneau compare la bonne chose.** Il vérifiait que `NSPanel`
ne demande pas plus de place que la classe portée, qui est celle de tao et vaut
`NSWindow` plus une variable. Il la compare maintenant à `NSWindow` : c'est
l'invariant que la note annonce.

**Windows lisait le cadre à la mauvaise échelle.** `GetDpiForWindow` rend l'échelle
à laquelle la fenêtre visée se dessine, 96 pour un client qui ignore le DPI,
alors que `GetWindowRect` rend des pixels de l'écran. C'est l'échelle du moniteur
qu'il fallait, celle que Tauri emploie pour convertir une position logique.
`MonitorFromWindow` puis `GetDpiForMonitor`. **Non compilé** : la chaîne MSVC
manque sur le Mac, à vérifier au premier build Windows.

**L'interrupteur des autres fenêtres prend effet sur-le-champ.** Il ne se lisait
qu'à l'ouverture, donc il fallait fermer et rouvrir le tableau.

**La barre système cache vraiment.** Aperçu ouvert, sa coche disait « Cacher » et
reposait le tableau sur le jeu. Le raccourci et la barre cachent tout d'un coup ;
Échap et la croix gardent le retour au tableau posé.

**L'aperçu garde sa place quand la jauge le grossit.** La relecture voulait qu'il
se recentre, parce qu'il dérive du milieu à mesure qu'il grandit. Essayé, et
retiré : effacer sa place à chaque cran la fait revenir au milieu sous la main de
celui qui vient de la choisir, ce qui est bien pire qu'un aperçu décentré. La
plaque grandit depuis son coin haut-gauche, qui ne bouge pas ; seul le bord de
l'écran la retient, et il ne réécrit rien.

**Le tableau ne se pose pas sur un client en plein écran.** Le texte le disait,
rien ne le faisait. La règle d'alors est décrite plus bas, avec ce qui l'a
remplacée.

**La hauteur avant toute mesure.** La forme devinée valait 3, la vraie vaut à peu
près 2. La fenêtre naissait une fois et demie trop haute, se faisait border en
haut de l'écran, puis sautait. La supposition vaut maintenant 2,1.

## La plaque resserrée, et la butée de l'écran

La plaque mesurait 2,15 fois sa largeur : 1200 points de haut à 560, ce qu'aucun
écran de 1080 ne tient. Elle est resserrée partout où la hauteur se paie sans
rien apprendre : l'interligne du tableau, la moitié du blanc au-dessus et
en dessous de chaque rune, le titre et sa version sur une ligne au lieu de deux,
la poignée en moins, le curseur disant déjà qu'on peut prendre la plaque. Elle
tombe autour de 1,67 fois sa largeur, soit 930 points à 560.

Ça ne suffit pas sur un écran de 900. `fitted` borne donc la largeur par ce que
la hauteur de la zone de travail permet : poussée au-delà, la jauge ne fait plus
rien grandir. La jauge garde le chiffre demandé, qui vaudra de nouveau sur un
grand écran ; c'est l'écran qui donne ce qu'il peut.

## Un seul blanc pour tous les poids

Les poids naissaient en quatre paliers de blanc, du plus léger au plus lourd, et
le nom de la stat comme l'unité tiraient sur le gris. Ça donnait l'impression
qu'une ligne comptait plus qu'une autre, alors qu'on forge celle qu'on forge.
Tout ce que le tableau tient porte maintenant le même blanc. Le tiret d'une rune
qui n'existe pas garde son gris : il ne dit pas un poids, il dit une absence.
`runeHeat` disparaît avec ses paliers.

## La plaque libre de l'écran, et le rappel

La zone de travail retenait la plaque entière : sur un client agrandi, le seul
moyen de la mettre de côté était de la fermer. `held_inside` et `held_between`
sont partis, `Posed` ne porte plus sa zone, et `placed` comme `dragged` posent la
plaque là où la main la demande, hors de l'écran comprise. La butée de taille,
elle, reste : `fitted` continue de refuser une plaque plus haute que l'écran, car
une plaque coupée ne se lit pas, alors qu'une plaque rangée au bord se veut ainsi.

`recall` jette la place gardée dans `config.json` et rend la main à
`kept_offset`, qui repose la plaque au coin haut droit de la fenêtre, à
`FIRST_MARGIN` des deux bords, comme au premier jour. L'écran l'appelle au bouton
de « Où il se montre », et la barre système à une ligne qui ne paraît que tableau
ouvert : une plaque perdue de vue ne doit pas obliger à ouvrir Multifus.

## Le wording relu en entier

On sait que c'est du Retro, et celui qui lit ça forge depuis vingt ans. Le
sous-titre « Poids 1.29 » de la plaque est parti avec l'utilitaire `rune-source`,
et le titre prend la ligne entière. Le sous-titre de l'écran nomme la vraie gêne :
casser sans quitter le jeu ni rouvrir un site. La note de la transparence ne dit
plus ce que zéro fait, chiffre qu'on lit sur la jauge, et garde ce qu'on ne
devine pas : à fond, les clics repartent au jeu. La dernière colonne s'appelle
« Point » et non « Unité », le mot du jeu plutôt que celui d'un tableur. La
dernière famille s'appelle « Les légères », en face des « lourdes », au lieu de
« Primaires et vitalité », qui oubliait l'initiative et les pods.

La mention « à la frappe » est partie du raccourci, ici comme dans l'écran
Raccourcis, et `STRUCK` avec elle. L'application n'écrit une mention que sur
l'exception : la roue porte « au maintien » parce qu'elle est la seule à se tenir.
Tout le reste se frappe, le Déplacement rapide n'en dit rien, et le tableau n'a
pas à en dire plus.

Le vocabulaire de l'écran suit celui du reste de l'application, et non celui du
code : on affiche, on ne pose pas ; le tableau se montre sur un personnage
connecté, pas sur une fenêtre du jeu ; il revient en haut à droite, pas au coin
haut droit. Le sous-titre nomme la gêne à plat, sans cadence.

Le panneau des jauges est le jumeau de celui de la Roue : même en-tête, mêmes
deux jauges, même bouton qui pose la vraie chose au milieu de Multifus. Il en
porte donc les mêmes mots. Il s'appelle « L'aperçu », sa description suit la
même coupe (ce que l'aperçu montre, puis ce que chaque jauge fait), et son bouton
dit « Voir en vrai » et non « Aperçu ». Les deux écrans lisent la même constante,
`TRY_IT`, pour que le bouton ne puisse plus diverger.

Le panneau de la taille s'appelait « La plaque », mot du code, et sa description
courait sur deux lignes contre le bouton, la seconde à moitié vide. Il s'appelle
« À quoi il ressemble », qui répond à « Où il se montre » du panneau d'en
dessous, et sa description tient sur une ligne : elle ne garde que ce que les
jauges ne disent pas, le bouton d'aperçu et la touche qui le ferme. La note
« Échap ferme l'aperçu » disparaît, dite une fois plus haut, et le panneau
s'arrête à ses deux jauges. Le bouton du rappel porte le `RotateCcw` de l'écran
À propos et de l'écran Raccourcis, la pastille de la ligne montrant, elle, ce
dont il est question.

## Ce que la relecture a trouvé et que je n'ai pas changé

**Le survol des lignes.** La capture du pointeur retire d'elle-même le survol
pendant le geste, donc rien ne change à l'écran quand on tire la plaque. Hors du
geste, le survol aide à suivre une ligne sur vingt, et il reste.

**Les quatre fonctions en double dans le Rust.** `apart` et `said` ne diffèrent
que par l'évènement qu'elles écrivent au journal, `held_between` et `holds_point`
par leur type. Les rassembler demande de toucher au placement de la roue, qui
marche et qui a été vérifié en jeu.

**`set_focusable` sur cette fenêtre paniquerait.** La variable d'instance de tao
n'est plus dispatchée après l'échange de classe. Personne ne l'appelle, et il n'y
a rien à corriger sans renoncer au panneau.

## La transparence

Une seconde jauge, dans le même panneau que la taille, qui s'appelle maintenant
« À quoi il ressemble ». Elle va de 0, la plaque telle qu'elle était, à 100, la plaque
fantôme, par pas de 5. Le réglage voyage en pour cent dans `config.json` et
traverse le pont en opacité : le Rust fait le calcul une fois, la page ne fait
que le porter.

La page n'avait besoin d'aucune donnée jusque-là. Elle en reçoit une, par le
chemin que la roue emprunte déjà : une commande pour la première valeur, un
évènement pour les suivantes. La jauge se voit donc à chaque cran, comme celle de
la taille, et n'écrit sur le disque qu'au relâchement.

À zéro, la plaque est franchement opaque : son fond ne porte plus l'alpha de 0,9
qu'il avait en dur, sans quoi la jauge serait partie voilée et n'aurait jamais pu
rendre le noir plein.

À fond, la plaque ne s'en va plus. Elle s'en allait, et un cran qui ne montre
rien ne sert à rien : on ferme le tableau à la croix ou au raccourci, pas en
poussant une jauge. `faded` étale donc les cent crans sur la course de 1 à
`FAINTEST_LOOK`, un cinquième de présence : le dernier cran rend ce que 80 rendait
avant. Le chiffre affiché ne bouge pas, seule la course change.

`matches_wiped_out` disparaît avec ce cran, et la fenêtre n'est plus cachée
derrière le dos du suiveur. La plaque à son plus pâle prend toujours les clics.
Rien ne l'écrit sous la jauge : celui qui forge le verra au premier essai.

## Ce qui a été ajouté sans que le plan le demande

**Les deux notes du bas sont parties.** Le plan comptait quatre morceaux : un
titre, le tableau, deux notes sur les cases vides et l'arrondi. Elles disaient
une fois ce qu'on n'a pas besoin de relire, et coûtaient trois lignes de hauteur
sur une plaque posée devant un combat. La plaque s'arrête à sa dernière rune.

## Ce que la dernière relecture a corrigé

**La compilation Windows était cassée.** `Win32_Graphics_Gdi`, dont
`window_scale` a besoin pour `MonitorFromWindow`, n'était déclaré que dans les
dépendances de test. `cargo test` passait, `cargo build --release` aurait échoué
en E0432 : multifus est le seul consommateur de `windows 0.62`, tao et wry
étant restés en 0.61, et rien n'unifiait la fonctionnalité. Le lot est passé
dans les vraies dépendances.

**Les deux lignes du tableau dans la barre système figeaient l'application.**
`on_menu_event` répond sur le fil principal ; `toggle` comme `recall` y prenaient
le verrou de pose, que le fil suiveur tient pendant `set_size`, `set_position` et
`show`, chacun bloquant sur ce même fil principal. Blocage garanti, et c'est
exactement la panne corrigée pendant l'écriture, revenue par un nouvel appelant.
Les deux passent maintenant par la file de la barre système, comme le focus et
l'agrandissement.

**Cacher pouvait perdre contre le fil suiveur.** Le fil lisait le mode, partait
poser, et un `hide` d'un autre fil cachait la fenêtre avant que le `show` du fil
n'arrive. La génération étant devenue vieille, le fil sortait, et la plaque
restait à l'écran sans personne pour la retirer. `veil_in_turn` prend le verrou
de pose ; `veil` ne le prend pas, comme `pose`, puisque le suiveur le tient déjà.

**L'interrupteur bougé aperçu ouvert était perdu.** `spread` ne répondait qu'au
mode posé, et la fermeture de l'aperçu rendait l'ancre d'avant. `Mode::spread_over`
retouche aussi l'ancre gardée sous un aperçu.

**La transparence n'était pas bornée au chargement.** La largeur l'était depuis
toujours ; un `transparency` de 900 écrit à la main donnait une opacité négative.

**L'échange de classe ne vérifiait pas ce qu'il échangeait.** La note `SAFETY:`
affirmait que la fenêtre est une NSWindow sans le vérifier. `matches_a_kind_of`
remonte la chaîne des classes avant l'échange.

**La forme se comparait au flottant près.** Un ULP de dérive entre deux mesures
sous `zoom` relançait une pose, donc une mesure. `grained` arrondit au millième.

**Le fil sortant tournait un tour de trop**, sa génération étant lue avant le
sommeil et non après.

## Ce qu'il reste à ranger

**Trois fonctions vivent en double dans le Rust.** `holds_point` de
`rune_table.rs` refait celle de `wheel.rs` en `f64` au lieu de `i32`, et `apart`
et `said` en sont la troisième copie après `banner.rs` et `wheel.rs`. Les
rassembler demande de toucher au placement de la roue, qui marche et qui a été
vérifié en jeu : ça se fait à froid, pas en livrant le tableau.

## Ce que la relecture a soulevé et que je laisse

**Les deux tours d'Accessibilité et les trois sauts par tour.** `screen_under`
demande les écrans à chaque tour, dix fois la seconde, ce qui alloue un vecteur
et saute sur le fil principal ; `pose` paie en plus un `is_visible` sur le tour
où rien ne bouge. Garder les écrans en mémoire les rendrait faux dès qu'on
débranche un écran sans bouger la fenêtre, et le `is_visible` est ce qui rattrape
une plaque que le système aurait cachée. Le prix est celui du dessin, mesuré et
accepté ; c'est le blocage qui coûtait, et il est parti.

**Le point logique de Windows n'est pas celui de tao.** `window_scale` divise le
cadre par l'échelle de l'écran du client, quand `set_position` le remultiplie par
celle de l'écran où se trouve le tableau. Les deux ne diffèrent que sur un
montage à deux écrans d'échelles différentes. Le corriger demande de poser en
pixels, donc de porter la taille de la plaque en pixels aussi, et ça ne se teste
pas sans une machine Windows. À vérifier là-bas avant de toucher.

**`look` reste `look`.** Le pour cent que l'utilisateur pousse s'appelle
`transparency`, l'opacité qui traverse le pont s'appelle `look` : deux noms pour
deux unités, et les confondre coûterait plus qu'il ne rendrait.

**« Depuis une fenêtre du jeu, et nulle part ailleurs »** garde ses mots parce
que l'écran Roue porte la même phrase, au caractère près.

## L'aperçu qui clignotait sur Windows

Le bouton « Voir en vrai » ouvrait la plaque, qui se fermait et se rouvrait dix
fois par seconde. Le tableau posé sur le jeu, lui, ne bronchait pas.

Le suiveur demandait « Multifus est-il devant ? » à `is_focused()` de la fenêtre
principale. Sur Windows, cette réponse est le focus clavier du HWND de plus haut
niveau, et wry le donne au WebView2 dès qu'il l'a : sa sous-classe appelle
`MoveFocus` sur WM_SETFOCUS, la vue prend le focus dans sa fenêtre fille, et le
parent reçoit WM_KILLFOCUS. tao met alors son drapeau à faux. Le suiveur en
concluait que Multifus était parti, retirait la plaque, le focus revenait au
parent, la plaque revenait, et ainsi de suite au rythme des 100 ms. Le tableau
posé y échappe : il demande la fenêtre du jeu au premier plan, pas le focus de
Multifus.

La question posée est maintenant celle qu'on voulait poser :
`platform::matches_frontmost`, la fenêtre de premier plan appartient-elle à notre
processus. Sur Windows c'est `GetForegroundWindow` puis
`GetWindowThreadProcessId` comparé au nôtre, et la plaque, qui porte
`WS_EX_NOACTIVATE`, ne peut pas fausser la réponse en passant devant. Sur le Mac
c'est `NSRunningApplication::currentApplication().isActive()`, la même question à
AppKit ; **non compilé**, la chaîne manquant sur la machine Windows.

## Le plein écran, mesuré et non plus deviné

La règle d'origine était taillée pour AppKit : une fenêtre couvre l'écran entier,
et seulement sur un écran qui réserve une place à la barre des menus ou à la
barre des tâches, sans quoi l'égalité des deux mesures ne prouve rien. Le Mac
réserve toujours quelque chose pour sa barre des menus, alors la règle tenait.

Windows la casse des deux côtés. Une barre des tâches en masquage automatique ne
réserve rien, et un écran secondaire qui ne porte pas de barre non plus : la
règle ne s'arme jamais, et la plaque reste posée par-dessus un client en plein
écran. Et dans l'autre sens, `GetWindowRect` d'une fenêtre simplement agrandie
déborde du moniteur d'environ huit pixels par côté, ses bordures de
redimensionnement étant invisibles depuis Vista : `frame >= screen` est donc vrai
d'un client agrandi, et seule la hauteur de la barre des tâches empêchait encore
le tableau de s'effacer. Ça tenait par une marge de quelques pixels.

La règle ne suppose plus rien : une fenêtre est en plein écran quand son cadre
**est** celui du moniteur, coin et taille, à un point près. Un client agrandi
n'en est jamais un, ni sur le Mac où il s'arrête sous la barre des menus, ni sur
Windows où il déborde. La zone de travail ne sert plus qu'à ce pour quoi elle est
faite, borner la hauteur de la plaque, et `Screen` porte le coin du moniteur en
plus de sa taille.

## Les trois overlays ne prennent plus le focus à leur naissance

`focused` vaut vrai par défaut chez Tauri, et le builder ne le contredisait pas.
Sur Windows, wry appelle alors `MoveFocus` sur la vue à la construction : les
trois fenêtres sont bâties au lancement, cachées, et demandent le focus. Le même
défaut fait passer chaque `show()` par `SW_SHOW`, la variante qui active, au lieu
de `SW_SHOWNOACTIVATE`. Rien de tel sur le Mac, où `orderFront:` ne peut pas
activer.

`focused(false)` est posé dans `Overlay::build`, donc pour la bannière, la roue et
le tableau d'un coup : aucun des trois ne doit prendre le focus, jamais. C'est la
ceinture qui va avec les bretelles de `WS_EX_NOACTIVATE`.

## Ce qui reste douteux

**Dommages piège à 15 et 45.** Le seul chiffre de la source que le wiki
JeuxOnLine ne recoupe pas. En Dofus 2 la simple pèse 5 et c'est la Pa qui pèse 15,
ce qui ressemble à une recopie décalée. À vérifier en jeu.

**Dommages piège reste le seul chiffre douteux.** Le reste de cette section est
tranché, voir ci-dessous.

## À vérifier sur les deux machines

- [ ] Le tableau posé se prend à la souris et suit : la page reçoit bien ses clics
- [ ] Le premier clic sur le tableau démarre le tirage, sans en demander un deuxième
- [ ] Le tableau ne disparaît pas quand Multifus cesse d'être devant
- [ ] Pendant tout le tirage, rien n'est figé et la plaque ne traîne pas derrière la souris
- [ ] Le tirage suit la souris sans à-coup, un client en combat au premier plan
- [ ] Une main qui traverse le tableau ne surligne pas une ligne ni un chiffre
- [ ] Le raccourci dans le jeu montre le tableau, le même raccourci le cache
- [ ] Le raccourci frappé dans Multifus, puis dans un navigateur : rien ne se passe
- [ ] Le tableau poussé hors de l'écran, Multifus relancé : il est toujours dehors, et le bouton le ramène
- [ ] Le tableau posé sur le deuxième écran, ce deuxième écran débranché, Multifus relancé : le tableau revient sur l'écran qui reste
- [ ] La croix le ferme, et le raccourci le rouvre au même endroit
- [ ] Le tableau se prend n'importe où, sur un chiffre comme sur un bord
- [ ] Dofus reste au premier plan pendant tout le déplacement
- [ ] La croix ferme et ne déplace jamais, même en la cliquant de travers
- [ ] Un clic sec sur le tableau ne le fait pas dériver d'un pixel
- [ ] Un clic à côté du tableau arrive au jeu, tableau posé depuis une heure
- [ ] Lâché puis Multifus relancé, le tableau revient à la place où on l'a laissé
- [ ] La jauge poussée à 560 puis Multifus relancé, le tableau revient large
- [ ] L'aperçu ouvert, la jauge poussée : la plaque grossit à chaque cran, sans attendre le relâchement
- [ ] À 560, l'écriture est plus grosse qu'à 320, et les colonnes gardent leurs proportions
- [ ] À 560 comme à 320, la plaque remplit la fenêtre sans bord vide ni bas coupé
- [ ] La jauge poussée d'un bout à l'autre : rien ne saute, rien ne clignote
- [ ] La jauge poussée puis relâchée, Multifus relancé : la taille est la bonne
- [ ] Une minute de tirage sans relâcher : Multifus répond toujours, la plaque suit toujours
- [ ] Interrupteur basculé tableau posé : l'effet est immédiat, sans fermer ni rouvrir
- [ ] Aperçu ouvert, la barre système : tout se cache d'un coup, et la coche le dit
- [ ] Aperçu déplacé puis la jauge poussée : la plaque grandit sur place, sans revenir au milieu
- [ ] Le tableau posé, le client passé en plein écran : le tableau s'efface, et revient en fenêtre
- [ ] Le tableau posé, le client simplement agrandi : le tableau reste, et ne s'efface pas
- [ ] Sur Windows, barre des tâches en masquage automatique, le client en plein écran : le tableau s'efface tout de même
- [ ] Multifus lancé : aucune des trois fenêtres cachées ne vole le focus au démarrage
- [ ] Premier lancement, tableau ouvert : la plaque naît à sa taille, sans sauter
- [ ] La jauge de transparence poussée, aperçu ouvert : la plaque s'éclaircit à chaque cran
- [ ] À 100, la plaque se lit encore par-dessus le jeu, et le clic reste pour elle
- [ ] La transparence poussée puis relâchée, Multifus relancé : elle est la bonne
- [ ] Une plaque à demi transparente se lit encore par-dessus un combat
- [ ] La fenêtre du jeu déplacée, le tableau suit sans traîner à l'œil
- [ ] La fenêtre du jeu passée d'agrandie à petite, le tableau garde sa taille et déborde
- [ ] Interrupteur éteint, on bascule sur une autre fenêtre du jeu : le tableau s'efface, et revient au retour
- [ ] Interrupteur allumé, on bascule : le tableau se montre sur les deux
- [ ] On passe sur Chrome : le tableau s'efface. On revient dans le jeu : il revient
- [ ] La fenêtre du jeu qui porte le tableau est fermée : le tableau s'efface, sans se fermer
- [ ] Échap dans le jeu, tableau posé : le jeu reçoit Échap, le tableau ne bouge pas
- [ ] L'aperçu s'ouvre au milieu de Multifus, se déplace, et ne garde pas sa place
- [ ] L'aperçu ouvert reste posé, sans clignoter
- [ ] L'aperçu se ferme à Échap et à la croix, et pas tout seul
- [ ] On quitte Multifus pour le jeu, aperçu ouvert : il s'efface, et revient avec Multifus
- [ ] L'aperçu ouvert par-dessus un tableau posé : à sa fermeture, le tableau reprend sa place
- [ ] La roue ouverte pendant que le tableau est posé : la roue passe devant, et le clic ne touche pas la croix
- [ ] La barre système montre et cache le tableau, et sa coche dit l'état
- [ ] Les vingt lignes se lisent à 320 de large sans que rien ne se coupe
- [ ] La jauge poussée à fond : la plaque tient entière à l'écran, la dernière rune comprise
- [ ] Sur le petit écran, la jauge poussée à fond ne fait plus rien grandir passé un cran
- [ ] Tous les poids portent le même blanc, du 0,25 au 100, et aucune ligne ne ressort
- [ ] Sur un client agrandi, la plaque se pousse hors de l'écran et y reste au lancement suivant
- [ ] Le bouton de l'écran la ramène au coin haut droit de la fenêtre du jeu
- [ ] La ligne de la barre système la ramène aussi, et ne paraît que tableau ouvert

## À vérifier sur le Mac seulement

- [ ] Le tableau posé, l'autorisation d'accessibilité retirée : le journal le dit une fois, pas cent
- [ ] Le tableau reste devant après un changement de bureau
- [ ] Sur un écran Retina, la plaque n'est ni deux fois trop grande ni deux fois trop petite
- [ ] Le panneau se pose sans une ligne au journal : `hold_back_activation` n'a rien refusé
- [ ] Le tableau reste au-dessus du jeu, et la roue passe toujours par-dessus lui
