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

Session à ouvrir sur le PC Windows, dépôt cloné. Prérequis : Microsoft C++ Build
Tools avec la charge « Développement Desktop en C++ », puis
`rustup default stable-msvc`. WebView2 est déjà présent sur un Windows 10 à jour.

## L'étape, en quatre lots

**Rien de cette étape ne se relit depuis le Mac.** `cargo check --target x86_64-pc-windows-msvc` échoue avant de compiler une ligne du projet, voir « Ce qui mord ». Les lots sont donc découpés pour finir chacun sur un `cargo test` vert et un résultat visible à l'écran, et non pour être préparés ici.

**`platform::windows` n'aura aucun test unitaire, comme `platform::macos`.** Tout y parle au système. Ce qui se teste est dans `domain`, et c'est déjà fait.

### Ce qui se mesure avant d'écrire une ligne

Un binaire jetable, une heure, trois questions. La première peut condamner toute la moitié notification de l'étape, donc elle passe avant le reste.

**1. `UserNotificationListener` répond-il à un exécutable Rust non empaqueté ?** La documentation Microsoft ne parle que de `Package.appxmanifest` et de la capacité « User Notification Listener », ce qui se lit comme une identité de paquet MSIX obligatoire. Tauri livre un exécutable non empaqueté, NSIS ou MSI, jamais MSIX. Mais deux outils du même domaine s'en servent depuis un exécutable ordinaire : Dracoon, un `.exe` PyInstaller qui appelle `winsdk.windows.ui.notifications.management`, et `Madgique/dofus-multi-organizer`, en C# WinUI 3. La réponse attendue est donc oui, et il faut la voir en Rust avant de bâtir dessus. `GetAccessStatus` doit rendre autre chose que `Denied` après un `RequestAccessAsync` accepté.

Si la réponse est non, la sortie de secours est le « paquet fin », officiellement l'empaquetage avec emplacement externe : un paquet d'identité signé, enregistré à côté de l'installateur existant, qui laisse les binaires où ils sont. Il coûte une signature de plus et un enregistrement au premier lancement. Ne pas partir là-dessus avant d'avoir mesuré.

**2. À quoi ressemble un vrai toast de Dofus Retro ?** Il faut le premier élément de texte, qui doit satisfaire `TITLE_PATTERN`, et les suivants, qui forment le corps que `classify` lit. Poster un vrai message privé et recopier ce que le listener rend.

**3. Quel est le nom de l'exécutable d'un client Dofus Retro ?** C'est ce sur quoi `game_windows` filtre, et le pendant exact du bundle `com.dofus.d1elauncher` de macOS. `GetWindowThreadProcessId` puis `QueryFullProcessImageNameW` sur une fenêtre de client, et lire.

### Lot A — Les fenêtres

`Win32WindowManager`, six méthodes, et de quoi faire vivre le roster, les quatre raccourcis et le menu de la barre système sans une seule notification.

`authorization` et `request_authorization` rendent `Granted` sans rien demander : lire un titre et changer le focus ne demande aucune autorisation ici. Les deux méthodes restent sur l'interface parce que macOS en a besoin.

`game_windows` passe par `EnumWindows`, et pour chaque fenêtre : `IsWindowVisible`, puis `GetWindowThreadProcessId` pour le pid, puis `OpenProcess` en `PROCESS_QUERY_LIMITED_INFORMATION` et `QueryFullProcessImageNameW` pour le nom de l'exécutable, puis `GetWindowTextW` dimensionné par `GetWindowTextLengthW`. `foreground_game_window` fait le même filtre sur la seule fenêtre que rend `GetForegroundWindow`, sans balayage. `is_minimized` est `IsIconic`, une ligne.

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

`UserNotificationWatcher`, la moitié risquée, et celle que la mesure 1 débloque.

**Le fil du listener est en STA, et c'est le piège qui a coûté cher à Dracoon.** `UserNotificationListener` échoue en silence ou rend une erreur COM quand le fil qui l'utilise n'est pas dans un apartment mono-filaire. Donc `CoInitializeEx(None, COINIT_APARTMENTTHREADED)` en tête du fil du watcher, et tout le travail du listener sur ce fil-là. C'est déjà la forme que `platform::notification` attend, chaque implémentation gardant son fil et sa boucle pour elle.

`authorization` lit `GetAccessStatus`, `request_authorization` attend `RequestAccessAsync` sur place. Les trois valeurs du système se réduisent à deux : `Allowed` devient `Granted`, `Denied` et `Unspecified` deviennent `Denied`. Ils ne se réparent pourtant pas de la même façon, `Denied` ne pouvant plus être redemandé et `Unspecified` remontant la boîte au prochain appel, donc c'est le détail du journal qui les sépare et non le type. La documentation demande le fil d'interface pour `RequestAccessAsync` ; un exécutable non empaqueté n'en a pas au sens WinRT, et Dracoon appelle depuis un fil ordinaire. À voir avec la mesure 1.

`start` a deux routes, et la mesure tranche. L'événement `NotificationChanged` est ce que la documentation propose, et `platform::notification` avait anticipé qu'il puisse ne pas tirer. S'il ne tire pas, le repli est le sondage de `GetNotificationsAsync(NotificationKinds::Toast)` à l'intervalle du balayage, avec `UserNotification::Id` comme clé de dédoublonnage dans un ensemble qui suit ce que la plateforme tient encore, sans quoi il grossit toute la soirée. Le repli reste **interne au watcher** : le cœur ne voit qu'un sink qui pousse, et ce module l'a écrit dès l'étape 3.

Lire un toast, c'est `Notification().Visual().GetBinding(KnownNotificationBindings::ToastGeneric())` puis `GetTextElements()` : le premier élément est le titre, les suivants forment le corps joints par un saut de ligne. C'est exactement le couple que `GameNotification::new` attend.

**Aucun filtre sur l'application qui a émis, comme sur macOS.** `AppInfo.AppUserModelId` est disponible et ne sert pas : le raisonnement de l'étape 11b-2 de [macos.md](./macos.md) vaut tel quel ici, un pseudo absent du roster n'est relayé par rien et seul `game_windows` crée un personnage. `NotificationReport::Unreadable` n'est jamais envoyé de ce côté, le listener rendant un toast structuré qui est là ou n'y est pas.

`dismiss` est `RemoveNotification(id)`, donc le watcher garde une table pseudo vers identifiants, alimentée à chaque toast lu et purgée à chaque suppression. **Jamais `ClearNotifications`**, qui efface les notifications de toutes les applications, y compris celles que multifus n'a jamais lues. `stop` détache l'événement et arrête le fil, et `Drop` fait la même chose.

**Ce que l'utilisateur doit régler, et ce n'est pas ce que macOS demande.** Trois réglages, dont un seul est commun. Dans le jeu, « Background Notifications » doit être activé dans les options générales : un client qui n'émet rien rend le listener muet, et c'est la panne numéro un de tous les outils qui font ça. Dans le système, l'accès aux notifications doit être accordé à multifus. En revanche, et c'est l'inverse exact de macOS, **la bannière peut rester coupée** : l'écoute passe par une API et non par ce que l'écran dessine, donc le style et le son du toast de Dofus n'ont aucune importance. La contrainte de l'ADR 0002 ne se transporte pas, elle est propre à macOS.

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

`checks.yml` et `release.yml` portent chacun un job unique. Ils en gagnent un second sur `windows-latest`, et un `ci` vert dit alors quelque chose de `platform::windows`, ce qu'il ne dit pas aujourd'hui.

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

Cette liste n'a jamais été compilée, aucune machine ici ne le pouvant. La corriger au premier `cargo build` fait partie du lot A.

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
