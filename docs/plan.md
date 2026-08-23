# Plan de développement, Windows

**Ce document ne parle que d'une chose : faire tourner multifus sur Windows.**
Tout le reste est fini et ne se retouche pas. Une session qui travaille ici
n'ouvre pas un autre chantier, ne refactorise pas ce qui marche, et ne
réorganise rien de `src`.

Le vocabulaire est dans [CONTEXT.md](../CONTEXT.md), ce que le projet refuse de
faire dans [perimetre.md](./perimetre.md), les décisions structurantes dans
[adr](./adr), les règles d'écriture du code dans [.claude/rules](../.claude/rules).
Ce qui a été fait sur macOS et ce qui y mord est archivé dans
[macos.md](./macos.md) : à relire quand un comportement surprend, jamais à
reprendre.

---

## Ce qui est fini, et qu'on ne touche pas

macOS, de bout en bout, vérifié sur deux vrais clients et sur une soirée de
relais. Le cœur métier, la frontière avec le système, la persistance, l'interface
React et ses 179 cas de test, les quatre raccourcis globaux, la barre système, le
démarrage avec la session, le relais Telegram et l'écran qui le pilote. Le détail
est dans [macos.md](./macos.md).

Trois choses attendent encore hors du code, et **aucune n'est du ressort d'une
session Windows** :

| À faire                                                                  | Où                  |
| ------------------------------------------------------------------------ | ------------------- |
| Créer un certificat **Developer ID Application** et l'exporter en `.p12` | developer.apple.com |
| Poser les huit secrets du workflow `release`                             | Réglages du dépôt   |
| Remplacer le logo du scaffolder Tauri                                    | `src-tauri/icons`   |

Les huit secrets : `APPLE_CERTIFICATE` (le `.p12` en base64),
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD` (un mot de passe d'application, pas celui du compte),
`APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY` et
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, vide ici.

**La paire de clés de l'updater existe déjà, ne la régénère pas.** Elle est dans
`~/.tauri/multifus.key` et son `.pub`, sans mot de passe, et la moitié publique
est déjà le champ `plugins.updater.pubkey` de `tauri.conf.json`. Une nouvelle
paire rendrait insignables les mises à jour des versions déjà installées.

**Le logo** : `npm run tauri icon <fichier>` régénère les onze fichiers depuis un
PNG carré à transparence. Il ne touche pas à `icons/tray.png`, qui obéit à
d'autres règles, voir « Ce qui mord ».

---

## Ce qui attend de ce côté

`platform::windows` compile aujourd'hui en renvoyant `NotImplemented` méthode par
méthode, et c'est tout ce qui manque à multifus sur ce système. Les trois
interfaces de `platform` ont été dessinées avec Windows en vue, `TITLE_PATTERN` et
la table `NOTIF_TYPES` viennent de Dracoon et sont vérifiés sur les deux
systèmes, et `GameWindow::from_title` reste la seule porte d'entrée d'une fenêtre.
Rien de tout ça n'est à réécrire.

**Objectif.** La parité, sur la machine où l'application sert vraiment.

### La machine est prête, et il n'y a plus rien à installer

Fait le 23 août 2026, sur le PC Windows 10 où les lots se joueront. Une session
qui ouvre ce dépôt compile à la première commande, sans rien préparer.

| Outil                     | Version                         |
| ------------------------- | ------------------------------- |
| Node                      | 24.19.0, ce que dit `.nvmrc`    |
| Rust                      | 1.98.0                          |
| Visual Studio Build Tools | 2026, charge « Desktop en C++ » |
| WebView2                  | 151.0.4129.101, déjà présent    |

`rustup default stable-msvc` n'a pas eu lieu d'être et cette ligne est retirée :
`x86_64-pc-windows-msvc` est le toolchain par défaut ici, l'installeur l'ayant
choisi seul.

**Le done-gate passe de ce côté, en entier.** Les sept commandes de `checks.yml`
jouées à la main : `lint`, `format:check` sur 116 fichiers, 179 tests
JavaScript, `build`, `cargo fmt --check`, `cargo clippy --all-targets -- -D
warnings`, 124 tests Rust. Aucun avertissement nulle part. Ce que ça prouve tient
en une phrase : tout ce qui n'est pas `platform::windows` fonctionne déjà ici.

**Le paquet aussi.** `npm run tauri build` sort le MSI et l'installateur NSIS,
Tauri allant chercher WiX 3.14 et NSIS 3.11 de lui-même au premier passage. Il
finit malgré tout en erreur, et c'est attendu, voir « Ce qui mord ».

## L'étape, en quatre lots

**Rien de cette étape ne se relit depuis le Mac.** `cargo check --target x86_64-pc-windows-msvc` échoue avant de compiler une ligne du projet, voir « Ce qui mord ». Les lots sont donc découpés pour finir chacun sur un `cargo test` vert et un résultat visible à l'écran, et non pour être préparés ici.

**`platform::windows` n'aura aucun test unitaire, comme `platform::macos`.** Tout y parle au système. Ce qui se teste est dans `domain`, et c'est déjà fait.

### Ce qui a été mesuré, et ce que ça tranche

Fait le 23 août 2026, avec un binaire jetable, sur ce PC et un vrai client. Les
trois questions sont fermées et une quatrième réponse est venue avec, celle qui
choisit la route du lot B. La moitié notification n'est plus un pari.

**1. Le listener sert un exécutable non empaqueté, et ne demande rien.**
`UserNotificationListener::Current()` rend un listener depuis un `.exe` Rust nu,
sans identité de paquet, et `GetAccessStatus` rend `Allowed` **avant même**
`RequestAccessAsync` : aucune boîte ne sort. Le « paquet fin » est écarté, il n'y
a plus de sortie de secours à prévoir. `request_authorization` reste sur
l'interface pour macOS, et se contente ici de rendre ce que le système dit déjà.

**2. `NotificationChanged` n'existe pas de ce côté, et le sondage n'est plus un
repli mais la route.** L'abonnement lui-même échoue, `HRESULT 0x80070490`
« Élément introuvable », et pas l'événement qui resterait muet : il n'y a rien à
attendre ni à déboguer. C'est le prix de l'exécutable non empaqueté, et la mesure
1 dit que c'est le seul. `start` part donc directement sur
`GetNotificationsAsync(NotificationKinds::Toast)`, sans écrire les deux routes.

**3. Un toast de Dofus est exactement ce que `GameNotification::new` attend.**
Mesuré sur un vrai message privé :

| Ce que rend le listener | Valeur                                |
| ----------------------- | ------------------------------------- |
| `AppUserModelId`        | `com.dofus.d1elauncher`               |
| `texte[0]`              | `Dj-blop-[ART] - Dofus Retro v1.49.0` |
| `texte[1]`              | `de Trusted-sheriff-[ART] : test`     |

`TITLE_PATTERN` mord sur `texte[0]` et rend le pseudo, le `^de ` de
`NOTIF_TYPES` mord sur `texte[1]` et rend `PrivateMessage`. Le corps arrive
entier, ce qui ferme la ligne « corps complet » de [perimetre.md](./perimetre.md)
sur les deux systèmes. L'`AppUserModelId` est le bundle de macOS au caractère
près : le filtre reste inutile pour la raison écrite au lot B, il est seulement
devenu gratuit si le besoin apparaissait.

Deux toasts d'identifiants distincts sont sortis pour un même texte, ce qui rend
la dédup par `UserNotification::Id` obligatoire et non prudente.

**4. L'exécutable du client est `Dofus Retro.exe`**, sous
`%LOCALAPPDATA%\Ankama\Retro\`. C'est le nom de fichier qui sert de filtre et
jamais le chemin, que l'installation déplace. Un client rend une fenêtre et une
seule, comme un processus rend un client sur macOS. Le titre est en `v1.49.0` et
`TITLE_PATTERN`, écrit contre `v1.48.21`, mord sans retouche.

### Lot A — Les fenêtres

`Win32WindowManager`, six méthodes, et de quoi faire vivre le roster, les quatre raccourcis et le menu de la barre système sans une seule notification.

`authorization` et `request_authorization` rendent `Granted` sans rien demander : lire un titre et changer le focus ne demande aucune autorisation ici. Les deux méthodes restent sur l'interface parce que macOS en a besoin.

`game_windows` passe par `EnumWindows`, et pour chaque fenêtre : `IsWindowVisible`, puis `GetWindowThreadProcessId` pour le pid, puis `OpenProcess` en `PROCESS_QUERY_LIMITED_INFORMATION` et `QueryFullProcessImageNameW` pour le nom de l'exécutable, puis `GetWindowTextW` dimensionné par `GetWindowTextLengthW`. `foreground_game_window` fait le même filtre sur la seule fenêtre que rend `GetForegroundWindow`, sans balayage. `is_minimized` est `IsIconic`, une ligne.

Ce chemin est déjà écrit et mesuré, mesure 4 : il rend `Dofus Retro.exe` et une fenêtre unique par client. **Comparer le nom de fichier et jamais le chemin**, que l'installation déplace, et sans tenir compte de la casse.

**Filtrer sur le processus et pas sur le seul titre, et c'est un bug déjà vu.** `EnumWindows` balaie tout le bureau, et un onglet de navigateur intitulé `Quelque chose - Dofus Retro` satisfait la regex : le navigateur entre alors dans le roster comme un personnage et se fait ramener au premier plan. C'est arrivé. macOS n'a jamais eu ce trou parce que `dofus_applications` n'énumère que les processus du bundle `com.dofus.d1elauncher`, et Windows doit faire pareil. Le titre reste ce qui donne le pseudo, il cesse d'être ce qui donne le droit d'entrer.

**La danse `AttachThreadInput`, écrite une fois pour toutes.** `SetForegroundWindow` refuse quand le processus appelant n'a pas déjà le focus, et rend `FALSE` sans dire pourquoi. Le contournement documenté est d'attacher la file d'entrée de multifus à celle du processus qui a le focus, le temps de l'appel :

```rust
let foreground_thread = GetWindowThreadProcessId(GetForegroundWindow(), None);
let current_thread = GetCurrentThreadId();
AttachThreadInput(current_thread, foreground_thread, true);
// ShowWindow(SW_RESTORE) si IsIconic, puis SetForegroundWindow
AttachThreadInput(current_thread, foreground_thread, false);
```

Le détachement part quelle que soit l'issue, sinon multifus laisse derrière lui deux files d'entrée liées, ce qui se paie sur le bureau entier et pas dans multifus. Une structure avec un `Drop` le tient sans avoir à y penser, comme le keeper tient son handle.

`ShowWindow(SW_RESTORE)` entre dans l'attache et non avant : restaurer fait partie du focus, `platform::window` l'écrit, et une fenêtre sortie de la barre des tâches mais laissée derrière n'a pas été ramenée.

**Le piège de Dracoon, à ne pas reproduire.** Il contourne la même restriction en injectant une vraie frappe Alt dans l'application active. C'est la cause probable du bug de focus intermittent corrigé dans son commit `0b0525c`, et ça envoie une touche parasite dans le jeu.

**`WindowGone` se lit sur `IsWindow`**, et `is_minimized` comme `focus` doivent le rendre, `platform::window` promettant la même erreur aux deux. Windows réemploie les handles, donc `IsWindow` peut dire oui d'une fenêtre qui n'est plus celle qu'on croit. C'est le prix du `HWND` comme identité, il n'y a pas mieux, et le filtre sur l'exécutable rattrape le cas qui compte.

**Aucun saut vers le fil principal, contrairement à macOS.** Ces appels Win32 se font depuis n'importe quel fil, et `WindowManager` est `Send + Sync` justement parce que les rappels de raccourcis tournent sur des fils que multifus ne choisit pas. L'attache et le détachement partagent le fil appelant, ce qui est la seule contrainte.

**Vérifié quand** : deux vrais clients, le roster qui les voit, les quatre raccourcis depuis le jeu, un clic sur un personnage dans la barre système, et une fenêtre réduite qui ressort.

### Lot B — Les notifications

`UserNotificationWatcher`. C'était la moitié risquée, les mesures l'ont débloquée : le listener répond, la route est le sondage, et un toast de Dofus se lit sans une ligne de plus que ce que `domain` sait déjà faire.

**Le fil du listener est en STA, et c'est le piège qui a coûté cher à Dracoon.** `UserNotificationListener` échoue en silence ou rend une erreur COM quand le fil qui l'utilise n'est pas dans un apartment mono-filaire. Donc `CoInitializeEx(None, COINIT_APARTMENTTHREADED)` en tête du fil du watcher, et tout le travail du listener sur ce fil-là. C'est déjà la forme que `platform::notification` attend, chaque implémentation gardant son fil et sa boucle pour elle.

`authorization` lit `GetAccessStatus`, `request_authorization` attend `RequestAccessAsync` sur place. Les trois valeurs du système se réduisent à deux : `Allowed` devient `Granted`, `Denied` et `Unspecified` deviennent `Denied`. Ils ne se réparent pourtant pas de la même façon, `Denied` ne pouvant plus être redemandé et `Unspecified` remontant la boîte au prochain appel, donc c'est le détail du journal qui les sépare et non le type. La documentation demande le fil d'interface pour `RequestAccessAsync` ; la mesure 1 l'a appelé depuis un fil ordinaire, sans boîte et sans erreur, l'accès étant déjà accordé.

`start` sonde, et n'écrit pas la seconde route. `NotificationChanged` refuse l'abonnement de ce côté, mesure 2, donc `GetNotificationsAsync(NotificationKinds::Toast)` à l'intervalle du balayage, avec `UserNotification::Id` comme clé de dédoublonnage dans un ensemble qui suit ce que la plateforme tient encore, sans quoi il grossit toute la soirée. Le sondage reste **interne au watcher** : le cœur ne voit qu'un sink qui pousse, et ce module l'a écrit dès l'étape 3.

Lire un toast, c'est `Notification().Visual().GetBinding(KnownNotificationBindings::ToastGeneric())` puis `GetTextElements()` : le premier élément est le titre, les suivants forment le corps joints par un saut de ligne. C'est exactement le couple que `GameNotification::new` attend, et la mesure 3 l'a vu sur un vrai message privé.

**Aucun filtre sur l'application qui a émis, comme sur macOS.** `AppInfo.AppUserModelId` vaut `com.dofus.d1elauncher`, le bundle de macOS au caractère près, et ne sert pas : le raisonnement de l'étape 11b-2 de [macos.md](./macos.md) vaut tel quel ici, un pseudo absent du roster n'est relayé par rien et seul `game_windows` crée un personnage. `NotificationReport::Unreadable` n'est jamais envoyé de ce côté, le listener rendant un toast structuré qui est là ou n'y est pas.

`dismiss` est `RemoveNotification(id)`, donc le watcher garde une table pseudo vers identifiants, alimentée à chaque toast lu et purgée à chaque suppression. **Jamais `ClearNotifications`**, qui efface les notifications de toutes les applications, y compris celles que multifus n'a jamais lues. `stop` arrête le fil du sondage, et `Drop` fait la même chose.

**Ce que l'utilisateur doit régler, et ce n'est pas ce que macOS demande.** Dans le jeu, « Background Notifications » doit être activé dans les options générales : un client qui n'émet rien rend le listener muet, et c'est la panne numéro un de tous les outils qui font ça. Côté système il n'y a rien à demander, la mesure 1 ayant trouvé l'accès déjà accordé ; l'écran des autorisations garde quand même le cas refusé, que l'utilisateur peut couper à la main. En revanche, et c'est l'inverse exact de macOS, **la bannière peut rester coupée** : l'écoute passe par une API et non par ce que l'écran dessine, donc le style et le son du toast de Dofus n'ont aucune importance. La contrainte de l'ADR 0002 ne se transporte pas, elle est propre à macOS.

**Une bannière coupée n'est pas une bannière absente, et ce n'est pas mesuré.** Dracoon relève que Windows ne masque pas une bannière désactivée mais la rend à 100 % de transparence, et qu'un focus posé pendant qu'elle est encore à l'écran ne prenait pas. Seconde main, non vérifié. Ne rien écrire contre ça tant que le symptôme n'apparaît pas.

**Vérifié quand** : l'AutoFocus ramène la bonne fenêtre sur trois types distincts, et un toast disparaît du centre de notifications une fois sa fenêtre devant.

### Lot C — L'écran tenu éveillé

**`SetThreadExecutionState` est le mauvais appel, et ce plan disait le contraire.** Il pose l'état sur **le fil appelant** et pas sur le processus : l'état meurt avec le fil, c'est un masque de bits et non un compteur, et deux composants du même fil s'écrasent l'un l'autre. Le keeper vit dans un `Mutex` de l'état Tauri, appelé par `relay::run::follow_display` depuis le fil du balayage aujourd'hui et depuis ailleurs demain, et son `is_awake` deviendrait un booléen qui ment. Microsoft déconseille d'ailleurs cet appel dès que deux composants partagent un fil.

**C'est `PowerCreateRequest` et `PowerSetRequest`.** Le handle appartient au processus, n'importe quel fil le pose et le relâche, et il survit à la mort de celui qui l'a créé. C'est le jumeau exact de `IOPMAssertionCreateWithName`, nom compris : le `REASON_CONTEXT` s'affiche dans `powercfg /requests` comme l'assertion de multifus s'affiche dans `pmset -g assertions`. Les deux systèmes se vérifient alors par la même phrase du protocole du quart d'heure.

| Méthode      | Appel                                                    |
| ------------ | -------------------------------------------------------- |
| `new`        | `PowerCreateRequest` avec un `REASON_CONTEXT` nommé      |
| `keep_awake` | `PowerSetRequest(handle, PowerRequestDisplayRequired)`   |
| `release`    | `PowerClearRequest(handle, PowerRequestDisplayRequired)` |
| `is_awake`   | le booléen gardé, qui ne ment plus                       |
| `Drop`       | `CloseHandle`                                            |

`PowerRequestDisplayRequired` seul, comme `PreventUserIdleDisplaySleep` sur macOS. Le pendant système ne servirait à rien : ce qui rend le relais muet est la session verrouillée, pas la machine ralentie. Et le capot fermé lui échappe des deux côtés, ce qui est écrit dans « Ce qui mord ».

Le renommage est déjà fait, pour que la structure vide ne promette plus l'appel écarté : `PowerRequestDisplayKeeper` dans `platform::windows` et dans l'alias de `platform::mod`. Aucune machine ici ne peut le compiler, donc le lot C est le premier à le relire.

`screen_saver_delay` appelle `SystemParametersInfoW` deux fois, `SPI_GETSCREENSAVEACTIVE` d'abord, qui sépare `Never` d'un délai, puis `SPI_GETSCREENSAVETIMEOUT`, qui rend des secondes. Rien à mesurer ici, contrairement à macOS où la machine de développement rend `Never` et où l'essai ne prouve rien.

**Vérifié quand** : le protocole du quart d'heure de [macos.md](./macos.md) rejoué, `powercfg /requests` montrant la ligne de multifus avant l'avis de déconnexion et plus après.

### Lot D — La chaîne de compilation, le paquet et la barre système

`checks.yml` et `release.yml` portent chacun un job unique. Ils en gagnent un second sur `windows-latest`, et un `ci` vert dit alors quelque chose de `platform::windows`, ce qu'il ne dit pas aujourd'hui. Le runner s'ajoute en confiance : les sept commandes du gate ont déjà été jouées à la main sur ce PC et passent, voir « La machine est prête ». Sans le `.gitattributes`, `format:check` aurait échoué sur ce runner pour une raison qui n'a rien à voir avec Windows.

**L'image de barre système ne marche pas telle quelle.** `icons/tray.png` est un PNG noir pur dont la forme est portée par le seul canal alpha, posé avec `icon_as_template(true)` pour que macOS le recolore selon la barre. Windows ne recolore rien : le même fichier donne une icône noire sur une barre des tâches sombre, donc invisible. Il faut une seconde image, et `icon_as_template` ne vaut que sur macOS.

**Le démarrage avec la session change de mécanisme et pas de forme.** `tauri-plugin-autostart` écrit une clé de registre `Run` au lieu d'un `LaunchAgent`, et porte l'argument `--from-session` de la même façon. `app::autostart::reconcile` réécrit l'enregistrement à chaque lancement et couvre les deux systèmes sans rien changer. Reste à confirmer que `is_enabled()` n'est pas plus fiable ici qu'il ne l'est sur macOS ; la configuration porte l'intention de toute façon.

**Les raccourcis échouent franchement, et il n'y a rien à écrire.** Windows refuse une combinaison déjà prise, contrairement à macOS où l'enregistrement réussit et la touche reste morte. L'écran des raccourcis affiche déjà cet échec. `Control+Shift+flèche` n'est pas réservé par Windows, qui prend `Win+Control+flèche` pour ses bureaux, donc les combinaisons proposées au premier lancement conviennent aux deux systèmes.

**La signature Windows est un second sujet, que la distribution macOS ne couvre pas.** Un certificat Authenticode n'est pas un Developer ID, il s'achète ailleurs et ne pose pas les mêmes secrets. Sans lui, SmartScreen avertit à chaque installation. À trancher quand macOS sera publié pour de bon, pas avant.

### Les dépendances

`windows` 0.62 en dépendance directe, sous une cible pour qu'aucune machine macOS ne la compile. La crate n'expose que ce qu'on lui demande, un trait par chemin de module, le point remplacé par un tiret bas :

```toml
[target.'cfg(windows)'.dependencies]
windows = { version = "0.62", features = [
  "Win32_Foundation",
  "Win32_System_Com",
  "Win32_System_Power",
  "Win32_System_Threading",
  "Win32_UI_Input_KeyboardAndMouse",
  "Win32_UI_WindowsAndMessaging",
  "Foundation",
  "UI_Notifications",
  "UI_Notifications_Management",
] }
```

| Appel                                                                                                                                                                                       | Module                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `EnumWindows`, `GetWindowTextW`, `IsWindow`, `IsWindowVisible`, `IsIconic`, `ShowWindow`, `SetForegroundWindow`, `GetForegroundWindow`, `GetWindowThreadProcessId`, `SystemParametersInfoW` | `Win32::UI::WindowsAndMessaging`                     |
| `AttachThreadInput`                                                                                                                                                                         | `Win32::UI::Input::KeyboardAndMouse`                 |
| `GetCurrentThreadId`, `OpenProcess`, `QueryFullProcessImageNameW`                                                                                                                           | `Win32::System::Threading`                           |
| `PowerCreateRequest`, `PowerSetRequest`, `PowerClearRequest`, `REASON_CONTEXT`                                                                                                              | `Win32::System::Power`                               |
| `CoInitializeEx`                                                                                                                                                                            | `Win32::System::Com`                                 |
| `UserNotificationListener`, `KnownNotificationBindings`                                                                                                                                     | `UI::Notifications::Management`, `UI::Notifications` |

Le binaire des mesures a compilé toute cette liste sauf `Win32_System_Power` et `Win32_UI_Input_KeyboardAndMouse`, qu'aucune des trois questions n'appelait. Ce qui reste à corriger au premier `cargo build` est donc petit, et tient au lot A.

**`IAsyncOperation::get()` n'existe pas, c'est `.join()`.** Méthode inhérente de `windows-future`, donc rien à ajouter aux dépendances ni à importer, mais tout exemple en circulation est écrit avec l'ancien nom.

### Vérification de l'étape

Une soirée de jeu sur le PC, deux vrais clients, sans jamais ouvrir la fenêtre : les quatre raccourcis, l'AutoFocus sur trois types de notification, le menu de la barre système, et le protocole du quart d'heure de [macos.md](./macos.md) rejoué avec `powercfg /requests`.

---

## Ce qui mord

**Une mise à jour installée hérite des arguments du processus qui meurt.** `AppHandle::restart` relance le binaire avec `env.args_os` moins le premier, lu dans `tauri/src/process.rs`, et rien ne permet de lui en retirer un : `restart` reconstruit l'environnement lui-même. Donc un multifus lancé par la session et mis à jour revient sans sa fenêtre, sur le clic qui ressemble le plus à celui qui devrait en montrer une. Laissé tel quel, l'icône étant là et la fenêtre à un clic. Ne pas repartir chasser ça dans `app::update`, ce n'est pas là que ça se joue.

**Ne jamais tenir le verrou de `Multifus` en touchant au watcher de notifications, au plugin de raccourcis ou à l'icône de barre système.** Le premier joint le thread qui exécute le sink, les deux autres attendent le fil principal où les commandes prennent ce verrou. Pour l'icône ce n'est pas une supposition : `TrayIcon::set_menu` passe par `run_item_main_thread!`, qui poste la tâche puis bloque sur `rx.recv()` sans délai (`tauri/src/menu/mod.rs`). C'est le seul interblocage que cette application sache construire, et la règle est écrite en tête de `app::state` et de `app::tray`.

**Le démarrage automatique enregistre un chemin, et personne ne s'en aperçoit.** `tauri-plugin-autostart` écrit `~/Library/LaunchAgents/<nom>.plist` avec le chemin absolu du binaire ; l'application déplacée, `launchd` échoue en silence. Et `is_enabled()` ne fait que vérifier l'existence du fichier, sans jamais comparer le chemin qu'il contient, donc il répondrait « oui » sur un enregistrement mort. D'où la règle : la configuration porte l'intention, `app::autostart::reconcile` réécrit l'enregistrement à chaque lancement, et une application déplacée se répare à sa première ouverture manuelle. Même raison pour macOS 13 et plus, où l'utilisateur peut couper l'entrée depuis Réglages Système sans que le plist bouge.

**L'image de barre système n'est pas le logo.** `tray-icon` fixe la hauteur de la `NSImage` à 18 points et déduit la largeur du rapport. Donc `icons/tray.png` est un PNG **RVBA 36 × 36**, noir pur, forme portée par le seul canal alpha, fond transparent, posé avec `icon_as_template(true)` pour que macOS le recolore selon la barre. Un logo en couleur mis là ressort gris et illisible. `tauri::include_image!` décode à la compilation et **refuse un PNG qui n'est pas en RVBA**.

**Le capot fermé endort tout, et l'assertion n'y peut rien.** `PreventUserIdleDisplaySleep` ne vaut que contre une extinction faute d'activité ; fermer le capot est un geste explicite, et aucune assertion ne l'arrête. Le processus est suspendu, donc le balayage aussi, et l'avis de déconnexion part au réveil, dans les trois secondes du premier balayage qui voit le pseudo quitter le titre. Symptôme : un avis qui arrive pendant qu'on est assis devant la machine rouverte. Ce n'est pas un bug du relais, c'est le refus écrit dans perimetre.md. Le sommeil n'étant pas un arrêt du processus, le relais est en revanche toujours actif au réveil et reprend seul, jeton et file compris.

**Un client Dofus sur l'écran de connexion existe déjà en tant que processus** avec des fenêtres, mais sans titre exploitable. Toujours filtrer sur le titre, jamais sur la taille. Un client **déconnecté pour inactivité** ressemble à ça : la fenêtre reste, le pseudo quitte le titre, et le personnage passe hors ligne tout seul au tour de balayage suivant. C'est ce qui rend l'avis de déconnexion gratuit à détecter.

**`Character` n'a pas de `#[serde(default)]` de structure, et `Settings` en a un.** Un champ ajouté au personnage sans défaut à lui fait échouer la lecture de tout fichier existant : la configuration part en quarantaine, les défauts se chargent, et les sexes assignés partent avec. Poser `#[serde(default)]` sur la structure pour s'en tirer ferait pire, un personnage tronqué revenant sans pseudo.

**Les traits de `keyring` 4 ne s'appellent pas comme on croit.** `apple-native` et `windows-native` n'existent pas, et nommer les vrais, `apple-native-keyring-store` seul, ne compile pas : le trait de `keyring` n'active pas le sous-trait `keychain` du magasin. La bonne déclaration est `keyring = "4"` sans rien, dont le trait par défaut `v1` fait déjà le bon choix par cible. Détail dans l'ADR 0009.

**`cargo check --target x86_64-pc-windows-msvc` échoue depuis macOS**, avant même de compiler une ligne du projet : le build script de Tauri réclame `llvm-rc`, absent de la machine. C'est antérieur au projet, constaté sur un dépôt neuf, ne pas partir chasser ça dans le code.

**TypeScript 7 a supprimé `baseUrl`.** Les `paths` du `tsconfig.json` se résolvent relativement au fichier lui-même. Ne pas le réintroduire, le build casse.

**shadcn 4.16 repose sur Base UI, pas sur Radix.** Les API de composants diffèrent de la plupart des tutoriels shadcn en circulation.

**Ce que la règle du verrou interdit, c'est de le tenir, pas de le prendre.** `shortcuts::fire` et le clic sur un personnage dans la barre système avalent l'échec de leur `send` parce qu'il n'y a plus rien à écrire : le worker n'a jamais démarré, ce que `start` a noté, ou il est mort, ce qu'un `catch_unwind` autour de chaque réponse empêche désormais. Ce n'est pas une question d'interblocage, et une version de ce texte l'a prétendu à tort : `tray::on_menu_event` prend ce verrou sur ce même fil principal pour trois de ses articles. L'interdit porte sur le fait de le tenir pendant un appel qui attend le fil principal.

**`tauri-plugin-log` écrit du `[INFO]` sur chaque ligne, et c'est voulu.** Le journal n'a pas de niveaux, il a des événements, et la gravité est une lecture que fait l'interface. Ne pas ajouter une table de gravité côté Rust pour rendre le fichier plus joli : ce serait une seconde source de vérité. Ne pas non plus passer par `.format()`, qui est écrasé par `.timezone_strategy()` appelé après lui.

**oxfmt réécrit `tableau[tableau.length - 1]` en `tableau.at(-1)`**, que la `lib` TypeScript du projet n'a pas, donc le code ne compile plus après un `lint:fix`. Passer l'index par une variable. Constaté dans `journalPeriod`.

**Un clone sous Windows arrive en CRLF, et oxfmt ne sait pas s'en accommoder.** `core.autocrlf` vaut `true` sur une installation Windows de git, qui réécrit alors tout le répertoire de travail : 115 fichiers sur 116 échouent `format:check` sur leurs seules fins de ligne, sans qu'une ligne de code soit en cause. Régler `endOfLine` ferait échouer l'autre système à la place, les seules valeurs étant `lf`, `crlf` et `cr`, et `"auto"` n'existe pas, voir [oxc#17856](https://github.com/oxc-project/oxc/issues/17856). C'est donc à git qu'on le dit, par un `.gitattributes` en `* text=auto eol=lf`. Les blobs étant déjà en LF, il ne modifie aucun fichier : il empêche seulement la conversion au checkout.

**Un `tauri build` local finit en erreur ici, et le paquet est pourtant bon.** `createUpdaterArtifacts` étant à `true`, la dernière étape signe les artefacts de mise à jour et réclame `TAURI_SIGNING_PRIVATE_KEY`. La clé privée est sur le Mac, dans `~/.tauri/multifus.key`, et **ne se régénère pas**, voir plus haut. Le MSI et le NSIS sont écrits avant cette étape et existent malgré le code de sortie 1. Pour un build local complet de ce côté, recopier la clé depuis le Mac ; la CI, elle, la fournit en secret.

**`crate-type` ne garde que `rlib`, et le Mac ne l'a pas encore compilé.** Le scaffolder Tauri pose `["staticlib", "cdylib", "rlib"]`, dont les deux premiers sont les points d'entrée d'iOS et d'Android ; le desktop ne lie que le troisième, par `main.rs`. Sous Windows le `cdylib` faisait annoncer son import library par `link.exe`, ce que la lint `linker_messages` remonte, et c'était le seul avertissement du projet. Le mobile étant refusé par [perimetre.md](./perimetre.md), ces deux types sont du poids mort et non une sécurité qu'on retire. **À confirmer par un `cargo build` sur le Mac**, seule machine à pouvoir le dire.
