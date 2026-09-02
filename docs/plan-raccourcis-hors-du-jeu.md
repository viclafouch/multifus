# Rendre la touche quand on n'est pas dans le jeu

Une réponse rapide posée sur `Shift+Digit1` a mangé le chiffre 1 dans Chrome,
Multifus allumé. Sur un AZERTY, `Shift` et la touche du 1 écrivent le 1 : la
combinaison la plus banale du clavier était prise par nous, partout, tout le
temps.

Le code est écrit sur les deux systèmes. Rien n'est prouvé sur Windows.

## Ce qui se passait

`shortcuts::apply` enregistre chaque combinaison auprès du système, une fois, et
la garde jusqu'à ce que Multifus s'arrête. Le système donne la frappe à
Multifus et à personne d'autre, où que soit le joueur.

La garde de `answer` interroge ensuite `foreground_game_window()` et refuse la
frappe hors du jeu, en le disant au journal. Trop tard : la touche est déjà
perdue pour l'application qui la méritait.

`docs/plan-focusretro.md` avait vu le défaut et conclu qu'il fallait un crochet
clavier bas niveau, donc la permission Surveillance des entrées sur le Mac, donc
non. Il manquait la troisième route, qui ne demande rien à personne : **ne
prendre la combinaison au système que pendant que le jeu est devant**.

## Ce qu'on fait

Multifus arme les raccourcis quand une fenêtre du jeu passe au premier plan, et
les rend dès qu'on en sort. La règle est celle de la Frappe, qui ne valait déjà
que dans le jeu : elle passe seulement de la garde au registre du système.

Le désarmement existait déjà, `suspend_shortcuts` et `resume_shortcuts` s'en
servent le temps qu'un champ des Raccourcis lise une combinaison. On le
généralise, on ne l'invente pas.

L'état voulu se lit d'un mot, « le jeu est devant », exactement ce que la garde
demande : armé veut dire que la frappe serait acceptée. Ce mot était écrit trois
fois dans le code, dans la bannière, dans la roue et ici. Il est maintenant à
côté de `WindowManager`, sous le nom `matches_game_in_front`, et les trois
l'appellent.

### D'où vient le signal

Le tour ne suffit pas. Cent cinquante millisecondes de repos plus le tour
lui-même, c'est le temps qu'il faut à un joueur pour cliquer sur son client et
frapper. Une frappe arrivée trop tôt part dans le jeu, et lance un sort.

Le réveil porte donc sa raison. `WakeSink` prend un `Wake` :

- `Wake::GameWindows`, ce qu'il portait déjà, une fenêtre du jeu apparue,
  renommée ou fermée.
- `Wake::Foreground`, l'application du premier plan a changé.

Sur `Wake::Foreground`, le crochet ne fait que passer le mot au fil des
raccourcis, `multifus-shortcuts`, qui tenait déjà les frappes. Lui seul lit le
premier plan, prend le verrou et parle au registre du système. Le crochet du Mac
parle depuis le fil de l'interface, `addObserverForName…` recevant `queue: nil` :
un appel d'Accessibilité qui attend un client bloqué y figerait l'écran. Le fil
des raccourcis réveille le tour quand l'armement a changé, et lui seul.

- Mac : `NSWorkspaceDidActivateApplicationNotification`, la même mécanique que
  `watch_the_clients_coming_and_going` et que l'écoute des clics.
- Windows : `EVENT_SYSTEM_FOREGROUND`, un crochet de plus sur le fil qui tient
  déjà `CREATE`, `DESTROY` et `NAMECHANGE`.

Le tour garde un filet, une fois par seconde : il passe le même mot, par la même
file, donc les deux chemins ne peuvent pas se croiser.

### Ce que l'écran des Raccourcis continue de savoir

`apply` arme pour de vrai, même hors du jeu, puis rend aussitôt. C'est ce qui
donne les statuts que l'écran montre : « refusé » ne se sait qu'en demandant la
combinaison au système, et l'écran n'est jamais regardé depuis le jeu. Le
désarmement ne touche ni `shortcut_statuses` ni `held` : l'écran garde ce que la
dernière demande a appris.

## Ce que ça coûte

- Une bascule d'application coûte un `foreground_game_window()`, l'appel que la
  roue et le Déplacement rapide font déjà à chaque tour. Une entrée dans le jeu
  coûte plus : un `unregister_all`, un enregistrement par combinaison, et la
  relecture des statuts. Une poignée d'appels Carbon, sur un fil qui ne fait que
  ça.
- Entre l'activation du client et l'armement il reste quelques millisecondes.
  Une frappe tombée dans ce trou part au jeu. Symétriquement, une frappe partie
  juste après avoir quitté le jeu peut encore être mangée.
- La roue maintenue pendant que le premier plan change ne verra jamais son
  relâchement, le raccourci ayant été rendu entre-temps. `wheel::follow_foreground`
  la ferme au tour suivant, comme aujourd'hui.
- Le journal dira beaucoup moins souvent qu'une frappe est refusée hors du jeu.
  La garde reste, elle couvre la course entre la frappe et le désarmement.
- Windows pose ses crochets avec `WINEVENT_SKIPOWNPROCESS` : le passage du jeu à
  la fenêtre de Multifus n'émet donc rien pour nous, et c'est le tour qui rend
  les combinaisons, jusqu'à une seconde plus tard. Aller sur le jeu, lui, est vu
  tout de suite, et c'est le sens qui compte.
- L'Accessibilité refusée, rien n'est armé, puisque le premier plan ne se lit
  plus. Rien ne se passait déjà, la garde refusait tout. En développement, c'est
  le binaire de `tauri dev` qui doit l'avoir, sinon aucun raccourci ne s'arme et
  ça se lit comme une panne.
- Le journal ne redit « raccourcis liés » que si la réponse du système a changé,
  `remember_bound` comparant à ce qu'il gardait. Sans cela, chaque retour dans le
  jeu aurait posé une ligne, `push_unless_repeated` ne comparant qu'à la
  précédente.
- Un `unregister_all` que le système refuse laisse les combinaisons armées et
  posées : le premier plan suivant redemande, plutôt que de croire un rendu qui
  n'a pas eu lieu.

## Ce qui reste à essayer

- [ ] Mac, sur le build installé dans `/Applications` : `Shift+Digit1` écrit le
      1 dans Chrome, Multifus allumé, et colle la réponse rapide dans le jeu.
- [ ] Mac : cliquer sur un client puis frapper aussitôt un raccourci, il répond.
- [ ] Mac : l'AutoFocus ramène une fenêtre devant, le raccourci suivant répond.
- [ ] Mac : maintenir la roue, relâcher, elle bascule toujours.
- [ ] Windows : tout ce qui précède, jamais lancé.
- [ ] L'écran des Raccourcis montre toujours les combinaisons liées, refusées et
      en double, Multifus devant et donc raccourcis désarmés.
- [ ] Le journal ne se remplit pas de « raccourcis liés » quand on entre et sort
      du jeu vingt fois.
