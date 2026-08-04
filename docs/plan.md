# Plan de développement

Ce document est la feuille de route de multifus. Il existe pour qu'un développeur, humain ou assistant, puisse reprendre le projet sans rien redécouvrir.

Avant toute chose : lire [CONTEXT.md](../CONTEXT.md) pour le vocabulaire, [perimetre.md](./perimetre.md) pour ce qui est dans le périmètre et surtout ce qui n'y est pas, et [adr](./adr) pour les décisions qu'il ne faut pas reprendre à zéro.

---

## Étape 0 — Bootstrap ✅

Faite. Le dépôt contient un projet Tauri v2 fonctionnel.

Tauri 2.11, React 19.2, Vite 8.2, TypeScript 7.0, Tailwind 4.3, shadcn 4.16 en style `base-vega`. Alias `@` vers `src`, thème sombre activé sur le `<html>`, police Inter Variable. Rust 1.97 stable.

Vérification : `npm run build` passe.

---

## Étape 1 — Outillage ✅

**Objectif.** Le projet respecte les conventions du mainteneur et peut produire des releases.

Brancher **`@viclafouch/oxc-config`** pour oxlint et oxfmt, avec les scripts `lint`, `lint:fix`, `format`, `format:check` calqués sur les autres dépôts viclafouch. Ajouter un `.nvmrc` sur Node 24. Poser la licence **MIT** et remplir les champs `author`, `license`, `repository`, `bugs` du `package.json`. Installer **`standard-version`** pour le changelog, puisque l'historique est déjà en conventional commits.

**Vérification.** `npm run lint` et `npm run format:check` sortent en zéro.

Faite. Le lint est type-aware, `typeAware` et `typeCheck` activés, donc `npm run lint` couvre aussi les erreurs du compilateur. Les fichiers générés par shadcn, `src/components/ui/**` et `src/lib/utils.ts`, portent un override : le `ClassValue` de clsx est récursivement mutable et ne peut pas satisfaire `prefer-readonly-parameter-types`. `standard-version` bumpe `src-tauri/tauri.conf.json` en même temps que le `package.json`, sans quoi la version du bundle décrocherait du changelog.

---

## Étape 2 — Cœur métier en Rust, sans système ✅

**Objectif.** Toute la logique de multifus est testable sans ouvrir une fenêtre ni lire une notification.

Modéliser `Character` (pseudo, sexe, veille, connecté) et `Roster`. Écrire les fonctions pures : personnage suivant et précédent en sautant les personnages en veille, bascule de veille, bascule de sexe, et la classification d'une notification.

Porter depuis Dracoon deux éléments qui ont fait leurs preuves et qu'il ne faut pas réinventer. Le premier est l'extraction du pseudo depuis un titre de fenêtre ou de notification, par la regex `^(.+?)\s*-\s*Dofus`. Le second est la table de patterns par type de notification, en français, anglais et espagnol, vérifiée valide sur les deux systèmes. Elle se trouve dans `Dracoon.pyw` sous le nom `NOTIF_TYPES`.

**Vérification.** `cargo test` couvre le défilement avec des personnages en veille, le cas où tout le monde dort, et la classification des sept types dans les trois langues. Aucun appel système dans ce module.

Faite, dans `src-tauri/src/domain`. Le sexe est un `Option<Gender>` puisqu'il s'assigne à la main et reste donc inconnu tant que l'utilisateur n'a rien dit. La veille et l'état connecté portent `#[serde(skip)]` dès ce module, ce qui verrouille l'ADR 0004 au niveau du type plutôt qu'au niveau de l'écrivain. L'ordre du `Vec` du roster est l'ordre du défilement, il n'y a pas de champ de position à maintenir en parallèle. Le parcours visite son point de départ en dernier, donc un unique personnage éveillé se renvoie lui-même au lieu de ne rien renvoyer, et un `current` inconnu repart du bout du roster pour qu'un raccourci tiré depuis une fenêtre inconnue aille quand même quelque part. La regex et la table `NOTIF_TYPES` sont portées telles quelles depuis Dracoon : l'ordre de la table est de la donnée, `de jouer` passe avant `^de `, sans quoi chaque tour de combat serait classé message privé.

---

## Étape 3 — Frontière entre le cœur et le système ✅

**Objectif.** Le portage Windows ne doit rien réécrire du cœur.

Définir deux interfaces. `WindowManager` énumère les fenêtres de jeu avec leur pseudo, en focus une, et dit si la fenêtre au premier plan est une fenêtre Dofus. `NotificationWatcher` démarre une écoute et remonte le titre et le corps de chaque notification de jeu.

Créer `platform::macos` et `platform::windows`, sélectionnés par `cfg`. Le module Windows compile mais renvoie une erreur « non implémenté ».

**Pourquoi maintenant.** Concevoir cette frontière en ne connaissant qu'un seul système garantit de tout réécrire au moment du portage. La réalité Windows est connue en détail grâce à Dracoon, les deux côtés peuvent donc être pris en compte dès le premier jour.

**Vérification.** Le projet compile sur macOS, et `cargo check --target x86_64-pc-windows-msvc` compile aussi une fois la cible ajoutée.

Faite, dans `src-tauri/src/platform`. Trois décisions à ne pas rejouer. L'identité d'une fenêtre est un jeton opaque sur `u64`, `WindowId`, qui tient aussi bien un pid macOS qu'un `HWND` 64 bits ; le cœur le transporte sans jamais le lire, et il n'est délibérément pas `Serialize` puisqu'il ne survit pas à la fenêtre qui l'a produit. `GameWindow` n'a qu'une porte d'entrée, `from_title`, donc une fenêtre sans pseudo exploitable ne peut pas exister : le client resté sur l'écran de connexion est écarté par construction, et le filtrage est sur le titre, jamais sur la taille. L'écoute est un callback et non un canal, parce qu'un canal obligerait le cœur à parquer un thread sur `recv` ou à revenir au polling que cette frontière existe pour éviter.

`game_windows` renvoie `AuthorizationDenied` plutôt qu'une liste vide, pour que l'appelant distingue « personne n'est connecté » de « multifus n'a pas le droit de regarder ». `foreground_game_window` rend la fenêtre et pas un booléen, sinon le raccourci de veille demanderait deux appels et le premier plan pourrait changer entre les deux.

La vérification Windows n'a pas pu être jouée sur la machine de développement, voir les pièges connus.

---

## Étape 4 — Implémentation macOS ✅ écrite, non vérifiée

**Objectif.** L'AutoFocus fonctionne sur macOS.

La route est validée par prototype, voir [ADR 0002](./adr/0002-notifications-macos-via-accessibility.md). Poser un `AXObserver` sur le processus `com.apple.notificationcenterui` et lire les `AXStaticText` de la bannière à sa création. L'arbre observé pendant le prototype est le suivant, le premier texte est le titre et le second le corps :

```
window "Notification Center"
└─ group 1 → group 1 → scroll area 1 → group 1
   ├─ static text  "Pseudo - Dofus Retro v1.48.21"
   └─ static text  "de Untel : a ton tour de jouer"
```

Pour les fenêtres : filtrer les processus dont le bundle est `com.dofus.d1elauncher`, lire l'`AXTitle` de leur fenêtre principale, et ne retenir que celles dont le titre matche la regex. Un client encore sur l'écran de connexion a des fenêtres mais pas de titre exploitable, il faut donc filtrer sur le titre et jamais sur la taille. Le focus se fait en activant le processus par son pid, un processus correspondant à un client.

Demander l'autorisation d'Accessibilité avec `AXIsProcessTrustedWithOptions`, et afficher un écran d'explication tant qu'elle n'est pas accordée.

Crates pressenties : `objc2`, `objc2-app-kit`, `objc2-application-services`.

**Vérification.** Deux clients ouverts, une notification de combat sur le second, le focus bascule dessus en moins de 300 ms.

Écrite, dans `platform::macos`, mais **pas vérifiée** : elle compile, elle est lintée et testée, et elle n'a jamais tourné face à un vrai client Dofus. L'AutoFocus macOS n'est donc pas prouvé. Ne rien construire qui suppose qu'il fonctionne tant que la vérification ci-dessus n'a pas été faite pour de bon.

Trois hypothèses de cette étape ont tout de même été confrontées à un vrai client Retro pendant l'étape 7, hors de l'application, en lecture seule, avec un harnais jetable qui n'est pas dans le dépôt. Le bundle est bien `com.dofus.d1elauncher`. Le titre de la fenêtre principale est bien de la forme `Pseudo - Dofus Retro v1.48.21`, que la regex reconnaît. Et lire `AXMainWindow` puis `AXTitle` sur ce client coûte 0,05 ms en médiane. Restent non vérifiés, et ce sont les deux qui comptent : l'observateur de bannières et l'activation du processus.

Ce qui a été décidé en l'écrivant. Le focus a deux portes : `activateWithOptions(ActivateAllWindows)` d'abord, sans le `ActivateIgnoringOtherApps` que macOS a déprécié, puis `AXFrontmost` si l'activation coopérative refuse, ce qu'elle a le droit de faire pour une application qui n'est pas au premier plan, et multifus ne l'est jamais. Même processus, même intention, seconde porte.

L'observateur vit sur un thread nommé qui possède tout ce que l'API Accessibility lui rend, rien n'en sort, ce qui donne un watcher `Send + Sync` sans une seule promesse `unsafe` sur des objets Core Foundation. `start` attend par un canal le compte rendu de mise en route, donc une autorisation refusée ou un centre de notifications introuvable revient à l'appelant au lieu de mourir en silence dans un thread ; `stop` joint le thread, donc quand il rend la main le sink ne sera plus appelé. La marche dans la bannière est bornée à huit niveaux et quatre textes, pour ne pas parcourir tout le centre de notifications sur ce thread. Les constantes `AXTitle`, `AXFrontmost` et les autres ne sont pas exposées par `objc2-application-services` et sont réécrites comme dans les en-têtes du framework.

Une absence n'est pas une erreur : attribut inexistant, sans valeur, client qui n'implémente pas l'Accessibility ou fenêtre disparue entre deux appels donnent tous `Ok(None)`. Seuls une autorisation retirée en cours de route, qui devient `AuthorizationDenied` sur-le-champ, et un vrai échec système remontent en erreur.

---

## Étape 5 — Persistance ✅

**Objectif.** Les réglages survivent au redémarrage, la veille non.

Un fichier JSON dans le dossier de configuration standard du système, via `app_config_dir` de Tauri. Il contient le roster (pseudo, sexe, position dans le défilement), les quatre raccourcis, les sept interrupteurs AutoFocus, et l'option de démarrage automatique. Il ne contient **pas** l'état de veille, voir [ADR 0004](./adr/0004-veille-ephemere-sexe-persiste.md).

**Vérification.** Relancer multifus conserve les sexes et l'ordre, et réveille tout le monde.

Faite, dans `src-tauri/src/config`, troisième module à côté de `domain` et `platform` : lire et écrire un fichier n'est ni de la logique pure ni la frontière des fenêtres et des notifications. `ConfigStore::for_app` prend le chemin de `app_config_dir` par le trait `Manager` de Tauri, jamais d'une chaîne assemblée à la main ; les tests passent par `in_directory` et tournent donc sans application Tauri.

`load` ne renvoie pas de `Result` mais un `Loaded` qui porte toujours une configuration utilisable, plus la raison quand il y en a une, pour que l'échec remonte à l'interface au lieu d'être avalé. Trois cas. Aucun fichier, c'est le premier lancement, donc les défauts et aucun échec, et rien n'est créé au passage. Fichier illisible au parsing, tronqué ou étranger : les défauts, l'échec, et l'ancien fichier est renommé en `config.invalid-<secondes>.json` au lieu d'être écrasé, sur un nom toujours libre, parce que réécrire par-dessus en silence effacerait un roster saisi à la main. Fichier qu'on ne peut pas lire du tout, une permission refusée par exemple : l'échec remonte et rien n'est déplacé, les octets sont peut-être bons.

`save` écrit dans un fichier voisin, appelle `sync_all`, puis renomme par-dessus la cible. Le renommage est l'étape atomique sur les deux systèmes, donc une coupure laisse l'ancienne configuration entière ou la nouvelle, jamais un fichier vide. Le répertoire est créé au passage, `app_config_dir` le nomme sans le créer.

Un champ absent du fichier prend son défaut et un champ inconnu est ignoré, donc une configuration écrite par une version ultérieure s'ouvre quand même et une nouvelle option n'invalide le fichier de personne. Les quatre raccourcis sont du texte au format du plugin de l'étape 7, jamais interprété ici, avec `null` pour un raccourci effacé et une chaîne vide refusée à la lecture. Les valeurs proposées au premier lancement sont `Control+Shift+flèche` et non `Control+flèche`, que macOS réserve à Mission Control et aux bureaux. Les sept interrupteurs sont à l'état passant par défaut.

Cette étape stocke et ne branche pas : `run()` dans `lib.rs` est intact, donc rien n'appelle encore `save`. Le branchement vient avec l'interface à l'étape 6.

---

## Étape 6 — Interface React ✅

**Objectif.** Un tableau de bord que l'on consulte, pas un panneau de réglages que l'on visite.

Quatre écrans. **Personnages** : la liste, avec l'état connecté ou non, la bascule de veille, l'assignation du sexe, le drag and drop du défilement, les deux boutons d'action groupée, et la suppression au survol pour les personnages non connectés. **Raccourcis** : capture des quatre combinaisons. **AutoFocus** : les sept interrupteurs globaux. **À propos** : version, mentions légales Ankama, réinitialisation.

Un journal repliable, masqué par défaut, indispensable le jour où l'AutoFocus ne se déclenche pas.

C'est aussi ici que `src-tauri/tauri.conf.json` doit être repris : il est resté aux valeurs du scaffolder. Titre de la fenêtre, dimensions, taille minimale, comportement à la fermeture.

Les chaînes d'interface sont en français et centralisées dans un seul fichier, le code et les commentaires sont en anglais.

Faite. Le branchement vit dans `src-tauri/src/app`, quatrième module à côté de `domain`, `platform` et `config` : c'est le seul qui connaisse Tauri et l'interface, et il ne porte aucune logique métier. `setup` charge la configuration, la met dans l'état Tauri avec le `WindowManager` et le `NotificationWatcher`, et démarre le balayage.

Ce qui a été décidé en l'écrivant.

**Une seule forme traverse le pont.** Chaque commande renvoie le `Snapshot` entier, et le balayage pousse le même sur un unique événement. Le tableau de bord fait une poignée de personnages et onze réglages : tout renvoyer ne coûte rien et supprime la classe de bugs où deux panneaux ne sont pas d'accord sur ce qui est écrit sur le disque. Presque aucune commande ne renvoie de `Result` : une écriture qui échoue, un système qui refuse, ça part au journal et dans le snapshot, pas dans un second canal parallèle en anglais. La version du bundle y voyage aussi, plutôt que par `getVersion` du plugin : une constante que l'écran À propos imprime ne vaut pas un second canal et un second état de chargement côté interface.

**Le journal transporte des événements structurés, jamais des phrases.** Écrire du français dans un module dont la langue est l'anglais aurait éparpillé les chaînes d'interface sur deux langues et deux dépôts. `JournalEvent` porte les faits, `src/lib/strings.ts` porte les mots, et c'est le seul fichier du projet qui en contient.

**Le balayage interroge toutes les 3 secondes.** Aucun des deux systèmes n'émet d'événement quand un client ouvre ou ferme une fenêtre, donc le choix est entre demander régulièrement et ne pas savoir. C'est le prix des lampes justes, et de l'étape 7 qui aura une fenêtre fraîche à viser que la fenêtre soit ouverte ou non.

**Une règle protège le mutex.** Ne jamais tenir le verrou de l'état en touchant au watcher : son `stop` joint le thread qui exécute le sink, et le sink prend ce verrou. C'est le seul interblocage que cette application sache construire, et ne pas tenir les deux à la fois suffit à le rendre impossible. Pour la même raison le sink n'appelle pas `dismiss`, qui ne fait rien sur macOS de toute façon ; l'étape 9 le branchera là où c'est sûr.

**Les actions groupées portent leurs deux verbes en permanence.** Un bouton par sexe dont le verbe bascule avec l'état du groupe lit l'agrégat, ce que l'ADR 0004 interdit, et casse sur le cas qu'elle décrit : quatre hommes endormis, on en réveille un depuis sa ligne, le bouton repasse à « Endormir » et plus aucun clic ne réveille les trois autres. La bande au-dessus du roster offre donc « Endormir » et « Réveiller » pour chaque sexe, avec des libellés qui ne bougent jamais.

**L'interrupteur de chaque ligne coche le défilement, pas la veille.** Coché veut dire dans le défilement, ce qui va avec la lampe ocre et avec le libellé visible en dessous. Son étiquette accessible nomme donc le défilement ; l'appeler « Veille de X » disait le contraire de ce qu'il affichait.

**La veille survit à une reconnexion.** L'ADR 0004 la remet à zéro à chaque lancement et ne dit rien d'une fenêtre qui revient. Une première version réveillait les personnages qui repassaient connectés ; c'était un ajout silencieux, et avec un balayage toutes les 3 secondes un seul passage qui rate une fenêtre suffisait à remettre dans le défilement une mule mise de côté exprès. La ligne affiche « En veille » en toutes lettres, donc rien n'est caché de toute façon.

**L'autorisation est un tri-état côté Rust,** `Option<bool>`, pour que la première réponse atteigne le journal même quand c'est celle sur laquelle le champ serait parti. Un refus au lancement est justement l'état qu'il faut expliquer.

**Fermer la fenêtre quitte l'application, pour l'instant.** perimetre.md veut le contraire, mais l'icône de barre système qui permet de la rouvrir n'arrive qu'à l'étape 8. Une fenêtre cachée sans moyen de revenir est une application perdue. Le `tauri.conf.json` reste donc sur le comportement par défaut, et l'étape 8 le bascule au moment même où elle pose l'icône. Le reste est repris : 880×660, minimum 720×520, centrée, `backgroundColor` sombre pour éviter le flash blanc au lancement.

**L'écran d'autorisation ne remplace que les Personnages.** Les raccourcis, les interrupteurs et l'À propos fonctionnent sans autorisation, et rien ne justifie d'enfermer quelqu'un pendant que macOS réfléchit. Cet écran tient dans la durée, il ne clignote pas, et il disparaît tout seul au balayage qui trouve l'autorisation accordée. Un bouton ouvre directement le volet de Réglages Système, puisque le dialogue du système ne le propose qu'une fois.

**La capture de raccourci produit des `KeyboardEvent.code`,** que le parseur de `global-hotkey` accepte tels quels, et exige au moins un modificateur : enregistrer une touche nue l'avalerait dans toutes les applications du bureau. Une touche que le parseur ne connaît pas est refusée à la capture, pas à l'enregistrement, où il serait trop tard pour le dire gentiment. Les valeurs par défaut de l'étape 5 utilisent les alias courts (`Right`), l'affichage résout les deux graphies.

**Deux ajouts hors interface.** `Roster::reorder` est entré dans `domain` avec ses tests : l'ordre du défilement est de la logique métier, et le mettre dans la couche Tauri aurait contredit l'architecture du projet. Et `oxlint.config.ts` désactive `prefer-readonly-parameter-types` sur la couche React seulement : `ReactNode`, un événement synthétique et une `Promise` ne sont pas readonly, et aucun `Readonly<>` n'y change rien. La règle reste active sur `src/lib`, qui est de la donnée pure et l'honore.

**L'AutoFocus est branché de bout en bout et toujours pas prouvé.** Une notification de jeu est classée, confrontée aux sept interrupteurs, rapprochée du roster, et la fenêtre est demandée au premier plan, chaque étape passant au journal. Le `focus` est appelé depuis le thread du watcher, comme le contrat de l'étape 3 l'autorise. Si la vérification montre que l'activation AppKit exige le thread principal, c'est l'étape 4 qu'il faudra corriger, pas la contourner ici.

---

## Étape 7 — Raccourcis globaux ✅ écrite, non vérifiée

**Objectif.** Les quatre raccourcis de [perimetre.md](./perimetre.md) fonctionnent depuis le jeu.

Utiliser `tauri-plugin-global-shortcut`. Chaque raccourci reste inerte tant qu'une fenêtre Dofus n'est pas au premier plan.

**Piège à ne pas reproduire.** Dracoon retire tous ses raccourcis puis les réenregistre à chaque modification, dans un `try` dont l'exception est avalée. Une combinaison invalide laisse donc l'utilisateur sans aucun raccourci et sans aucun message. Il faut valider avant d'appliquer, et remonter l'échec à l'écran.

Écrite, dans `src-tauri/src/app/shortcuts.rs`, cinquième fichier de la couche de branchement. `apply` pose les combinaisons, une fois au démarrage et une fois à chaque modification ; le travail, quand l'une d'elles est frappée, se fait ailleurs.

**Pas vérifiée**, au même titre que l'étape 4 et pour la même raison. Aucune des quatre combinaisons n'a jamais été frappée depuis un client Dofus. « Suivant » et « Précédent » finissent dans `PlatformWindowManager::focus`, l'activation de processus que l'étape 4 liste toujours comme non prouvée ; si elle ne marche pas, ces deux raccourcis ne marchent pas non plus. La vérification à faire : deux clients ouverts, les quatre combinaisons frappées depuis le jeu, et le journal qui dit ce qui s'est passé à chaque fois.

Ce qui a été décidé en l'écrivant.

**Chaque échec coûte une action et une seule.** Les quatre sont bien retirées puis reposées, mais chaque pose est tentée séparément et sa réponse voyage dans le snapshot. `ShortcutStatus` dit posé, illisible, déjà pris par une autre action, ou refusé par le système. L'écran affiche cette réponse sous chaque champ, la phrase `notWired` a disparu, et le journal garde le texte brut du système à côté. Une combinaison impossible ne peut donc plus emporter les trois autres en silence, ce qui est tout le piège ci-dessus.

**Ce que le système accepte n'est pas ce qui se déclenchera.** Vérifié dans le code de `global-hotkey` plutôt que supposé : sur macOS, Carbon ne refuse qu'un doublon du même processus, donc une combinaison qu'une autre application ou le bureau tient déjà s'enregistre proprement et n'est jamais délivrée. Windows est le franc des deux, `RegisterHotKey` échoue avec `ERROR_HOTKEY_ALREADY_REGISTERED`. `Registered` veut donc dire « le système l'a prise » et jamais « elle marchera » ; l'écran le dit en toutes lettres et renvoie au journal, où un événement est écrit à chaque appui.

**Deux actions sur la même combinaison, le système ne sait pas le tenir.** Il indexe un raccourci sur les touches seules, donc la seconde pose remplacerait la première dans la table du plugin. La détection est passée côté Rust, seul endroit qui sache ce qui a réellement été posé, et l'ancienne détection côté React a été retirée pour ne pas laisser deux sources se contredire.

**Rien ne se passe sur le fil qui appelle.** Le plugin délivre ses événements en ligne, sur le fil de la boucle Carbon, c'est-à-dire le fil principal, celui de la fenêtre. Le rappel se contente donc de poser l'action sur une file, et un fil nommé `multifus-shortcuts` la dépile. Un fil et pas un par frappe, pour que deux appuis soient traités dans l'ordre où ils ont été faits.

**La garde « inerte hors du jeu » ne coûte rien, sauf quand elle coûte tout.** Mesurée contre un vrai client Dofus Retro, hors de l'application et en lecture seule : trois cents lectures de `AXMainWindow` puis `AXTitle` sur le processus du client, médiane 0,05 ms, maximum 0,16 ms. Le harnais était jetable et n'est pas dans le dépôt, la mesure se refait en quelques lignes contre un client ouvert. Le problème n'est donc pas la moyenne mais la queue, un client qui ne répond plus bloquant l'appel jusqu'au délai de messagerie de l'Accessibilité. Payer ça sur le fil principal gèlerait la fenêtre, et le fil de travail rend la question sans objet. C'est aussi la raison pour laquelle `foreground_game_window` rend la fenêtre : un seul appel décide de la garde et nomme le personnage.

**L'appui et le relâchement passent par le même rappel.** Sans le filtre sur `Pressed`, chaque action serait jouée deux fois.

**Un ordre, une seule source.** `Shortcuts::all()` a été retiré de l'étape 5 : il encodait l'ordre des quatre actions une deuxième fois à côté de `ShortcutAction::ALL`, et le premier appelant qui en avait besoin est justement celui à qui il faut l'action et pas seulement la combinaison.

**Le vocabulaire du parseur, vérifié touche par touche.** Toutes les touches acceptées à la capture sont bien celles que `global-hotkey` sait lire, alias courts compris. Mais `Pause`, `ScrollLock` et `F21` à `F24` n'ont pas de code de touche sur macOS : elles passent le parseur et échouent à la pose. C'est exactement ce que `ShortcutStatus::Refused` existe pour montrer, elles restent donc offertes à la capture.

**Ce qui n'a pas été ajouté.** La veille et la bascule ne touchent pas au premier plan. perimetre.md décrit leur effet et n'en demande pas plus, donc après une bascule on reste sur un personnage endormi et c'est « Suivant » qui en sort. À rouvrir si l'usage dit le contraire, pas avant.

---

## Étape 8 — Barre système et démarrage automatique

**Objectif.** L'application se lance et s'oublie.

Une icône de barre système avec un menu listant les personnages et leur état de veille, cliquables. Fermer la fenêtre ne quitte pas l'application, on quitte par le menu de l'icône. Le démarrage à l'ouverture de session est une option via `tauri-plugin-autostart`, **décochée par défaut**.

---

## Étape 9 — Implémentation Windows

**Objectif.** La parité, sur la machine où l'application sert vraiment.

Prérequis sur la machine Windows : Microsoft C++ Build Tools avec la charge « Développement Desktop en C++ », puis `rustup default stable-msvc`. WebView2 est déjà présent sur un Windows 10 à jour.

Utiliser la crate `windows`, qui couvre WinRT nativement. `UserNotificationListener` pour l'écoute, `EnumWindows` et `GetWindowText` pour l'énumération. Implémenter aussi la suppression des toasts au focus, possible ici et impossible sur macOS.

**Piège à ne pas reproduire.** Dracoon contourne la restriction de `SetForegroundWindow` en injectant une vraie frappe Alt dans l'application active. C'est la cause probable du bug de focus intermittent corrigé dans son commit `0b0525c`, et ça envoie une touche parasite dans le jeu. Passer par `AttachThreadInput`.

---

## Étape 10 — Intégration continue et distribution

**Objectif.** Produire les binaires sans jamais installer de chaîne de build sur le PC de jeu.

Un workflow GitHub Actions basé sur `tauri-action`, déclenché sur tag, qui compile pour macOS et Windows et publie une release. C'est la voie retenue plutôt que de compiler à la main.

---

## Pièges connus

**TypeScript 7 a supprimé `baseUrl`.** Les `paths` du `tsconfig.json` se résolvent désormais relativement au fichier lui-même. Ne pas réintroduire `baseUrl`, le build casse.

**shadcn 4.16 repose sur Base UI, pas sur Radix.** Les API de composants diffèrent de la plupart des tutoriels shadcn en circulation.

**L'AutoFocus macOS dépend de l'affichage des bannières.** Si l'utilisateur les désactive pour Dofus dans les réglages système, l'écoute cesse de fonctionner. Le README de Dracoon recommande justement de les désactiver sur Windows, où l'écoute passe par l'API et non par l'affichage. Cette asymétrie doit être expliquée dans l'interface.

**Sur macOS, une combinaison déjà prise s'enregistre sans erreur et ne se déclenche jamais.** Carbon ne refuse qu'un doublon du même processus, donc ni le bureau ni une autre application ne provoquent d'échec à la pose. Aucune API ne permet de le savoir à l'avance. Ne pas chercher à faire dire au plugin ce qu'il ne sait pas : la seule preuve est un appui depuis le jeu et la ligne que le journal écrit.

**Un client Dofus sur l'écran de connexion existe déjà en tant que processus** avec des fenêtres, mais sans titre exploitable. Toujours filtrer sur le titre.

**L'autorisation d'Accessibilité se donne à un binaire, pas à un projet.** Le `target/debug/multifus` de `tauri dev` et l'application empaquetée sont deux entrées distinctes dans Réglages Système, et un `cargo build` qui remplace le binaire peut faire perdre la confiance accordée à la version de développement. Vérifier l'étape 4 sur l'application empaquetée, ou réaccorder l'autorisation quand elle disparaît sans raison apparente.

**`cargo check --target x86_64-pc-windows-msvc` échoue depuis macOS**, avant même de compiler une ligne du projet : le build script de Tauri réclame `llvm-rc`, absent de la machine de développement. C'est antérieur au projet, constaté sur un dépôt neuf, ne pas partir chasser ça dans le code. La compilation Windows est le sujet de l'étape 10, par GitHub Actions et sans chaîne de build sur le PC de jeu.
