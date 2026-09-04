# Réveiller le tour

Le tour dormait une seconde entre deux passages, quoi que fasse le système. Un
événement du système le réveille maintenant, et la seconde ne sert plus que de
filet.

Le code est écrit sur les deux systèmes. Rien n'est prouvé : ce fichier ne garde
que les essais à faire et ce qu'on a mesuré pour décider.

## Ce qu'on a mesuré avant d'écrire

Le plan partait de l'idée que le tour est cher et que la seconde nous en
protège. C'est faux, mesuré sur le Mac, Accessibilité accordée :

- Lire le titre des fenêtres d'une application coûte **0,3 à 0,9 ms**, le lien
  avec cette application une fois chaud.
- La toute première lecture d'un processus coûte **30 ms**, une seule fois.
- L'appel d'inventaire des applications Dofus coûte **230 µs**.

Un tour à huit clients coûte donc de l'ordre de dix à trente millisecondes. Le
gain des crochets n'est pas d'économiser le tour, il est de le déclencher plus
tôt. Baisser la seconde à 250 ms aurait donné la même latence pour une ligne,
contre quelques pour cent d'un cœur ; les crochets donnent la même latence pour
presque rien. C'est ce qui a été choisi.

## Ce que le plan disait de faux

**« Ce que le joueur voit » ne valait que pour Windows.** `apply_short_titles`
et `set_window_icon` sont des coquilles vides sur le Mac. L'icône du jeu au lieu
de la tête de classe, le titre long, le bouton de la barre des tâches : rien de
tout ça n'existe sur le Mac. Ce qui s'y voit, c'est la fenêtre pas encore
agrandie et le personnage pas encore connecté.

**La route « minimum » du Mac ne donnait pas ce qu'on lui prêtait.**
`NSWorkspaceDidLaunchApplication` part quand le processus a fini de se lancer,
avant que le client dessine sa fenêtre. Elle couvre le client qui se ferme, et
presque rien du client qui s'ouvre. Il n'y avait pas de demi-mesure : c'est
l'`AXObserver` ou rien.

**Les trois codes d'événement Windows ne se suivent pas.** `CREATE` vaut 0x8000,
`DESTROY` 0x8001, mais `NAMECHANGE` 0x800C. Une seule plage aurait pris treize
sortes d'événements, dont `SHOW`, `HIDE`, `REORDER` et `FOCUS` : le déluge que
le plan voulait justement éviter. Le `const assert` de ROrganizer ne vérifie que
l'ordre, pas la contiguïté, et ROrganizer prend bien la plage large. Multifus
pose deux crochets.

## Ce qui est écrit

**Le repos minimum.** `TurnAlarm` dans `app/runtime.rs` : 150 ms entre la fin
d'un tour et le départ du suivant, réveil compris, pris sur la seconde et non
ajouté à elle. Le drapeau reste levé pendant ce repos, aucun réveil ne se perd.
Six tests.

**Le Mac.** `AccessibilityWakeWatcher` dans `platform/macos.rs`. Un fil à
demeure avec sa boucle, un `AXObserver` par client sur `AXWindowCreated` et
`AXTitleChanged`, posé et retiré par un appel d'inventaire toutes les 250 ms,
qui rattrape aussi un observateur que le système a refusé de poser. Deux
observateurs d'espace de travail réveillent le tour quand la liste des clients
change.

**Windows.** `WinEventWakeWatcher` dans `platform/windows.rs`. Un fil à demeure
avec sa boucle de messages, deux crochets, `CREATE`/`DESTROY` et `NAMECHANGE`,
filtrés sur `OBJID_WINDOW`, `CHILDID_SELF` puis `runs_dofus`.

**`DESTROY` a été tranché.** Pas de réveil sans filtre : chaque menu, chaque
infobulle, chaque liste déroulante de la machine est une fenêtre qui meurt, et
le tour serait parti sans arrêt. Le guetteur tient la liste des fenêtres du jeu,
semée à l'ouverture par l'énumération et tenue à jour par `CREATE` et
`NAMECHANGE`, et ne réveille que pour celles-là. Le plan proposait de commencer
sans filtre et de mesurer ; ça n'a pas été fait, la mesure demandant de vivre
une soirée entière avec un tour qui part à chaque menu.

Ce filtre écarte les fenêtres des autres applications, pas celles du jeu : tout
ce qu'ouvre un processus Dofus entre dans la liste, et sa mort réveille donc le
tour. C'est voulu, une fenêtre du jeu qui s'en va valant un tour.

**Le fil de souris n'a pas été touché.** Deux fils séparés : le crochet de
souris a un budget que Windows lui compte, et un crochet de fenêtre bavard n'a
pas à le manger.

## Le piège qu'on a failli poser

Sans client Dofus ouvert, la boucle du Mac n'a aucune source, et
`CFRunLoopRunInMode` rend alors la main aussitôt. Mesuré : **414 100 tours de
boucle en 600 ms**, soit un cœur entier brûlé en permanence, dans l'état où
Multifus passe le plus clair de son temps. La boucle dort maintenant quand le
système lui rend la main sans rien à attendre, et un test le garde.

Windows n'a pas ce piège, `GetMessageW` bloquant jusqu'au message suivant.

L'autre piège, écarté après lecture : sur Windows, Multifus écrit lui-même les
titres courts, et ce `WM_SETTEXT` part depuis le processus du jeu, que
`WINEVENT_SKIPOWNPROCESS` ne saute donc pas. Le tour se réveillerait lui-même
sans fin si le renommage n'était pas idempotent. Il l'est : `shorten` rend la
main sans écrire quand le titre est déjà court, `lengthen` de même quand il est
déjà long. Un renommage coûte un tour de plus, une seule fois, et c'est un tour
qu'on voulait de toute façon.

## Ce qui est essayé

Le Mac est passé, le 1er septembre 2026. Le client qui s'ouvre est agrandi tout
de suite, le personnage qui se connecte passe connecté tout de suite, le client
qui se ferme passe déconnecté de même, et Multifus au repos une heure à côté
d'un navigateur ne prend rien au processeur. L'`AXObserver` tient, et la boucle
qui brûlait un cœur ne le brûle plus.

## Ce qu'il faut essayer sur Windows

Le code Windows se compile désormais sur la machine Windows, `lint:rust` est vert
et les tests passent. Il n'a jamais été lancé pour autant, et rien de ce qui suit
ne se prouve par un test.

- Ouvrir un client : la fenêtre doit être agrandie tout de suite, et porter la
  tête de classe et le titre court sans attendre la seconde.
- Connecter un personnage : la ligne doit passer connectée tout de suite.
- Fermer un client : la ligne doit passer déconnectée tout de suite.
- Laisser tourner Multifus une heure avec un navigateur ouvert, et regarder la
  consommation : si le tour part plus souvent qu'avant sans qu'aucun client ne
  bouge, le filtre est mauvais.
- Ouvrir et fermer des menus dans d'autres applications, et vérifier que le tour
  ne part pas. C'est le filtre de `DESTROY` qu'on essaie.

## À trancher une fois essayé

Est-ce que le tour réveillé doit tout faire, ou seulement relire les fenêtres.
Il fait tout, et le Mac n'y voit rien coûter. À ne découper que si les essais
Windows disent le contraire.
