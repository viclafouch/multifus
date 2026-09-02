# Focus Retro, technique contre technique

Audit du code de [alacroix/focusretro](https://github.com/alacroix/focusretro), lu
en entier dans `~/Desktop/focusretro`. On ne compare que les fonctionnalités que
les deux logiciels ont, et seulement la manière de les faire. Ce qu'il a en plus
ou en moins ne compte pas ici.

Même moteur des deux côtés : Tauri v2, React, TypeScript, Rust. 12 000 lignes
chez lui, 38 000 chez nous, et les deux écoutent les mêmes notifications du jeu
pour ramener la même fenêtre devant.

## Ce qui sort de cette lecture

Un seul vrai sujet, et il est chez nous : **notre écoute des notifications ne se
relance jamais**. Le reste est soit à notre avantage, soit sans effet mesurable.

---

## 1. L'écoute des notifications, macOS

Les deux font la même chose : un `AXObserver` sur le processus
`com.apple.notificationcenterui`, une source ajoutée à un `CFRunLoop`, et on lit
le texte de la bannière quand elle apparaît.

|                                                 | Multifus                                    | Focus Retro                                             |
| ----------------------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| Notification observée                           | `AXCreated`                                 | `AXWindowCreated`                                       |
| Lecture du texte                                | rôle `AXStaticText`, profondeur 8, 4 textes | `AXTitle` + `AXValue` + `AXDescription`, sans borne     |
| Bannière rangée après coup                      | non                                         | `AXPress` sur le sous-rôle `AXNotificationCenterBanner` |
| Reprise si le centre de notifications redémarre | **non**                                     | oui, chien de garde sur le pid                          |

### Le défaut, chez nous

`BannerNotificationWatcher::start` lit le pid du centre de notifications une
fois, crée l'observateur, et la boucle tourne tant que `running` est vrai.

Quand le centre de notifications redémarre, son pid change. L'ancien observateur
reste attaché à un processus mort : il ne rend aucune erreur, il ne rend plus
rien du tout. Notre boucle continue de tourner, `self.listening` reste `Some`,
`is_listening()` reste vrai, et `follow_authorization` ne relance donc rien. Le
journal ne dit pas un mot.

L'AutoFocus s'arrête, définitivement, jusqu'à ce qu'on quitte et relance
Multifus. Personne ne peut le deviner depuis l'écran.

Le centre de notifications redémarre après une mise à jour du système, quand il
tombe, et quand un joueur le tue lui-même pour débloquer des bannières coincées.
À quelle fréquence, on ne sait pas, et cette lecture ne permet pas de le dire.
Ce qui est certain, c'est que le jour où ça arrive, rien ne le rattrape et rien
ne le dit.

Focus Retro le dit noir sur blanc dans son propre code : « The old AXObserver
silently stops receiving events. » Il lance un fil qui compare le pid toutes les
deux secondes et appelle `CFRunLoopStop` dès qu'il bouge.

### Ce qu'on fait, et pourquoi pas comme lui

Sonder le pid toutes les deux secondes marche, mais on a mieux sous la main.
`watch_clicks` observe déjà `NSWorkspaceDidActivateApplicationNotification` sur
le centre de notifications de `NSWorkspace`. La même mécanique donne
`NSWorkspaceDidTerminateApplicationNotification`, filtré sur
`com.apple.notificationcenterui` : zéro sondage, et on est prévenu à l'instant
où le processus meurt plutôt que jusqu'à deux secondes plus tard.

### Les deux points qu'on laisse

`AXCreated` contre `AXWindowCreated` : le nôtre est plus large et fait donc
tourner `read_banner` plus souvent pour rien. La marche est bornée (profondeur 8,
4 textes) et une lecture qui ne trouve pas de pseudo ne produit rien. Aucune
ligne en double dans le journal jusqu'ici, donc en pratique `AXCreated` ne part
qu'une fois par bannière. Resserrer, c'est prendre un risque de régression pour
un gain qu'on ne mesure pas. On garde.

Le `AXPress` sur la bannière : chez lui, la bannière macOS disparaît dès qu'il a
basculé, chez nous elle reste ses cinq secondes par-dessus le jeu. C'est une
gêne réelle et c'est le seul point où sa manière de faire est plus agréable.
Mais presser une bannière, c'est l'activer, donc demander au système de mettre
en avant l'application qui l'a postée, en même temps que notre propre bascule.
Deux ordres pour le même effet, et rien ne garantit lequel gagne. À essayer un
jour, pas maintenant, et jamais quand on a décidé de ne pas basculer.

---

## 2. L'écoute des notifications, Windows

Les deux passent par `UserNotificationListener` de WinRT, sur un fil en
apartment `COINIT_APARTMENTTHREADED`, et sondent `GetNotificationsAsync` en
comparant les identifiants au tour précédent.

Il a découvert et documenté que l'abonnement `NotificationChanged` ne sert à
rien pour une application non empaquetée : le gestionnaire tourne en MTA et
`GetNotification` y échoue avec `RPC_E_WRONG_THREAD`. Son gestionnaire ne fait
donc que journaliser, et tout repose sur le sondage. On n'a jamais tenté cet
abonnement, et cette lecture confirme qu'il n'y a rien à y gagner.

|                                           | Multifus                                             | Focus Retro                                          |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Cadence                                   | 100 ms au moins, sinon 10 fois le coût de la lecture | 100 ms fixe, 200 ms si l'abonnement a pris           |
| Priorité du fil                           | normale                                              | `THREAD_PRIORITY_ABOVE_NORMAL`                       |
| Le focus tourne sur                       | le fil de sondage                                    | un fil séparé, alimenté par un canal                 |
| Notifications rangées                     | celles du pseudo qu'on vient de traiter              | toutes celles de Dofus, traitées ou non              |
| Reprise si `GetNotificationsAsync` échoue | **non**                                              | oui, le fil sort et la boucle extérieure recrée tout |

### Le même défaut, chez nous

```rust
let read_cost = poll(&listener, sink, toasts).unwrap_or_default();
```

`unwrap_or_default()` avale l'erreur. Si l'objet WinRT se casse, on tourne en
rond sur un proxy mort, sans une ligne de journal et sans jamais rien recréer.
Exactement la même panne silencieuse que sur macOS, par un autre chemin.

Ici le déclencheur est constaté, pas déduit : son code porte la note « notification
service restarted the DB after sleep/wake », donc il a vu le service de
notifications de Windows repartir après une veille, et il s'en protège.

Focus Retro traite cet échec comme fatal : le fil sort, `start()` rend une
erreur, et sa boucle extérieure recrée le lecteur deux secondes plus tard.

### Ce qu'on fait

Notre superviseur existe déjà et il est meilleur que le sien : `follow_authorization`
tourne à chaque tour de scan, toutes les secondes, et relance l'écoute dès que
`is_listening()` est faux. Le problème n'est pas le superviseur, c'est que
**personne ne lui dit jamais que l'écoute est morte**.

Et la forme à prendre est déjà dans notre code, du côté des clics :
`ClickReport::ListeningLost` et `ClickReport::ListeningResumed` passent par le
`ClickSink`. Le `NotificationSink` n'a pas son équivalent, il n'a que `Heard` et
`Unreadable`. Ajouter `ListeningLost` au `NotificationReport`, l'émettre sur
l'échec du sondage et sur la mort du centre de notifications, et le poser sur
`set_listening(false)` avec une ligne de journal : le superviseur fait le reste
au tour suivant.

### Les trois points qu'on laisse

**La priorité du fil.** Un appel, sans risque, et l'argument est bon : huit
clients Dofus qui tournent, c'est une machine chargée, et un fil endormi en
priorité normale se réveille en retard. Mais le réveil d'un `thread::sleep` sur
Windows dépend surtout de la résolution du minuteur, que les jeux relèvent déjà.
Rien à mesurer sans instrument. On note, on ne fait rien.

**Le fil séparé pour le focus.** Chez nous le sondage appelle `sink` lui-même,
donc la bascule retarde la lecture suivante d'autant. En combat les tours
arrivent un par un à quelques secondes d'écart : ça ne se cumule jamais. Son
architecture est plus propre, elle ne gagne rien ici.

**Le rangement large.** Il retire toutes les notifications de Dofus, y compris
celles qu'il n'a pas traitées, et sa raison est honnête : « keeping it visible in
the Action Center only causes stacking lag ». Nous ne rangeons que ce sur quoi
on a agi, donc les notifications d'un personnage exclu, ou d'un événement dont
l'AutoFocus est décoché, restent dans le centre de notifications jusqu'à ce que
le joueur les balaie. Windows en garde vingt par application, donc rien ne
gonfle sans fin et notre coût par sondage reste borné.

Ce n'est pas un défaut, c'est un choix : ranger une notification qu'on a
volontairement laissée passer, c'est décider à la place du joueur qu'il ne veut
pas la lire. **À trancher, pas à corriger.**

### La cadence, à mesurer

`MINIMUM_REST.max(read_cost * REST_PER_READ)` : si la lecture coûte 10 ms on
attend 100 ms comme lui, si elle coûte 50 ms on attend 500 ms. Le repos
proportionnel protège la machine, et c'est bien vu, mais il paie en latence sur
la seule fonctionnalité qui se voit. Relever ce que coûte vraiment
`GetNotificationsAsync` sur la machine Windows, et poser un plafond si le repos
dépasse jamais 150 ms.

---

## 3. Remettre la fenêtre devant

C'est le geste final de l'AutoFocus, et l'écart est net.

**macOS.** Il appelle `osascript` en sous-processus, pour dire à System Events
de passer une application au premier plan. Un lancement de processus, un aller
et retour Apple Events, entre 50 et 150 ms, et une permission de plus à
demander. Il ajoute par-dessus un `sleep` de 50 ms avant de basculer, contre un
retour de focus qu'il a constaté sans l'expliquer. Nous appelons
`NSRunningApplication::activateWithOptions`, directement, sans sous-processus ni
attente, avec `AXFrontmost` en secours.

**Windows.** Il appelle `SetForegroundWindow`. Nous faisons `BringWindowToTop`
puis `SetForegroundWindow`, et si le système refuse on rattache les files
d'entrée avec `AttachThreadInput` avant de réessayer, ce qui est la parade
connue au verrou de premier plan de Windows. Il n'a pas ce rattrapage.

Rien à prendre.

---

## 4. Le recensement des fenêtres

|                   | Multifus                                                             | Focus Retro                                        |
| ----------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| macOS             | `NSRunningApplication` sur `com.dofus.d1elauncher`, puis `AXWindows` | `CGWindowListCopyWindowInfo`, filtré sur le titre  |
| Windows           | `EnumWindows` + `QueryFullProcessImageNameW`, avec cache par pid     | `EnumWindows`                                      |
| Cadence           | 1 s                                                                  | 3 s                                                |
| Permissions macOS | Accessibilité                                                        | Accessibilité **+ Capture d'écran + Apple Events** |

### Ce qui a l'air mieux chez lui, et qui coûte trop cher

Un seul appel `CGWindowListCopyWindowInfo` rend toutes les fenêtres avec leur
titre et leur pid, sans jamais parler aux applications visées. Le nôtre
interroge chaque client par l'API d'accessibilité, ce qui est un aller et retour
vers le fil principal du client : plus lent, et bloquant si un client est figé.

Sauf que depuis macOS 10.15, `kCGWindowName` ne rend le titre que si
l'application a la permission **Capture d'écran**. Son `Info.plist` le confirme,
avec `NSScreenRecordingUsageDescription` et `NSAppleEventsUsageDescription` à
côté de `NSAccessibilityUsageDescription`, et son `permissions.rs` appelle bien
`CGRequestScreenCaptureAccess`.

Son README annonce l'Accessibilité seule. Le code en demande trois, dont la plus
effrayante que macOS sache poser : « Focus Retro peut enregistrer le contenu de
votre écran ». Notre méthode coûte une permission, la sienne trois. **Écarté
définitivement, et c'est un point à garder pour le site.**

### Notre point à mesurer

Aucun de nos appels d'accessibilité n'a de délai posé. `AXUIElementSetMessagingTimeout`
n'apparaît nulle part dans `platform/macos.rs`. Un client Dofus figé peut donc
retenir le fil de scan, et avec lui le roster à l'écran, la Roue qui suit le
premier plan et les titres courts. L'AutoFocus, lui, tourne sur son propre fil
et continue.

Un seul appel borne tous les autres. À poser après avoir vérifié, sur la machine
de test, qu'un client figé bloque bien le scan.

Notre seconde contre ses trois secondes : notre roster suit mieux, on paie trois
fois plus d'appels d'accessibilité. À revoir seulement si la mesure ci-dessus
montre que ça coûte.

---

## 5. Le Défilement

Il garde un `current_index` dans son état, et doit le remettre d'accord avec la
réalité à deux endroits : au scan toutes les trois secondes
(`sync_focus_from_foreground`), et de nouveau à chaque frappe de raccourci
(`get_foreground_info` puis `sync_current_from_window_id`). Il doit aussi sauter
la resynchronisation pendant que la roue est ouverte, sinon elle bouge sous les
doigts.

Nous ne gardons pas de curseur. `decide_shortcut(action, current)` reçoit le
pseudo de la fenêtre qui est devant à l'instant de la frappe, et
`next_in_cycle(current)` en déduit la suivante. Rien à resynchroniser, rien qui
dérive, et le sondage à trois secondes qu'il fait pour ça, on n'en a pas besoin.

Rien à prendre.

---

## 6. Les raccourcis

|                                                | Multifus                                                                  | Focus Retro                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| Mécanique                                      | `tauri-plugin-global-shortcut`, donc le registre de raccourcis du système | `CGEventTap` sur macOS, `WH_KEYBOARD_LL` sur Windows |
| Permission macOS en plus                       | aucune                                                                    | **Surveillance des entrées**                         |
| Ne part qu'au-dessus du jeu                    | toujours, et le refus est journalisé                                      | en option, et sa propre fenêtre compte aussi         |
| Rend la touche à l'application quand il refuse | il ne la prend qu'au-dessus du jeu, donc il n'a rien à rendre             | oui, il la prend partout et la rend                  |

Notre garde est plus stricte que la sienne : `answer` interroge
`foreground_game_window()` avant tout et journalise `OutsideGame` quand la
frappe n'est pas au-dessus d'un client. Chez lui c'est un réglage.

Cette lecture concluait ici qu'un raccourci enregistré auprès du système mange
la touche avant qu'on soit appelé, qu'il fallait un crochet bas niveau pour la
rendre, et donc qu'on ne la rendrait pas. Elle avait manqué la troisième route,
et un `Shift+Digit1` posé sur une réponse rapide a fini par manger le chiffre 1
dans le navigateur. Multifus ne prend maintenant la combinaison au système que
pendant que le jeu est devant, et la rend en sortant : aucune permission de
plus, et la touche n'est plus jamais perdue ailleurs.

Son crochet clavier garde un avantage que nous n'aurons pas : il décide au
moment de la frappe, donc il n'a pas de course entre l'activation d'une fenêtre
et l'armement.

---

## 7. La Roue

Les deux ouvrent un disque sous le curseur, suivent la souris, et basculent au
relâchement.

Il pose sa fenêtre en `NSPanel` avec la caisse `tauri-nspanel`. Nous changeons
la classe de la fenêtre Tauri en `NSPanel` avec `object_setClass`, puis nous
posons `NonactivatingPanel`, `setHidesOnDeactivate: false` et
`setBecomesKeyOnlyIfNeeded: true`. Même résultat, une dépendance de moins, et
`hold_back_activation` vérifie avant de faire le changement que `NSPanel` ne
demande pas plus de place que `NSWindow`.

Son survol passe par son `CGEventTap`, qui a déjà les mouvements de souris, puis
par un `eval` de JavaScript sur le fil principal à chaque changement de
segment. C'est cohérent avec son choix de crochet clavier, et ça ne nous
concerne pas puisqu'on n'a pas ce crochet.

Rien à prendre.

---

## 8. La barre des tâches, Windows

Les deux posent un `PKEY_AppUserModel_ID` par fenêtre pour dégrouper les
boutons, et un portrait de classe par `WM_SETICON`.

|                             | Multifus                                                         | Focus Retro                                              |
| --------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Identifiant de groupe       | `multifus.window.<hwnd>`                                         | `focusretro.dofus.<pseudo>`                              |
| Portrait                    | 24 fichiers `.ico` embarqués, `CreateIconFromResourceEx`         | composé au vol en Canvas côté React, RGBA renvoyé à Rust |
| Taille de l'icône           | `SM_CXSMICON` et `SM_CXICON`, donc la taille que l'écran demande | **24 × 24 en dur, dans les deux emplacements**           |
| Envoi                       | `SendMessageTimeoutW`, `SMTO_ABORTIFHUNG`, 100 ms                | `SendMessageW`, sans délai                               |
| Vérification avant d'écrire | `IsWindow` **et** l'exécutable est bien celui de Dofus           | `IsWindow`                                               |

Trois points à notre avantage, et le premier se voit à l'œil : sur un écran à
150 %, Windows veut 24 pixels en petit et 48 en grand. Il donne 24 aux deux, donc
son portrait est étiré et flou dans l'alt-tab. Nous demandons au système la
taille de chaque emplacement.

Son `SendMessageW` sans délai bloque son appelant tant qu'un client figé ne
répond pas. Le nôtre abandonne au bout de 100 ms.

### Le seul point à retenir de sa méthode

Composer l'icône au vol, plutôt que d'embarquer des fichiers finis, c'est ce qui
lui permet de porter **une couleur choisie par personnage jusque dans le bouton
de la barre des tâches**. C'est déjà une ligne de `docs/plan.md`, et voilà
comment il s'y prend : disque de couleur, portrait de classe par-dessus,
pastille, le tout en Canvas dans le webview, puis les octets RGBA passent le
pont et `rgba_to_hicon` en fait un `HICON`.

Nos `.ico` embarqués ne peuvent pas porter une couleur choisie par le joueur. Le
jour où on fera cette ligne, il faudra composer au moment de poser. Faire ce
travail en Rust plutôt que dans le webview évite l'aller et retour par le pont
et garde la logique du côté qui écrit l'icône.

---

## 9. Le reste du dépôt, hors code métier

Lecture de sa chaîne de compilation, de son empaquetage et de son interface, pour
savoir s'il reste quelque chose à prendre ailleurs que dans les fonctionnalités.

### L'attestation de provenance, à prendre

C'est le sujet resté en suspens dans `concurrents.md`. Son `release.yml` appelle
`actions/attest-build-provenance` sur chaque `.dmg` et chaque `.exe`, avec les
droits `id-token: write` et `attestations: write`.

Ce que ça produit : une déclaration signée, publique et vérifiable, qui dit que
ce fichier exact a été construit par ce workflow, depuis ce commit, dans ce
dépôt. N'importe qui la vérifie d'une commande, sans nous faire confiance :

```
gh attestation verify Multifus.dmg --repo viclafouch/multifus
```

**Pourquoi il en a besoin, et nous moins.** Son `tauri.conf.json` porte
`"signingIdentity": "-"`, donc une signature ad hoc : son application n'est ni
signée par un Developer ID ni notarisée, et ses joueurs doivent faire un clic
droit puis Ouvrir quand même. Il a d'ailleurs la capture `mac-openanyway.webp`
dans son site. L'attestation lui sert de remplacement au vrai certificat.

Nous prenons le chemin propre, Developer ID et notarisation, donc notre DMG
s'ouvrira sans un mot. La notarisation prouve qu'Apple a examiné le paquet et
qu'il vient d'un développeur identifié. L'attestation prouve autre chose : que le
binaire vient bien de ce code source public, et pas d'un portable. Pour un outil
qui touche aux fenêtres du jeu, dans une communauté qui se méfie à raison des
bots, cette preuve-là a de la valeur, et elle coûte huit lignes de YAML.

**Et surtout, elle éclaire une décision ouverte du plan.** Sur Windows on n'a pas
tranché le certificat Authenticode, qui se paie chaque année. L'attestation ne le
remplace pas, SmartScreen continuera d'avertir, mais elle donne gratuitement une
preuve d'origine à mettre sur le site en attendant.

### Les actions épinglées, à prendre

Chacune de ses actions est épinglée sur un SHA complet, avec la version en
commentaire :

```
uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6
```

Nous écrivons `actions/checkout@v7`, `pnpm/action-setup@v4`,
`tauri-apps/tauri-action@v1`, et `dtolnay/rust-toolchain@stable`, qui n'est même
pas une étiquette mais une branche, donc elle bouge à chaque poussée.

Une étiquette se déplace. Celui qui prend la main sur un de ces dépôts exécute
son code dans notre workflow de publication, **celui qui tient le certificat
Apple, le mot de passe de notarisation et la clé privée de l'updater**. Il en
sortirait avec de quoi signer un faux Multifus que nos machines installeraient
toutes seules.

Épingler est gratuit, et Dependabot sait relever les SHA. C'est le point le plus
utile de tout son dépôt.

### Les Mac Intel, un avis de plus

Il compile `aarch64-apple-darwin` et `x86_64-apple-darwin`. C'est une ligne
ouverte de notre plan, et un concurrent qui vise les mêmes joueurs a jugé que ça
valait la deuxième cible. Dofus Retro tourne sur beaucoup de vieux Mac.

### La latence, l'instrument qui nous manque

Son panneau de débogage affiche, pour chaque bascule, le temps entre la
notification et la fenêtre arrivée devant, en vert sous 50 ms, en orange sous
150 ms, en rouge au-delà. À côté, l'état de l'écoute, son mode et son nombre de
redémarrages.

Il l'a écrit parce qu'il a rencontré la panne que nous venons de corriger : ses
types de traces s'appellent `notification_center_restart` et
`listener_reconnect`.

Notre journal en dit maintenant quelque chose. `Outcome::Focused` porte un
`focus_micros`, compté par un `Instant` posé à l'arrivée de la notification et lu
quand le système accepte le focus. La ligne se lit « Message privé pour Alpha :
fenêtre ramenée au premier plan en 12 ms », l'interface faisant les
millisecondes avec `Intl` : une décimale sous dix millisecondes, l'entier
au-delà. Pas de panneau de débogage ni de seuil de couleur, le journal suffit à
répondre quand un joueur trouve ça lent.

**Ce que ce nombre ne dit pas, et pourquoi.** Ce n'est pas une bascule au sens de
[CONTEXT.md](../CONTEXT.md), qui la veut finie quand le système la donne pour
finie ; c'est un focus, celui de l'entrée Focus, arrêté quand l'appel rend la
main. Sur le Mac, `activateWithOptions` rendant `true` dit que la demande est
prise, pas que la fenêtre est dessinée ; `SetForegroundWindow` de même.

La vraie fin existe pourtant dans le dépôt : `ClickGate::expect` puis
`await_arrival(SWITCH_CEILING)`, nourris par `NSWorkspaceDidActivateApplication`
et `EVENT_SYSTEM_FOREGROUND`, et le Déplacement rapide s'en sert déjà. Elle n'est
pas branchée ici, et ce n'est pas un oubli : `watch_foreground` vit dans le fil
du tap de clics, qui ne tourne que pendant le Déplacement rapide ou la roue.
Pendant un AutoFocus ordinaire personne n'appelle `note_foreground`, donc
`await_arrival` expirerait à 250 ms à chaque notification, et bloquerait le fil
de l'écoute d'autant.

Mesurer la vraie fin demande donc de tenir le guetteur de premier plan en
permanence. C'est une décision à part, à prendre avec le point 2 de
[plan-audit-concurrents.md](./plan-audit-concurrents.md), qui veut ce même
guetteur pour une autre raison. En attendant, le nombre du journal est celui
qu'on sait prendre sans rien coûter, et il est nommé pour ce qu'il est.

### La fenêtre blanche, comblée

Il a un `ErrorBoundary` autour de son interface, et nous aussi désormais :
`components/error-boundary.tsx` autour de l'`App`. Un rendu qui lève donne un
écran qui dit que Multifus tourne toujours, montre le message de l'erreur à
recopier, et offre de recharger l'écran ou d'ouvrir le journal. Les trois
fenêtres posées par-dessus le jeu, la roue, la bannière et le tableau des runes,
n'en ont pas : leur racine est à part, et un panneau d'erreur au milieu d'un
combat serait pire que le carré blanc.

### Ce qui est pareil, ou meilleur chez nous

Mêmes outils : oxlint et oxfmt des deux côtés, lefthook chez lui contre husky
chez nous. `removeUnusedCommands` et `macOSPrivateApi`, on les a déjà.

Notre politique de sécurité de contenu est plus fournie que la sienne, et on a en
plus une politique séparée pour le serveur de développement. Il avait quatre
directives qu'on n'avait pas, dont deux qui ne retombent pas sur `default-src` :
`base-uri 'self'` et `form-action 'self'` sont maintenant écrites dans les deux
politiques.

Son site vit dans `docs/` sur GitHub Pages, avec Tailwind, un `sitemap.xml`, un
`robots.txt`, une image de partage et un script Lighthouse. Ses captures sont en
`.webp` et ses démonstrations en `.webm`, pas en GIF. C'est pour la veille de
`plan-site.md`, et ça se regarde en ligne sans garder le dépôt.

---

## Ce qu'on garde à faire

- [x] Dire au superviseur quand l'écoute est morte, et le laisser la relancer.
      `NotificationReport::ListeningLost` ajouté à côté de `Heard` et
      `Unreadable`, sur le modèle de `ClickReport`. Sur macOS il part d'un
      observateur `NSWorkspaceDidTerminateApplicationNotification` qui lève un
      drapeau que la boucle relit, sans sonder le pid. Sur Windows il part de
      l'échec de `poll`, qui termine le fil au lieu d'avaler l'erreur. Les deux
      passent par `on_listening_lost`, qui écrit la ligne et pose
      `set_listening(false)` : `follow_authorization` recrée l'écoute dans la
      seconde. **Les deux chemins de plateforme ne sont pas couverts par les
      tests, ils demandent les vraies machines**
- [x] Épingler chaque action des workflows sur un SHA complet. Fait dans
      `checks.yml` et `release.yml`, `ci.yml` n'appelle que `checks.yml`. Les
      relever avec `gh api repos/<dépôt>/git/ref/tags/<étiquette>`
- [x] Attester la provenance des paquets publiés. `actions/attest-build-provenance`
      après chaque `tauri-action`, plus `id-token: write` et `attestations: write`
      sur les deux tâches. **À vérifier à la première publication** : les chemins
      des paquets, et que la commande de vérification répond
- [ ] Mettre la commande de vérification sur le site, le README la porte déjà :
      `gh attestation verify <fichier> --repo viclafouch/multifus`
- [ ] Vérifier sur le Mac qu'un client Dofus figé ne retient plus le fil de scan.
      `set_messaging_timeout` est posé à une demi-seconde dans `platform/macos.rs`,
      l'essai reste à faire
- [ ] Trancher si le guetteur de premier plan tient en permanence, ce qui
      donnerait la vraie fin d'une bascule au journal, et l'exclusion contre le
      jeu qui passe devant tout seul. Voir plus haut, et le point 2 de
      [plan-audit-concurrents.md](./plan-audit-concurrents.md)
- [ ] Relever ce que coûte `GetNotificationsAsync` sur la machine Windows, et
      plafonner le repos si `read_cost * REST_PER_READ` dépasse jamais 150 ms
- [ ] Trancher : range-t-on les notifications de Dofus qu'on a lues mais sur
      lesquelles on n'a pas agi

## Ce qu'on a regardé et écarté

`CGWindowListCopyWindowInfo` pour recenser les fenêtres, qui coûte la permission
Capture d'écran. `osascript` pour mettre au premier plan, plus lent et qui coûte
Apple Events. Le crochet clavier bas niveau, qui coûte Surveillance des entrées
et lit toutes les frappes. Le repli sur `wpndatabase.db` quand la permission
Windows est refusée, qui lit la base d'une autre application. La priorité de fil
relevée et le fil de bascule séparé, tous deux sans effet mesurable ici. Le
`AXPress` sur la bannière, à réessayer un jour. Le remplacement de `AXCreated`
par `AXWindowCreated`, un risque sans gain. La variante hors ligne du logiciel,
qui lui coûte une deuxième compilation complète par plateforme à chaque
publication. Le réordonnancement des boutons de la barre des tâches par
`ITaskbarList`, qui est une fonctionnalité et sort du cadre de cet audit.

## Le dépôt cloné

Tout ce qui valait la lecture est dans ce fichier. `~/Desktop/focusretro` peut
partir, et `gh repo clone alacroix/focusretro` le ramène en cinq secondes le jour
où on veut revérifier une ligne.
