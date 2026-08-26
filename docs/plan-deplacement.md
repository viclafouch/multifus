# Déplacement

Chaque clic gauche dans une fenêtre de jeu passe au personnage suivant du
défilement. On clique pour déplacer son principal, la fenêtre de la mule prend
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
   chemin court : `activateWithOptions` sur le pid en cache, pas un seul appel
   d'accessibilité, et pas de réveil des fenêtres réduites — un personnage rangé
   dans le Dock n'est pas un personnage qu'on déplace au clic.
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

Une règle graduée de 0 au plafond, la ligne du budget en or, et une barre par
bascule gardée — verte sous le budget, ambre au-dessus, rouge si la fenêtre
n'est jamais passée devant. La plus récente est la plus vive. On lit d'un
coup d'œil si ça tient, sans lire un chiffre.

## Ce qui reste

- [ ] La bannière : sa fenêtre, sa page, son entrée dans `vite.config.ts`, son
      coin et son écran dans les réglages, l'événement après la bascule.
      Rien n'a été écrit : le plan lui-même doute qu'elle tienne au-dessus d'un
      client en plein écran sur macOS, et c'est la seule pièce que le mécanisme
      n'attend pas pour marcher.
- [ ] macOS : le `CGEventTap` sur `kCGEventLeftMouseUp`, l'observateur
      `NSWorkspace` pour le pid du premier plan et pour constater la bascule, le
      rebranchement sur `kCGEventTapDisabledByTimeout`.
- [ ] Mesurer ce que coûte `AttachThreadInput` dans `focus_fast` : la règle de
      l'écran le dira sur une vraie soirée.
- [ ] Ne pas compter les clics pendant les N secondes qui suivent une frappe au
      clavier, si les clics dans le chat gênent.

## À vérifier sur une vraie soirée

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
- [ ] La règle de l'écran tient le budget de 60 ms
- [ ] Fermer tous les clients, mode allumé : rien ne casse
