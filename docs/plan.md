# Plan de développement

Ce document dit où en est multifus et ce qui vient ensuite. Rien d'autre.

Le vocabulaire est dans [CONTEXT.md](../CONTEXT.md), ce que le projet refuse de faire dans [perimetre.md](./perimetre.md), les décisions structurantes dans [adr](./adr). Le pourquoi des choix d'implémentation vit dans les commentaires de module du code, au contact de ce qu'il explique et là où il se périme le moins vite. Ce document ne le recopie pas.

---

## Où on en est

Les étapes 0 à 8 et l'étape 10 sont écrites, les sept premières sont vérifiées. Leurs numéros restent des étiquettes, le code y renvoie.

| #   | Étape                       | Où                                 | État                          |
| --- | --------------------------- | ---------------------------------- | ----------------------------- |
| 0-1 | Bootstrap et outillage      | `package.json`, `oxlint.config.ts` | fait                          |
| 2   | Cœur métier pur             | `src-tauri/src/domain`             | fait, testé                   |
| 3   | Frontière avec le système   | `src-tauri/src/platform`           | fait                          |
| 4   | Implémentation macOS        | `platform::macos`                  | **vérifiée sur deux clients** |
| 5   | Persistance                 | `src-tauri/src/config`             | fait, testé                   |
| 6   | Interface React             | `src`, `src-tauri/src/app`         | faite, AutoFocus prouvé       |
| 7   | Raccourcis globaux          | `app::shortcuts`                   | **vérifiés depuis le jeu**    |
| 8   | Barre système et session    | `app::tray`, `app::autostart`      | écrite, à vérifier            |
| 10  | Distribution et mise à jour | `.github/workflows`, `app::update` | écrite, à vérifier            |

Les versions font foi dans `package.json`, `tauri.conf.json` et `Cargo.toml`, nulle part ailleurs. `standard-version` les déplace ensemble, et le workflow de release refuse un tag qui ne dirait pas la même chose qu'elles.

**L'activation de processus fonctionne.** C'était le fil auquel tenaient l'AutoFocus et les deux raccourcis de défilement, et il tient. Sur l'application empaquetée, avec deux clients Retro connectés, le journal a écrit : Suivant alternant dix-huit fois entre les deux personnages, Précédent remontant, la Veille agissant sur celui de devant, et l'AutoFocus ramenant la bonne fenêtre sur trois types de notification distincts, échange, défi et combat. La garde tient aussi, un Suivant frappé sans fenêtre Dofus devant écrit « ignoré » et ne fait rien.

Ce qui avait été confronté à un vrai client Retro avant cela, hors de l'application et en lecture seule : le bundle est bien `com.dofus.d1elauncher`, le titre de la fenêtre principale est bien `Pseudo - Dofus Retro v1.48.21` et la regex le reconnaît, et lire `AXMainWindow` puis `AXTitle` coûte 0,05 ms en médiane.

Plus rien de macOS n'est en l'air, sauf ce que les étapes 8 et 10 viennent d'ajouter et qui n'a pas encore tourné.

Le journal se copie depuis son en-tête, puisque c'est ce qu'on en fait : on le relit ailleurs. Il part en texte brut, une ligne par entrée, l'heure devant. L'écriture passe par `tauri-plugin-clipboard-manager` et non par `navigator.clipboard`, la fenêtre étant servie par un protocole propre à Tauri. Ce plugin n'accorde rien par défaut, sa permission `default` est vide par conception : la capacité déclare `clipboard-manager:allow-write-text` et rien d'autre, multifus ne lisant jamais le presse-papiers.

---

## La suite, dans l'ordre

L'ordre ci-dessous n'est pas celui des numéros : la distribution est passée avant Windows, pour que macOS soit fini d'un bloc et que la session Windows trouve la chaîne de compilation déjà posée, à laquelle il ne restera qu'à ajouter un runner.

### Étape 8 — Barre système et démarrage automatique

**Écrite, pas encore vérifiée.** L'icône est dans `app::tray`, le démarrage dans `app::autostart`, et le réglage est une ligne de l'écran À propos.

Le menu ne liste que les personnages **connectés**, dans l'ordre du défilement, avec `(en veille)` sur ceux qui sont hors du cycle. Un clic ramène la fenêtre au premier plan. Un personnage hors ligne n'y figure pas : une barre système est un endroit d'où l'on saute, et une ligne qui ne peut rien faire n'y a pas sa place.

**Un interrupteur maître pour l'AutoFocus.** `AutoFocus::enabled` s'ajoute aux sept types plutôt que de les éteindre ensemble : les couper tous oublierait lesquels l'utilisateur avait choisis, et les rallumer lui en rendrait sept. `is_enabled(kind)` demande donc les deux, `is_kind_enabled(kind)` ne demande que la ligne, et c'est cette seconde question que l'écran dessine. Une case dans le menu de la barre système le porte, l'écran AutoFocus aussi, sans quoi couper depuis la barre laisserait sept interrupteurs allumés qui ne font rien.

**Un verbe sur tout ce qui bascule.** L'AutoFocus, seul réglage du menu, dit « Activer » ou « Désactiver » plutôt que de porter une coche. Un nom coché, posé au-dessus des quatre noms d'écrans, se lisait comme un cinquième : « AutoFocus » ressemblait à un endroit où aller, pas à un interrupteur. Une ligne qui commence par un verbe ne peut être qu'une action, et le verbe dit dans quel sens elle ira. Règle pour la suite : dans ce menu, tout ce qui bascule porte un verbe.

**Les quatre écrans, et pas « Ouvrir ».** Ouvrir la fenêtre n'est jamais ce qu'on veut, aller sur un de ses écrans l'est. Le menu les offre donc directement, et le rail se retrouve à un clic au lieu de trois. Ça passe par un second événement, `multifus://navigate`, séparé du snapshot : l'écran affiché n'est pas un état que multifus garde mais une demande faite une fois, et le mettre dans le snapshot ramènerait la fenêtre sur cet écran à chaque tour du balayage.

**Ce que le menu porte, et ce qu'il ne porte pas.** Autorisation manquante puis « Ouvrir Réglages Système » en tête quand le système refuse, parce que le sens de cette icône est justement de ne pas avoir à ouvrir la fenêtre pour apprendre que multifus est sourd. Puis les personnages, puis l'AutoFocus. Le démarrage avec la session n'y est pas : il se règle une fois pour toutes et n'a rien à faire dans un menu qu'on ouvre en jouant. Pas d'équivalent clavier affiché : dans un menu de barre système, un accélérateur ne se déclenche que si l'application est active, et multifus ne l'est jamais. En afficher promettrait des touches mortes.

**Une seule porte de sortie, `runtime::emit_snapshot`.** Une commande qui construisait sa réponse elle-même répondait à l'interface sans prévenir la barre système, et le menu ignorait alors tout ce qui venait de la fenêtre : une veille basculée, un roster réordonné, un personnage retiré. Toutes les commandes passent donc par cette fonction, qui rend le snapshot en plus de l'envoyer. Pour que ce soit tenable sans réfléchir, `tray::refresh` est **idempotent** : il compare les lignes à celles qui sont affichées et ne reconstruit rien quand elles n'ont pas bougé, ce qui rend gratuit l'appel sur un changement de raccourci ou d'AutoFocus.

Fermer la fenêtre ne quitte plus, on quitte par le menu. Ce n'est **pas** un réglage de `tauri.conf.json`, aucune clé du schéma v2 ne fait ça : c'est `WindowEvent::CloseRequested` avec `prevent_close` puis `hide`, et rien d'autre. La fermeture n'est interceptée que si l'icône est bien là, sinon une fenêtre fermée laisserait un processus sans retour possible.

Et surtout, **rien n'intercepte la sortie**. `RunEvent::ExitRequested` avec `prevent_exit` est le motif que tout le monde recopie, il n'a pas sa place ici : la fenêtre n'étant jamais détruite mais seulement masquée, la sortie « dernière fenêtre fermée » ne se produit pas, et la prévenir quand même retirerait `Cmd+Q` à un utilisateur macOS pour rien.

**Repoussé, décidé sur mesure.** `NSApplicationActivationPolicy.Accessory`, qui sortirait multifus du dock. La question ouverte est de savoir si une application accessoire garde le droit d'activer un autre processus, dont dépendent l'AutoFocus et les deux raccourcis de défilement. On ne sait pas non plus laquelle des deux portes de `AccessibilityWindowManager::focus` travaille aujourd'hui, `activateWithOptions` ou le repli `AXFrontmost`, le journal écrivant `Focused` dans les deux cas. Poser la porte au journal d'abord, mesurer, puis décider.

**Le logo.** `src-tauri/icons` porte encore celui du scaffolder Tauri, et `icons/tray.png` est un glyphe provisoire. `npm run tauri icon <fichier>` régénère les onze fichiers depuis un PNG carré à transparence, et ne touche pas à `tray.png`, qui obéit à d'autres règles : voir plus bas.

**Vérification.** Une journée de jeu sans jamais ouvrir la fenêtre.

### Étape 10 — Distribution et mise à jour

**Écrite, pas encore vérifiée. macOS seulement, Apple Silicon seulement.** Windows n'est pas abandonné, il attend que macOS soit fini pour démarrer d'un bloc : il rejoint ces workflows à l'étape 9, en ajoutant un runner `windows-latest` aux deux endroits qui sont aujourd'hui des jobs uniques. En attendant, un `ci` vert ne dit toujours rien de `platform::windows`, et rien de ce qui a été ajouté ici n'est propre à macOS.

Trois fichiers pour deux portes. `checks` porte les six commandes de la porte du projet et n'est déclenché par personne : il est appelé. `ci` l'appelle sur chaque poussée et chaque pull request, `release` l'appelle avant de signer quoi que ce soit. Une seule définition de « le code est en ordre », dans un seul fichier, et les deux portes passent par elle. Recopiée dans les deux, elle divergerait, et la copie qui divergerait serait celle qui garde la release.

`release` se déclenche sur un tag `v*`, compile, signe, notarise, et dépose le tout dans une release **en brouillon**.

**Le brouillon n'est pas de la prudence, c'est le mécanisme.** L'endpoint que l'updater interroge est `releases/latest/download/latest.json` : publier la release est donc l'acte qui annonce la version à tous les multifus installés. Ça doit rester une décision, pas l'effet de bord d'un `git push --tags`.

**La signature est le vrai sujet, et elle a son ADR.** Une signature ad hoc change à chaque compilation, TCC n'y reconnaît pas la même application et l'autorisation d'Accessibilité tombe à chaque version. Un certificat Developer ID donne une identité stable et l'autorisation survit. Voir [ADR 0005](./adr/0005-signature-developer-id-plutot-qu-ad-hoc.md), qui dit aussi pourquoi ça ne change rien en développement.

**Une seule version, cinq fichiers.** `standard-version` porte le numéro dans `package.json`, `package-lock.json`, `tauri.conf.json`, `Cargo.toml` et `Cargo.lock`, les deux derniers par `scripts/cargo-version.cjs`. Le workflow refuse ensuite de compiler si le tag et `tauri.conf.json` ne disent pas la même chose : deux versions qui divergent publieraient une mise à jour que personne ne se verrait jamais proposer, sans un mot.

**La mise à jour se propose, elle ne s'impose pas.** `app::update` demande une fois au démarrage, jamais en boucle, et l'écran À propos redemande à la main. Ce qu'il trouve voyage dans le snapshot, comme le reste, donc la barre système et la fenêtre disent la même chose sans que ni l'une ni l'autre ait à demander. Installer remplace le paquet et relance multifus, ce qui en pleine soirée coûte tous les clients d'un coup : c'est un clic, jamais un automatisme.

Rien de l'updater n'est exposé au webview. Pas de permission `updater:` dans la capacité, pas de paquet npm : la vérification et l'installation sont deux commandes de multifus, et React lit un état plutôt que d'appeler un plugin.

**Ce qui reste à faire à la main, et que le dépôt ne peut pas porter.**

| À faire                                                                  | Où                  |
| ------------------------------------------------------------------------ | ------------------- |
| Créer un certificat **Developer ID Application** et l'exporter en `.p12` | developer.apple.com |
| Poser les huit secrets du workflow `release`                             | Réglages du dépôt   |
| Remplacer le logo du scaffolder Tauri                                    | `src-tauri/icons`   |

Les huit secrets : `APPLE_CERTIFICATE` (le `.p12` en base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (un mot de passe d'application, pas celui du compte), `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY` (le contenu de la clé générée par `npm run tauri signer generate`) et `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, vide ici.

**Vérification.** Un tag sur une version d'essai, le brouillon relu, le DMG téléchargé depuis un autre compte pour que la quarantaine s'applique vraiment, puis une seconde version pour voir si l'autorisation d'Accessibilité tient et si la fenêtre propose la mise à jour.

### Étape 9 — Implémentation Windows

**Objectif.** La parité, sur la machine où l'application sert vraiment.

Session à ouvrir sur le PC Windows, dépôt cloné. Prérequis : Microsoft C++ Build Tools avec la charge « Développement Desktop en C++ », puis `rustup default stable-msvc`. WebView2 est déjà présent sur un Windows 10 à jour.

Utiliser la crate `windows`, qui couvre WinRT nativement. `UserNotificationListener` pour l'écoute, `EnumWindows` et `GetWindowText` pour l'énumération. Implémenter aussi la suppression des toasts au focus, possible ici et impossible sur macOS.

**Piège à ne pas reproduire.** Dracoon contourne la restriction de `SetForegroundWindow` en injectant une vraie frappe Alt dans l'application active. C'est la cause probable du bug de focus intermittent corrigé dans son commit `0b0525c`, et ça envoie une touche parasite dans le jeu. Passer par `AttachThreadInput`.

Ce qui attend déjà de ce côté : `platform::windows` compile en renvoyant `NotImplemented` méthode par méthode, la regex et la table `NOTIF_TYPES` sont dans `domain` et ne sont pas à réécrire, et les raccourcis globaux échouent franchement sur cette plateforme quand une combinaison est déjà prise, contrairement à macOS.

---

## Ce qui mord

**L'autorisation d'Accessibilité se donne à une identité de code, pas à un projet.** Le `target/debug/multifus` de `tauri dev` et l'application empaquetée sont deux choses distinctes, et en développement c'est le terminal qui porte l'autorisation, jamais multifus. Sur le paquet, une signature ad hoc change à chaque compilation et l'entrée reste cochée à l'écran sans plus s'appliquer. C'est ce que l'étape 10 répare, et le raisonnement complet est dans [ADR 0005](./adr/0005-signature-developer-id-plutot-qu-ad-hoc.md). Quand l'autorisation disparaît sans raison apparente, `tccutil reset Accessibility com.viclafouch.multifus` puis réaccorder.

**Une notarisation à moitié configurée ne fait pas échouer la compilation.** Lu dans `tauri-bundler`, `crates/tauri-bundler/src/bundle/macos/app.rs` : seul un identifiant d'équipe manquant est une erreur franche, tout le reste ne produit qu'un avertissement et la compilation continue. Un secret mal recopié sort donc un paquet signé mais non notarisé, qui s'installe très bien sur la machine qui l'a construit et se fait refuser partout ailleurs. Le seul contrôle qui vaille est de télécharger le DMG depuis une autre machine, ou au moins depuis un autre compte, pour que la quarantaine s'applique vraiment.

**Une release en brouillon n'annonce rien, et c'est une réponse et non une panne.** L'updater interroge `releases/latest/download/latest.json`, et GitHub ne considère pas un brouillon comme la dernière release : le fichier répond donc 404 tant que rien n'est publié. Or le plugin ne distingue pas ce cas dans son type de retour, il rend `Error::ReleaseNotFound`. Laissé tel quel, ça affichait « la mise à jour n'a pas abouti » à chaque démarrage, en anglais dans une interface française, avec une ligne d'avertissement au journal à chaque fois. `app::update` traite donc cette variante-là comme « à jour », et elle seule : un réseau qui tombe rend `Reqwest` ou `Network` et reste un échec. Lu dans `plugins/updater/src/updater.rs`, où une réponse non 2xx ne renseigne pas `last_error` et sort par `ok_or(Error::ReleaseNotFound)`.

**Sur macOS, une combinaison déjà prise s'enregistre sans erreur et ne se déclenche jamais.** Carbon ne refuse qu'un doublon du même processus, donc ni le bureau ni une autre application ne provoquent d'échec à la pose, et aucune API ne permet de le savoir à l'avance. Ne pas chercher à faire dire au plugin ce qu'il ne sait pas : la seule preuve est un appui depuis le jeu et la ligne que le journal écrit. Windows, lui, refuse franchement.

**`Control+flèche` appartient à macOS**, Mission Control et le passage entre bureaux. Les combinaisons proposées au premier lancement sont donc `Control+Shift+flèche`. Et `Pause`, `ScrollLock` et `F21` à `F24` passent le parseur du plugin mais n'ont pas de code de touche sur macOS : elles échouent à la pose, ce que l'écran affiche.

**Ne jamais tenir le verrou de `Multifus` en touchant au watcher de notifications, au plugin de raccourcis ou à l'icône de barre système.** Le premier joint le thread qui exécute le sink, les deux autres attendent le fil principal où les commandes prennent ce verrou. Pour l'icône ce n'est pas une supposition : `TrayIcon::set_menu` passe par `run_item_main_thread!`, qui poste la tâche puis bloque sur `rx.recv()` sans délai (`tauri/src/menu/mod.rs`). C'est le seul interblocage que cette application sache construire, et la règle est écrite en tête de `app::state` et de `app::tray`.

**Le démarrage automatique enregistre un chemin, et personne ne s'en aperçoit.** `tauri-plugin-autostart` écrit `~/Library/LaunchAgents/<nom>.plist` avec le chemin absolu du binaire ; l'application déplacée, `launchd` échoue en silence. Et `is_enabled()` ne fait que vérifier l'existence du fichier, sans jamais comparer le chemin qu'il contient, donc il répondrait « oui » sur un enregistrement mort. D'où la règle : la configuration porte l'intention, `app::autostart::reconcile` réécrit l'enregistrement à chaque lancement, et une application déplacée se répare à sa première ouverture manuelle. Même raison pour macOS 13 et plus, où l'utilisateur peut couper l'entrée depuis Réglages Système sans que le plist bouge.

**L'image de barre système n'est pas le logo.** `tray-icon` fixe la hauteur de la `NSImage` à 18 points et déduit la largeur du rapport. Donc `icons/tray.png` est un PNG **RVBA 36 × 36**, noir pur, forme portée par le seul canal alpha, fond transparent, posé avec `icon_as_template(true)` pour que macOS le recolore selon la barre. Un logo en couleur mis là ressort gris et illisible. `tauri::include_image!` décode à la compilation et **refuse un PNG qui n'est pas en RVBA**.

**L'AutoFocus macOS dépend de l'affichage des bannières, et la livraison sans affichage a été essayée.** Décocher « Bureau » en gardant « Centre de notifications » ne donne rien du tout : macOS ne construit aucun élément tant que le panneau reste fermé, donc l'observateur n'a rien à lire. Mesuré sur un combat, un défi et un échange, journal vide et aucune fenêtre ramenée. Ne pas rouvrir cette piste, elle est dans ADR 0002. Le réglage le moins gênant qui marche est bannière sur le Bureau, style temporaire, son coupé, aperçus par défaut. Sur Windows c'est l'inverse, l'écoute passe par une API et les bannières peuvent rester coupées.

**Un client Dofus sur l'écran de connexion existe déjà en tant que processus** avec des fenêtres, mais sans titre exploitable. Toujours filtrer sur le titre, jamais sur la taille.

**`cargo check --target x86_64-pc-windows-msvc` échoue depuis macOS**, avant même de compiler une ligne du projet : le build script de Tauri réclame `llvm-rc`, absent de la machine. C'est antérieur au projet, constaté sur un dépôt neuf, ne pas partir chasser ça dans le code.

**TypeScript 7 a supprimé `baseUrl`.** Les `paths` du `tsconfig.json` se résolvent relativement au fichier lui-même. Ne pas le réintroduire, le build casse.

**shadcn 4.16 repose sur Base UI, pas sur Radix.** Les API de composants diffèrent de la plupart des tutoriels shadcn en circulation.
