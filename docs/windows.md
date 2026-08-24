# Windows, ce qui est fait et ce qui mord

**Archive. Le code est écrit de bout en bout, la soirée de vérification reste à
jouer.** Les quatre lots ont un corps, `platform::windows` ne rend plus jamais
`NotImplemented`, et la porte du projet passe entière sur cette machine. Ce qui
suit se relit quand un comportement surprend, jamais pour être repris.

Le travail en cours est dans [plan.md](./plan.md). macOS est dans
[macos.md](./macos.md), les pièges qui ne sont propres à aucun système dans
[pieges.md](./pieges.md).

**Ce qui reste et qui n'est pas du code** : la soirée de vérification sur deux
vrais clients, et le certificat Authenticode. Les deux sont en bas.

---

## La machine, prête et sans rien à installer

Fait le 23 août 2026, sur le PC Windows 10 où les lots se sont joués. Une session
qui ouvre ce dépôt compile à la première commande.

| Outil                     | Version                         |
| ------------------------- | ------------------------------- |
| Node                      | 24.19.0, ce que dit `.nvmrc`    |
| Rust                      | 1.98.0                          |
| Visual Studio Build Tools | 2026, charge « Desktop en C++ » |
| WebView2                  | 151.0.4129.101, déjà présent    |

`x86_64-pc-windows-msvc` est le toolchain par défaut ici, l'installeur l'ayant
choisi seul.

**La porte passe en entier.** Les sept commandes de `checks.yml` jouées à la
main : `lint`, `format:check` sur 116 fichiers, 179 tests JavaScript, `build`,
`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, 124 tests Rust.
Aucun avertissement.

---

## Ce qui a été mesuré, et ce que ça a tranché

Fait le 23 août 2026, avec un binaire jetable, sur ce PC et un vrai client.

**1. Le listener sert un exécutable non empaqueté, et ne demande rien.**
`UserNotificationListener::Current()` rend un listener depuis un `.exe` Rust nu,
sans identité de paquet, et `GetAccessStatus` rend `Allowed` **avant même**
`RequestAccessAsync` : aucune boîte ne sort. Le « paquet fin » est écarté.

**2. `NotificationChanged` n'existe pas de ce côté.** L'abonnement lui-même
échoue, `HRESULT 0x80070490` « Élément introuvable », et pas l'événement qui
resterait muet : il n'y a rien à attendre ni à déboguer. C'est le prix de
l'exécutable non empaqueté, et la mesure 1 dit que c'est le seul. Le sondage n'est
pas un repli, c'est la route.

**3. Un toast de Dofus est exactement ce que `GameNotification::new` attend.**

| Ce que rend le listener | Valeur                                |
| ----------------------- | ------------------------------------- |
| `AppUserModelId`        | `com.dofus.d1elauncher`               |
| `texte[0]`              | `Dj-blop-[ART] - Dofus Retro v1.49.0` |
| `texte[1]`              | `de Trusted-sheriff-[ART] : test`     |

`TITLE_PATTERN` mord sur `texte[0]`, le `^de ` de `NOTIF_TYPES` mord sur
`texte[1]`. Le corps arrive entier, ce qui ferme la ligne « corps complet » de
[perimetre.md](./perimetre.md) sur les deux systèmes. Deux toasts d'identifiants
distincts sont sortis pour un même texte, ce qui rend la dédup par
`UserNotification::Id` obligatoire et non prudente.

**4. L'exécutable du client est `Dofus Retro.exe`**, sous
`%LOCALAPPDATA%\Ankama\Retro\`. C'est le nom de fichier qui sert de filtre et
jamais le chemin, que l'installation déplace. Un client rend une fenêtre et une
seule. Le titre est en `v1.49.0` et `TITLE_PATTERN`, écrit contre `v1.48.21`, mord
sans retouche.

---

## Lot A — Les fenêtres

`Win32WindowManager`, six méthodes. `authorization` et `request_authorization`
rendent `Granted` sans rien demander : lire un titre et changer le focus ne
demande aucune autorisation ici. Les deux méthodes restent sur l'interface parce
que macOS en a besoin.

`game_windows` passe par `EnumWindows`, et pour chaque fenêtre :
`IsWindowVisible`, puis `GetWindowThreadProcessId` pour le pid, puis `OpenProcess`
en `PROCESS_QUERY_LIMITED_INFORMATION` et `QueryFullProcessImageNameW` pour le nom
de l'exécutable, puis `GetWindowTextW` dimensionné par `GetWindowTextLengthW`.
`foreground_game_window` fait le même filtre sur la seule fenêtre que rend
`GetForegroundWindow`, sans balayage. `is_minimized` est `IsIconic`.

**Filtrer sur le processus et pas sur le seul titre, et c'est un bug déjà vu.**
`EnumWindows` balaie tout le bureau, et un onglet de navigateur intitulé
`Quelque chose - Dofus Retro` satisfait la regex : le navigateur entre alors dans
le roster comme un personnage et se fait ramener au premier plan. C'est arrivé.
macOS n'a jamais eu ce trou parce que `dofus_applications` n'énumère que les
processus du bundle. Le titre reste ce qui donne le pseudo, il cesse d'être ce qui
donne le droit d'entrer.

**La danse `AttachThreadInput`, écrite une fois pour toutes.**
`SetForegroundWindow` refuse quand le processus appelant n'a pas déjà le focus, et
rend `FALSE` sans dire pourquoi.

```rust
let current = GetCurrentThreadId();
let foreground = GetWindowThreadProcessId(GetForegroundWindow(), None);
let owner = GetWindowThreadProcessId(target, None);
AttachThreadInput(current, foreground, true);
AttachThreadInput(current, owner, true);
// ShowWindow(SW_RESTORE) si IsIconic, BringWindowToTop, puis SetForegroundWindow
AttachThreadInput(current, owner, false);
AttachThreadInput(current, foreground, false);
```

**Attacher la seule file du premier plan ne suffit pas.** Il faut y joindre le fil
propriétaire de la fenêtre visée, et appeler `BringWindowToTop` avant
`SetForegroundWindow`. Mesuré des deux côtés : la recette courte a ramené une
fenêtre sur trois, la recette complète quatre sur quatre.

Ce qui a rendu la mesure difficile se retendra à la prochaine panne de focus :
**toutes les recettes marchent quand multifus vient de recevoir une frappe.** « Le
processus a reçu le dernier événement d'entrée » est une des conditions qui
autorisent `SetForegroundWindow`, donc un banc d'essai où l'on clique avant de
mesurer donne cinq recettes gagnantes et n'apprend rien. C'est aussi pourquoi les
quatre raccourcis marchaient pendant que l'AutoFocus échouait, sur la même ligne
de code. Une notification n'apporte aucune entrée.

Le détachement part quelle que soit l'issue, sinon multifus laisse derrière lui
des files d'entrée liées, ce qui se paie sur le bureau entier. Une structure avec
un `Drop` le tient. `ShowWindow(SW_RESTORE)` entre dans l'attache et non avant :
restaurer fait partie du focus.

**Le piège de Dracoon, à ne pas reproduire.** Il contourne la même restriction en
injectant une vraie frappe Alt dans l'application active. C'est la cause probable
du bug de focus intermittent corrigé dans son commit `0b0525c`, et ça envoie une
touche parasite dans le jeu. L'exception du collage de
l'[ADR 0012](./adr/0012-une-reponse-rapide-se-colle-dans-le-jeu.md) ne couvre pas ça et ne
l'a jamais couvert.

**`WindowGone` se lit sur `IsWindow` et sur l'exécutable.** Windows réemploie les
handles, donc `IsWindow` peut dire oui d'une fenêtre qui n'est plus celle qu'on
croit ; le filtre sur l'exécutable la rattrape, et `is_minimized` comme `focus`
passent par le même `live_game_window`. Deux clients qui échangent leurs handles
restent hors de portée, et c'est le prix du `HWND` comme identité.

**Aucun saut vers le fil principal, contrairement à macOS.** Ces appels Win32 se
font depuis n'importe quel fil, et `WindowManager` est `Send + Sync` justement
parce que les rappels de raccourcis tournent sur des fils que multifus ne choisit
pas.

**Vérifié quand** : deux vrais clients, le roster qui les voit, les quatre
raccourcis depuis le jeu, un clic sur un personnage dans la barre système, et une
fenêtre réduite qui ressort.

## Lot B — Les notifications

**Le fil du listener est en STA, et c'est le piège qui a coûté cher à Dracoon.**
`UserNotificationListener` échoue en silence ou rend une erreur COM quand le fil
qui l'utilise n'est pas dans un apartment mono-filaire. Donc
`CoInitializeEx(None, COINIT_APARTMENTTHREADED)` en tête du fil du watcher, et
tout le travail du listener sur ce fil-là.

`authorization` lit `GetAccessStatus`, `request_authorization` attend
`RequestAccessAsync` sur place. Les trois valeurs du système se réduisent à deux :
`Allowed` devient `Granted`, `Denied` et `Unspecified` deviennent `Denied`. Ils ne
se réparent pourtant pas de la même façon, `Denied` ne pouvant plus être redemandé
et `Unspecified` remontant la boîte au prochain appel, donc c'est le détail du
journal qui les sépare et non le type.

**Le sondage est à 500 ms et non à l'intervalle du balayage.** L'événement
n'existant pas, ce délai est celui de l'AutoFocus tout entier : trois secondes
pour qu'une fenêtre remonte sur un tour de combat se voient dans le jeu, un appel
WinRT deux fois par seconde ne se voit pas sur la machine.
`GetNotificationsAsync(NotificationKinds::Toast)`, avec `UserNotification::Id`
comme clé de dédoublonnage dans un ensemble qui suit ce que la plateforme tient
encore, sans quoi il grossit toute la soirée.

Lire un toast, c'est
`Notification().Visual().GetBinding(KnownNotificationBindings::ToastGeneric())`
puis `GetTextElements()` : le premier élément est le titre, les suivants forment
le corps joints par un saut de ligne.

**Aucun filtre sur l'application qui a émis, comme sur macOS.** Un pseudo absent
du roster n'est relayé par rien et seul `game_windows` crée un personnage.
`NotificationReport::Unreadable` n'est jamais envoyé de ce côté.

`dismiss` est `RemoveNotification(id)`, donc le watcher garde une table pseudo
vers identifiants. **Jamais `ClearNotifications`**, qui efface les notifications
de toutes les applications.

**`dismiss` met en file et ne supprime pas sur place, et c'est la règle du verrou
qui le décide.** Il est appelé depuis `on_notification`, qui tourne sur le fil du
watcher, alors que `start` et `stop` tiennent le mutex de `WatcherState` pendant
un `join` de ce fil-là. Le watcher pousse le pseudo dans sa propre table et le
tour de sondage suivant appelle `RemoveNotification` ; le site d'appel prend ce
mutex en `try_lock`.

**Ce que l'utilisateur doit régler, et ce n'est pas ce que macOS demande.** Dans
le jeu, « Background Notifications » doit être activé dans les options générales :
un client qui n'émet rien rend le listener muet, et c'est la panne numéro un de
tous les outils qui font ça. **La bannière peut rester coupée**, à l'inverse exact
de macOS : l'écoute passe par une API et non par ce que l'écran dessine. La
contrainte de l'ADR 0002 ne se transporte pas.

**La bannière ne bloque pas le focus, et Dracoon laissait croire le contraire.**
Mesuré ici : quatre toasts sur quatre, bannière à l'écran, la fenêtre remonte en
130 ms. Le symptôme attendu venait de la recette d'attache du lot A. Ne pas
rouvrir cette piste.

**L'AutoFocus est vérifié, la suppression des toasts non.** Deux messages privés
d'affilée ramènent la bonne fenêtre. Restent à voir un second type de notification
et un toast qui quitte le centre de notifications.

## Lot C — L'écran tenu éveillé

**`SetThreadExecutionState` est le mauvais appel.** Il pose l'état sur le fil
appelant et pas sur le processus : l'état meurt avec le fil, c'est un masque de
bits et non un compteur, et deux composants du même fil s'écrasent l'un l'autre.

**C'est `PowerCreateRequest` et `PowerSetRequest`.** Le handle appartient au
processus, n'importe quel fil le pose et le relâche. C'est le jumeau exact de
`IOPMAssertionCreateWithName` : le `REASON_CONTEXT` s'affiche dans
`powercfg /requests` comme l'assertion de multifus s'affiche dans
`pmset -g assertions`.

| Méthode      | Appel                                                                            |
| ------------ | -------------------------------------------------------------------------------- |
| `keep_awake` | `PowerCreateRequest` puis `PowerSetRequest(handle, PowerRequestDisplayRequired)` |
| `release`    | `PowerClearRequest` puis `CloseHandle`                                           |
| `is_awake`   | `held.is_some()`                                                                 |

**La demande naît du maintien et pas du constructeur.** `new` ne peut rien rendre,
donc un `PowerCreateRequest` posé là perd son échec en silence. Le handle vit
exactement le temps du maintien, et `Drop` relâche avant que le processus meure.

`PowerRequestDisplayRequired` seul, comme `PreventUserIdleDisplaySleep` sur macOS.
Ce qui rend le relais muet est la session verrouillée, pas la machine ralentie.

**`POWER_REQUEST_CONTEXT_VERSION` n'est pas dans `Win32_System_Power`.** Il vit
dans `Win32_System_SystemServices`, une fonctionnalité entière pour un zéro : la
constante est écrite dans le module.

`screen_saver_delay` appelle `SystemParametersInfoW` deux fois,
`SPI_GETSCREENSAVEACTIVE` d'abord, qui sépare `Never` d'un délai, puis
`SPI_GETSCREENSAVETIMEOUT`, qui rend des secondes.

**Les quatre appels passent, mesuré sur ce PC.** `SPI_GETSCREENSAVEACTIVE` rend 0
sur cette machine, donc `Never` : la branche du délai n'a pas de témoin ici,
exactement comme sur le Mac de développement.

## Lot D — La chaîne de compilation, le paquet et la barre système

**`checks.yml` a deux runners.** Le job unique est devenu une matrice
`macos-latest, windows-latest`, `fail-fast` coupé pour qu'un système qui casse
n'empêche pas de savoir ce que dit l'autre.

**`release.yml` a deux jobs et pas une matrice.** Les secrets Apple et la
notarisation n'appartiennent qu'à macOS, et Windows ne signe rien du tout.

**Le job Windows suit celui de macOS au lieu d'être à côté, et c'est le
`latest.json` qui l'impose.** `tauri-action` télécharge le `latest.json` déjà posé
sur la publication et fusionne ses plateformes dans celui qu'il téléverse : c'est
une lecture puis une écriture. Joués en parallèle, le job le plus lent publierait
un fichier où la plateforme de l'autre n'a jamais existé. Vérifié dans
`upload-version-json.ts` de l'action, pas déduit.

**La barre système n'a pas eu besoin d'une seconde image.** Windows reçoit
`icons/32x32.png`, le logo, celui-là même que `npm run tauri icon` régénère.
`icons/tray.png` reste à macOS seul, avec `icon_as_template` qui vaut
`cfg!(target_os = "macos")`.

**Windows ne publie qu'un installateur, et le `latest.json` l'impose.**
`bundle.targets` vaut `all`, donc un `tauri build` sort le MSI et le NSIS ; mais
`latest.json` ne porte qu'une archive par plateforme, et `tauri-action` y met le
MSI d'abord, son `updaterJsonPreferNsis` valant `false` par défaut. Une
installation faite au NSIS, par utilisateur et sans UAC, se verrait donc mettre à
jour par le MSI, par machine et ailleurs sur le disque : deux copies, et
l'enregistrement de démarrage qui pointe vers l'ancienne. Le job passe
`--bundles nsis`.

**Les raccourcis échouent franchement, et il n'y a rien à écrire.** Windows refuse
une combinaison déjà prise, contrairement à macOS où l'enregistrement réussit et
la touche reste morte. `Control+Shift+flèche` n'est pas réservé par Windows, qui
prend `Win+Control+flèche` pour ses bureaux, donc les combinaisons proposées au
premier lancement conviennent aux deux systèmes.

**Vu à l'écran le 24 août 2026** : l'icône est là et lisible dans la zone de
notification, et le journal n'écrit plus d'échec de démarrage avec la session.

**L'appairage disait « connecté », le mot que l'écran Relais s'interdit.** Vu le
24 août 2026 en reliant depuis Windows le robot déjà apparié sur le Mac. Le
message d'appairage porte maintenant deux lignes comme l'avis d'activation, et un
test refuse qu'il prononce l'un des deux mots de l'interrupteur.

**Un robot se réutilise d'une machine à l'autre, un jeton non.** Le second poste
recolle le même jeton et retombe sur le même salon. Il faut en revanche réécrire
au robot juste avant Connecter, `getUpdates` ne gardant ses mises à jour que
vingt-quatre heures. Deux multifus relais actif sur le même robot écrivent dans le
même salon, et rien ne dit lequel a parlé.

---

## Les dépendances

`windows` 0.62 en dépendance directe, sous une cible pour qu'aucune machine macOS
ne la compile. La crate n'expose que ce qu'on lui demande, un trait par chemin de
module, le point remplacé par un tiret bas. **Les traits sont arrivés lot par
lot**, pour que rien ne se compile avant d'être appelé.

| Appel                                                                                                                                                                                       | Module                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `EnumWindows`, `GetWindowTextW`, `IsWindow`, `IsWindowVisible`, `IsIconic`, `ShowWindow`, `SetForegroundWindow`, `GetForegroundWindow`, `GetWindowThreadProcessId`, `SystemParametersInfoW` | `Win32::UI::WindowsAndMessaging`                     |
| `AttachThreadInput`, `GetCurrentThreadId`, `OpenProcess`, `QueryFullProcessImageNameW`                                                                                                      | `Win32::System::Threading`                           |
| `PowerCreateRequest`, `PowerSetRequest`, `PowerClearRequest`, `REASON_CONTEXT`                                                                                                              | `Win32::System::Power`                               |
| `CoInitializeEx`                                                                                                                                                                            | `Win32::System::Com`                                 |
| `UserNotificationListener`, `KnownNotificationBindings`                                                                                                                                     | `UI::Notifications::Management`, `UI::Notifications` |

`Win32_System_SystemServices` n'y est pas, et c'est délibéré :
`POWER_REQUEST_CONTEXT_VERSION` y vit seul et vaut zéro.

**`AttachThreadInput` n'est pas où la documentation le range.** Il vit dans
`Win32::System::Threading` et non dans `Win32::UI::Input::KeyboardAndMouse`.

**`IAsyncOperation::get()` n'existe pas, c'est `.join()`.** Méthode inhérente de
`windows-future`, donc rien à ajouter aux dépendances, mais tout exemple en
circulation est écrit avec l'ancien nom.

Le chantier des réponses rapides ajoutera `Win32_UI_Input_KeyboardAndMouse` pour
`SendInput`, et ce sera le premier appel de ce trait dans le projet.

---

## Ce qui reste, et qui n'est pas du code

**La soirée de vérification.** Une soirée de jeu sur le PC, deux vrais clients,
sans jamais ouvrir la fenêtre : les quatre raccourcis, l'AutoFocus sur trois types
de notification, un toast qui quitte le centre de notifications, le menu de la
barre système et ses articles suivis, et le protocole du quart d'heure de
[macos.md](./macos.md) rejoué avec `powercfg /requests`.

**Le certificat Authenticode.** Ce n'est pas un Developer ID, il s'achète ailleurs
et ne pose pas les mêmes secrets. Sans lui, SmartScreen avertit à chaque
installation. À trancher quand macOS sera publié pour de bon : le job Windows
publie non signé en attendant, et c'est écrit dans le fichier.

**`crate-type = ["rlib"]`, à confirmer par un `cargo build` sur le Mac.** Le
scaffolder pose `["staticlib", "cdylib", "rlib"]`, dont les deux premiers sont les
points d'entrée d'iOS et d'Android ; le desktop ne lie que le troisième. Sous
Windows le `cdylib` faisait annoncer son import library par `link.exe`, ce que la
lint `linker_messages` remonte, et c'était le seul avertissement du projet. Le Mac
ne l'a pas encore compilé.

---

## Ce qui mord, côté Windows

**Le retrait du démarrage automatique n'est pas gardé.** `auto-launch` 0.5.0
appelle `delete_value` sur la clé `Run` sans regarder si la valeur existe, là où
sa version macOS teste `file.exists()` d'abord. Une intention décochée, qui est
celle du premier lancement, réclamait donc à chaque démarrage le retrait de rien,
et le registre répondait `os error 2`. `app::autostart::reconcile` garde le
retrait derrière `is_enabled` pour ça, et pour ça seulement. L'ajout reste
inconditionnel, c'est lui qui réécrit le chemin.

**Et `is_enabled` n'est pas exactement la question posée.** Il rend `Run` **et**
l'accord du gestionnaire des tâches, `StartupApproved\Run` : une entrée désactivée
depuis cet onglet se lit absente alors que la valeur est là, et le retrait la
laisse. Ça ne coûte rien tant que l'accord manque ; le jour où l'utilisateur le
redonne, multifus démarre une fois contre son réglage, et le `reconcile` de ce
lancement-là voit enfin l'enregistrement et l'enlève.

**`powercfg /requests` demande une invite élevée**, et la refuse autrement avec un
message et rien d'autre. Le protocole du quart d'heure se joue donc dans un
terminal administrateur.

**Un clone sous Windows arrive en CRLF, et oxfmt ne sait pas s'en accommoder.**
`core.autocrlf` vaut `true` sur une installation Windows de git, qui réécrit alors
tout le répertoire de travail : 115 fichiers sur 116 échouent `format:check` sur
leurs seules fins de ligne. Régler `endOfLine` ferait échouer l'autre système à la
place, `"auto"` n'existant pas, voir
[oxc#17856](https://github.com/oxc-project/oxc/issues/17856). C'est donc à git
qu'on le dit, par un `.gitattributes` en `* text=auto eol=lf`.

**`cargo check --target x86_64-pc-windows-msvc` échoue depuis macOS**, avant même
de compiler une ligne du projet : le build script de Tauri réclame `llvm-rc`,
absent de la machine. C'est antérieur au projet, constaté sur un dépôt neuf, ne
pas partir chasser ça dans le code. **Rien de ce qui touche `platform::windows` ne
se relit depuis le Mac.**

**Un `tauri build` local finit en erreur ici, et le paquet est pourtant bon.**
`createUpdaterArtifacts` étant à `true`, la dernière étape signe les artefacts de
mise à jour et réclame `TAURI_SIGNING_PRIVATE_KEY`. La clé privée est sur le Mac,
dans `~/.tauri/multifus.key`, et **ne se régénère pas**. Le MSI et le NSIS sont
écrits avant cette étape et existent malgré le code de sortie 1.
