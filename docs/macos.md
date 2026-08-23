# macOS, ce qui est fait et ce qui mord

**Archive. Aucun travail n'attend dans ce document.** macOS est fini, vérifié
sur deux vrais clients et sur une soirée de relais, quart d'heure compris. Ce
qui suit est là pour être relu quand un comportement surprend, jamais pour être
repris. Le travail en cours est dans [plan.md](./plan.md), et il ne parle que de
Windows.

Trois choses restent à faire hors de ce document, et elles sont dans le plan :
le certificat Developer ID, les huit secrets du dépôt et le logo.

Le vocabulaire est dans [CONTEXT.md](../CONTEXT.md), ce que le projet refuse de
faire dans [perimetre.md](./perimetre.md), les décisions structurantes dans
[adr](./adr).

---

## Ce qui a été fait, étape par étape

| #   | Étape                       | Où                                           | État                                 |
| --- | --------------------------- | -------------------------------------------- | ------------------------------------ |
| 0-1 | Bootstrap et outillage      | `package.json`, `oxlint.config.ts`, `.husky` | fait                                 |
| 2   | Cœur métier pur             | `src-tauri/src/domain`                       | fait, testé                          |
| 3   | Frontière avec le système   | `src-tauri/src/platform`                     | fait                                 |
| 4   | Implémentation macOS        | `platform::macos`                            | **vérifiée sur deux clients**        |
| 5   | Persistance                 | `src-tauri/src/config`                       | fait, testé                          |
| 6   | Interface React             | `src`, `src-tauri/src/app`                   | faite, AutoFocus prouvé              |
| 7   | Raccourcis globaux          | `app::shortcuts`                             | **vérifiés depuis le jeu**           |
| 8   | Barre système et session    | `app::tray`, `app::autostart`                | **revient à l'ouverture de session** |
| 10  | Distribution et mise à jour | `.github/workflows`, `app::update`           | écrite, à vérifier                   |
| 11  | Relais Telegram             | `app::relay`, écran Relais                   | **vérifié, quart d'heure compris**   |
| 12  | Architecture de l'interface | `src`                                        | faite, 179 cas côté React            |

Les versions font foi dans `package.json`, `tauri.conf.json` et `Cargo.toml`,
nulle part ailleurs. `standard-version` les déplace ensemble, et le workflow de
release refuse un tag qui ne dirait pas la même chose qu'elles.

**L'activation de processus fonctionne.** C'était le fil auquel tenaient
l'AutoFocus et les deux raccourcis de défilement, et il tient. Sur l'application
empaquetée, avec deux clients Retro connectés, le journal a écrit : Suivant
alternant dix-huit fois entre les deux personnages, Précédent remontant, la
Veille agissant sur celui de devant, et l'AutoFocus ramenant la bonne fenêtre sur
trois types de notification distincts, échange, défi et combat.

Le bundle est bien `com.dofus.d1elauncher`, le titre de la fenêtre principale est
bien `Pseudo - Dofus Retro v1.48.21` et la regex le reconnaît, et lire
`AXMainWindow` puis `AXTitle` coûte 0,05 ms en médiane.

---

### Le journal

**Il vit sur le disque, et c'est [ADR 0006](./adr/0006-journal-sur-disque.md).** Il était en mémoire, plafonné à 200 entrées, et mourait avec le processus, ce qui fait quelques minutes de jeu actif. `tauri-plugin-log` écrit chaque entrée en JSON dans le dossier de logs du système, un plafond de 1 Mo par fichier et huit fichiers gardés. Les 200 entrées en mémoire restent : elles sont ce que le tiroir dessine et ce que chaque snapshot transporte.

**Aucun corps de notification n'y entre, sous aucune forme.** Seul le type déduit voyage. La règle est tenue par un test qui compare la liste exacte des champs de l'événement, pas par la mémoire de qui relit le code. Le raisonnement et ce que ça coûte sont dans l'ADR.

**Deux exports, à deux distances de la panne.** Le bouton copier emporte ce qui est en mémoire avec un en-tête qui le rend lisible seul : version, système, autorisation, raccourcis posés avec leur état, chemin de la configuration, période couverte. « Montrer le journal » ouvre le fichier, depuis la fenêtre et depuis la barre système. Il est dans le menu parce que la règle du projet le demande : la fenêtre qui ne revient pas est l'une des pannes que ce journal sait écrire, donc un journal accessible par la seule fenêtre est un journal des bons jours.

L'écriture dans le presse-papiers passe par `tauri-plugin-clipboard-manager` et non par `navigator.clipboard`, la fenêtre étant servie par un protocole propre à Tauri. Ce plugin n'accorde rien par défaut, sa permission `default` est vide par conception : la capacité déclare `clipboard-manager:allow-write-text` et rien d'autre, multifus ne lisant jamais le presse-papiers. Ni `log:` ni `os:` ne sont accordés : les deux nouveaux plugins ne servent que depuis Rust, et le journal n'est pas un canal où React écrit.

**Ce qui échouait en silence et qui écrit maintenant une ligne.** Les trois fils qui pouvaient mourir sans un mot, balayage, raccourcis et barre système, survivent à un panic et le disent. Les mutations du roster et les réglages, qui n'écrivaient rien, écrivent leur ligne avec la surface d'où le clic est venu pour les deux que le menu porte. Une bannière que le système refuse de laisser lire écrit `NotificationUnreadable`, là où elle ne produisait rien du tout et où un journal vide voulait dire deux choses opposées. Et une configuration illisible qui n'a pas pu être déplacée n'est plus confondue avec une configuration que personne n'avait à déplacer.

---

---

### Étape 8 — Barre système et démarrage automatique

**Le démarrage est vérifié sur l'application empaquetée**, dans `/Applications`, et sur une vraie ouverture de session : multifus revient de lui-même, avec `--from-session` et sans sa fenêtre, l'icône seule. Vérifiés aussi, sur ce même paquet : un lancement à la main qui ouvre la fenêtre, une fermeture qui la retire sans tuer le processus, et une réouverture qui la ramène sur ce même processus. Le reste attend la journée de jeu. L'icône est dans `app::tray`, le démarrage dans `app::autostart`, et le réglage est une ligne de l'écran À propos.

**Une ouverture de session n'ouvre pas la fenêtre.** Elle pose l'icône dans la barre système. Une application qu'on lance et qu'on oublie n'a pas à mettre un tableau de bord devant quelqu'un qui vient d'ouvrir sa session et qui ouvre ses clients. Un lancement à la main est l'inverse : double-cliquer une application, c'est demander à la voir, et rester muet là se lirait comme un lancement raté. Ce qui sépare les deux est l'argument `--from-session`, que le lanceur porte dans son enregistrement et que multifus relit dans les siens. Le Dock, lui, est toujours là : `Accessory` reste repoussé, voir plus bas.

Une condition s'ajoute à l'argument, et c'est la même que pour la fermeture : **sans icône dans la barre système, la fenêtre s'ouvre quand même**. Sinon une ouverture de session dont l'icône a échoué laisserait un processus sans fenêtre, sans menu et sans retour possible, ce que le reste de l'étape refuse déjà.

**Le clic sur l'icône du Dock ramène la fenêtre.** Rien ne répondait à `RunEvent::Reopen`, donc une fenêtre masquée laissait une icône sur laquelle un clic ne faisait rien. Le trou existait déjà après une fermeture, il devenait la situation normale une fois le démarrage silencieux posé. C'est la seule raison pour laquelle `run` prend maintenant une fonction et que `lib.rs` construit puis lance en deux temps.

Le menu ne liste que les personnages **connectés**, dans l'ordre du défilement, avec `(en veille)` sur ceux qui sont hors du cycle. Un clic ramène la fenêtre au premier plan. Un personnage hors ligne n'y figure pas : une barre système est un endroit d'où l'on saute, et une ligne qui ne peut rien faire n'y a pas sa place.

**Une fenêtre réduite ressort du Dock, et un réglage dit si l'AutoFocus a le droit de le faire.** Activer un client dont la fenêtre est réduite ramenait sa barre de menus et laissait la fenêtre où elle était : le focus disait « fait » et rien ne bougeait. `focus` pose donc `AXMinimized` à faux avant d'activer, lecture d'abord, écriture seulement si la fenêtre est bien rangée, pour qu'un refus du système sur ce point ne transforme pas un focus ordinaire en échec.

Sortir une fenêtre du Dock fait partie du focus et ne se règle pas. Ce qui se règle, c'est de demander le focus ou non, et c'est le **réveil des réduites** : coché par défaut, décoché il met une fenêtre réduite hors d'atteinte de l'AutoFocus, de quoi travailler ailleurs sans être ramené dans le jeu. Il ne vaut que pour l'AutoFocus : un raccourci et un clic dans la barre système ramènent toujours, puisque l'utilisateur les a demandés. Le journal le dit avec ses propres mots plutôt que de ressembler à un AutoFocus qui a raté.

Deux variantes de `Decision` et pas un drapeau sur une seule : savoir si une fenêtre est réduite coûte un appel au système, et la réponse ordinaire est de ne pas le poser. Seul celui qui décoche le paie.

Le réglage vit dans l'écran AutoFocus et dans le menu de la barre système, comme l'interrupteur maître, et pour la même raison : on le bascule au moment où l'on range ses clients pour faire autre chose, pas au moment où l'on ouvre la fenêtre. Il garde son état quand l'AutoFocus est coupé, la case s'atténue avec les sept types sans se griser, puisqu'elle dit ce qui se passera au retour et non ce qui se passe.

**Un interrupteur maître pour l'AutoFocus.** `AutoFocus::enabled` s'ajoute aux sept types plutôt que de les éteindre ensemble : les couper tous oublierait lesquels l'utilisateur avait choisis, et les rallumer lui en rendrait sept. `is_enabled(kind)` demande donc les deux, `is_kind_enabled(kind)` ne demande que la ligne, et c'est cette seconde question que l'écran dessine. Une case dans le menu de la barre système le porte, l'écran AutoFocus aussi, sans quoi couper depuis la barre laisserait sept interrupteurs allumés qui ne font rien.

**Un verbe sur tout ce qui bascule.** L'AutoFocus, seul réglage du menu, dit « Activer » ou « Désactiver » plutôt que de porter une coche. Un nom coché, posé au-dessus des quatre noms d'écrans, se lisait comme un cinquième : « AutoFocus » ressemblait à un endroit où aller, pas à un interrupteur. Une ligne qui commence par un verbe ne peut être qu'une action, et le verbe dit dans quel sens elle ira. Règle pour la suite : dans ce menu, tout ce qui bascule porte un verbe.

**Les quatre écrans, et pas « Ouvrir ».** Ouvrir la fenêtre n'est jamais ce qu'on veut, aller sur un de ses écrans l'est. Le menu les offre donc directement, et le rail se retrouve à un clic au lieu de trois. Ça passe par un second événement, `multifus://navigate`, séparé du snapshot : l'écran affiché n'est pas un état que multifus garde mais une demande faite une fois, et le mettre dans le snapshot ramènerait la fenêtre sur cet écran à chaque tour du balayage.

**Ce que le menu porte, et ce qu'il ne porte pas.** Autorisation manquante puis « Ouvrir Réglages Système » en tête quand le système refuse, parce que le sens de cette icône est justement de ne pas avoir à ouvrir la fenêtre pour apprendre que multifus est sourd. Puis les personnages, puis l'AutoFocus et le réveil des réduites. Ces deux-là y sont parce qu'ils se basculent en jouant, ou plutôt au moment où l'on cesse de jouer : réduire ses clients pour travailler ailleurs est exactement l'instant où l'on veut couper le second, et ouvrir la fenêtre pour ça serait perdu d'avance. Le démarrage avec la session n'y est pas : il se règle une fois pour toutes et n'a rien à faire dans un menu qu'on ouvre en jouant. Pas d'équivalent clavier affiché : dans un menu de barre système, un accélérateur ne se déclenche que si l'application est active, et multifus ne l'est jamais. En afficher promettrait des touches mortes.

**Une seule porte de sortie, `runtime::emit_snapshot`.** Une commande qui construisait sa réponse elle-même répondait à l'interface sans prévenir la barre système, et le menu ignorait alors tout ce qui venait de la fenêtre : une veille basculée, un roster réordonné, un personnage retiré. Toutes les commandes passent donc par cette fonction, qui rend le snapshot en plus de l'envoyer. Pour que ce soit tenable sans réfléchir, `tray::refresh` est **idempotent** : il compare les lignes à celles qui sont affichées et ne reconstruit rien quand elles n'ont pas bougé, ce qui rend gratuit l'appel sur un changement de raccourci ou d'AutoFocus.

Fermer la fenêtre ne quitte plus, on quitte par le menu. Ce n'est **pas** un réglage de `tauri.conf.json`, aucune clé du schéma v2 ne fait ça : c'est `WindowEvent::CloseRequested` avec `prevent_close` puis `hide`, et rien d'autre. La fermeture n'est interceptée que si l'icône est bien là, sinon une fenêtre fermée laisserait un processus sans retour possible.

Et surtout, **rien n'intercepte la sortie**. `RunEvent::ExitRequested` avec `prevent_exit` est le motif que tout le monde recopie, il n'a pas sa place ici : la fenêtre n'étant jamais détruite mais seulement masquée, la sortie « dernière fenêtre fermée » ne se produit pas, et la prévenir quand même retirerait `Cmd+Q` à un utilisateur macOS pour rien.

**Repoussé, décidé sur mesure.** `NSApplicationActivationPolicy.Accessory`, qui sortirait multifus du dock. La question ouverte est de savoir si une application accessoire garde le droit d'activer un autre processus, dont dépendent l'AutoFocus et les deux raccourcis de défilement. On ne sait pas non plus laquelle des deux portes de `AccessibilityWindowManager::focus` travaille aujourd'hui, `activateWithOptions` ou le repli `AXFrontmost`, le journal écrivant `Focused` dans les deux cas. Poser la porte au journal d'abord, mesurer, puis décider.

**Le logo.** `src-tauri/icons` porte encore celui du scaffolder Tauri, et `icons/tray.png` est un glyphe provisoire. `npm run tauri icon <fichier>` régénère les onze fichiers depuis un PNG carré à transparence, et ne touche pas à `tray.png`, qui obéit à d'autres règles : voir plus bas.

**Vérification.** Une journée de jeu sans jamais ouvrir la fenêtre. Et, sur le paquet cette fois, une ouverture de session qui ne montre que l'icône, puis un double-clic depuis `/Applications` qui montre la fenêtre.

### Étape 10 — Distribution et mise à jour

**Écrite, pas encore vérifiée. macOS seulement, Apple Silicon seulement.** Windows n'est pas abandonné, il attend que macOS soit fini pour démarrer d'un bloc : il rejoint ces workflows à l'étape 9, en ajoutant un runner `windows-latest` aux deux endroits qui sont aujourd'hui des jobs uniques. En attendant, un `ci` vert ne dit toujours rien de `platform::windows`, et rien de ce qui a été ajouté ici n'est propre à macOS.

Trois fichiers pour deux portes. `checks` porte les sept commandes de la porte du projet et n'est déclenché par personne : il est appelé. `ci` l'appelle sur chaque poussée et chaque pull request, `release` l'appelle avant de signer quoi que ce soit. Une seule définition de « le code est en ordre », dans un seul fichier, et les deux portes passent par elle. Recopiée dans les deux, elle divergerait, et la copie qui divergerait serait celle qui garde la release.

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
| Remplacer le logo du scaffolder Tauri, voir « Le logo » à l'étape 8      | `src-tauri/icons`   |

Les huit secrets : `APPLE_CERTIFICATE` (le `.p12` en base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (un mot de passe d'application, pas celui du compte), `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY` et `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, vide ici.

**La paire de clés de l'updater existe déjà, ne la régénère pas.** Elle a été créée en même temps que cette étape, dans `~/.tauri/multifus.key` et son `.pub`, sans mot de passe. **La moitié publique est déjà dans `tauri.conf.json`**, c'est le champ `plugins.updater.pubkey`. Il ne reste qu'à recopier le contenu de la moitié privée dans le secret. Relancer `npm run tauri signer generate` donnerait une paire qui ne correspond plus à la clé publiée : les archives seraient signées, les multifus installés les refuseraient, et rien dans le journal ne dirait pourquoi. Si elle doit changer un jour, les deux moitiés changent ensemble, et `pubkey` est à remettre à jour dans le même commit.

Perdue avant la première release, elle se régénère sans conséquence. Perdue après, plus aucune mise à jour n'est signable pour les versions déjà installées.

**Vérification.** Un tag sur une version d'essai, le brouillon relu, le DMG téléchargé depuis un autre compte pour que la quarantaine s'applique vraiment, puis une seconde version pour voir si l'autorisation d'Accessibilité tient et si la fenêtre propose la mise à jour.

### Étape 11 — Relais Telegram

**Les fondations sont écrites, le reste attend.** Le besoin : jouer en passif, ne guetter que les messages privés, et pouvoir aller faire autre chose dans la maison sans perdre ces messages.

#### 11a — Posé

`app::relay::secret` pour le trousseau, `platform::display` et sa moitié macOS, `relayed` sur le personnage avec les accesseurs de `Roster` qui vont avec, `config::Relay`, les trois dépendances et le fournisseur `rustls` dans `app::setup`. Ni interface, ni réseau, ni barre système.

#### 11b-1 — Posé

**L'appariement fonctionne de bout en bout, sauf l'essai avec un vrai robot.** `app::relay::telegram` porte les deux appels, `app::relay::pairing` porte le geste, l'écran Relais est le cinquième du rail et du menu, et `relayed` se coche par personnage. `cargo test` compte 112 cas.

**L'ordre de l'appariement prouve toute la chaîne avant d'écrire quoi que ce soit.** Le salon est lu, un message d'essai y est envoyé, et le jeton n'est rangé dans le trousseau qu'après. Un appariement qui se déclare réussi est donc un appariement dont le message est vraiment arrivé sur le téléphone, et pas un qui échouera au premier message privé. Le prix est un message d'essai orphelin si le trousseau refuse en dernier, ce qui est le bon sens de l'échange.

**Rien ne se fait sur le fil qui a demandé.** Deux allers-retours réseau et un trousseau que l'ADR 0009 a mesuré bloquant sur une boîte de dialogue : la commande rend la main tout de suite et la réponse arrive par un snapshot, comme `app::update`. L'écriture dans le trousseau passe par `spawn_blocking`, qui est le seul endroit où une attente de ce genre a le droit de vivre.

**Cinq motifs d'échec d'appariement et pas un.** Jeton vide, jeton refusé, personne n'a écrit au robot, trousseau qui refuse, réseau absent. Ils se réparent à cinq endroits différents, et un écran qui dirait « la connexion a échoué » enverrait l'utilisateur au mauvais deux fois sur trois. Les deux premiers cas ne sont pas des pannes du relais et n'écrivent rien au journal : ce sont des étapes que l'utilisateur finit.

**L'écran explique Telegram à quelqu'un qui ne l'a jamais ouvert.** C'est le seul écran de multifus qui demande d'aller faire quelque chose dans une autre application et de revenir, donc cinq étapes numérotées et pas un paragraphe. Deux d'entre elles disent **pourquoi** et pas seulement quoi : un robot n'a pas le droit d'écrire le premier, qui est l'étape que tout le monde rate, et BotFather répond en anglais, ce qui sans avertissement se lit comme une fausse route.

**Trois liens, et l'interface nomme une destination sans jamais fournir d'adresse.** `web.telegram.org` pour Telegram dans le navigateur, `t.me/botfather` pour le robot qui fabrique les robots, `telegram.org/faq/fr` pour ce qu'est un robot, qui est la seule page officielle en français sur le sujet, la documentation des robots n'existant qu'en anglais. Les URL sont des constantes de `app::relay::links` et React envoie un mot parmi trois. La capacité accorde pourtant `opener:default`, donc React **pourrait** ouvrir une URL lui-même : c'est le même refus que pour `reveal_quarantined_config`, rien qui traverse le pont ne désigne une cible.

**Tout le tutoriel se fait dans Telegram Web, sur la machine où tourne multifus.** C'est ce qui rend l'appariement supportable : le jeton se copie-colle au lieu d'être lu sur un téléphone et retapé à la main, cinquante caractères sans faute. Les cinq étapes sont donc cinq liens et cinq gestes sur le même écran, et le téléphone ne sert plus qu'à deux choses, se connecter à Telegram Web une fois et recevoir les messages ensuite.

**Les carrés à scanner ont existé une demi-journée et ont été retirés.** L'idée était juste tant que le tutoriel visait le téléphone : un bouton y aurait ouvert la page sur la mauvaise machine. Elle tombe dès que tout se passe dans le navigateur, où un lien est un lien. Retirés avec eux : la crate `qrcodegen`, la commande qui rendait les modules, le composant et son crochet. Ne pas les remettre sans que le tutoriel reparte sur le téléphone.

**Le rang d'une étape s'écrit comme un rang de défilement**, en mono et sur deux chiffres. Cet idiome veut déjà dire « le nième d'une liste ordonnée » dans cette fenêtre, et une pastille numérotée inventée ici aurait dit la même chose dans un second dialecte. Même raison pour `PanelHeader`, extrait dès qu'un second panneau en a voulu un : deux panneaux du même écran ne peuvent plus diverger d'un pixel.

**Trois événements de journal, et un test qui compte leurs champs.** `RelayPaired`, `RelayUnpaired`, `RelayFailed` avec ses trois motifs. Aucun corps de notification, la règle de l'ADR 0006 ne bouge pas. Et **aucun identifiant de salon**, ce qui n'est pas cette règle-là mais la même raison que le nom de machine absent de `Started` : ce fichier est fait pour être transmis.

#### 11b-2 — Écrit, et il reste l'essai du quart d'heure

`app::relay::run` porte le tout : l'interrupteur, le fil d'envoi, les avis de l'ADR 0010 et l'écran tenu éveillé. `cargo test` compte 128 cas, `tsc` et `oxlint` passent. Ce qui n'a pas encore tourné contre un vrai robot est en bas de cette étape.

**Ce qui tourne vit dans une fente à part, jamais dans `Multifus`.** Ce type est ce que `snapshot()` relit plusieurs fois par minute et rend à React, et l'ADR 0009 veut que « le jeton ne ressort jamais » soit une propriété du modèle et pas une discipline. Le jeton, le salon et la file sont donc dans un `Mutex` à eux, comme le watcher et la mise à jour en attente, et `Multifus` ne garde que `relay_active`, le jumeau exact de `listening`. Les deux verrous ne sont jamais tenus en même temps.

**Le fil d'envoi est une tâche et pas un fil.** `shortcuts::start` et `tray::start_worker` sont des `std::thread` parce que leur travail est un appel système bloquant ; un aller-retour réseau est déjà asynchrone, et un fil système posé dessus ne ferait que dormir. C'est donc une tâche unique sur `tauri::async_runtime::spawn`, qui possède le `Receiver` d'un `tauri::async_runtime::channel`, lui-même un `tokio::sync::mpsc` réexporté, donc zéro crate en plus. Un seul consommateur tient l'ordre sans y penser, et lâcher le `Sender` ferme la file et termine la tâche : la désactivation n'a pas de second mécanisme.

**Le client HTTP est construit une fois.** `telegram::send` le prend en paramètre au lieu d'en bâtir un, sans quoi une soirée de messages privés paierait une poignée de main TLS par message.

**Les avis sortent du balayage comme des faits.** `apply_windows` tourne sous le verrou et le corps d'un message Telegram n'a rien à y faire, donc les deux portes du roster rendent maintenant un `ScanChange` : ce qui a bougé, les pseudos relayés qui viennent de tomber, et s'il n'en reste aucun. `runtime::tick` rend le verrou, puis passe ces faits au relais. **`apply_denied` le rend aussi**, ce que le cadrage n'avait pas : l'autorisation retirée est le deuxième des quatre cas de l'ADR 0010, et sans ça une autorisation coupée pendant une absence rendait le relais muet sans un mot sur le téléphone.

**`DisplayAwake` s'écrit sur la transition et pas sur l'état.** `log_unless_repeated` ne compare qu'à la dernière entrée, et une soirée de `RelaySent` s'intercale : la ligne repasserait après chaque message privé et remplirait les 200 entrées. La transition se lit sur le keeper, `is_awake()` avant et après, donc l'appelant ne garde toujours aucun booléen, ce que le piège plus bas demande.

**Ce que la barre système a gagné, et pourquoi c'est un champ et pas trois.** `tray::Contents` ne voyait ni le salon, ni `relayed`, ni l'état vivant : apparier un robot laissait le menu proposer d'en configurer un, et activer le relais laissait le menu proposer de l'activer. Il gagne donc `relay: RelayItem`, une énumération à trois variantes. Trois booléens auraient laissé écrire « pas apparié et en marche », un état qui n'existe pas.

**Ce qui reste en l'air, et une seule chose l'est.** Une tâche asynchrone n'a pas de `catch_unwind` autour d'elle, contrairement aux trois fils, donc `Work` ne gagne pas de quatrième variante. C'est la même exposition que la tâche de `app::update`, et son corps se réduit à un `Result` et à une écriture de journal.

**Trois choses que la relecture a trouvées et qui sont corrigées.** `follow_display` appelait `release()` à chaque tour même relais éteint : sur Windows, où toute méthode du keeper rend `NotImplemented`, ça écrivait « Écran impossible à tenir éveillé » dès le premier balayage et à peu près à chaque tour ensuite, `log_unless_repeated` ne comparant qu'à la dernière entrée. Il sort maintenant tout de suite quand il n'y a ni assertion à poser ni assertion à relâcher. Le fil d'envoi émettait un snapshot par message, en plus de celui que `on_notification` venait d'émettre, ce qui clonait deux fois jusqu'à 200 entrées de journal pour rien : il n'en émet plus que sur un échec, la réussite voyageant avec le balayage suivant. Et l'activation remettait `PairingView::Idle`, donc effaçait ce que l'écran Relais disait du dernier appariement : elle n'y touche plus, un trousseau qui refuse se lit au journal et dans l'article de menu resté sur « Activer le relais ».

**L'avertissement d'économiseur ne se déclenche que sur un délai mesuré.** Il ne se déclenchait aussi sur `Unknown`, ce qui promettait sur Windows, où la lecture n'est pas écrite, une panne que personne n'a vue.

Cinq décisions sont tranchées et n'ont pas à être rejouées. Le service, [ADR 0007](./adr/0007-telegram-plutot-que-whatsapp-ou-ntfy.md), qui écarte WhatsApp, ntfy, Gotify, Bark et Pushover avec les motifs de chacun. Le corps du message, [ADR 0008](./adr/0008-corps-relaye-sur-consentement.md), qui explique pourquoi l'interdit de l'ADR 0006 ne s'applique pas ici et pourquoi le réglage est décoché par défaut. Le jeton, [ADR 0009](./adr/0009-jeton-dans-le-trousseau.md), qui le range dans le trousseau du système. Les avis, [ADR 0010](./adr/0010-le-relais-parle-de-lui-meme.md), qui disent quand le relais a cessé d'entendre. Le relais par personnage, [ADR 0011](./adr/0011-relais-par-personnage.md), qui revient sur un refus du périmètre.

**Ce qui décide de tout, et qu'aucun document ne disait : le quart d'heure.** Dofus déconnecte un client resté inactif, et le titre de sa fenêtre perd le pseudo. Le périmètre interdit d'y remédier, ce serait simuler une action de jeu. Le relais a donc une durée de vie utile d'environ quinze minutes par personnage, et rien ne la rallongera. Ça ne le condamne pas, ça le recadre : l'avis de déconnexion n'est pas un confort, c'est l'événement principal.

**Le message privé seul parmi les sept types, codé en dur.** Pas de jeu d'interrupteurs par type. Le périmètre écrit le refus et dit à quelle condition le rouvrir. Les avis de l'ADR 0010 ne sont pas des types de notification et n'ouvrent pas cette porte.

**Les personnages relayés se choisissent, et ça se garde.** L'attribut et ses accesseurs sont posés en 11a. Reste ce qui s'appuie dessus : l'écran Relais en dessine la liste, et le relais refuse de s'activer quand `has_relayed` est faux, ce qui est le seul garde-fou contre l'exclusion oubliée de l'ADR 0004. Voir ADR 0011.

**L'interrupteur a deux portes, la barre système et l'écran Relais.** Il n'en avait qu'une, et cette ligne disait « nulle part ailleurs ». Le motif était bon pour l'usage quotidien, on active le relais en se levant et ce geste supporte d'aller à la barre des menus ; il était faux pour l'écran, où l'on regarde si tout est en place et où l'absence d'interrupteur se lisait comme « ce n'est pas ici que ça se règle », juste au-dessus d'une carte qui dit l'état. Dans le menu, l'article garde son verbe, comme la règle de l'étape 8 l'exige pour tout ce qui bascule là.

Pas de cinquième raccourci global pour autant : les quatre flèches de `Control+Shift` sont prises, et rien ne justifie d'en demander une de plus pour un geste qui a déjà deux portes.

Trois états et non deux verbes, parce qu'un « Activer le relais » qui échoue est exactement ce que cette étape cherche à éviter. Le premier état a été mal nommé pendant tout le cadrage, et le corrigé est ici :

| État                                                | Ce que l'article dit                              | D'où vient la réponse          |
| --------------------------------------------------- | ------------------------------------------------- | ------------------------------ |
| Pas prêt : jamais apparié, **ou** personne de coché | `Configurer le relais…`, et le clic ouvre l'écran | la configuration, sans lecture |
| Prêt, relais coupé                                  | `Activer le relais`                               | idem                           |
| Relais actif                                        | `Désactiver le relais`                            | l'état vivant du processus     |

**Ce n'est pas « aucun jeton dans le trousseau », et ça ne pouvait pas l'être.** Le menu se reconstruit à chaque snapshot, donc plusieurs fois par minute, et l'ADR 0009 interdit d'interroger le trousseau ailleurs qu'à l'activation parce que chaque lecture peut ouvrir une boîte de dialogue. La question du menu est une question de préparation, pas de présence du secret, et elle se lit sur `relay.chat_id`, que l'appariement écrit et que le déliement efface en même temps que le jeton. Le tableau de l'ADR 0009 sépare les deux questions.

Le gain de bord est le quatrième état que le cadrage avait oublié : « le relais refuse de s'activer si personne n'est coché » avait besoin d'un endroit pour se dire, et un clic de menu qui ne fait rien ne le dit pas. Les deux cas partagent la même étiquette et le même clic, vers le seul écran où les deux se réparent.

**L'écran dit ce que fait le relais, et il peut le prouver.** Ajouté après le quart d'heure, sur un doute réel : tout est coché, l'écran ne dit rien de l'état vivant, et rien ne sépare un relais qui marche d'un relais qu'on croit en marche. Deux réponses, et la seconde est la vraie.

L'état d'abord. `RelayView` gagne `ready`, qui est `is_relay_ready()` rendu tel quel plutôt que rejoué en React : la règle de l'ADR 0011 s'écrit à un seul endroit. La première carte en tire trois états, en marche, à l'arrêt, incapable de démarrer, et porte l'interrupteur lui-même, voir plus haut la porte qui s'est ajoutée.

**Trois cartes, et l'ordre est celui des questions.** L'interrupteur, le robot, l'essai. Une version antérieure mettait le robot à l'intérieur de la carte d'état pour qu'on cesse de lire « robot connecté » comme « relais en marche » ; l'interrupteur posé en tête règle le même problème mieux, puisque l'état vivant est alors la première chose que la carte porte, avec sa couleur et sa bascule. Le robot redevient une carte, la sienne, et sa ligne finit quand même sur « un robot relié ne met pas le relais en marche ».

**L'interrupteur ne se grise jamais, même sans personne de coché.** La règle du projet interdit un bouton mort, et ici il y a mieux à faire : le badge rouge et la ligne au-dessus disent déjà ce qui manque. Le commutateur est piloté par le snapshot, donc un clic qui ne peut pas démarrer le relais ne le déplace même pas visuellement. Côté Rust, `set_active` sort tout de suite quand l'interrupteur est poussé là où le relais est déjà : sans ça, une fenêtre qui travaille sur un snapshot vieux de trois secondes pouvait démarrer un second relais par-dessus le premier et perdre la file de celui qu'elle remplaçait.

**Ce que l'interrupteur a à dire tient dans `SwitchView`, et il n'avait rien.** Le commutateur ne pouvait rendre compte que de `active`, donc un trousseau verrouillé ou un Refuser sur la boîte le faisait revenir à zéro pendant que la carte continuait d'afficher « à l'arrêt, tout est prêt ». C'était un mensonge, sur le seul panneau de cet écran qui doit être cru. Trois états, la forme de `PairingView` recopiée une troisième fois : rien en cours, démarrage en cours, échec avec son motif. `start` les rend et l'appelant les pose, ce qui met les cinq sorties de la fonction dans une seule expression au lieu de cinq écritures dispersées.

Le démarrage donne un `aria-busy` au commutateur, pour les secondes que l'ADR 0009 a mesurées à la boîte de dialogue. L'échec écrit une ligne rouge sous la carte, avec la même table de phrases que l'essai : un démarrage et un essai échouent aux trois mêmes endroits, donc une seule table. Et `cancel_relay_start` remet l'état à rien, sans quoi un échec dont plus personne n'attend la réponse resterait sous une carte qui vient de passer à « à l'arrêt ».

**Pas de deux-points dans ces cartes.** Le deux-point français se compose avec une espace insécable devant, et sans elle il part seul en début de ligne dès que la carte est étroite. Les phrases sont écrites sans lui plutôt que d'introduire un caractère invisible dans chaque chaîne. Ailleurs, le journal continue d'en employer.

**C'est le seul endroit de la fenêtre qui dépense une couleur qui n'est pas l'ocre, et l'exception est assumée.** Le vert, l'ambre et le rouge sont dans `:root` sous `--relay-*`. Une première version employait la lampe du roster, ocre qui respire pour vivant, anneau creux à l'arrêt : à l'écran, un relais coupé et un relais en marche se ressemblaient trop pour un panneau qu'on regarde en sortant de la pièce. La règle du projet reste vraie partout ailleurs, le roster compris.

**La couleur passe par une seule variable.** Le panneau porte `data-relay` et pose `--tone` ; le badge, la teinte du panneau et le point qui respire la lisent, personne ne connaît de nom de couleur. Piège tenu au passage : `panel-toned` s'applique par `data-relay:` et non en classe nue, sinon le `bg-card` que `Panel` apporte lui-même gagne à égalité de spécificité et la teinte ne s'affiche jamais.

**Le badge est au-dessus du titre et pas devant.** Une pastille en tête de ligne décalait le titre d'une trentaine de pixels et cette carte cessait d'être alignée sur les autres. Le badge prend une ligne à lui, les titres retrouvent la même marge, et le point vit à l'intérieur du badge.

L'essai ensuite, et c'est lui qui répond vraiment. Sa carte dit d'entrée qu'il part **que le relais soit en marche ou à l'arrêt**, ce qui est la première question que le bouton pose. Il envoie un message par le vrai chemin d'envoi. Relais en marche, il passe par la file vivante, ce qui prouve aussi la tâche d'envoi ; relais à l'arrêt, il lit le trousseau et envoie lui-même, et c'est **le seul message qui sorte hors d'un relais actif**. C'est voulu : le doute vient avant de quitter le bureau, pas après. `TestView` recopie la forme de `PairingView`, ses trois états plus `Sent` et `TooSoon`, et l'échec réutilise les trois motifs de `RelayFailure` sans en inventer un quatrième. Le journal écrit `RelayTestSent`, sans surface ni corps, gardé par le même test de champs que les autres.

**L'interrupteur revendique le démarrage avant de partir en tâche de fond.** Il ne suffisait pas de lire `is_relay_active` : ce drapeau ne se lève qu'une fois la file en place, et entre le clic et ce moment il y a le trousseau, que l'ADR 0009 a mesuré bloquant sur une boîte de dialogue. Deux clics dans cette fenêtre démarraient deux relais l'un sur l'autre, chacun avec sa tâche d'envoi et son « Relais activé » sur le téléphone. `begin_relay_start` tranche, et un interrupteur poussé sur arrêt pendant ce temps annule le démarrage plutôt que de se faire avaler.

**La revendication est une identité et non un drapeau, et un drapeau ne suffisait pas.** Marche, arrêt, marche : le premier démarrage était annulé, le troisième clic relevait le booléen, et le premier se réveillait, lisait la revendication du troisième et s'installait quand même, avant d'éteindre celle qu'il n'avait pas prise. `begin_relay_start` rend donc un `StartId`, `is_relay_starting` le compare et `end_relay_start` ne lâche que le sien. Et la revendication, le `*running` et `enable_relay` tiennent sous un seul verrou : entre les trois, un arrêt trouvait tout à vide, n'écrivait rien, et le relais se rallumait derrière lui.

**Un démarrage en vol compte pour `stop_if_unready`.** Il ne regardait que `relay_active`, faux tant que le trousseau répond, donc décocher le dernier personnage ou remettre à zéro pendant la boîte de dialogue laissait le démarrage aboutir avec le salon lu avant l'attente. Relais en marche sur une configuration vide, l'écran montrant le tutoriel : `has_relay_start` ferme le trou.

**`queue` rend trois issues et non un booléen.** Un relais éteint et une file en retard d'une minute se réparent ailleurs, et l'essai confondait les deux : un arrêt tombé entre son coup d'œil à `running` et sa poussée dans la file lui faisait afficher « Telegram a refusé la requête » sans rien avoir demandé à Telegram, et le message était perdu au lieu de partir par `send_once`.

**Le client HTTPS est bâti avant que la file existe.** Il l'était dans la tâche d'envoi, qui abandonnait sur un échec en lâchant le récepteur alors que la file restait ouverte : ce qui y avait été poussé entre-temps était perdu sans réponse, et un essai en vol restait sur « Envoi… » pour toujours.

**Trois arrêts sur cinq écrivent au téléphone**, le raccourci et les deux interrupteurs. Un robot délié serait annoncé dans le salon même que multifus efface, et un dernier personnage décoché se fait au clavier sur un relais qui n'avait plus rien à porter.

**Un essai tient le bouton trente secondes, et le compte part de l'arrivée.** Rien n'empêchait de marteler le bouton et d'envoyer une rafale sur son propre téléphone. Le délai est dans `relay::run`, à côté de l'envoi qu'il protège, et non dans un minuteur React qui repartirait à zéro dès qu'on change d'écran. Il se compte depuis le moment où le message est arrivé et pas depuis le clic, donc un essai qui échoue se rejoue tout de suite : ce qu'on protège est le téléphone, et un envoi raté ne l'a pas atteint. Un second garde couvre le double clic, un essai déjà en vol en refuse un autre.

Le bouton ne se grise pas pour autant, la règle du projet l'interdit : un clic trop tôt rend `TestView::TooSoon`, une quatrième issue et pas un échec, rien n'ayant été demandé à Telegram. **Elle ne porte pas de compte à rebours, et une première version en portait un** : un snapshot ne part que quand quelque chose a bougé, donc le nombre gelait à l'écran et une région vivante annonçait un chiffre faux la seconde d'après. La phrase dit « une trentaine de secondes ».

**Toute bascule de l'interrupteur écrit sur le téléphone.** « Relais activé », « Relais désactivé ». C'est ce qui a corrigé le troisième déclencheur de l'ADR 0010, qui envoyait « Plus aucun personnage relayé n'est connecté » tout seul au moment de l'activation et se lisait comme une panne. Il est maintenant la seconde ligne de la confirmation. Deux `NoticeCase` de plus, `enabled` et `disabled`, et le message d'arrêt est mis dans la file **avant** que la file soit lâchée, puisque la lâcher est ce qui la ferme.

Un `NoticeCase` de moins par la même occasion, `nobodyLeft` : l'activation était son seul producteur, et `announce` refuse d'envoyer un avis qui ne nomme aucun départ. Il restait certifié par cinq artefacts, dont un cas de test, pour un chemin que le programme ne pouvait plus prendre.

**Ce que l'essai ne prouve pas, c'est que les bons personnages sont cochés.** Cette question-là est celle de la première carte et de la liste plus bas, et les deux restent séparées : un essai qui exigerait un personnage coché ne partirait pas au moment où l'on veut justement savoir si le robot répond. Il ne demande que le salon, donc un robot apparié. Sans robot, la question ne se pose pas : l'écran montre alors le tutoriel et aucune des trois cartes. CONTEXT.md porte le mot.

**L'écran Relais est le cinquième du rail et du menu.** `Screen::ALL`, `tray::build_menu` et le rail passent de quatre à cinq. C'est la première fonctionnalité qui oblige à ouvrir la fenêtre pour être installée, et l'arbitrage est en bas de cette étape.

**L'état actif ne survit pas au processus.** Même raisonnement que l'[ADR 0004](./adr/0004-veille-ephemere-sexe-persiste.md) pour la veille : un multifus qui revient d'un plantage en tenant l'écran éveillé et en poussant des messages privés vers un téléphone, sans que personne ne l'ait demandé, est un comportement que ce projet refuse déjà ailleurs. Le jeton et l'identifiant de salon persistent, l'état actif non.

**Un des quatre raccourcis frappé coupe le relais.** Si un raccourci se déclenche, c'est qu'une fenêtre Dofus est devant et qu'une main est au clavier, donc que l'utilisateur est revenu. Le journal écrit la ligne. Aucun minuteur : « le relais se coupe au bout de deux heures » recréerait exactement la panne que toute l'étape cherche à éviter, un relais auquel on fait confiance et qui s'est arrêté pendant l'absence.

**L'écran est tenu éveillé tant qu'il y a quelque chose à écouter.** C'est la condition de survie de la fonctionnalité sur macOS, et elle découle de l'[ADR 0002](./adr/0002-notifications-macos-via-accessibility.md) : multifus ne lit pas des notifications, il lit des bannières. Écran éteint et session verrouillée, il n'y a plus de bannière et plus d'arbre d'accessibilité à parcourir, donc plus de relais, et un téléphone silencieux se lit comme « personne ne m'a écrit ». La frontière et l'implantation macOS sont posées en 11a ; reste à brancher `has_relayed_online` dessus, au tour de balayage.

**Elle demande le relais actif et au moins un personnage relayé connecté.** Une version de cette ligne disait « et pas l'interrupteur », ce qui, lu au pied de la lettre, tenait la machine éveillée dès le premier client ouvert, relais jamais activé : tout le monde entre dans le roster relayé, donc un portable sur batterie n'aurait plus jamais dormi. Ce que « pas l'interrupteur » voulait dire est la seconde moitié : à l'intérieur d'un relais actif, l'assertion suit les personnages et non la durée de l'interrupteur. C'est le quart d'heure qui l'impose, sans quoi une déconnexion à quinze minutes laisse la machine allumée une heure pour écouter le vide. Plus aucun personnage relayé connecté, l'assertion tombe. L'un d'eux revient, elle est reposée. **Le relais, lui, ne bouge pas** : seul un raccourci l'arrête, un relais qui s'arrêterait tout seul étant le minuteur que cette étape refuse plus haut. CONTEXT.md porte la définition.

**L'économiseur d'écran est un trou, et il n'est pas mesuré.** `PreventUserIdleDisplaySleep` empêche l'écran de s'éteindre. Rien ne documente qu'il empêche l'économiseur de démarrer, et un économiseur qui démarre verrouille la session, ce qui rend le relais muet exactement comme une extinction. La machine de développement a `idleTime` à zéro, donc aucun économiseur, et l'essai n'y prouverait rien. La lecture est écrite en 11a et rend `Never` sur cette machine-là.

**Elle est lue au démarrage et pas à l'activation, et une version de ce paragraphe demandait le contraire.** L'activation quotidienne se fait depuis la barre système, la fenêtre fermée : l'avertissement atterrirait sur un écran que personne ne regarde. La seconde porte n'y change rien, puisque c'est justement celle qu'on emprunte en regardant l'écran, où l'avertissement est déjà là. Et rien ne persiste, donc l'écran Relais ne dirait rien tant qu'on n'a pas activé une fois dans la session. Une préférence ne coûte aucune boîte de dialogue, contrairement au trousseau de l'ADR 0009, donc rien ne justifiait de la retarder. `app::setup` la lit une fois, elle voyage dans `RelayView` à chaque snapshot, et l'écran Relais l'affiche dès qu'elle rend autre chose que `Never`, au moment où l'on installe le relais et où l'on peut encore changer le réglage. Prix accepté : une valeur périmée si l'économiseur change en cours de session.

**Le mot « veille » est interdit dans tout ce code.** Il désigne un personnage retiré du défilement. L'état de la machine s'appelle `display_awake`, et CONTEXT.md porte l'interdit.

**L'envoi part sur un autre fil.** `platform::notification` l'écrit noir sur blanc : le sink tourne sur le fil du watcher et ne doit pas bloquer, tout ce qui est plus long qu'un focus appartient à un autre fil. Un POST HTTPS est exactement ce que cette phrase interdit là. Et la règle en tête de `app::state` continue de s'appliquer, le verrou de `Multifus` ne se tient pas pendant l'appel.

**Le journal, et ce qu'il ne porte pas.** `RelayEnabled` avec sa surface, `RelayDisabled` avec son motif, `RelaySent` avec le pseudo, `RelayNoticeSent` avec le cas, `RelayFailed` avec sa raison, `DisplayAwake` avec l'état posé ou relâché, `DisplayAwakeFailed` avec ce que le système a dit. `RelaySent` ne porte pas le type qu'une version de cette ligne lui donnait, le message privé étant le seul type relayé ; `RelayEnabled` portait la même objection tant que l'interrupteur n'avait qu'une porte, et la perd en en gagnant une seconde, voir plus bas. Aucun corps, sous aucune forme, et un test qui compare la liste exacte des champs, comme celui qui garde déjà l'événement de notification. Trois échecs à ne pas confondre, parce qu'ils se réparent dans trois endroits différents : le trousseau qui refuse de rendre le jeton, Telegram qui refuse la requête, et le réseau qui n'est pas là.

**L'appariement.** L'utilisateur crée le robot chez BotFather, colle le jeton dans l'écran Relais, écrit un message au robot depuis son téléphone, puis clique Connecter. multifus appelle `getUpdates` une seule fois, prend l'identifiant de salon du premier message, l'écrit dans la configuration, range le jeton dans le trousseau et envoie un message d'essai. Aucune boucle de scrutation : multifus n'a aucune boucle réseau vivante aujourd'hui et cette étape ne lui en donne pas.

#### Ce qui a été mesuré

| Question                                         | Réponse                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `AXValue` tronque-t-il le corps ?                | **Non.** Entier jusqu'à 400 caractères, sans points de suspension. Six longueurs postées, six longueurs rendues    |
| L'assertion d'énergie se pose-t-elle ?           | **Oui.** Elle s'inscrit sous le pid de multifus avec son nom dans `pmset -g assertions`, et se relâche             |
| `keyring` ouvre-t-il une invite en `tauri dev` ? | **Oui.** Un binaire recompilé bloque sur une boîte de dialogue. Voir le tableau de l'ADR 0009                      |
| Que rend `getUpdates` sur un jeton invalide ?    | HTTP **401**, `{"ok":false,"error_code":401,"description":"Unauthorized"}`. Un jeton sans deux-points rend **404** |
| Combien de crates coûte l'étape ?                | **Trois** pour le relais, plus **une** pour les carrés à scanner, sur macOS comme sur Windows                      |
| Le titre après une déconnexion pour inactivité ? | **`Dofus Retro v1.48.21`**, sans tiret devant `Dofus`. Aucun pseudo n'y est lu, aucun personnage n'est inventé     |

La question du double déclenchement de l'observateur est traitée dans « Ce qui mord », parce que la mesure a rendu autre chose que ce qu'on lui demandait et qu'elle est douteuse.

Deux de ces lignes sont maintenant tenues par le code de 11a et non plus par un prototype. Les trois crates sont ce que `Cargo.lock` a réellement gagné, `keyring`, `keyring-core` et `apple-native-keyring-store`, et rien d'autre. L'assertion se pose et se relâche dans `cargo test`, et elle apparaît bien dans `pmset -g assertions` sous le nom `multifus relay`.

#### Ce qui reste à mesurer, et qui demande la vraie machine

**Ce que rend `getUpdates` sur un vrai robot à qui personne n'a écrit.** Ce n'est plus un préalable : la partition du code ne repose pas sur la forme exacte de cette réponse. Une erreur de transport est le réseau ; un HTTP non 2xx ou un `ok: false` est le jeton ; `ok: true` sans aucune mise à jour portant un `message.chat.id` est le seul cas restant, et c'est « écris à ton robot ». La commande reste bonne à passer pour confirmer :

```bash
curl -s "https://api.telegram.org/bot<JETON>/getUpdates"
```

Sans `offset`, cet appel ne consomme rien et Telegram garde les messages 24 heures. Cliquer Connecter deux fois marche donc, écrire au robot la veille non.

**Le verrouillage de session, et le protocole d'origine ne pouvait pas le détecter.** La machine a `displaysleep` à 120 minutes, `idleTime` à zéro et un verrouillage 300 secondes après extinction : elle ne se verrouille qu'au bout de deux heures et cinq minutes, donc les « vingt minutes » de la vérification passaient que l'assertion marche ou non. Pour que l'essai veuille dire quelque chose :

```bash
sudo pmset -a displaysleep 2
sysadminctl -screenLock immediate
```

Puis, sans multifus, trois minutes sans rien toucher, l'écran doit s'éteindre et verrouiller. Puis, relais actif, cinq minutes sans rien toucher, l'écran doit rester allumé et `pmset -g assertions` doit montrer la ligne de multifus. Enfin `sudo pmset -a displaysleep 120` et `sysadminctl -screenLock 300`.

#### Le client Telegram, tranché

`reqwest` en dépendance directe. Mesuré avec `cargo tree` sur `aarch64-apple-darwin`, en comparant à l'arbre existant :

| Ce qu'on ajoute                          | Crates en plus                                              |
| ---------------------------------------- | ----------------------------------------------------------- |
| `reqwest`, `json` + `rustls-no-provider` | **0**                                                       |
| `reqwest` avec ses réglages par défaut   | 7, dont `aws-lc-rs` et `aws-lc-sys`                         |
| `frankenstein` + `client-reqwest`        | 14, dont `aws-lc-sys`, `bon`, `prettyplease`, `async-trait` |
| `frankenstein` + `client-ureq`           | 20, dont `ureq`, `ureq-proto`, `webpki-roots`, `rand`       |

`teloxide` reste écarté sans mesure : deux appels ne justifient pas un cadriciel de dialogue.

**L'argument contre `frankenstein` était faux, et le vrai est plus fort.** Une version antérieure de ce document disait que son client bloquant ferait entrer une seconde pile TLS. C'est inexact : `ureq` 3 roule sur le `rustls 0.23.43` déjà dans le verrou. Le vrai coût est quatorze crates pour deux URL, et surtout `aws-lc-sys`, une bibliothèque C que `client-reqwest` fait entrer en activant le TLS par défaut de `reqwest`.

Les trois déclarations, à zéro crate près pour les deux premières :

```toml
reqwest = { version = "0.13", default-features = false, features = ["json", "rustls-no-provider"] }
rustls  = { version = "0.23", default-features = false, features = ["ring"] }
keyring = "4"
```

Le trait de `reqwest` s'appelle `rustls-no-provider` et pas `rustls-tls`. C'est celui que `tauri-plugin-updater` demande déjà, d'où le zéro.

**Et il manque une ligne que personne n'attend.** `rustls-no-provider` veut dire que personne n'installe le fournisseur cryptographique. Aujourd'hui c'est l'updater qui le fait, **dans sa boucle de vérification** et pas à l'initialisation du greffon :

```rust
// tauri-plugin-updater-2.10.1/src/updater.rs:446
if rustls::crypto::CryptoProvider::get_default().is_none() {
    let _ = rustls::crypto::ring::default_provider().install_default();
}
```

Un `sendMessage` parti avant la première vérification de mise à jour trouverait donc un `rustls` sans fournisseur et échouerait avec une erreur illisible. multifus pose le sien au démarrage, ce qui rend le garde de l'updater sans objet.

**Le greffon HTTP officiel n'est pas la réponse.** Sur les trente greffons du catalogue, un seul touche au sujet, et son intérêt est d'exposer un client HTTP **au webview**. Côté Rust il n'est rien d'autre que `reqwest`. Le prendre ajouterait une surface de permission là où l'ADR 0009 tient précisément à ne pas en avoir. Rien d'officiel ne couvre le trousseau, à part `stronghold` que l'ADR 0009 écarte, ni l'écran tenu éveillé.

#### Pièges connus d'avance

**Le jeton est dans l'URL, et `reqwest` met l'URL dans ses erreurs.** Sa propre documentation le signale et propose `without_url`. Recopier un `error.to_string()` de transport dans le journal y écrirait le jeton du robot, dans un fichier qui vit des semaines et qu'on colle dans un rapport de bug. `app::relay::telegram` le retire sur tous ses chemins d'erreur, et rien d'autre ne protège cette règle. Ne jamais formater une erreur `reqwest` de ce module autrement.

**L'activation lit le trousseau, donc elle ne peut pas vivre sur le fil principal.** `tray::on_menu_event` tourne sur le fil principal, et l'ADR 0009 a mesuré une lecture bloquée sur une boîte de dialogue. Branchée directement là, l'activation gèle la fenêtre et la boucle d'événements le temps que quelqu'un clique.

**Et la file du travailleur n'est pas la réponse, contrairement à ce que ce paragraphe disait.** Il demandait qu'elle devienne une énumération, `Focus(String)` et `ToggleRelay`. Ce travailleur est un fil unique et séquentiel : une activation bloquée sur la boîte du trousseau y bloque tout le reste, donc un clic sur un personnage dans le menu ne fait plus rien et rien ne l'écrit. C'est la panne que ce paragraphe cherche à éviter, déplacée d'un fil.

11b-1 avait déjà posé la bonne forme, et c'est celle qui est écrite : `relay::run::toggle` est appelé depuis `on_menu_event` et rend la main tout de suite, comme `update::install` juste au-dessus ; le réseau part sur `tauri::async_runtime::spawn` et le trousseau sur `spawn_blocking`, comme `pairing::pair`. La file du travailleur reste un `Sender<String>`.

Le clic sur l'état « pas prêt » ne part pas sur le travailleur non plus : il ouvre l'écran Relais, comme les cinq articles d'écran. `on_menu_event` lit la préparation en prenant le verrou, ce qu'il fait déjà pour trois de ses articles, et la règle du verrou interdit de le tenir et pas de le prendre.

**`PlatformDisplayKeeper` n'est posé nulle part.** `app::setup` gère le gestionnaire de fenêtres et le watcher, pas le keeper. C'est une ligne, et elle manque depuis 11a.

**Sur Windows le keeper échoue à chaque tour.** `keep_awake` rend `NotImplemented` et `is_awake` rend toujours `false`, donc chaque balayage avec un personnage relayé connecté retentera et échouera jusqu'à l'étape 9. `log_unless_repeated` le réduit à une ligne, c'est tenable. Sur macOS le keeper est idempotent en interne, donc l'appeler à chaque tour est gratuit et l'appelant ne garde aucun booléen.

**L'échec de l'écran tenu éveillé n'est pas un `RelayFailed`.** Le relais marche encore, jusqu'au verrouillage. Deux événements qui recopient le couple `Listening` / `ListeningFailed` déjà présent : `DisplayAwake { held }` et `DisplayAwakeFailed { detail }`.

**`RelayEnabled` porte une surface, et n'en portait pas.** Tant que l'interrupteur n'avait qu'une porte, le champ n'aurait eu qu'une valeur ; il en a deux, donc `RelayEnabled { surface }` et un cinquième motif `RelayStop::Window`. `RelaySent` ne porte toujours pas de type, et pour la raison qui tient encore : le message privé est le seul type relayé, codé en dur. Ce que `RelayDisabled` porte reste un **motif** et non une surface, la moitié de ses cas n'étant pas un geste.

**Cinq motifs et non trois.** Le raccourci, la barre système, l'interrupteur de la fenêtre, le décochage du dernier personnage relayé, et le robot délié. Ce dernier manquait, et son absence était un vrai trou : le fil d'envoi tient le jeton et le salon en mémoire, donc délier pendant que le relais tourne laissait l'écran dire « pas relié », le menu dire `Désactiver le relais`, et les messages privés continuer de partir. Même chose pour la remise à zéro, qui vide le salon. Les deux arrêtent le relais avant de toucher à la configuration.

**L'arrêt au raccourci se place derrière le garde du périmètre.** Un raccourci se déclenche à chaque appui, n'importe où, et `OutsideGame` est de loin l'issue la plus fréquente : branché dans `shortcuts::fire`, un `Control+Shift+flèche` frappé dans un éditeur de texte couperait le relais. Le point est dans `answer`, dans la branche `Ok(Some(window))`, avant `act` : une fenêtre du jeu est devant et une main est au clavier, ce qui est le raisonnement écrit plus haut. L'arrêt part quelle que soit l'issue de l'action, `NobodyInCycle` compris.

**Une notification n'est pas filtrée par l'application qui l'a émise.** L'observateur lit ce que le centre de notifications dessine, quelle qu'en soit la source, donc une notification web dont le titre finit par `- Dofus…` produit un pseudo. Sur le chemin de l'AutoFocus c'est sans effet, le pseudo n'ayant pas de fenêtre, et **le roster reste intact** : seul `apply_windows` crée un personnage, et il n'énumère que les processus du bundle `com.dofus.d1elauncher`. Sur le chemin du relais, qui n'a besoin d'aucune fenêtre par conception, le garde est que `relayed` est un attribut de personnage : un pseudo absent du roster n'est relayé par rien. Ne pas ajouter de filtre, il n'y a rien à filtrer.

**Ce n'est pas `journalLine` qui bute sur la complexité, c'est `runLine`.** Le seuil est `complexity: ["error", 20]`, dans `@viclafouch/oxc-config`. `journalLine` fait quatre branches et n'est pas le sujet ; `runLine` en portait onze plus deux ternaires, soit environ 15, et les trois événements de 11b-2 l'ont mené vers 18. Ça passe, à un ternaire près : les branches ajoutées délèguent donc à des fonctions nommées, comme `rosterLine` et `settingLine` le font déjà, et aucune ne porte de ternaire en ligne.

**Et ce qui casse d'abord n'est pas le lint, c'est le typage, ce qui donne l'ordre de travail.** Écrire les événements côté Rust, passer `cargo test`, puis laisser `tsc` énumérer : `TONES` échoue en premier, puis `PLAIN_LINES` et `DETAILED_LINES`, puis le `switch` de `actionLine` parce que `RunEventKind` n'a pas été mis à jour. Les trois tables sont dans `src/constants/journal.ts`, les deux fonctions dans `src/helpers/journal.ts` avec `RunEventKind`, et `ActionEventKind` est **dérivé** de son jumeau par `Exclude` : un événement ajouté côté Rust et oublié dans `RunEventKind` fait échouer la compilation de l'autre moitié. Ne pas remettre un seul `switch`, et ne pas non plus le résoudre par une assertion de type, que `no-unsafe-type-assertion` refuse.

**Aucun `parse_mode` demandé à Telegram.** Un corps de jeu qui contient une astérisque ou un souligné casse l'analyse Markdown, et Telegram rejette le message entier plutôt que de l'envoyer en clair. Texte brut, toujours.

**Telegram limite l'envoi vers un même salon**, de l'ordre d'un message par seconde en régime établi, et répond 429 avec un `retry_after`. Une soirée de messages privés nourris peut l'atteindre. Ne pas réessayer en boucle : écrire la ligne au journal et laisser tomber ce message. Un relais qui se met à retenir des messages pour les envoyer plus tard mentirait sur l'heure à laquelle on a été appelé.

**Le trousseau ne suit pas la configuration.** La question « le relais est-il configuré » se répond en interrogeant le trousseau, jamais en lisant un booléen du fichier, qui pourrait dire oui sur un jeton absent. Même famille d'erreur que le `is_enabled()` de `tauri-plugin-autostart`, qui ne vérifie que l'existence d'un fichier.

**Mais la question se pose à l'activation et pas au lancement**, et c'est la mesure de l'ADR 0009 qui l'impose : au lancement, chaque `tauri dev` ouvrirait une boîte de trousseau, y compris pour travailler sur les raccourcis. À l'activation, l'invite tombe quand l'utilisateur est devant sa machine. Un trousseau qui refuse empêche alors le relais de s'activer, plutôt que de laisser partir quelqu'un qui le croit en marche.

**Le relais ne passe pas par `Decision`.** Ce type est taillé pour l'AutoFocus, qui a besoin d'une fenêtre où sauter, et il rend `Ignored(NoWindow)` pour un pseudo qu'il ne voit plus. Le relais n'a besoin d'aucune fenêtre : le message est arrivé, c'est tout ce qui compte, et le cas où le client vient de tomber est justement celui où relayer sert le plus. Deux chemins depuis `on_notification`, et le plus naturel à écrire est celui qui avale ces messages.

**Le jeton ne ressort jamais vers React.** Il n'existe pas de commande qui le rende, et depuis 11a il ne peut pas y en avoir : une lecture rend un `BotToken`, qui n'est pas `Serialize`. L'écran affiche un état, relié ou pas relié, et un bouton pour délier qui efface l'entrée du trousseau.

**Le relais est indépendant de l'AutoFocus.** L'interrupteur maître coupé, le relais continue de relayer : l'un dit ce qui a le droit de ramener une fenêtre devant les yeux, l'autre ce qui a le droit de déranger quelqu'un qui n'est pas là. Ils ne partagent aucun réglage.

**Un personnage en veille est relayé comme les autres.** La veille retire du défilement, elle ne rend pas un personnage muet, l'AutoFocus s'applique déjà aux personnages endormis. C'est `relayed` qui dit qui est relayé, et rien d'autre : lier les deux ferait taire une mule qu'on a seulement sortie du défilement pour jouer plus confortablement. Voir ADR 0011.

#### Ce que ça arbitre contre le principe directeur

Le relais est la première fonctionnalité qui oblige à ouvrir la fenêtre pour être installée, puisqu'il faut y coller un jeton. L'arbitrage est le même que pour le démarrage avec la session : un réglage d'une seule fois, et un usage quotidien qui tient dans un clic de la barre système. Le principe visait les réglages qu'on visite, pas ceux qu'on pose une fois.

#### Vérification

De 11a et 11b-1, ce qui se vérifie sans le robot est fait : `cargo test` passe, `cargo tree` ne montre que les trois crates, un fichier de configuration écrit avant cette étape se relit avec tout le monde relayé, l'assertion se pose et se relâche, et la lecture de l'économiseur rend ce que `defaults -currentHost read com.apple.screensaver idleTime` rend. Ce qui suit demande le robot et la vraie machine.

**L'essai qui clôt 11b-1 est passé.** Robot créé chez BotFather dans Telegram Web, jeton collé, message écrit au robot, Connecter : le message d'essai est arrivé sur le téléphone et l'écran est passé à « Robot connecté ». L'invite de trousseau de l'ADR 0009 se produit bien en `tauri dev`, comme mesuré, et ne bloque rien une fois autorisée.

**Le chemin d'envoi de 11b-2 est passé aussi.** Deux essais, faits seul et sans deuxième joueur. L'activation depuis la barre système, tous les clients fermés, a fait partir sur le téléphone ce qui était alors l'avis collectif de l'ADR 0010, et qui est depuis la seconde ligne de la confirmation d'activation : ça prouve d'un coup la lecture du trousseau, le salon, le client HTTPS, la file et la tâche d'envoi. Puis une bannière postée à `osascript`, au titre d'un client Retro et au corps d'un message privé, est arrivée sur le téléphone sous la forme attendue.

Reste, avec quelqu'un d'autre, un vrai message privé émis par un vrai client.

**Le quart d'heure est passé, et c'était l'essai qui comptait.** Protocole ci-dessous, suivi tel quel.

Reste le bouton d'essai, ajouté depuis : à presser une fois relais à l'arrêt, où il doit ouvrir le trousseau, et une fois relais en marche, où il doit passer sans invite. Les deux fois, un message sur le téléphone et une ligne au journal.

**Le protocole, pour qui le rejouera.** Un seul personnage coché, la machine laissée seule vingt minutes. Il doit arriver un message privé, puis un avis de déconnexion vers la quinzième minute, puis plus rien. `pmset -g assertions` doit montrer la ligne de multifus avant l'avis et ne plus la montrer après. Le retour au clavier avec un raccourci de défilement doit couper le relais.

Le protocole de l'assertion est plus haut, avec les deux commandes qui rendent l'essai détectable ; l'exécuter séparément, sur une machine où l'écran s'éteint en deux minutes.

Enfin, deux personnages, un seul coché, un message privé sur chacun : un seul doit arriver sur le téléphone. Puis l'envoi du corps coché et décoché, pour voir les deux formes du message. Et le journal relu pour vérifier qu'aucune des formes n'y a laissé une trace du texte.

### Étape 12 — Architecture de l'interface

**Objectif.** L'arbre de `src/` ne dit pas ce que les fichiers font. Rien ne change à l'écran, aucune commande Rust n'est touchée, et un lot est réussi quand `npm run lint` et `tsc` passent et que la fenêtre dessine exactement pareil.

**Ce qui manque est une distinction, pas des dossiers.** `constants/` ne porte que des tables, `helpers/` que des fonctions pures qui connaissent le domaine, `lib/` que ce qui parle au monde extérieur. Aujourd'hui `lib/` porte les trois, et deux de ses fichiers font 41 % du code de l'interface : `strings.ts` a 1355 lignes dont 967 ne sont pas des chaînes, `multifus.ts` a 634 lignes dont 400 sont le contrat de la frontière avec Rust.

L'arbre visé :

```
src/
├─ @types/        ce qui traverse le pont, sans un import d'exécution
│  ├─ roster.ts       Character, Gender
│  ├─ journal.ts      JournalEvent, JournalEntry, les issues, RosterChange, SettingChange
│  ├─ notification.ts NotificationKind, AutoFocusSwitch
│  ├─ relay.ts        RelayStatus, PairingProblem, RelayLink, RelayFailure, RelayStop
│  ├─ shortcuts.ts    ShortcutAction, ShortcutBinding, ShortcutStatus
│  ├─ system.ts       Authorization, ConfigStatus, UpdateStatus, ScreenSaver, Launch, Surface, Work
│  └─ snapshot.ts     Snapshot, ScreenName
├─ constants/     des tables, aucune logique
│  ├─ strings/       un fichier par écran, un index qui compose `strings`
│  ├─ journal.ts     TONES, SHORTCUT_TONES, TRAY_TONES, PLAIN_LINES, DETAILED_LINES,
│  │                 RELAY_STOP_LINES, NOTICE_LINES, WORK_LABELS
│  ├─ keyboard.ts    MODIFIERS, KEYS, ALIASES, KEY_LABELS, IS_APPLE
│  ├─ navigation.ts  les cinq articles du rail
│  └─ notification.ts les sept icônes de l'AutoFocus
├─ helpers/       pur, ni React ni Tauri
│  ├─ journal.ts     journalLine, journalTone, journalTranscript, journalTime
│  ├─ wording.ts     chaque union du domaine, et la phrase qu'elle vaut
│  ├─ accelerator.ts capture, heldModifiers, acceleratorParts, keyLabel
│  ├─ cycle.ts       arrange
│  ├─ array.ts       moved
│  └─ format.ts      screenSaverDelay
├─ lib/           ce qui sort de la machine
│  ├─ multifus.ts    les invoke et les listen, rien d'autre
│  └─ utils.ts       cn, et il ne bouge pas
├─ hooks/
├─ components/
│  ├─ layout/        Screen, Panel, PanelHeader, FieldRow, SectionRow, IconTile, Note, EmptyState
│  ├─ ui/            shadcn, jamais touché à la main
│  └─ character-row, journal-panel, nav-rail, lamp, copy-button, config-notice
└─ screens/
   ├─ relay/, shortcuts/, characters/    un index qui orchestre, une pièce par fichier
   └─ about.tsx, auto-focus.tsx, authorization.tsx
```

**Quatre lots, une session chacun, chacune finit par un commit sur `main`.** Le découpage suit les dépendances et pas la taille : un lot dont la moitié dépend d'un autre lot écrit du code que la session suivante défait.

#### Lot A — Les deux gros fichiers, fait

Les types d'abord, les chaînes ensuite. `@types/` sort de `multifus.ts`, et `tsc` énumère alors chaque import à corriger. Puis `constants/strings/`, puis `constants/journal.ts`, puis `helpers/journal.ts` qui reçoit `journalLine`, `journalTone`, `journalTranscript` et `journalTime`.

**Ce qui est posé.** Sept fichiers dans `@types/`, `multifus.ts` réduit à ses trente `invoke` et à ses deux `listen`, neuf fragments de chaînes plus leur index, les huit tables du journal dans `constants/journal.ts` et tout ce qui met un événement en mots dans `helpers/journal.ts`. `npm run lint` et `tsc` passent, et aucune chaîne française n'a bougé d'un caractère, ce qui a été vérifié en comparant les littéraux avant et après.

**Un septième fichier de types, que le tableau ci-dessus n'avait pas.** `NotificationKind` et `AutoFocusSwitch` sont le vocabulaire des notifications et non celui du journal ni celui du système : ils ont leur fichier, jumeau du `constants/notification.ts` que le lot B posera. Les issues restent ensemble dans `journal.ts`, puisqu'elles n'existent que comme charge d'un événement.

**`lib/strings.ts` n'existe plus.** Ses trois dernières fonctions sont à leur adresse : `keyLabel` dans `helpers/accelerator.ts`, `screenSaverDelay` dans `helpers/format.ts`, `updateLine` dans `helpers/wording.ts`. Les y laisser aurait gardé dans `lib/` un fichier qui ne portait plus une seule chaîne, donc un nom qui ment et trois domaines dans un seul fichier. Le lot C les a rejointes. Il restait alors un seul import qui traversait les couches, `IS_APPLE` depuis `lib/accelerator.ts`, que `constants/strings/` et `helpers/accelerator.ts` lisaient en attendant `constants/keyboard.ts` : le lot C l'a fermé.

**Les deux ne se séparent pas.** `helpers/journal.ts` lit les types du pont : sans `@types/`, il importe `@tauri-apps/api`, et `helpers/` cesse d'être testable sans Tauri avant même d'exister.

**Les trente `invoke` restent.** Chacun tient sur une ligne, mais ils sont le seul endroit où le vocabulaire des commandes Rust est écrit, et il y est typé. Les supprimer disperserait trente noms de commande en chaînes de caractères dans les écrans.

Trois documents ont été mis à jour dans le même commit : `perimetre.md` § Conventions, qui disait « les chaînes centralisées dans un seul fichier » et dit maintenant « un seul endroit » ; le paragraphe de l'étape 11b-2, qui nommait l'ancien fichier de chaînes dans la chaîne d'échec de compilation et nomme maintenant `constants/journal.ts` et `helpers/journal.ts` ; et `.claude/rules/code-style.md` § Single Source of Truth et § Where things live. Un quatrième a suivi, l'[ADR 0006](./adr/0006-journal-sur-disque.md), qui citait ce même fichier : seul le chemin change, l'argument ne bouge pas.

#### Lot B — Les écrans et la mise en page, fait

**Ce qui est posé.** `components/screen.tsx` portait huit composants de mise en page sous un nom au singulier : c'est `components/layout/`, un fichier par composant. Pas d'index qui réexporte, la règle du projet refusant une réexportation qui ne transforme rien, donc chaque écran nomme ce qu'il prend.

`constants/navigation.ts` porte les cinq articles du rail, `constants/notification.ts` les sept icônes de l'AutoFocus. Les deux vivaient en tête du composant qui les lisait, avec l'`as const satisfies` que le plan attend déjà d'une table dont la clé est une union du domaine.

`relay-screen.tsx`, 410 lignes, est un dossier de huit fichiers dont l'`index.tsx` fait 81 lignes ; `shortcuts-screen.tsx`, 255 lignes, un dossier de trois dont l'`index.tsx` fait 63. Le plus gros fichier de l'interface est désormais `shortcut-field.tsx` à 171 lignes, et plus rien ne dépasse la limite de 200 lignes de `.claude/rules/frontend.md`.

**Aucune ligne de JSX n'a changé.** La comparaison des littéraux avant et après ne montre que des chemins d'import : pas une chaîne française n'a bougé. `problemLine`, `fieldHint` et `statusHint` sont restés avec le composant qui les lit, comme le lot C le demande.

`.claude/rules/code-style.md` § Where things live a été corrigé dans le même commit : il annonçait un fichier par écran, ce qui n'est plus vrai pour deux d'entre eux, et ne connaissait pas `components/layout/`. `frontend.md` n'avait rien à corriger, il ne nomme aucun chemin.

#### Lot C — Les fonctions pures, fait

**Ce qui est posé.** `constants/keyboard.ts` porte les quatre tables du clavier et `IS_APPLE`, `helpers/accelerator.ts` les quatre fonctions qui les lisent. Les six mises en mots sont dans `helpers/wording.ts` sous le suffixe `Line` : `updateLine`, `pairingProblemLine`, `shortcutStatusLine`, `authorizationLine`, `characterStateLine` et la table `CONFIG_PROBLEM_LINES`. `arrange` est dans `helpers/cycle.ts`, `moved` dans `helpers/array.ts`, et `use-cycle-order.ts` ne garde que son état.

**`lib/accelerator.ts` n'existe plus, et c'est la question que ce lot posait.** Les tables parties, il restait la capture, les modificateurs tenus et le découpage d'une combinaison : rien qui parle au monde extérieur, donc rien qui justifie `lib/`. Ils rejoignent `helpers/accelerator.ts`, qui portait déjà `keyLabel`. `lib/` est réduit à `multifus.ts` et à `utils.ts`, ce que l'arbre visé demandait, et le piège de `cn` est tenu sans avoir eu à s'en occuper.

**`CaptureRejection` suit les tables et non les fonctions.** C'est la clé de `REJECTION_LINES`, dans `constants/strings/shortcuts.ts` : laissé dans `helpers/`, il aurait fait lire un module de `helpers/` à un fichier de `constants/`, c'est-à-dire rouvrir dans l'autre sens l'import que ce lot ferme. Il est dans `constants/keyboard.ts` avec `Modifier`, comme `JournalTone` vit dans `constants/journal.ts`.

**`WORDING` reste une table et ne devient pas une fonction.** C'est elle qui fait échouer la compilation sur un cinquième `ConfigProblem`, et une fonction qui ne ferait que l'indexer serait l'enveloppe sans transformation que `.claude/rules/code-style.md` refuse. Elle s'appelle `CONFIG_PROBLEM_LINES`, comme les tables de phrases de `constants/journal.ts`.

**`FieldHint` suit `statusHint` et s'appelle maintenant `TonedLine`.** `fieldHint` ne bouge pas, elle lit un état de capture React et n'est pas une union du domaine mise en mots ; mais le type est le contrat des deux, et un écran a le droit de lire un helper quand l'inverse est interdit. Le nom a suivi l'adresse : un type nommé d'après un champ de formulaire n'a rien à faire dans un module pur.

**`moved` prend `item` et non `nickname`.** Dans `helpers/array.ts`, un paramètre nommé d'après le domaine est exactement le mensonge que ce lot corrige. `nicknamesOf` reste dans le crochet, une ligne de `.map` que personne d'autre n'appelle.

**Vérifié.** `npm run lint`, `npm run format:check`, `tsc` et `vite build` passent. Les littéraux ont été comparés avant et après, hors chemins d'import ils sont identiques au nombre d'occurrences près, et chaque corps déplacé a été comparé à son original : les seules différences sont les renommages ci-dessus.

#### Lot D — Les tests, fait

**Ce qui est posé.** `vitest` 4.1, six fichiers de test posés chacun à côté de son module, **175 cas**, dont 113 pour `helpers/journal.ts`. Rien n'est monté et rien n'est simulé, ce que les trois lots précédents ont rendu possible : aucun de ces modules ne lit React ni Tauri. Six fichiers et non quatre, parce que `array.ts` et `format.ts` sont des modules et que la règle est un fichier de test par module ; ils restent les deux plus courts.

**L'environnement de vitest est `node`, et c'est lui qui décide de `IS_APPLE`.** `constants/keyboard.ts` lit `navigator.userAgent` au chargement, et Node rend `Node.js/24`, donc `IS_APPLE` est faux ici comme sur le runner. Les libellés attendus sont donc ceux du clavier non Apple, `Ctrl`, `Maj` et `Win`, et quatre cas en dépendent, tous dans `accelerator.test.ts`. Le premier d'entre eux affirme `IS_APPLE === false` : changer l'environnement pour un navigateur simulé fait échouer ce cas-là d'abord, avec son nom, plutôt que trois libellés au hasard. Aucun module n'est moqué, ce que le lot promettait.

**Le fuseau est épinglé à UTC dans `vite.config.ts`**, par `test.env.TZ`, et pas dans un test. `journalTime` et `journalMoment` passent par `toLocaleTimeString` et `toLocaleString` en `fr-FR` : sans ça la suite passait ici et tombait sur `macos-latest`, qui est en UTC. Trois cas en dépendent, les deux de `journalTime` et la transcription complète.

**Les quarante variantes se dérivent, leurs charges non.** Le fichier de test porte `Record<JournalEvent['kind'], readonly Case<Kind>[]>` : la liste des quarante n'est écrite nulle part, c'est le type qui l'exige, et un événement ajouté côté Rust fait échouer `tsc` ici comme dans `constants/journal.ts`. Ce n'est pas un jumeau du filet de `RunEventKind`, c'est le même mécanisme appliqué au même endroit. Six unions de charge ont leur propre table exhaustive, les changements de roster, les changements de réglage et les issues d'une notification, d'un raccourci, d'un clic de barre système et d'un échec de relais. Ce qui ne se dérive pas est écrit à la main : un événement d'exemple par variante, puisque TypeScript n'invente pas un pseudo, et la phrase attendue.

**Les branches `default` ne sont pas couvertes, et c'est décidé.** Les atteindre demande de fabriquer un `kind` dont le type dit qu'il ne peut pas exister, donc une assertion que `no-unsafe-type-assertion` refuse, ou un détour par `JSON.parse` qui contourne la règle en faisant semblant de l'observer. Elles ne promettent d'ailleurs rien qu'un test puisse vérifier : leur travail est de ne pas planter devant un binaire Rust plus récent que la fenêtre, ce qu'aucun cas ne reproduit fidèlement. Ce qui les garde est le filet de compilation, et il est testé, lui.

**D'où vient la phrase attendue.** Quand le helper écrit la phrase, le cas la recopie en toutes lettres. Quand il ne fait que la choisir dans `constants/strings` ou dans une table de `constants/journal.ts`, le cas nomme l'entrée : ce qui est en jeu est la branche, et une phrase recopiée là ne ferait que dupliquer la table qu'elle lit. Un événement à détail est entre les deux, le cas nomme la table et écrit la composition, `phrase : raison`.

**Le préréglage `vitest` de `@viclafouch/oxc-config` est branché en `overrides` et non en `extends`.** Posé globalement, sa règle `require-hook` traite le montage de `main.tsx` comme du code d'installation laissé hors d'un crochet. Un `overrides` sur `src/**/*.test.ts` le limite aux fichiers de test, et aucune règle n'est éteinte. Ce préréglage impose `it` dans un `describe`, `toStrictEqual` plutôt que `toEqual`, et un titre qui commence en minuscule. Un `overrides` remplace les greffons dont il hérite au lieu de s'y ajouter, d'où `TEST_PLUGINS`, qui les renomme tous. `vitest/consistent-test-filename` est en plus, réglé sur `*.test.ts`.

**Et `checks.yml` porte la commande**, entre `format:check` et `build`. `lint`, `format:check` et `tsc` couvraient déjà les fichiers de test sans rien avoir à changer : `oxlint` lit tout ce qui n'est pas ignoré, et `tsconfig.json` inclut `src`.

**Une faute d'accord trouvée et laissée en place.** `Tous les femmes connectés sont réveillés`, que `rosterLine` écrit sur un `genderAsleep` féminin. Le cas la fige telle quelle : ce lot ne change rien à l'écran, et le journal est un écran.

#### Pièges connus d'avance

**`cn` ne bouge pas de `src/lib/utils.ts`.** Le CLI shadcn écrit cet import en dur dans chaque composant qu'il génère, donc le déplacer casse la prochaine génération et non la compilation d'aujourd'hui.

**La chaîne d'échec de compilation doit survivre au découpage.** Les tables partent dans `constants/journal.ts`, mais `RunEventKind` et son jumeau `ActionEventKind`, dérivé par `Exclude`, restent avec les deux fonctions qui les lisent. C'est le filet décrit à l'étape 11b-2 : un événement ajouté côté Rust et oublié fait échouer `tsc`. Un découpage qui le perd coûte plus qu'il ne rapporte.

**Chaque fichier de `constants/strings/` porte son propre `as const`.** L'objet `strings` est aujourd'hui un seul littéral fermé par `as const`, et un fragment sans lui rend `string` là où les appelants attendent un littéral. L'index compose les fragments, donc aucun appelant ne change.

**Et une table dont la clé est une union du domaine porte en plus son `satisfies`.** Les sept types de notification, les cinq écrans, les quatre actions, les deux sexes, les motifs d'échec d'appariement et les états d'un raccourci sortent donc du fragment et deviennent des constantes nommées, comme `TONES` le fait déjà. Sans ça, un type ajouté côté Rust échoue à la compilation dans l'écran qui indexe la table, avec un message qui parle d'index et non de traduction manquante. `typescript.md` l'exige, et un fragment qui n'est qu'un sac de phrases n'a rien à valider : lui inventer un type ne ferait que recopier ce que TypeScript sait déjà.

**Les commentaires se coupent avec le déplacement, jamais en passe dédiée.** 906 lignes de commentaire sur 4803, et `use-tray-navigation.ts` est à 41 %. Beaucoup rejouent un ADR ou une section de ce plan, ce que `.claude/rules/code-style.md` interdit, et cette même règle interdit d'en faire un chantier à part. Un fichier que le lot déplace se ramène à une ou deux lignes qui portent le pourquoi et renvoient ici. Un fichier que le lot ne touche pas reste tel quel.

**Ne pas refusionner `runLine` et `actionLine`.** Le seuil `complexity: 20` est atteint, le raisonnement est à l'étape 11b-2.

---

---

## Ce qui mord, côté macOS

**L'autorisation d'Accessibilité se donne à une identité de code, pas à un projet.** Le `target/debug/multifus` de `tauri dev` et l'application empaquetée sont deux choses distinctes, et en développement c'est le terminal qui porte l'autorisation, jamais multifus. Sur le paquet, une signature ad hoc change à chaque compilation et l'entrée reste cochée à l'écran sans plus s'appliquer. C'est ce que l'étape 10 répare, et le raisonnement complet est dans [ADR 0005](./adr/0005-signature-developer-id-plutot-qu-ad-hoc.md). Quand l'autorisation disparaît sans raison apparente, `tccutil reset Accessibility com.viclafouch.multifus` puis réaccorder. Le diagnostic ne se devine pas, il se lit : `sqlite3 "/Library/Application Support/com.apple.TCC/TCC.db" "select client, auth_value, datetime(last_modified,'unixepoch') from access where client like '%multifus%'"`. Une entrée autorisée mais datée d'avant le binaire installé, et c'est elle, l'autorisation appartient à une version qui n'existe plus.

**Une notarisation à moitié configurée ne fait pas échouer la compilation.** Lu dans `tauri-bundler`, `crates/tauri-bundler/src/bundle/macos/app.rs` : seul un identifiant d'équipe manquant est une erreur franche, tout le reste ne produit qu'un avertissement et la compilation continue. Un secret mal recopié sort donc un paquet signé mais non notarisé, qui s'installe très bien sur la machine qui l'a construit et se fait refuser partout ailleurs. Le seul contrôle qui vaille est de télécharger le DMG depuis une autre machine, ou au moins depuis un autre compte, pour que la quarantaine s'applique vraiment.

**Une release en brouillon n'annonce rien, et c'est une réponse et non une panne.** L'updater interroge `releases/latest/download/latest.json`, et GitHub ne considère pas un brouillon comme la dernière release : le fichier répond donc 404 tant que rien n'est publié. Or le plugin ne distingue pas ce cas dans son type de retour, il rend `Error::ReleaseNotFound`. Laissé tel quel, ça affichait « la mise à jour n'a pas abouti » à chaque démarrage, en anglais dans une interface française, avec une ligne d'avertissement au journal à chaque fois. `app::update` traite donc cette variante-là comme « à jour », et elle seule : un réseau qui tombe rend `Reqwest` ou `Network` et reste un échec. Lu dans `plugins/updater/src/updater.rs`, où une réponse non 2xx ne renseigne pas `last_error` et sort par `ok_or(Error::ReleaseNotFound)`.

**macOS relance lui-même les applications ouvertes au moment de la déconnexion, et ça fausse l'essai du démarrage avec la session.** La case « Rouvrir les fenêtres lors de la prochaine connexion » relance multifus par `loginwindow` et non par l'agent, donc sans `--from-session` et avec sa fenêtre. Quitter multifus avant de se déconnecter, ou décocher. Le diagnostic tient en une commande : `ps -o args= -p $(pgrep -f /Applications/multifus.app)`. L'argument est là, c'est l'agent ; il n'y est pas, c'est la reprise de macOS.

**Le paquet installé et le paquet compilé sont deux choses**, et l'agent porte le chemin du premier. Un `tauri build` ne change rien à ce qui démarre avec la session tant que `/Applications` n'a pas été remplacé, et l'argument n'entre dans le plist qu'au premier lancement à la main de la version qui sait l'écrire. Comparer les dates avant de chercher plus loin.

**Un `tauri build` local se termine sur une erreur, et le paquet est pourtant là.** `createUpdaterArtifacts` demande de signer l'archive, et sans `TAURI_SIGNING_PRIVATE_KEY` le bundler écrit les deux paquets, puis échoue sur cette seule signature. L'application et le DMG sont donc utilisables. Pour finir sans erreur : `TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/multifus.key)" npm run tauri build`. Fait une fois, ce qui a prouvé au passage que la moitié privée du disque va bien avec la `pubkey` publiée.

**Sur macOS, une combinaison déjà prise s'enregistre sans erreur et ne se déclenche jamais.** Carbon ne refuse qu'un doublon du même processus, donc ni le bureau ni une autre application ne provoquent d'échec à la pose, et aucune API ne permet de le savoir à l'avance. Ne pas chercher à faire dire au plugin ce qu'il ne sait pas : la seule preuve est un appui depuis le jeu et la ligne que le journal écrit. Windows, lui, refuse franchement.

**`Control+flèche` appartient à macOS**, Mission Control et le passage entre bureaux. Les combinaisons proposées au premier lancement sont donc `Control+Shift+flèche`. Et `Pause`, `ScrollLock` et `F21` à `F24` passent le parseur du plugin mais n'ont pas de code de touche sur macOS : elles échouent à la pose, ce que l'écran affiche.

**L'AutoFocus macOS dépend de l'affichage des bannières, et la livraison sans affichage a été essayée.** Décocher « Bureau » en gardant « Centre de notifications » ne donne rien du tout : macOS ne construit aucun élément tant que le panneau reste fermé, donc l'observateur n'a rien à lire. Mesuré sur un combat, un défi et un échange, journal vide et aucune fenêtre ramenée. Ne pas rouvrir cette piste, elle est dans ADR 0002. Le réglage le moins gênant qui marche est bannière sur le Bureau, style temporaire, son coupé, aperçus par défaut. Sur Windows c'est l'inverse, l'écoute passe par une API et les bannières peuvent rester coupées.

**Une mesure douteuse sur l'observateur de bannières, gardée ici et pas agie.** En postant des notifications avec `osascript`, `AXCreated` ne s'est déclenché que pour la première d'une série : tant qu'une bannière du même émetteur restait à l'écran, macOS **réemployait son élément** et seul `AXLayoutChanged` tirait, deux à trois fois, à moins de 11 ms d'écart. Le seuil observé était entre 4,1 et 5,1 secondes, ce qui est la durée de vie d'une bannière temporaire. Pris au pied de la lettre, ça voudrait dire que deux messages privés à trois secondes d'écart n'en produisent qu'un seul focus.

**Ne pas agir dessus en l'état.** `display notification` ne pose aucun identifiant de notification, donc macOS a très bien pu traiter ces envois comme des mises à jour d'une même notification et non comme des notifications distinctes. Un client Dofus en pose sûrement un différent à chaque fois, et l'usage réel n'a jamais montré d'AutoFocus manquant. L'essai qui tranche ne demande aucun outil : deux vrais clients, deux messages privés à trois secondes d'écart, puis le journal. Deux lignes `Message privé`, la mesure était un artefact. Une seule, il faut écouter `AXLayoutChanged` en plus d'`AXCreated` et dédoublonner sur une fenêtre courte, en comparant à la notification précédente et jamais à un ensemble, sans quoi le même message reçu deux fois dans la soirée n'en ferait qu'un.
