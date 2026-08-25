# Ce qui mord, partout

**Les pièges qui n'appartiennent à aucun chantier et à aucun système.** Ils
étaient dans le plan, où ils survivaient mal à un changement de sujet. Ils sont
ici pour être relus quand un comportement surprend.

Ce qui est propre à un système est dans [macos.md](./macos.md) et
[windows.md](./windows.md). Le chantier en cours est dans [plan.md](./plan.md).

---

## Le cœur et les fils

**Ne jamais tenir le verrou de `Multifus` en touchant au watcher de
notifications, au plugin de raccourcis, à l'icône de barre système ou à
l'agrandissement d'une fenêtre.** Le premier
joint le thread qui exécute le sink, les trois autres attendent le fil principal où
les commandes prennent ce verrou. L'agrandissement le fait sur macOS seulement, où
`NSScreen` n'existe que là : `platform::macos::on_main_thread` y saute tout seul,
et `runtime::maximize_appeared` prend le verrou avant l'appel et après, jamais
pendant. Pour l'icône ce n'est pas une supposition :
`TrayIcon::set_menu` passe par `run_item_main_thread!`, qui poste la tâche puis
bloque sur `rx.recv()` sans délai (`tauri/src/menu/mod.rs`). C'est le seul
interblocage que cette application sache construire, et la règle est écrite en
tête de `app::state` et de `app::tray`.

**Ce que la règle interdit, c'est de tenir le verrou, pas de le prendre.**
`shortcuts::fire` et le clic sur un personnage dans la barre système avalent
l'échec de leur `send` parce qu'il n'y a plus rien à écrire : le worker n'a jamais
démarré, ce que `start` a noté, ou il est mort, ce qu'un `catch_unwind` autour de
chaque réponse empêche désormais. `tray::on_menu_event` prend d'ailleurs ce verrou
sur ce même fil principal pour trois de ses articles. L'interdit porte sur le fait
de le **tenir** pendant un appel qui attend le fil principal.

## Le domaine

**Un client Dofus sur l'écran de connexion existe déjà en tant que processus**
avec des fenêtres, mais sans titre exploitable. Toujours filtrer sur le titre,
jamais sur la taille. Un client **déconnecté pour inactivité** ressemble à ça : la
fenêtre reste, le pseudo quitte le titre, et le personnage passe hors ligne tout
seul au tour de balayage suivant. C'est ce qui rend l'avis de déconnexion gratuit
à détecter.

**Le capot fermé endort tout, et l'assertion n'y peut rien.**
`PreventUserIdleDisplaySleep` ne vaut que contre une extinction faute d'activité ;
fermer le capot est un geste explicite, et aucune assertion ne l'arrête. Le
processus est suspendu, donc le balayage aussi, et l'avis de déconnexion part au
réveil, c'est-à-dire au seul moment où il ne sert plus à rien. Symptôme : un avis
qui arrive pendant qu'on est assis devant la machine rouverte. Ce n'est pas un bug
du relais, c'est le refus écrit dans [perimetre.md](./perimetre.md). Le sommeil
n'étant pas un arrêt du processus, le relais est en revanche toujours actif au
réveil et reprend seul, jeton et file compris.

## Le collage

**Le presse-papiers rendu trop tôt ne colle rien du tout.** Le client lit le
presse-papiers quand il traite l'événement et non quand il le reçoit. Mesuré sur
le Mac : à 10 ms le champ de chat reste vide, et il ne porte même pas l'ancien
contenu. La constante est `GIVE_BACK_AFTER` dans `app::quick_replies`, à 150,
trois fois le plancher du Mac et quinze fois celui de Windows.

**Une réponse rapide posée sur la combinaison de collage se déclenche
elle-même.** Refusée à la capture, et la combinaison s'écrit à trois endroits qui
doivent dire la même chose : `PASTE_COMBINATION` dans `constants/keyboard.ts`,
`PASTE_KEY` dans `platform::macos`, `VK_V` dans `platform::windows`. Elle traverse
deux langages et un `cfg`, donc aucune constante ne peut les tenir ensemble.

**Ne pas accorder `clipboard-manager:allow-read-text` à la capacité.** Le
presse-papiers est lu depuis Rust, où la capacité ne s'applique pas. La fenêtre
n'a jamais lu le presse-papiers et n'a aucune raison de commencer : la capacité
n'accorde que `allow-write-text`, pour le bouton de copie du journal.

**Un `let ... else` qui prend le verrou n'interbloque pas.** Les temporaires de
l'initialisation meurent avant que la branche `else` s'exécute, donc
`let Some(x) = lock(app).lire() else { lock(app).ecrire() }` est correct. Vérifié
plutôt que supposé, parce que la réponse inverse aurait figé le fil des raccourcis
sans un mot.

## La configuration

**`Character` n'a pas de `#[serde(default)]` de structure, et `Settings` en a
un.** Un champ ajouté au personnage sans défaut à lui fait échouer la lecture de
tout fichier existant : la configuration part en quarantaine, les défauts se
chargent, et les sexes assignés partent avec. Poser `#[serde(default)]` sur la
structure pour s'en tirer ferait pire, un personnage tronqué revenant sans pseudo.
La règle vaut pour toute structure imbriquée qu'on ajoute, `QuickReply` comprise.

## La distribution

**Une mise à jour installée hérite des arguments du processus qui meurt.**
`AppHandle::restart` relance le binaire avec `env.args_os` moins le premier, lu
dans `tauri/src/process.rs`, et rien ne permet de lui en retirer un : `restart`
reconstruit l'environnement lui-même. Donc un multifus lancé par la session et mis
à jour revient sans sa fenêtre, sur le clic qui ressemble le plus à celui qui
devrait en montrer une. Laissé tel quel, l'icône étant là et la fenêtre à un clic.
Ne pas repartir chasser ça dans `app::update`.

**Le démarrage automatique enregistre un chemin, et personne ne s'en aperçoit.**
Le plist de macOS comme la clé `Run` de Windows portent le chemin absolu du
binaire ; l'application déplacée, l'enregistrement échoue en silence. Et
`is_enabled()` ne compare jamais le chemin qu'il contient. D'où la règle : la
configuration porte l'intention, `app::autostart::reconcile` réécrit
l'enregistrement à chaque lancement, et une application déplacée se répare à sa
première ouverture manuelle. Même raison pour macOS 13 et plus, où l'utilisateur
peut couper l'entrée depuis Réglages Système sans que le plist bouge.

**L'image de barre système n'est pas le logo, sur macOS.** `tray-icon` fixe la
hauteur de la `NSImage` à 18 points et déduit la largeur du rapport. Donc
`icons/tray.png` est un PNG **RVBA 36 × 36**, noir pur, forme portée par le seul
canal alpha, fond transparent, posé avec `icon_as_template(true)`. Un logo en
couleur mis là ressort gris et illisible. `tauri::include_image!` décode à la
compilation et **refuse un PNG qui n'est pas en RVBA**. Windows, lui, ne recolore
rien : il reçoit `icons/32x32.png`, le logo.

## Les crates et l'outillage

**Les traits de `keyring` 4 ne s'appellent pas comme on croit.** `apple-native` et
`windows-native` n'existent pas, et nommer les vrais, `apple-native-keyring-store`
seul, ne compile pas : le trait de `keyring` n'active pas le sous-trait `keychain`
du magasin. La bonne déclaration est `keyring = "4"` sans rien, dont le trait par
défaut `v1` fait déjà le bon choix par cible. Détail dans l'ADR 0009.

**`tauri-plugin-log` écrit du `[INFO]` sur chaque ligne, et c'est voulu.** Le
journal n'a pas de niveaux, il a des événements, et la gravité est une lecture que
fait l'interface. Ne pas ajouter une table de gravité côté Rust pour rendre le
fichier plus joli : ce serait une seconde source de vérité. Ne pas non plus passer
par `.format()`, qui est écrasé par `.timezone_strategy()` appelé après lui.

**TypeScript 7 a supprimé `baseUrl`.** Les `paths` du `tsconfig.json` se résolvent
relativement au fichier lui-même. Ne pas le réintroduire, le build casse.

**shadcn 4.16 repose sur Base UI, pas sur Radix.** Les API de composants diffèrent
de la plupart des tutoriels shadcn en circulation.

**oxfmt réécrit `tableau[tableau.length - 1]` en `tableau.at(-1)`**, que la `lib`
TypeScript du projet n'a pas, donc le code ne compile plus après un `lint:fix`.
Passer l'index par une variable. Constaté dans `journalPeriod`.
