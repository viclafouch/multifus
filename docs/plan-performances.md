# Ce que Dracoon fait plus vite

Comparaison des chemins chauds de Dracoon (Python, Windows seul) et de
Multifus. Trois choses à prendre, deux à ne surtout pas casser.

## 1. L'AutoFocus scrute au lieu d'être réveillé, et c'est réglé

Livré. Ce qui a été mesuré, et ce que la mesure a changé.

### L'abonnement de Dracoon ne marche pas chez nous

L'idée était de s'abonner à `UserNotificationListener.NotificationChanged`,
comme `src/core/autofocus.py:343`, et d'être réveillé au lieu de scruter.

`NotificationChanged` rend `0x80070490`, élément introuvable, sur cette machine.
L'événement demande une identité de paquet, MSIX ou UWP. Multifus est distribué
en MSI et en NSIS : il n'en a pas, il n'en aura pas, et le code de l'abonnement
a été retiré plutôt que gardé mort.

À noter pour Dracoon : leur boucle attend l'événement avec un `timeout=30.0`. Si
leur abonnement passe sans lever mais que l'événement ne se déclenche jamais,
ils scrutent toutes les trente secondes, pas toutes les trois cents
millisecondes.

`GetNotificationsAsync` marche sans identité de paquet. Seul l'événement la
demande.

### La mesure

`cargo run --release --example toast-latency` envoie de vraies notifications et
chronomètre l'écart entre l'envoi et la lecture, pour chaque intervalle.
Vingt-quatre notifications par intervalle, une toutes les 1373 ms, une durée
choisie pour ne tomber en phase avec aucun des intervalles essayés.

    intervalle   entendues   minimum   médiane   p95   maximum   moyenne
        500 ms          24     20 ms     236 ms   487 ms     488 ms     242 ms
        250 ms          24     39 ms     206 ms   339 ms     346 ms     190 ms
        150 ms          24     30 ms     134 ms   223 ms     262 ms     133 ms
        100 ms          24     22 ms      96 ms   194 ms     201 ms      99 ms

Ce qui décide, c'est le coût d'un appel `GetNotificationsAsync`, qui monte avec
la file en attente et pas avec le temps :

      0 en attente     1600 µs
      8 en attente    22432 µs
     16 en attente    42619 µs
     32 en attente    52158 µs

## Ce qui est posé

**La file se vide.** `runtime.rs` ne supprimait la notification que si elle
avait fait passer une fenêtre devant, `outcome == Outcome::Focused`. Un exclu,
un type décoché, un principal déjà devant : le toast restait et alourdissait
chaque lecture suivante, une soirée en laissait des dizaines. Maintenant tout
pseudo reconnu voit sa notification partir. Le joueur ne les retrouvera plus
dans son centre de notifications, et c'est voulu : il ne les lit pas.

La suppression part au tour où elle est demandée, `dismiss_queued` passant
désormais après `poll` et non avant. Une seule fuite reste : `runtime.rs` prend
le verrou du watcher en `try_lock` et renonce s'il est tenu, sinon `stop()`, qui
tient ce verrou en attendant la fin du fil, s'enfermerait avec lui. Le toast
perdu ainsi reste jusqu'à ce que Windows l'expire.

**`MINIMUM_REST` remplace `POLL_INTERVAL`, à 100 ms au lieu de 500.** Le nom dit
maintenant ce que c'est : un plancher, pas une cadence. La moyenne tombe de
242 ms à 99 ms, le pire cas de 488 ms à 201 ms. Dix lectures par seconde sur une
file vide coûtent 16 ms par seconde, un soixantième d'un coeur.

**`REST_PER_READ` garde le coût borné.** L'attente vaut au moins dix fois ce que
la lecture vient de coûter. Multifus ne peut pas vider les notifications des
autres applications : un joueur qui laisse trente messages Discord non lus paie
52 ms par lecture, et sans ce garde-fou dix lectures par seconde prendraient la
moitié d'un coeur. Là, la boucle ralentit d'elle-même jusqu'à ne jamais dépenser
plus d'un dixième.

Le chronomètre n'entoure que `GetNotificationsAsync`, à l'intérieur de `poll`.
Il entourait la boucle entière, or `poll` appelle le sink sans rendre la main :
une bascule lente, celle que le point 2 décrit, se serait comptée comme un coût
de lecture et aurait endormi l'écoute dix fois plus longtemps. Le garde-fou
punissait le succès.

## À vérifier sur la vraie machine

- [ ] Un combat sur un personnage exclu : sa notification disparaît du centre de
      notifications, et aucune fenêtre ne bouge
- [ ] Un type décoché dans l'AutoFocus : même chose
- [ ] Trente notifications d'une autre application en attente : Multifus ne
      chauffe pas, et l'AutoFocus répond encore
- [ ] Une soirée entière : le centre de notifications ne garde rien de Dofus

## 2. Chaque bascule paie AttachThreadInput

`focus()` et `focus_fast()` ouvrent un `AttachedInput` : deux
`AttachThreadInput` à l'aller, deux au retour, sur le thread du premier plan et
sur celui du client visé. L'appel sérialise les files d'entrée des deux
threads : tant qu'on est attaché, un client occupé à rendre un combat nous fait
attendre.

Dracoon appelle `SystemParametersInfo(SPI_SETFOREGROUNDLOCKTIMEOUT, 0)` une
seule fois au démarrage (`unlock_foreground_switching`, `src/core/windows.py`).
`SetForegroundWindow` seul suffit ensuite, sans attach et sans la vieille
astuce de la touche Alt. AttachThreadInput leur reste en second recours si
l'appel est refusé quand même.

Deux réserves. Le réglage vaut pour la session Windows entière, pas pour notre
process : il faut le rendre en quittant, comme on rend une Trace. Et Multifus
tué au `Ctrl+C` le laisse à zéro, ce qui se rattrape au démarrage suivant, là
encore comme une Trace.

Gain : la bascule devient un appel unique et non bloquant. Il porte sur les six
raccourcis et sur chaque clic du Déplacement rapide.

## 3. On ouvre un process par fenêtre, une fois par seconde

`runs_dofus()` appelle `OpenProcess`, `QueryFullProcessImageNameW` et
`CloseHandle` pour savoir si une fenêtre est un client. C'est fait pour chaque
fenêtre visible du bureau à chaque `EnumWindows`, donc à chaque tour, et un
bureau ordinaire en porte entre quarante et quatre-vingts. On rouvre le même
handle une fois par seconde pour retrouver les six mêmes identifiants de
process.

Pire : `focus()` passe par `live_game_window()`, qui refait ce test. Un
`OpenProcess` dans le chemin critique de la bascule. `focus_fast()` prend le
handle sans le test, donc le Déplacement rapide est déjà propre, les raccourcis
non.

Un cache `process_id` vers oui-ou-non, vidé quand le process disparaît, ramène
ça à un appel par nouveau client.

Gain : petit en absolu, mais c'est du travail entièrement répété.

## Ce qu'on fait mieux, à ne pas casser

Le Déplacement rapide. Dracoon attend 95 ms en dur après le clic puis cycle
(`_CYCLE_DELAY_MS`, `src/core/movemode.py`), et ne mange jamais le clic. Notre
Porte ferme, la Visée attend l'arrivée réelle de la fenêtre par WinEvent avec un
plafond de 250 ms, et le Juge mange le clic en entier. Plus juste, et plus
rapide dès que le système répond bien.

Le roster garde les identifiants de fenêtre. Dracoon refait un `EnumWindows`
complet à chaque frappe pour retrouver une fenêtre par son pseudo
(`focus_dofus_window`).

Le tour est réveillable par `wake()` : la seconde est un plafond, pas une
cadence.

Leur test de process passe par psutil, un aller-retour Python par fenêtre. Le
nôtre est déjà l'appel direct.

## Ce qui est pire chez eux, à ne pas copier

Un thread qui lit le registre toutes les 300 ms pour surveiller le Mode
Concentration (`autofocus.py:219`).

`reorder_with_ungroup_regroup` enchaîne des attentes en dur de 0,3 s, 0,05 s et
0,2 s.

## Ordre

1. La scrutation des notifications, faite
2. Le déverrouillage du premier plan, le plus large
3. Le cache de process, le moins visible

## Le banc

`cargo run --release --example toast-latency [nombre]` depuis `src-tauri`. Mode
Concentration éteint, machine tranquille.

Il envoie de vraies notifications sous l'identité de PowerShell, chronomètre
l'écart entre l'envoi et la lecture, et ne reprend que les siennes : chaque
notification porte le groupe `multifus-banc`, et le nettoyage passe par
`RemoveGroupWithId`. Ce que PowerShell a posé avant lui reste. Tué en cours de
route, il laisse jusqu'à trente-deux notifications derrière lui, que la passe
suivante ramasse.

Il sonde aussi `NotificationChanged` au démarrage, et dit s'il est accepté ou
refusé. Cette sonde reste, alors que le code de production ne s'abonne plus :
c'est elle qui justifie de ne pas s'abonner, et c'est elle qui dira si une autre
machine ou un autre Windows change la réponse.

Le banc redit `wait`, `pump` et l'ouverture du listener au lieu de les prendre
au code de production, qui les garde privés. C'est voulu : il mesure des
stratégies, dont celles que le code ne tient pas.

La feature `Data_Xml_Dom` du crate `windows` est arrivée avec lui, dans les
dev-dependencies seules.
