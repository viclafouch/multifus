# Réveiller le tour

Le tour dort une seconde entre deux passages, quoi que fasse le système. On veut
qu'un événement du système le réveille, et que la seconde ne serve plus que de
filet.

Vient de l'audit des concurrents : ROrganizer (`src/win/watcher.rs`, sur le
bureau) ne dort pas, il écoute `SetWinEventHook` et rassemble la rafale en
150 ms.

## Ce que le joueur voit

Il lance un client Dofus. Pendant jusqu'à une seconde, la fenêtre garde l'icône
du jeu au lieu de la tête de classe, son titre reste long, elle n'est pas dans
le défilement donc le raccourci la saute, et l'agrandissement à l'ouverture ne
l'a pas encore touchée.

Pareil quand un personnage se connecte : il reste déconnecté dans la liste
jusqu'au tour suivant. Huit clients au lancement d'une session, c'est huit fois
ce délai, l'un après l'autre.

Rien n'est cassé, tout arrive. C'est le genre de lenteur qu'on ne signale jamais
et qui fait qu'un outil semble moins vif qu'un autre.

## Ce que le code fait aujourd'hui

Dans `app/runtime.rs` :

- `SCAN_INTERVAL` vaut une seconde.
- `NEXT_TURN` est un `Mutex<bool>` et un `Condvar`.
- `wait_for_next_turn()` attend le drapeau ou l'échéance, puis remet le drapeau
  à faux.
- `wake()` lève le drapeau et réveille le fil.

`wake()` n'est appelé que depuis `app/commands.rs`, c'est-à-dire depuis la
fenêtre de Multifus. Aucun événement du système ne l'appelle.

Le mécanisme est donc déjà là et il est correct : un `wake()` pendant qu'un tour
tourne n'est pas perdu, le drapeau reste levé et le tour suivant part tout de
suite.

## Ce qu'on ne change pas

Le tour reste. Il pose les traces et il les reprend, c'est sa raison d'être, et
il rattrape ce qu'aucun événement ne dit : un titre changé sans que le système
prévienne, une autorisation retirée, un client tué de force.

La seconde reste aussi, comme plancher. On ajoute des réveils, on n'enlève pas
le battement.

## Windows

Poser un `SetWinEventHook` sur `EVENT_OBJECT_CREATE`, `EVENT_OBJECT_DESTROY` et
`EVENT_OBJECT_NAMECHANGE`, avec `WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS`.
Les trois codes se suivent, un seul appel couvre la plage, et ROrganizer le
vérifie par un `const assert`.

**Le hook doit vivre tout le temps.** Celui d'aujourd'hui, `hook_foreground()`
dans `platform/windows.rs`, est posé par le fil `multifus-clicks`, qui ne tourne
que Déplacement rapide allumé ou roue ouverte. Il faut un fil à demeure, avec sa
boucle de messages, ou déplacer les deux hooks sur un fil commun qui ne s'arrête
jamais.

**Le bruit est le vrai piège.** `EVENT_OBJECT_NAMECHANGE` part pour toutes les
fenêtres de la machine. Un navigateur qui change de titre à chaque seconde
réveillerait le tour à chaque seconde, et on aurait remplacé un battement d'une
seconde par un battement continu. Il faut filtrer dans le callback :

- `id_object == OBJID_WINDOW` et `id_child == CHILDID_SELF`, comme le fait déjà
  `on_foreground` ;
- puis `runs_dofus(handle)`, qui est déjà écrit et qui garde un cache par pid.

**`EVENT_OBJECT_DESTROY` ne se filtre pas pareil.** La fenêtre est morte quand
l'événement arrive, `runs_dofus` ne peut plus répondre. Deux sorties : réveiller
sans filtrer sur ce code seul, une fenêtre qui se ferme étant assez rare, ou
tenir la liste des fenêtres Dofus connues et ne réveiller que pour celles-là.
Commencer par la première, mesurer.

## macOS

Deux routes, et la seconde est celle qui vaut le coup.

**Le minimum.** `NSWorkspaceDidLaunchApplicationNotification` et
`DidTerminateApplicationNotification`, filtrés sur `DOFUS_BUNDLE_ID`, appellent
`wake()`. `watch_workspace(name, told)` existe déjà dans `platform/macos.rs`, et
`WorkspaceWatch` retire l'observateur en se relâchant. Attention, le même
problème qu'à Windows : les observateurs d'aujourd'hui vivent dans l'écoute des
clics, il en faut un qui tienne tout le temps.

Ça couvre le client qui s'ouvre et celui qui se ferme. Ça ne couvre pas le
personnage qui se connecte, qui n'est qu'un changement de titre.

**La bonne route.** Un `AXObserver` par application Dofus, sur
`kAXTitleChangedNotification` et `kAXWindowCreatedNotification`. La machinerie
est déjà écrite pour les bannières : `create_observer(pid, refcon)`,
`observer.add_notification(...)`, `observer.run_loop_source()`, autour de la
ligne 1350 de `platform/macos.rs`. Il faut la reprendre pour les clients, un
observateur par pid, posé quand une application Dofus apparaît et relâché quand
elle s'en va, ce que les deux notifications d'espace de travail disent déjà.

Avec ça, le Mac voit la connexion d'un personnage aussi vite que Windows.

## Le plancher entre deux tours

`wake()` n'a pas de repos minimum. Une rafale d'événements, et le tour tourne
sans discontinuer : chaque tour lit toutes les fenêtres par l'Accessibilité ou
par Win32, ce n'est pas gratuit.

À ajouter dans `wait_for_next_turn()` : un repos minimum, 150 ms comme
ROrganizer, entre la fin d'un tour et le départ du suivant, réveil compris. Le
drapeau reste levé pendant ce repos, rien n'est perdu, le tour part juste un
peu plus tard.

C'est la seule modification du cœur. Elle se fait et se teste seule, avant
d'écrire une seule ligne de plateforme.

## Ce qu'il faut construire

- [ ] Le repos minimum dans `wait_for_next_turn()`, avec ses tests
- [ ] macOS : l'observateur d'espace de travail à demeure, filtré sur le bundle
      de Dofus, qui appelle `wake()`
- [ ] macOS : l'`AXObserver` par client sur le titre et la création de fenêtre
- [ ] Windows : le fil à hooks qui ne s'arrête jamais, et le hook de
      `CREATE`, `DESTROY` et `NAMECHANGE` filtré sur Dofus
- [ ] Windows : décider quoi faire de `DESTROY`, qu'on ne peut pas filtrer
- [ ] Retirer la ligne de `docs/plan-audit-concurrents.md` une fois les deux
      systèmes livrés

## Ce qu'il faut essayer

Sur les deux machines, parce que rien de tout ça ne se prouve par un test.

- Ouvrir un client : la tête de classe et le titre court doivent arriver tout de
  suite, plus au bout d'une seconde.
- Connecter un personnage : la ligne doit passer connectée tout de suite.
  Sur le Mac, cet essai échoue si seule la route `NSWorkspace` est faite.
- Fermer un client : la ligne doit passer déconnectée tout de suite.
- Laisser tourner Multifus une heure avec un navigateur ouvert, et regarder le
  journal et la consommation : si le tour part plus souvent qu'avant sans
  qu'aucun client ne bouge, le filtre est mauvais.

## À trancher

- Windows : un fil commun pour le hook de souris et les hooks de fenêtre, ou
  deux fils. Le premier est plus simple à arrêter, le second évite qu'un hook
  bavard retarde l'autre.
- Est-ce que le tour réveillé doit tout faire, ou seulement relire les fenêtres
  et laisser le reste au battement d'une seconde. Commencer par tout faire,
  c'est ce que le tour sait faire, et ne découper que si ça coûte trop cher.
