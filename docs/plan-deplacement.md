# Déplacement

Chaque clic gauche dans une fenêtre de jeu passe au personnage suivant du
défilement. On clique pour déplacer un personnage, la fenêtre du suivant prend
sa place, on clique encore, et les deux ont bougé sans toucher au clavier.

L'idée vient de Dracoon, son « Mode déplacement ». Ce plan reprend l'idée et
refuse son implémentation : elle ne marche pas, et ce document dit pourquoi.

## Ce qu'on a trouvé chez Dracoon

Le code lu est `src/core/movemode.py` et `src/ui/UI_Tab_Outils.py`.

**La case ne démarre rien.** Elle pose une permission, rien d'autre. Le mode
s'allume au raccourci, et le raccourci naît vide (`shortcut_move=None`). Une
case cochée, deux clients ouverts, et rien qui bouge : c'est le comportement
écrit.

**Le raccourci exige une fenêtre de jeu devant, pour allumer comme pour
éteindre.** On ne peut donc pas couper le mode depuis la fenêtre de l'outil.

**Deux clics rapides ne donnent qu'un changement.** Le clic part au jeu tout de
suite, la bascule n'arrive qu'à T+95 ms (`_CYCLE_DELAY_MS`), et un second clic à
T+40 ms est rejeté par le cooldown de 96 ms (`_COOLDOWN_MS`). Les deux clics
tombent sur le premier personnage, le second ne bouge jamais, et aucune bascule
n'est même programmée pour rattraper. C'est la panne qui a lancé ce plan.

**La case est partagée entre les deux cartes.** `_build_mode_card` lit et écrit
`self._move_enabled` quel que soit le mode : la carte Dradidas manipule la
permission du Déplacement.

## Le vocabulaire

À ajouter à [CONTEXT.md](../CONTEXT.md), après **Défilement** :

**Déplacement** (`Walk`) : le mécanisme qui passe au personnage suivant du
défilement à chaque clic gauche dans une fenêtre de jeu. Il ne s'allume que
d'un geste, et il se voit tant qu'il est allumé.

**Bannière** (`banner`) : la fenêtre sans bord posée devant tout le reste, qui
porte la tête et le pseudo du personnage sur lequel on est. Elle ne dit que le
Déplacement, et elle disparaît avec lui.

**Bascule** (`switch`) : le passage du premier plan d'une fenêtre à la suivante.
Elle est finie quand le système la donne pour finie, pas quand on l'a demandée.

## Ce qui a été décidé

- Un seul état, allumé ou éteint. Trois gestes le basculent : l'interrupteur de
  l'écran Déplacement, le raccourci, la ligne du menu de la barre. Pas de
  permission qui ne fait rien.
- **Jamais d'automatisme.** L'état ne s'écrit pas dans la configuration et ne
  survit pas au lancement : Multifus démarre toujours Déplacement éteint. Un
  mode qui change le sens de chaque clic ne se rallume pas dans le dos de son
  propriétaire.
- Le raccourci marche **partout**, y compris dans la fenêtre de Multifus. Le
  clic, lui, ne compte que sur une fenêtre de jeu.
- Le raccourci vit dans l'écran **Raccourcis**, cinquième ligne des actions,
  défaut `Control+Shift+KeyD`. Il rejoint `ShortcutAction::ALL`, donc le refus
  des doublons par leur nom marche sans une ligne de plus.
- Le clic compte au **relâchement** du bouton gauche, pas à l'enfoncement. Dofus
  a reçu son enfoncement et son relâchement, le clic est complet, il n'y a plus
  rien à attendre. Le délai fixe de Dracoon disparaît, et avec lui la cause du
  clic perdu.
- **Tous** les clics gauche comptent, y compris sur un sort, le sac ou le chat.
  On ne sait pas de l'extérieur ce qu'il y a sous le curseur dans le client. La
  suite, si ça gêne : ne pas compter les clics pendant les N secondes qui
  suivent une frappe au clavier — on écrit, on ne se déplace pas.
- Le défilement employé est exactement celui du raccourci « suivant » :
  `decide_shortcut(ShortcutAction::Next)`, mêmes personnages de côté écartés,
  même retour au premier après le dernier.
- Un clic qui arrive pendant qu'une bascule est en vol est **mangé** : le hook
  supprime l'événement, le jeu ne le voit jamais. On perd un clic, mais aucun
  personnage ne se déplace deux fois. On ne rejoue rien : un clic de jeu
  fabriqué est une macro, et Ankama sépare explicitement la gestion de fenêtres
  des macros. Le Ctrl+V d'une réponse rapide est une frappe dans un champ de
  texte, pas un ordre au jeu.
- La bascule se **constate**, elle ne se parie pas. On demande le premier plan,
  puis on attend de voir la fenêtre visée y être vraiment, et c'est ce constat
  qui rouvre la porte aux clics. Plafond de 250 ms au-delà duquel on rouvre
  quand même et le journal le dit.
- **Pas de curseur de délai.** Un réglage que personne ne sait régler est l'aveu
  qu'on ne sait pas quand la bascule est finie. Le seul chiffre est le plafond,
  et il est dans le code.
- La bannière ne s'éteint pas. Elle est le seul signe que les clics changent de
  fenêtre ; une case qui la masque ramène le malentendu qu'on répare. Si elle
  gêne, on la fait discrète, pas absente.
- Son coin et son écran se choisissent une fois, dans l'écran Déplacement. Elle
  ne suit pas la fenêtre de jeu : déplacer une fenêtre à chaque bascule coûte
  ce qu'on vient de gagner.

## Le budget

**Du relâchement du bouton à la fenêtre visée au premier plan : 60 ms sur
Windows, 120 ms sur macOS.** Au-delà, un joueur qui enchaîne deux clics perd le
second — c'est tout le sujet.

Ce budget se mesure et s'affiche. L'écran Déplacement porte la mesure réelle des
derniers changements, en millisecondes. Sans chiffre visible, « ça saute encore »
restera indémontrable.

Trois dépenses sont interdites sur le chemin du clic :

1. **Le verrou d'état.** Le scan le tient une fois par seconde pendant qu'il
   énumère les fenêtres et lit les titres. Le clic ne le prend jamais : il lit
   un cache que le scan rafraîchit, et qui ne dit que « qui vient après, et dans
   quelle fenêtre ».
2. **L'accessibilité sur macOS.** Le `focus()` actuel lit les fenêtres du client
   visé avant d'activer l'application, et chaque lecture est un aller-retour
   synchrone vers un processus qui peut être occupé. Le Déplacement prend un
   chemin court : `activateWithOptions` sur le pid en cache, et pas la recherche
   du titre de la fenêtre de jeu.

   **Ce paragraphe a été rattrapé deux fois par la vraie machine.** D'abord,
   depuis Sonoma, une application en arrière-plan ne peut plus s'activer :
   `activateWithOptions` rendait faux à chaque clic et le journal disait « la
   fenêtre suivante n'est pas passée devant ». `focus_fast` retombe donc sur
   `AXFrontmost`, comme `focus()`, et c'est ce chemin-là qui sert. Ensuite, le
   plan refusait de réveiller les fenêtres réduites : un personnage rangé dans le
   Dock devenait un trou invisible dans le défilement, l'application passait
   active sans que rien ne paraisse. `focus_fast` restaure donc la fenêtre du
   client, comme le fait le raccourci « suivant ». Il lit `AXMainWindow` seul, et
   ne retombe sur la recherche d'une fenêtre titrée que si l'application n'en
   nomme aucune : c'est là, et nulle part ailleurs, que le chemin court reste
   plus court que `focus()`. Sur Windows, `IsIconic` puis
   `ShowWindowAsync(SW_RESTORE)` font la même chose pour presque rien.

3. **La bannière.** Elle se redessine après la bascule, jamais avant.

Sur Windows, `live_game_window` interroge le processus de la fenêtre à chaque
appel (`runs_dofus`) : le chemin du clic ne l'emprunte pas non plus, il se fie
au cache.

## L'architecture

### Le chemin d'un clic

1. Le hook voit un relâchement de bouton gauche, non injecté.
2. Il demande au cache si la fenêtre cliquée est une fenêtre de jeu, et si une
   bascule est en vol. Si elle l'est, il **mange** l'événement et s'arrête là.
3. Sinon il laisse passer le clic, ferme la porte, et réveille le fil de la
   bascule. Tout ce qui précède tient dans le rappel du hook et doit rester en
   microsecondes : une lecture atomique et une recherche dans un ensemble.
4. Le fil de la bascule lit le cache, demande le premier plan de la fenêtre
   suivante, puis attend le constat. Constat obtenu ou plafond atteint : la
   porte se rouvre, la mesure est rangée, la bannière est prévenue.

### Reconnaître une fenêtre de jeu, et vite

Les deux plateformes ne donnent pas la même chose, et le plan l'assume :

- **Windows** : `WindowFromPoint` puis `GetAncestor(GA_ROOT)`, et le `HWND`
  obtenu est cherché dans l'ensemble des fenêtres de jeu tenu par le scan. Ni
  lecture de titre, ni interrogation de processus. C'est exact même quand on
  clique une fenêtre qui n'est pas devant, et ça écarte la barre des tâches.
- **macOS** : un tap d'événements ne dit pas quelle fenêtre a été cliquée, et
  demander la liste des fenêtres coûte trop cher. On garde donc le pid de
  l'application au premier plan dans une valeur atomique, tenue à jour par
  l'observateur de `NSWorkspace`, et on le compare à l'ensemble des pids Dofus.
  La conséquence : cliquer un client qui n'est pas devant n'est pas vu comme un
  clic de jeu. En fenêtres empilées, le cas ne se présente pas.

### Constater la bascule

- **Windows** : `GetForegroundWindow()` comparé à la cible, relu toutes les
  quelques millisecondes. L'appel est court et sans verrou.
- **macOS** : l'observateur `NSWorkspace` qui tient déjà le pid du premier plan
  réveille le fil de la bascule. Pas d'attente active.

### Quand le système coupe l'écoute

Windows débranche un hook bas niveau dont le rappel traîne trop
(`LowLevelHooksTimeout`), macOS désactive un tap au même motif
(`kCGEventTapDisabledByTimeout`). Le mode se retrouverait « allumé » sans rien
faire : le bug qu'on répare, revenu par l'autre porte.

On rebranche tout seul, **et on pose une ligne au journal**. Taire une coupure,
c'est reconstruire le mensonge ; la ligne est ce qui permettra de comprendre
« ça a sauté deux fois hier soir ».

## Ce qui a été livré, et ce qu'on a changé au plan

Windows d'abord, comme demandé. macOS compile et l'écran le dit, mais rien n'y
écoute les clics.

### Livré

- `src-tauri/src/platform/click.rs` : la porte (`ClickGate`), le trait
  `ClickWatcher`, le rapport `ClickReport`, le plafond et le budget.
- `src-tauri/src/platform/windows.rs` : le hook `WH_MOUSE_LL` et le
  `SetWinEventHook(EVENT_SYSTEM_FOREGROUND)` sur un seul fil et une seule boucle
  de messages, `WM_LBUTTONUP`, les injectés écartés, le retour `1` qui mange le
  clic, `focus_fast`.
- `src-tauri/src/platform/macos.rs` : `focus_fast` par `activateWithOptions`
  sans un appel d'accessibilité, et `UnwatchedClicks` qui refuse d'écouter.
- `src-tauri/src/app/walk.rs` : le fil de la bascule, le cache, l'allumage.
- `src-tauri/src/app/state.rs` : l'état, les mesures, `walk_plan()`.
- `src-tauri/src/config/settings.rs` : `ShortcutAction::Walk`,
  `Control+Shift+KeyD`. L'état allumé ne s'écrit pas.
- `shortcuts.rs`, `tray.rs`, `journal.rs`, `view.rs`, `commands.rs`.
- `src-tauri/src/app/banner.rs` : la fenêtre de la bannière, son coin, son
  écran, l'aperçu, et le suivi du premier plan.
- `banner.html`, `src/banner.tsx`, `src/banner.css`, `src/screens/banner-screen/`,
  l'entrée `banner` de `vite.config.ts`, et `src-tauri/capabilities/banner.json`.
- `src/theme.css` : les jetons du thème, sortis de `index.css` pour que les deux
  pages les partagent.
- Les quatre commandes `set_banner_corner`, `set_banner_screen`,
  `banner_screens`, `banner_step`, et le panneau de placement de l'écran.
- L'écran Déplacement, ses phrases, son entrée dans le rail, et les lignes du
  journal.

### Ce qu'on a changé au plan, et pourquoi

**La bascule ne se constate plus par sondage.** Le plan proposait de relire
`GetForegroundWindow()` toutes les quelques millisecondes. Un `sleep` de 1 ms
sur Windows n'est pas fiable au point où on compte, et le sondage est du temps
brûlé. Le fil du hook porte donc un second crochet, `EVENT_SYSTEM_FOREGROUND`,
qui réveille la bascule à l'instant où la fenêtre visée passe devant. Pas de
sondage, et une mesure juste.

**On ne réveille plus le scan après une bascule.** Le plan le demandait. Le
cache ne dépend que du roster et des fenêtres, que la bascule ne touche pas :
c'était six cents énumérations de fenêtres par soirée pour rien.

**Le verrou d'état n'est pas le danger que le plan croyait.** `refresh_windows`
énumère les fenêtres **avant** de prendre le verrou : le scan ne le tient que
quelques microsecondes. Le cache du clic reste néanmoins séparé, et le rappel du
hook n'y touche qu'en `try_lock` — s'il est pris, le clic passe et ne bascule
rien, plutôt que d'attendre.

**Pas de bannière, pas d'émission de snapshot par clic.** L'écran Déplacement
redemande le tableau de bord une fois par seconde, et seulement tant que le
Déplacement est allumé et l'écran ouvert. Fermé, il ne coûte rien.

**La coupure de l'écoute se détecte par sa cause.** Windows ne prévient pas
quand il débranche un hook trop lent. Le rappel se chronomètre donc lui-même
contre `LowLevelHooksTimeout`, lu dans la base de registre, et se rebranche en
se postant un message. Le journal dit si l'écoute est revenue.

**Le clic mangé l'est des deux côtés.** Le hook écoute aussi
`WM_LBUTTONDOWN` : ne manger que le relâchement laisserait au client un bouton
qu'il croit encore enfoncé. Seul le relâchement compte comme clic ; l'enfoncement
n'est mangé que si la porte est déjà fermée.

**La mesure part du hook.** L'horloge est prise dans le rappel, pas au réveil du
fil de la bascule : sinon la règle sous-estime exactement ce qu'elle est là pour
prouver.

**Le mode ne peut plus mentir.** Si le rebranchement du hook échoue, le fil de
la bascule éteint le Déplacement lui-même : l'interrupteur, la barre et l'écran
disent éteint, et le journal dit pourquoi. C'est le geste que le plan réclamait.

**Qui ferme la porte l'ouvre.** Éteindre le Déplacement ne rouvre plus la porte
de force ; la bascule en vol s'en charge, et le rappel la rouvre lui-même si le
fil de la bascule n'est plus là pour l'entendre. Sans cette règle, un clic
pouvait rester mangé pour toujours.

**Le budget vient du Rust**, 60 ms sur Windows et 120 ms ailleurs : c'est un
fait de plateforme, pas une constante d'interface.

**`tsconfig.json` passe en ES2022.** `oxlint --fix` réécrit
`tableau[tableau.length - 1]` en `.at(-1)`, que la bibliothèque ES2020 ne
connaît pas. Le WebView de Tauri v2 le connaît.

**Le Déplacement a ses propres gestes.** `WalkFrom` — la fenêtre, la barre, le
raccourci, ou Multifus qui n'écoutait plus — plutôt que d'élargir `Surface`, que
seuls l'AutoFocus et les messages privés emploient et qui ne connaît que deux
faces.

### L'écran

Un interrupteur, le rappel du raccourci, et le placement de la bannière. Rien
d'autre.

La règle graduée des dernières bascules en millisecondes a servi à trouver la
panne, et elle est partie avec : un joueur de Dofus ne règle rien avec un
chiffre en millisecondes. Elle a coûté `WalkMeasure`, `walk_measures`, le budget
et le plafond dans la vue, `helpers/walk.ts`, `switch-ruler.tsx`,
`measures-panel.tsx` et `use-snapshot-ticker.ts`. L'écran ne redemande plus le
tableau de bord une fois par seconde.

## La bannière

### Ce qu'elle coûte, et pourquoi elle ne coûte rien

C'est la contrainte qui commande tout le reste : une fenêtre posée devant un
client de jeu ne doit rien lui prendre. Sept décisions en découlent.

1. **Elle n'existe que Déplacement allumé.** Elle se construit à l'allumage et
   se ferme à l'extinction. Éteint, il n'y a ni processus WebView2, ni surface à
   composer, ni mémoire tenue. La construction coûte deux cents millisecondes,
   une fois, sur un geste volontaire.
2. **Sa page n'a ni minuteur, ni sondage, ni `requestAnimationFrame`.** Elle se
   dessine sur un événement, puis elle ne bouge plus. Un WebView2 qui ne
   redessine pas ne consomme pas.
3. **Une animation, deux cent vingt millisecondes**, sur `transform` et
   `opacity` seuls : le compositeur la porte, ni disposition ni peinture. Elle
   ne part qu'à la bascule, et ne boucle pas. Un filet d'or balayait sous la
   pilule : il sautait, il est parti.
4. **Pas de flou d'arrière-plan.** C'est la dépense chère : elle oblige le
   gestionnaire de fenêtres à relire ce qu'il y a derrière à chaque image. Fond
   plein, et une bordure d'or.
5. **250 × 64 points**, la plus petite surface qui porte encore le message. Ni
   grain, ni halo : les deux couvrent toute la surface et se mélangent.
6. **`set_ignore_cursor_events(true)` et fenêtre non focalisable.** Windows ne
   lui adresse aucun test de survol et aucune entrée. Elle est une image, pas
   une fenêtre.
7. **L'événement part après la bascule**, une fois la porte rouverte et la
   mesure rangée. Il ne peut pas être sur le chemin du clic, même en théorie.

### Où elle se pose

Le coin et l'écran se choisissent dans l'écran Déplacement, sur un écran
miniature : quatre coins cliquables, et un petit fuseau d'or qui va se poser
dans celui qu'on désigne. Choisir montre la vraie bannière, à sa vraie place,
pendant deux secondes et demie — même Déplacement éteint. On voit ce qu'on
règle.

Cet aperçu n'était pas au plan, et il touche à « elle disparaît avec lui » : une
bannière qui paraît Déplacement éteint est exactement le malentendu qu'on
répare. Elle dit donc **« Aperçu »** dans ce cas, jamais « Déplacement ». Le mot
dit ce qu'elle est, et l'emplacement se règle en le voyant.

Le coin se calcule sur la **zone de travail** de l'écran, pas sur sa taille :
la bannière ne passe jamais sous la barre des tâches.

Défaut : en bas à droite. Dans Retro, le haut-gauche porte le portrait et la
vie, le haut-droite la mini-carte, le bas-gauche le chat.

### Elle ne suit pas la souris, elle suit le jeu

Elle ne se montre qu'au-dessus d'une fenêtre de jeu. Sur le bureau, dans un
navigateur, dans la fenêtre de Multifus, elle s'efface. Le signal qu'elle porte
ne vaut que là où le clic compte.

Ça ne coûte pas un sondage : le `SetWinEventHook(EVENT_SYSTEM_FOREGROUND)` que
la bascule emploie déjà rapporte chaque changement de premier plan, et le fil de
la bascule montre ou cache. Elle n'est pas détruite pour autant — cachée
suffit, et la rouvrir coûterait deux cents millisecondes à chaque va-et-vient.

### Ce qu'elle porte

Le pas de pieds en or — le Déplacement est allumé —, la tête de classe du
personnage et son pseudo. Rien d'autre.

À l'allumage elle porte déjà quelqu'un : `foreground_game_window()` dit qui est
devant, une fois, sur un geste volontaire. Allumé au raccourci depuis le jeu,
elle nomme le personnage sur lequel on est. Allumé depuis la fenêtre de
Multifus, aucune fenêtre de jeu n'est devant : elle dit « Déplacement » et
attend le premier clic. C'est vrai dans les deux cas.

Quand plus personne n'est dans le défilement, elle oublie son personnage plutôt
que de garder l'ancien : le journal et la bannière ne se contredisent pas.

### Un bord connu

Éteindre puis rallumer le Déplacement en moins de cinquante millisecondes peut
laisser la bannière absente : Tauri tient encore le nom `banner` pendant que la
fenêtre se ferme, et la reconstruction est refusée. Le journal le dit, et un
nouvel aller-retour de l'interrupteur la ramène. Le corriger demanderait
d'attendre l'événement `Destroyed` ; ça ne vaut pas la peine tant qu'on n'a pas
vu le cas arriver pour de vrai.

## Le clic coupé en deux

Un personnage sur cinq ne bougeait pas. La cause n'est pas une course, c'est une
faute de conception, et elle était lisible dans `verdict_of`.

Un clic, c'est deux événements. La porte les jugeait séparément :

1. Le relâchement sur A lance la bascule.
2. L'enfoncement sur B tombe pendant qu'elle vole. **Il est mangé.**
3. La bascule finit en cinq millisecondes.
4. Le relâchement sur B, lui, trouve la porte ouverte et passe.
5. Dofus reçoit un relâchement sans enfoncement : **aucun clic**. B ne bouge pas.
6. Multifus compte ce relâchement et bascule quand même.

Et pire : entre l'enfoncement et le relâchement, la fenêtre sous le curseur a
changé. `WindowFromPoint` au relâchement nomme la fenêtre qui vient de passer
devant, pas celle qu'on a pressée. Le clic était attribué à la mauvaise.

**La règle, maintenant : le verdict se décide à l'enfoncement, et le
relâchement le suit.** Le hook retient ce qu'il a décidé (`Press::Eaten` ou
`Press::Ours(window)`) et le relâchement l'applique sans rejuger. Trois
conséquences :

- Dofus ne voit jamais la moitié d'un clic. Mangé, il l'est en entier.
- La fenêtre retenue est celle où le bouton a été pressé.
- Un clic parti trop tôt ne bascule plus non plus : on le perd, mais rien ne
  bouge derrière notre dos.

Cinq tests dans `platform/windows.rs` le tiennent, dont celui qui reproduit la
panne : porte fermée à l'enfoncement, rouverte avant le relâchement.

## Le temps qu'il faut au client pour prendre le clic

Le hook a été instrumenté — chaque événement de bouton tracé, avec la fenêtre
sous le curseur, le premier plan, la porte, le verdict — et il est **hors de
cause**. Onze clics, onze bascules, aucun mangé, aucun raté, aucun double-clic,
`premierplan` toujours égal à la fenêtre cliquée, bascules à 4-5 ms, `arrivee`
vraie à chaque fois. Le jeu recevait un clic entier et valide, et ne bougeait
pas.

**Deux pistes essayées et rejetées :**

- Le clic coupé en deux (l'enfoncement mangé, le relâchement passé). Réel,
  corrigé, mais ce n'était pas la panne : le verdict se décide maintenant à
  l'enfoncement et le relâchement le suit. Les cinq tests de `windows.rs` le
  tiennent, et ça reste juste.
- Poster un `WM_MOUSEMOVE` à la fenêtre visée après la bascule, pour lui dire où
  le curseur est déjà. La trace montrait `bouges=0` sur tous les seconds clics —
  la souris ne bougeait pas d'un pixel entre les deux. **Ça a empiré.** Retiré.

**Ce qui reste, et ce qu'on fait :** on prenait le premier plan au client cinq
millisecondes après son clic. Un client Flash traite le clic à l'image suivante,
et il perd le premier plan avant d'y arriver. C'est la fenêtre qui vient de
recevoir le clic qu'on faisait taire.

`SETTLE = 95 ms`, le délai de Dracoon, attendu **avant** de demander le premier
plan. Le clic a le temps d'aboutir. Le budget suit : `SETTLE + 60` sur Windows,
`SETTLE + 120` ailleurs, plafond `SETTLE + 250` — la règle de l'écran garde son
sens, elle mesure toujours du relâchement à la fenêtre devant.

Le prix est celui que Dracoon paie : la porte reste fermée cent millisecondes,
et un second clic parti pendant ce temps est mangé. On l'accepte pour zéro
panne, et on redescendra le chiffre par essais une fois qu'on saura qu'il tient.

**Redescendu sur macOS, à l'essai.** Deux clics à la vitesse d'un double clic ne
déplaçaient que le premier personnage : le second tombait dans les cent
millisecondes de porte fermée. `SETTLE` vaut donc 40 ms hors de Windows, et le
temps déjà passé à demander qui est sous le curseur en fait partie plutôt que de
s'y ajouter. Si un clic se perd — le personnage cliqué ne bouge pas du tout —,
c'est que le client n'a pas eu le temps de le prendre, et le chiffre remonte.

## macOS écoute les clics

Le tap est livré, et l'interrupteur s'ouvre des deux côtés. Ce qui a été écrit,
et ce que macOS a imposé de différent :

- `MouseTapClickWatcher` en place de `UnwatchedClicks` : un `CGEventTap` de
  session, posé en tête, sur l'enfoncement et le relâchement du bouton gauche,
  sur son fil et son `CFRunLoop`. Il rend un pointeur nul pour manger un clic.
- **Le verdict est devenu commun aux deux systèmes.** `ClickJudge`, `Verdict` et
  `Press` vivent dans `platform/click.rs`, et les cinq tests du clic coupé en
  deux avec eux : ils tournaient sur Windows seulement, ils tournent maintenant
  partout, y compris sur la machine où le code s'écrit.
- **La fenêtre cliquée est celle qui est devant.** Un tap ne dit pas quelle
  fenêtre a reçu le clic. Le pid de l'application au premier plan est tenu dans
  une valeur atomique par un observateur de `NSWorkspace`, et sur macOS
  `WindowId` **est** le pid : le rappel compare sans rien traduire, et
  `ClickGate` écarte tout ce qui n'est pas une fenêtre de jeu.
- **La bascule se constate par le même observateur.** `didActivateApplication`
  réveille la bascule et prévient la bannière. Pas de sondage, comme sur Windows.
- **La coupure est rattrapée des deux causes.** `kCGEventTapDisabledByTimeout` et
  `kCGEventTapDisabledByUserInput` réactivent le tap. Si le système le refuse
  encore, le Déplacement s'éteint tout seul, comme sur Windows.
- **Une coupure rattrapée pose enfin sa ligne au journal**, sur les deux
  systèmes : `ClickReport::ListeningResumed`, puis `WalkListeningResumed`. Le
  plan le réclamait, et rien ne le disait jusqu'ici.
- **L'extinction ne traîne pas.** Le fil du tap dort dans son run loop ; éteindre
  l'arrête depuis l'autre fil plutôt que d'attendre le prochain quart de seconde.
- Sans l'autorisation d'accessibilité, `start` refuse et le journal le dit :
  l'interrupteur reste éteint plutôt que d'être allumé et sourd.
- `walk.supported` a disparu de la vue, avec `WATCHES_CLICKS`, la mention
  « Windows uniquement » de l'écran et la ligne « indisponible sur ce système »
  du transcript. Les deux systèmes écoutent.

### Le clic se confirme après coup

Le plan pariait que le premier plan suffisait à nommer la fenêtre cliquée sur
macOS. **Faux, et ça se voit tout de suite** : un clic sur le Dock, sur la barre
des menus, ou sur une fenêtre posée à côté du jeu partait pendant que le jeu
était encore devant. Multifus comptait le clic et ramenait Dofus par-dessus
l'application qu'on venait d'ouvrir. `kCGEventTargetUnixProcessID` a été essayé :
il ne dit rien d'utile pour un tap de session.

Le jugement se fait donc **en deux étages**, et le second n'est plus dans le
rappel :

1. **Le rappel**, en microsecondes, décide seulement s'il faut manger : porte
   fermée et premier plan dans le défilement. Il rapporte le clic avec **le point
   où le bouton a été pressé**.
2. **Le fil de la bascule** demande au système ce qu'il y a sous ce point,
   `client_at`. Ce n'est pas la fenêtre du défilement : rien ne bouge, et la
   porte se rouvre.

Le point vient de l'événement, pas du curseur : bouger la souris juste après le
clic ne change rien à la réponse.

- **macOS** : `AXUIElementCopyElementAtPosition` sur l'élément système, puis le
  pid de l'élément trouvé. **Sans délai d'attente** : `set_messaging_timeout` sur
  l'élément système vaut pour tout le processus, le scan compris, et un scan à
  plusieurs clients dépasse 50 ms. Le prix est qu'un client muet retient la
  bascule ; le fil du Déplacement est seul à attendre.
- **Windows** : `WindowFromPoint` sur le même point, ce que le hook faisait déjà.
  La réponse est la même, pour presque rien.

Reste deux cas, et ils sont connus :

- La barre des menus du client appartient au client lui-même, donc un clic dedans
  compte comme un clic de jeu.
- **Le premier étage garde le dernier mot sur ce qui n'est pas compté.** Il ne
  rapporte le clic que si le premier plan est déjà une fenêtre de jeu : revenir
  d'un navigateur et cliquer dans un client déplace le personnage sans passer au
  suivant, parce que le clic qui active la fenêtre part avant que le système ne
  dise qui est devant. Pour le lever, il faudrait rapporter **tous** les clics
  gauche et laisser le second étage jeter, soit un aller-retour d'accessibilité à
  chaque clic du système. À voir si ça gêne pour de vrai.
- Un clic que le système ne sait pas placer est perdu sans une ligne au journal.
  Distinguer « rien sous le curseur » de « pas de réponse » demanderait une
  variante de plus, et le premier cas est le cas courant.

## Ce qui reste

- [ ] La bannière sur macOS : `transparent` demande `macOSPrivateApi`, activé,
      mais rien n'est vérifié là-bas. Le plan doute qu'elle tienne au-dessus
      d'un client en plein écran.
- [ ] Mesurer ce que coûte `AttachThreadInput` dans `focus_fast` : la règle de
      l'écran le dira sur une vraie soirée.
- [ ] Ne pas compter les clics pendant les N secondes qui suivent une frappe au
      clavier, si les clics dans le chat gênent.
- [ ] `kCGEventTargetUnixProcessID` a été essayé sur l'événement : il ne porte pas
      le pid du destinataire pour un tap de session. Ne pas y revenir.
- [ ] Le tap et le hook portent deux fois le même aiguillage — enfoncement vers
      le juge, relâchement vers le juge, sinon laisser passer — et deux fois la
      même table `gate` plus `sink` plus `judge`. Un seul type des deux côtés le
      dirait mieux, une fois qu'on aura de quoi compiler Windows ici.

## À vérifier sur une vraie soirée

- [ ] macOS : l'interrupteur allume, et le premier clic dans un client déplace
- [ ] macOS, l'accessibilité retirée : l'interrupteur reste éteint et le journal
      dit pourquoi
- [ ] macOS : un clic sur le Dock, sur une autre fenêtre, sur le bureau : rien ne
      doit bouger
- [ ] macOS : la bannière au-dessus d'un client, en fenêtré puis en plein écran
- [ ] Deux clients, mode allumé : deux clics rapides déplacent deux personnages
- [ ] Le second clic parti trop tôt est mangé, et le premier personnage ne se
      déplace pas deux fois
- [ ] Le raccourci allume et éteint depuis la fenêtre de Multifus, hors du jeu
- [ ] Mode éteint, un clic dans le jeu ne fait rien de particulier
- [ ] Un clic hors du jeu — barre des tâches, navigateur — ne fait rien
- [ ] Un clic sur un client de côté amène quand même le premier du défilement
- [ ] Multifus relancé démarre Déplacement éteint, sans exception
- [ ] Tous les personnages de côté : le journal dit que personne n'est dans le
      défilement, et le mode reste allumé
- [ ] La ligne du menu de la barre dit le bon état et le bascule
- [ ] `Control+Shift+KeyD` posé sur une réponse rapide est refusé par le nom du
      Déplacement
- [ ] Fermer tous les clients, mode allumé : rien ne casse
