# Audit technique des concurrents

Ce qu'ils font mieux que nous, et ce qu'il faut en faire. Les fonctionnalités
sont dans [concurrents.md](./concurrents.md) ; ce fichier ne parle que de la
technique : ce que le code appelle, ce qu'il coûte, et ce qu'il oublie.

Relevé du 31 août 2026. `ROrganizer` reste sur le bureau, à côté de multifus.
Les autres ont été lus puis supprimés, `focusretro` compris : tout ce qui valait
sa lecture est ici, et `gh repo clone alacroix/focusretro` le ramène en cinq
secondes le jour où on veut revérifier une ligne. `concurrents.md` dit où
reprendre les autres.

Focus Retro est un Tauri en Rust, comme nous, sur les deux systèmes.
ROrganizer est un Rust natif Windows, avec un `CLAUDE.md` : il est écrit avec
une IA, comme Dracoon, et il est propre.

## Ce qu'il faut faire

### 1. Quatre réglages Windows éteignent l'AutoFocus, et nous n'en disons rien

Dracoon (`src/core/autofocus.py`) fait un diagnostic au démarrage, et il le
journalise ligne par ligne :

1. L'autorisation d'accès aux notifications, la seule que nous lisons.
2. `HKCU\...\CurrentVersion\PushNotifications`, valeur `ToastEnabled` : les
   notifications Windows coupées pour tout le monde.
3. `HKCU\...\CurrentVersion\Notifications\Settings\<AUMID Dofus>`, valeur
   `Enabled` : les notifications coupées pour Dofus seul.
4. Le Mode Concentration et le Ne pas déranger, lus dans `FocusAssist` puis
   dans `NOC_GLOBAL_SETTING_DND`. Dracoon les relit toutes les 300 ms et écrit
   dans son journal chaque changement d'état.

Nous lisons les quatre depuis, une fois par tour, et le journal porte chaque
bascule d'une étape. Rien n'a encore été essayé sur une vraie machine Windows.

Le sujet est passé dans [plan-accueil.md](./plan-accueil.md), qui le prend en
entier : les contrôles, ce que le Mac ne sait pas lire, l'écran qui les montre,
et ce qui reste à essayer là-bas.

### 2. Le personnage exclu vole quand même le premier plan

Retro Toolbox a `tabs/accounts/focus_guard.py`, et son en-tête dit : « Dofus
force parfois le focus sur sa fenêtre quand c'est son tour de jeu. » Il écoute
`EVENT_SYSTEM_FOREGROUND` ; si la fenêtre qui passe devant est celle d'un
pseudo exclu, il ramène aussitôt la dernière fenêtre correcte. Il ne le fait
pas si la souris est sur cette fenêtre : là, c'est le joueur qui a cliqué.

Nous avons le même hook (`on_foreground`), mais il ne sert qu'à la porte, et
il ne vit que pendant le Déplacement rapide ou la roue. Notre exclusion
protège du geste de Multifus, pas de celui du jeu.

À vérifier avant de coder : est-ce que Dofus Retro passe vraiment sa fenêtre
devant au début d'un tour, ou est-ce qu'il fait seulement clignoter son bouton
dans la barre des tâches. C'est un essai sur Windows, pas une lecture de code.

Ce guetteur à demeure paierait une seconde fois, et le journal le dirait. Une
bascule est finie quand le système la donne pour finie, et c'est ce que savent
`ClickGate::expect` puis `await_arrival(SWITCH_CEILING)`, nourris par
`NSWorkspaceDidActivateApplication` et `EVENT_SYSTEM_FOREGROUND` ; le
Déplacement rapide s'en sert déjà. L'AutoFocus ne peut pas s'en servir
aujourd'hui : `watch_foreground` vit dans le fil du tap de clics, qui ne tourne
que pendant le Déplacement rapide ou la roue, donc personne n'appelle
`note_foreground` pendant une bascule ordinaire et `await_arrival` expirerait à
250 ms à chaque notification, en bloquant le fil de l'écoute d'autant. Le
journal porte donc `focus_micros`, arrêté quand l'appel système rend la main :
un focus pris, pas une fenêtre dessinée. Tenir le guetteur en permanence
donnerait les deux choses d'un coup, et c'est la même décision.

## Ce qu'ils ont de bien, et qu'on ne prend pas

### La notification macOS qui reste à l'écran

Focus Retro (`platform/macos/notifications.rs`, `click_notification_banner`)
cherche le sous-rôle `AXNotificationCenterBanner` dans l'arbre et lui envoie
`AXPress`. Notre `dismiss` sur le Mac est un `Ok(())` et rien d'autre, alors
que sur Windows il appelle `RemoveNotification` : la même fonction, deux
comportements selon le système.

À mesurer avant de décider : `AXPress` sur une bannière lance l'action par
défaut de la notification, qui ramène Dofus devant. Ce serait un focus de plus
que personne n'a demandé.

### Le reste de Focus Retro, lu en entier et écarté

Son dépôt a été lu ligne à ligne, et voilà ce qui a été regardé puis laissé.
Chacun a coûté une lecture : les rouvrir demande une raison neuve.

**`osascript` pour mettre au premier plan.** Il lance un sous-processus et fait
un aller et retour Apple Events, 50 à 150 ms, et une permission de plus.
`NSRunningApplication::activateWithOptions` fait la même chose sans rien de
tout ça, avec `AXFrontmost` en secours.

**`AXWindowCreated` à la place de `AXCreated`** pour l'écoute des bannières. Le
nôtre est plus large et fait tourner `read_banner` pour rien, mais la marche est
bornée à huit de profondeur et quatre textes, et aucune ligne en double n'est
jamais apparue au journal. Un risque de régression pour un gain qu'on ne mesure
pas.

**Le repli sur `wpndatabase.db`** quand l'autorisation Windows est refusée :
lire la base d'une autre application.

**La priorité de fil relevée** (`THREAD_PRIORITY_ABOVE_NORMAL`) sur le fil de
sondage, et **le fil séparé pour la bascule**. Le premier ne se mesure pas, le
réveil d'un `thread::sleep` dépendant surtout de la résolution du minuteur que
les jeux relèvent déjà ; le second est plus propre mais ne gagne rien, les tours
de combat arrivant un par un.

**Le rangement large des notifications.** Il retire toutes les notifications de
Dofus, traitées ou non. Nous rangeons celles dont on a su lire le pseudo, et
c'est fait avant même de décider, dans `on_notification`.

**La variante hors ligne du logiciel**, qui lui coûte une deuxième compilation
complète par plateforme à chaque publication.

**Le réordonnancement des boutons de la barre des tâches** par `ITaskbarList` :
c'est une fonctionnalité, pas une manière de faire, et elle sort de l'audit.

**Son panneau de débogage**, qui affiche la latence de chaque bascule en vert,
orange ou rouge. Notre journal porte `focus_micros` et suffit à répondre quand
un joueur trouve ça lent.

### La couleur du personnage jusque dans la barre des tâches

Le seul point de méthode à retenir de lui. Il compose son icône au vol, disque
de couleur puis portrait de classe par-dessus, au lieu d'embarquer des fichiers
finis : c'est ce qui lui permet de porter une couleur choisie par personnage
jusque dans le bouton de la barre des tâches. Nos `.ico` embarqués ne peuvent
pas. Le jour où on fera cette ligne, il faudra composer au moment de poser, et
le faire en Rust plutôt que dans le webview : l'aller et retour par le pont ne
sert à rien, et la logique reste du côté qui écrit l'icône.

### Le cache des processus Windows

`forget_the_processes()` vide toute la table à chaque tour. Nous refaisons donc
un `OpenProcess` et un `QueryFullProcessImageNameW` par pid tenant une fenêtre
visible, chaque seconde : de l'ordre de quelques millisecondes par seconde.

ROrganizer garde son cache et ne jette que les pids qu'il n'a plus vus
(`exe_cache.retain`). C'est moins cher, et c'est faux dès qu'un pid est
réattribué à un autre programme entre deux balayages. Nous gardons notre
version : elle est juste, et son coût est mesuré et petit. Vérifié, classé, à
ne pas rouvrir.

### Le crochet de clavier bas niveau

ROrganizer arme `WH_KEYBOARD_LL` au lieu d'inscrire des combinaisons. Il gagne
de pouvoir lier une touche seule sans la voler aux autres programmes, et de ne
jamais se heurter à une combinaison déjà prise. Il perd d'être un enregistreur
de frappe aux yeux d'un antivirus, et son binaire déclenche SmartScreen.

Nous restons sur `RegisterHotKey`. Notre binaire est signé et notarisé, et rien
ne vaut de perdre ça.

## Ce que nous faisons mieux, pour ne pas le réécrire

**Le crochet de souris.** Nous lisons `LowLevelHooksTimeout` dans le registre,
nous mesurons chaque passage et nous reposons le crochet quand il dépasse
(`rehook_if_overrun`), et le travail se fait hors du callback. ROrganizer
appelle `focus_window` dedans, c'est-à-dire `AttachThreadInput` et
`SetForegroundWindow` : c'est exactement ce qui fait retirer un crochet par
Windows, sans un mot, et il ne le repose jamais. Dracoon repousse le travail
d'un `threading.Timer`, mais ne surveille rien. Nous et Dracoon ignorons les
clics injectés (`LLMHF_INJECTED`) ; ROrganizer non.

**La lecture des fenêtres sur le Mac.** Nous demandons les applications par
identifiant de paquet, puis l'accessibilité. Focus Retro appelle
`CGWindowListCopyWindowInfo` et lit `kCGWindowName`, ce qui réclame
l'autorisation d'Enregistrement de l'écran : il la demande au joueur pour lire
un titre de fenêtre. Nous ne demandons que l'Accessibilité.

**Le fichier de réglages.** Fichier temporaire, `sync_all`, renommage, et mise
de côté du fichier abîmé au lieu de l'écraser. Personne d'autre ne le fait :
Dracoon et Retro Toolbox écrivent leur JSON par-dessus.

**Le jeton Telegram** dans le trousseau, `Debug` muet, adresse retirée des
erreurs. Personne d'autre n'a de secret à garder.

**La chaîne de publication.** Signature, notarisation, attestation de
provenance, actions épinglées par empreinte, capacités minimales, CSP stricte,
`removeUnusedCommands`. L'attestation que `concurrents.md` donnait à creuser
chez Focus Retro est déjà dans `release.yml`, sur les deux systèmes.

**La roue** s'ouvre au milieu de l'écran et ne déplace jamais le curseur. Le
menu de dosoft s'ouvre sous la souris, ce qui déplace la main du joueur au
milieu d'un combat.

## Ce qu'ils font et que nous refusons

Focus Retro envoie la touche Entrée dans le jeu (`send_enter_key`,
`CGEventPost`) pour passer l'écran de connexion. C'est une frappe envoyée au
client : c'est la ligne que nous ne passons pas.

Retro Toolbox interroge un Supabase pour les prix de l'hôtel de vente
(`hdv_prices.py`, dossier `supabase`). Dracoon écrit dans le registre pour
migrer ses anciens réglages.

## Ce qu'il reste à essayer sur Windows

- L'instance unique, livrée : lancer Multifus une deuxième fois. Le second
  lancement doit s'arrêter tout seul, la fenêtre du premier revenir devant, et
  le journal porter « Multifus tournait déjà ». À essayer aussi Multifus rangé
  dans la barre système, fenêtre fermée.
- Un client Dofus lancé en administrateur : notre titre court, notre tête de
  classe et notre bascule échouent tous en silence sur sa fenêtre, et le
  personnage reste pourtant dans le roster. Vérifier ce que dit le journal.
- Le point 3 : est-ce que le jeu passe devant tout seul au début d'un tour.

## Ce que ce document a corrigé ailleurs

`concurrents.md` listait l'attestation de compilation comme un manque à
creuser. Elle est déjà en place. La ligne est retirée.
